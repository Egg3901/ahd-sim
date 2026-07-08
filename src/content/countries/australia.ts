// AUSTRALIA 2025 — the 48th federal election (May 3, 2025). 150 seats, 76 for
// a majority, full preferential voting. Real result baked in as the calibration
// anchor: ALP 94, Coalition 43, GRN 1 (Ryan, QLD — Melbourne fell), crossbench
// 12 (10 independents + KAP + Centre Alliance, modelled as the non-playable
// `ind` party). One Nation polled ~6% and won nothing: it rides as a vote-only
// party with zero seats. Albanese's Medicare-card landslide over Dutton, who
// lost Dickson itself.

import type { CountryBundle } from "@engine/countryGame";
import { AU_MAP } from "./paths/au";
import type { Government } from "@engine/types";

export const AUSTRALIA: CountryBundle = {
  id: "AU",
  label: "Australia",
  flag: "🇦🇺",
  currency: "$",
  unitName: "seat",
  unitNamePlural: "seats",
  goalText: "76 of 150 seats",
  // Preferential single-member voting still amplifies swings, a touch less
  // brutally than raw FPTP (preferences cushion the primary-vote collapse).
  defaultSeatElasticity: 2.2,
  eventChance: 0.7,
  map: AU_MAP,

  system: {
    id: "AU",
    label: "Australia",
    parties: [
      { id: "alp", name: "Australian Labor Party", shortName: "Labor", color: "#e53440" },
      { id: "lnp", name: "Liberal–National Coalition", shortName: "Coalition", color: "#1c4f9c" },
      { id: "grn", name: "Australian Greens", shortName: "Greens", color: "#009c3d" },
      { id: "onp", name: "One Nation", shortName: "One Nation", color: "#f36c21" },
      { id: "ind", name: "Independents & minor crossbench", shortName: "Crossbench", color: "#26a69a" },
      { id: "oth", name: "Others", shortName: "Other", color: "#9aa0a6" },
    ],
    allocation: { id: "regional_seats_curve", label: "Full-preferential voting (regional seats curve)", unit: "seat" },
    majority: { total: 150, threshold: 76 },
  },
  playable: ["alp", "lnp", "grn"],
  abstaining: [],
  // Labor and the Coalition never partner each other; the Greens can back Labor
  // only; the crossbench and One Nation strike no formal arrangement (teal
  // independents negotiate seat-by-seat, not as a bloc).
  compatible: (lead, partner) => {
    const rivals = new Set(["alp", "lnp"]);
    if (rivals.has(lead) && rivals.has(partner)) return false;
    if (lead === "grn" || partner === "grn") return lead === "alp" || partner === "alp";
    if (lead === "ind" || partner === "ind") return false;
    if (lead === "onp" || partner === "onp") return false;
    return true;
  },
  governmentText: (g: Government, partyName) => {
    if (g.kind === "majority") return `${partyName(g.party)} forms majority government with ${g.seats} of 150 seats.`;
    if (g.kind === "coalition") return `${g.parties.map(partyName).join(" and ")} strike a governing agreement (${g.seats} seats).`;
    if (g.kind === "confidence_supply") return `${partyName(g.lead)} governs with confidence and supply from ${partyName(g.partner)}.`;
    if (g.kind === "minority") return `${partyName(g.party)} forms minority government — the crossbench holds the balance of power.`;
    if (g.kind === "hung") return `Hung parliament: the crossbench decides who governs.`;
    return undefined;
  },

  issues: [
    { id: "cost_of_living", name: "Cost of living", blurb: "Groceries, rents, mortgage rates — the squeeze that framed the whole campaign." },
    { id: "housing", name: "Housing", blurb: "A generation locked out; both sides bid with deposits and super." },
    { id: "medicare", name: "Medicare & health", blurb: "Bulk billing, urgent-care clinics, and the little green card at every Labor event." },
    { id: "energy_climate", name: "Energy & climate", blurb: "Renewables versus the Coalition's seven nuclear plants." },
    { id: "trump_security", name: "Trump, tariffs & security", blurb: "Liberation Day tariffs land mid-campaign; who can steady the ship?" },
    { id: "immigration", name: "Immigration", blurb: "Record intake, migration caps, and the housing crunch blame game." },
  ],

  // Compulsory voting: turnout propensity is uniformly high; the action is all
  // in the tilts. 2025 dynamics — the young swung hard to Labor and the Greens,
  // graduates and teal seats stayed anti-Coalition, and the outer-suburban
  // mortgage belt broke to Labor and decided it.
  blocs: [
    { id: "young_renter", name: "Young renters (18–34)", share: 0.22, turnoutPropensity: 0.88,
      tilt: { alp: 0.3, grn: 0.55, lnp: -0.6, onp: -0.2, ind: 0.1 } },
    { id: "graduate", name: "University graduates", share: 0.28, turnoutPropensity: 0.93,
      tilt: { alp: 0.2, grn: 0.3, lnp: -0.25, onp: -0.5, ind: 0.35 } },
    { id: "mortgage_belt", name: "Outer-suburban mortgage belt", share: 0.30, turnoutPropensity: 0.91,
      tilt: { alp: 0.15, lnp: 0.1, grn: -0.3, onp: 0.15, ind: -0.3 } },
    { id: "regional", name: "Regional & rural Australia", share: 0.24, turnoutPropensity: 0.90,
      tilt: { lnp: 0.5, onp: 0.45, alp: -0.3, grn: -0.35, ind: 0.1 } },
    { id: "senior", name: "Seniors (65+)", share: 0.24, turnoutPropensity: 0.95,
      tilt: { lnp: 0.35, alp: 0.05, grn: -0.5, onp: 0.1, ind: -0.1 } },
    { id: "multicultural", name: "Multicultural urban communities", share: 0.20, turnoutPropensity: 0.89,
      tilt: { alp: 0.45, lnp: -0.3, onp: -0.7, ind: -0.2 } },
  ],

  // Electorates in thousands ∝ enrolment. Tiles sketch the continent: WA the
  // big west, NT/QLD across the top, SA centre, NSW/ACT east, VIC/TAS below.
  regions: [
    { id: "NSW", name: "New South Wales", abbr: "NSW", seats: 46, electorate: 5540, tile: { row: 1, col: 2 },
      profile: { multicultural: 1.2, mortgage_belt: 1.1, graduate: 1.05 } },
    { id: "VIC", name: "Victoria", abbr: "VIC", seats: 38, electorate: 4530, tile: { row: 2, col: 2 },
      profile: { graduate: 1.1, young_renter: 1.1, multicultural: 1.1 } },
    { id: "QLD", name: "Queensland", abbr: "QLD", seats: 30, electorate: 3700, tile: { row: 0, col: 2 },
      profile: { regional: 1.25, mortgage_belt: 1.05, senior: 1.05 } },
    { id: "WA", name: "Western Australia", abbr: "WA", seats: 16, electorate: 1890, tile: { row: 1, col: 0 },
      profile: { mortgage_belt: 1.15, young_renter: 1.05 } },
    { id: "SA", name: "South Australia", abbr: "SA", seats: 10, electorate: 1290, tile: { row: 1, col: 1 },
      profile: { senior: 1.1, mortgage_belt: 1.05 } },
    { id: "TAS", name: "Tasmania", abbr: "TAS", seats: 5, electorate: 410, tile: { row: 3, col: 2 },
      profile: { regional: 1.3, senior: 1.2, multicultural: 0.5 } },
    { id: "ACT", name: "Australian Capital Territory", abbr: "ACT", seats: 3, electorate: 320, tile: { row: 1, col: 3 },
      profile: { graduate: 1.5, young_renter: 1.2, regional: 0.3 } },
    { id: "NT", name: "Northern Territory", abbr: "NT", seats: 2, electorate: 148, tile: { row: 0, col: 1 },
      profile: { young_renter: 1.2, regional: 1.2, multicultural: 1.1 } },
  ],

  elections: {
    "2025": {
      id: "2025",
      year: 2025,
      label: "2025 · Albanese v. Dutton",
      tagline: "May 2025. Cost of living bites, Washington upends the world order mid-campaign, and Peter Dutton's year-long polling lead is gone by Easter. Five weeks to hold the middle.",
      salience: { cost_of_living: 0.92, housing: 0.78, medicare: 0.72, trump_security: 0.65, energy_climate: 0.60, immigration: 0.45 },
      majority: { total: 150, threshold: 76 },
      goalText: "76 of 150 seats",
      regions: {
        // Primary-vote-flavoured shares (preferences folded into the seat
        // curve); seats are the real state outcomes. Labor swept the QLD
        // gains and Dickson; the Greens kept only Ryan; the teals held.
        NSW: { v: { alp: 0.36, lnp: 0.33, grn: 0.10, onp: 0.06, ind: 0.09, oth: 0.06 }, s: { alp: 28, lnp: 12, ind: 6 } },
        VIC: { v: { alp: 0.35, lnp: 0.31, grn: 0.13, onp: 0.05, ind: 0.08, oth: 0.08 }, s: { alp: 26, lnp: 10, ind: 2 } },
        QLD: { v: { alp: 0.31, lnp: 0.36, grn: 0.12, onp: 0.09, ind: 0.05, oth: 0.07 }, s: { alp: 13, lnp: 15, grn: 1, ind: 1 } },
        WA:  { v: { alp: 0.38, lnp: 0.32, grn: 0.12, onp: 0.06, ind: 0.06, oth: 0.06 }, s: { alp: 11, lnp: 4, ind: 1 } },
        SA:  { v: { alp: 0.37, lnp: 0.32, grn: 0.11, onp: 0.06, ind: 0.08, oth: 0.06 }, s: { alp: 7, lnp: 2, ind: 1 } },
        TAS: { v: { alp: 0.36, lnp: 0.27, grn: 0.10, onp: 0.05, ind: 0.15, oth: 0.07 }, s: { alp: 4, ind: 1 } },
        ACT: { v: { alp: 0.43, lnp: 0.24, grn: 0.16, onp: 0.02, ind: 0.09, oth: 0.06 }, s: { alp: 3 } },
        NT:  { v: { alp: 0.41, lnp: 0.31, grn: 0.10, onp: 0.05, ind: 0.05, oth: 0.08 }, s: { alp: 2 } },
      },
      // The real story beats of the five-week campaign, in order. Scheduled
      // entries fire deterministically that week; the rest join the weekly draw.
      events: [
        { id: "au25_cyclone_alfred", turn: 0, party: "lnp", role: "any", weight: 1,
          headline: "Cyclone Alfred washes out the campaign launch — the budget slips, and so does {party}'s opening week", momentum: -6 },
        { id: "au25_wfh_backflip", turn: 1, party: "lnp", role: "any", weight: 1,
          headline: "{party} dumps its end-work-from-home policy mid-campaign — 'we got it wrong'", appeal: -0.03, momentum: -8 },
        { id: "au25_liberation_day", turn: 2, party: "lnp", role: "any", weight: 1,
          headline: "Trump's 'Liberation Day' tariffs land mid-campaign — voters recoil from anything that rhymes with MAGA, and {party} wears it", appeal: -0.035, momentum: -9 },
        { id: "au25_stage_fall", turn: 3, party: "alp", role: "any", weight: 1,
          headline: "The {party} leader tumbles off the stage at a rally — 'I stepped back one step, I didn't fall'", appeal: -0.02, momentum: -5 },
        { id: "au25_debate_worm", turn: 4, party: "alp", role: "any", weight: 1,
          headline: "The worm turns: {party}'s leader takes the final debate on every network verdict", appeal: 0.03, momentum: 8 },
        { id: "au25_doge_scare", party: "lnp", role: "any", weight: 3,
          headline: "The 41,000 public-service-cuts scare sticks — 'DOGE-style slashing' dogs {party} at every stop", appeal: -0.025, momentum: -6 },
        { id: "au25_medicare_card", party: "alp", role: "any", weight: 3,
          headline: "The Medicare card comes out of {party}'s pocket at every single event — and it's working", appeal: 0.025, momentum: 6 },
        { id: "au25_dickson_watch", party: "lnp", role: "any", weight: 2,
          headline: "Dickson watch: polling puts {party}'s own leader's seat in play", appeal: -0.02, momentum: -7 },
        { id: "au25_gas_reservation", party: "lnp", role: "any", weight: 2,
          headline: "{party}'s east-coast gas reservation plan unravels under questioning — nobody can say what power bills do", appeal: -0.02, momentum: -5 },
        { id: "au25_early_voting", role: "leader", weight: 2,
          headline: "Record pre-poll turnout — half the country votes early, and {party} banks its lead", appeal: 0.02, momentum: 6 },
      ],
    },
  },

  leaders: {
    "2025": {
      alp: { partyId: "alp", name: "Anthony Albanese", charisma: 56, energy: 64, competence: 70, machine: 84 },
      lnp: { partyId: "lnp", name: "Peter Dutton", charisma: 42, energy: 74, competence: 62, machine: 72 },
      grn: { partyId: "grn", name: "Adam Bandt", charisma: 60, energy: 70, competence: 58, machine: 46 },
    },
  },

  // The standing Australian repertoire, any cycle.
  events: [
    { id: "newspoll_shock", headline: "Newspoll lands with a shock swing to {party}", role: "any", weight: 3, appeal: 0.03, momentum: 9 },
    { id: "newspoll_slide", headline: "Newspoll shows {party} bleeding primary vote", role: "any", weight: 3, appeal: -0.03, momentum: -8 },
    { id: "talkback_pileon", headline: "Talkback radio piles on {party} for a week straight", role: "any", weight: 2, appeal: -0.025, momentum: -6 },
    { id: "candidate_disendorsed", headline: "{party} disendorses a candidate over old social-media posts", role: "any", weight: 2, appeal: -0.025, momentum: -5 },
    { id: "preference_row", headline: "A preference-deal row engulfs {party} — how-to-vote cards become the story", role: "any", weight: 2, appeal: -0.02, momentum: -5 },
    { id: "palmer_blitz", headline: "Clive Palmer's yellow ad blitz clogs every feed — {party} can't buy a headline", role: "any", weight: 2, appeal: -0.02, momentum: -4 },
    { id: "sausage_sizzle", headline: "Democracy-sausage energy: booth volunteers turn out in droves for {party}", role: "player", weight: 2, appeal: 0.02, momentum: 6 },
    { id: "costings_hole", headline: "A costings black hole dominates {party}'s week", role: "any", weight: 2, appeal: -0.03, momentum: -7 },
    { id: "premier_endorsement", headline: "State premiers and local mayors rally behind {party}", role: "any", weight: 2, appeal: 0.02, momentum: 5 },
    { id: "debate_win", headline: "{party} judged the winner of the leaders' debate", role: "any", weight: 3, appeal: 0.03, momentum: 10 },
  ],
};
