// FRANCE 2027 — the presidential runoff, approximated as a two-party fight over
// a 100-point electoral pool (each région's points ∝ its electorate; elasticity
// 1.0 so points track the popular vote). 51 points wins the Élysée. The
// baseline is a polling-informed Philippe–Bardella runoff: centre 53, RN 47 —
// closer than any runoff the RN has ever fought.

import type { CountryBundle } from "@engine/countryGame";
import type { Government } from "@engine/types";

export const FRANCE: CountryBundle = {
  id: "FR",
  label: "France",
  flag: "🇫🇷",
  currency: "€",
  unitName: "point",
  unitNamePlural: "points",
  goalText: "51 of 100 electoral points",
  defaultSeatElasticity: 1.0,
  eventChance: 0.75,

  system: {
    id: "FR",
    label: "France",
    parties: [
      { id: "ens", name: "The Centre (Ensemble & allies)", shortName: "Centre", color: "#f2b41c" },
      { id: "rn", name: "Rassemblement National", shortName: "RN", color: "#0f3b8c" },
    ],
    allocation: { id: "regional_seats_curve", label: "Two-round runoff (regional points)", unit: "point" },
    majority: { total: 100, threshold: 51 },
  },
  playable: ["ens", "rn"],
  abstaining: [],
  // A runoff has no coalitions: one candidate wins the presidency outright.
  compatible: () => false,
  governmentText: (g: Government, partyName) => {
    if (g.kind === "majority") return `${partyName(g.party)} wins the presidency with ${g.seats} points.`;
    if (g.kind === "minority") return `${partyName(g.party)} scrapes the narrowest of wins — ${g.seats} points.`;
    if (g.kind === "hung") return `Dead heat. France recounts through the night; the Republic holds its breath.`;
    return undefined;
  },

  issues: [
    { id: "cost_of_living", name: "Pouvoir d'achat", blurb: "Purchasing power — the issue that decides French elections." },
    { id: "immigration_identity", name: "Immigration & identity", blurb: "The RN's home turf: borders, laïcité, national identity." },
    { id: "security", name: "Security", blurb: "Crime, policing, and the sense of order." },
    { id: "pensions", name: "Pensions", blurb: "The retirement-age wound that never closed." },
    { id: "europe", name: "Europe & the franc débat", blurb: "France's place in the EU — and who pays for it." },
    { id: "public_services", name: "Public services", blurb: "Hospitals, schools, and the deserted countryside." },
  ],

  blocs: [
    { id: "urban_graduate", name: "Urban graduates", share: 0.26, turnoutPropensity: 0.78,
      tilt: { ens: 0.45, rn: -0.45 } },
    { id: "periurban_worker", name: "Periurban workers", share: 0.28, turnoutPropensity: 0.66,
      tilt: { rn: 0.5, ens: -0.5 } },
    { id: "rural", name: "Rural France", share: 0.20, turnoutPropensity: 0.7,
      tilt: { rn: 0.3, ens: -0.3 } },
    { id: "young", name: "Young voters (18–29)", share: 0.16, turnoutPropensity: 0.52,
      tilt: { rn: 0.15, ens: -0.15 } },
    { id: "senior", name: "Seniors (65+)", share: 0.24, turnoutPropensity: 0.85,
      tilt: { ens: 0.45, rn: -0.45 } },
  ],

  regions: [
    { id: "HDF", name: "Hauts-de-France", abbr: "HdF", seats: 9, electorate: 2900, tile: { row: 0, col: 2 },
      profile: { periurban_worker: 1.3, urban_graduate: 0.8 } },
    { id: "NOR", name: "Normandie", abbr: "Nor", seats: 5, electorate: 1700, tile: { row: 0, col: 1 },
      profile: { rural: 1.15, periurban_worker: 1.1 } },
    { id: "GE", name: "Grand Est", abbr: "GE", seats: 8, electorate: 2700, tile: { row: 0, col: 3 },
      profile: { periurban_worker: 1.2 } },
    { id: "BRE", name: "Bretagne", abbr: "Bre", seats: 5, electorate: 1800, tile: { row: 1, col: 0 },
      profile: { urban_graduate: 1.1, senior: 1.1 } },
    { id: "PDL", name: "Pays de la Loire", abbr: "PdL", seats: 6, electorate: 2000, tile: { row: 1, col: 1 },
      profile: { senior: 1.1, rural: 1.1 } },
    { id: "IDF", name: "Île-de-France", abbr: "IdF", seats: 18, electorate: 5600, tile: { row: 1, col: 2 },
      profile: { urban_graduate: 1.5, young: 1.2, rural: 0.3, senior: 0.8 } },
    { id: "BFC", name: "Bourgogne-Franche-Comté", abbr: "BFC", seats: 4, electorate: 1400, tile: { row: 1, col: 3 },
      profile: { rural: 1.3, periurban_worker: 1.1 } },
    { id: "CVL", name: "Centre-Val de Loire", abbr: "CVL", seats: 4, electorate: 1300, tile: { row: 2, col: 2 },
      profile: { rural: 1.25 } },
    { id: "NAQ", name: "Nouvelle-Aquitaine", abbr: "NAq", seats: 9, electorate: 3100, tile: { row: 2, col: 1 },
      profile: { senior: 1.15, rural: 1.15 } },
    { id: "ARA", name: "Auvergne-Rhône-Alpes", abbr: "ARA", seats: 12, electorate: 4000, tile: { row: 2, col: 3 },
      profile: { urban_graduate: 1.05 } },
    { id: "OCC", name: "Occitanie", abbr: "Occ", seats: 9, electorate: 3000, tile: { row: 3, col: 2 },
      profile: { rural: 1.1, young: 1.05 } },
    { id: "PACA", name: "Provence-Alpes-Côte d'Azur", abbr: "PACA", seats: 8, electorate: 2600, tile: { row: 3, col: 3 },
      profile: { senior: 1.2, periurban_worker: 1.1 } },
    { id: "COM", name: "Corse & Outre-mer", abbr: "DOM", seats: 3, electorate: 1200, tile: { row: 3, col: 0 },
      profile: { young: 1.15, periurban_worker: 1.1 } },
  ],

  elections: {
    "2027": {
      id: "2027",
      year: 2027,
      label: "2027 · The Republic's Runoff",
      tagline: "April 2027. Macron is term-limited, the first round is done, and for the first time the RN enters a runoff at parity. Two weeks. Every point counts.",
      salience: { cost_of_living: 0.9, immigration_identity: 0.8, security: 0.65, pensions: 0.6, public_services: 0.55, europe: 0.5 },
      regions: {
        HDF:  { v: { ens: 0.42, rn: 0.58 }, s: { ens: 4, rn: 5 } },
        NOR:  { v: { ens: 0.48, rn: 0.52 }, s: { ens: 2, rn: 3 } },
        GE:   { v: { ens: 0.45, rn: 0.55 }, s: { ens: 4, rn: 4 } },
        BRE:  { v: { ens: 0.60, rn: 0.40 }, s: { ens: 3, rn: 2 } },
        PDL:  { v: { ens: 0.58, rn: 0.42 }, s: { ens: 4, rn: 2 } },
        IDF:  { v: { ens: 0.62, rn: 0.38 }, s: { ens: 11, rn: 7 } },
        BFC:  { v: { ens: 0.47, rn: 0.53 }, s: { ens: 2, rn: 2 } },
        CVL:  { v: { ens: 0.50, rn: 0.50 }, s: { ens: 2, rn: 2 } },
        NAQ:  { v: { ens: 0.54, rn: 0.46 }, s: { ens: 5, rn: 4 } },
        ARA:  { v: { ens: 0.53, rn: 0.47 }, s: { ens: 6, rn: 6 } },
        OCC:  { v: { ens: 0.52, rn: 0.48 }, s: { ens: 5, rn: 4 } },
        PACA: { v: { ens: 0.43, rn: 0.57 }, s: { ens: 3, rn: 5 } },
        COM:  { v: { ens: 0.52, rn: 0.48 }, s: { ens: 2, rn: 1 } },
      },
    },
  },

  leaders: {
    "2027": {
      ens: { partyId: "ens", name: "Édouard Philippe", charisma: 58, energy: 62, competence: 76, machine: 70 },
      rn:  { partyId: "rn", name: "Jordan Bardella", charisma: 72, energy: 74, competence: 52, machine: 66 },
    },
  },

  events: [
    { id: "debat_entre_deux", headline: "{party}'s candidate wins the entre-deux-tours debate", role: "any", weight: 4, appeal: 0.035, momentum: 12 },
    { id: "front_republicain", headline: "The front républicain stirs — eliminated candidates' voters break for {party}", role: "any", weight: 3, appeal: 0.03, momentum: 8 },
    { id: "derapage", headline: "A dérapage — an ugly remark from a {party} surrogate dominates the cycle", role: "any", weight: 3, appeal: -0.035, momentum: -9 },
    { id: "prix_essence", headline: "A fuel-price spike lands hardest on {party}", role: "leader", weight: 2, appeal: -0.025, momentum: -5 },
    { id: "securite_incident", headline: "A security incident pushes the campaign onto {party}'s ground", role: "any", weight: 2, appeal: 0.03, momentum: 7 },
    { id: "abstention_alarm", headline: "Abstention warnings mobilize {party}'s ground game", role: "player", weight: 2, appeal: 0.02, momentum: 6 },
    { id: "presse_ralliement", headline: "A wave of editorials rallies to {party}", role: "any", weight: 2, appeal: 0.02, momentum: 5 },
    { id: "meeting_geant", headline: "A packed stadium meeting electrifies {party}", role: "player", weight: 2, appeal: 0.025, momentum: 9 },
  ],
};
