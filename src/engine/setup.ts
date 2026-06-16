import type {
  BlocId,
  Candidate,
  CandidateId,
  CandidateTraits,
  EventMode,
  GameState,
  Resources,
  RunningMate,
  StateBloc,
  StateContest,
} from "./types";
import { BLOCS, BLOC_IDS, logit } from "@content/blocs";
import { STATE_SEEDS, type StateSeed } from "@content/states";
import { ISSUES, ISSUE_IDS } from "@content/issues";
import { OPPONENT_OF } from "@content/candidates";
import { resolveRunningMate, defaultRunningMate } from "@content/runningMates";
import { getScenario, type Scenario, type ScenarioTicket } from "@content/scenarios";

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// Solve a single additive shift so the turnout-weighted Biden share of a state's
// blocs equals the real 2020 target. Bisection — deterministic, no RNG.
function solveStateShift(
  blocs: { size: number; turnout: number; nationalLogit: number }[],
  targetDemShare: number,
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
    if (weightedShare(mid) < targetDemShare) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function buildBlocsForState(seed: StateSeed, targetDemShare: number): StateBloc[] {
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
      nationalLogit: logit(arche.nationalDemShare),
    };
  });

  const shift = solveStateShift(
    prelim.map((p) => ({ size: p.size, turnout: p.turnout, nationalLogit: p.nationalLogit })),
    targetDemShare,
  );

  return prelim.map((p) => {
    const baselineMargin = p.nationalLogit + shift;
    const demSupport = sigmoid(baselineMargin);
    return {
      blocId: p.blocId,
      size: p.size,
      turnoutPropensity: p.turnout,
      baselineMargin,
      support: { dem: demSupport, rep: 1 - demSupport },
      campaignMargin: 0,
      enthusiasm: 1,
    };
  });
}

// Build the contest list. A scenario supplies per-state two-party Dem priors
// (falling back to the 2020 default) and electoral-vote overrides for its
// cycle's apportionment.
export function buildStates(
  priors?: Record<string, number>,
  evOverrides?: Record<string, number>,
): StateContest[] {
  return STATE_SEEDS.map((seed) => {
    const isAggregate = (seed.electorate ?? 0) <= 0 && seed.aggregateOf;
    const demShare = priors?.[seed.id] ?? seed.prior2020DemShare;
    const ev = evOverrides?.[seed.id] ?? seed.ev;
    return {
      id: seed.id,
      name: seed.name,
      abbr: seed.abbr,
      electoralVotes: ev,
      region: seed.region,
      prior2020DemShare: demShare,
      mediaMarketCost: seed.mediaCost,
      battleground: seed.battleground,
      blocs: isAggregate ? [] : buildBlocsForState(seed, demShare),
      groundGame: { dem: 0, rep: 0 },
      momentum: 0,
      aggregateOf: seed.aggregateOf,
    };
  });
}

function startingResources(candidate: CandidateId, vp: RunningMate, baseEnergy: number): Resources {
  const maxDays = Math.round(3 + baseEnergy / 25) + (vp.candidateDayBonus ?? 0); // ~5–6 candidate-days/week
  return {
    // The Democratic ticket enters with a cash edge (true of 2020/2016/2024). A
    // fundraiser VP adds a one-time war-chest bump.
    cash: (candidate === "dem" ? 220_000_000 : 180_000_000) + (vp.cashBonus ?? 0),
    candidateDays: maxDays,
    maxCandidateDays: maxDays,
    staffCapacity: 6,
    nationalMomentum: 0,
    mediaNarrative: 0,
  };
}

// Fold a chosen running mate's bonuses into the ticket: rename the VP, bump
// traits (clamped 0..100), and add bloc favorability. Mutates the cloned cand.
function applyRunningMate(cand: Candidate, vp: RunningMate) {
  cand.runningMate = vp.name;
  if (vp.traitBonuses) {
    for (const [k, v] of Object.entries(vp.traitBonuses)) {
      const key = k as keyof CandidateTraits;
      cand.traits[key] = Math.max(0, Math.min(100, cand.traits[key] + (v ?? 0)));
    }
  }
  if (vp.favorability) {
    for (const [b, v] of Object.entries(vp.favorability)) {
      const key = b as BlocId;
      cand.baseFavorability[key] = (cand.baseFavorability[key] ?? 0) + (v ?? 0);
    }
  }
}

// Build a slot candidate from a scenario ticket. The default (historical) VP
// name is set here; applyRunningMate may overwrite it with the player's pick.
function buildCandidate(slot: CandidateId, t: ScenarioTicket): Candidate {
  return {
    id: slot,
    name: t.name,
    shortName: t.shortName,
    party: t.party,
    color: t.color,
    runningMate: defaultRunningMate(t.runningMates).name,
    traits: { ...t.traits },
    issuePositions: { ...t.issuePositions },
    baseFavorability: { ...t.baseFavorability },
  };
}

export interface NewGameOptions {
  seed?: number | string;
  playerCandidate?: CandidateId;
  totalTurns?: number;
  granularity?: "week" | "day";
  // Chosen running mate id for the player's ticket (see content/runningMates).
  runningMate?: string;
  // Election scenario id (see content/scenarios); defaults to "2020".
  scenario?: string;
  // Event source; defaults to "historical".
  eventMode?: EventMode;
}

// Builds a fresh, fully-initialized game state. Deterministic given the seed.
export function createGame(opts: NewGameOptions = {}): GameState {
  const seedInput = opts.seed ?? Date.now();
  const seed = typeof seedInput === "string"
    ? hashStr(seedInput)
    : seedInput >>> 0;

  const salience = {} as GameState["salience"];
  for (const id of ISSUE_IDS) salience[id] = ISSUES[id].baseSalience;

  // Pick the scenario, build the two slot tickets, and resolve running mates:
  // the player's chosen pick, the AI's historical default.
  const scenario: Scenario = getScenario(opts.scenario);
  const player = opts.playerCandidate ?? "dem";
  const tickets: Record<CandidateId, ScenarioTicket> = { dem: scenario.dem, rep: scenario.rep };
  const candidates: Record<CandidateId, Candidate> = {
    dem: buildCandidate("dem", scenario.dem),
    rep: buildCandidate("rep", scenario.rep),
  };
  const vps = {
    [player]: resolveRunningMate(tickets[player].runningMates, opts.runningMate),
    [OPPONENT_OF[player]]: defaultRunningMate(tickets[OPPONENT_OF[player]].runningMates),
  } as Record<CandidateId, RunningMate>;
  applyRunningMate(candidates.dem, vps.dem);
  applyRunningMate(candidates.rep, vps.rep);

  return {
    seed,
    rngState: seed,
    turn: 0,
    totalTurns: opts.totalTurns ?? 9, // Sept 1 → Nov 3, weekly
    granularity: opts.granularity ?? "week",
    phase: "intel",
    playerCandidate: player,
    scenarioId: scenario.id,
    eventMode: opts.eventMode ?? "historical",
    candidates,
    issues: structuredClone(ISSUES),
    salience,
    states: buildStates(scenario.statePriors, scenario.evOverrides),
    resources: {
      dem: startingResources("dem", vps.dem, scenario.dem.traits.energy),
      rep: startingResources("rep", vps.rep, scenario.rep.traits.energy),
    },
    pendingEvents: [],
    firedEventIds: [],
    queuedActions: [],
    causes: [],
    lastRecap: [],
    runningMates: { dem: vps.dem.id, rep: vps.rep.id },
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
