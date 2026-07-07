// CANADA 2025 — the 45th federal election (April 28, 2025). 343 seats, 172 for
// a majority. Real result baked in as the calibration anchor: LPC 169, CPC 145,
// BQ 22, NDP 6, GRN 1 (Carney's tariff-war comeback over Poilievre).

import type { CountryBundle } from "@engine/countryGame";

export const CANADA: CountryBundle = {
  id: "CA",
  label: "Canada",
  flag: "🇨🇦",
  currency: "$",
  unitName: "seat",
  unitNamePlural: "seats",
  goalText: "172 of 343 seats",
  defaultSeatElasticity: 2.4,
  eventChance: 0.7,

  system: {
    id: "CA",
    label: "Canada",
    parties: [
      { id: "lpc", name: "Liberal Party", shortName: "LPC", color: "#d71920" },
      { id: "cpc", name: "Conservative Party", shortName: "CPC", color: "#1a4782" },
      { id: "ndp", name: "New Democratic Party", shortName: "NDP", color: "#f37021" },
      { id: "bq", name: "Bloc Québécois", shortName: "BQ", color: "#33b2cc" },
      { id: "gpc", name: "Green Party", shortName: "GPC", color: "#3d9b35" },
      { id: "oth", name: "Others / Independents", shortName: "Other", color: "#9aa0a6" },
    ],
    allocation: { id: "regional_seats_curve", label: "First-past-the-post (regional seats curve)", unit: "seat" },
    majority: { total: 343, threshold: 172 },
  },
  playable: ["lpc", "cpc", "ndp", "bq"],
  abstaining: [],
  // The two governing rivals never partner each other; the Bloc props up no one
  // formally (it extracts concessions vote-by-vote).
  compatible: (lead, partner) => {
    const rivals = new Set(["lpc", "cpc"]);
    if (rivals.has(lead) && rivals.has(partner)) return false;
    if (partner === "bq" || lead === "bq") return false;
    return true;
  },

  issues: [
    { id: "us_relations", name: "U.S. relations & tariffs", blurb: "Tariff war, '51st state' taunts, and who can stand up to Washington." },
    { id: "cost_of_living", name: "Cost of living", blurb: "Groceries, inflation, and the affordability squeeze." },
    { id: "housing", name: "Housing", blurb: "A generation priced out of the market." },
    { id: "healthcare", name: "Health care", blurb: "Wait times and a strained public system." },
    { id: "energy_climate", name: "Energy & climate", blurb: "Pipelines, carbon pricing, and the resource economy." },
    { id: "immigration", name: "Immigration", blurb: "Record intake meets an infrastructure crunch." },
  ],

  blocs: [
    { id: "young", name: "Young voters (18–34)", share: 0.24, turnoutPropensity: 0.55,
      tilt: { cpc: 0.25, ndp: 0.2, lpc: -0.3, gpc: 0.1 } },
    { id: "graduate", name: "University graduates", share: 0.30, turnoutPropensity: 0.75,
      tilt: { lpc: 0.25, ndp: 0.05, cpc: -0.15, gpc: 0.1 } },
    { id: "worker", name: "Blue-collar workers", share: 0.30, turnoutPropensity: 0.62,
      tilt: { cpc: 0.35, ndp: 0.05, lpc: -0.2, gpc: -0.2 } },
    { id: "homeowner", name: "Suburban homeowners", share: 0.32, turnoutPropensity: 0.74,
      tilt: { cpc: 0.2, lpc: 0.0, ndp: -0.15 } },
    { id: "senior", name: "Seniors (65+)", share: 0.22, turnoutPropensity: 0.82,
      tilt: { lpc: 0.4, cpc: -0.05, ndp: -0.2, gpc: -0.2 } },
    { id: "francophone", name: "Francophone voters", share: 0.20, turnoutPropensity: 0.68,
      tilt: { bq: 0.9, lpc: 0.1, cpc: -0.3, ndp: -0.1 } },
  ],

  regions: [
    { id: "BC", name: "British Columbia", abbr: "BC", seats: 43, electorate: 2500, tile: { row: 1, col: 0 },
      profile: { young: 1.1, graduate: 1.1, francophone: 0.1 } },
    { id: "AB", name: "Alberta", abbr: "AB", seats: 37, electorate: 2100, tile: { row: 1, col: 1 },
      profile: { worker: 1.25, young: 1.1, senior: 0.85, francophone: 0.1 } },
    { id: "SK", name: "Saskatchewan", abbr: "SK", seats: 14, electorate: 560, tile: { row: 1, col: 2 },
      profile: { worker: 1.3, homeowner: 1.15, francophone: 0.1 } },
    { id: "MB", name: "Manitoba", abbr: "MB", seats: 14, electorate: 600, tile: { row: 1, col: 3 },
      profile: { worker: 1.2, francophone: 0.2 } },
    { id: "ON", name: "Ontario", abbr: "ON", seats: 122, electorate: 7300, tile: { row: 1, col: 4 },
      profile: { homeowner: 1.1, graduate: 1.05, francophone: 0.2 } },
    { id: "QC", name: "Quebec", abbr: "QC", seats: 78, electorate: 4300, tile: { row: 1, col: 5 },
      profile: { francophone: 3.4, homeowner: 0.9 } },
    { id: "NB", name: "New Brunswick", abbr: "NB", seats: 10, electorate: 430, tile: { row: 2, col: 4 },
      profile: { senior: 1.2, francophone: 1.2 } },
    { id: "NS", name: "Nova Scotia", abbr: "NS", seats: 11, electorate: 530, tile: { row: 2, col: 5 },
      profile: { senior: 1.25, francophone: 0.3 } },
    { id: "PE", name: "Prince Edward Island", abbr: "PE", seats: 4, electorate: 90, tile: { row: 2, col: 6 },
      profile: { senior: 1.3, francophone: 0.2 } },
    { id: "NL", name: "Newfoundland & Labrador", abbr: "NL", seats: 7, electorate: 260, tile: { row: 1, col: 6 },
      profile: { worker: 1.2, senior: 1.2, francophone: 0.1 } },
    { id: "NORTH", name: "The Territories", abbr: "North", seats: 3, electorate: 50, tile: { row: 0, col: 3 },
      profile: { young: 1.2, francophone: 0.2 } },
  ],

  elections: {
    "2025": {
      id: "2025",
      year: 2025,
      label: "2025 · Carney v. Poilievre",
      tagline: "March 2025. A trade war with Washington, a new Liberal leader, and a 25-point Conservative lead evaporating by the week. Five weeks to decide who faces the tariffs.",
      salience: { us_relations: 0.92, cost_of_living: 0.85, housing: 0.65, healthcare: 0.55, energy_climate: 0.45, immigration: 0.45 },
      regions: {
        BC:    { v: { lpc: 0.42, cpc: 0.41, ndp: 0.13, gpc: 0.03, oth: 0.01 }, s: { lpc: 20, cpc: 19, ndp: 3, gpc: 1 } },
        AB:    { v: { cpc: 0.63, lpc: 0.28, ndp: 0.06, gpc: 0.01, oth: 0.02 }, s: { cpc: 34, lpc: 2, ndp: 1 } },
        SK:    { v: { cpc: 0.65, lpc: 0.26, ndp: 0.07, oth: 0.02 }, s: { cpc: 13, lpc: 1 } },
        MB:    { v: { cpc: 0.46, lpc: 0.44, ndp: 0.08, oth: 0.02 }, s: { cpc: 7, lpc: 6, ndp: 1 } },
        ON:    { v: { lpc: 0.49, cpc: 0.44, ndp: 0.05, gpc: 0.01, oth: 0.01 }, s: { lpc: 68, cpc: 54 } },
        QC:    { v: { lpc: 0.43, bq: 0.28, cpc: 0.23, ndp: 0.04, oth: 0.02 }, s: { lpc: 44, bq: 22, cpc: 11, ndp: 1 } },
        NB:    { v: { lpc: 0.54, cpc: 0.40, ndp: 0.04, oth: 0.02 }, s: { lpc: 6, cpc: 4 } },
        NS:    { v: { lpc: 0.57, cpc: 0.36, ndp: 0.05, oth: 0.02 }, s: { lpc: 10, cpc: 1 } },
        PE:    { v: { lpc: 0.57, cpc: 0.36, ndp: 0.04, oth: 0.03 }, s: { lpc: 4 } },
        NL:    { v: { lpc: 0.57, cpc: 0.37, ndp: 0.04, oth: 0.02 }, s: { lpc: 5, cpc: 2 } },
        NORTH: { v: { lpc: 0.50, cpc: 0.28, ndp: 0.18, oth: 0.04 }, s: { lpc: 3 } },
      },
    },
  },

  leaders: {
    "2025": {
      lpc: { partyId: "lpc", name: "Mark Carney", charisma: 52, energy: 62, competence: 84, machine: 76 },
      cpc: { partyId: "cpc", name: "Pierre Poilievre", charisma: 68, energy: 76, competence: 64, machine: 80 },
      ndp: { partyId: "ndp", name: "Jagmeet Singh", charisma: 66, energy: 68, competence: 56, machine: 52 },
      bq:  { partyId: "bq", name: "Yves-François Blanchet", charisma: 62, energy: 60, competence: 66, machine: 48 },
      gpc: { partyId: "gpc", name: "Elizabeth May & Jonathan Pedneault", charisma: 54, energy: 56, competence: 58, machine: 30 },
    },
  },

  events: [
    { id: "tariff_shock", headline: "A new round of U.S. tariffs rallies voters behind {party}", role: "leader", weight: 3, appeal: 0.03, momentum: 8 },
    { id: "annexation_taunt", headline: "Another '51st state' taunt from Washington boosts {party}'s flag-waving campaign", role: "leader", weight: 2, appeal: 0.03, momentum: 6 },
    { id: "debate_fr", headline: "{party}'s leader survives the French-language debate — better than expected", role: "any", weight: 2, appeal: 0.02, momentum: 6 },
    { id: "debate_en", headline: "{party} judged the winner of the English-language debate", role: "any", weight: 3, appeal: 0.03, momentum: 10 },
    { id: "gaffe", headline: "A campaign-trail gaffe puts {party} on the defensive", role: "any", weight: 3, appeal: -0.035, momentum: -9 },
    { id: "grocery_prices", headline: "Grocery-price headlines sting the {party} campaign", role: "leader", weight: 2, appeal: -0.025, momentum: -5 },
    { id: "endorsement", headline: "A string of local mayors endorse {party}", role: "any", weight: 2, appeal: 0.02, momentum: 5 },
    { id: "candidate_bozo", headline: "{party} drops a candidate over old social-media posts", role: "any", weight: 2, appeal: -0.025, momentum: -5 },
    { id: "vote_split", headline: "Strategic-voting chatter surges — progressives consolidate against the front-runner, lifting {party}", role: "challenger", weight: 2, appeal: 0.025, momentum: 8 },
    { id: "rally_surge", headline: "An overflow {party} rally electrifies the base", role: "player", weight: 2, appeal: 0.025, momentum: 10 },
  ],
};
