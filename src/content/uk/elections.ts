// Per-election regional results: each region's real vote share (`v`) and seat
// count (`s`) per party. These are the calibration anchors — the UK analog of
// the U.S. per-state 2020 priors. Neutral play reproduces the seat split by
// construction (the seats curve swings off this baseline).
//
// Vote shares need not sum to exactly 1 — the setup builder normalizes them over
// the parties present in each region.
//
// Boundary sets: each election uses the chamber size and nation splits from the
// boundary review in force that year (Electoral Calculus / Commons Library).
// English seats within a year are allocated across the 12 ITL1 regions by
// largest-remainder on the 2024 regional shares, so historic SCO/WAL/NI counts
// are exact and English regions track the real English total.

export interface RegionResult {
  v: Record<string, number>; // vote share per party
  s: Record<string, number>; // seats per party (sums to the region's pool)
}

export interface UkMajority {
  total: number;
  threshold: number;
}

export interface UkElectionData {
  id: string;
  year: number;
  label: string;
  tagline: string;
  // Issue salience for the year (UkIssueId → 0..1).
  salience: Record<string, number>;
  regions: Record<string, RegionResult>;
  // Chamber size for THIS election's boundary set (defaults to 650/326).
  majority?: UkMajority;
  goalText?: string;
}

// Per-election regional seat pools. Nation totals (Eng/Sco/Wal/NI) match the
// boundary review in force; English regions are largest-remainder shares of the
// English total using 2024 regional weights.
export const UK_BOUNDARY_POOLS: Record<string, Record<string, number>> = {
  "1951": { NE: 25, NW: 68, YH: 50, EM: 44, WM: 53, EE: 57, LON: 70, SE: 85, SW: 54, SCO: 71, WAL: 36, NI: 12 },
  "1964": { NE: 25, NW: 69, YH: 51, EM: 44, WM: 54, EE: 57, LON: 71, SE: 86, SW: 54, SCO: 71, WAL: 36, NI: 12 },
  "1966": { NE: 25, NW: 69, YH: 51, EM: 44, WM: 54, EE: 57, LON: 71, SE: 86, SW: 54, SCO: 71, WAL: 36, NI: 12 },
  "1970": { NE: 25, NW: 69, YH: 51, EM: 44, WM: 54, EE: 57, LON: 71, SE: 86, SW: 54, SCO: 71, WAL: 36, NI: 12 },
  "1974feb": { NE: 26, NW: 69, YH: 51, EM: 45, WM: 54, EE: 58, LON: 71, SE: 87, SW: 55, SCO: 71, WAL: 36, NI: 12 },
  "1974oct": { NE: 26, NW: 69, YH: 51, EM: 45, WM: 54, EE: 58, LON: 71, SE: 87, SW: 55, SCO: 71, WAL: 36, NI: 12 },
  "1979": { NE: 26, NW: 69, YH: 51, EM: 45, WM: 54, EE: 58, LON: 71, SE: 87, SW: 55, SCO: 71, WAL: 36, NI: 12 },
  "1983": { NE: 26, NW: 70, YH: 52, EM: 45, WM: 55, EE: 59, LON: 72, SE: 88, SW: 56, SCO: 72, WAL: 38, NI: 17 },
  "1987": { NE: 26, NW: 70, YH: 52, EM: 45, WM: 55, EE: 59, LON: 72, SE: 88, SW: 56, SCO: 72, WAL: 38, NI: 17 },
  "1992": { NE: 26, NW: 71, YH: 52, EM: 45, WM: 55, EE: 59, LON: 72, SE: 88, SW: 56, SCO: 72, WAL: 38, NI: 17 },
  "1997": { NE: 26, NW: 71, YH: 53, EM: 46, WM: 56, EE: 59, LON: 73, SE: 89, SW: 56, SCO: 72, WAL: 40, NI: 18 },
  "2001": { NE: 26, NW: 71, YH: 53, EM: 46, WM: 56, EE: 59, LON: 73, SE: 89, SW: 56, SCO: 72, WAL: 40, NI: 18 },
  "2005": { NE: 26, NW: 71, YH: 53, EM: 46, WM: 56, EE: 59, LON: 73, SE: 89, SW: 56, SCO: 59, WAL: 40, NI: 18 },
  "2010": { NE: 26, NW: 72, YH: 53, EM: 46, WM: 56, EE: 60, LON: 74, SE: 89, SW: 57, SCO: 59, WAL: 40, NI: 18 },
  "2015": { NE: 26, NW: 72, YH: 53, EM: 46, WM: 56, EE: 60, LON: 74, SE: 89, SW: 57, SCO: 59, WAL: 40, NI: 18 },
  "2017": { NE: 26, NW: 72, YH: 53, EM: 46, WM: 56, EE: 60, LON: 74, SE: 89, SW: 57, SCO: 59, WAL: 40, NI: 18 },
  "2019": { NE: 26, NW: 72, YH: 53, EM: 46, WM: 56, EE: 60, LON: 74, SE: 89, SW: 57, SCO: 59, WAL: 40, NI: 18 },
  "2024": { NE: 27, NW: 73, YH: 54, EM: 47, WM: 57, EE: 61, LON: 75, SE: 91, SW: 58, SCO: 57, WAL: 32, NI: 18 },
};

export const UK_ELECTION_MAJORITY: Record<string, UkMajority> = {
  "1951": { total: 625, threshold: 313 },
  "1964": { total: 630, threshold: 316 },
  "1966": { total: 630, threshold: 316 },
  "1970": { total: 630, threshold: 316 },
  "1974feb": { total: 635, threshold: 318 },
  "1974oct": { total: 635, threshold: 318 },
  "1979": { total: 635, threshold: 318 },
  "1983": { total: 650, threshold: 326 },
  "1987": { total: 650, threshold: 326 },
  "1992": { total: 651, threshold: 326 },
  "1997": { total: 659, threshold: 330 },
  "2001": { total: 659, threshold: 330 },
  "2005": { total: 646, threshold: 324 },
  "2010": { total: 650, threshold: 326 },
  "2015": { total: 650, threshold: 326 },
  "2017": { total: 650, threshold: 326 },
  "2019": { total: 650, threshold: 326 },
  "2024": { total: 650, threshold: 326 },
};

export function majorityForElection(electionId: string): UkMajority {
  return UK_ELECTION_MAJORITY[electionId] ?? { total: 650, threshold: 326 };
}

export function poolFor(electionId: string, regionId: string): number {
  return UK_BOUNDARY_POOLS[electionId]?.[regionId]
    ?? UK_BOUNDARY_POOLS["2024"][regionId]
    ?? 0;
}

// Seat helper: the lead party absorbs whatever the region's pool has left after
// the minor parties, so every region's seats always sum to its boundary-set pool.
function fill(pool: number, lead: string, others: Record<string, number>): Record<string, number> {
  const used = Object.values(others).reduce((s, x) => s + x, 0);
  return { ...others, [lead]: Math.max(0, pool - used) };
}

function fy(year: string, region: string, lead: string, others: Record<string, number>): Record<string, number> {
  return fill(poolFor(year, region), lead, others);
}

// ── 2024: Starmer's landslide, Reform's surge, the SNP collapse ────────────
const RESULT_2024: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.41, con: 0.18, ref: 0.21, ld: 0.07, grn: 0.07, oth: 0.06 }, s: { lab: 25, con: 1, ref: 1 } },
  NW:  { v: { lab: 0.40, con: 0.21, ref: 0.15, ld: 0.10, grn: 0.07, oth: 0.07 }, s: { lab: 60, con: 9, ld: 2, ref: 1, oth: 1 } },
  YH:  { v: { lab: 0.38, con: 0.22, ref: 0.17, ld: 0.09, grn: 0.07, oth: 0.07 }, s: { lab: 43, con: 8, ld: 2, ref: 1 } },
  EM:  { v: { lab: 0.34, con: 0.27, ref: 0.16, ld: 0.10, grn: 0.06, oth: 0.07 }, s: { lab: 34, con: 11, ld: 1, oth: 1 } },
  WM:  { v: { lab: 0.37, con: 0.25, ref: 0.15, ld: 0.10, grn: 0.06, oth: 0.07 }, s: { lab: 42, con: 11, ld: 1, ref: 1, grn: 1, oth: 1 } },
  EE:  { v: { lab: 0.29, con: 0.28, ref: 0.15, ld: 0.16, grn: 0.07, oth: 0.05 }, s: { lab: 27, con: 24, ld: 7, ref: 1, grn: 1, oth: 1 } },
  LON: { v: { lab: 0.44, con: 0.21, ref: 0.08, ld: 0.13, grn: 0.11, oth: 0.03 }, s: { lab: 59, con: 9, ld: 6, oth: 1 } },
  SE:  { v: { lab: 0.29, con: 0.28, ref: 0.13, ld: 0.21, grn: 0.08, oth: 0.01 }, s: { lab: 33, con: 34, ld: 23, grn: 1 } },
  SW:  { v: { lab: 0.26, con: 0.27, ref: 0.14, ld: 0.25, grn: 0.07, oth: 0.01 }, s: { lab: 20, con: 13, ld: 24, grn: 1 } },
  SCO: { v: { lab: 0.36, snp: 0.30, con: 0.13, ld: 0.10, ref: 0.07, grn: 0.04 }, s: { lab: 37, snp: 9, con: 5, ld: 6 } },
  WAL: { v: { lab: 0.37, con: 0.18, pc: 0.15, ref: 0.17, ld: 0.07, grn: 0.06 }, s: { lab: 27, pc: 4, ld: 1 } },
  NI:  { v: { sf: 0.27, dup: 0.22, apni: 0.15, uup: 0.12, sdlp: 0.11, oth: 0.13 }, s: { sf: 7, dup: 5, apni: 1, uup: 1, sdlp: 2, oth: 2 } },
};

// ── 2019: Johnson's majority, the Red Wall falls, "Get Brexit Done" ────────
const RESULT_2019: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.42, con: 0.38, ld: 0.07, grn: 0.04, oth: 0.09 }, s: fy("2019", "NE", "lab", { con: 10, oth: 1 }) },
  NW:  { v: { lab: 0.46, con: 0.38, ld: 0.08, grn: 0.03 }, s: fy("2019", "NW", "lab", { con: 31, ld: 1 }) },
  YH:  { v: { lab: 0.39, con: 0.43, ld: 0.08, grn: 0.04 }, s: fy("2019", "YH", "lab", { con: 26 }) },
  EM:  { v: { con: 0.55, lab: 0.32, ld: 0.08, grn: 0.03 }, s: fy("2019", "EM", "con", { lab: 9 }) },
  WM:  { v: { con: 0.53, lab: 0.34, ld: 0.08, grn: 0.03 }, s: fy("2019", "WM", "con", { lab: 13 }) },
  EE:  { v: { con: 0.57, lab: 0.24, ld: 0.13, grn: 0.04 }, s: fy("2019", "EE", "con", { lab: 7, ld: 1 }) },
  LON: { v: { lab: 0.48, con: 0.32, ld: 0.15, grn: 0.04 }, s: fy("2019", "LON", "lab", { con: 21, ld: 3, oth: 2 }) },
  SE:  { v: { con: 0.54, lab: 0.22, ld: 0.18, grn: 0.05 }, s: fy("2019", "SE", "con", { lab: 8, ld: 4, grn: 1 }) },
  SW:  { v: { con: 0.53, lab: 0.21, ld: 0.20, grn: 0.05 }, s: fy("2019", "SW", "con", { lab: 7, ld: 1 }) },
  SCO: { v: { snp: 0.45, con: 0.25, lab: 0.19, ld: 0.10 }, s: fy("2019", "SCO", "snp", { con: 6, ld: 4, lab: 1 }) },
  WAL: { v: { lab: 0.41, con: 0.36, pc: 0.10, ld: 0.06 }, s: fy("2019", "WAL", "lab", { con: 11, pc: 3 }) },
  NI:  { v: { dup: 0.31, sf: 0.23, apni: 0.17, sdlp: 0.12, uup: 0.12, oth: 0.05 }, s: fy("2019", "NI", "dup", { sf: 7, sdlp: 2, apni: 1, oth: 1 }) },
};

// ── 2017: May's gamble, a hung parliament, the DUP confidence-and-supply ───
const RESULT_2017: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.55, con: 0.34, ld: 0.05 }, s: fy("2017", "NE", "lab", { con: 9 }) },
  NW:  { v: { lab: 0.55, con: 0.36, ld: 0.05 }, s: fy("2017", "NW", "lab", { con: 24 }) },
  YH:  { v: { lab: 0.49, con: 0.41, ld: 0.05 }, s: fy("2017", "YH", "lab", { con: 21 }) },
  EM:  { v: { con: 0.51, lab: 0.40, ld: 0.05 }, s: fy("2017", "EM", "con", { lab: 17 }) },
  WM:  { v: { con: 0.49, lab: 0.42, ld: 0.04 }, s: fy("2017", "WM", "con", { lab: 23 }) },
  EE:  { v: { con: 0.55, lab: 0.33, ld: 0.08 }, s: fy("2017", "EE", "con", { lab: 15, ld: 1 }) },
  LON: { v: { lab: 0.55, con: 0.33, ld: 0.09 }, s: fy("2017", "LON", "lab", { con: 21, ld: 3 }) },
  SE:  { v: { con: 0.54, lab: 0.29, ld: 0.11 }, s: fy("2017", "SE", "con", { lab: 17, ld: 3 }) },
  SW:  { v: { con: 0.51, lab: 0.29, ld: 0.15 }, s: fy("2017", "SW", "con", { lab: 12, ld: 1 }) },
  SCO: { v: { snp: 0.37, con: 0.29, lab: 0.27, ld: 0.07 }, s: fy("2017", "SCO", "snp", { con: 13, lab: 7, ld: 4 }) },
  WAL: { v: { lab: 0.49, con: 0.34, pc: 0.10, ld: 0.05 }, s: fy("2017", "WAL", "lab", { con: 11, pc: 3 }) },
  NI:  { v: { dup: 0.36, sf: 0.30, uup: 0.10, sdlp: 0.12, apni: 0.08, oth: 0.04 }, s: fy("2017", "NI", "dup", { sf: 7, oth: 1 }) },
};

// ── 2010: the expenses-scandal election, a hung parliament, Con–LD coalition ─
const RESULT_2010: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.44, con: 0.24, ld: 0.24 }, s: fy("2010", "NE", "lab", { con: 2, ld: 3 }) },
  NW:  { v: { lab: 0.40, con: 0.32, ld: 0.22 }, s: fy("2010", "NW", "lab", { con: 22, ld: 6 }) },
  YH:  { v: { lab: 0.35, con: 0.33, ld: 0.23 }, s: fy("2010", "YH", "lab", { con: 19, ld: 3 }) },
  EM:  { v: { con: 0.41, lab: 0.30, ld: 0.21 }, s: fy("2010", "EM", "con", { lab: 15, ld: 1 }) },
  WM:  { v: { con: 0.40, lab: 0.31, ld: 0.21 }, s: fy("2010", "WM", "con", { lab: 24, ld: 2 }) },
  EE:  { v: { con: 0.47, lab: 0.20, ld: 0.24 }, s: fy("2010", "EE", "con", { lab: 6, ld: 4 }) },
  LON: { v: { lab: 0.37, con: 0.35, ld: 0.22 }, s: fy("2010", "LON", "lab", { con: 28, ld: 7 }) },
  SE:  { v: { con: 0.50, lab: 0.16, ld: 0.26 }, s: fy("2010", "SE", "con", { lab: 8, ld: 12 }) },
  SW:  { v: { con: 0.43, lab: 0.15, ld: 0.35 }, s: fy("2010", "SW", "con", { lab: 4, ld: 15 }) },
  SCO: { v: { lab: 0.42, snp: 0.20, ld: 0.19, con: 0.17 }, s: fy("2010", "SCO", "lab", { snp: 6, ld: 11, con: 1 }) },
  WAL: { v: { lab: 0.36, con: 0.26, ld: 0.20, pc: 0.11 }, s: fy("2010", "WAL", "lab", { con: 6, ld: 3, pc: 3 }) },
  NI:  { v: { dup: 0.28, sf: 0.25, uup: 0.15, sdlp: 0.16, apni: 0.06, oth: 0.10 }, s: fy("2010", "NI", "dup", { sf: 5, sdlp: 3, apni: 1, oth: 1 }) },
};

// ── 1997: New Labour's landslide, the Tories wiped from Scotland and Wales ──
const RESULT_1997: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.61, con: 0.20, ld: 0.14 }, s: fy("1997", "NE", "lab", { con: 1, ld: 1 }) },
  NW:  { v: { lab: 0.54, con: 0.27, ld: 0.15 }, s: fy("1997", "NW", "lab", { con: 7, ld: 2 }) },
  YH:  { v: { lab: 0.52, con: 0.28, ld: 0.16 }, s: fy("1997", "YH", "lab", { con: 7, ld: 2 }) },
  EM:  { v: { lab: 0.48, con: 0.35, ld: 0.14 }, s: fy("1997", "EM", "lab", { con: 12, ld: 1 }) },
  WM:  { v: { lab: 0.48, con: 0.34, ld: 0.14 }, s: fy("1997", "WM", "lab", { con: 14, ld: 1 }) },
  EE:  { v: { lab: 0.39, con: 0.39, ld: 0.18 }, s: fy("1997", "EE", "lab", { con: 30, ld: 5 }) },
  LON: { v: { lab: 0.49, con: 0.31, ld: 0.15 }, s: fy("1997", "LON", "lab", { con: 11, ld: 5 }) },
  SE:  { v: { con: 0.41, lab: 0.32, ld: 0.21 }, s: fy("1997", "SE", "con", { lab: 35, ld: 14 }) },
  SW:  { v: { lab: 0.33, con: 0.36, ld: 0.27 }, s: fy("1997", "SW", "lab", { con: 18, ld: 15 }) },
  SCO: { v: { lab: 0.46, snp: 0.22, con: 0.18, ld: 0.13 }, s: fy("1997", "SCO", "lab", { snp: 6, ld: 9 }) },
  WAL: { v: { lab: 0.55, con: 0.20, pc: 0.10, ld: 0.12 }, s: fy("1997", "WAL", "lab", { pc: 4, ld: 2 }) },
  NI:  { v: { uup: 0.33, dup: 0.14, sdlp: 0.24, sf: 0.16, apni: 0.08, oth: 0.05 }, s: fy("1997", "NI", "uup", { dup: 2, sdlp: 3, sf: 2, oth: 2 }) },
};

// ── 2015: Cameron's surprise majority, the SNP wave, the Lib Dem collapse ──
const RESULT_2015: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.47, con: 0.25, ref: 0.17, ld: 0.06 }, s: fy("2015", "NE", "lab", { con: 4 }) },
  NW:  { v: { lab: 0.45, con: 0.32, ref: 0.14, ld: 0.06 }, s: fy("2015", "NW", "lab", { con: 22, ld: 1 }) },
  YH:  { v: { lab: 0.39, con: 0.33, ref: 0.16, ld: 0.07 }, s: fy("2015", "YH", "lab", { con: 24 }) },
  EM:  { v: { con: 0.43, lab: 0.32, ref: 0.16, ld: 0.05 }, s: fy("2015", "EM", "con", { lab: 14 }) },
  WM:  { v: { con: 0.42, lab: 0.33, ref: 0.16, ld: 0.05 }, s: fy("2015", "WM", "con", { lab: 24 }) },
  EE:  { v: { con: 0.49, lab: 0.22, ref: 0.16, ld: 0.08 }, s: fy("2015", "EE", "con", { lab: 5, ld: 1 }) },
  LON: { v: { lab: 0.44, con: 0.35, ref: 0.08, ld: 0.08 }, s: fy("2015", "LON", "lab", { con: 27, ld: 1 }) },
  SE:  { v: { con: 0.51, lab: 0.18, ref: 0.15, ld: 0.10 }, s: fy("2015", "SE", "con", { lab: 8, ld: 2 }) },
  SW:  { v: { con: 0.47, lab: 0.18, ref: 0.14, ld: 0.15 }, s: fy("2015", "SW", "con", { lab: 4, ld: 2 }) },
  SCO: { v: { snp: 0.50, lab: 0.24, con: 0.15, ld: 0.08 }, s: fy("2015", "SCO", "snp", { lab: 1, con: 1, ld: 1 }) },
  WAL: { v: { lab: 0.37, con: 0.27, ref: 0.14, pc: 0.12, ld: 0.06 }, s: fy("2015", "WAL", "lab", { con: 8, pc: 3, ld: 1 }) },
  NI:  { v: { dup: 0.26, sf: 0.24, uup: 0.16, sdlp: 0.14, apni: 0.09, oth: 0.11 }, s: fy("2015", "NI", "dup", { sf: 4, uup: 2, sdlp: 3, oth: 1 }) },
};

// ── 1951: the wrong-winner election — Labour votes most, Churchill wins most ─
// Vote shares from real 1951 national/regional returns; seats mapped onto the
// 1951 boundary set (625 seats). Nationally Con 48.0% / Lab 48.8% but
// FPTP gave Churchill 321 seats vs Attlee 295 — scaled onto the 625 pool
// so Con holds a bare majority. Lib Party negligible nationally (6 seats). SNP <1% in SCO;
// Plaid Cymru contested Wales (~3% vote) but won no Westminster seats. NI:
// Ulster Unionists (conservative-aligned) 9 historical seats, Nationalist/other 3.
const RESULT_1951: Record<string, RegionResult> = {
  NE:  { v: { con: 0.40, lab: 0.55, ld: 0.04, oth: 0.01 }, s: fy("1951", "NE", "lab", { con: 3 }) },
  NW:  { v: { con: 0.46, lab: 0.50, ld: 0.03, oth: 0.01 }, s: fy("1951", "NW", "lab", { con: 29, ld: 1 }) },
  YH:  { v: { con: 0.44, lab: 0.52, ld: 0.03, oth: 0.01 }, s: fy("1951", "YH", "lab", { con: 18, ld: 1 }) },
  EM:  { v: { con: 0.48, lab: 0.48, ld: 0.03, oth: 0.01 }, s: fy("1951", "EM", "con", { lab: 22 }) },
  WM:  { v: { con: 0.49, lab: 0.47, ld: 0.03, oth: 0.01 }, s: fy("1951", "WM", "con", { lab: 24 }) },
  EE:  { v: { con: 0.55, lab: 0.40, ld: 0.04, oth: 0.01 }, s: fy("1951", "EE", "con", { lab: 17 }) },
  LON: { v: { con: 0.50, lab: 0.47, ld: 0.02, oth: 0.01 }, s: fy("1951", "LON", "con", { lab: 32 }) },
  SE:  { v: { con: 0.60, lab: 0.35, ld: 0.04, oth: 0.01 }, s: fy("1951", "SE", "con", { lab: 19 }) },
  SW:  { v: { con: 0.52, lab: 0.38, ld: 0.09, oth: 0.01 }, s: fy("1951", "SW", "con", { lab: 13, ld: 1 }) },
  SCO: { v: { con: 0.45, lab: 0.46, ld: 0.05, oth: 0.04 }, s: fy("1951", "SCO", "lab", { con: 27, ld: 1 }) },
  WAL: { v: { con: 0.30, lab: 0.57, ld: 0.09, pc: 0.03, oth: 0.01 }, s: fy("1951", "WAL", "lab", { con: 5, ld: 2 }) },
  NI:  { v: { uup: 0.65, oth: 0.35 }, s: fy("1951", "NI", "uup", { oth: 3 }) },
};

// ── 1979: the Winter of Discontent, Thatcher's first win ──────────────────
const RESULT_1979: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.50, con: 0.34, ld: 0.14 }, s: fy("1979", "NE", "lab", { con: 9, ld: 1 }) },
  NW:  { v: { lab: 0.45, con: 0.41, ld: 0.13 }, s: fy("1979", "NW", "lab", { con: 33, ld: 2 }) },
  YH:  { v: { lab: 0.46, con: 0.39, ld: 0.13 }, s: fy("1979", "YH", "lab", { con: 23, ld: 1 }) },
  EM:  { v: { con: 0.47, lab: 0.40, ld: 0.12 }, s: fy("1979", "EM", "con", { lab: 18, ld: 1 }) },
  WM:  { v: { con: 0.46, lab: 0.41, ld: 0.12 }, s: fy("1979", "WM", "con", { lab: 25, ld: 1 }) },
  EE:  { v: { con: 0.50, lab: 0.32, ld: 0.16 }, s: fy("1979", "EE", "con", { lab: 14, ld: 2 }) },
  LON: { v: { con: 0.46, lab: 0.41, ld: 0.12 }, s: fy("1979", "LON", "con", { lab: 33, ld: 2 }) },
  SE:  { v: { con: 0.56, lab: 0.27, ld: 0.16 }, s: fy("1979", "SE", "con", { lab: 13, ld: 4 }) },
  SW:  { v: { con: 0.52, lab: 0.27, ld: 0.20 }, s: fy("1979", "SW", "con", { lab: 9, ld: 4 }) },
  SCO: { v: { lab: 0.42, con: 0.31, snp: 0.17, ld: 0.09 }, s: fy("1979", "SCO", "lab", { con: 18, snp: 2, ld: 5 }) },
  WAL: { v: { lab: 0.49, con: 0.32, ld: 0.11, pc: 0.08 }, s: fy("1979", "WAL", "lab", { con: 8, pc: 1, ld: 1 }) },
  NI:  { v: { uup: 0.37, dup: 0.12, sdlp: 0.20, sf: 0.08, apni: 0.10, oth: 0.13 }, s: fy("1979", "NI", "uup", { dup: 1, sdlp: 3, apni: 1, oth: 3 }) },
};

// ── 1983: the Falklands, mass unemployment, Foot's long suicide note ───────
const RESULT_1983: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.44, con: 0.34, ld: 0.21 }, s: fy("1983", "NE", "lab", { con: 11, ld: 1 }) },
  NW:  { v: { con: 0.41, lab: 0.39, ld: 0.19 }, s: fy("1983", "NW", "con", { lab: 32, ld: 2 }) },
  YH:  { v: { con: 0.39, lab: 0.37, ld: 0.23 }, s: fy("1983", "YH", "con", { lab: 26, ld: 1 }) },
  EM:  { v: { con: 0.47, lab: 0.29, ld: 0.23 }, s: fy("1983", "EM", "con", { lab: 13, ld: 1 }) },
  WM:  { v: { con: 0.45, lab: 0.32, ld: 0.22 }, s: fy("1983", "WM", "con", { lab: 22, ld: 1 }) },
  EE:  { v: { con: 0.51, lab: 0.20, ld: 0.27 }, s: fy("1983", "EE", "con", { lab: 8, ld: 3 }) },
  LON: { v: { con: 0.44, lab: 0.30, ld: 0.24 }, s: fy("1983", "LON", "con", { lab: 26, ld: 3 }) },
  SE:  { v: { con: 0.55, lab: 0.15, ld: 0.28 }, s: fy("1983", "SE", "con", { lab: 6, ld: 5 }) },
  SW:  { v: { con: 0.51, lab: 0.14, ld: 0.33 }, s: fy("1983", "SW", "con", { lab: 4, ld: 6 }) },
  SCO: { v: { lab: 0.35, con: 0.28, ld: 0.24, snp: 0.12 }, s: fy("1983", "SCO", "lab", { con: 18, snp: 1, ld: 6 }) },
  WAL: { v: { lab: 0.38, con: 0.31, ld: 0.23, pc: 0.08 }, s: fy("1983", "WAL", "lab", { con: 10, pc: 2, ld: 2 }) },
  NI:  { v: { uup: 0.34, dup: 0.20, sdlp: 0.18, sf: 0.13, apni: 0.08, oth: 0.07 }, s: fy("1983", "NI", "uup", { dup: 2, sdlp: 1, sf: 1, apni: 1, oth: 3 }) },
};

// ── 1987: boom in the South, a slick Labour relaunch, Thatcher's third term ─
const RESULT_1987: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.50, con: 0.32, ld: 0.18 }, s: fy("1987", "NE", "lab", { con: 8, ld: 1 }) },
  NW:  { v: { lab: 0.43, con: 0.40, ld: 0.17 }, s: fy("1987", "NW", "lab", { con: 35, ld: 2 }) },
  YH:  { v: { lab: 0.42, con: 0.39, ld: 0.18 }, s: fy("1987", "YH", "lab", { con: 25, ld: 1 }) },
  EM:  { v: { con: 0.48, lab: 0.34, ld: 0.18 }, s: fy("1987", "EM", "con", { lab: 15, ld: 1 }) },
  WM:  { v: { con: 0.46, lab: 0.36, ld: 0.18 }, s: fy("1987", "WM", "con", { lab: 24, ld: 1 }) },
  EE:  { v: { con: 0.52, lab: 0.23, ld: 0.25 }, s: fy("1987", "EE", "con", { lab: 9, ld: 3 }) },
  LON: { v: { con: 0.46, lab: 0.32, ld: 0.21 }, s: fy("1987", "LON", "con", { lab: 30, ld: 3 }) },
  SE:  { v: { con: 0.56, lab: 0.16, ld: 0.27 }, s: fy("1987", "SE", "con", { lab: 7, ld: 5 }) },
  SW:  { v: { con: 0.52, lab: 0.16, ld: 0.31 }, s: fy("1987", "SW", "con", { lab: 5, ld: 6 }) },
  SCO: { v: { lab: 0.42, con: 0.24, ld: 0.19, snp: 0.14 }, s: fy("1987", "SCO", "lab", { con: 12, snp: 3, ld: 6 }) },
  WAL: { v: { lab: 0.45, con: 0.30, ld: 0.18, pc: 0.07 }, s: fy("1987", "WAL", "lab", { con: 8, pc: 2, ld: 2 }) },
  NI:  { v: { uup: 0.33, dup: 0.18, sdlp: 0.21, sf: 0.11, apni: 0.10, oth: 0.07 }, s: fy("1987", "NI", "uup", { dup: 2, sdlp: 2, sf: 1, apni: 1, oth: 3 }) },
};

// ── 1992: a recession, a new Tory leader, and Labour's poll lead that wasn't ─
const RESULT_1992: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.55, con: 0.31, ld: 0.13 }, s: fy("1992", "NE", "lab", { con: 6, ld: 1 }) },
  NW:  { v: { lab: 0.45, con: 0.38, ld: 0.16 }, s: fy("1992", "NW", "lab", { con: 30, ld: 2 }) },
  YH:  { v: { lab: 0.44, con: 0.38, ld: 0.17 }, s: fy("1992", "YH", "lab", { con: 24, ld: 1 }) },
  EM:  { v: { con: 0.47, lab: 0.37, ld: 0.15 }, s: fy("1992", "EM", "con", { lab: 17, ld: 1 }) },
  WM:  { v: { con: 0.45, lab: 0.39, ld: 0.15 }, s: fy("1992", "WM", "con", { lab: 26, ld: 1 }) },
  EE:  { v: { con: 0.51, lab: 0.27, ld: 0.20 }, s: fy("1992", "EE", "con", { lab: 11, ld: 3 }) },
  LON: { v: { con: 0.45, lab: 0.40, ld: 0.14 }, s: fy("1992", "LON", "con", { lab: 33, ld: 3 }) },
  SE:  { v: { con: 0.55, lab: 0.20, ld: 0.23 }, s: fy("1992", "SE", "con", { lab: 9, ld: 6 }) },
  SW:  { v: { con: 0.50, lab: 0.19, ld: 0.29 }, s: fy("1992", "SW", "con", { lab: 6, ld: 9 }) },
  SCO: { v: { lab: 0.39, con: 0.26, snp: 0.21, ld: 0.13 }, s: fy("1992", "SCO", "lab", { con: 11, snp: 4, ld: 8 }) },
  WAL: { v: { lab: 0.50, con: 0.29, ld: 0.12, pc: 0.09 }, s: fy("1992", "WAL", "lab", { con: 6, pc: 4, ld: 1 }) },
  NI:  { v: { uup: 0.35, dup: 0.13, sdlp: 0.24, sf: 0.10, apni: 0.09, oth: 0.09 }, s: fy("1992", "NI", "uup", { dup: 2, sdlp: 3, apni: 1, oth: 3 }) },
};

// ── 2001: the quiet landslide, Blair's second term ─────────────────────────
const RESULT_2001: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.59, con: 0.22, ld: 0.16 }, s: fy("2001", "NE", "lab", { con: 1, ld: 1 }) },
  NW:  { v: { lab: 0.51, con: 0.29, ld: 0.16 }, s: fy("2001", "NW", "lab", { con: 7, ld: 3 }) },
  YH:  { v: { lab: 0.49, con: 0.30, ld: 0.17 }, s: fy("2001", "YH", "lab", { con: 7, ld: 2 }) },
  EM:  { v: { lab: 0.45, con: 0.37, ld: 0.15 }, s: fy("2001", "EM", "lab", { con: 13, ld: 1 }) },
  WM:  { v: { lab: 0.45, con: 0.36, ld: 0.15 }, s: fy("2001", "WM", "lab", { con: 15, ld: 1 }) },
  EE:  { v: { lab: 0.39, con: 0.38, ld: 0.18 }, s: fy("2001", "EE", "lab", { con: 26, ld: 5 }) },
  LON: { v: { lab: 0.47, con: 0.30, ld: 0.17 }, s: fy("2001", "LON", "lab", { con: 13, ld: 5 }) },
  SE:  { v: { con: 0.43, lab: 0.33, ld: 0.20 }, s: fy("2001", "SE", "con", { lab: 30, ld: 9 }) },
  SW:  { v: { con: 0.39, lab: 0.30, ld: 0.27 }, s: fy("2001", "SW", "con", { lab: 15, ld: 15 }) },
  SCO: { v: { lab: 0.44, snp: 0.20, ld: 0.16, con: 0.16 }, s: fy("2001", "SCO", "lab", { snp: 6, ld: 9, con: 1 }) },
  WAL: { v: { lab: 0.49, con: 0.21, pc: 0.14, ld: 0.14 }, s: fy("2001", "WAL", "lab", { pc: 4, con: 1, ld: 2 }) },
  NI:  { v: { uup: 0.27, dup: 0.23, sf: 0.22, sdlp: 0.21, apni: 0.04, oth: 0.03 }, s: fy("2001", "NI", "uup", { dup: 5, sdlp: 3, sf: 4, oth: 1 }) },
};

// ── 2005: Iraq's shadow, a Lib Dem surge, Blair's reduced third term ───────
const RESULT_2005: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.53, con: 0.20, ld: 0.23 }, s: fy("2005", "NE", "lab", { con: 2, ld: 3 }) },
  NW:  { v: { lab: 0.45, con: 0.29, ld: 0.21 }, s: fy("2005", "NW", "lab", { con: 10, ld: 6 }) },
  YH:  { v: { lab: 0.44, con: 0.29, ld: 0.22 }, s: fy("2005", "YH", "lab", { con: 9, ld: 5 }) },
  EM:  { v: { lab: 0.39, con: 0.37, ld: 0.20 }, s: fy("2005", "EM", "lab", { con: 18, ld: 2 }) },
  WM:  { v: { lab: 0.39, con: 0.35, ld: 0.20 }, s: fy("2005", "WM", "lab", { con: 20, ld: 2 }) },
  EE:  { v: { con: 0.43, lab: 0.30, ld: 0.22 }, s: fy("2005", "EE", "con", { lab: 22, ld: 6 }) },
  LON: { v: { lab: 0.39, con: 0.32, ld: 0.22 }, s: fy("2005", "LON", "lab", { con: 21, ld: 8 }) },
  SE:  { v: { con: 0.45, lab: 0.24, ld: 0.25 }, s: fy("2005", "SE", "con", { lab: 25, ld: 12 }) },
  SW:  { v: { con: 0.39, lab: 0.23, ld: 0.33 }, s: fy("2005", "SW", "con", { lab: 13, ld: 16 }) },
  SCO: { v: { lab: 0.40, ld: 0.23, snp: 0.18, con: 0.16 }, s: fy("2005", "SCO", "lab", { snp: 6, ld: 11, con: 1 }) },
  WAL: { v: { lab: 0.43, con: 0.21, ld: 0.18, pc: 0.13 }, s: fy("2005", "WAL", "lab", { pc: 3, con: 3, ld: 4 }) },
  NI:  { v: { dup: 0.34, sf: 0.24, uup: 0.18, sdlp: 0.18, apni: 0.04, oth: 0.02 }, s: fy("2005", "NI", "dup", { uup: 1, sdlp: 3, sf: 5 }) },
};

// ── 1964: thirteen wasted years, Wilson's white heat, a knife-edge win ─────
// Labour 317, Con 304 (incl. 12 Ulster Unionists who took the Tory whip),
// Lib 9. A Labour majority of four. In-game the Ulster Unionists sit as their
// own party (uup), so Con reads 292 GB seats; Labour is still largest and
// clears the 316 bar for a bare majority.
const RESULT_1964: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.55, con: 0.38, ld: 0.07 }, s: fy("1964", "NE", "lab", { con: 5 }) },
  NW:  { v: { lab: 0.48, con: 0.42, ld: 0.10 }, s: fy("1964", "NW", "lab", { con: 26, ld: 1 }) },
  YH:  { v: { lab: 0.50, con: 0.40, ld: 0.10 }, s: fy("1964", "YH", "lab", { con: 19 }) },
  EM:  { v: { con: 0.47, lab: 0.44, ld: 0.09 }, s: fy("1964", "EM", "con", { lab: 20 }) },
  WM:  { v: { lab: 0.47, con: 0.44, ld: 0.09 }, s: fy("1964", "WM", "lab", { con: 24 }) },
  EE:  { v: { con: 0.50, lab: 0.39, ld: 0.11 }, s: fy("1964", "EE", "con", { lab: 17 }) },
  LON: { v: { lab: 0.49, con: 0.43, ld: 0.08 }, s: fy("1964", "LON", "lab", { con: 27 }) },
  SE:  { v: { con: 0.52, lab: 0.36, ld: 0.12 }, s: fy("1964", "SE", "con", { lab: 19, ld: 1 }) },
  SW:  { v: { con: 0.48, lab: 0.39, ld: 0.13 }, s: fy("1964", "SW", "con", { lab: 22, ld: 1 }) },
  SCO: { v: { lab: 0.49, con: 0.37, ld: 0.09, snp: 0.05 }, s: fy("1964", "SCO", "lab", { con: 24, ld: 4 }) },
  WAL: { v: { lab: 0.58, con: 0.29, ld: 0.07, pc: 0.06 }, s: fy("1964", "WAL", "lab", { con: 6, ld: 2 }) },
  NI:  { v: { uup: 0.63, oth: 0.37 }, s: fy("1964", "NI", "uup", {}) },
};

// ── 1966: Wilson goes to the country for a real majority, and gets a landslide ─
// Labour 364, Con 253 (incl. 11 Ulster Unionists), Lib 12, Republican Labour 1.
// A Labour majority of 98.
const RESULT_1966: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.58, con: 0.35, ld: 0.07 }, s: fy("1966", "NE", "lab", { con: 4 }) },
  NW:  { v: { lab: 0.50, con: 0.40, ld: 0.10 }, s: fy("1966", "NW", "lab", { con: 22, ld: 1 }) },
  YH:  { v: { lab: 0.53, con: 0.38, ld: 0.09 }, s: fy("1966", "YH", "lab", { con: 16 }) },
  EM:  { v: { lab: 0.49, con: 0.42, ld: 0.09 }, s: fy("1966", "EM", "lab", { con: 20 }) },
  WM:  { v: { lab: 0.50, con: 0.41, ld: 0.09 }, s: fy("1966", "WM", "lab", { con: 19 }) },
  EE:  { v: { con: 0.47, lab: 0.43, ld: 0.10 }, s: fy("1966", "EE", "con", { lab: 21, ld: 1 }) },
  LON: { v: { lab: 0.52, con: 0.40, ld: 0.08 }, s: fy("1966", "LON", "lab", { con: 22, ld: 1 }) },
  SE:  { v: { con: 0.48, lab: 0.40, ld: 0.12 }, s: fy("1966", "SE", "con", { lab: 33, ld: 2 }) },
  SW:  { v: { con: 0.46, lab: 0.41, ld: 0.13 }, s: fy("1966", "SW", "con", { lab: 23, ld: 1 }) },
  SCO: { v: { lab: 0.50, con: 0.35, ld: 0.10, snp: 0.05 }, s: fy("1966", "SCO", "lab", { con: 20, ld: 5 }) },
  WAL: { v: { lab: 0.61, con: 0.28, ld: 0.05, pc: 0.06 }, s: fy("1966", "WAL", "lab", { con: 3, ld: 1 }) },
  NI:  { v: { uup: 0.60, oth: 0.40 }, s: fy("1966", "NI", "uup", { oth: 1 }) },
};

// ── 1970: the shock at the polls, Heath's upset over Wilson ────────────────
// Con 330 (incl. Ulster Unionists), Lab 288, Lib 6, SNP 1, others. A Conservative
// majority of 30 that almost every poll missed. Devaluation and a late bad set
// of trade figures broke Labour's lead.
const RESULT_1970: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.55, con: 0.38, ld: 0.07 }, s: fy("1970", "NE", "lab", { con: 6 }) },
  NW:  { v: { lab: 0.47, con: 0.45, ld: 0.08 }, s: fy("1970", "NW", "lab", { con: 28 }) },
  YH:  { v: { lab: 0.49, con: 0.43, ld: 0.08 }, s: fy("1970", "YH", "lab", { con: 20 }) },
  EM:  { v: { con: 0.48, lab: 0.44, ld: 0.08 }, s: fy("1970", "EM", "con", { lab: 18 }) },
  WM:  { v: { con: 0.47, lab: 0.47, ld: 0.06 }, s: fy("1970", "WM", "con", { lab: 26 }) },
  EE:  { v: { con: 0.52, lab: 0.40, ld: 0.08 }, s: fy("1970", "EE", "con", { lab: 13 }) },
  LON: { v: { lab: 0.49, con: 0.46, ld: 0.05 }, s: fy("1970", "LON", "lab", { con: 31 }) },
  SE:  { v: { con: 0.53, lab: 0.38, ld: 0.09 }, s: fy("1970", "SE", "con", { lab: 24 }) },
  SW:  { v: { con: 0.51, lab: 0.38, ld: 0.11 }, s: fy("1970", "SW", "con", { lab: 5, ld: 1 }) },
  SCO: { v: { lab: 0.45, con: 0.38, ld: 0.06, snp: 0.11 }, s: fy("1970", "SCO", "lab", { con: 23, ld: 3, snp: 1 }) },
  WAL: { v: { lab: 0.52, con: 0.28, ld: 0.10, pc: 0.10 }, s: fy("1970", "WAL", "lab", { con: 7, ld: 2 }) },
  NI:  { v: { uup: 0.55, oth: 0.45 }, s: fy("1970", "NI", "uup", { oth: 4 }) },
};

// ── 1974 (February): the three-day week, "who governs?", and a hung parliament ─
// Con 297, Lab 301, Lib 14, SNP 7, Plaid 2, and the Ulster Unionists broken from
// the Tory whip. No majority. Heath tried and failed to deal with Thorpe's
// Liberals; Wilson formed a Labour minority government. In-game Labour is largest
// but short of 318, and no compatible partner bridges the gap, so the engine
// returns a Labour minority (its honest reading of a hung parliament).
const RESULT_1974feb: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.50, con: 0.35, ld: 0.15 }, s: fy("1974feb", "NE", "lab", { con: 7 }) },
  NW:  { v: { lab: 0.43, con: 0.40, ld: 0.17 }, s: fy("1974feb", "NW", "lab", { con: 28, ld: 1 }) },
  YH:  { v: { lab: 0.45, con: 0.38, ld: 0.17 }, s: fy("1974feb", "YH", "lab", { con: 22 }) },
  EM:  { v: { con: 0.42, lab: 0.40, ld: 0.18 }, s: fy("1974feb", "EM", "con", { lab: 21 }) },
  WM:  { v: { lab: 0.44, con: 0.42, ld: 0.14 }, s: fy("1974feb", "WM", "lab", { con: 26 }) },
  EE:  { v: { con: 0.45, lab: 0.33, ld: 0.22 }, s: fy("1974feb", "EE", "con", { lab: 17, ld: 1 }) },
  LON: { v: { lab: 0.43, con: 0.40, ld: 0.16, oth: 0.01 }, s: fy("1974feb", "LON", "lab", { con: 30, ld: 1, oth: 1 }) },
  SE:  { v: { con: 0.48, lab: 0.30, ld: 0.22 }, s: fy("1974feb", "SE", "con", { lab: 26, ld: 3 }) },
  SW:  { v: { con: 0.46, lab: 0.30, ld: 0.23, oth: 0.01 }, s: fy("1974feb", "SW", "con", { lab: 18, ld: 3, oth: 1 }) },
  SCO: { v: { lab: 0.37, con: 0.33, ld: 0.08, snp: 0.22 }, s: fy("1974feb", "SCO", "lab", { con: 21, ld: 3, snp: 7 }) },
  WAL: { v: { lab: 0.47, con: 0.26, ld: 0.16, pc: 0.11 }, s: fy("1974feb", "WAL", "lab", { con: 8, ld: 2, pc: 2 }) },
  NI:  { v: { uup: 0.55, sdlp: 0.24, oth: 0.21 }, s: fy("1974feb", "NI", "uup", { sdlp: 1 }) },
};

// ── 1974 (October): Wilson goes back for a working majority, and scrapes one ─
// Lab 319, Con 277, Lib 13, SNP 11, Plaid 3. A Labour overall majority of three,
// gone within a couple of years of by-elections. In-game Labour clears the 318
// bar by one for a bare majority.
const RESULT_1974oct: Record<string, RegionResult> = {
  NE:  { v: { lab: 0.52, con: 0.33, ld: 0.15 }, s: fy("1974oct", "NE", "lab", { con: 7 }) },
  NW:  { v: { lab: 0.44, con: 0.39, ld: 0.17 }, s: fy("1974oct", "NW", "lab", { con: 27, ld: 1 }) },
  YH:  { v: { lab: 0.46, con: 0.37, ld: 0.17 }, s: fy("1974oct", "YH", "lab", { con: 21 }) },
  EM:  { v: { con: 0.43, lab: 0.44, ld: 0.13 }, s: fy("1974oct", "EM", "con", { lab: 22 }) },
  WM:  { v: { lab: 0.45, con: 0.42, ld: 0.13 }, s: fy("1974oct", "WM", "lab", { con: 25 }) },
  EE:  { v: { con: 0.44, lab: 0.34, ld: 0.22 }, s: fy("1974oct", "EE", "con", { lab: 19, ld: 1 }) },
  LON: { v: { lab: 0.45, con: 0.38, ld: 0.16 }, s: fy("1974oct", "LON", "lab", { con: 28, ld: 1 }) },
  SE:  { v: { con: 0.46, lab: 0.32, ld: 0.22 }, s: fy("1974oct", "SE", "con", { lab: 30, ld: 2 }) },
  SW:  { v: { con: 0.44, lab: 0.33, ld: 0.23 }, s: fy("1974oct", "SW", "con", { lab: 23, ld: 3 }) },
  SCO: { v: { lab: 0.36, con: 0.25, ld: 0.08, snp: 0.30 }, s: fy("1974oct", "SCO", "lab", { con: 16, ld: 3, snp: 11 }) },
  WAL: { v: { lab: 0.49, con: 0.24, ld: 0.15, pc: 0.11 }, s: fy("1974oct", "WAL", "lab", { con: 8, ld: 2, pc: 3 }) },
  NI:  { v: { uup: 0.52, sdlp: 0.22, oth: 0.26 }, s: fy("1974oct", "NI", "uup", { sdlp: 1, oth: 1 }) },
};

export const UK_ELECTIONS: Record<string, UkElectionData> = {
  "1951": {
    id: "1951", year: 1951,
    label: "1951 · Churchill v. Attlee",
    tagline: "October 1951. Six years of Labour austerity, rationing still on the shelves, and Churchill promising to set the people free. Can Attlee hold on, or does the old lion get one last roar?",
    salience: { economy: 0.90, cost_of_living: 0.80, housing: 0.80, nhs: 0.70, defence: 0.70, taxation: 0.60, crime: 0.30, europe: 0.20, scottish_independence: 0.10, immigration: 0.10, climate: 0.00 },
    majority: { total: 625, threshold: 313 },
    goalText: "313 of 625 seats",
    regions: RESULT_1951,
  },
  "2024": {
    id: "2024", year: 2024,
    label: "2024 · Starmer v. Sunak",
    tagline: "July 2024. Fourteen years of Tory government, a cost-of-living squeeze, and Reform eating the right. Labour smells a landslide. Don't fumble it.",
    salience: { cost_of_living: 0.92, nhs: 0.85, economy: 0.85, immigration: 0.7, housing: 0.55, crime: 0.5, taxation: 0.6, europe: 0.3, climate: 0.4, defence: 0.35, scottish_independence: 0.25 },
    majority: { total: 650, threshold: 326 },
    goalText: "326 of 650 seats",
    regions: RESULT_2024,
  },
  "2019": {
    id: "2019", year: 2019,
    label: "2019 · Johnson v. Corbyn",
    tagline: "December 2019. Three years of Brexit deadlock, a fractured opposition, and the Red Wall up for grabs. Break the impasse.",
    salience: { europe: 0.95, nhs: 0.8, economy: 0.75, immigration: 0.6, cost_of_living: 0.55, crime: 0.45, taxation: 0.55, climate: 0.45, scottish_independence: 0.4, defence: 0.35, housing: 0.45 },
    majority: { total: 650, threshold: 326 },
    goalText: "326 of 650 seats",
    regions: RESULT_2019,
  },
  "2017": {
    id: "2017", year: 2017,
    label: "2017 · May v. Corbyn",
    tagline: "June 2017. A snap election called from a commanding lead, but a manifesto wobble and a surging opposition turn a coronation into a knife-edge.",
    salience: { europe: 0.85, nhs: 0.8, economy: 0.78, taxation: 0.6, immigration: 0.55, crime: 0.55, defence: 0.5, cost_of_living: 0.5, housing: 0.5, climate: 0.4, scottish_independence: 0.45 },
    majority: { total: 650, threshold: 326 },
    goalText: "326 of 650 seats",
    regions: RESULT_2017,
  },
  "2010": {
    id: "2010", year: 2010,
    label: "2010 · Brown v. Cameron v. Clegg",
    tagline: "May 2010. A banking crash, an expenses scandal, and the first TV debates of the age. 'I agree with Nick', and nobody wins outright.",
    salience: { economy: 0.95, nhs: 0.7, taxation: 0.65, immigration: 0.6, crime: 0.55, europe: 0.4, housing: 0.5, climate: 0.45, defence: 0.45, cost_of_living: 0.6, scottish_independence: 0.3 },
    majority: { total: 650, threshold: 326 },
    goalText: "326 of 650 seats",
    regions: RESULT_2010,
  },
  "2015": {
    id: "2015", year: 2015,
    label: "2015 · Cameron v. Miliband",
    tagline: "May 2015. Five years of coalition, a UKIP surge, and an SNP tide rising in Scotland. The polls say a dead heat. They're about to be wrong.",
    salience: { economy: 0.9, nhs: 0.8, immigration: 0.72, europe: 0.55, taxation: 0.6, cost_of_living: 0.6, scottish_independence: 0.6, housing: 0.5, crime: 0.45, defence: 0.4, climate: 0.4 },
    majority: { total: 650, threshold: 326 },
    goalText: "326 of 650 seats",
    regions: RESULT_2015,
  },
  "1997": {
    id: "1997", year: 1997,
    label: "1997 · Blair v. Major",
    tagline: "May 1997. Eighteen years of Conservative rule, a tired government, and a rebranded opposition. Things can only get better. Can you finish the job?",
    salience: { economy: 0.85, nhs: 0.78, taxation: 0.6, crime: 0.6, europe: 0.5, immigration: 0.4, defence: 0.45, housing: 0.5, climate: 0.25, cost_of_living: 0.55, scottish_independence: 0.35 },
    majority: { total: 659, threshold: 330 },
    goalText: "330 of 659 seats",
    regions: RESULT_1997,
  },
  "2005": {
    id: "2005", year: 2005,
    label: "2005 · Blair v. Howard",
    tagline: "May 2005. Iraq hangs over a third Labour term, the Lib Dems surge on the anti-war vote, and Howard's Tories claw back. A majority, but a chastened one.",
    salience: { nhs: 0.78, economy: 0.7, immigration: 0.66, crime: 0.6, defence: 0.62, europe: 0.5, taxation: 0.55, housing: 0.5, cost_of_living: 0.5, climate: 0.35, scottish_independence: 0.3 },
    majority: { total: 646, threshold: 324 },
    goalText: "324 of 646 seats",
    regions: RESULT_2005,
  },
  "2001": {
    id: "2001", year: 2001,
    label: "2001 · Blair v. Hague",
    tagline: "June 2001. Four years of New Labour, a becalmed economy, and a Conservative Party still in the wilderness. The quiet landslide.",
    salience: { nhs: 0.8, economy: 0.72, europe: 0.55, taxation: 0.6, crime: 0.55, immigration: 0.5, housing: 0.45, defence: 0.4, climate: 0.3, cost_of_living: 0.5, scottish_independence: 0.3 },
    majority: { total: 659, threshold: 330 },
    goalText: "330 of 659 seats",
    regions: RESULT_2001,
  },
  "1992": {
    id: "1992", year: 1992,
    label: "1992 · Major v. Kinnock",
    tagline: "April 1992. A recession, a new Conservative leader, and Labour ahead in the polls. The election Labour was sure to win, and the shock that followed.",
    salience: { economy: 0.92, taxation: 0.78, nhs: 0.75, housing: 0.62, europe: 0.5, crime: 0.5, immigration: 0.4, defence: 0.45, cost_of_living: 0.6, climate: 0.2, scottish_independence: 0.38 },
    majority: { total: 651, threshold: 326 },
    goalText: "326 of 651 seats",
    regions: RESULT_1992,
  },
  "1987": {
    id: "1987", year: 1987,
    label: "1987 · Thatcher v. Kinnock",
    tagline: "June 1987. Boom in the South, bust in the North, and a slick Labour relaunch that still can't close the gap. Can Kinnock break the Thatcher grip?",
    salience: { economy: 0.86, nhs: 0.72, defence: 0.66, taxation: 0.6, crime: 0.55, europe: 0.4, housing: 0.55, immigration: 0.4, cost_of_living: 0.55, climate: 0.15, scottish_independence: 0.32 },
    majority: { total: 650, threshold: 326 },
    goalText: "326 of 650 seats",
    regions: RESULT_1987,
  },
  "1983": {
    id: "1983", year: 1983,
    label: "1983 · Thatcher v. Foot",
    tagline: "June 1983. A Falklands triumph, mass unemployment, and a divided left: Labour's 'longest suicide note in history' against a rising Alliance. The landslide year.",
    salience: { defence: 0.82, economy: 0.86, taxation: 0.58, nhs: 0.6, europe: 0.42, crime: 0.5, housing: 0.5, immigration: 0.4, cost_of_living: 0.6, climate: 0.12, scottish_independence: 0.26 },
    majority: { total: 650, threshold: 326 },
    goalText: "326 of 650 seats",
    regions: RESULT_1983,
  },
  "1970": {
    id: "1970", year: 1970,
    label: "1970 · Heath v. Wilson",
    tagline: "June 1970. Wilson is cruising, the polls call it for Labour, and then a bad set of trade figures and a heatwave weekend turn the whole thing over. Heath's upset nobody saw coming.",
    salience: { economy: 0.9, cost_of_living: 0.78, taxation: 0.6, europe: 0.55, housing: 0.55, nhs: 0.6, immigration: 0.5, crime: 0.4, defence: 0.42, scottish_independence: 0.18, climate: 0.0 },
    majority: { total: 630, threshold: 316 },
    goalText: "316 of 630 seats",
    regions: RESULT_1970,
  },
  "1966": {
    id: "1966", year: 1966,
    label: "1966 · Wilson v. Heath",
    tagline: "March 1966. A majority of four is no way to govern. Wilson goes back to the country to turn it into a mandate, and the white heat of technology carries Labour to a landslide.",
    salience: { economy: 0.88, cost_of_living: 0.7, housing: 0.72, nhs: 0.65, taxation: 0.55, defence: 0.5, europe: 0.42, immigration: 0.5, crime: 0.35, scottish_independence: 0.12, climate: 0.0 },
    majority: { total: 630, threshold: 316 },
    goalText: "316 of 630 seats",
    regions: RESULT_1966,
  },
  "1964": {
    id: "1964", year: 1964,
    label: "1964 · Wilson v. Douglas-Home",
    tagline: "October 1964. Thirteen years of Conservative rule, a grouse-moor aristocrat against a Yorkshire technocrat, and the Profumo affair still hanging in the air. The narrowest of Labour wins.",
    salience: { economy: 0.86, cost_of_living: 0.72, housing: 0.7, nhs: 0.66, taxation: 0.56, defence: 0.55, europe: 0.35, immigration: 0.55, crime: 0.38, scottish_independence: 0.12, climate: 0.0 },
    majority: { total: 630, threshold: 316 },
    goalText: "316 of 630 seats",
    regions: RESULT_1964,
  },
  "1974feb": {
    id: "1974feb", year: 1974,
    label: "1974 (Feb) · Heath v. Wilson",
    tagline: "February 1974. The miners are out, the lights go off three days a week, and Heath asks the country a straight question: who governs Britain? The answer is nobody, cleanly. A hung parliament.",
    salience: { economy: 0.94, cost_of_living: 0.9, europe: 0.6, taxation: 0.58, housing: 0.55, nhs: 0.6, defence: 0.42, immigration: 0.45, crime: 0.4, scottish_independence: 0.35, climate: 0.05 },
    majority: { total: 635, threshold: 318 },
    goalText: "318 of 635 seats (or the best hand in a hung parliament)",
    regions: RESULT_1974feb,
  },
  "1974oct": {
    id: "1974oct", year: 1974,
    label: "1974 (Oct) · Wilson v. Heath",
    tagline: "October 1974. Eight months of minority government, and Wilson goes back for the working majority he needs. He gets one of three, and it will melt away seat by seat.",
    salience: { economy: 0.93, cost_of_living: 0.9, europe: 0.55, taxation: 0.58, housing: 0.55, nhs: 0.62, defence: 0.42, immigration: 0.45, crime: 0.4, scottish_independence: 0.42, climate: 0.05 },
    majority: { total: 635, threshold: 318 },
    goalText: "318 of 635 seats",
    regions: RESULT_1974oct,
  },
  "1979": {
    id: "1979", year: 1979,
    label: "1979 · Thatcher v. Callaghan",
    tagline: "May 1979. The Winter of Discontent: strikes, the rubbish piled high, the dead unburied. A tired Labour government meets a new kind of Conservative. Labour isn't working.",
    salience: { economy: 0.9, cost_of_living: 0.72, taxation: 0.62, defence: 0.52, nhs: 0.6, crime: 0.52, immigration: 0.42, housing: 0.5, europe: 0.3, climate: 0.1, scottish_independence: 0.3 },
    majority: { total: 635, threshold: 318 },
    goalText: "318 of 635 seats",
    regions: RESULT_1979,
  },
};

export const UK_ELECTION_IDS = Object.keys(UK_ELECTIONS);
