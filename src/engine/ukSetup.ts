// Builds the UK game's region contests from an election's regional results,
// calibrated so neutral play reproduces that election by construction:
//   - each region's bloc appeals are solved (iterative proportional fitting) so
//     the turnout-weighted vote share equals the real regional share, even with
//     demographic tilts layered on;
//   - the region carries the real seat split as the seats-curve baseline.
// Pure + deterministic — no RNG.

import type { PartyId } from "./system";
import type { StateBloc, StateContest } from "./types";
import { softmax } from "./multiparty";
import { UK_BLOCS, UK_BLOCS_BY_ID } from "@content/uk/blocs";
import { UK_REGIONS_BY_ID } from "@content/uk/regions";
import type { RegionResult, UkElectionData } from "@content/uk/elections";

const EPS = 1e-9;

// Normalize a vote-share vector over the parties present so it sums to 1.
function normalizeShare(v: Record<string, number>): Record<PartyId, number> {
  const sum = Object.values(v).reduce((s, x) => s + Math.max(0, x), 0);
  const out: Record<PartyId, number> = {};
  for (const p of Object.keys(v)) out[p] = sum > 0 ? Math.max(0, v[p]) / sum : 0;
  return out;
}

// Solve per-bloc appeal vectors so the region's turnout-weighted aggregate vote
// share matches `target`. Each bloc starts at ln(target) + its demographic tilt;
// IPF then nudges a shared correction until the aggregate lands on target.
function solveRegionBlocs(
  blocs: { id: string; size: number; turnout: number; tilt: Record<PartyId, number> }[],
  target: Record<PartyId, number>,
): StateBloc[] {
  const parties = Object.keys(target);
  const lnTarget: Record<PartyId, number> = {};
  for (const p of parties) lnTarget[p] = Math.log(Math.max(EPS, target[p]));
  const corr: Record<PartyId, number> = Object.fromEntries(parties.map((p) => [p, 0]));

  const appealFor = (b: { tilt: Record<PartyId, number> }): Record<PartyId, number> => {
    const a: Record<PartyId, number> = {};
    for (const p of parties) a[p] = lnTarget[p] + (b.tilt[p] ?? 0) + corr[p];
    return a;
  };

  for (let iter = 0; iter < 16; iter++) {
    const agg: Record<PartyId, number> = Object.fromEntries(parties.map((p) => [p, 0]));
    let totW = 0;
    for (const b of blocs) {
      const sh = softmax(appealFor(b));
      const w = b.size * b.turnout;
      for (const p of parties) agg[p] += w * sh[p];
      totW += w;
    }
    for (const p of parties) {
      const a = totW > 0 ? agg[p] / totW : target[p];
      corr[p] += Math.log(Math.max(EPS, target[p]) / Math.max(EPS, a));
    }
  }

  return blocs.map((b) => {
    const appeal = appealFor(b);
    const support = softmax(appeal);
    return {
      blocId: b.id as StateBloc["blocId"],
      size: b.size,
      turnoutPropensity: b.turnout,
      baselineMargin: 0, // unused on the multiparty path
      support: support as StateBloc["support"],
      campaignMargin: 0,
      enthusiasm: 1,
      appeal,
      campaignAppeal: Object.fromEntries(parties.map((p) => [p, 0])),
    };
  });
}

function buildRegionContest(regionId: string, res: RegionResult): StateContest {
  const meta = UK_REGIONS_BY_ID[regionId];
  const target = normalizeShare(res.v);

  // Size each bloc from electorate × (national share × regional profile multiplier).
  const raw = UK_BLOCS.map((b) => ({
    id: b.id,
    share: b.share * (meta.profile?.[b.id] ?? 1),
  }));
  const totalShare = raw.reduce((s, r) => s + r.share, 0);
  const blocsIn = raw.map((r) => {
    const def = UK_BLOCS_BY_ID[r.id];
    return {
      id: r.id,
      size: (meta.electorate * r.share) / totalShare,
      turnout: def.turnoutPropensity,
      tilt: def.tilt as Record<PartyId, number>,
    };
  });

  const baselineSeats: Record<PartyId, number> = { ...res.s };
  const baselineShare = target;

  return {
    id: regionId,
    name: meta.name,
    abbr: meta.abbr,
    electoralVotes: 0,
    region: "Swing",
    prior2020DemShare: 0.5,
    mediaMarketCost: 1,
    battleground: false,
    blocs: solveRegionBlocs(blocsIn, target),
    groundGame: { dem: 0, rep: 0 },
    momentum: 0,
    seats: meta.seats,
    baselineSeats,
    baselineShare,
  };
}

export function buildUkRegions(election: UkElectionData): StateContest[] {
  return Object.entries(election.regions).map(([id, res]) => buildRegionContest(id, res));
}
