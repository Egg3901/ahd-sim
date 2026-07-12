// Purchasable scenario bundles. Price in USD cents. The server seeds
// activation codes per pack; redeeming a pack code unlocks every scenario in
// it. This file is shared by the client (labels) and the server (entitlement).

export interface ScenarioPack {
  id: string;
  name: string;
  description: string;
  price: number; // USD cents — offline fallback only; the canonical price is the
                 // platform catalog (GET /api/catalog -> /account/api/catalog).
  scenarios: string[];
}

export const US_PAID = [
  "us-2016", "us-2012", "us-2008", "us-2004", "us-2000",
  "us-1996", "us-1992", "us-1988", "us-1984", "us-1980",
  "us-1976", "us-1972", "us-1968", "us-1964", "us-1960",
];
export const UK_ALL = [
  "uk-2024", "uk-2019", "uk-2017", "uk-2015", "uk-2010", "uk-2005", "uk-2001",
  "uk-1997", "uk-1992", "uk-1987", "uk-1983", "uk-1979",
  "uk-1974oct", "uk-1974feb", "uk-1970", "uk-1966", "uk-1964", "uk-1951",
];
export const GLOBAL_ALL = [
  "ca-2025", "ca-2021", "ca-2019", "ca-2015", "de-2025", "de-2021", "de-2017",
  "fr-2027", "fr-2022", "fr-2017", "fr-2012", "au-2025", "au-2022", "au-2019",
];

export const ALL_PAID = [...US_PAID, ...UK_ALL, ...GLOBAL_ALL];

export const PACKS: ScenarioPack[] = [
  {
    id: "us-historical",
    name: "US Historical Elections",
    description: "Fifteen races from 1960 to 2016: the Kennedy debates, the Daisy ad, Watergate, the Reagan Revolution, the Florida recount, the Rust Belt upset. Each comes with its real campaign events.",
    price: 499,
    scenarios: US_PAID,
  },
  {
    id: "uk-elections",
    name: "UK General Elections",
    description: "Eighteen elections, from Churchill's 1951 comeback through the Wilson and Heath years to Starmer's 2024 landslide. Multiparty first past the post: coalitions, hung parliaments, real story beats.",
    price: 799,
    scenarios: UK_ALL,
  },
  {
    id: "global",
    name: "Global Elections Pack",
    description: "Fourteen elections in four countries: Canada 2015 to 2025, Germany 2017 to 2025, France 2012 to 2027, Australia 2019 to 2025. Four different electoral systems, real maps and parties.",
    price: 599,
    scenarios: GLOBAL_ALL,
  },
  {
    id: "complete",
    name: "Complete Collection",
    description: "Every scenario in the game: US races back to 1960, every UK election since 1951, and the full global roster.",
    price: 999,
    scenarios: ALL_PAID,
  },
];

export const PACKS_BY_ID: Record<string, ScenarioPack> = Object.fromEntries(PACKS.map((p) => [p.id, p]));

/** The cheapest pack that unlocks a scenario (for paywall prompts). */
export function packForScenario(scenarioId: string): ScenarioPack | undefined {
  return PACKS
    .filter((p) => p.scenarios.includes(scenarioId))
    .sort((a, b) => a.price - b.price)[0];
}
