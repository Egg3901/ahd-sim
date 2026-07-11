import type { BlocId, IssueId } from "@engine/types";

// ── Bloc archetypes ───────────────────────────────────────────────────────
// Each bloc carries: its national share of the electorate (a synthetic
// partition summing to 1), how strongly it turns out, its 2020 national
// two-party Biden lean, and an issue profile (how much it cares about each
// issue and where its ideal sits on the left(-1)↔right(+1) axis).
//
// The national lean is converted to a logit and, per state, offset by a single
// solved scalar so the turnout-weighted aggregate reproduces the real 2020
// result. So these numbers set the *texture* of each state; the solver handles
// the topline. Campaign actions and events then move blocs around that anchor.

export interface BlocArchetype {
  id: BlocId;
  name: string;
  nationalShare: number; // fraction of national electorate (sums to ~1)
  turnoutPropensity: number; // 0..1
  nationalDemShare: number; // 2020 two-party Biden share for this bloc
  issueWeights: Partial<Record<IssueId, number>>; // 0..1, how much they care
  idealPositions: Partial<Record<IssueId, number>>; // -1 left .. +1 right
  // How responsive this bloc is to candidate charisma/integrity (trait term).
  traitSensitivity: number; // 0..1
}

export const BLOCS: Record<BlocId, BlocArchetype> = {
  noncollege_white: {
    id: "noncollege_white",
    name: "Working-class white voters",
    nationalShare: 0.3,
    turnoutPropensity: 0.62,
    nationalDemShare: 0.36,
    traitSensitivity: 0.55,
    issueWeights: {
      economy: 0.9,
      trade: 0.7,
      immigration: 0.7,
      law_and_order: 0.65,
      healthcare: 0.5,
      covid_response: 0.45,
    },
    idealPositions: {
      economy: 0.35,
      trade: 0.4,
      immigration: 0.55,
      law_and_order: 0.6,
      healthcare: 0.0,
      covid_response: 0.3,
      climate: 0.4,
    },
  },
  college_white: {
    id: "college_white",
    name: "College-educated white voters",
    nationalShare: 0.18,
    turnoutPropensity: 0.72,
    nationalDemShare: 0.52,
    traitSensitivity: 0.45,
    issueWeights: {
      economy: 0.7,
      healthcare: 0.65,
      climate: 0.6,
      covid_response: 0.7,
      abortion: 0.5,
      taxes: 0.55,
    },
    idealPositions: {
      economy: 0.05,
      healthcare: -0.2,
      climate: -0.35,
      covid_response: -0.3,
      abortion: -0.3,
      taxes: 0.1,
      immigration: -0.1,
    },
  },
  suburban_women: {
    id: "suburban_women",
    name: "Suburban women",
    nationalShare: 0.09,
    turnoutPropensity: 0.7,
    nationalDemShare: 0.55,
    traitSensitivity: 0.6,
    issueWeights: {
      covid_response: 0.85,
      healthcare: 0.75,
      abortion: 0.6,
      law_and_order: 0.55,
      economy: 0.65,
    },
    idealPositions: {
      covid_response: -0.4,
      healthcare: -0.3,
      abortion: -0.4,
      law_and_order: 0.15,
      economy: -0.05,
      race_policing: -0.2,
    },
  },
  black: {
    id: "black",
    name: "Black voters",
    nationalShare: 0.12,
    turnoutPropensity: 0.6,
    nationalDemShare: 0.9,
    traitSensitivity: 0.4,
    issueWeights: {
      race_policing: 0.9,
      healthcare: 0.7,
      economy: 0.7,
      covid_response: 0.7,
    },
    idealPositions: {
      race_policing: -0.6,
      healthcare: -0.45,
      economy: -0.25,
      covid_response: -0.4,
      law_and_order: -0.3,
    },
  },
  hispanic: {
    id: "hispanic",
    name: "Hispanic & Latino voters",
    nationalShare: 0.11,
    turnoutPropensity: 0.52,
    nationalDemShare: 0.62,
    traitSensitivity: 0.5,
    issueWeights: {
      economy: 0.85,
      immigration: 0.7,
      healthcare: 0.6,
      covid_response: 0.6,
    },
    idealPositions: {
      economy: -0.1,
      immigration: -0.35,
      healthcare: -0.3,
      covid_response: -0.25,
      law_and_order: 0.1,
    },
  },
  asian_other: {
    id: "asian_other",
    name: "Asian American & other voters",
    nationalShare: 0.05,
    turnoutPropensity: 0.58,
    nationalDemShare: 0.65,
    traitSensitivity: 0.45,
    issueWeights: {
      economy: 0.8,
      healthcare: 0.6,
      immigration: 0.55,
      covid_response: 0.6,
    },
    idealPositions: {
      economy: -0.05,
      healthcare: -0.25,
      immigration: -0.25,
      covid_response: -0.3,
    },
  },
  seniors: {
    id: "seniors",
    name: "Seniors (65+)",
    nationalShare: 0.1,
    turnoutPropensity: 0.75,
    nationalDemShare: 0.48,
    traitSensitivity: 0.5,
    issueWeights: {
      covid_response: 0.9,
      healthcare: 0.8,
      economy: 0.6,
      law_and_order: 0.6,
    },
    idealPositions: {
      covid_response: -0.15,
      healthcare: -0.1,
      economy: 0.2,
      law_and_order: 0.4,
      immigration: 0.25,
    },
  },
  youth: {
    id: "youth",
    name: "Young voters (18-29)",
    nationalShare: 0.05,
    turnoutPropensity: 0.46,
    nationalDemShare: 0.6,
    traitSensitivity: 0.5,
    issueWeights: {
      climate: 0.85,
      race_policing: 0.75,
      healthcare: 0.6,
      economy: 0.6,
    },
    idealPositions: {
      climate: -0.6,
      race_policing: -0.55,
      healthcare: -0.5,
      economy: -0.3,
      abortion: -0.4,
    },
  },
};

export const BLOC_IDS = Object.keys(BLOCS) as BlocId[];

// logit helper (exported for the state-shift solver).
export function logit(p: number): number {
  const clamped = Math.min(0.999, Math.max(0.001, p));
  return Math.log(clamped / (1 - clamped));
}
