// GERMANY 2025 — the 21st Bundestag election (February 23, 2025). 630 seats
// under the reformed (fully proportional) electoral law; 316 for a majority.
// Real result as the calibration anchor: Union 208, AfD 152, SPD 120, Greens 85,
// Linke 64, SSW 1 — FDP and BSW under the 5% threshold. Seat elasticity is 1.0:
// proportional representation moves seats one-for-one with vote share.

import type { CountryBundle } from "@engine/countryGame";

export const GERMANY: CountryBundle = {
  id: "DE",
  label: "Germany",
  flag: "🇩🇪",
  currency: "€",
  unitName: "seat",
  unitNamePlural: "seats",
  goalText: "316 of 630 seats",
  defaultSeatElasticity: 1.0,
  eventChance: 0.7,

  system: {
    id: "DE",
    label: "Germany",
    parties: [
      { id: "cdu", name: "CDU/CSU (Union)", shortName: "Union", color: "#151518" },
      { id: "afd", name: "Alternative für Deutschland", shortName: "AfD", color: "#009ee0" },
      { id: "spd", name: "Social Democratic Party", shortName: "SPD", color: "#e3000f" },
      { id: "grn", name: "Alliance 90/The Greens", shortName: "Grüne", color: "#409a3c" },
      { id: "lnk", name: "Die Linke", shortName: "Linke", color: "#be3075" },
      { id: "oth", name: "Others (FDP, BSW, SSW…)", shortName: "Other", color: "#9aa0a6" },
    ],
    allocation: { id: "regional_seats_curve", label: "Proportional representation (regional pools)", unit: "seat" },
    majority: { total: 630, threshold: 316 },
  },
  playable: ["cdu", "spd", "afd", "grn", "lnk"],
  abstaining: [],
  // The firewall (Brandmauer): no democratic party partners the AfD, and the
  // Union's incompatibility resolution rules out governing with Die Linke.
  compatible: (lead, partner) => {
    if (lead === "afd" || partner === "afd") return false;
    const cduLnk = new Set([lead, partner]);
    if (cduLnk.has("cdu") && cduLnk.has("lnk")) return false;
    return true;
  },

  issues: [
    { id: "economy", name: "Economy & industry", blurb: "Two years of recession, expensive energy, and an auto industry under siege." },
    { id: "migration", name: "Migration", blurb: "Border control and asylum policy after a string of attacks." },
    { id: "ukraine_security", name: "Ukraine & security", blurb: "War on the continent, defence spending, and the American question." },
    { id: "energy_climate", name: "Energy & climate", blurb: "The Energiewende's costs and the path off Russian gas." },
    { id: "pensions", name: "Pensions & welfare", blurb: "An ageing society and the future of the social state." },
    { id: "housing", name: "Housing & rents", blurb: "Rent pressure in every big city." },
  ],

  blocs: [
    { id: "young", name: "Young voters (18–29)", share: 0.18, turnoutPropensity: 0.68,
      tilt: { lnk: 0.5, grn: 0.25, afd: 0.15, cdu: -0.35, spd: -0.3 } },
    { id: "graduate", name: "University graduates", share: 0.28, turnoutPropensity: 0.83,
      tilt: { grn: 0.4, cdu: 0.05, lnk: 0.1, spd: 0.0, afd: -0.5 } },
    { id: "worker", name: "Workers (Arbeiter)", share: 0.30, turnoutPropensity: 0.7,
      tilt: { afd: 0.5, spd: 0.15, cdu: -0.05, grn: -0.35, lnk: 0.05 } },
    { id: "homeowner", name: "Suburban homeowners", share: 0.30, turnoutPropensity: 0.82,
      tilt: { cdu: 0.35, afd: 0.1, grn: -0.15, lnk: -0.2 } },
    { id: "pensioner", name: "Pensioners (65+)", share: 0.26, turnoutPropensity: 0.86,
      tilt: { cdu: 0.4, spd: 0.3, afd: -0.1, grn: -0.35, lnk: -0.15 } },
  ],

  regions: [
    { id: "NORTH", name: "The North (NI, SH, HH, HB)", abbr: "North", seats: 95, electorate: 6600, tile: { row: 0, col: 1 },
      profile: { worker: 1.05, homeowner: 1.1 } },
    { id: "NE", name: "Berlin & the Northeast (BE, BB, MV)", abbr: "Berlin+", seats: 80, electorate: 4600, tile: { row: 0, col: 2 },
      profile: { young: 1.25, graduate: 1.15, worker: 1.05, homeowner: 0.8 } },
    { id: "NRW", name: "North Rhine-Westphalia", abbr: "NRW", seats: 127, electorate: 9600, tile: { row: 1, col: 0 },
      profile: { worker: 1.15 } },
    { id: "EAST", name: "The East (SN, ST, TH)", abbr: "East", seats: 74, electorate: 4600, tile: { row: 1, col: 2 },
      profile: { worker: 1.25, pensioner: 1.15, graduate: 0.85 } },
    { id: "WEST", name: "Centre-West (HE, RP, SL)", abbr: "West", seats: 85, electorate: 6100, tile: { row: 1, col: 1 },
      profile: { homeowner: 1.1 } },
    { id: "BW", name: "Baden-Württemberg", abbr: "BW", seats: 76, electorate: 6100, tile: { row: 2, col: 1 },
      profile: { homeowner: 1.15, graduate: 1.05 } },
    { id: "BAV", name: "Bavaria", abbr: "Bayern", seats: 93, electorate: 7500, tile: { row: 2, col: 2 },
      profile: { homeowner: 1.2, pensioner: 1.05 } },
  ],

  elections: {
    "2025": {
      id: "2025",
      year: 2025,
      label: "2025 · Merz v. Scholz",
      tagline: "Winter 2025. The traffic-light coalition has collapsed, the economy is in its second year of recession, and the AfD polls second. Hold the centre — or ride the revolt.",
      salience: { migration: 0.9, economy: 0.88, ukraine_security: 0.65, pensions: 0.55, energy_climate: 0.5, housing: 0.5 },
      regions: {
        NORTH: { v: { cdu: 0.28, spd: 0.21, afd: 0.17, grn: 0.12, lnk: 0.07, oth: 0.15 }, s: { cdu: 33, spd: 25, afd: 20, grn: 12, lnk: 4, oth: 1 } },
        NE:    { v: { afd: 0.25, spd: 0.16, lnk: 0.17, grn: 0.14, cdu: 0.15, oth: 0.13 }, s: { afd: 17, lnk: 19, grn: 18, spd: 17, cdu: 9 } },
        NRW:   { v: { cdu: 0.30, spd: 0.20, afd: 0.17, grn: 0.115, lnk: 0.08, oth: 0.135 }, s: { cdu: 44, spd: 29, afd: 25, grn: 18, lnk: 11 } },
        EAST:  { v: { afd: 0.34, cdu: 0.22, lnk: 0.13, spd: 0.09, grn: 0.04, oth: 0.18 }, s: { afd: 32, cdu: 20, lnk: 12, spd: 7, grn: 3 } },
        WEST:  { v: { cdu: 0.30, afd: 0.19, spd: 0.17, grn: 0.11, lnk: 0.07, oth: 0.16 }, s: { cdu: 31, afd: 20, spd: 18, grn: 10, lnk: 6 } },
        BW:    { v: { cdu: 0.32, afd: 0.18, spd: 0.13, grn: 0.135, lnk: 0.06, oth: 0.175 }, s: { cdu: 30, afd: 17, spd: 12, grn: 11, lnk: 6 } },
        BAV:   { v: { cdu: 0.37, afd: 0.19, spd: 0.12, grn: 0.11, lnk: 0.06, oth: 0.15 }, s: { cdu: 42, afd: 21, spd: 13, grn: 11, lnk: 6 } },
      },
    },
  },

  leaders: {
    "2025": {
      cdu: { partyId: "cdu", name: "Friedrich Merz", charisma: 48, energy: 64, competence: 70, machine: 82 },
      spd: { partyId: "spd", name: "Olaf Scholz", charisma: 38, energy: 56, competence: 68, machine: 74 },
      afd: { partyId: "afd", name: "Alice Weidel", charisma: 62, energy: 70, competence: 56, machine: 60 },
      grn: { partyId: "grn", name: "Robert Habeck", charisma: 64, energy: 68, competence: 64, machine: 58 },
      lnk: { partyId: "lnk", name: "Heidi Reichinnek", charisma: 66, energy: 74, competence: 54, machine: 44 },
    },
  },

  events: [
    { id: "wirtschaft_zahlen", headline: "Grim industrial numbers dominate the news — pressure on {party}", role: "leader", weight: 3, appeal: -0.03, momentum: -7 },
    { id: "migration_debatte", headline: "A border incident reignites the migration debate, and {party} owns the airwaves", role: "any", weight: 3, appeal: 0.03, momentum: 7 },
    { id: "tv_duell", headline: "{party}'s leader wins the TV-Duell on points", role: "any", weight: 3, appeal: 0.03, momentum: 10 },
    { id: "brandmauer_row", headline: "A firewall row over voting with the far right bruises {party}", role: "leader", weight: 2, appeal: -0.035, momentum: -8 },
    { id: "koalition_angst", headline: "Coalition-arithmetic anxiety drives tactical voters toward {party}", role: "challenger", weight: 2, appeal: 0.025, momentum: 6 },
    { id: "skandal", headline: "A funding scandal engulfs a {party} candidate", role: "any", weight: 2, appeal: -0.03, momentum: -7 },
    { id: "jugend_welle", headline: "A social-media wave breaks for {party} among young voters", role: "challenger", weight: 2, appeal: 0.025, momentum: 8 },
    { id: "wahlkampf_panne", headline: "{party}'s leader fumbles a live interview", role: "any", weight: 2, appeal: -0.03, momentum: -6 },
    { id: "endorsement_de", headline: "Business leaders and papers line up behind {party}", role: "any", weight: 2, appeal: 0.02, momentum: 5 },
    { id: "ukraine_moment", headline: "A security shock puts statesmanship first — {party} looks the part", role: "leader", weight: 2, appeal: 0.025, momentum: 6 },
  ],
};
