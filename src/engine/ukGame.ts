// The UK game: state, setup, actions, turn loop, and result. Reuses the shared
// multiparty vote model + seats curve (multiparty.ts), the seedable RNG, and the
// PoliticalSystem abstraction. Pure + deterministic: same seed ⇒ same game.

import type { PartyId } from "./system";
import type { CauseEntry, Government, SeatResult, StateContest } from "./types";
import { createRng, hashSeed, type Rng } from "./rng";
import { computeSeatsResult, blocPartyShares, tallyRegion } from "./multiparty";
import { UK_SYSTEM, UK_ABSTAINING, PARTY_BY_ID } from "@content/uk/parties";
import { UK_ELECTIONS, type UkElectionData } from "@content/uk/elections";
import { leaderFor, type UkLeader } from "@content/uk/leaders";
import { UK_EVENTS, UK_EVENT_CHANCE, headlineFor, pickTarget } from "@content/uk/events";
import { buildUkRegions } from "./ukSetup";

// Parties a human may lead (GB-wide majors). NI parties + 'oth' are AI/fixed.
export const UK_PLAYABLE: PartyId[] = ["lab", "con", "ld", "ref", "grn", "snp", "pc"];

export interface UkResources {
  funds: number;     // £ millions on hand
  actions: number;   // action slots this week
  maxActions: number;
  momentum: number;  // -100..100
}

// The UK action set mirrors the U.S. one one-for-one (so both games offer the
// same campaign verbs), renamed to British idiom:
//   advertise→broadcast · rally→rally · surrogate→surrogate · fundraise→fundraise
//   ground_game→ground_game (field offices) · gotv→gotv · oppo_research→oppo_research
//   debate_prep→debate_prep · policy_prep→policy_prep (manifesto) · issue_pivot→issue_pivot
// `canvass` is a lightweight, free region shortcut (doorstep campaigning) kept
// alongside the grid; the AI and the region panel both use it.
export type UkActionType =
  | "broadcast"
  | "rally"
  | "surrogate"
  | "fundraise"
  | "ground_game"
  | "gotv"
  | "canvass"
  | "oppo_research"
  | "debate_prep"
  | "policy_prep"
  | "issue_pivot";

export type UkAdMode = "positive" | "contrast" | "issue";

export interface UkAction {
  type: UkActionType;
  party: PartyId;
  regionId?: string;       // region-targeted actions; omitted ⇒ national
  targetParty?: PartyId;   // contrast broadcast / oppo research
  mode?: UkAdMode;         // broadcast mode
  issueId?: string;        // issue broadcast / issue pivot
  spend?: number;          // £M for broadcast
  day?: number;            // 1..7 planner slot (engine applies in queue order)
}

export type UkPhase = "setup" | "campaign" | "result";

export interface UkResult {
  seats: Record<PartyId, number>;
  voteShare: Record<PartyId, number>;
  seatResults: SeatResult[];
  largestParty: PartyId;
  hung: boolean;
  government: Government;
  postMortem: CauseEntry[];
}

export interface UkGameState {
  systemId: "UK";
  seed: number;
  rngState: number;
  turn: number;
  totalTurns: number;
  phase: UkPhase;
  electionId: string;
  label: string;
  tagline: string;
  playerParty: PartyId;
  parties: PartyId[];           // active parties this election
  leaders: Record<PartyId, UkLeader>;
  salience: Record<string, number>;
  regions: StateContest[];
  resources: Record<PartyId, UkResources>;
  causes: CauseEntry[];
  queuedActions: UkAction[];
  abstaining: PartyId[];
  // Rolling campaign-news log (latest first) from fired events.
  news: { turn: number; text: string }[];
  result?: UkResult;
}

// Active parties = the union of parties appearing in any region's result.
function activeParties(election: UkElectionData): PartyId[] {
  const set = new Set<PartyId>();
  for (const r of Object.values(election.regions)) {
    for (const p of Object.keys(r.v)) set.add(p);
    for (const p of Object.keys(r.s)) set.add(p);
  }
  // Stable, sensible order: playable majors first, then the rest.
  const order = [...UK_PLAYABLE, "dup", "sf", "uup", "sdlp", "apni", "oth"];
  return [...set].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

// The human-playable parties that actually contest a given election (e.g. no
// Reform/Green before they existed) — used to gate the setup party picker.
export function playablePartiesIn(electionId: string): PartyId[] {
  const election = UK_ELECTIONS[electionId];
  if (!election) return [...UK_PLAYABLE];
  const active = new Set(activeParties(election));
  return UK_PLAYABLE.filter((p) => active.has(p));
}

export interface NewUkGameOptions {
  seed?: number | string;
  election?: string;
  playerParty?: PartyId;
  totalTurns?: number;
}

export function createUkGame(opts: NewUkGameOptions = {}): UkGameState {
  const election = UK_ELECTIONS[opts.election ?? "2024"] ?? UK_ELECTIONS["2024"];
  const seed = typeof opts.seed === "string" ? hashSeed(opts.seed) : (opts.seed ?? Date.now()) >>> 0;
  const parties = activeParties(election);
  // Guard: a party not contesting this election (e.g. Reform in 1997) can't be
  // led. Fall back to the largest playable party that actually stands.
  const playerParty =
    opts.playerParty && parties.includes(opts.playerParty)
      ? opts.playerParty
      : parties.find((p) => UK_PLAYABLE.includes(p)) ?? parties[0];

  const leaders: Record<PartyId, UkLeader> = {};
  for (const p of parties) leaders[p] = leaderFor(election.id, p, p.toUpperCase());

  const resources: Record<PartyId, UkResources> = {};
  for (const p of parties) {
    const machine = leaders[p].machine;
    resources[p] = {
      funds: 4 + machine / 10,
      actions: 5 + Math.round(leaders[p].energy / 40),
      maxActions: 5 + Math.round(leaders[p].energy / 40),
      momentum: 0,
    };
  }

  return {
    systemId: "UK",
    seed,
    rngState: seed,
    turn: 0,
    totalTurns: opts.totalTurns ?? 6,
    phase: "campaign",
    electionId: election.id,
    label: election.label,
    tagline: election.tagline,
    playerParty,
    parties,
    leaders,
    salience: { ...election.salience },
    regions: buildUkRegions(election),
    resources,
    causes: [],
    queuedActions: [],
    abstaining: [...UK_ABSTAINING],
    news: [],
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const findRegion = (g: UkGameState, id?: string) => g.regions.find((r) => r.id === id);

// Diminishing returns on how far a party's appeal has already been pushed in a
// region (mirrors the U.S. saturation): sustained spend can't run away.
function saturate(bloc: StateContest["blocs"][number], party: PartyId, raw: number): number {
  const acc = Math.abs(bloc.campaignAppeal?.[party] ?? 0);
  const room = Math.max(0.15, 1 - acc / 0.8);
  return raw * room;
}

function addAppeal(g: UkGameState, region: StateContest, party: PartyId, cause: string, delta: number) {
  for (const bloc of region.blocs) {
    if (!bloc.campaignAppeal) bloc.campaignAppeal = {};
    bloc.campaignAppeal[party] = (bloc.campaignAppeal[party] ?? 0) + saturate(bloc, party, delta);
  }
  g.causes.push({ turn: g.turn, stateId: region.id, cause, marginDelta: delta });
}

// ── Actions ──────────────────────────────────────────────────────────────
// Regions where a party actually stands (SNP → Scotland, Plaid → Wales): a
// party absent from the baseline isn't on the ballot there.
const standsIn = (g: UkGameState, party: PartyId) =>
  g.regions.filter((r) => r.baselineShare?.[party] !== undefined);

// The strongest rival to `party` in a region (for contrast / oppo targeting).
function topRivalIn(region: StateContest, party: PartyId): PartyId | undefined {
  const { shareByParty } = tallyRegion(region);
  return Object.keys(shareByParty)
    .filter((p) => p !== party && (shareByParty[p] ?? 0) > 0)
    .sort((x, y) => (shareByParty[y] ?? 0) - (shareByParty[x] ?? 0))[0];
}

function applyUkAction(g: UkGameState, a: UkAction, rng: Rng) {
  const res = g.resources[a.party];
  if (res.actions < 1) return;
  const leader = g.leaders[a.party];
  const skill = 0.85 + leader.charisma / 400;
  const compSkill = 0.85 + leader.competence / 400;
  const region = findRegion(g, a.regionId);
  const spend = (need: number) => { if (res.funds < need) return false; res.funds -= need; return true; };

  switch (a.type) {
    case "canvass": {
      if (!region) return;
      res.actions -= 1;
      addAppeal(g, region, a.party, `${leader.name} doorstep campaign in ${region.abbr}`, 0.05 * skill * (0.9 + rng.next() * 0.2));
      break;
    }
    case "ground_game": {
      // Field offices — a paid, harder push than a free canvass.
      if (!region) return;
      if (!spend(1.5)) return;
      res.actions -= 1;
      region.momentum = clamp(region.momentum + 2, -100, 100);
      addAppeal(g, region, a.party, `${leader.name} field operation in ${region.abbr}`, 0.075 * (0.85 + leader.machine / 300));
      break;
    }
    case "gotv": {
      // Get-out-the-vote — turnout push, strongest where you already lead.
      if (!region) return;
      if (!spend(1)) return;
      res.actions -= 1;
      addAppeal(g, region, a.party, `${leader.name} GOTV drive in ${region.abbr}`, 0.06 * (0.85 + leader.energy / 300));
      break;
    }
    case "rally": {
      if (!region) return;
      res.actions -= 1;
      region.momentum = clamp(region.momentum + 6, -100, 100);
      res.momentum = clamp(res.momentum + 2, -100, 100);
      addAppeal(g, region, a.party, `${leader.name} rally in ${region.abbr}`, 0.045 * skill);
      break;
    }
    case "surrogate": {
      // A big-name stand-in works a region for a modest fee — no momentum bump.
      if (!region) return;
      if (!spend(0.25)) return;
      res.actions -= 1;
      addAppeal(g, region, a.party, `Surrogate stumps for ${leader.name} in ${region.abbr}`, 0.035 * (0.85 + leader.energy / 300));
      break;
    }
    case "broadcast": {
      // Air war. Regional buy if a region is set, else national across every
      // region the party contests. Cost scales with the £M spend slider.
      const cost = Math.max(0.5, a.spend ?? 1.5);
      if (!spend(cost)) return;
      res.actions -= 1;
      const mode = a.mode ?? "positive";
      const targets = region ? [region] : standsIn(g, a.party);
      // Diminishing returns on spend; national spend spreads thinner per region.
      const power = 0.02 * Math.sqrt(cost / 1.5) * (0.85 + leader.machine / 300);
      const per = region ? power : power * 0.8;
      if (mode === "issue" && a.issueId) {
        g.salience[a.issueId] = clamp((g.salience[a.issueId] ?? 0.4) + 0.05, 0, 1);
        for (const t of targets) addAppeal(g, t, a.party, `${leader.name} issue broadcast`, per * 0.7);
      } else if (mode === "contrast") {
        const scope = region ? [region] : targets;
        for (const t of scope) {
          const foe = a.targetParty ?? topRivalIn(t, a.party);
          if (foe) addAppeal(g, t, foe, `${leader.name} contrast broadcast`, -per * 0.9);
        }
      } else {
        for (const t of targets) addAppeal(g, t, a.party, `${leader.name} broadcast`, per);
      }
      res.momentum = clamp(res.momentum + 1, -100, 100);
      break;
    }
    case "oppo_research": {
      // Dig dirt, then drop it — depresses the strongest rival, region or nation.
      if (!spend(2)) return;
      res.actions -= 1;
      const scope = region ? [region] : standsIn(g, a.party);
      for (const t of scope) {
        const foe = a.targetParty ?? topRivalIn(t, a.party);
        if (foe) addAppeal(g, t, foe, `${leader.name}'s team releases dossier on ${foe.toUpperCase()}`, -0.05 * compSkill);
      }
      break;
    }
    case "debate_prep": {
      // Sharpen the leader for the TV debates — national lift + momentum.
      res.actions -= 1;
      for (const t of standsIn(g, a.party)) addAppeal(g, t, a.party, `${leader.name} debate performance`, 0.012 * compSkill);
      res.momentum = clamp(res.momentum + 4, -100, 100);
      break;
    }
    case "policy_prep": {
      // Manifesto launch — competence-driven national credibility bump.
      res.actions -= 1;
      for (const t of standsIn(g, a.party)) addAppeal(g, t, a.party, `${leader.name} manifesto launch`, 0.014 * compSkill);
      res.momentum = clamp(res.momentum + 2, -100, 100);
      break;
    }
    case "issue_pivot": {
      // Reframe the campaign onto a chosen issue: raise its salience + a lift.
      res.actions -= 1;
      if (a.issueId) g.salience[a.issueId] = clamp((g.salience[a.issueId] ?? 0.4) + 0.08, 0, 1);
      for (const t of standsIn(g, a.party)) addAppeal(g, t, a.party, `${leader.name} pivots the campaign`, 0.008 * skill);
      break;
    }
    case "fundraise": {
      res.actions -= 1;
      const haul = (1.5 + leader.machine / 50) * (0.85 + rng.next() * 0.3);
      res.funds += haul;
      g.causes.push({ turn: g.turn, cause: `${leader.name} fundraising (+£${haul.toFixed(1)}M)`, marginDelta: 0 });
      break;
    }
  }
}

// ── Simple multiparty AI: each non-player active major shores up its strongest
// regions and contests its closest ones. Tiered later (P7). ──────────────────
function planAiActions(g: UkGameState, party: PartyId, rng: Rng): UkAction[] {
  const out: UkAction[] = [];
  const budget = g.resources[party].actions;
  // Rank regions by this party's current vote share (campaign where you matter).
  const ranked = g.regions
    .filter((r) => r.baselineShare?.[party] !== undefined)
    .map((r) => ({ r, share: r.baselineShare?.[party] ?? 0 }))
    .sort((a, b) => b.share - a.share);
  for (let i = 0; i < budget && i < ranked.length; i++) {
    const region = ranked[i % Math.max(1, Math.min(ranked.length, 4))].r;
    // Mix of canvass and the occasional rally; fundraise if broke.
    if (g.resources[party].funds < 1 && rng.chance(0.4)) out.push({ type: "fundraise", party });
    else if (rng.chance(0.25)) out.push({ type: "rally", party, regionId: region.id });
    else out.push({ type: "canvass", party, regionId: region.id });
  }
  return out;
}

// Draw and apply at most one campaign event for the week.
function fireUkEvent(g: UkGameState, rng: Rng) {
  if (!rng.chance(UK_EVENT_CHANCE)) return;
  const ev = rng.weightedPick(UK_EVENTS, UK_EVENTS.map((e) => e.weight));
  // The "leader" role targets the largest party right now (the front-runner).
  const proj = computeSeatsResult(g.regions, UK_SYSTEM.majority, g.abstaining);
  const target = pickTarget(ev.role, g.playerParty, proj.largestParty, g.parties, (xs) => rng.pick(xs));
  if (!target) return;

  // Apply the appeal nudge across every region the party stands in.
  if (ev.appeal) {
    for (const region of g.regions) {
      if (region.baselineShare?.[target] === undefined) continue;
      for (const bloc of region.blocs) {
        if (!bloc.campaignAppeal) bloc.campaignAppeal = {};
        bloc.campaignAppeal[target] = (bloc.campaignAppeal[target] ?? 0) + ev.appeal;
      }
    }
    g.causes.push({ turn: g.turn, cause: `${ev.id}: ${target.toUpperCase()}`, marginDelta: ev.appeal });
  }
  if (ev.momentum && g.resources[target]) {
    g.resources[target].momentum = clamp(g.resources[target].momentum + ev.momentum, -100, 100);
  }
  const short = PARTY_BY_ID[target]?.shortName ?? target.toUpperCase();
  g.news = [{ turn: g.turn, text: headlineFor(ev, short) }, ...g.news].slice(0, 12);
}

// ── Turn loop ──────────────────────────────────────────────────────────────
export interface UkAdvanceOptions {
  // Suppress the AI parties (used by the calibration anchor: with nobody
  // campaigning, neutral play must reproduce the real result exactly).
  disableAi?: boolean;
}

export function ukAdvanceTurn(g: UkGameState, opts: UkAdvanceOptions = {}): UkGameState {
  const next: UkGameState = structuredClone(g);
  const rng = createRng(next.rngState);

  // 1. Player's queued actions.
  for (const a of next.queuedActions) applyUkAction(next, a, rng);
  next.queuedActions = [];

  // 2. AI for every other active major party.
  if (!opts.disableAi) {
    for (const p of next.parties) {
      if (p === next.playerParty || !UK_PLAYABLE.includes(p)) continue;
      for (const a of planAiActions(next, p, rng)) applyUkAction(next, a, rng);
    }
  }

  // 3. A campaign event may fire, nudging a party nationally. Suppressed under
  // the calibration anchor so neutral play reproduces history exactly.
  if (!opts.disableAi) fireUkEvent(next, rng);

  // 4. Momentum decays; refresh action pools and live support.
  for (const p of next.parties) {
    next.resources[p].momentum *= 0.7;
    next.resources[p].actions = next.resources[p].maxActions;
  }
  for (const region of next.regions) {
    region.momentum *= 0.6;
    for (const bloc of region.blocs) bloc.support = blocPartyShares(bloc) as typeof bloc.support;
  }

  next.turn += 1;
  next.rngState = rng.state();
  if (next.turn >= next.totalTurns) {
    next.phase = "result";
    next.result = computeUkResult(next);
  }
  return next;
}

// Coalition compatibility: the two main UK rivals (Conservative & Labour) never
// govern together; everyone else is fair game (the Lib Dems have partnered both).
function ukCompatible(lead: PartyId, partner: PartyId): boolean {
  const rivals = new Set(["con", "lab"]);
  if (rivals.has(lead) && rivals.has(partner)) return false;
  return true;
}

export function computeUkResult(g: UkGameState): UkResult {
  const r = computeSeatsResult(g.regions, UK_SYSTEM.majority, g.abstaining, ukCompatible);
  // The post-mortem shows the *player's* biggest self-caused swings (the player's
  // leader name tags their action causes), falling back to the whole campaign if
  // the player sat on their hands.
  const playerName = g.leaders[g.playerParty]?.name ?? "";
  const mine = g.causes.filter((c) => c.marginDelta !== 0 && c.cause.includes(playerName));
  const pool = mine.length > 0 ? mine : g.causes.filter((c) => c.marginDelta !== 0);
  const postMortem = [...pool]
    .sort((a, b) => Math.abs(b.marginDelta) - Math.abs(a.marginDelta))
    .slice(0, 8);
  return { ...r, postMortem };
}

// Live national projection during play (for the seat bar / map).
export function projectUk(g: UkGameState): UkResult {
  return computeUkResult(g);
}

// "What-if" projection: apply the player's currently-queued actions to a clone
// (no AI, no events, no turn advance) and project — so the planner can show the
// seat delta this week's plan would buy. Pure: never mutates the live game.
export function projectUkPreview(g: UkGameState): UkResult {
  if (g.queuedActions.length === 0) return computeUkResult(g);
  const clone = structuredClone(g);
  const rng = createRng(clone.rngState);
  for (const a of clone.queuedActions) applyUkAction(clone, a, rng);
  for (const region of clone.regions)
    for (const bloc of region.blocs) bloc.support = blocPartyShares(bloc) as typeof bloc.support;
  return computeUkResult(clone);
}
