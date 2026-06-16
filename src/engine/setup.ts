import type {
  CandidateId,
  GameState,
  Resources,
  StateBloc,
  StateContest,
} from "./types";
import { BLOCS, BLOC_IDS, logit } from "@content/blocs";
import { STATE_SEEDS, type StateSeed } from "@content/states";
import { ISSUES, ISSUE_IDS } from "@content/issues";
import { CANDIDATES } from "@content/candidates";

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// Solve a single additive shift so the turnout-weighted Biden share of a state's
// blocs equals the real 2020 target. Bisection — deterministic, no RNG.
function solveStateShift(
  blocs: { size: number; turnout: number; nationalLogit: number }[],
  targetBidenShare: number,
): number {
  const weightedShare = (shift: number): number => {
    let num = 0;
    let den = 0;
    for (const b of blocs) {
      const w = b.size * b.turnout;
      num += w * sigmoid(b.nationalLogit + shift);
      den += w;
    }
    return den > 0 ? num / den : 0.5;
  };
  let lo = -10;
  let hi = 10;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (weightedShare(mid) < targetBidenShare) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function buildBlocsForState(seed: StateSeed): StateBloc[] {
  // Normalize the (national share × profile multiplier) into shares summing to 1.
  const raw = BLOC_IDS.map((id) => {
    const mult = seed.profile?.[id] ?? 1;
    return { id, share: BLOCS[id].nationalShare * mult };
  });
  const totalShare = raw.reduce((s, r) => s + r.share, 0);

  const prelim = raw.map((r) => {
    const arche = BLOCS[r.id];
    const size = (seed.electorate * r.share) / totalShare;
    return {
      blocId: r.id,
      size,
      turnout: arche.turnoutPropensity,
      nationalLogit: logit(arche.nationalBidenShare),
    };
  });

  const shift = solveStateShift(
    prelim.map((p) => ({ size: p.size, turnout: p.turnout, nationalLogit: p.nationalLogit })),
    seed.prior2020BidenShare,
  );

  return prelim.map((p) => {
    const baselineMargin = p.nationalLogit + shift;
    const bidenSupport = sigmoid(baselineMargin);
    return {
      blocId: p.blocId,
      size: p.size,
      turnoutPropensity: p.turnout,
      baselineMargin,
      support: { biden: bidenSupport, trump: 1 - bidenSupport },
      campaignMargin: 0,
      enthusiasm: 1,
    };
  });
}

export function buildStates(): StateContest[] {
  return STATE_SEEDS.map((seed) => {
    const isAggregate = (seed.electorate ?? 0) <= 0 && seed.aggregateOf;
    return {
      id: seed.id,
      name: seed.name,
      abbr: seed.abbr,
      electoralVotes: seed.ev,
      region: seed.region,
      prior2020BidenShare: seed.prior2020BidenShare,
      mediaMarketCost: seed.mediaCost,
      battleground: seed.battleground,
      blocs: isAggregate ? [] : buildBlocsForState(seed),
      groundGame: { biden: 0, trump: 0 },
      momentum: 0,
      aggregateOf: seed.aggregateOf,
    };
  });
}

function startingResources(candidate: CandidateId): Resources {
  const energy = CANDIDATES[candidate].traits.energy;
  const maxDays = Math.round(3 + energy / 25); // ~5–6 candidate-days/week
  return {
    // Both campaigns enter the fall flush; Biden held a real cash edge.
    cash: candidate === "biden" ? 220_000_000 : 180_000_000,
    candidateDays: maxDays,
    maxCandidateDays: maxDays,
    staffCapacity: 6,
    nationalMomentum: 0,
    mediaNarrative: 0,
  };
}

export interface NewGameOptions {
  seed?: number | string;
  playerCandidate?: CandidateId;
  totalTurns?: number;
  granularity?: "week" | "day";
}

// Builds a fresh, fully-initialized game state. Deterministic given the seed.
export function createGame(opts: NewGameOptions = {}): GameState {
  const seedInput = opts.seed ?? Date.now();
  const seed = typeof seedInput === "string"
    ? hashStr(seedInput)
    : seedInput >>> 0;

  const salience = {} as GameState["salience"];
  for (const id of ISSUE_IDS) salience[id] = ISSUES[id].baseSalience;

  return {
    seed,
    rngState: seed,
    turn: 0,
    totalTurns: opts.totalTurns ?? 9, // Sept 1 → Nov 3, weekly
    granularity: opts.granularity ?? "week",
    phase: "intel",
    playerCandidate: opts.playerCandidate ?? "biden",
    candidates: structuredClone(CANDIDATES),
    issues: structuredClone(ISSUES),
    salience,
    states: buildStates(),
    resources: {
      biden: startingResources("biden"),
      trump: startingResources("trump"),
    },
    pendingEvents: [],
    firedEventIds: [],
    queuedActions: [],
    causes: [],
    lastRecap: [],
  };
}

function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
