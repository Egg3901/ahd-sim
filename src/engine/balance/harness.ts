// ─────────────────────────────────────────────────────────────────────────
// BALANCE GAUNTLET — engine-agnostic automated-playtest harness.
//
// Runs every registry scenario × playable side × difficulty × bot strategy
// over N deterministic seeds and reduces each cell to fairness/fun metrics
// (winRate, avgUnitMargin, blowoutRate, avgScore, history fidelity). Pure
// read-only consumer of the three engines (us / uk / country) — it never
// modifies engine or content code. Consumed by:
//   - src/engine/__tests__/balance-gauntlet.test.ts  (threshold assertions)
//   - scripts/balance-report.ts                      (full-matrix report)
// ─────────────────────────────────────────────────────────────────────────

import { SCENARIO_REGISTRY, type ScenarioMeta } from "@content/scenarioRegistry";
import { COUNTRIES } from "@content/countries";
import type { CampaignAction, CandidateId, GameState, StateContest } from "../types";
import type { PartyId } from "../system";
import { createGame } from "../setup";
import { advanceTurn, beginGame } from "../turn";
import { DIFFICULTY } from "../ai";
import { projectElection, computeResult } from "../voteModel";
import {
  createUkGame,
  ukAdvanceTurn,
  computeUkResult,
  type UkGameState,
  type UkAction,
} from "../ukGame";
import { UK_SYSTEM } from "@content/uk/parties";
import {
  createCountryGame,
  countryAdvanceTurn,
  computeCountryResult,
  playablePartiesIn,
  majorityFor,
  type CountryGameState,
  type CountryAction,
  type CountryBundle,
} from "../countryGame";
import { tallyRegion } from "../multiparty";
import { computeScoreFromFacts, usScoreFacts, multipartyScoreFacts } from "../scoring";

// ── Public types ───────────────────────────────────────────────────────────

export type BotStrategy = "passive" | "focused" | "scattershot";
export type UsDifficulty = "easy" | "normal" | "hard";
// UK/country engines have no difficulty system — they run as "base".
export type GauntletDifficulty = UsDifficulty | "base";
export type SideRole = "winner" | "underdog" | "minor";

export interface GauntletRow {
  scenarioId: string;
  engine: ScenarioMeta["engine"];
  side: string; // "dem" | "rep" | partyId
  // winner = the side that wins the untouched baseline; underdog = the
  // strongest baseline loser among playable sides; minor = everyone else.
  sideRole: SideRole;
  difficulty: GauntletDifficulty;
  bot: BotStrategy;
  seeds: number;
  winRate: number; // player wins the unit majority / becomes largest party
  avgUnitMargin: number; // player units − win threshold (EV−270 / seats−majority)
  blowoutRate: number; // |player units − top rival units| > 25% of chamber
  avgScore: number; // leaderboard score (scoring.ts), player perspective
  // Fraction of seeds where the RUN's winner (either side) matches the
  // historical baseline winner — the calibration-under-noise signal.
  historyMatchRate: number;
  avgDemEV?: number; // US only: calibration-drift sanity check
}

export interface GauntletConfig {
  // Registry scenarioIds to run; default: the whole registry.
  scenarios?: string[];
  bots?: BotStrategy[]; // default: all three
  usDifficulties?: UsDifficulty[]; // default: easy/normal/hard (US rows only)
  seedsPerCell?: number; // default 20
  // Restrict sides: "all" = every playable side; "winner-underdog" = just the
  // two headline sides (keeps the reduced/test matrix small on DE's 6 parties).
  sides?: "all" | "winner-underdog";
  onProgress?: (done: number, total: number) => void;
}

// ── Tunable thresholds (the assertion layer + report flags read these) ────
export const GAUNTLET_THRESHOLDS = {
  // Focused bot playing the historical loser on the easiest available setting
  // (US easy; UK/country base) must win at least this often: "any year is
  // winnable" made enforceable.
  winnabilityFloor: 0.15,
  // Focused bot playing the historical winner on the hardest available setting
  // (US hard; UK/country base) must still win at least this often.
  noPushoverFloor: 0.4,
  // Passive play (all engines, US normal) must reproduce the historical winner
  // in at least this fraction of seeds — calibration under noise.
  passiveFidelity: 0.8,
  // Bot ordering sanity: focused ≥ scattershot ≥ passive in aggregate win
  // rate, with this much slack for sampling noise.
  orderingTolerance: 0.02,
  // Suggested difficulty label from the focused-bot underdog win rate on the
  // DEFAULT setting (US normal; UK/country base).
  labelEasyMin: 0.45, // winRate ≥ this ⇒ "easy"
  labelMediumMin: 0.2, // winRate ≥ this ⇒ "medium", else "hard"
} as const;

// ── US bots ────────────────────────────────────────────────────────────────

// Battleground targets: vote-bearing states sorted by closeness to 50/50.
function usTargets(g: GameState, band: number, max: number) {
  const proj = projectElection(g);
  const rows = proj.contests
    .map((c) => ({ ...c, dist: Math.abs(c.demShare - 0.5) }))
    .filter((c) => {
      const st = g.states.find((s) => s.id === c.stateId);
      return !!st && st.blocs.length > 0;
    })
    .sort((a, b) => a.dist - b.dist);
  const inBand = rows.filter((c) => c.dist <= band);
  return (inBand.length > 0 ? inBand : rows).slice(0, max);
}

// The strong bot: hammer the 4 closest winnable states with an ad/rally/field
// mix, keep the war chest topped up, GOTV in the final stretch. Events are
// resolved by advanceTurn's auto-resolve, which already picks the choice with
// the best net weighted blocDelta for the player (aiChooseEvent).
function usFocusedActions(g: GameState, side: CandidateId): CampaignAction[] {
  const res = g.resources[side];
  const targets = usTargets(g, 0.12, 4);
  if (targets.length === 0) return [];
  const slots = res.actions;
  const turnsLeft = Math.max(1, g.totalTurns - g.turn);
  const out: CampaignAction[] = [];

  // War chest floor: refill before it runs dry (pacing, like the engine AI).
  if (res.cash < 40_000_000) {
    const richest = [...g.states]
      .filter((s) => s.blocs.length > 0)
      .sort((a, b) => b.electoralVotes - a.electoralVotes)[0];
    out.push({ type: "fundraise", candidate: side, stateId: richest?.id });
  }

  // Field early (sticky), GOTV late (cashes the field in).
  if (turnsLeft > 3 && res.staffCapacity > 0 && res.cash > 2_000_000) {
    const build = targets.find((t) => {
      const st = g.states.find((s) => s.id === t.stateId)!;
      return st.groundGame[side] < 0.95;
    });
    if (build) out.push({ type: "ground_game", candidate: side, stateId: build.stateId });
  }
  if (turnsLeft <= 2) {
    for (const t of targets.slice(0, 3)) {
      const st = g.states.find((s) => s.id === t.stateId)!;
      if (st.groundGame[side] > 0.05 && res.cash > 1_000_000) {
        out.push({ type: "gotv", candidate: side, stateId: t.stateId });
      }
    }
  }

  // Interleave ads + rallies across the top targets, paced over the weeks left.
  const adBudget = (res.cash * 0.9) / Math.max(2, turnsLeft);
  const perTarget = adBudget / targets.length;
  for (const t of targets) {
    out.push({ type: "rally", candidate: side, stateId: t.stateId });
    if (perTarget >= 500_000) {
      out.push({
        type: "advertise",
        candidate: side,
        stateId: t.stateId,
        adMode: "positive",
        spend: perTarget,
      });
    }
  }
  return out.slice(0, slots);
}

// The naive-player proxy: spread one cheap action over every contested state.
function usScattershotActions(g: GameState, side: CandidateId): CampaignAction[] {
  const res = g.resources[side];
  const targets = usTargets(g, 0.15, 20);
  if (targets.length === 0) return [];
  const slots = res.actions;
  const turnsLeft = Math.max(1, g.totalTurns - g.turn);
  const out: CampaignAction[] = [];
  if (res.cash < 20_000_000) out.push({ type: "fundraise", candidate: side });
  const perTarget = (res.cash * 0.9) / Math.max(2, turnsLeft) / Math.max(1, targets.length);
  let i = 0;
  while (out.length < slots) {
    const t = targets[i % targets.length];
    if (i % 2 === 0 && perTarget >= 200_000) {
      out.push({ type: "advertise", candidate: side, stateId: t.stateId, adMode: "positive", spend: perTarget });
    } else {
      out.push({ type: "rally", candidate: side, stateId: t.stateId });
    }
    i++;
    if (i > 60) break; // safety
  }
  return out.slice(0, slots);
}

function usBotActions(bot: BotStrategy, g: GameState, side: CandidateId): CampaignAction[] {
  if (bot === "passive") return [];
  if (bot === "focused") return usFocusedActions(g, side);
  return usScattershotActions(g, side);
}

// ── Multiparty bots (shared by the UK and country engines) ────────────────
// Both engines use the same action verbs, costs, and resource shape, so one
// planner serves both; the caller casts the rows to UkAction[]/CountryAction[].

interface MpActionLike {
  type: "canvass" | "rally" | "ground_game" | "gotv" | "fundraise";
  party: PartyId;
  regionId?: string;
}

interface MpView {
  regions: StateContest[];
  turn: number;
  totalTurns: number;
  funds: number;
  actions: number;
}

// Regions ranked by how close the player sits to the local top rival.
function mpTargets(view: MpView, party: PartyId, max: number) {
  const standing = view.regions.filter((r) => r.baselineShare?.[party] !== undefined);
  const rows = standing.map((r) => {
    const { shareByParty } = tallyRegion(r);
    const mine = shareByParty[party] ?? 0;
    const rival = Math.max(
      0,
      ...Object.keys(shareByParty)
        .filter((p) => p !== party)
        .map((p) => shareByParty[p] ?? 0),
    );
    return { region: r, margin: mine - rival };
  });
  // Winnable = within striking distance of the local lead; fall back to the
  // closest contests outright so small parties still campaign somewhere.
  const winnable = rows.filter((r) => r.margin > -0.2);
  const pool = winnable.length > 0 ? winnable : rows;
  return pool.sort((a, b) => Math.abs(a.margin) - Math.abs(b.margin)).slice(0, max);
}

function mpFocusedActions(view: MpView, party: PartyId): MpActionLike[] {
  const targets = mpTargets(view, party, 4);
  if (targets.length === 0) return [];
  const slots = view.actions;
  const turnsLeft = Math.max(1, view.totalTurns - view.turn);
  const out: MpActionLike[] = [];
  let funds = view.funds;

  if (funds < 2) {
    out.push({ type: "fundraise", party });
    funds += 1.5;
  }
  // One paid push per target: GOTV in the last stretch, field offices earlier;
  // canvass (free) when the kitty is empty. Plus a rally on the closest race.
  out.push({ type: "rally", party, regionId: targets[0].region.id });
  for (const t of targets) {
    if (out.length >= slots) break;
    if (turnsLeft <= 2 && funds >= 1) {
      out.push({ type: "gotv", party, regionId: t.region.id });
      funds -= 1;
    } else if (funds >= 1.5) {
      out.push({ type: "ground_game", party, regionId: t.region.id });
      funds -= 1.5;
    } else {
      out.push({ type: "canvass", party, regionId: t.region.id });
    }
  }
  // Any remaining slots: free canvassing round-robin over the same targets.
  let i = 0;
  while (out.length < slots) {
    out.push({ type: "canvass", party, regionId: targets[i % targets.length].region.id });
    i++;
  }
  return out.slice(0, slots);
}

function mpScattershotActions(view: MpView, party: PartyId): MpActionLike[] {
  const standing = view.regions.filter((r) => r.baselineShare?.[party] !== undefined);
  if (standing.length === 0) return [];
  const slots = view.actions;
  const out: MpActionLike[] = [];
  if (view.funds < 1) out.push({ type: "fundraise", party });
  let i = 0;
  while (out.length < slots) {
    out.push({ type: "canvass", party, regionId: standing[i % standing.length].id });
    i++;
  }
  return out.slice(0, slots);
}

function mpBotActions(bot: BotStrategy, view: MpView, party: PartyId): MpActionLike[] {
  if (bot === "passive") return [];
  if (bot === "focused") return mpFocusedActions(view, party);
  return mpScattershotActions(view, party);
}

// ── Historical baselines (deterministic, no play) ──────────────────────────

export interface ScenarioBaseline {
  winner: string; // baseline winning side/party
  underdog: string; // strongest baseline loser among the sides we field
  sides: string[]; // sides the gauntlet plays for this scenario
}

// The UK gauntlet plays the two GB majors (per the design brief).
const UK_SIDES: PartyId[] = ["lab", "con"];

function countryFor(meta: ScenarioMeta): CountryBundle {
  const bundle = COUNTRIES[meta.country];
  if (!bundle) throw new Error(`No country bundle for ${meta.scenarioId}`);
  return bundle;
}

export function scenarioBaseline(meta: ScenarioMeta): ScenarioBaseline {
  if (meta.engine === "us") {
    const winner = computeResult(createGame({ scenario: meta.nativeId, seed: "gauntlet-baseline" })).winner;
    const w = winner === "tie" ? "dem" : winner;
    return { winner: w, underdog: w === "dem" ? "rep" : "dem", sides: ["dem", "rep"] };
  }
  if (meta.engine === "uk") {
    const r = computeUkResult(createUkGame({ election: meta.nativeId, seed: 1 }));
    const sides = UK_SIDES;
    const winner = sides.includes(r.largestParty) ? r.largestParty : sides[0];
    const underdog =
      sides
        .filter((p) => p !== winner)
        .sort((a, b) => (r.seats[b] ?? 0) - (r.seats[a] ?? 0))[0] ?? sides[0];
    return { winner, underdog, sides: [...sides] };
  }
  const bundle = countryFor(meta);
  const g = createCountryGame(bundle, { election: meta.nativeId, seed: 1 });
  const r = computeCountryResult(g, bundle);
  const sides = playablePartiesIn(bundle, meta.nativeId);
  const winner = sides.includes(r.largestParty) ? r.largestParty : sides[0];
  const underdog =
    sides
      .filter((p) => p !== winner)
      .sort((a, b) => (r.seats[b] ?? 0) - (r.seats[a] ?? 0))[0] ?? sides[0];
  return { winner, underdog, sides: [...sides] };
}

// ── Single-game runners ────────────────────────────────────────────────────

interface RunOutcome {
  won: boolean;
  unitMargin: number;
  blowout: boolean;
  score: number;
  matchedHistory: boolean;
  demEV?: number;
}

function runUsGame(
  meta: ScenarioMeta,
  side: CandidateId,
  bot: BotStrategy,
  difficulty: UsDifficulty,
  seed: string,
  baselineWinner: string,
): RunOutcome {
  let g = beginGame(
    createGame({ scenario: meta.nativeId, playerCandidate: side, seed, difficulty }),
  );
  let guard = 0;
  while (g.phase !== "result" && guard++ < 50) {
    g = advanceTurn(g, usBotActions(bot, g, side), seed, {
      difficulty: DIFFICULTY[difficulty],
      autoResolvePlayerEvents: true,
    });
  }
  const r = g.result ?? computeResult(g);
  const mine = r.electoralVotes[side] ?? 0;
  const theirs = r.electoralVotes[side === "dem" ? "rep" : "dem"] ?? 0;
  return {
    won: r.winner === side,
    unitMargin: mine - 270,
    blowout: Math.abs(mine - theirs) > 538 * 0.25,
    score: computeScoreFromFacts(usScoreFacts(r, side, difficulty)),
    matchedHistory: r.winner === baselineWinner,
    demEV: r.electoralVotes.dem,
  };
}

function mpOutcome(
  seats: Record<PartyId, number>,
  voteShare: Record<PartyId, number>,
  largestParty: PartyId,
  side: PartyId,
  majority: { total: number; threshold: number },
  baselineWinner: string,
): RunOutcome {
  const mine = seats[side] ?? 0;
  const rival = Math.max(
    0,
    ...Object.keys(seats)
      .filter((p) => p !== side)
      .map((p) => seats[p] ?? 0),
  );
  return {
    won: largestParty === side,
    unitMargin: mine - majority.threshold,
    blowout: Math.abs(mine - rival) > majority.total * 0.25,
    score: computeScoreFromFacts(
      multipartyScoreFacts({ seats, voteShare }, side, majority.threshold, majority.total, "normal"),
    ),
    matchedHistory: largestParty === baselineWinner,
  };
}

function runUkGame(meta: ScenarioMeta, side: PartyId, bot: BotStrategy, seed: string, baselineWinner: string): RunOutcome {
  let g: UkGameState = createUkGame({ election: meta.nativeId, playerParty: side, seed });
  let guard = 0;
  while (g.phase !== "result" && guard++ < 30) {
    const view: MpView = {
      regions: g.regions,
      turn: g.turn,
      totalTurns: g.totalTurns,
      funds: g.resources[side].funds,
      actions: g.resources[side].actions,
    };
    g.queuedActions = mpBotActions(bot, view, side) as UkAction[];
    g = ukAdvanceTurn(g);
  }
  const r = g.result ?? computeUkResult(g);
  return mpOutcome(r.seats, r.voteShare, r.largestParty, side, UK_SYSTEM.majority, baselineWinner);
}

function runCountryGame(
  meta: ScenarioMeta,
  side: PartyId,
  bot: BotStrategy,
  seed: string,
  baselineWinner: string,
): RunOutcome {
  const bundle = countryFor(meta);
  let g: CountryGameState = createCountryGame(bundle, {
    election: meta.nativeId,
    playerParty: side,
    seed,
  });
  const majority = majorityFor(g, bundle);
  let guard = 0;
  while (g.phase !== "result" && guard++ < 30) {
    const view: MpView = {
      regions: g.regions,
      turn: g.turn,
      totalTurns: g.totalTurns,
      funds: g.resources[side].funds,
      actions: g.resources[side].actions,
    };
    g.queuedActions = mpBotActions(bot, view, side) as CountryAction[];
    g = countryAdvanceTurn(g, bundle);
  }
  const r = g.result ?? computeCountryResult(g, bundle);
  return mpOutcome(r.seats, r.voteShare, r.largestParty, side, majority, baselineWinner);
}

// ── The gauntlet ───────────────────────────────────────────────────────────

const ALL_BOTS: BotStrategy[] = ["passive", "focused", "scattershot"];
const ALL_US_DIFFS: UsDifficulty[] = ["easy", "normal", "hard"];

function roleFor(side: string, baseline: ScenarioBaseline): SideRole {
  if (side === baseline.winner) return "winner";
  if (side === baseline.underdog) return "underdog";
  return "minor";
}

interface Cell {
  meta: ScenarioMeta;
  baseline: ScenarioBaseline;
  side: string;
  difficulty: GauntletDifficulty;
  bot: BotStrategy;
}

function buildCells(config: GauntletConfig): Cell[] {
  const wanted = config.scenarios ? new Set(config.scenarios) : null;
  const bots = config.bots ?? ALL_BOTS;
  const usDiffs = config.usDifficulties ?? ALL_US_DIFFS;
  const cells: Cell[] = [];
  for (const meta of SCENARIO_REGISTRY) {
    if (wanted && !wanted.has(meta.scenarioId)) continue;
    const baseline = scenarioBaseline(meta);
    let sides = baseline.sides;
    if (config.sides === "winner-underdog") {
      sides = [...new Set([baseline.winner, baseline.underdog])];
    }
    const diffs: GauntletDifficulty[] = meta.engine === "us" ? usDiffs : ["base"];
    for (const side of sides) {
      for (const difficulty of diffs) {
        for (const bot of bots) {
          cells.push({ meta, baseline, side, difficulty, bot });
        }
      }
    }
  }
  return cells;
}

export function runGauntlet(config: GauntletConfig = {}): GauntletRow[] {
  const seeds = config.seedsPerCell ?? 20;
  const cells = buildCells(config);
  const total = cells.length * seeds;
  let done = 0;
  const rows: GauntletRow[] = [];

  for (const cell of cells) {
    const { meta, baseline, side, difficulty, bot } = cell;
    const outcomes: RunOutcome[] = [];
    for (let i = 0; i < seeds; i++) {
      // Deterministic and rerun-identical by construction.
      const seed = `${meta.scenarioId}-${side}-${bot}-${i}`;
      if (meta.engine === "us") {
        outcomes.push(
          runUsGame(meta, side as CandidateId, bot, difficulty as UsDifficulty, seed, baseline.winner),
        );
      } else if (meta.engine === "uk") {
        outcomes.push(runUkGame(meta, side, bot, seed, baseline.winner));
      } else {
        outcomes.push(runCountryGame(meta, side, bot, seed, baseline.winner));
      }
      done++;
      config.onProgress?.(done, total);
    }
    const n = outcomes.length || 1;
    const mean = (f: (o: RunOutcome) => number) => outcomes.reduce((s, o) => s + f(o), 0) / n;
    rows.push({
      scenarioId: meta.scenarioId,
      engine: meta.engine,
      side,
      sideRole: roleFor(side, baseline),
      difficulty,
      bot,
      seeds: outcomes.length,
      winRate: mean((o) => (o.won ? 1 : 0)),
      avgUnitMargin: mean((o) => o.unitMargin),
      blowoutRate: mean((o) => (o.blowout ? 1 : 0)),
      avgScore: mean((o) => o.score),
      historyMatchRate: mean((o) => (o.matchedHistory ? 1 : 0)),
      ...(meta.engine === "us" ? { avgDemEV: mean((o) => o.demEV ?? 0) } : {}),
    });
  }
  return rows;
}

// ── Row queries shared by the test + report ───────────────────────────────

export const easiestDifficultyFor = (engine: ScenarioMeta["engine"]): GauntletDifficulty =>
  engine === "us" ? "easy" : "base";
export const hardestDifficultyFor = (engine: ScenarioMeta["engine"]): GauntletDifficulty =>
  engine === "us" ? "hard" : "base";
export const defaultDifficultyFor = (engine: ScenarioMeta["engine"]): GauntletDifficulty =>
  engine === "us" ? "normal" : "base";

export function findRow(
  rows: GauntletRow[],
  scenarioId: string,
  pred: (r: GauntletRow) => boolean,
): GauntletRow | undefined {
  return rows.find((r) => r.scenarioId === scenarioId && pred(r));
}

// Suggested difficulty label from the focused-bot underdog win rate on the
// engine's default setting; compare against the registry's authored label.
export function suggestedLabel(underdogFocusedWinRate: number): ScenarioMeta["difficulty"] {
  if (underdogFocusedWinRate >= GAUNTLET_THRESHOLDS.labelEasyMin) return "easy";
  if (underdogFocusedWinRate >= GAUNTLET_THRESHOLDS.labelMediumMin) return "medium";
  return "hard";
}
