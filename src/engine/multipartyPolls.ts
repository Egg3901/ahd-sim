// Noisy multiparty polls — a blurred view of true regional vote shares, with
// house effects and sampling noise. Deterministic for a given (seed, turn,
// region, pollster) so the UI doesn't reshuffle every render.

import type { PartyId } from "./system";
import type { StateContest } from "./types";
import { createRng } from "./rng";
import { tallyRegion } from "./multiparty";

export interface MpPollster {
  name: string;
  house: number; // additive bias toward the largest party (logit-ish share space)
  n: number;
}

const DEFAULT_POLLSTERS: MpPollster[] = [
  { name: "YouGov", house: 0.004, n: 1800 },
  { name: "Ipsos", house: -0.003, n: 1500 },
  { name: "Survation", house: 0.006, n: 1200 },
  { name: "Opinium", house: -0.005, n: 1400 },
];

export interface MpRegionPoll {
  regionId: string;
  pollster: string;
  shareByParty: Record<PartyId, number>;
  sampleSize: number;
  marginOfError: number;
}

export interface MpNationalPoll {
  pollster: string;
  shareByParty: Record<PartyId, number>;
  sampleSize: number;
}

function noisyShares(
  truth: Record<PartyId, number>,
  house: number,
  moe: number,
  rng: { normal: (m: number, s: number) => number },
): Record<PartyId, number> {
  const parties = Object.keys(truth) as PartyId[];
  if (parties.length === 0) return {};
  // House effect nudges the current leader; sampling noise per party, then renormalize.
  const leader = parties.reduce((a, b) => ((truth[a] ?? 0) >= (truth[b] ?? 0) ? a : b));
  const raw: Record<PartyId, number> = {};
  let sum = 0;
  for (const p of parties) {
    const bias = p === leader ? house : -house / Math.max(1, parties.length - 1);
    const v = Math.max(0.005, (truth[p] ?? 0) + bias + rng.normal(0, moe * 0.55));
    raw[p] = v;
    sum += v;
  }
  const out: Record<PartyId, number> = {};
  for (const p of parties) out[p] = raw[p] / sum;
  return out;
}

export function pollRegion(
  seed: number,
  turn: number,
  region: StateContest,
  pollsters: MpPollster[] = DEFAULT_POLLSTERS,
): MpRegionPoll[] {
  const { shareByParty } = tallyRegion(region);
  return pollsters.map((p, i) => {
    const rng = createRng(`mppoll:${seed}:${turn}:${region.id}:${i}`);
    const moe = 1.96 * Math.sqrt(0.25 / p.n);
    return {
      regionId: region.id,
      pollster: p.name,
      shareByParty: noisyShares(shareByParty as Record<PartyId, number>, p.house, moe, rng),
      sampleSize: p.n,
      marginOfError: +(moe * 100).toFixed(1),
    };
  });
}

/** Electorate-weighted national poll average across regions. */
export function nationalMpPoll(
  seed: number,
  turn: number,
  regions: StateContest[],
  pollsters: MpPollster[] = DEFAULT_POLLSTERS,
): Record<PartyId, number> {
  const agg: Record<PartyId, number> = {};
  let den = 0;
  for (const region of regions) {
    const polls = pollRegion(seed, turn, region, pollsters);
    if (polls.length === 0) continue;
    // Average pollsters for this region.
    const avg: Record<PartyId, number> = {};
    for (const poll of polls) {
      for (const [p, s] of Object.entries(poll.shareByParty)) {
        avg[p as PartyId] = (avg[p as PartyId] ?? 0) + s / polls.length;
      }
    }
    const weight = region.blocs.reduce((s, b) => s + b.size * b.turnoutPropensity, 0) || 1;
    for (const [p, s] of Object.entries(avg)) {
      agg[p as PartyId] = (agg[p as PartyId] ?? 0) + s * weight;
    }
    den += weight;
  }
  if (den <= 0) return {};
  const out: Record<PartyId, number> = {};
  for (const [p, s] of Object.entries(agg)) out[p as PartyId] = s / den;
  return out;
}
