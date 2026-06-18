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
  // Which political system this election runs under (see content/systems).
  // Absent ⇒ "US" — every existing scenario is a U.S. presidential race, so
  // this stays backward-compatible and the default path is untouched.
  systemId?: string;
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
  // National issue salience for this year (0..1), overriding the issue's base.
  // Omitted issues fall back to content/issues baseSalience; this is how COVID
  // stays out of 2012 and the Iraq war dominates 2004.
  issueSalience?: Partial<Record<IssueId, number>>;
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

const VPS_2008_DEM: RunningMate[] = [
  { id: "biden08", name: "Joe Biden", ticket: "dem", historical: true,
    blurb: "Foreign-policy gravitas and Scranton blue-collar appeal.",
    traitBonuses: { policyKnowledge: 6, debatePrep: 5 }, favorability: { noncollege_white: 0.06, seniors: 0.05 } },
  { id: "hrc08", name: "Hillary Clinton", ticket: "dem",
    blurb: "Unity pick — rallies women and working-class Democrats, raises a fortune.",
    traitBonuses: { debatePrep: 6, fundraisingProwess: 6 }, favorability: { suburban_women: 0.07, noncollege_white: 0.04 }, cashBonus: 12_000_000 },
  { id: "kaine08", name: "Tim Kaine", ticket: "dem",
    blurb: "Virginia governor — puts a new Southern swing state in play.",
    traitBonuses: { charisma: 5, energy: 4 }, favorability: { suburban_women: 0.05, college_white: 0.04 } },
  { id: "bayh08", name: "Evan Bayh", ticket: "dem",
    blurb: "Indiana moderate — reaches the heartland and the blue wall.",
    traitBonuses: { energy: 4, debatePrep: 4 }, favorability: { noncollege_white: 0.07, seniors: 0.04 } },
];

const VPS_2008_REP: RunningMate[] = [
  { id: "palin08", name: "Sarah Palin", ticket: "rep", historical: true,
    blurb: "Electrifies the base — small-town energy and a jolt of enthusiasm.",
    traitBonuses: { charisma: 7, energy: 6 }, favorability: { noncollege_white: 0.08, seniors: 0.03 } },
  { id: "romney08", name: "Mitt Romney", ticket: "rep",
    blurb: "Economic credibility and a deep fundraising network.",
    traitBonuses: { fundraisingProwess: 8, debatePrep: 5 }, favorability: { college_white: 0.05, seniors: 0.04 }, cashBonus: 12_000_000 },
  { id: "tpaw08", name: "Tim Pawlenty", ticket: "rep",
    blurb: "Steady Midwestern governor — quiet appeal in the Rust Belt.",
    traitBonuses: { energy: 4, debatePrep: 4 }, favorability: { noncollege_white: 0.06 } },
  { id: "lieberman08", name: "Joe Lieberman", ticket: "rep",
    blurb: "A bipartisan reach across the aisle for independents.",
    traitBonuses: { debatePrep: 5, intelligence: 4 }, favorability: { suburban_women: 0.05, seniors: 0.04 } },
];

const VPS_2012_DEM: RunningMate[] = [
  { id: "biden12", name: "Joe Biden", ticket: "dem", historical: true,
    blurb: "The loyal number two — blue-collar credibility and a steady hand.",
    traitBonuses: { policyKnowledge: 5, charisma: 4 }, favorability: { noncollege_white: 0.06, seniors: 0.05 } },
  { id: "hrc12", name: "Hillary Clinton", ticket: "dem",
    blurb: "Star power and a fundraising juggernaut — energizes women.",
    traitBonuses: { fundraisingProwess: 7, debatePrep: 5 }, favorability: { suburban_women: 0.07 }, cashBonus: 12_000_000 },
  { id: "castro12", name: "Julián Castro", ticket: "dem",
    blurb: "A Latino rising star — Sun Belt reach and youthful energy.",
    traitBonuses: { charisma: 6, energy: 5 }, favorability: { hispanic: 0.08, youth: 0.04 } },
  { id: "warner12", name: "Mark Warner", ticket: "dem",
    blurb: "Virginia business moderate — courts the center and the suburbs.",
    traitBonuses: { debatePrep: 4, fundraisingProwess: 5 }, favorability: { noncollege_white: 0.05, college_white: 0.04 } },
];

const VPS_2012_REP: RunningMate[] = [
  { id: "ryan12", name: "Paul Ryan", ticket: "rep", historical: true,
    blurb: "Budget wonk — fires up the base and puts Wisconsin in reach.",
    traitBonuses: { policyKnowledge: 7, debatePrep: 5 }, favorability: { noncollege_white: 0.06, seniors: 0.04 } },
  { id: "rubio12", name: "Marco Rubio", ticket: "rep",
    blurb: "Florida Latino outreach — broadens a narrow coalition.",
    traitBonuses: { charisma: 6, debatingSkill: 5 }, favorability: { hispanic: 0.07, suburban_women: 0.03 } },
  { id: "christie12", name: "Chris Christie", ticket: "rep",
    blurb: "Blunt Northeastern closer — a brawler who plays in the suburbs.",
    traitBonuses: { charisma: 6, debatingSkill: 6 }, favorability: { noncollege_white: 0.05, suburban_women: 0.03 } },
  { id: "portman12", name: "Rob Portman", ticket: "rep",
    blurb: "Ohio steady hand — debate-prep ace who locks down the Midwest.",
    traitBonuses: { debatePrep: 6, policyKnowledge: 5 }, favorability: { noncollege_white: 0.06, seniors: 0.03 } },
];

const VPS_2004_DEM: RunningMate[] = [
  { id: "edwards04", name: "John Edwards", ticket: "dem", historical: true,
    blurb: "Southern charmer — 'two Americas' populism and a sunny disposition.",
    traitBonuses: { charisma: 8 }, favorability: { noncollege_white: 0.06, suburban_women: 0.04 } },
  { id: "gephardt04", name: "Dick Gephardt", ticket: "dem",
    blurb: "Labor's champion — locks down union households in the Rust Belt.",
    traitBonuses: { debatePrep: 5, energy: 4 }, favorability: { noncollege_white: 0.08, seniors: 0.03 } },
  { id: "vilsack04", name: "Tom Vilsack", ticket: "dem",
    blurb: "Heartland governor — quiet appeal in the farm-belt battlegrounds.",
    traitBonuses: { energy: 4, debatePrep: 4 }, favorability: { noncollege_white: 0.06, seniors: 0.04 } },
  { id: "clark04", name: "Wesley Clark", ticket: "dem",
    blurb: "Four-star general — credibility on security and the war.",
    traitBonuses: { debatePrep: 6, intelligence: 5 }, favorability: { seniors: 0.05, suburban_women: 0.03 } },
];

const VPS_2004_REP: RunningMate[] = [
  { id: "cheney04", name: "Dick Cheney", ticket: "rep", historical: true,
    blurb: "Wartime gravitas — the steady, hawkish hand of the incumbency.",
    traitBonuses: { debatePrep: 7, policyKnowledge: 6 }, favorability: { seniors: 0.06, noncollege_white: 0.04 } },
  { id: "mccain04", name: "John McCain", ticket: "rep",
    blurb: "Maverick veteran — independents and suburban crossover appeal.",
    traitBonuses: { charisma: 6, debatingSkill: 5 }, favorability: { suburban_women: 0.05, seniors: 0.05 }, cashBonus: 8_000_000 },
  { id: "giuliani04", name: "Rudy Giuliani", ticket: "rep",
    blurb: "America's Mayor — 9/11 security credibility in the suburbs.",
    traitBonuses: { charisma: 6, debatingSkill: 4 }, favorability: { suburban_women: 0.05, noncollege_white: 0.04 } },
  { id: "frist04", name: "Bill Frist", ticket: "rep",
    blurb: "Doctor-senator — a softer, values-and-healthcare emphasis.",
    traitBonuses: { policyKnowledge: 6, debatePrep: 4 }, favorability: { seniors: 0.06 } },
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

const PRIORS_2012: Record<string, number> = {
  AL: 0.385, AK: 0.420, AZ: 0.452, AR: 0.375, CA: 0.604, CO: 0.526, CT: 0.583, DE: 0.595, DC: 0.925,
  FL: 0.500, GA: 0.456, HI: 0.706, ID: 0.335, IL: 0.582, IN: 0.443, IA: 0.522, KS: 0.385, KY: 0.380,
  LA: 0.407, MD: 0.620, MA: 0.605, MI: 0.543, MN: 0.531, MS: 0.440, MO: 0.444, MT: 0.420, NV: 0.529,
  NH: 0.521, NJ: 0.585, NM: 0.547, NY: 0.635, NC: 0.492, ND: 0.391, OH: 0.512, OK: 0.335, OR: 0.543,
  PA: 0.522, RI: 0.638, SC: 0.445, SD: 0.400, TN: 0.390, TX: 0.418, UT: 0.252, VT: 0.674, VA: 0.514,
  WA: 0.563, WV: 0.355, WI: 0.531, WY: 0.290,
  "ME-1": 0.580, "ME-2": 0.530, "ME-AL": 0.565, "NE-1": 0.410, "NE-2": 0.460, "NE-3": 0.300, "NE-AL": 0.380,
};

const PRIORS_2008: Record<string, number> = {
  AL: 0.387, AK: 0.380, AZ: 0.453, AR: 0.390, CA: 0.620, CO: 0.541, CT: 0.615, DE: 0.620, DC: 0.930,
  FL: 0.512, GA: 0.471, HI: 0.720, ID: 0.365, IL: 0.622, IN: 0.501, IA: 0.546, KS: 0.418, KY: 0.413,
  LA: 0.398, MD: 0.620, MA: 0.625, MI: 0.574, MN: 0.546, MS: 0.430, MO: 0.495, MT: 0.473, NV: 0.555,
  NH: 0.545, NJ: 0.572, NM: 0.569, NY: 0.626, NC: 0.501, ND: 0.448, OH: 0.515, OK: 0.343, OR: 0.567,
  PA: 0.547, RI: 0.640, SC: 0.450, SD: 0.448, TN: 0.418, TX: 0.438, UT: 0.345, VT: 0.674, VA: 0.527,
  WA: 0.575, WV: 0.430, WI: 0.564, WY: 0.327,
  "ME-1": 0.600, "ME-2": 0.550, "ME-AL": 0.578, "NE-1": 0.450, "NE-2": 0.500, "NE-3": 0.340, "NE-AL": 0.420,
};

const PRIORS_2004: Record<string, number> = {
  AL: 0.367, AK: 0.360, AZ: 0.443, AR: 0.448, CA: 0.546, CO: 0.471, CT: 0.544, DE: 0.535, DC: 0.900,
  FL: 0.472, GA: 0.413, HI: 0.540, ID: 0.300, IL: 0.547, IN: 0.390, IA: 0.497, KS: 0.360, KY: 0.400,
  LA: 0.420, MD: 0.560, MA: 0.620, MI: 0.512, MN: 0.512, MS: 0.400, MO: 0.464, MT: 0.390, NV: 0.483,
  NH: 0.504, NJ: 0.535, NM: 0.495, NY: 0.585, NC: 0.435, ND: 0.360, OH: 0.487, OK: 0.340, OR: 0.516,
  PA: 0.512, RI: 0.595, SC: 0.410, SD: 0.385, TN: 0.430, TX: 0.385, UT: 0.265, VT: 0.595, VA: 0.455,
  WA: 0.531, WV: 0.435, WI: 0.503, WY: 0.290,
  "ME-1": 0.560, "ME-2": 0.520, "ME-AL": 0.540, "NE-1": 0.330, "NE-2": 0.380, "NE-3": 0.260, "NE-AL": 0.330,
};

// 2008 used the 2000-census apportionment. Net change is zero (still 538) — the
// states that differ from the 2010-census baseline in content/states.ts.
const EV_2008: Record<string, number> = {
  AZ: 10, FL: 27, GA: 15, IA: 7, IL: 21, LA: 9, MA: 12, MI: 17, MO: 11, NV: 5,
  NJ: 15, NY: 31, OH: 20, PA: 21, SC: 8, TX: 34, UT: 5, WA: 11,
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

const OBAMA_2012: ScenarioTicket = {
  name: "Barack Obama", shortName: "Obama", party: "Democratic", color: DEM_BLUE,
  traits: { charisma: 84, energy: 66, debatePrep: 72, intelligence: 82, policyKnowledge: 84, debatingSkill: 76, fundraisingProwess: 86 },
  issuePositions: { economy: -0.25, covid_response: 0, healthcare: -0.55, immigration: -0.3, race_policing: -0.35, climate: -0.45, taxes: -0.35, law_and_order: -0.05, abortion: -0.5, trade: -0.1 },
  baseFavorability: { black: 0.40, youth: 0.16, hispanic: 0.16, college_white: 0.12, suburban_women: 0.10 },
  runningMates: VPS_2012_DEM,
};

const ROMNEY_2012: ScenarioTicket = {
  name: "Mitt Romney", shortName: "Romney", party: "Republican", color: GOP_RED,
  traits: { charisma: 58, energy: 66, debatePrep: 78, intelligence: 76, policyKnowledge: 74, debatingSkill: 74, fundraisingProwess: 84 },
  issuePositions: { economy: 0.5, covid_response: 0, healthcare: 0.4, immigration: 0.5, race_policing: 0.4, climate: 0.45, taxes: 0.6, law_and_order: 0.5, abortion: 0.45, trade: 0.3 },
  baseFavorability: { noncollege_white: 0.20, seniors: 0.14, college_white: 0.06 },
  runningMates: VPS_2012_REP,
};

const OBAMA_2008: ScenarioTicket = {
  name: "Barack Obama", shortName: "Obama", party: "Democratic", color: DEM_BLUE,
  traits: { charisma: 88, energy: 74, debatePrep: 78, intelligence: 82, policyKnowledge: 74, debatingSkill: 80, fundraisingProwess: 88 },
  issuePositions: { economy: -0.3, covid_response: 0, healthcare: -0.5, immigration: -0.3, race_policing: -0.4, climate: -0.5, taxes: -0.35, law_and_order: -0.1, abortion: -0.5, trade: -0.15 },
  baseFavorability: { black: 0.42, youth: 0.20, college_white: 0.16, hispanic: 0.12, suburban_women: 0.10 },
  runningMates: VPS_2008_DEM,
};

const MCCAIN_2008: ScenarioTicket = {
  name: "John McCain", shortName: "McCain", party: "Republican", color: GOP_RED,
  traits: { charisma: 60, energy: 62, debatePrep: 62, intelligence: 64, policyKnowledge: 72, debatingSkill: 62, fundraisingProwess: 58 },
  issuePositions: { economy: 0.4, covid_response: 0, healthcare: 0.3, immigration: 0.2, race_policing: 0.35, climate: 0.3, taxes: 0.5, law_and_order: 0.55, abortion: 0.45, trade: 0.2 },
  baseFavorability: { noncollege_white: 0.24, seniors: 0.14 },
  runningMates: VPS_2008_REP,
};

const KERRY: ScenarioTicket = {
  name: "John Kerry", shortName: "Kerry", party: "Democratic", color: DEM_BLUE,
  traits: { charisma: 52, energy: 60, debatePrep: 82, intelligence: 80, policyKnowledge: 80, debatingSkill: 78, fundraisingProwess: 76 },
  issuePositions: { economy: -0.2, covid_response: 0, healthcare: -0.45, immigration: -0.25, race_policing: -0.25, climate: -0.4, taxes: -0.25, law_and_order: -0.05, abortion: -0.5, trade: -0.05 },
  baseFavorability: { college_white: 0.12, seniors: 0.08, black: 0.30, suburban_women: 0.10 },
  runningMates: VPS_2004_DEM,
};

const BUSH_2004: ScenarioTicket = {
  name: "George W. Bush", shortName: "Bush", party: "Republican", color: GOP_RED,
  traits: { charisma: 64, energy: 64, debatePrep: 56, intelligence: 52, policyKnowledge: 56, debatingSkill: 58, fundraisingProwess: 84 },
  issuePositions: { economy: 0.45, covid_response: 0, healthcare: 0.35, immigration: 0.3, race_policing: 0.4, climate: 0.5, taxes: 0.6, law_and_order: 0.6, abortion: 0.5, trade: 0.25 },
  baseFavorability: { noncollege_white: 0.24, seniors: 0.10, suburban_women: 0.06 },
  runningMates: VPS_2004_REP,
};

// Per-year national issue salience (0..1). covid_response is zeroed out before
// 2020 (and lingers low in 2024); each year leads with its own concerns.
const SAL_2024: Partial<Record<IssueId, number>> = { economy: 0.90, immigration: 0.78, abortion: 0.72, law_and_order: 0.55, healthcare: 0.55, taxes: 0.50, climate: 0.45, race_policing: 0.45, trade: 0.40, covid_response: 0.10 };
const SAL_2016: Partial<Record<IssueId, number>> = { economy: 0.80, immigration: 0.70, trade: 0.65, law_and_order: 0.55, healthcare: 0.55, taxes: 0.50, race_policing: 0.45, abortion: 0.45, climate: 0.35, covid_response: 0 };
const SAL_2012: Partial<Record<IssueId, number>> = { economy: 0.92, healthcare: 0.75, taxes: 0.65, immigration: 0.45, trade: 0.45, abortion: 0.45, climate: 0.40, law_and_order: 0.35, race_policing: 0.35, covid_response: 0 };
const SAL_2008: Partial<Record<IssueId, number>> = { economy: 0.95, healthcare: 0.65, law_and_order: 0.60, taxes: 0.55, immigration: 0.50, trade: 0.50, climate: 0.45, abortion: 0.45, race_policing: 0.40, covid_response: 0 };
const SAL_2004: Partial<Record<IssueId, number>> = { law_and_order: 0.85, economy: 0.70, taxes: 0.60, abortion: 0.55, healthcare: 0.55, immigration: 0.45, trade: 0.45, race_policing: 0.35, climate: 0.30, covid_response: 0 };
const SAL_2000: Partial<Record<IssueId, number>> = { economy: 0.75, healthcare: 0.70, taxes: 0.65, abortion: 0.55, law_and_order: 0.45, trade: 0.45, race_policing: 0.40, immigration: 0.40, climate: 0.35, covid_response: 0 };

export const SCENARIOS: Record<string, Scenario> = {
  "2024": {
    id: "2024", year: 2024, label: "2024 · Harris v. Trump",
    tagline: "Labor Day, 2024. A late switch at the top of the ticket, the Sun Belt and the Blue Wall both in play. Ninety days to find 270.",
    dem: HARRIS, rep: TRUMP_2024, statePriors: PRIORS_2024, evOverrides: EV_2024, evNote: "2020-census apportionment", issueSalience: SAL_2024,
  },
  "2020": {
    id: "2020", year: 2020, label: "2020 · Biden v. Trump",
    tagline: "September 1st, 2020. Sixty-three days to Election Day, a pandemic on the ballot, and a blue wall to rebuild. Get to 270.",
    dem: BIDEN, rep: TRUMP_2020, evNote: "2010-census apportionment",
  },
  "2016": {
    id: "2016", year: 2016, label: "2016 · Clinton v. Trump",
    tagline: "September, 2016. The map looks settled and the blue wall looks safe — but the Rust Belt is restless. Don't be the one who let it crack.",
    dem: CLINTON, rep: TRUMP_2016, statePriors: PRIORS_2016, evNote: "2010-census apportionment", issueSalience: SAL_2016
  },
  "2012": {
    id: "2012", year: 2012, label: "2012 · Obama v. Romney",
    tagline: "Fall, 2012. A slow recovery, a re-election fight, and a turnout war in the swing states. Defend the coalition that made history.",
    dem: OBAMA_2012, rep: ROMNEY_2012, statePriors: PRIORS_2012, evNote: "2010-census apportionment", issueSalience: SAL_2012
  },
  "2008": {
    id: "2008", year: 2008, label: "2008 · Obama v. McCain",
    tagline: "Fall, 2008. An open seat, two wars, and a financial system in free fall. Change is in the air — if your coalition turns out.",
    dem: OBAMA_2008, rep: MCCAIN_2008, statePriors: PRIORS_2008, evOverrides: EV_2008, evNote: "2000-census apportionment", issueSalience: SAL_2008
  },
  "2004": {
    id: "2004", year: 2004, label: "2004 · Bush v. Kerry",
    tagline: "Fall, 2004. A wartime incumbent, a decorated challenger, and a country split down the middle. It runs through Ohio.",
    dem: KERRY, rep: BUSH_2004, statePriors: PRIORS_2004, evOverrides: EV_2008, evNote: "2000-census apportionment", issueSalience: SAL_2004
  },
  "2000": {
    id: "2000", year: 2000, label: "2000 · Gore v. Bush",
    tagline: "Fall, 2000. Peace, prosperity, and a knife's-edge electorate. Every state matters — and a recount is waiting to happen.",
    dem: GORE, rep: BUSH, statePriors: PRIORS_2000, evNote: "modern (2010-census) map", issueSalience: SAL_2000
  },
};

// Display order for the picker (newest first feels current; keep 2020 prominent).
export const SCENARIO_IDS = ["2024", "2020", "2016", "2012", "2008", "2004", "2000"] as const;

export function getScenario(id?: string): Scenario {
  return (id && SCENARIOS[id]) || SCENARIOS["2020"];
}
