// ─────────────────────────────────────────────────────────────────────────
// SCENARIO REGISTRY — one row per playable election across every country.
// The registry is metadata only (free/paid, pack, difficulty, routing); the
// scenario *content* stays where each engine path already keeps it:
//   - US:  content/scenarios.ts        (nativeId = "2024", "2020", …)
//   - UK:  content/uk/elections.ts     (nativeId = "2024", "1997", …)
//   - new: content/countries/*.ts      (nativeId = election id in the bundle)
// Shared by the client (picker, locks) and the server (entitlement).
// ─────────────────────────────────────────────────────────────────────────

export type CountryCode = "US" | "UK" | "CA" | "DE" | "FR";
export type EnginePath = "us" | "uk" | "country";

export interface ScenarioMeta {
  scenarioId: string;      // global id: "us-2024", "uk-1997", "ca-2025"
  country: CountryCode;
  engine: EnginePath;      // which game shell runs it
  nativeId: string;        // the id the engine path uses internally
  year: number;
  free: boolean;
  packId?: string;
  difficulty: "easy" | "medium" | "hard";
  label: string;
  description: string;
  flag: string;
}

const us = (year: number, label: string, description: string, free: boolean, difficulty: ScenarioMeta["difficulty"]): ScenarioMeta => ({
  scenarioId: `us-${year}`, country: "US", engine: "us", nativeId: String(year), year,
  free, packId: free ? undefined : "us-historical", difficulty, label, description, flag: "🇺🇸",
});

const uk = (year: number, label: string, description: string, difficulty: ScenarioMeta["difficulty"]): ScenarioMeta => ({
  scenarioId: `uk-${year}`, country: "UK", engine: "uk", nativeId: String(year), year,
  free: false, packId: "uk-elections", difficulty, label, description, flag: "🇬🇧",
});

export const SCENARIO_REGISTRY: ScenarioMeta[] = [
  // ── United States (presidential) ──
  us(2024, "2024 · Harris v. Trump", "A late switch at the top of the ticket, the Sun Belt and the Blue Wall both in play.", true, "medium"),
  us(2020, "2020 · Biden v. Trump", "A pandemic on the ballot and a blue wall to rebuild. The original campaign.", true, "medium"),
  us(2016, "2016 · Clinton v. Trump", "The map looks settled and the blue wall looks safe — don't be the one who let it crack.", false, "hard"),
  us(2012, "2012 · Obama v. Romney", "A slow recovery, a re-election fight, and a turnout war in the swing states.", false, "easy"),
  us(2008, "2008 · Obama v. McCain", "An open seat, two wars, and a financial system in free fall.", false, "easy"),
  us(2004, "2004 · Bush v. Kerry", "A wartime incumbent, a decorated challenger. It runs through Ohio.", false, "medium"),
  us(2000, "2000 · Gore v. Bush", "A knife's-edge electorate — and a recount waiting to happen.", false, "hard"),

  // ── United Kingdom (general elections) ──
  uk(2024, "2024 · Starmer's landslide", "Fourteen years of Conservative rule end — or do they? Reform surges on the right.", "medium"),
  uk(2019, "2019 · Get Brexit Done", "Johnson's gamble: smash the Red Wall or lose the majority.", "medium"),
  uk(2017, "2017 · May's gamble", "A snap election, a collapsing lead, and a hung parliament in waiting.", "hard"),
  uk(2015, "2015 · Cameron v. Miliband", "Coalition's end, the SNP tide in Scotland, and a polling shock.", "medium"),
  uk(2010, "2010 · The TV-debate election", "Expenses, Cleggmania, and the first hung parliament in a generation.", "medium"),
  uk(2005, "2005 · Blair's third act", "Iraq shadows a tired landslide. How much of the majority survives?", "easy"),
  uk(2001, "2001 · The quiet landslide", "New Labour ascendant; the Tories search for a pulse.", "easy"),
  uk(1997, "1997 · Things Can Only Get Better", "Blair's New Labour against a Major government running on fumes.", "easy"),
  uk(1992, "1992 · Major's surprise", "The polls say Kinnock; the ballot boxes disagree. Defy the polls.", "hard"),
  uk(1987, "1987 · Thatcher's third", "The Iron Lady seeks a third term against a divided opposition.", "medium"),
  uk(1983, "1983 · The Falklands election", "Thatcher rampant, Labour's longest suicide note, the Alliance splitting the left.", "hard"),
  uk(1979, "1979 · Winter of Discontent", "Callaghan limps to the polls; Thatcher offers a revolution.", "medium"),
  uk(1951, "1951 · Churchill's comeback", "Attlee's exhausted majority against Churchill's last campaign.", "medium"),

  // ── New countries ──
  {
    scenarioId: "ca-2025", country: "CA", engine: "country", nativeId: "2025", year: 2025,
    free: false, packId: "global", difficulty: "medium", flag: "🇨🇦",
    label: "2025 · Carney v. Poilievre",
    description: "A tariff war with the neighbour, a Liberal comeback for the ages, and 343 seats from coast to coast to coast.",
  },
  {
    scenarioId: "de-2025", country: "DE", engine: "country", nativeId: "2025", year: 2025,
    free: false, packId: "global", difficulty: "hard", flag: "🇩🇪",
    label: "2025 · Merz v. Scholz",
    description: "The traffic-light coalition collapses. Five-plus parties, a firewall under strain, and 630 Bundestag seats.",
  },
  {
    scenarioId: "fr-2027", country: "FR", engine: "country", nativeId: "2027", year: 2027,
    free: false, packId: "global", difficulty: "hard", flag: "🇫🇷",
    label: "2027 · The Republic's runoff",
    description: "Macron is term-limited. The centre defends the Élysée against the RN in a two-round fight for France.",
  },
];

export const SCENARIOS_BY_ID: Record<string, ScenarioMeta> = Object.fromEntries(
  SCENARIO_REGISTRY.map((s) => [s.scenarioId, s]),
);

export const FREE_SCENARIO_IDS = SCENARIO_REGISTRY.filter((s) => s.free).map((s) => s.scenarioId);

// Master paywall switch, shared by the client (locks, copy) and the server
// (entitlement checks). While false, every scenario is playable by everyone;
// the packs/activation machinery stays intact so flipping this back on
// restores the paid tiers without further changes.
export const PAYWALL_ENABLED = false;

export function isFreeScenario(scenarioId: string): boolean {
  const meta = SCENARIOS_BY_ID[scenarioId];
  if (!meta) return false; // unknown ids stay locked (leaderboard rejects them)
  if (!PAYWALL_ENABLED) return true;
  return meta.free;
}
