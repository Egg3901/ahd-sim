import type { PoliticalSystem, PartyDef } from "@engine/system";

// UK parties. GB-wide parties contest Great Britain; SNP only Scotland, Plaid
// only Wales, and the NI parties only Northern Ireland (a distinct party system).
// "oth" is the catch-all for independents / Speaker / minor parties.
export const UK_PARTIES: PartyDef[] = [
  { id: "con", name: "Conservative Party", shortName: "Con", color: "#0087dc", scope: "national" },
  { id: "lab", name: "Labour Party", shortName: "Lab", color: "#e4003b", scope: "national" },
  { id: "ld", name: "Liberal Democrats", shortName: "LD", color: "#faa61a", scope: "national" },
  { id: "ref", name: "Reform UK", shortName: "Reform", color: "#12b6cf", scope: "national" },
  { id: "grn", name: "Green Party", shortName: "Green", color: "#02a95b", scope: "national" },
  { id: "snp", name: "Scottish National Party", shortName: "SNP", color: "#fdf38e", scope: "scotland" },
  { id: "pc", name: "Plaid Cymru", shortName: "Plaid", color: "#005b54", scope: "wales" },
  // Northern Ireland.
  { id: "dup", name: "Democratic Unionist Party", shortName: "DUP", color: "#d46a4c", scope: "northern_ireland" },
  { id: "sf", name: "Sinn Féin", shortName: "SF", color: "#326760", scope: "northern_ireland" },
  { id: "uup", name: "Ulster Unionist Party", shortName: "UUP", color: "#48a5ee", scope: "northern_ireland" },
  { id: "sdlp", name: "Social Democratic & Labour Party", shortName: "SDLP", color: "#99ff66", scope: "northern_ireland" },
  { id: "apni", name: "Alliance Party", shortName: "Alliance", color: "#f6cb2f", scope: "northern_ireland" },
  { id: "oth", name: "Others / Independents", shortName: "Other", color: "#9aa0a6", scope: "national" },
];

// Sinn Féin abstain from Westminster — they win seats but never take them, which
// lowers the effective majority bar (the engine's formGovernment handles this).
export const UK_ABSTAINING: string[] = ["sf"];

export const UK_SYSTEM: PoliticalSystem = {
  id: "UK",
  label: "United Kingdom",
  parties: UK_PARTIES,
  allocation: {
    id: "regional_seats_curve",
    label: "First-past-the-post (regional seats curve)",
    unit: "seat",
  },
  majority: {
    total: 650,
    threshold: 326,
  },
};

export const PARTY_BY_ID: Record<string, PartyDef> = Object.fromEntries(
  UK_PARTIES.map((p) => [p.id, p]),
);
