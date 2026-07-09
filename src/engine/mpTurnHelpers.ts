// Shared helpers for the UK and country turn loops. The US advanceTurn path is
// intentionally untouched (calibration guardrail). These helpers collapse the
// duplicated pending-event gate, cause recap, multiparty decay, and phase
// finalization that ukGame / countryGame previously copy-pasted.

import type { CauseEntry, StateContest } from "./types";
import type { PartyId } from "./system";
import { blocPartyShares } from "./multiparty";

export interface RecapItem {
  label: string;
  detail: string;
  marginDelta?: number;
}

export interface MpResources {
  momentum: number;
  actions: number;
  maxActions: number;
}

/** Group this turn's causes into a week-in-review list, headed by a projection line. */
export function buildCauseRecap(
  causes: CauseEntry[],
  turn: number,
  header: RecapItem,
  regionLabel = "region(s)",
  limit = 12,
): RecapItem[] {
  const recap: RecapItem[] = [];
  const byCause = new Map<string, { delta: number; regions: Set<string> }>();
  for (const c of causes) {
    if (c.turn !== turn) continue;
    const entry = byCause.get(c.cause) ?? { delta: 0, regions: new Set() };
    entry.delta += c.marginDelta;
    if (c.stateId) entry.regions.add(c.stateId);
    byCause.set(c.cause, entry);
  }
  for (const [cause, info] of byCause) {
    recap.push({
      label: cause,
      detail: info.regions.size > 0 ? `${info.regions.size} ${regionLabel}` : "nationwide",
      marginDelta: info.delta,
    });
  }
  recap.sort((a, b) => Math.abs(b.marginDelta ?? 0) - Math.abs(a.marginDelta ?? 0));
  recap.unshift(header);
  return recap.slice(0, limit);
}

/**
 * Pending player-choice gate shared by UK/country.
 * - autoResolve: pick first choice via `resolve`
 * - otherwise: return blocked so the UI can show the modal
 */
export function resolvePendingChoiceGate<T extends { pendingEvent?: { eventId: string } | null; phase: string }>(
  game: T,
  opts: { autoResolvePlayerEvents?: boolean },
  resolve: (g: T, choiceId: string) => T,
  getFirstChoiceId: (g: T) => string | undefined,
): { blocked: true; game: T } | { blocked: false; game: T } {
  if (!game.pendingEvent) return { blocked: false, game };
  if (opts.autoResolvePlayerEvents) {
    const choiceId = getFirstChoiceId(game);
    if (choiceId) return { blocked: false, game: resolve(game, choiceId) };
    return { blocked: false, game: { ...game, pendingEvent: null } };
  }
  return { blocked: true, game };
}

/** Momentum decay + action refill + live support refresh (UK/country identical). */
export function decayMultipartyTurn(
  resources: Record<string, MpResources>,
  regions: StateContest[],
  parties: PartyId[],
): void {
  for (const p of parties) {
    const res = resources[p];
    if (!res) continue;
    res.momentum *= 0.7;
    res.actions = res.maxActions;
  }
  for (const region of regions) {
    region.momentum *= 0.6;
    for (const bloc of region.blocs) bloc.support = blocPartyShares(bloc) as typeof bloc.support;
  }
}

/**
 * Advance the turn counter and close the campaign when out of weeks.
 * If a pending player decision remains, leave phase as campaign so the UI can resolve it.
 */
export function finalizeMpCampaignTurn<T extends {
  turn: number;
  totalTurns: number;
  phase: string;
  pendingEvent?: unknown;
  result?: unknown;
}>(
  game: T,
  computeResult: (g: T) => unknown,
): T {
  game.turn += 1;
  if (game.pendingEvent) return game;
  if (game.turn >= game.totalTurns) {
    game.phase = "result";
    game.result = computeResult(game);
  }
  return game;
}
