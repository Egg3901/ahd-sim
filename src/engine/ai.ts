import type { CampaignAction, CandidateId, GameState, IssueId } from "./types";
import type { Rng } from "./rng";
import { projectElection } from "./voteModel";
import { issueAlignment } from "./actions";
import { OPPONENT_OF } from "@content/candidates";
import { HISTORICAL_EVENTS, GENERIC_DEBATES } from "@content/events";
import { BLOCS } from "@content/blocs";
import { ISSUE_IDS } from "@content/issues";

// Is a scheduled debate coming within the next `turns` weeks? Lets the AI prep
// ahead of showtime instead of being caught flat-footed on the big stage.
function debateWithin(game: GameState, turns: number): boolean {
  const historical = (game.eventMode ?? "historical") === "historical";
  const deck = historical
    ? HISTORICAL_EVENTS[game.scenarioId ?? "2020"] ?? HISTORICAL_EVENTS["2020"]
    : GENERIC_DEBATES;
  return deck.some(
    (e) => e.isDebate && e.trigger.kind === "scheduled" && e.trigger.turn > game.turn && e.trigger.turn <= game.turn + turns,
  );
}

// The issue whose higher salience would most help the AI: its own coalition's
// alignment advantage, weighted by how much room that issue has left to climb.
function bestIssueForAi(game: GameState, ai: CandidateId): IssueId | null {
  let best: IssueId | null = null;
  let bestScore = 0.05;
  for (const issueId of ISSUE_IDS) {
    const headroom = 1 - (game.salience[issueId] ?? 0.5);
    if (headroom < 0.12) continue;
    let adv = 0;
    for (const blocId of Object.keys(BLOCS)) adv += issueAlignment(game, ai, blocId, issueId) - 0.5;
    const score = adv * headroom;
    if (score > bestScore) {
      bestScore = score;
      best = issueId;
    }
  }
  return best;
}

export interface AiConfig {
  // 0..1 budget-efficiency multiplier; higher = spends more, smarter.
  efficiency: number;
  // 0..1 chance of a misallocation per planning pass.
  mistakeRate: number;
  // How many target states the AI considers (foresight depth).
  foresight: number;
}

export const DIFFICULTY: Record<"easy" | "normal" | "hard", AiConfig> = {
  easy: { efficiency: 0.55, mistakeRate: 0.3, foresight: 3 },
  normal: { efficiency: 0.8, mistakeRate: 0.15, foresight: 5 },
  hard: { efficiency: 1.0, mistakeRate: 0.05, foresight: 8 },
};

function aiShareOf(demShare: number, ai: CandidateId): number {
  return ai === "dem" ? demShare : 1 - demShare;
}

// Ranks contests by tipping-point value to the AI: close races worth more EV in
// cheaper media markets float to the top (Section 8).
interface Target {
  stateId: string;
  ev: number;
  aiShare: number;
  mediaCost: number;
  priority: number;
}

function rankTargets(game: GameState, ai: CandidateId, cfg: AiConfig): Target[] {
  const proj = projectElection(game);
  // Margin on *awarded* EV (tossups excluded from both sides, so it's a fair
  // read of who's ahead — unlike a raw EV threshold, which is deflated early
  // when most states are still inside the tossup band).
  const evMargin = proj.ev[ai] - proj.ev[OPPONENT_OF[ai]];
  // The competitive band flexes with the scoreboard: a trailing campaign reaches
  // further down the map for states it's losing (it has to gamble), while a
  // comfortable front-runner tightens up and defends only its real tossups.
  const band = evMargin < -30 ? 0.075 : evMargin > 40 ? 0.035 : 0.05;
  const targets: Target[] = [];
  for (const sr of proj.contests) {
    const st = game.states.find((s) => s.id === sr.stateId);
    if (!st || st.blocs.length === 0) continue;
    const aiShare = aiShareOf(sr.demShare, ai);
    const closeness = 1 - Math.abs(aiShare - 0.5) * 2; // 1 = a coin flip
    // Only contest states within reach. A campaign doesn't dump its budget into
    // a state it trails by 11+ (NY) or 17 (CA) — that over-investment is what
    // was flipping safe states — but a loser widens the net to find a path.
    if (Math.abs(sr.demShare - 0.5) > band) continue;
    // Tipping-point value: EV per dollar of media, weighted by how flippable.
    const priority = (st.electoralVotes * closeness) / st.mediaMarketCost;
    targets.push({
      stateId: st.id,
      ev: st.electoralVotes,
      aiShare,
      mediaCost: st.mediaMarketCost,
      priority,
    });
  }
  targets.sort((a, b) => b.priority - a.priority);
  return targets.slice(0, cfg.foresight);
}

// Builds the AI's action list for this turn. Pure given (game, rng, cfg).
export function planAiActions(game: GameState, rng: Rng, cfg: AiConfig): CampaignAction[] {
  const ai = OPPONENT_OF[game.playerCandidate];
  const res = game.resources[ai];
  const actions: CampaignAction[] = [];
  let targets = rankTargets(game, ai, cfg);
  if (targets.length === 0) return actions;

  // Occasional misallocation: shuffle the priority order (a "mistake").
  if (rng.chance(cfg.mistakeRate)) {
    const i = rng.int(0, targets.length - 1);
    const j = rng.int(0, targets.length - 1);
    [targets[i], targets[j]] = [targets[j], targets[i]];
  }

  // Every action costs one slot from the weekly pool — the AI plays within the
  // same budget the player does (energy-derived). Build a prioritized plan and
  // take as many as the pool allows.
  let budget = res.actions;
  const turnsLeft = game.totalTurns - game.turn;
  // Pace ad spend across the weeks that remain instead of front-loading 45% of
  // the war chest in week one (which left the AI broke and toothless by October).
  // Spend ~ cash / weeks-left, scaled by how disciplined this difficulty is.
  const adBudget = (res.cash / Math.max(2, turnsLeft)) * (0.8 + cfg.efficiency);
  const prioritySum = targets.reduce((s, t) => s + t.priority, 0) || 1;
  const proj = projectElection(game);
  // Behind by a clear EV margin on awarded states → time to gamble.
  const losing = proj.ev[ai] < proj.ev[OPPONENT_OF[ai]] - 20;

  // Keep the war chest topped up: fundraise against a reserve floor that's
  // deeper early (more weeks to spend) so ad pressure stays roughly constant
  // through Election Day rather than decaying.
  const cashFloor = 30_000_000 * Math.min(4, Math.max(1, turnsLeft));
  if (res.cash < cashFloor && budget > 1) {
    const richest = [...targets].sort((a, b) => b.ev - a.ev)[0];
    actions.push({ type: "fundraise", candidate: ai, stateId: richest.stateId });
    budget -= 1;
  }
  // A trailing campaign rolls the dice on opposition research — a national hit
  // that can reshape the race (gated by difficulty so easy AIs rarely find it).
  if (losing && res.cash > 2_000_000 && budget > 2 && rng.chance(0.2 + cfg.efficiency * 0.25)) {
    actions.push({ type: "oppo_research", candidate: ai });
    budget -= 1;
  }
  if (turnsLeft > 3 && res.staffCapacity > 0 && budget > 0) {
    actions.push({ type: "ground_game", candidate: ai, stateId: targets[0].stateId });
    budget -= 1;
  }
  // Prep for a debate that's within two weeks: top up the weaker of the two
  // tracks (stagecraft vs substance), unless already sharp. Disciplined AIs
  // prep more reliably.
  if (debateWithin(game, 2) && budget > 1) {
    const t = game.candidates[ai].traits;
    if (Math.min(t.debatePrep, t.policyKnowledge) < 86 && rng.chance(0.5 + cfg.efficiency * 0.45)) {
      actions.push({ type: t.debatePrep <= t.policyKnowledge ? "debate_prep" : "policy_prep", candidate: ai });
      budget -= 1;
    }
  }
  // With slots to spare, drive the conversation onto the AI's best issue.
  if (budget > 1 && res.cash > 6_000_000 && rng.chance(0.25 + cfg.efficiency * 0.25)) {
    const issueId = bestIssueForAi(game, ai);
    if (issueId) {
      actions.push({ type: "advertise", candidate: ai, stateId: targets[0].stateId, adMode: "issue", issueId, spend: 6_000_000 });
      budget -= 1;
    }
  }

  // Interleave an ad and a rally per target, in priority order, until the pool
  // runs out — so the budget spreads across the map instead of all into one ad.
  const queue: CampaignAction[] = [];
  for (const t of targets) {
    // Rally first so the principal's stop (and the map marker) is reliably set.
    queue.push({ type: "rally", candidate: ai, stateId: t.stateId });
    const spend = (adBudget * t.priority) / prioritySum;
    if (spend >= 200_000) {
      const mode = t.aiShare < 0.49 ? "contrast" : "positive";
      queue.push({ type: "advertise", candidate: ai, stateId: t.stateId, adMode: mode, spend });
    }
  }
  if (turnsLeft <= 2) {
    for (const t of targets.slice(0, 3)) {
      const st = game.states.find((s) => s.id === t.stateId);
      if (st && st.groundGame[ai] > 0.05) {
        queue.push({ type: "gotv", candidate: ai, stateId: t.stateId });
      }
    }
  }
  for (const a of queue) {
    if (budget <= 0) break;
    actions.push(a);
    budget -= 1;
  }

  return actions;
}
