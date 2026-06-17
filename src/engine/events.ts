import type {
  CandidateId,
  DebateResult,
  EventChoice,
  EventEffect,
  GameEvent,
  GameState,
  PendingEvent,
} from "./types";
import { createRng, type Rng } from "./rng";
import { GENERIC_EVENTS, GENERIC_DEBATES, HISTORICAL_EVENTS, EVENTS_BY_ID } from "@content/events";
import { OPPONENT_OF } from "@content/candidates";
import { clamp } from "./actions";

function favorSign(candidate: CandidateId): number {
  return candidate === "dem" ? 1 : -1;
}

// Debate readiness, 0..100: innate debating talent plus the two prep tracks
// (debate prep = stagecraft, policy command = substance). 50 is "average" and
// leaves a debate playing exactly as authored.
export function debateReadiness(game: GameState, candidate: CandidateId): number {
  const t = game.candidates[candidate].traits;
  return 0.4 * t.debatingSkill + 0.3 * t.debatePrep + 0.3 * t.policyKnowledge;
}

// Turns readiness into multipliers: a well-prepared debater amplifies the
// upside of their chosen tack and blunts its downside; an unprepared one does
// the reverse. Centered so readiness 50 ⇒ (1, 1) (no change vs the authored
// effect, which keeps calibration untouched).
function debateMultipliers(readiness: number): { gain: number; cost: number } {
  const edge = clamp((readiness - 50) / 50, -1, 1); // -1..+1
  return { gain: clamp(1 + edge * 0.4, 0.6, 1.4), cost: clamp(1 - edge * 0.4, 0.6, 1.4) };
}

// Scales a debate choice's effect by performance: favorable components by
// `gain`, costs (negative components) by `cost`. Non-performance bits (cash,
// salience — the topic, not the win) pass through unchanged.
function scaleDebateEffect(effect: EventEffect, gain: number, cost: number): EventEffect {
  const m = (v: number) => (v >= 0 ? v * gain : v * cost);
  return {
    ...effect,
    blocDeltas: effect.blocDeltas?.map((bd) => ({
      ...bd,
      ...(bd.margin !== undefined ? { margin: m(bd.margin) } : {}),
      ...(bd.enthusiasm !== undefined ? { enthusiasm: m(bd.enthusiasm) } : {}),
    })),
    ...(effect.momentum !== undefined ? { momentum: m(effect.momentum) } : {}),
    ...(effect.narrative !== undefined ? { narrative: m(effect.narrative) } : {}),
  };
}

// Applies one event choice's effects in the answering candidate's favor. Bloc
// deltas are nationwide (events move the country, not a single state); salience
// shifts are national and candidate-agnostic.
export function applyEventEffect(
  game: GameState,
  effect: EventEffect,
  beneficiary: CandidateId,
  sourceTitle: string,
) {
  const sign = favorSign(beneficiary);

  if (effect.blocDeltas) {
    for (const bd of effect.blocDeltas) {
      const margin = (bd.margin ?? 0) * sign;
      for (const st of game.states) {
        if (st.blocs.length === 0) continue;
        const bloc = st.blocs.find((b) => b.blocId === bd.blocId);
        if (!bloc) continue;
        if (margin !== 0) {
          bloc.campaignMargin += margin;
          game.causes.push({
            turn: game.turn,
            stateId: st.id,
            blocId: bloc.blocId,
            cause: sourceTitle,
            marginDelta: margin,
          });
        }
        if (bd.enthusiasm) bloc.enthusiasm = clamp(bloc.enthusiasm + bd.enthusiasm, 0.7, 1.4);
      }
    }
  }

  if (effect.favorability) {
    for (const [blocId, val] of Object.entries(effect.favorability)) {
      const margin = (val ?? 0) * sign * 0.5;
      for (const st of game.states) {
        const bloc = st.blocs.find((b) => b.blocId === blocId);
        if (bloc) bloc.campaignMargin += margin;
      }
    }
  }

  if (effect.salienceDeltas) {
    for (const [issueId, delta] of Object.entries(effect.salienceDeltas)) {
      const key = issueId as keyof typeof game.salience;
      game.salience[key] = clamp((game.salience[key] ?? 0.5) + (delta ?? 0), 0, 1);
    }
  }

  const res = game.resources[beneficiary];
  if (effect.momentum) res.nationalMomentum = clamp(res.nationalMomentum + effect.momentum, -100, 100);
  if (effect.cash) res.cash += effect.cash;
  if (effect.narrative) res.mediaNarrative = clamp(res.mediaNarrative + effect.narrative, -100, 100);
}

// Whether a choice is available to a candidate (trait gates).
export function choiceAvailable(game: GameState, candidate: CandidateId, choice: EventChoice): boolean {
  if (choice.side && choice.side !== candidate) return false; // wrong ticket's option
  if (!choice.requires) return true;
  const { trait, min } = choice.requires;
  if (trait && min !== undefined) {
    return game.candidates[candidate].traits[trait] >= min;
  }
  return true;
}

// Resolves a single pending event for one candidate with a chosen option.
export function resolveEvent(
  game: GameState,
  eventId: string,
  choiceId: string,
  beneficiary: CandidateId,
): { resultText: string } | null {
  const event = EVENTS_BY_ID[eventId];
  if (!event) return null;
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) return null;
  if (!choiceAvailable(game, beneficiary, choice)) return null;

  // Debates resolve through the performance model: readiness (talent + prep)
  // amplifies the win and softens the cost. Everything else applies as authored.
  let effect = choice.effects;
  if (event.isDebate) {
    const { gain, cost } = debateMultipliers(debateReadiness(game, beneficiary));
    effect = scaleDebateEffect(effect, gain, cost);
  }
  applyEventEffect(game, effect, beneficiary, `${event.title}: ${choice.text}`);
  if (!game.firedEventIds.includes(`${eventId}:${beneficiary}`)) {
    game.firedEventIds.push(`${eventId}:${beneficiary}`);
  }
  game.pendingEvents = game.pendingEvents.filter(
    (p) => !(p.eventId === eventId && p.forCandidate === beneficiary),
  );
  return { resultText: choice.resultText };
}

function alreadyFired(game: GameState, eventId: string, candidate: CandidateId): boolean {
  return game.firedEventIds.includes(`${eventId}:${candidate}`);
}

// A candidate's 0..100 showing on debate night: readiness (talent + prep) plus
// how strong the tack they chose played (its authored narrative + momentum),
// plus a dollop of unscripted luck. This is the number on the scorecard.
function debatePerformanceScore(game: GameState, candidate: CandidateId, choice: EventChoice, luck: number): number {
  const readiness = debateReadiness(game, candidate); // 0..100
  const showing = (choice.effects.narrative ?? 0) + (choice.effects.momentum ?? 0); // ~ -15..+17
  return clamp(50 + (readiness - 50) * 0.6 + showing * 1.6 + luck, 0, 100);
}

// Resolves a debate head-to-head: both tickets answer (the player's pick passed
// in, any missing side auto-chosen), each is scored, and the margin drives a
// momentum swing on top of the choices' own effects. A blowout (margin ≥ 20) is
// a meltdown — a heavy momentum hit and a bruised narrative for the loser.
// Deterministic for a given (seed, turn, event).
export function resolveDebate(
  game: GameState,
  event: GameEvent,
  choiceFor: Partial<Record<CandidateId, string>>,
): DebateResult {
  const rng = createRng(`debate:${game.seed}:${game.turn}:${event.id}`);
  const scores = {} as Record<CandidateId, number>;
  const choiceText = {} as Record<CandidateId, string>;
  const resultText = {} as Record<CandidateId, string>;

  for (const c of ["dem", "rep"] as CandidateId[]) {
    const chosenId = choiceFor[c] ?? aiChooseEvent(game, event, c).id;
    const choice =
      event.choices.find((x) => x.id === chosenId && choiceAvailable(game, c, x)) ??
      event.choices.find((x) => choiceAvailable(game, c, x)) ??
      event.choices[0];
    const luck = rng.next() * 16 - 8; // ±8 unscripted
    scores[c] = Math.round(debatePerformanceScore(game, c, choice, luck));
    choiceText[c] = choice.text;
    resultText[c] = choice.resultText;
    resolveEvent(game, event.id, choice.id, c); // applies scaled effects + clears pending
  }

  const margin = Math.abs(scores.dem - scores.rep);
  const winner: CandidateId | "tie" = scores.dem === scores.rep ? "tie" : scores.dem > scores.rep ? "dem" : "rep";
  const meltdown = margin >= 20;
  let momentumSwing = clamp(margin * 0.6, 0, 20);
  if (meltdown) momentumSwing = Math.min(26, momentumSwing * 1.4);

  if (winner !== "tie") {
    const loser = OPPONENT_OF[winner];
    const w = game.resources[winner];
    const l = game.resources[loser];
    w.nationalMomentum = clamp(w.nationalMomentum + momentumSwing, -100, 100);
    l.nationalMomentum = clamp(l.nationalMomentum - momentumSwing, -100, 100);
    if (meltdown) l.mediaNarrative = clamp(l.mediaNarrative - 8, -100, 100);
  }

  return { eventId: event.id, title: event.title, scores, choiceText, resultText, winner, margin, meltdown, momentumSwing };
}

// Queues this turn's events: every scheduled event due now, plus up to one
// stochastic draw, each as a pending decision for BOTH tickets.
//
// Event mode shapes the scheduled beats: "historical" fires the scenario's real
// deck (that year's debates, scandals, October surprises); "plausible" fires
// only generic debates. The year-agnostic stochastic pool is drawn in both.
export function queueEventsForTurn(game: GameState, rng: Rng) {
  const queue = (event: GameEvent) => {
    for (const c of ["dem", "rep"] as CandidateId[]) {
      if (event.oncePerGame && alreadyFired(game, event.id, c)) continue;
      const exists = game.pendingEvents.some((p) => p.eventId === event.id && p.forCandidate === c);
      if (!exists) game.pendingEvents.push({ eventId: event.id, forCandidate: c });
    }
  };

  // Scheduled beats tied to the calendar.
  const historical = (game.eventMode ?? "historical") === "historical";
  const scheduledDeck = historical
    ? HISTORICAL_EVENTS[game.scenarioId ?? "2020"] ?? HISTORICAL_EVENTS["2020"]
    : GENERIC_DEBATES;
  for (const event of scheduledDeck) {
    if (event.trigger.kind !== "scheduled") continue;
    // The opening week is event-free (no modal on load), so the turn-0 beat (the
    // convention / the ticket switch) would be lost — surface it with week 2.
    const due = event.trigger.turn === game.turn || (game.turn === 1 && event.trigger.turn === 0);
    if (due) queue(event);
  }

  // Stochastic draw. In historical mode it's a rare year-agnostic wildcard
  // (occasional flavor). In plausible mode it's the main source of events AND
  // the pool is scenario-specific: the year's real beats get shuffled into the
  // generic pool and drawn at random times, so 2012's random mode pulls 2012
  // events — never COVID — and differs from the scripted historical order.
  if (rng.chance(historical ? 0.35 : 0.75)) {
    const scenarioBeats = historical ? [] : HISTORICAL_EVENTS[game.scenarioId ?? "2020"] ?? [];
    const pool = [...GENERIC_EVENTS, ...scenarioBeats].filter((e) => {
      if (e.oncePerGame && (alreadyFired(game, e.id, "dem") || alreadyFired(game, e.id, "rep"))) return false;
      const g = e.gate;
      if (g?.minTurn !== undefined && game.turn < g.minTurn) return false;
      if (g?.maxTurn !== undefined && game.turn > g.maxTurn) return false;
      return true;
    });
    if (pool.length > 0) {
      // Generic events keep their authored weight; scenario beats get a flat,
      // slightly higher weight so the year's real moments surface.
      const weights = pool.map((e) => (e.trigger.kind === "stochastic" ? e.trigger.baseWeight : 1.4));
      const picked = rng.weightedPick(pool, weights);
      queue(picked);
    }
  }
}

// AI auto-picks the choice that maximizes its net weighted bloc support given
// current salience (Section 8). Pure + legible.
export function aiChooseEvent(game: GameState, event: GameEvent, candidate: CandidateId): EventChoice {
  // Default to the first choice actually available to this ticket (asymmetric
  // events offer different options per side).
  let best = event.choices.find((c) => choiceAvailable(game, candidate, c)) ?? event.choices[0];
  let bestScore = -Infinity;
  for (const choice of event.choices) {
    if (!choiceAvailable(game, candidate, choice)) continue;
    let score = 0;
    for (const bd of choice.effects.blocDeltas ?? []) {
      // Weight each bloc by how many votes it represents nationally.
      let weight = 0;
      for (const st of game.states) {
        const bloc = st.blocs.find((b) => b.blocId === bd.blocId);
        if (bloc) weight += bloc.size * bloc.turnoutPropensity;
      }
      score += (bd.margin ?? 0) * weight;
      score += (bd.enthusiasm ?? 0) * weight * 0.3;
    }
    score += (choice.effects.momentum ?? 0) * 1000;
    score += (choice.effects.cash ?? 0) / 5000;
    if (score > bestScore) {
      bestScore = score;
      best = choice;
    }
  }
  return best;
}

// Resolves all pending events belonging to a given candidate using AI logic.
export function resolveAiEvents(game: GameState, candidate: CandidateId) {
  const mine = game.pendingEvents.filter((p) => p.forCandidate === candidate);
  for (const pending of mine) {
    const event = EVENTS_BY_ID[pending.eventId];
    if (!event) continue;
    const choice = aiChooseEvent(game, event, candidate);
    resolveEvent(game, pending.eventId, choice.id, candidate);
  }
}

export const _opponentOf = OPPONENT_OF;
export type { PendingEvent };
