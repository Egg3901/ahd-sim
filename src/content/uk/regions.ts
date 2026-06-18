import type { UkBlocId } from "./blocs";

// The 12 ITL1 regions of the UK — the contest units of the UK game (England's 9
// regions + Scotland + Wales + Northern Ireland). `seats` is the region's seat
// pool (2024 boundaries; they total 650). `electorate` (thousands of votes cast)
// weights the national vote-share aggregate. `profile` tilts the national bloc
// shares to give each region its demographic texture (London younger/graduate,
// the South West older, etc.).

export type Nation = "england" | "scotland" | "wales" | "northern_ireland";

export interface UkRegionMeta {
  id: string;
  name: string;
  abbr: string;
  nation: Nation;
  seats: number;      // 2024 boundaries
  electorate: number; // thousands of votes cast (approx)
  profile?: Partial<Record<UkBlocId, number>>;
}

export const UK_REGIONS: UkRegionMeta[] = [
  { id: "NE", name: "North East", abbr: "NE", nation: "england", seats: 27, electorate: 1100, profile: { workingclass: 1.3, graduate: 0.8, pensioner: 1.1 } },
  { id: "NW", name: "North West", abbr: "NW", nation: "england", seats: 73, electorate: 3000, profile: { workingclass: 1.2, renter: 1.1 } },
  { id: "YH", name: "Yorkshire & the Humber", abbr: "Y&H", nation: "england", seats: 54, electorate: 2200, profile: { workingclass: 1.2 } },
  { id: "EM", name: "East Midlands", abbr: "EM", nation: "england", seats: 47, electorate: 2000, profile: { workingclass: 1.15, homeowner: 1.1 } },
  { id: "WM", name: "West Midlands", abbr: "WM", nation: "england", seats: 57, electorate: 2300, profile: { workingclass: 1.15 } },
  { id: "EE", name: "East of England", abbr: "East", nation: "england", seats: 61, electorate: 2700, profile: { homeowner: 1.2, pensioner: 1.1 } },
  { id: "LON", name: "London", abbr: "London", nation: "england", seats: 75, electorate: 3300, profile: { young: 1.3, graduate: 1.4, renter: 1.4, pensioner: 0.7, homeowner: 0.7 } },
  { id: "SE", name: "South East", abbr: "SE", nation: "england", seats: 91, electorate: 4100, profile: { homeowner: 1.25, graduate: 1.1, pensioner: 1.1 } },
  { id: "SW", name: "South West", abbr: "SW", nation: "england", seats: 58, electorate: 2700, profile: { homeowner: 1.2, pensioner: 1.25 } },
  { id: "SCO", name: "Scotland", abbr: "Scot", nation: "scotland", seats: 57, electorate: 2600 },
  { id: "WAL", name: "Wales", abbr: "Wales", nation: "wales", seats: 32, electorate: 1300, profile: { workingclass: 1.2, pensioner: 1.1 } },
  { id: "NI", name: "Northern Ireland", abbr: "NI", nation: "northern_ireland", seats: 18, electorate: 700 },
];

export const UK_REGIONS_BY_ID: Record<string, UkRegionMeta> = Object.fromEntries(
  UK_REGIONS.map((r) => [r.id, r]),
);

// Sanity: the seat pools must total 650.
export const UK_TOTAL_SEATS = UK_REGIONS.reduce((s, r) => s + r.seats, 0);
