import type { BlocId, Region } from "@engine/types";

// Raw, build-time seed for each contest. The engine's setup step turns these
// into full StateContest objects: it sizes each bloc from `electorate` × a
// demographic profile, then solves a single per-state margin shift so the
// turnout-weighted aggregate reproduces `prior2020BidenShare`.
//
// prior2020BidenShare = real 2020 two-party Biden share. These anchor the whole
// sim: a neutral game reproduces Biden 306 EV by construction.
//
// `electorate` ≈ 2020 votes cast (thousands), so the national popular vote and
// two-party share land in the right place too.
export interface StateSeed {
  id: string;
  name: string;
  abbr: string;
  ev: number;
  region: Region;
  prior2020BidenShare: number;
  mediaCost: number; // ad cost multiplier (big expensive markets > 1)
  battleground: boolean;
  electorate: number; // thousands of voters (0 for at-large aggregate units)
  // Multipliers on each bloc's national share. Omitted blocs default to 1.0.
  profile?: Partial<Record<BlocId, number>>;
  // For ME-AL / NE-AL: the district contests whose combined vote decides it.
  aggregateOf?: string[];
}

// Profile shorthands for common demographic textures.
const SOUTH_BLACK: Partial<Record<BlocId, number>> = { black: 2.1, noncollege_white: 0.9, college_white: 0.85 };
const SOUTHWEST_HISP: Partial<Record<BlocId, number>> = { hispanic: 2.4, noncollege_white: 0.8 };
const WHITE_WORKING: Partial<Record<BlocId, number>> = { noncollege_white: 1.45, black: 0.35, hispanic: 0.35, college_white: 0.85 };
const COLLEGE_COAST: Partial<Record<BlocId, number>> = { college_white: 1.3, noncollege_white: 0.8 };
const RETIREE: Partial<Record<BlocId, number>> = { seniors: 1.6, youth: 0.8 };

export const STATE_SEEDS: StateSeed[] = [
  { id: "AL", name: "Alabama", abbr: "AL", ev: 9, region: "South", prior2020BidenShare: 0.37, mediaCost: 0.8, battleground: false, electorate: 2323, profile: SOUTH_BLACK },
  { id: "AK", name: "Alaska", abbr: "AK", ev: 3, region: "West", prior2020BidenShare: 0.45, mediaCost: 1.1, battleground: false, electorate: 359 },
  { id: "AZ", name: "Arizona", abbr: "AZ", ev: 11, region: "Swing", prior2020BidenShare: 0.502, mediaCost: 1.0, battleground: true, electorate: 3387, profile: { ...SOUTHWEST_HISP, seniors: 1.3 } },
  { id: "AR", name: "Arkansas", abbr: "AR", ev: 6, region: "South", prior2020BidenShare: 0.36, mediaCost: 0.75, battleground: false, electorate: 1219, profile: WHITE_WORKING },
  { id: "CA", name: "California", abbr: "CA", ev: 55, region: "West", prior2020BidenShare: 0.646, mediaCost: 1.6, battleground: false, electorate: 17501, profile: { ...SOUTHWEST_HISP, college_white: 1.1, asian_other: 1.8 } },
  { id: "CO", name: "Colorado", abbr: "CO", ev: 9, region: "West", prior2020BidenShare: 0.568, mediaCost: 1.0, battleground: false, electorate: 3257, profile: { college_white: 1.2, hispanic: 1.4 } },
  { id: "CT", name: "Connecticut", abbr: "CT", ev: 7, region: "Northeast", prior2020BidenShare: 0.6, mediaCost: 1.3, battleground: false, electorate: 1824, profile: COLLEGE_COAST },
  { id: "DE", name: "Delaware", abbr: "DE", ev: 3, region: "Northeast", prior2020BidenShare: 0.595, mediaCost: 1.2, battleground: false, electorate: 504, profile: { black: 1.5 } },
  { id: "DC", name: "District of Columbia", abbr: "DC", ev: 3, region: "Northeast", prior2020BidenShare: 0.945, mediaCost: 1.2, battleground: false, electorate: 344, profile: { black: 3.0, college_white: 1.3 } },
  { id: "FL", name: "Florida", abbr: "FL", ev: 29, region: "Swing", prior2020BidenShare: 0.483, mediaCost: 1.2, battleground: true, electorate: 11067, profile: { ...RETIREE, hispanic: 1.7, black: 1.3 } },
  { id: "GA", name: "Georgia", abbr: "GA", ev: 16, region: "Swing", prior2020BidenShare: 0.501, mediaCost: 1.0, battleground: true, electorate: 4999, profile: SOUTH_BLACK },
  { id: "HI", name: "Hawaii", abbr: "HI", ev: 4, region: "West", prior2020BidenShare: 0.645, mediaCost: 1.1, battleground: false, electorate: 575, profile: { asian_other: 3.5, noncollege_white: 0.5 } },
  { id: "ID", name: "Idaho", abbr: "ID", ev: 4, region: "West", prior2020BidenShare: 0.345, mediaCost: 0.8, battleground: false, electorate: 868, profile: WHITE_WORKING },
  { id: "IL", name: "Illinois", abbr: "IL", ev: 20, region: "Midwest", prior2020BidenShare: 0.585, mediaCost: 1.4, battleground: false, electorate: 6033, profile: { black: 1.4, hispanic: 1.3, college_white: 1.1 } },
  { id: "IN", name: "Indiana", abbr: "IN", ev: 11, region: "Midwest", prior2020BidenShare: 0.42, mediaCost: 0.9, battleground: false, electorate: 3033, profile: WHITE_WORKING },
  { id: "IA", name: "Iowa", abbr: "IA", ev: 6, region: "Midwest", prior2020BidenShare: 0.457, mediaCost: 0.9, battleground: false, electorate: 1690, profile: { noncollege_white: 1.3, black: 0.4, hispanic: 0.6 } },
  { id: "KS", name: "Kansas", abbr: "KS", ev: 6, region: "Midwest", prior2020BidenShare: 0.425, mediaCost: 0.8, battleground: false, electorate: 1373, profile: WHITE_WORKING },
  { id: "KY", name: "Kentucky", abbr: "KY", ev: 8, region: "South", prior2020BidenShare: 0.37, mediaCost: 0.85, battleground: false, electorate: 2136, profile: WHITE_WORKING },
  { id: "LA", name: "Louisiana", abbr: "LA", ev: 8, region: "South", prior2020BidenShare: 0.405, mediaCost: 0.85, battleground: false, electorate: 2148, profile: SOUTH_BLACK },
  { id: "MD", name: "Maryland", abbr: "MD", ev: 10, region: "Northeast", prior2020BidenShare: 0.66, mediaCost: 1.3, battleground: false, electorate: 3037, profile: { black: 1.8, college_white: 1.1 } },
  { id: "MA", name: "Massachusetts", abbr: "MA", ev: 11, region: "Northeast", prior2020BidenShare: 0.665, mediaCost: 1.4, battleground: false, electorate: 3631, profile: COLLEGE_COAST },
  { id: "MI", name: "Michigan", abbr: "MI", ev: 16, region: "Swing", prior2020BidenShare: 0.514, mediaCost: 1.0, battleground: true, electorate: 5540, profile: { noncollege_white: 1.2, black: 1.3 } },
  { id: "MN", name: "Minnesota", abbr: "MN", ev: 10, region: "Midwest", prior2020BidenShare: 0.535, mediaCost: 1.0, battleground: false, electorate: 3277, profile: { college_white: 1.1, noncollege_white: 1.1 } },
  { id: "MS", name: "Mississippi", abbr: "MS", ev: 6, region: "South", prior2020BidenShare: 0.415, mediaCost: 0.75, battleground: false, electorate: 1313, profile: { black: 2.4, noncollege_white: 0.9 } },
  { id: "MO", name: "Missouri", abbr: "MO", ev: 10, region: "Midwest", prior2020BidenShare: 0.42, mediaCost: 0.9, battleground: false, electorate: 3026, profile: WHITE_WORKING },
  { id: "MT", name: "Montana", abbr: "MT", ev: 3, region: "West", prior2020BidenShare: 0.42, mediaCost: 0.85, battleground: false, electorate: 612, profile: WHITE_WORKING },
  { id: "NV", name: "Nevada", abbr: "NV", ev: 6, region: "Swing", prior2020BidenShare: 0.512, mediaCost: 1.0, battleground: true, electorate: 1405, profile: { hispanic: 1.9, asian_other: 1.4 } },
  { id: "NH", name: "New Hampshire", abbr: "NH", ev: 4, region: "Northeast", prior2020BidenShare: 0.535, mediaCost: 1.0, battleground: false, electorate: 806, profile: COLLEGE_COAST },
  { id: "NJ", name: "New Jersey", abbr: "NJ", ev: 14, region: "Northeast", prior2020BidenShare: 0.58, mediaCost: 1.5, battleground: false, electorate: 4549, profile: { college_white: 1.1, hispanic: 1.4, asian_other: 1.5 } },
  { id: "NM", name: "New Mexico", abbr: "NM", ev: 5, region: "West", prior2020BidenShare: 0.55, mediaCost: 0.85, battleground: false, electorate: 924, profile: { hispanic: 2.8, noncollege_white: 0.7 } },
  { id: "NY", name: "New York", abbr: "NY", ev: 29, region: "Northeast", prior2020BidenShare: 0.61, mediaCost: 1.6, battleground: false, electorate: 8617, profile: { black: 1.4, hispanic: 1.4, college_white: 1.1, asian_other: 1.6 } },
  { id: "NC", name: "North Carolina", abbr: "NC", ev: 15, region: "Swing", prior2020BidenShare: 0.493, mediaCost: 1.0, battleground: true, electorate: 5524, profile: { black: 1.7, college_white: 0.95 } },
  { id: "ND", name: "North Dakota", abbr: "ND", ev: 3, region: "Midwest", prior2020BidenShare: 0.335, mediaCost: 0.75, battleground: false, electorate: 362, profile: WHITE_WORKING },
  { id: "OH", name: "Ohio", abbr: "OH", ev: 18, region: "Midwest", prior2020BidenShare: 0.459, mediaCost: 1.0, battleground: false, electorate: 5922, profile: { noncollege_white: 1.25, black: 1.1 } },
  { id: "OK", name: "Oklahoma", abbr: "OK", ev: 7, region: "South", prior2020BidenShare: 0.335, mediaCost: 0.8, battleground: false, electorate: 1561, profile: WHITE_WORKING },
  { id: "OR", name: "Oregon", abbr: "OR", ev: 7, region: "West", prior2020BidenShare: 0.58, mediaCost: 1.0, battleground: false, electorate: 2375, profile: COLLEGE_COAST },
  { id: "PA", name: "Pennsylvania", abbr: "PA", ev: 20, region: "Swing", prior2020BidenShare: 0.506, mediaCost: 1.1, battleground: true, electorate: 6940, profile: { noncollege_white: 1.2, black: 1.2, seniors: 1.15 } },
  { id: "RI", name: "Rhode Island", abbr: "RI", ev: 4, region: "Northeast", prior2020BidenShare: 0.6, mediaCost: 1.2, battleground: false, electorate: 518, profile: COLLEGE_COAST },
  { id: "SC", name: "South Carolina", abbr: "SC", ev: 9, region: "South", prior2020BidenShare: 0.44, mediaCost: 0.9, battleground: false, electorate: 2514, profile: SOUTH_BLACK },
  { id: "SD", name: "South Dakota", abbr: "SD", ev: 3, region: "Midwest", prior2020BidenShare: 0.37, mediaCost: 0.75, battleground: false, electorate: 423, profile: WHITE_WORKING },
  { id: "TN", name: "Tennessee", abbr: "TN", ev: 11, region: "South", prior2020BidenShare: 0.385, mediaCost: 0.9, battleground: false, electorate: 3054, profile: { noncollege_white: 1.2, black: 1.2 } },
  { id: "TX", name: "Texas", abbr: "TX", ev: 38, region: "Swing", prior2020BidenShare: 0.472, mediaCost: 1.3, battleground: false, electorate: 11315, profile: { hispanic: 1.9, black: 1.2, college_white: 0.95 } },
  { id: "UT", name: "Utah", abbr: "UT", ev: 6, region: "West", prior2020BidenShare: 0.4, mediaCost: 0.85, battleground: false, electorate: 1488, profile: { noncollege_white: 1.1, college_white: 1.1, youth: 1.2 } },
  { id: "VT", name: "Vermont", abbr: "VT", ev: 3, region: "Northeast", prior2020BidenShare: 0.675, mediaCost: 0.9, battleground: false, electorate: 367, profile: COLLEGE_COAST },
  { id: "VA", name: "Virginia", abbr: "VA", ev: 13, region: "South", prior2020BidenShare: 0.55, mediaCost: 1.2, battleground: false, electorate: 4460, profile: { black: 1.5, college_white: 1.2 } },
  { id: "WA", name: "Washington", abbr: "WA", ev: 12, region: "West", prior2020BidenShare: 0.595, mediaCost: 1.1, battleground: false, electorate: 4087, profile: { college_white: 1.2, asian_other: 1.6 } },
  { id: "WV", name: "West Virginia", abbr: "WV", ev: 5, region: "South", prior2020BidenShare: 0.305, mediaCost: 0.8, battleground: false, electorate: 794, profile: WHITE_WORKING },
  { id: "WI", name: "Wisconsin", abbr: "WI", ev: 10, region: "Swing", prior2020BidenShare: 0.503, mediaCost: 0.95, battleground: true, electorate: 3298, profile: { noncollege_white: 1.25, black: 1.05 } },
  { id: "WY", name: "Wyoming", abbr: "WY", ev: 3, region: "West", prior2020BidenShare: 0.285, mediaCost: 0.75, battleground: false, electorate: 278, profile: WHITE_WORKING },

  // ── Maine: 2 statewide + 2 districts ──────────────────────────────────
  { id: "ME-1", name: "Maine 1st District", abbr: "ME-1", ev: 1, region: "Northeast", prior2020BidenShare: 0.6, mediaCost: 0.9, battleground: false, electorate: 430, profile: COLLEGE_COAST },
  { id: "ME-2", name: "Maine 2nd District", abbr: "ME-2", ev: 1, region: "Northeast", prior2020BidenShare: 0.461, mediaCost: 0.85, battleground: true, electorate: 389, profile: WHITE_WORKING },
  { id: "ME-AL", name: "Maine At-Large", abbr: "ME", ev: 2, region: "Northeast", prior2020BidenShare: 0.543, mediaCost: 0.9, battleground: false, electorate: 0, aggregateOf: ["ME-1", "ME-2"] },

  // ── Nebraska: 2 statewide + 3 districts ───────────────────────────────
  { id: "NE-1", name: "Nebraska 1st District", abbr: "NE-1", ev: 1, region: "Midwest", prior2020BidenShare: 0.44, mediaCost: 0.8, battleground: false, electorate: 320, profile: WHITE_WORKING },
  { id: "NE-2", name: "Nebraska 2nd District", abbr: "NE-2", ev: 1, region: "Midwest", prior2020BidenShare: 0.53, mediaCost: 0.85, battleground: true, electorate: 340, profile: { college_white: 1.2, noncollege_white: 0.9 } },
  { id: "NE-3", name: "Nebraska 3rd District", abbr: "NE-3", ev: 1, region: "Midwest", prior2020BidenShare: 0.23, mediaCost: 0.75, battleground: false, electorate: 304, profile: WHITE_WORKING },
  { id: "NE-AL", name: "Nebraska At-Large", abbr: "NE", ev: 2, region: "Midwest", prior2020BidenShare: 0.4, mediaCost: 0.8, battleground: false, electorate: 0, aggregateOf: ["NE-1", "NE-2", "NE-3"] },
];

export const TOTAL_EV = STATE_SEEDS.reduce((s, st) => s + st.ev, 0); // must be 538
