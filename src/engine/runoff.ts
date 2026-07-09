// ─────────────────────────────────────────────────────────────────────────
// TWO-ROUND RUNOFF — France (and any future two-round presidential system).
//
// Round 1: every candidate contests; the top two advance.
// Round 2: eliminated candidates' voters transfer to the finalists (or
// abstain) according to a transfer matrix. The campaign the player fights
// is the entre-deux-tours; this module is how the runoff map is derived
// from a first-round result instead of hand-authoring second-round shares.
// ─────────────────────────────────────────────────────────────────────────

import type { PartyId } from "./system";

/** First-round national (or regional) vote shares — need not sum exactly to 1. */
export type RoundShares = Record<PartyId, number>;

/**
 * For each eliminated party, the fraction of its voters that go to each
 * finalist (and optionally `_abstain`). Rows should sum to ≤ 1; remainder
 * abstains.
 */
export type TransferMatrix = Record<PartyId, Record<PartyId | "_abstain", number>>;

export interface RunoffResult {
  finalists: [PartyId, PartyId];
  eliminated: PartyId[];
  /** Second-round shares among ballots cast (renormalized over the two finalists). */
  secondRound: Record<PartyId, number>;
  /** Raw transferred vote mass before renormalization (includes abstention loss). */
  transferred: Record<PartyId, number>;
  abstentionRate: number;
}

/** Pick the top two candidates by first-round share. */
export function topTwo(firstRound: RoundShares): [PartyId, PartyId] {
  const ranked = Object.entries(firstRound)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]);
  if (ranked.length < 2) {
    throw new Error("Runoff needs at least two candidates with votes");
  }
  return [ranked[0][0], ranked[1][0]];
}

/**
 * Advance a first-round result to a second-round runoff using bloc transfers
 * from eliminated parties. Finalists keep their own first-round voters;
 * everyone else redistributes per `transfers`.
 */
export function advanceToRunoff(
  firstRound: RoundShares,
  transfers: TransferMatrix,
  finalists?: [PartyId, PartyId],
): RunoffResult {
  const pair = finalists ?? topTwo(firstRound);
  const [a, b] = pair;
  const eliminated = Object.keys(firstRound).filter((p) => p !== a && p !== b);

  const mass: Record<PartyId, number> = { [a]: firstRound[a] ?? 0, [b]: firstRound[b] ?? 0 };
  let abstain = 0;

  for (const elim of eliminated) {
    const row = transfers[elim] ?? {};
    const pool = firstRound[elim] ?? 0;
    let placed = 0;
    for (const dest of [a, b] as PartyId[]) {
      const frac = Math.max(0, row[dest] ?? 0);
      mass[dest] = (mass[dest] ?? 0) + pool * frac;
      placed += frac;
    }
    const explicitAbstain = Math.max(0, row._abstain ?? 0);
    const remainder = Math.max(0, 1 - placed - explicitAbstain);
    abstain += pool * (explicitAbstain + remainder);
  }

  const cast = (mass[a] ?? 0) + (mass[b] ?? 0);
  const secondRound: Record<PartyId, number> =
    cast > 0
      ? { [a]: (mass[a] ?? 0) / cast, [b]: (mass[b] ?? 0) / cast }
      : { [a]: 0.5, [b]: 0.5 };

  const totalFirst = Object.values(firstRound).reduce((s, x) => s + x, 0) || 1;
  return {
    finalists: pair,
    eliminated,
    secondRound,
    transferred: mass,
    abstentionRate: abstain / totalFirst,
  };
}

/**
 * Apply a national runoff result onto per-region first-round shares, using the
 * same transfer matrix. Returns per-region second-round shares for the two
 * finalists (suitable as CountryRegionResult.v).
 */
export function regionalRunoff(
  regions: Record<string, RoundShares>,
  transfers: TransferMatrix,
  finalists?: [PartyId, PartyId],
): { finalists: [PartyId, PartyId]; regions: Record<string, Record<PartyId, number>> } {
  // National aggregate picks the finalists when not supplied.
  const national: RoundShares = {};
  for (const shares of Object.values(regions)) {
    for (const [p, s] of Object.entries(shares)) national[p] = (national[p] ?? 0) + s;
  }
  const pair = finalists ?? topTwo(national);
  const out: Record<string, Record<PartyId, number>> = {};
  for (const [rid, shares] of Object.entries(regions)) {
    out[rid] = advanceToRunoff(shares, transfers, pair).secondRound;
  }
  return { finalists: pair, regions: out };
}
