import type { Candidate, CandidateId } from "@engine/types";

// The two tickets. issuePositions: -1 (left) .. +1 (right). Traits 0..100
// modify action effectiveness and event odds, never the vote directly.
export const CANDIDATES: Record<CandidateId, Candidate> = {
  biden: {
    id: "biden",
    name: "Joe Biden",
    shortName: "Biden",
    party: "Democratic",
    runningMate: "Kamala Harris",
    color: "#2563eb",
    traits: {
      charisma: 62,
      stamina: 55,
      leadership: 70,
      integrity: 68,
      experience: 92,
      debating: 64,
      fundraising: 78,
    },
    issuePositions: {
      economy: -0.25,
      covid_response: -0.55,
      healthcare: -0.45,
      immigration: -0.35,
      race_policing: -0.4,
      climate: -0.5,
      taxes: -0.3,
      law_and_order: -0.1,
      abortion: -0.5,
      trade: -0.05,
    },
    baseFavorability: {
      black: 0.35,
      college_white: 0.12,
      suburban_women: 0.18,
      seniors: 0.05,
    },
  },
  trump: {
    id: "trump",
    name: "Donald Trump",
    shortName: "Trump",
    party: "Republican",
    runningMate: "Mike Pence",
    color: "#dc2626",
    traits: {
      charisma: 74,
      stamina: 70,
      leadership: 60,
      integrity: 38,
      experience: 58,
      debating: 66,
      fundraising: 70,
    },
    issuePositions: {
      economy: 0.5,
      covid_response: 0.5,
      healthcare: 0.4,
      immigration: 0.75,
      race_policing: 0.55,
      climate: 0.6,
      taxes: 0.55,
      law_and_order: 0.7,
      abortion: 0.5,
      trade: 0.45,
    },
    baseFavorability: {
      noncollege_white: 0.3,
      seniors: 0.08,
    },
  },
};

export const OPPONENT_OF: Record<CandidateId, CandidateId> = {
  biden: "trump",
  trump: "biden",
};
