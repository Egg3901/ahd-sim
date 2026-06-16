import type {
  BlocId,
  CandidateTraits,
  IssueId,
  Party,
  RunningMate,
} from "@engine/types";
import { CANDIDATES } from "./candidates";
import { RUNNING_MATES } from "./runningMates";

// A scenario fills the engine's two neutral slots (dem / rep) with a specific
// election's tickets, plus that year's state priors and electoral-vote
// apportionment. The engine itself never mentions a candidate by name.
export interface ScenarioTicket {
  name: string;
  shortName: string;
  party: Party;
  color: string;
  traits: CandidateTraits;
  issuePositions: Record<IssueId, number>;
  baseFavorability: Partial<Record<BlocId, number>>;
  // VP shortlist; the historical pick is the default + the AI's choice.
  runningMates: RunningMate[];
}

export interface Scenario {
  id: string;
  year: number;
  // "2020 · Biden v. Trump"
  label: string;
  // One-line setup framing.
  tagline: string;
  dem: ScenarioTicket; // → "dem" slot
  rep: ScenarioTicket; // → "rep" slot
  // Two-party Democratic share per state id; falls back to the state's 2020
  // default where omitted.
  statePriors?: Record<string, number>;
  // Per-state electoral-vote overrides for that cycle's apportionment.
  evOverrides?: Record<string, number>;
  // Apportionment note shown in the UI.
  evNote?: string;
}

const DEM_BLUE = "#2563eb";
const GOP_RED = "#dc2626";

// ─────────────────────────────────────────────────────────────────────────
// Running-mate rosters (period-appropriate). 2020 reuses the existing set.
// ─────────────────────────────────────────────────────────────────────────
const VPS_2016_DEM: RunningMate[] = [
  { id: "kaine", name: "Tim Kaine", ticket: "dem", historical: true,
    blurb: "Virginia steady hand — a reassuring moderate who firms up suburban women and college whites.",
    traitBonuses: { energy: 4, debatePrep: 5 }, favorability: { suburban_women: 0.06, college_white: 0.05 } },
  { id: "warren16", name: "Elizabeth Warren", ticket: "dem",
    blurb: "Progressive firebrand — energizes the base and floods the small-dollar pipeline.",
    traitBonuses: { policyKnowledge: 8, fundraisingProwess: 6 }, favorability: { college_white: 0.07, youth: 0.07 }, cashBonus: 12_000_000 },
  { id: "booker", name: "Cory Booker", ticket: "dem",
    blurb: "Urban energizer — turns out Black and young voters in the cities.",
    traitBonuses: { charisma: 7 }, favorability: { black: 0.08, youth: 0.05 } },
  { id: "castro", name: "Julián Castro", ticket: "dem",
    blurb: "Sun Belt bet — speaks to Latino voters across the Southwest.",
    traitBonuses: { charisma: 5, energy: 5 }, favorability: { hispanic: 0.09, suburban_women: 0.03 } },
];

const VPS_2016_REP: RunningMate[] = [
  { id: "pence16", name: "Mike Pence", ticket: "rep", historical: true,
    blurb: "Evangelical anchor — guarantees the base and steadies the ticket.",
    traitBonuses: { debatePrep: 6, policyKnowledge: 4 }, favorability: { noncollege_white: 0.07, seniors: 0.06 } },
  { id: "gingrich", name: "Newt Gingrich", ticket: "rep",
    blurb: "Bomb-thrower — a relentless debater who dominates the news cycle.",
    traitBonuses: { debatingSkill: 8, debatePrep: 4 }, favorability: { seniors: 0.05, noncollege_white: 0.05 } },
  { id: "christie", name: "Chris Christie", ticket: "rep",
    blurb: "Blunt closer — a brawler who plays in the suburbs and the Rust Belt.",
    traitBonuses: { charisma: 6, debatingSkill: 5 }, favorability: { suburban_women: 0.04, noncollege_white: 0.05 } },
  { id: "sessions", name: "Jeff Sessions", ticket: "rep",
    blurb: "Immigration hardliner — maximizes the non-college base.",
    traitBonuses: { debatePrep: 4, energy: 4 }, favorability: { noncollege_white: 0.09 } },
];

const VPS_2024_DEM: RunningMate[] = [
  { id: "walz", name: "Tim Walz", ticket: "dem", historical: true,
    blurb: "Midwestern everyman — a plain-spoken governor who plays in the Rust Belt.",
    traitBonuses: { charisma: 6, energy: 5 }, favorability: { noncollege_white: 0.07, seniors: 0.04 } },
  { id: "shapiro", name: "Josh Shapiro", ticket: "dem",
    blurb: "Pennsylvania powerhouse — wins the keystone suburbs and raises a fortune.",
    traitBonuses: { charisma: 6, debatingSkill: 5 }, favorability: { suburban_women: 0.06, college_white: 0.05 }, cashBonus: 10_000_000 },
  { id: "kelly", name: "Mark Kelly", ticket: "dem",
    blurb: "Astronaut and veteran — border credibility and Sun Belt reach.",
    traitBonuses: { debatePrep: 5, intelligence: 6 }, favorability: { seniors: 0.05, hispanic: 0.05 } },
  { id: "beshear", name: "Andy Beshear", ticket: "dem",
    blurb: "Red-state crossover — a popular governor who softens rural margins.",
    traitBonuses: { charisma: 6, energy: 4 }, favorability: { noncollege_white: 0.08, seniors: 0.03 } },
];

const VPS_2024_REP: RunningMate[] = [
  { id: "vance", name: "JD Vance", ticket: "rep", historical: true,
    blurb: "Populist heir — sharpens the message for the working-class base.",
    traitBonuses: { debatingSkill: 6, energy: 5 }, favorability: { noncollege_white: 0.08, youth: 0.04 } },
  { id: "rubio", name: "Marco Rubio", ticket: "rep",
    blurb: "Sun Belt bridge — broadens the ticket with Latino and suburban voters.",
    traitBonuses: { charisma: 6, debatePrep: 5 }, favorability: { hispanic: 0.07, suburban_women: 0.04 } },
  { id: "burgum", name: "Doug Burgum", ticket: "rep",
    blurb: "Billionaire bankroll — self-funds a massive late-campaign ad surge.",
    traitBonuses: { fundraisingProwess: 8 }, favorability: { noncollege_white: 0.05 }, cashBonus: 14_000_000 },
  { id: "haley24", name: "Nikki Haley", ticket: "rep",
    blurb: "Suburban bridge — wins back suburban women and college whites.",
    traitBonuses: { charisma: 6, debatingSkill: 6 }, favorability: { suburban_women: 0.08, college_white: 0.06 }, cashBonus: 8_000_000 },
];

const VPS_2000_DEM: RunningMate[] = [
  { id: "lieberman", name: "Joe Lieberman", ticket: "dem", historical: true,
    blurb: "Moralist moderate — reassures seniors and centrist suburbanites.",
    traitBonuses: { debatePrep: 5, intelligence: 5 }, favorability: { seniors: 0.06, suburban_women: 0.04 } },
  { id: "edwards", name: "John Edwards", ticket: "dem",
    blurb: "Southern charmer — a magnetic campaigner who contests the upper South.",
    traitBonuses: { charisma: 8 }, favorability: { noncollege_white: 0.06, suburban_women: 0.04 } },
  { id: "bayh", name: "Evan Bayh", ticket: "dem",
    blurb: "Midwestern moderate — shores up the heartland and the blue wall.",
    traitBonuses: { energy: 4, debatePrep: 5 }, favorability: { noncollege_white: 0.07, seniors: 0.04 } },
  { id: "kerry", name: "John Kerry", ticket: "dem",
    blurb: "Decorated veteran — gravitas and a foreign-policy edge.",
    traitBonuses: { debatingSkill: 6, policyKnowledge: 5 }, favorability: { college_white: 0.05, seniors: 0.04 } },
];

const VPS_2000_REP: RunningMate[] = [
  { id: "cheney", name: "Dick Cheney", ticket: "rep", historical: true,
    blurb: "Gravitas pick — a Washington heavyweight who steadies a thin résumé.",
    traitBonuses: { debatePrep: 7, policyKnowledge: 6 }, favorability: { seniors: 0.06, noncollege_white: 0.04 } },
  { id: "mccain", name: "John McCain", ticket: "rep",
    blurb: "Maverick veteran — independents and suburban crossover appeal.",
    traitBonuses: { charisma: 6, debatingSkill: 5 }, favorability: { suburban_women: 0.05, seniors: 0.05 }, cashBonus: 8_000_000 },
  { id: "powell", name: "Colin Powell", ticket: "rep",
    blurb: "Crossover statesman — a once-in-a-generation reach across the aisle.",
    traitBonuses: { charisma: 7, intelligence: 6 }, favorability: { black: 0.07, suburban_women: 0.05 } },
  { id: "ridge", name: "Tom Ridge", ticket: "rep",
    blurb: "Rust Belt governor — locks down Pennsylvania and the industrial Midwest.",
    traitBonuses: { energy: 5, debatePrep: 4 }, favorability: { noncollege_white: 0.07 } },
];

// ─────────────────────────────────────────────────────────────────────────
// Per-state two-party Democratic share (historical, ~1pt). States omitted from
// a map fall back to the 2020 default baked into content/states.ts.
// ─────────────────────────────────────────────────────────────────────────
const PRIORS_2016: Record<string, number> = {
  AL: 0.353, AK: 0.417, AZ: 0.482, AR: 0.354, CA: 0.661, CO: 0.527, CT: 0.585, DE: 0.560, DC: 0.955,
  FL: 0.492, GA: 0.478, HI: 0.658, ID: 0.312, IL: 0.574, IN: 0.417, IA: 0.462, KS: 0.395, KY: 0.354,
  LA: 0.415, MD: 0.655, MA: 0.655, MI: 0.497, MN: 0.506, MS: 0.416, MO: 0.425, MT: 0.380, NV: 0.515,
  NH: 0.503, NJ: 0.580, NM: 0.533, NY: 0.630, NC: 0.478, ND: 0.312, OH: 0.456, OK: 0.310, OR: 0.560,
  PA: 0.497, RI: 0.585, SC: 0.421, SD: 0.357, TN: 0.372, TX: 0.452, UT: 0.375, VT: 0.671, VA: 0.530,
  WA: 0.595, WV: 0.291, WI: 0.497, WY: 0.242,
  "ME-1": 0.580, "ME-2": 0.435, "ME-AL": 0.512, "NE-1": 0.380, "NE-2": 0.470, "NE-3": 0.220, "NE-AL": 0.346,
};

const PRIORS_2024: Record<string, number> = {
  AL: 0.350, AK: 0.430, AZ: 0.485, AR: 0.337, CA: 0.585, CO: 0.550, CT: 0.565, DE: 0.567, DC: 0.925,
  FL: 0.430, GA: 0.486, HI: 0.605, ID: 0.310, IL: 0.550, IN: 0.400, IA: 0.435, KS: 0.420, KY: 0.350,
  LA: 0.400, MD: 0.625, MA: 0.615, MI: 0.495, MN: 0.510, MS: 0.410, MO: 0.420, MT: 0.400, NV: 0.493,
  NH: 0.509, NJ: 0.520, NM: 0.520, NY: 0.555, NC: 0.478, ND: 0.310, OH: 0.440, OK: 0.335, OR: 0.555,
  PA: 0.487, RI: 0.560, SC: 0.420, SD: 0.360, TN: 0.350, TX: 0.435, UT: 0.400, VT: 0.645, VA: 0.525,
  WA: 0.580, WV: 0.290, WI: 0.496, WY: 0.290,
  "ME-1": 0.570, "ME-2": 0.445, "ME-AL": 0.530, "NE-1": 0.420, "NE-2": 0.525, "NE-3": 0.220, "NE-AL": 0.395,
};

const PRIORS_2000: Record<string, number> = {
  AL: 0.420, AK: 0.310, AZ: 0.470, AR: 0.468, CA: 0.561, CO: 0.435, CT: 0.590, DE: 0.563, DC: 0.900,
  FL: 0.500, GA: 0.435, HI: 0.595, ID: 0.290, IL: 0.560, IN: 0.420, IA: 0.502, KS: 0.390, KY: 0.420,
  LA: 0.455, MD: 0.580, MA: 0.620, MI: 0.524, MN: 0.515, MS: 0.420, MO: 0.485, MT: 0.370, NV: 0.499,
  NH: 0.489, NJ: 0.560, NM: 0.501, NY: 0.620, NC: 0.435, ND: 0.350, OH: 0.482, OK: 0.390, OR: 0.502,
  PA: 0.524, RI: 0.630, SC: 0.420, SD: 0.400, TN: 0.476, TX: 0.390, UT: 0.290, VT: 0.550, VA: 0.455,
  WA: 0.550, WV: 0.465, WI: 0.502, WY: 0.300,
  "ME-1": 0.580, "ME-2": 0.520, "ME-AL": 0.540, "NE-1": 0.350, "NE-2": 0.390, "NE-3": 0.270, "NE-AL": 0.350,
};

// 2024 used the 2020-census apportionment. Net change is zero (the map still
// totals 538) — these are the 13 states that shifted from the 2010-census
// baseline baked into content/states.ts.
const EV_2024: Record<string, number> = {
  TX: 40, FL: 30, CO: 10, MT: 4, NC: 16, OR: 8,
  CA: 54, IL: 19, MI: 15, NY: 28, OH: 17, PA: 19, WV: 4,
};

// ─────────────────────────────────────────────────────────────────────────
// Scenario tickets
// ─────────────────────────────────────────────────────────────────────────
const CLINTON: ScenarioTicket = {
  name: "Hillary Clinton", shortName: "Clinton", party: "Democratic", color: DEM_BLUE,
  traits: { charisma: 55, energy: 60, debatePrep: 78, intelligence: 80, policyKnowledge: 88, debatingSkill: 72, fundraisingProwess: 82 },
  issuePositions: { economy: -0.2, covid_response: 0, healthcare: -0.5, immigration: -0.35, race_policing: -0.35, climate: -0.45, taxes: -0.3, law_and_order: -0.05, abortion: -0.55, trade: -0.1 },
  baseFavorability: { college_white: 0.14, suburban_women: 0.16, black: 0.30, asian_other: 0.10 },
  runningMates: VPS_2016_DEM,
};

const TRUMP_2016: ScenarioTicket = {
  name: "Donald Trump", shortName: "Trump", party: "Republican", color: GOP_RED,
  traits: { charisma: 76, energy: 72, debatePrep: 48, intelligence: 40, policyKnowledge: 48, debatingSkill: 62, fundraisingProwess: 60 },
  issuePositions: { economy: 0.45, covid_response: 0, healthcare: 0.4, immigration: 0.85, race_policing: 0.5, climate: 0.6, taxes: 0.5, law_and_order: 0.65, abortion: 0.45, trade: 0.6 },
  baseFavorability: { noncollege_white: 0.34, seniors: 0.06 },
  runningMates: VPS_2016_REP,
};

const HARRIS: ScenarioTicket = {
  name: "Kamala Harris", shortName: "Harris", party: "Democratic", color: DEM_BLUE,
  traits: { charisma: 64, energy: 72, debatePrep: 66, intelligence: 70, policyKnowledge: 66, debatingSkill: 70, fundraisingProwess: 80 },
  issuePositions: { economy: -0.2, covid_response: 0, healthcare: -0.45, immigration: -0.3, race_policing: -0.4, climate: -0.5, taxes: -0.3, law_and_order: -0.05, abortion: -0.6, trade: -0.1 },
  baseFavorability: { black: 0.30, college_white: 0.14, suburban_women: 0.18, youth: 0.12, asian_other: 0.10 },
  runningMates: VPS_2024_DEM,
};

const TRUMP_2024: ScenarioTicket = {
  name: "Donald Trump", shortName: "Trump", party: "Republican", color: GOP_RED,
  traits: { charisma: 74, energy: 64, debatePrep: 55, intelligence: 42, policyKnowledge: 55, debatingSkill: 66, fundraisingProwess: 74 },
  issuePositions: { economy: 0.5, covid_response: 0, healthcare: 0.4, immigration: 0.85, race_policing: 0.55, climate: 0.65, taxes: 0.55, law_and_order: 0.7, abortion: 0.3, trade: 0.6 },
  baseFavorability: { noncollege_white: 0.34, seniors: 0.06, hispanic: 0.06 },
  runningMates: VPS_2024_REP,
};

const GORE: ScenarioTicket = {
  name: "Al Gore", shortName: "Gore", party: "Democratic", color: DEM_BLUE,
  traits: { charisma: 50, energy: 62, debatePrep: 80, intelligence: 82, policyKnowledge: 85, debatingSkill: 70, fundraisingProwess: 72 },
  issuePositions: { economy: -0.15, covid_response: 0, healthcare: -0.4, immigration: -0.2, race_policing: -0.2, climate: -0.4, taxes: -0.2, law_and_order: 0.0, abortion: -0.45, trade: 0.1 },
  baseFavorability: { seniors: 0.10, college_white: 0.10, black: 0.30, suburban_women: 0.10 },
  runningMates: VPS_2000_DEM,
};

const BUSH: ScenarioTicket = {
  name: "George W. Bush", shortName: "Bush", party: "Republican", color: GOP_RED,
  traits: { charisma: 66, energy: 64, debatePrep: 58, intelligence: 52, policyKnowledge: 55, debatingSkill: 60, fundraisingProwess: 80 },
  issuePositions: { economy: 0.4, covid_response: 0, healthcare: 0.3, immigration: 0.3, race_policing: 0.35, climate: 0.45, taxes: 0.6, law_and_order: 0.5, abortion: 0.45, trade: 0.2 },
  baseFavorability: { noncollege_white: 0.22, seniors: 0.08, suburban_women: 0.06, hispanic: 0.06 },
  runningMates: VPS_2000_REP,
};

// The 2020 tickets reuse the existing candidate + roster content verbatim, so
// the default scenario is byte-identical to the original game.
const BIDEN: ScenarioTicket = {
  ...CANDIDATES.dem,
  runningMates: RUNNING_MATES.dem,
};
const TRUMP_2020: ScenarioTicket = {
  ...CANDIDATES.rep,
  runningMates: RUNNING_MATES.rep,
};

export const SCENARIOS: Record<string, Scenario> = {
  "2024": {
    id: "2024", year: 2024, label: "2024 · Harris v. Trump",
    tagline: "Labor Day, 2024. A late switch at the top of the ticket, the Sun Belt and the Blue Wall both in play. Ninety days to find 270.",
    dem: HARRIS, rep: TRUMP_2024, statePriors: PRIORS_2024, evOverrides: EV_2024, evNote: "2020-census apportionment",
  },
  "2020": {
    id: "2020", year: 2020, label: "2020 · Biden v. Trump",
    tagline: "September 1st, 2020. Sixty-three days to Election Day, a pandemic on the ballot, and a blue wall to rebuild. Get to 270.",
    dem: BIDEN, rep: TRUMP_2020, evNote: "2010-census apportionment",
  },
  "2016": {
    id: "2016", year: 2016, label: "2016 · Clinton v. Trump",
    tagline: "September, 2016. The map looks settled and the blue wall looks safe — but the Rust Belt is restless. Don't be the one who let it crack.",
    dem: CLINTON, rep: TRUMP_2016, statePriors: PRIORS_2016, evNote: "2010-census apportionment",
  },
  "2000": {
    id: "2000", year: 2000, label: "2000 · Gore v. Bush",
    tagline: "Fall, 2000. Peace, prosperity, and a knife's-edge electorate. Every state matters — and a recount is waiting to happen.",
    dem: GORE, rep: BUSH, statePriors: PRIORS_2000, evNote: "modern (2010-census) map",
  },
};

// Display order for the picker (newest first feels current; keep 2020 prominent).
export const SCENARIO_IDS = ["2024", "2020", "2016", "2000"] as const;

export function getScenario(id?: string): Scenario {
  return (id && SCENARIOS[id]) || SCENARIOS["2020"];
}
