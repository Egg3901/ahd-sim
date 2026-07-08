// CANADA — federal elections. Real results baked in as calibration anchors.
// 2025 (April 28): 343 seats, 172 for a majority — LPC 169, CPC 145, BQ 22,
// NDP 6, GRN 1 (Carney's tariff-war comeback over Poilievre).
// 2021 (September 20): 338 seats, 170 for a majority — LPC 160, CPC 119, BQ 32,
// NDP 25, GPC 2 (Trudeau's pandemic snap call buys back the same minority).

import type { CountryBundle } from "@engine/countryGame";
import { CA_MAP } from "./paths/ca";

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
  map: CA_MAP,

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
    { id: "reconciliation", name: "Reconciliation", blurb: "Unmarked graves, residential schools, and the Crown's unkept promises to Indigenous peoples." },
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
      events: [
        // Scheduled beats — the real five-week arc, in order.
        { id: "carney_sworn_in", headline: "Trudeau resigns, the carbon tax is axed — {party}'s attack lines lose their target as Carney takes the oath", role: "any", party: "cpc", weight: 1, appeal: -0.03, momentum: -8, turn: 0 },
        { id: "gst_cut_duel", headline: "The GST-cut duel: {party}'s tax-off-new-homes pledge forces the pace on affordability", role: "any", party: "cpc", weight: 1, appeal: 0.03, momentum: 7, turn: 1 },
        { id: "debate_faceoff_fr", headline: "The French debate: {party}'s leader labours through his second language while Blanchet and Poilievre land hits", role: "any", party: "lpc", weight: 1, appeal: -0.025, momentum: -6, turn: 3 },
        { id: "advance_poll_record", headline: "7.3 million vote early — a record advance poll banks votes for {party}", role: "leader", weight: 1, appeal: 0.02, momentum: 6, turn: 4 },
        { id: "ndp_consolidation", headline: "Strategic voting bites: {party} support bleeds to the front of the anti-tariff line", role: "any", party: "ndp", weight: 1, appeal: -0.035, momentum: -12, turn: 5 },
        // Unscheduled flavor — joins the weekly draw, fires at most once.
        { id: "annexation_rally", headline: "'51st state' — another Trump taunt sends flag-waving voters to {party}", role: "any", party: "lpc", weight: 3, appeal: 0.03, momentum: 8 },
        { id: "elbows_up", headline: "'Elbows up' goes national — the hockey-bench battle cry rallies {party} crowds", role: "any", party: "lpc", weight: 2, appeal: 0.02, momentum: 7 },
        { id: "debate_night_en", headline: "{party} judged the winner of the English debate showdown", role: "any", weight: 2, appeal: 0.03, momentum: 8 },
        { id: "carleton_watch", headline: "Riding watch: {party}'s own leader is in a dogfight for his Carleton seat", role: "any", party: "cpc", weight: 2, appeal: -0.025, momentum: -6 },
      ],
    },
    "2021": {
      id: "2021",
      year: 2021,
      label: "2021 · Trudeau v. O'Toole",
      tagline: "August 2021. A snap call two years early, a fourth wave rising, and a minority government gambling for a majority. Five weeks to justify the ask.",
      // Pre-redistribution chamber: 338 seats, not 2025's 343.
      majority: { total: 338, threshold: 170 },
      goalText: "170 of 338 seats",
      // Pandemic management rides healthcare; childcare rides cost_of_living.
      salience: { healthcare: 0.9, cost_of_living: 0.78, housing: 0.7, energy_climate: 0.6, reconciliation: 0.5, immigration: 0.3 },
      regions: {
        BC:    { v: { cpc: 0.33, ndp: 0.29, lpc: 0.27, gpc: 0.05, oth: 0.06 }, s: { lpc: 15, cpc: 13, ndp: 13, gpc: 1 } },
        AB:    { v: { cpc: 0.55, ndp: 0.19, lpc: 0.16, gpc: 0.01, oth: 0.09 }, s: { cpc: 30, lpc: 2, ndp: 2 } },
        SK:    { v: { cpc: 0.59, ndp: 0.20, lpc: 0.10, oth: 0.11 }, s: { cpc: 14 } },
        MB:    { v: { cpc: 0.40, lpc: 0.25, ndp: 0.22, gpc: 0.02, oth: 0.11 }, s: { cpc: 7, lpc: 4, ndp: 3 } },
        ON:    { v: { lpc: 0.39, cpc: 0.35, ndp: 0.18, gpc: 0.02, oth: 0.06 }, s: { lpc: 78, cpc: 37, ndp: 5, gpc: 1 } },
        QC:    { v: { lpc: 0.34, bq: 0.32, cpc: 0.19, ndp: 0.10, gpc: 0.01, oth: 0.04 }, s: { lpc: 35, bq: 32, cpc: 10, ndp: 1 } },
        NB:    { v: { lpc: 0.41, cpc: 0.34, ndp: 0.12, gpc: 0.06, oth: 0.07 }, s: { lpc: 6, cpc: 4 } },
        NS:    { v: { lpc: 0.42, cpc: 0.30, ndp: 0.22, gpc: 0.02, oth: 0.04 }, s: { lpc: 8, cpc: 3 } },
        PE:    { v: { lpc: 0.46, cpc: 0.32, ndp: 0.15, gpc: 0.04, oth: 0.03 }, s: { lpc: 4 } },
        NL:    { v: { lpc: 0.48, cpc: 0.33, ndp: 0.17, oth: 0.02 }, s: { lpc: 6, cpc: 1 } },
        NORTH: { v: { lpc: 0.36, ndp: 0.31, cpc: 0.25, gpc: 0.02, oth: 0.06 }, s: { lpc: 2, ndp: 1 } },
      },
      events: [
        // Scheduled beats — the real five-week arc, in order.
        { id: "snap_call_backlash", headline: "'Why an election, why now?' — the pandemic snap call blows back on {party}", role: "any", party: "lpc", weight: 1, appeal: -0.03, momentum: -9, turn: 0 },
        { id: "kabul_airlift", headline: "Kabul falls in week one — the airlift scramble follows {party} down the campaign trail", role: "any", party: "lpc", weight: 1, appeal: -0.025, momentum: -6, turn: 1 },
        { id: "gravel_thrown", headline: "Anti-vax protesters throw gravel at the {party} leader — the ugliness earns a sympathy backlash", role: "any", party: "lpc", weight: 1, appeal: 0.025, momentum: 6, turn: 2 },
        { id: "gun_ban_reversal", headline: "{party} reverses on the assault-weapons ban mid-campaign — and wears the flip-flop", role: "any", party: "cpc", weight: 1, appeal: -0.03, momentum: -8, turn: 3 },
        { id: "tva_quebec_bashing", headline: "'Quebec bashing' — the face-à-face question ignites {party}'s campaign", role: "any", party: "bq", weight: 1, appeal: 0.03, momentum: 9, turn: 4 },
        // Unscheduled flavor — joins the weekly draw, fires at most once.
        { id: "mandate_wedge", headline: "The vaccine-mandate wedge splits the Conservative coalition — {party} presses it at every stop", role: "any", party: "lpc", weight: 2, appeal: 0.03, momentum: 7 },
        { id: "otoole_union_pitch", headline: "The new Tory pitch: {party}'s leader plays the union-hall moderate and the debate-night polish pays", role: "any", party: "cpc", weight: 2, appeal: 0.035, momentum: 9 },
        { id: "ppc_surge", headline: "The People's Party surge eats {party}'s right flank", role: "any", party: "cpc", weight: 3, appeal: -0.025, momentum: -6 },
        { id: "singh_tiktok", headline: "{party}'s TikTok campaign owns the youth vote — Singh's likability tops every tracker", role: "any", party: "ndp", weight: 2, appeal: 0.025, momentum: 8 },
      ],
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
    "2021": {
      lpc: { partyId: "lpc", name: "Justin Trudeau", charisma: 76, energy: 70, competence: 60, machine: 78 },
      cpc: { partyId: "cpc", name: "Erin O'Toole", charisma: 50, energy: 66, competence: 68, machine: 72 },
      ndp: { partyId: "ndp", name: "Jagmeet Singh", charisma: 72, energy: 74, competence: 54, machine: 50 },
      bq:  { partyId: "bq", name: "Yves-François Blanchet", charisma: 62, energy: 60, competence: 66, machine: 48 },
      gpc: { partyId: "gpc", name: "Annamie Paul", charisma: 58, energy: 52, competence: 62, machine: 20 },
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
