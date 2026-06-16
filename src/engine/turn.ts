import type { CampaignAction, CandidateId, GameState, TurnRecapItem } from "./types";
import { createRng } from "./rng";
import { applyAction } from "./actions";
import { planAiActions, type AiConfig, DIFFICULTY } from "./ai";
import { queueEventsForTurn, resolveAiEvents, aiChooseEvent, resolveEvent } from "./events";
import { projectElection, computeResult } from "./voteModel";
import { OPPONENT_OF, CANDIDATES } from "@content/candidates";

// Decays the transient, turn-scoped quantities. Ground game is sticky (no
// decay) — that's what makes early field investment pay off.
function decay(game: GameState) {
  for (const st of game.states) {
    st.momentum *= 0.7;
    if (Math.abs(st.momentum) < 0.3) st.momentum = 0;
    for (const bloc of st.blocs) {
      // Enthusiasm relaxes toward 1.0.
      bloc.enthusiasm = 1 + (bloc.enthusiasm - 1) * 0.6;
    }
  }
  for (const c of ["dem", "rep"] as CandidateId[]) {
    const res = game.resources[c];
    res.nationalMomentum *= 0.75;
    res.mediaNarrative *= 0.8;
    // Debate-prep buff relaxes back toward the candidate's base debating skill.
    const base = CANDIDATES[c].traits.debatingSkill;
    game.candidates[c].traits.debatingSkill = base + (game.candidates[c].traits.debatingSkill - base) * 0.4;
    // Refill candidate-days for the new week.
    res.actions = res.maxActions;
  }
}

function buildRecap(game: GameState, turn: number, evBefore: number): TurnRecapItem[] {
  const recap: TurnRecapItem[] = [];
  // Group this turn's causes by their human-readable label.
  const byCause = new Map<string, { delta: number; states: Set<string> }>();
  for (const c of game.causes) {
    if (c.turn !== turn) continue;
    const entry = byCause.get(c.cause) ?? { delta: 0, states: new Set() };
    entry.delta += c.marginDelta;
    if (c.stateId) entry.states.add(c.stateId);
    byCause.set(c.cause, entry);
  }
  for (const [cause, info] of byCause) {
    recap.push({
      label: cause,
      detail: info.states.size > 0 ? `${info.states.size} contest(s)` : "nationwide",
      marginDelta: info.delta,
    });
  }
  recap.sort((a, b) => Math.abs(b.marginDelta ?? 0) - Math.abs(a.marginDelta ?? 0));

  const evAfter = projectElection(game).ev.dem;
  recap.unshift({
    label: "Projected electoral votes",
    detail: `${game.candidates.dem.shortName} ${evAfter} (was ${evBefore})`,
    marginDelta: evAfter - evBefore,
  });
  return recap.slice(0, 12);
}

export interface AdvanceOptions {
  difficulty?: AiConfig;
  // If true, any player events left unanswered get a sensible default pick.
  autoResolvePlayerEvents?: boolean;
}

// THE pure turn function. advanceTurn(state, actions, seed) → newState.
// Same inputs always produce the same output (undo, replay, tests rely on it).
export function advanceTurn(
  state: GameState,
  actions: CampaignAction[],
  seed: number | string,
  opts: AdvanceOptions = {},
): GameState {
  const game: GameState = structuredClone(state);
  if (game.phase === "result") return game;

  const turn = game.turn;
  const rng = createRng(`${seed}:${game.seed}:${turn}:${game.rngState}`);
  const player = game.playerCandidate;
  const ai = OPPONENT_OF[player];
  const cfg = opts.difficulty ?? DIFFICULTY.normal;

  const evBefore = projectElection(game).ev.dem;

  // 1. Resolve any leftover player events with a sensible default.
  if (opts.autoResolvePlayerEvents !== false) {
    const leftover = game.pendingEvents.filter((p) => p.forCandidate === player);
    for (const p of leftover) {
      const choice = aiChooseEvent(game, requireEvent(p.eventId), player);
      resolveEvent(game, p.eventId, choice.id, player);
    }
  }

  // 2. AI resolves its own events.
  resolveAiEvents(game, ai);

  // 3. Apply the player's queued actions in day order (Day 1 → Day 7), so the
  //    week plays out as scheduled, then the AI's plan.
  const playerActions = actions
    .filter((a) => a.candidate === player)
    .sort((a, b) => (a.day ?? 1) - (b.day ?? 1));
  for (const action of playerActions) applyAction(game, action, rng);
  const aiActions = planAiActions(game, rng, cfg);
  for (const action of aiActions) applyAction(game, action, rng);

  // 4. Decay transient quantities and refill resources.
  decay(game);

  // 5. Recap + bookkeeping.
  game.lastRecap = buildRecap(game, turn, evBefore);
  game.queuedActions = [];
  game.pendingEvents = [];
  game.rngState = rng.state();
  game.turn = turn + 1;

  // 6. End of campaign? Otherwise queue the next week's events.
  if (game.turn >= game.totalTurns) {
    game.result = computeResult(game);
    game.phase = "result";
  } else {
    queueEventsForTurn(game, rng);
    game.phase = "intel";
  }
  return game;
}

import { EVENTS_BY_ID } from "@content/events";
function requireEvent(id: string) {
  const e = EVENTS_BY_ID[id];
  if (!e) throw new Error(`Unknown event ${id}`);
  return e;
}

// Opens a freshly created game. The first week is deliberately event-free: the
// player lands on the dashboard to read the map and set a plan without a
// decision modal blocking the screen. Campaign events begin after the first
// "End Week" (advanceTurn queues turn 1's slate onward).
export function beginGame(game: GameState): GameState {
  const next: GameState = structuredClone(game);
  next.pendingEvents = [];
  next.phase = "intel";
  return next;
}
