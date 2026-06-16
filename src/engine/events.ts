import type {
  CandidateId,
  EventChoice,
  EventEffect,
  GameEvent,
  GameState,
  PendingEvent,
} from "./types";
import type { Rng } from "./rng";
import { EVENTS, EVENTS_BY_ID } from "@content/events";
import { OPPONENT_OF } from "@content/candidates";
import { clamp } from "./actions";

function favorSign(candidate: CandidateId): number {
  return candidate === "dem" ? 1 : -1;
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

  applyEventEffect(game, choice.effects, beneficiary, `${event.title}: ${choice.text}`);
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

// Queues this turn's events: every scheduled event due now, plus up to one
// stochastic draw, each as a pending decision for BOTH tickets.
export function queueEventsForTurn(game: GameState, rng: Rng) {
  const queue = (event: GameEvent) => {
    for (const c of ["dem", "rep"] as CandidateId[]) {
      if (event.oncePerGame && alreadyFired(game, event.id, c)) continue;
      const exists = game.pendingEvents.some((p) => p.eventId === event.id && p.forCandidate === c);
      if (!exists) game.pendingEvents.push({ eventId: event.id, forCandidate: c });
    }
  };

  // Scheduled events tied to the calendar.
  for (const event of EVENTS) {
    if (event.trigger.kind === "scheduled" && event.trigger.turn === game.turn) {
      queue(event);
    }
  }

  // Stochastic draw — ~70% chance of a wildcard each turn, gated by game state.
  if (rng.chance(0.7)) {
    const pool = EVENTS.filter((e) => {
      if (e.trigger.kind !== "stochastic") return false;
      if (e.oncePerGame && (alreadyFired(game, e.id, "dem") || alreadyFired(game, e.id, "rep"))) return false;
      const g = e.gate;
      if (g?.minTurn !== undefined && game.turn < g.minTurn) return false;
      if (g?.maxTurn !== undefined && game.turn > g.maxTurn) return false;
      return true;
    });
    if (pool.length > 0) {
      const weights = pool.map((e) =>
        e.trigger.kind === "stochastic" ? e.trigger.baseWeight : 0,
      );
      const picked = rng.weightedPick(pool, weights);
      queue(picked);
    }
  }
}

// AI auto-picks the choice that maximizes its net weighted bloc support given
// current salience (Section 8). Pure + legible.
export function aiChooseEvent(game: GameState, event: GameEvent, candidate: CandidateId): EventChoice {
  let best = event.choices[0];
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
