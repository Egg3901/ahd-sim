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
    blurb: "Virginia steady hand: a reassuring moderate who firms up suburban women and college whites.",
    traitBonuses: { energy: 4, debatePrep: 5 }, favorability: { suburban_women: 0.06, college_white: 0.05 } },
  { id: "warren16", name: "Elizabeth Warren", ticket: "dem",
    blurb: "Progressive firebrand: energizes the base and floods the small-dollar pipeline.",
    traitBonuses: { policyKnowledge: 8, fundraisingProwess: 6 }, favorability: { college_white: 0.07, youth: 0.07 }, cashBonus: 12_000_000 },
  { id: "booker", name: "Cory Booker", ticket: "dem",
    blurb: "Urban energizer: turns out Black and young voters in the cities.",
    traitBonuses: { charisma: 7 }, favorability: { black: 0.08, youth: 0.05 } },
  { id: "castro", name: "Julián Castro", ticket: "dem",
    blurb: "Sun Belt bet: speaks to Latino voters across the Southwest.",
    traitBonuses: { charisma: 5, energy: 5 }, favorability: { hispanic: 0.09, suburban_women: 0.03 } },
];

const VPS_2016_REP: RunningMate[] = [
  { id: "pence16", name: "Mike Pence", ticket: "rep", historical: true,
    blurb: "Evangelical anchor: guarantees the base and steadies the ticket.",
    traitBonuses: { debatePrep: 6, policyKnowledge: 4 }, favorability: { noncollege_white: 0.07, seniors: 0.06 } },
  { id: "gingrich", name: "Newt Gingrich", ticket: "rep",
    blurb: "Bomb-thrower: a relentless debater who dominates the news cycle.",
    traitBonuses: { debatingSkill: 8, debatePrep: 4 }, favorability: { seniors: 0.05, noncollege_white: 0.05 } },
  { id: "christie", name: "Chris Christie", ticket: "rep",
    blurb: "Blunt closer: a brawler who plays in the suburbs and the Rust Belt.",
    traitBonuses: { charisma: 6, debatingSkill: 5 }, favorability: { suburban_women: 0.04, noncollege_white: 0.05 } },
  { id: "sessions", name: "Jeff Sessions", ticket: "rep",
    blurb: "Immigration hardliner: maximizes the non-college base.",
    traitBonuses: { debatePrep: 4, energy: 4 }, favorability: { noncollege_white: 0.09 } },
];

const VPS_2024_DEM: RunningMate[] = [
  { id: "walz", name: "Tim Walz", ticket: "dem", historical: true,
    blurb: "Midwestern everyman: a plain-spoken governor who plays in the Rust Belt.",
    traitBonuses: { charisma: 6, energy: 5 }, favorability: { noncollege_white: 0.07, seniors: 0.04 } },
  { id: "shapiro", name: "Josh Shapiro", ticket: "dem",
    blurb: "Pennsylvania powerhouse: wins the keystone suburbs and raises a fortune.",
    traitBonuses: { charisma: 6, debatingSkill: 5 }, favorability: { suburban_women: 0.06, college_white: 0.05 }, cashBonus: 10_000_000 },
  { id: "kelly", name: "Mark Kelly", ticket: "dem",
    blurb: "Astronaut and veteran: border credibility and Sun Belt reach.",
    traitBonuses: { debatePrep: 5, intelligence: 6 }, favorability: { seniors: 0.05, hispanic: 0.05 } },
  { id: "beshear", name: "Andy Beshear", ticket: "dem",
    blurb: "Red-state crossover: a popular governor who softens rural margins.",
    traitBonuses: { charisma: 6, energy: 4 }, favorability: { noncollege_white: 0.08, seniors: 0.03 } },
];

const VPS_2024_REP: RunningMate[] = [
  { id: "vance", name: "JD Vance", ticket: "rep", historical: true,
    blurb: "Populist heir: sharpens the message for the working-class base.",
    traitBonuses: { debatingSkill: 6, energy: 5 }, favorability: { noncollege_white: 0.08, youth: 0.04 } },
  { id: "rubio", name: "Marco Rubio", ticket: "rep",
    blurb: "Sun Belt bridge: broadens the ticket with Latino and suburban voters.",
    traitBonuses: { charisma: 6, debatePrep: 5 }, favorability: { hispanic: 0.07, suburban_women: 0.04 } },
  { id: "burgum", name: "Doug Burgum", ticket: "rep",
    blurb: "Billionaire bankroll: self-funds a massive late-campaign ad surge.",
    traitBonuses: { fundraisingProwess: 8 }, favorability: { noncollege_white: 0.05 }, cashBonus: 14_000_000 },
  { id: "haley24", name: "Nikki Haley", ticket: "rep",
    blurb: "Suburban bridge: wins back suburban women and college whites.",
    traitBonuses: { charisma: 6, debatingSkill: 6 }, favorability: { suburban_women: 0.08, college_white: 0.06 }, cashBonus: 8_000_000 },
];

const VPS_2000_DEM: RunningMate[] = [
  { id: "lieberman", name: "Joe Lieberman", ticket: "dem", historical: true,
    blurb: "Moralist moderate: reassures seniors and centrist suburbanites.",
    traitBonuses: { debatePrep: 5, intelligence: 5 }, favorability: { seniors: 0.06, suburban_women: 0.04 } },
  { id: "edwards", name: "John Edwards", ticket: "dem",
    blurb: "Southern charmer: a magnetic campaigner who contests the upper South.",
    traitBonuses: { charisma: 8 }, favorability: { noncollege_white: 0.06, suburban_women: 0.04 } },
  { id: "bayh", name: "Evan Bayh", ticket: "dem",
    blurb: "Midwestern moderate: shores up the heartland and the blue wall.",
    traitBonuses: { energy: 4, debatePrep: 5 }, favorability: { noncollege_white: 0.07, seniors: 0.04 } },
  { id: "kerry", name: "John Kerry", ticket: "dem",
    blurb: "Decorated veteran: gravitas and a foreign-policy edge.",
    traitBonuses: { debatingSkill: 6, policyKnowledge: 5 }, favorability: { college_white: 0.05, seniors: 0.04 } },
];

const VPS_2000_REP: RunningMate[] = [
  { id: "cheney", name: "Dick Cheney", ticket: "rep", historical: true,
    blurb: "Gravitas pick: a Washington heavyweight who steadies a thin résumé.",
    traitBonuses: { debatePrep: 7, policyKnowledge: 6 }, favorability: { seniors: 0.06, noncollege_white: 0.04 } },
  { id: "mccain", name: "John McCain", ticket: "rep",
    blurb: "Maverick veteran: independents and suburban crossover appeal.",
    traitBonuses: { charisma: 6, debatingSkill: 5 }, favorability: { suburban_women: 0.05, seniors: 0.05 }, cashBonus: 8_000_000 },
  { id: "powell", name: "Colin Powell", ticket: "rep",
    blurb: "Crossover statesman: a once-in-a-generation reach across the aisle.",
    traitBonuses: { charisma: 7, intelligence: 6 }, favorability: { black: 0.07, suburban_women: 0.05 } },
  { id: "ridge", name: "Tom Ridge", ticket: "rep",
    blurb: "Rust Belt governor: locks down Pennsylvania and the industrial Midwest.",
    traitBonuses: { energy: 5, debatePrep: 4 }, favorability: { noncollege_white: 0.07 } },
];

const VPS_2008_DEM: RunningMate[] = [
  { id: "biden08", name: "Joe Biden", ticket: "dem", historical: true,
    blurb: "Foreign-policy gravitas and Scranton blue-collar appeal.",
    traitBonuses: { policyKnowledge: 6, debatePrep: 5 }, favorability: { noncollege_white: 0.06, seniors: 0.05 } },
  { id: "hrc08", name: "Hillary Clinton", ticket: "dem",
    blurb: "Unity pick: rallies women and working-class Democrats, raises a fortune.",
    traitBonuses: { debatePrep: 6, fundraisingProwess: 6 }, favorability: { suburban_women: 0.07, noncollege_white: 0.04 }, cashBonus: 12_000_000 },
  { id: "kaine08", name: "Tim Kaine", ticket: "dem",
    blurb: "Virginia governor: puts a new Southern swing state in play.",
    traitBonuses: { charisma: 5, energy: 4 }, favorability: { suburban_women: 0.05, college_white: 0.04 } },
  { id: "bayh08", name: "Evan Bayh", ticket: "dem",
    blurb: "Indiana moderate: reaches the heartland and the blue wall.",
    traitBonuses: { energy: 4, debatePrep: 4 }, favorability: { noncollege_white: 0.07, seniors: 0.04 } },
];

const VPS_2008_REP: RunningMate[] = [
  { id: "palin08", name: "Sarah Palin", ticket: "rep", historical: true,
    blurb: "Electrifies the base: small-town energy and a jolt of enthusiasm.",
    traitBonuses: { charisma: 7, energy: 6 }, favorability: { noncollege_white: 0.08, seniors: 0.03 } },
  { id: "romney08", name: "Mitt Romney", ticket: "rep",
    blurb: "Economic credibility and a deep fundraising network.",
    traitBonuses: { fundraisingProwess: 8, debatePrep: 5 }, favorability: { college_white: 0.05, seniors: 0.04 }, cashBonus: 12_000_000 },
  { id: "tpaw08", name: "Tim Pawlenty", ticket: "rep",
    blurb: "Steady Midwestern governor: quiet appeal in the Rust Belt.",
    traitBonuses: { energy: 4, debatePrep: 4 }, favorability: { noncollege_white: 0.06 } },
  { id: "lieberman08", name: "Joe Lieberman", ticket: "rep",
    blurb: "A bipartisan reach across the aisle for independents.",
    traitBonuses: { debatePrep: 5, intelligence: 4 }, favorability: { suburban_women: 0.05, seniors: 0.04 } },
];

const VPS_2012_DEM: RunningMate[] = [
  { id: "biden12", name: "Joe Biden", ticket: "dem", historical: true,
    blurb: "The loyal number two: blue-collar credibility and a steady hand.",
    traitBonuses: { policyKnowledge: 5, charisma: 4 }, favorability: { noncollege_white: 0.06, seniors: 0.05 } },
  { id: "hrc12", name: "Hillary Clinton", ticket: "dem",
    blurb: "Star power and a fundraising juggernaut: energizes women.",
    traitBonuses: { fundraisingProwess: 7, debatePrep: 5 }, favorability: { suburban_women: 0.07 }, cashBonus: 12_000_000 },
  { id: "castro12", name: "Julián Castro", ticket: "dem",
    blurb: "A Latino rising star. Sun Belt reach and youthful energy.",
    traitBonuses: { charisma: 6, energy: 5 }, favorability: { hispanic: 0.08, youth: 0.04 } },
  { id: "warner12", name: "Mark Warner", ticket: "dem",
    blurb: "Virginia business moderate: courts the center and the suburbs.",
    traitBonuses: { debatePrep: 4, fundraisingProwess: 5 }, favorability: { noncollege_white: 0.05, college_white: 0.04 } },
];

const VPS_2012_REP: RunningMate[] = [
  { id: "ryan12", name: "Paul Ryan", ticket: "rep", historical: true,
    blurb: "Budget wonk: fires up the base and puts Wisconsin in reach.",
    traitBonuses: { policyKnowledge: 7, debatePrep: 5 }, favorability: { noncollege_white: 0.06, seniors: 0.04 } },
  { id: "rubio12", name: "Marco Rubio", ticket: "rep",
    blurb: "Florida Latino outreach: broadens a narrow coalition.",
    traitBonuses: { charisma: 6, debatingSkill: 5 }, favorability: { hispanic: 0.07, suburban_women: 0.03 } },
  { id: "christie12", name: "Chris Christie", ticket: "rep",
    blurb: "Blunt Northeastern closer: a brawler who plays in the suburbs.",
    traitBonuses: { charisma: 6, debatingSkill: 6 }, favorability: { noncollege_white: 0.05, suburban_women: 0.03 } },
  { id: "portman12", name: "Rob Portman", ticket: "rep",
    blurb: "Ohio steady hand: debate-prep ace who locks down the Midwest.",
    traitBonuses: { debatePrep: 6, policyKnowledge: 5 }, favorability: { noncollege_white: 0.06, seniors: 0.03 } },
];

const VPS_2004_DEM: RunningMate[] = [
  { id: "edwards04", name: "John Edwards", ticket: "dem", historical: true,
    blurb: "Southern charmer: 'two Americas' populism and a sunny disposition.",
    traitBonuses: { charisma: 8 }, favorability: { noncollege_white: 0.06, suburban_women: 0.04 } },
  { id: "gephardt04", name: "Dick Gephardt", ticket: "dem",
    blurb: "Labor's champion: locks down union households in the Rust Belt.",
    traitBonuses: { debatePrep: 5, energy: 4 }, favorability: { noncollege_white: 0.08, seniors: 0.03 } },
  { id: "vilsack04", name: "Tom Vilsack", ticket: "dem",
    blurb: "Heartland governor: quiet appeal in the farm-belt battlegrounds.",
    traitBonuses: { energy: 4, debatePrep: 4 }, favorability: { noncollege_white: 0.06, seniors: 0.04 } },
  { id: "clark04", name: "Wesley Clark", ticket: "dem",
    blurb: "Four-star general: credibility on security and the war.",
    traitBonuses: { debatePrep: 6, intelligence: 5 }, favorability: { seniors: 0.05, suburban_women: 0.03 } },
];

const VPS_2004_REP: RunningMate[] = [
  { id: "cheney04", name: "Dick Cheney", ticket: "rep", historical: true,
    blurb: "Wartime gravitas: the steady, hawkish hand of the incumbency.",
    traitBonuses: { debatePrep: 7, policyKnowledge: 6 }, favorability: { seniors: 0.06, noncollege_white: 0.04 } },
  { id: "mccain04", name: "John McCain", ticket: "rep",
    blurb: "Maverick veteran: independents and suburban crossover appeal.",
    traitBonuses: { charisma: 6, debatingSkill: 5 }, favorability: { suburban_women: 0.05, seniors: 0.05 }, cashBonus: 8_000_000 },
  { id: "giuliani04", name: "Rudy Giuliani", ticket: "rep",
    blurb: "America's Mayor. 9/11 security credibility in the suburbs.",
    traitBonuses: { charisma: 6, debatingSkill: 4 }, favorability: { suburban_women: 0.05, noncollege_white: 0.04 } },
  { id: "frist04", name: "Bill Frist", ticket: "rep",
    blurb: "Doctor-senator: a softer, values-and-healthcare emphasis.",
    traitBonuses: { policyKnowledge: 6, debatePrep: 4 }, favorability: { seniors: 0.06 } },
];

const VPS_1996_DEM: RunningMate[] = [
  { id: "gore96", name: "Al Gore", ticket: "dem", historical: true,
    blurb: "The incumbent partner: the administration's wonk-in-chief and its bridge to the future.",
    traitBonuses: { policyKnowledge: 7, debatePrep: 5 }, favorability: { college_white: 0.05, youth: 0.04 } },
  { id: "kerrey96", name: "Bob Kerrey", ticket: "dem",
    blurb: "Medal of Honor senator: heartland grit and entitlement-reform credentials.",
    traitBonuses: { debatePrep: 5, intelligence: 4 }, favorability: { noncollege_white: 0.06, seniors: 0.04 } },
  { id: "gephardt96", name: "Dick Gephardt", ticket: "dem",
    blurb: "Labor's champion: locks down union households in the Rust Belt.",
    traitBonuses: { debatePrep: 5, energy: 4 }, favorability: { noncollege_white: 0.08, seniors: 0.03 } },
  { id: "bradley96", name: "Bill Bradley", ticket: "dem",
    blurb: "Senator-statesman: a cerebral reformer with crossover appeal.",
    traitBonuses: { intelligence: 6, policyKnowledge: 5 }, favorability: { college_white: 0.06, suburban_women: 0.03 } },
];

const VPS_1996_REP: RunningMate[] = [
  { id: "kemp96", name: "Jack Kemp", ticket: "rep", historical: true,
    blurb: "Supply-side evangelist: sunny tax-cut optimism and rare outreach beyond the base.",
    traitBonuses: { charisma: 5, policyKnowledge: 6 }, favorability: { noncollege_white: 0.05, black: 0.04 } },
  { id: "mccain96", name: "John McCain", ticket: "rep",
    blurb: "Maverick veteran: independents and suburban crossover appeal.",
    traitBonuses: { charisma: 6, debatingSkill: 5 }, favorability: { suburban_women: 0.05, seniors: 0.05 }, cashBonus: 6_000_000 },
  { id: "powell96", name: "Colin Powell", ticket: "rep",
    blurb: "Crossover statesman: the general everyone wants and no one can get.",
    traitBonuses: { charisma: 7, intelligence: 6 }, favorability: { black: 0.07, suburban_women: 0.05 } },
  { id: "mack96", name: "Connie Mack", ticket: "rep",
    blurb: "Florida conservative: a Sun Belt anchor for a must-win state.",
    traitBonuses: { energy: 4, debatePrep: 4 }, favorability: { seniors: 0.06 } },
];

const VPS_1992_DEM: RunningMate[] = [
  { id: "gore92", name: "Al Gore", ticket: "dem", historical: true,
    blurb: "The double-down pick: two young Southern moderates, one generational message.",
    traitBonuses: { policyKnowledge: 6, energy: 5 }, favorability: { college_white: 0.05, youth: 0.05 } },
  { id: "kerrey92", name: "Bob Kerrey", ticket: "dem",
    blurb: "Medal of Honor senator: war-hero ballast for a draft-dogged nominee.",
    traitBonuses: { debatePrep: 5, intelligence: 4 }, favorability: { noncollege_white: 0.06, seniors: 0.04 } },
  { id: "wofford92", name: "Harris Wofford", ticket: "dem",
    blurb: "Health-care herald: the senator whose upset win wrote this year's script.",
    traitBonuses: { policyKnowledge: 6, debatePrep: 4 }, favorability: { seniors: 0.06, noncollege_white: 0.04 } },
  { id: "hamilton92", name: "Lee Hamilton", ticket: "dem",
    blurb: "Foreign-policy gravitas from the Indiana heartland.",
    traitBonuses: { policyKnowledge: 6, intelligence: 5 }, favorability: { seniors: 0.05, noncollege_white: 0.04 } },
];

const VPS_1992_REP: RunningMate[] = [
  { id: "quayle92", name: "Dan Quayle", ticket: "rep", historical: true,
    blurb: "The embattled incumbent number two: keeps the family-values base on board.",
    traitBonuses: { energy: 5, debatePrep: 3 }, favorability: { noncollege_white: 0.05, seniors: 0.04 } },
  { id: "powell92", name: "Colin Powell", ticket: "rep",
    blurb: "Desert Storm's chairman: the dump-Quayle dream ticket.",
    traitBonuses: { charisma: 7, intelligence: 6 }, favorability: { black: 0.07, suburban_women: 0.05 } },
  { id: "cheney92", name: "Dick Cheney", ticket: "rep",
    blurb: "The Defense Secretary: wartime competence for a change election.",
    traitBonuses: { debatePrep: 6, policyKnowledge: 6 }, favorability: { seniors: 0.05, noncollege_white: 0.04 } },
  { id: "kemp92", name: "Jack Kemp", ticket: "rep",
    blurb: "Supply-side insurgent: energy and ideas for a tired incumbency.",
    traitBonuses: { charisma: 5, policyKnowledge: 5 }, favorability: { noncollege_white: 0.05, black: 0.03 } },
];

const VPS_1988_DEM: RunningMate[] = [
  { id: "bentsen88", name: "Lloyd Bentsen", ticket: "dem", historical: true,
    blurb: "Texas gravitas: the Boston-Austin axis reborn, and the debate line of the decade.",
    traitBonuses: { debatePrep: 7, debatingSkill: 6 }, favorability: { seniors: 0.06, noncollege_white: 0.04 } },
  { id: "glenn88", name: "John Glenn", ticket: "dem",
    blurb: "The astronaut-senator. Ohio, and a name every household knows.",
    traitBonuses: { intelligence: 5, debatePrep: 4 }, favorability: { seniors: 0.06, noncollege_white: 0.04 } },
  { id: "jackson88", name: "Jesse Jackson", ticket: "dem",
    blurb: "The runner-up: electrifies the base and dares the middle.",
    traitBonuses: { charisma: 8, energy: 6 }, favorability: { black: 0.10, youth: 0.05 } },
  { id: "graham88", name: "Bob Graham", ticket: "dem",
    blurb: "Florida's workhorse governor-senator. Sun Belt reach.",
    traitBonuses: { energy: 4, debatePrep: 4 }, favorability: { seniors: 0.05, suburban_women: 0.03 } },
];

const VPS_1988_REP: RunningMate[] = [
  { id: "quayle88", name: "Dan Quayle", ticket: "rep", historical: true,
    blurb: "Youth and telegenic energy: a generational bet that draws fire.",
    traitBonuses: { energy: 6, charisma: 3 }, favorability: { noncollege_white: 0.04, youth: 0.03 } },
  { id: "dole88", name: "Bob Dole", ticket: "rep",
    blurb: "The Senate warhorse: a primary rival turned running mate, gravitas guaranteed.",
    traitBonuses: { debatePrep: 6, policyKnowledge: 6 }, favorability: { seniors: 0.06, noncollege_white: 0.04 } },
  { id: "kemp88", name: "Jack Kemp", ticket: "rep",
    blurb: "Supply-side favorite: keeps the Reagan coalition's optimists on board.",
    traitBonuses: { charisma: 5, policyKnowledge: 5 }, favorability: { noncollege_white: 0.05, black: 0.03 } },
  { id: "edole88", name: "Elizabeth Dole", ticket: "rep",
    blurb: "Cabinet star: a barrier-breaking pick aimed at the suburbs.",
    traitBonuses: { charisma: 5, debatePrep: 4 }, favorability: { suburban_women: 0.07, college_white: 0.03 } },
];

const VPS_1984_DEM: RunningMate[] = [
  { id: "ferraro84", name: "Geraldine Ferraro", ticket: "dem", historical: true,
    blurb: "The first: a Queens congresswoman who makes history and electrifies the ticket.",
    traitBonuses: { charisma: 6, energy: 5 }, favorability: { suburban_women: 0.07, college_white: 0.04 } },
  { id: "hart84", name: "Gary Hart", ticket: "dem",
    blurb: "New Ideas rival: generational contrast against the oldest nominee ever.",
    traitBonuses: { charisma: 6, intelligence: 5 }, favorability: { youth: 0.07, college_white: 0.05 } },
  { id: "feinstein84", name: "Dianne Feinstein", ticket: "dem",
    blurb: "San Francisco's steady mayor: executive polish, and history on offer.",
    traitBonuses: { debatePrep: 5, intelligence: 5 }, favorability: { suburban_women: 0.06, seniors: 0.03 } },
  { id: "bradley84", name: "Tom Bradley", ticket: "dem",
    blurb: "Los Angeles's coalition-builder: calm, historic, and battle-tested statewide.",
    traitBonuses: { charisma: 5, debatePrep: 4 }, favorability: { black: 0.08, hispanic: 0.04 } },
];

const VPS_1984_REP: RunningMate[] = [
  { id: "bush84", name: "George Bush", ticket: "rep", historical: true,
    blurb: "The loyal incumbent: résumé, restraint, and a steady second term.",
    traitBonuses: { policyKnowledge: 6, debatePrep: 5 }, favorability: { seniors: 0.05, suburban_women: 0.04 } },
  { id: "baker84", name: "Howard Baker", ticket: "rep",
    blurb: "The Great Conciliator. Senate command for the second-term agenda.",
    traitBonuses: { policyKnowledge: 5, debatePrep: 5 }, favorability: { seniors: 0.05, college_white: 0.03 } },
  { id: "dole84", name: "Bob Dole", ticket: "rep",
    blurb: "The Senate warhorse: a legislative closer for the second term.",
    traitBonuses: { debatePrep: 6, policyKnowledge: 5 }, favorability: { seniors: 0.06 } },
  { id: "kirkpatrick84", name: "Jeane Kirkpatrick", ticket: "rep",
    blurb: "The 'blame America first' speech: hawkish star power straight from the UN.",
    traitBonuses: { intelligence: 6, debatingSkill: 5 }, favorability: { seniors: 0.04, noncollege_white: 0.04 } },
];

const VPS_1980_DEM: RunningMate[] = [
  { id: "mondale80", name: "Walter Mondale", ticket: "dem", historical: true,
    blurb: "The incumbent partner: labor's friend and a steady Washington hand.",
    traitBonuses: { policyKnowledge: 6, debatePrep: 5 }, favorability: { noncollege_white: 0.06, seniors: 0.05 } },
  { id: "muskie80", name: "Ed Muskie", ticket: "dem",
    blurb: "The Secretary of State. New England gravitas for a foreign-policy year.",
    traitBonuses: { policyKnowledge: 6, intelligence: 5 }, favorability: { seniors: 0.05, college_white: 0.04 } },
  { id: "jackson80", name: "Henry 'Scoop' Jackson", ticket: "dem",
    blurb: "Cold War Democrat: defense credibility against the Reagan charge.",
    traitBonuses: { policyKnowledge: 6, debatePrep: 4 }, favorability: { seniors: 0.05, noncollege_white: 0.05 } },
  { id: "church80", name: "Frank Church", ticket: "dem",
    blurb: "Idaho's liberal lion. Western reach and Senate stature.",
    traitBonuses: { debatingSkill: 5, intelligence: 4 }, favorability: { college_white: 0.05, seniors: 0.03 } },
];

const VPS_1980_REP: RunningMate[] = [
  { id: "bush80", name: "George Bush", ticket: "rep", historical: true,
    blurb: "The primary rival: 'voodoo economics' forgiven, the moderates reassured.",
    traitBonuses: { policyKnowledge: 6, debatePrep: 5 }, favorability: { suburban_women: 0.05, college_white: 0.05 } },
  { id: "ford80", name: "Gerald Ford", ticket: "rep",
    blurb: "The dream ticket: a former president as co-pilot, if the deal can hold.",
    traitBonuses: { policyKnowledge: 7, debatePrep: 5 }, favorability: { seniors: 0.07, noncollege_white: 0.04 } },
  { id: "laxalt80", name: "Paul Laxalt", ticket: "rep",
    blurb: "The best friend. Reagan's Nevada confidant and truest believer.",
    traitBonuses: { energy: 4, debatePrep: 4 }, favorability: { noncollege_white: 0.05, seniors: 0.03 } },
  { id: "kemp80", name: "Jack Kemp", ticket: "rep",
    blurb: "The young supply-sider. Kemp-Roth is already the platform; why not the ticket?",
    traitBonuses: { charisma: 5, policyKnowledge: 5 }, favorability: { noncollege_white: 0.05, youth: 0.04 } },
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

// Perot's 19% (and 8.4% in '96) is absorbed by the two-party normalization —
// these are Clinton's shares of the Clinton+Dole and Clinton+Bush vote.
const PRIORS_1996: Record<string, number> = {
  AL: 0.463, AK: 0.396, AZ: 0.512, AR: 0.593, CA: 0.572, CO: 0.492, CT: 0.603, DE: 0.586, DC: 0.902,
  FL: 0.532, GA: 0.494, HI: 0.643, ID: 0.392, IL: 0.596, IN: 0.469, IA: 0.558, KS: 0.399, KY: 0.505,
  LA: 0.566, MD: 0.586, MA: 0.686, MI: 0.573, MN: 0.594, MS: 0.473, MO: 0.535, MT: 0.484, NV: 0.506,
  NH: 0.556, NJ: 0.599, NM: 0.540, NY: 0.660, NC: 0.475, ND: 0.461, OH: 0.536, OK: 0.456, OR: 0.547,
  PA: 0.552, RI: 0.690, SC: 0.469, SD: 0.480, TN: 0.513, TX: 0.473, UT: 0.380, VT: 0.632, VA: 0.489,
  WA: 0.572, WV: 0.583, WI: 0.559, WY: 0.425,
  "ME-1": 0.645, "ME-2": 0.605, "ME-AL": 0.626, "NE-1": 0.400, "NE-2": 0.440, "NE-3": 0.340, "NE-AL": 0.395,
};

const PRIORS_1992: Record<string, number> = {
  AL: 0.462, AK: 0.434, AZ: 0.487, AR: 0.600, CA: 0.585, CO: 0.528, CT: 0.541, DE: 0.552, DC: 0.903,
  FL: 0.488, GA: 0.503, HI: 0.567, ID: 0.403, IL: 0.586, IN: 0.462, IA: 0.537, KS: 0.464, KY: 0.519,
  LA: 0.527, MD: 0.583, MA: 0.621, MI: 0.546, MN: 0.577, MS: 0.451, MO: 0.565, MT: 0.517, NV: 0.519,
  NH: 0.508, NJ: 0.514, NM: 0.552, NY: 0.594, NC: 0.496, ND: 0.421, OH: 0.512, OK: 0.444, OR: 0.567,
  PA: 0.555, RI: 0.618, SC: 0.454, SD: 0.477, TN: 0.526, TX: 0.477, UT: 0.363, VT: 0.603, VA: 0.474,
  WA: 0.576, WV: 0.578, WI: 0.528, WY: 0.462,
  "ME-1": 0.585, "ME-2": 0.535, "ME-AL": 0.561, "NE-1": 0.390, "NE-2": 0.430, "NE-3": 0.335, "NE-AL": 0.387,
};

const PRIORS_1988: Record<string, number> = {
  AL: 0.402, AK: 0.379, AZ: 0.392, AR: 0.428, CA: 0.482, CO: 0.460, CT: 0.474, DE: 0.438, DC: 0.852,
  FL: 0.387, GA: 0.398, HI: 0.548, ID: 0.367, IL: 0.489, IN: 0.399, IA: 0.551, KS: 0.433, KY: 0.442,
  LA: 0.448, MD: 0.485, MA: 0.540, MI: 0.460, MN: 0.535, MS: 0.395, MO: 0.480, MT: 0.470, NV: 0.392,
  NH: 0.368, NJ: 0.431, NM: 0.475, NY: 0.521, NC: 0.418, ND: 0.434, OH: 0.445, OK: 0.416, OR: 0.524,
  PA: 0.488, RI: 0.559, SC: 0.379, SD: 0.468, TN: 0.418, TX: 0.436, UT: 0.326, VT: 0.482, VA: 0.396,
  WA: 0.508, WV: 0.524, WI: 0.518, WY: 0.386,
  "ME-1": 0.465, "ME-2": 0.420, "ME-AL": 0.443, "NE-1": 0.400, "NE-2": 0.440, "NE-3": 0.340, "NE-AL": 0.394,
};

const PRIORS_1984: Record<string, number> = {
  AL: 0.388, AK: 0.310, AZ: 0.329, AR: 0.388, CA: 0.418, CO: 0.356, CT: 0.390, DE: 0.400, DC: 0.862,
  FL: 0.347, GA: 0.398, HI: 0.443, ID: 0.267, IL: 0.435, IN: 0.379, IA: 0.463, KS: 0.330, KY: 0.396,
  LA: 0.386, MD: 0.472, MA: 0.486, MI: 0.404, MN: 0.501, MS: 0.377, MO: 0.400, MT: 0.387, NV: 0.327,
  NH: 0.311, NJ: 0.395, NM: 0.396, NY: 0.460, NC: 0.380, ND: 0.343, OH: 0.405, OK: 0.309, OR: 0.439,
  PA: 0.463, RI: 0.481, SC: 0.359, SD: 0.367, TN: 0.418, TX: 0.362, UT: 0.249, VT: 0.413, VA: 0.373,
  WA: 0.433, WV: 0.447, WI: 0.454, WY: 0.286,
  "ME-1": 0.410, "ME-2": 0.370, "ME-AL": 0.390, "NE-1": 0.295, "NE-2": 0.330, "NE-3": 0.240, "NE-AL": 0.290,
};

// Anderson's 6.6% is absorbed by the two-party normalization — Carter's share
// of the Carter+Reagan vote (which is why MA/NY sit just under .5 here).
const PRIORS_1980: Record<string, number> = {
  AL: 0.493, AK: 0.327, AZ: 0.318, AR: 0.497, CA: 0.405, CO: 0.361, CT: 0.444, DE: 0.487, DC: 0.848,
  FL: 0.410, GA: 0.576, HI: 0.511, ID: 0.275, IL: 0.456, IN: 0.402, IA: 0.429, KS: 0.365, KY: 0.492,
  LA: 0.472, MD: 0.516, MA: 0.497, MI: 0.464, MN: 0.522, MS: 0.493, MO: 0.464, MT: 0.363, NV: 0.301,
  NH: 0.330, NJ: 0.426, NM: 0.401, NY: 0.485, NC: 0.489, ND: 0.291, OH: 0.443, OK: 0.366, OR: 0.445,
  PA: 0.461, RI: 0.562, SC: 0.493, SD: 0.344, TN: 0.498, TX: 0.428, UT: 0.221, VT: 0.464, VA: 0.432,
  WA: 0.429, WV: 0.524, WI: 0.474, WY: 0.309,
  "ME-1": 0.495, "ME-2": 0.465, "ME-AL": 0.481, "NE-1": 0.290, "NE-2": 0.320, "NE-3": 0.240, "NE-AL": 0.284,
};

// 1992 and 1996 ran on the 1990-census apportionment — the states that differ
// from the 2010-census baseline. ME (4) and NE (5) are unchanged.
const EV_1992: Record<string, number> = {
  CA: 54, NY: 33, TX: 32, FL: 25, PA: 23, IL: 22, OH: 21, MI: 18, NJ: 15, NC: 14,
  GA: 13, IN: 12, MA: 12, MO: 11, WA: 11, WI: 11, LA: 9, AZ: 8, CO: 8, CT: 8,
  OK: 8, SC: 8, IA: 7, MS: 7, UT: 5, NV: 4,
};

// 1984 and 1988 ran on the 1980-census apportionment.
const EV_1984: Record<string, number> = {
  CA: 47, NY: 36, TX: 29, PA: 25, IL: 24, OH: 23, FL: 21, MI: 20, NJ: 16, MA: 13,
  NC: 13, GA: 12, IN: 12, VA: 12, MO: 11, WI: 11, LA: 10, WA: 10, KY: 9, AZ: 7,
  CO: 8, CT: 8, IA: 8, OK: 8, SC: 8, KS: 7, MS: 7, WV: 6, UT: 5, MT: 4, NV: 4,
};

// 1980 ran on the 1970-census apportionment (New York's 41 EV high-water mark).
const EV_1980: Record<string, number> = {
  CA: 45, NY: 41, PA: 27, IL: 26, TX: 26, OH: 25, MI: 21, NJ: 17, FL: 17, MA: 14,
  IN: 13, NC: 13, GA: 12, MO: 12, VA: 12, WI: 11, LA: 10, TN: 10, KY: 9, WA: 9,
  CT: 8, IA: 8, OK: 8, SC: 8, CO: 7, KS: 7, MS: 7, AZ: 6, OR: 6, WV: 6, MT: 4,
  NM: 4, SD: 4, UT: 4, NV: 3,
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

const CLINTON_1996: ScenarioTicket = {
  name: "Bill Clinton", shortName: "Clinton", party: "Democratic", color: DEM_BLUE,
  traits: { charisma: 88, energy: 74, debatePrep: 76, intelligence: 80, policyKnowledge: 84, debatingSkill: 82, fundraisingProwess: 82 },
  issuePositions: { economy: -0.1, covid_response: 0, healthcare: -0.35, immigration: -0.1, race_policing: -0.1, climate: -0.3, taxes: -0.15, law_and_order: 0.15, abortion: -0.45, trade: 0.25 },
  baseFavorability: { black: 0.32, noncollege_white: 0.08, suburban_women: 0.10, youth: 0.08, hispanic: 0.10 },
  runningMates: VPS_1996_DEM,
};

const DOLE: ScenarioTicket = {
  name: "Bob Dole", shortName: "Dole", party: "Republican", color: GOP_RED,
  traits: { charisma: 45, energy: 55, debatePrep: 70, intelligence: 72, policyKnowledge: 82, debatingSkill: 64, fundraisingProwess: 66 },
  issuePositions: { economy: 0.35, covid_response: 0, healthcare: 0.3, immigration: 0.3, race_policing: 0.3, climate: 0.35, taxes: 0.65, law_and_order: 0.5, abortion: 0.4, trade: 0.15 },
  baseFavorability: { seniors: 0.14, noncollege_white: 0.12 },
  runningMates: VPS_1996_REP,
};

const CLINTON_1992: ScenarioTicket = {
  name: "Bill Clinton", shortName: "Clinton", party: "Democratic", color: DEM_BLUE,
  traits: { charisma: 90, energy: 82, debatePrep: 74, intelligence: 80, policyKnowledge: 82, debatingSkill: 80, fundraisingProwess: 74 },
  issuePositions: { economy: -0.25, covid_response: 0, healthcare: -0.4, immigration: -0.1, race_policing: 0.0, climate: -0.25, taxes: -0.2, law_and_order: 0.1, abortion: -0.45, trade: 0.2 },
  baseFavorability: { black: 0.30, noncollege_white: 0.10, youth: 0.10, hispanic: 0.08 },
  runningMates: VPS_1992_DEM,
};

const BUSH_1992: ScenarioTicket = {
  name: "George Bush", shortName: "Bush", party: "Republican", color: GOP_RED,
  traits: { charisma: 52, energy: 56, debatePrep: 66, intelligence: 72, policyKnowledge: 84, debatingSkill: 58, fundraisingProwess: 72 },
  issuePositions: { economy: 0.3, covid_response: 0, healthcare: 0.35, immigration: 0.2, race_policing: 0.35, climate: 0.3, taxes: 0.45, law_and_order: 0.5, abortion: 0.4, trade: 0.3 },
  baseFavorability: { seniors: 0.10, noncollege_white: 0.10, suburban_women: 0.04 },
  runningMates: VPS_1992_REP,
};

const DUKAKIS: ScenarioTicket = {
  name: "Michael Dukakis", shortName: "Dukakis", party: "Democratic", color: DEM_BLUE,
  traits: { charisma: 42, energy: 62, debatePrep: 80, intelligence: 82, policyKnowledge: 84, debatingSkill: 60, fundraisingProwess: 62 },
  issuePositions: { economy: -0.25, covid_response: 0, healthcare: -0.4, immigration: -0.25, race_policing: -0.35, climate: -0.35, taxes: -0.3, law_and_order: -0.35, abortion: -0.45, trade: -0.1 },
  baseFavorability: { college_white: 0.10, black: 0.26, hispanic: 0.12 },
  runningMates: VPS_1988_DEM,
};

const BUSH_1988: ScenarioTicket = {
  name: "George Bush", shortName: "Bush", party: "Republican", color: GOP_RED,
  traits: { charisma: 55, energy: 62, debatePrep: 72, intelligence: 72, policyKnowledge: 84, debatingSkill: 62, fundraisingProwess: 78 },
  issuePositions: { economy: 0.35, covid_response: 0, healthcare: 0.3, immigration: 0.15, race_policing: 0.45, climate: 0.25, taxes: 0.55, law_and_order: 0.65, abortion: 0.4, trade: 0.2 },
  baseFavorability: { seniors: 0.12, noncollege_white: 0.14, suburban_women: 0.06 },
  runningMates: VPS_1988_REP,
};

const MONDALE: ScenarioTicket = {
  name: "Walter Mondale", shortName: "Mondale", party: "Democratic", color: DEM_BLUE,
  traits: { charisma: 44, energy: 58, debatePrep: 78, intelligence: 76, policyKnowledge: 84, debatingSkill: 66, fundraisingProwess: 60 },
  issuePositions: { economy: -0.35, covid_response: 0, healthcare: -0.45, immigration: -0.2, race_policing: -0.35, climate: -0.3, taxes: -0.55, law_and_order: -0.2, abortion: -0.45, trade: -0.35 },
  baseFavorability: { black: 0.28, noncollege_white: 0.08, seniors: 0.08 },
  runningMates: VPS_1984_DEM,
};

const REAGAN_1984: ScenarioTicket = {
  name: "Ronald Reagan", shortName: "Reagan", party: "Republican", color: GOP_RED,
  traits: { charisma: 92, energy: 60, debatePrep: 55, intelligence: 62, policyKnowledge: 60, debatingSkill: 74, fundraisingProwess: 84 },
  issuePositions: { economy: 0.5, covid_response: 0, healthcare: 0.4, immigration: 0.1, race_policing: 0.4, climate: 0.45, taxes: 0.7, law_and_order: 0.6, abortion: 0.5, trade: 0.1 },
  baseFavorability: { noncollege_white: 0.18, seniors: 0.12, suburban_women: 0.08, youth: 0.08 },
  runningMates: VPS_1984_REP,
};

const CARTER: ScenarioTicket = {
  name: "Jimmy Carter", shortName: "Carter", party: "Democratic", color: DEM_BLUE,
  traits: { charisma: 55, energy: 66, debatePrep: 72, intelligence: 82, policyKnowledge: 84, debatingSkill: 58, fundraisingProwess: 55 },
  issuePositions: { economy: -0.2, covid_response: 0, healthcare: -0.35, immigration: -0.15, race_policing: -0.3, climate: -0.35, taxes: -0.25, law_and_order: -0.1, abortion: -0.3, trade: -0.05 },
  baseFavorability: { black: 0.30, seniors: 0.06 },
  runningMates: VPS_1980_DEM,
};

const REAGAN_1980: ScenarioTicket = {
  name: "Ronald Reagan", shortName: "Reagan", party: "Republican", color: GOP_RED,
  traits: { charisma: 90, energy: 70, debatePrep: 66, intelligence: 62, policyKnowledge: 58, debatingSkill: 78, fundraisingProwess: 76 },
  issuePositions: { economy: 0.55, covid_response: 0, healthcare: 0.4, immigration: 0.1, race_policing: 0.4, climate: 0.45, taxes: 0.75, law_and_order: 0.6, abortion: 0.45, trade: 0.1 },
  baseFavorability: { noncollege_white: 0.16, seniors: 0.10 },
  runningMates: VPS_1980_REP,
};

// Per-year national issue salience (0..1). covid_response is zeroed out before
// 2020 (and lingers low in 2024); each year leads with its own concerns.
const SAL_2024: Partial<Record<IssueId, number>> = { economy: 0.90, immigration: 0.78, abortion: 0.72, law_and_order: 0.55, healthcare: 0.55, taxes: 0.50, climate: 0.45, race_policing: 0.45, trade: 0.40, covid_response: 0.10 };
const SAL_2016: Partial<Record<IssueId, number>> = { economy: 0.80, immigration: 0.70, trade: 0.65, law_and_order: 0.55, healthcare: 0.55, taxes: 0.50, race_policing: 0.45, abortion: 0.45, climate: 0.35, covid_response: 0 };
const SAL_2012: Partial<Record<IssueId, number>> = { economy: 0.92, healthcare: 0.75, taxes: 0.65, immigration: 0.45, trade: 0.45, abortion: 0.45, climate: 0.40, law_and_order: 0.35, race_policing: 0.35, covid_response: 0 };
const SAL_2008: Partial<Record<IssueId, number>> = { economy: 0.95, healthcare: 0.65, law_and_order: 0.60, taxes: 0.55, immigration: 0.50, trade: 0.50, climate: 0.45, abortion: 0.45, race_policing: 0.40, covid_response: 0 };
const SAL_2004: Partial<Record<IssueId, number>> = { law_and_order: 0.85, economy: 0.70, taxes: 0.60, abortion: 0.55, healthcare: 0.55, immigration: 0.45, trade: 0.45, race_policing: 0.35, climate: 0.30, covid_response: 0 };
const SAL_2000: Partial<Record<IssueId, number>> = { economy: 0.75, healthcare: 0.70, taxes: 0.65, abortion: 0.55, law_and_order: 0.45, trade: 0.45, race_policing: 0.40, immigration: 0.40, climate: 0.35, covid_response: 0 };
const SAL_1996: Partial<Record<IssueId, number>> = { economy: 0.75, taxes: 0.65, healthcare: 0.55, law_and_order: 0.55, immigration: 0.45, abortion: 0.45, trade: 0.40, race_policing: 0.35, climate: 0.30, covid_response: 0 };
const SAL_1992: Partial<Record<IssueId, number>> = { economy: 0.95, healthcare: 0.60, taxes: 0.55, trade: 0.50, law_and_order: 0.45, race_policing: 0.45, abortion: 0.40, immigration: 0.35, climate: 0.25, covid_response: 0 };
const SAL_1988: Partial<Record<IssueId, number>> = { economy: 0.70, law_and_order: 0.70, taxes: 0.60, race_policing: 0.45, abortion: 0.45, healthcare: 0.40, trade: 0.40, immigration: 0.30, climate: 0.25, covid_response: 0 };
const SAL_1984: Partial<Record<IssueId, number>> = { economy: 0.90, taxes: 0.65, law_and_order: 0.50, abortion: 0.45, healthcare: 0.40, race_policing: 0.35, trade: 0.35, immigration: 0.25, climate: 0.20, covid_response: 0 };
const SAL_1980: Partial<Record<IssueId, number>> = { economy: 0.95, taxes: 0.70, law_and_order: 0.65, healthcare: 0.40, abortion: 0.35, race_policing: 0.35, trade: 0.30, immigration: 0.25, climate: 0.20, covid_response: 0 };

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
    tagline: "September, 2016. The map looks settled and the blue wall looks safe, but the Rust Belt is restless. Don't be the one who let it crack.",
    dem: CLINTON, rep: TRUMP_2016, statePriors: PRIORS_2016, evNote: "2010-census apportionment", issueSalience: SAL_2016
  },
  "2012": {
    id: "2012", year: 2012, label: "2012 · Obama v. Romney",
    tagline: "Fall, 2012. A slow recovery, a re-election fight, and a turnout war in the swing states. Defend the coalition that made history.",
    dem: OBAMA_2012, rep: ROMNEY_2012, statePriors: PRIORS_2012, evNote: "2010-census apportionment", issueSalience: SAL_2012
  },
  "2008": {
    id: "2008", year: 2008, label: "2008 · Obama v. McCain",
    tagline: "Fall, 2008. An open seat, two wars, and a financial system in free fall. Change is in the air, if your coalition turns out.",
    dem: OBAMA_2008, rep: MCCAIN_2008, statePriors: PRIORS_2008, evOverrides: EV_2008, evNote: "2000-census apportionment", issueSalience: SAL_2008
  },
  "2004": {
    id: "2004", year: 2004, label: "2004 · Bush v. Kerry",
    tagline: "Fall, 2004. A wartime incumbent, a decorated challenger, and a country split down the middle. It runs through Ohio.",
    dem: KERRY, rep: BUSH_2004, statePriors: PRIORS_2004, evOverrides: EV_2008, evNote: "2000-census apportionment", issueSalience: SAL_2004
  },
  "2000": {
    id: "2000", year: 2000, label: "2000 · Gore v. Bush",
    tagline: "Fall, 2000. Peace, prosperity, and a knife's-edge electorate. Every state matters, and a recount is waiting to happen.",
    dem: GORE, rep: BUSH, statePriors: PRIORS_2000, evNote: "modern (2010-census) map", issueSalience: SAL_2000
  },
  "1996": {
    id: "1996", year: 1996, label: "1996 · Clinton v. Dole",
    tagline: "Fall, 1996. Peace, prosperity, and a bridge to the twenty-first century. The lead is big: hold it, or be the upset of the decade.",
    dem: CLINTON_1996, rep: DOLE, statePriors: PRIORS_1996, evOverrides: EV_1992, evNote: "1990-census apportionment", issueSalience: SAL_1996
  },
  "1992": {
    id: "1992", year: 1992, label: "1992 · Clinton v. Bush",
    tagline: "Fall, 1992. A recession, a broken tax pledge, and a kid from Hope with a war room. It's the economy, stupid.",
    dem: CLINTON_1992, rep: BUSH_1992, statePriors: PRIORS_1992, evOverrides: EV_1992, evNote: "1990-census apportionment", issueSalience: SAL_1992
  },
  "1988": {
    id: "1988", year: 1988, label: "1988 · Dukakis v. Bush",
    tagline: "Fall, 1988. An open seat, a tank photo-op, and furlough ads on every channel. Competence against a thousand points of light.",
    dem: DUKAKIS, rep: BUSH_1988, statePriors: PRIORS_1988, evOverrides: EV_1984, evNote: "1980-census apportionment", issueSalience: SAL_1988
  },
  "1984": {
    id: "1984", year: 1984, label: "1984 · Mondale v. Reagan",
    tagline: "Fall, 1984. Morning in America, and a 49-state map in the making. Hold the tide back, or ride it all the way in.",
    dem: MONDALE, rep: REAGAN_1984, statePriors: PRIORS_1984, evOverrides: EV_1984, evNote: "1980-census apportionment", issueSalience: SAL_1984
  },
  "1980": {
    id: "1980", year: 1980, label: "1980 · Carter v. Reagan",
    tagline: "Fall, 1980. Double-digit inflation, hostages in Tehran, and one question at the podium: are you better off than you were four years ago?",
    dem: CARTER, rep: REAGAN_1980, statePriors: PRIORS_1980, evOverrides: EV_1980, evNote: "1970-census apportionment", issueSalience: SAL_1980
  },
};

// Display order for the picker (newest first feels current; keep 2020 prominent).
export const SCENARIO_IDS = ["2024", "2020", "2016", "2012", "2008", "2004", "2000", "1996", "1992", "1988", "1984", "1980"] as const;

export function getScenario(id?: string): Scenario {
  return (id && SCENARIOS[id]) || SCENARIOS["2020"];
}
