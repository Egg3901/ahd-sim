import type { CandidateId, RunningMate } from "@engine/types";

// The VP shortlists. Each pick is balanced around a small, legible trade-off:
// a couple of trait bumps plus bloc favorability that nudges a specific slice
// of the coalition. The first entry on each side is the historical 2020 pick
// and serves as that ticket's default (and the AI opponent's running mate).
//
// Magnitudes are intentionally modest — traits +4..+9, favorability +0.04..+0.10,
// cash +6..14M against a 180–220M war chest — so a pick shapes strategy without
// breaking the 2020 calibration.
export const RUNNING_MATES: Record<CandidateId, RunningMate[]> = {
  biden: [
    {
      id: "harris",
      name: "Kamala Harris",
      ticket: "biden",
      historical: true,
      blurb: "Coalition builder — shores up Black and suburban-women turnout and sharpens the debate stage.",
      traitBonuses: { charisma: 6, debatingSkill: 5 },
      favorability: { black: 0.08, suburban_women: 0.06, asian_other: 0.05 },
    },
    {
      id: "warren",
      name: "Elizabeth Warren",
      ticket: "biden",
      blurb: "Progressive firebrand — electrifies college whites and the youth vote and floods the small-dollar pipeline.",
      traitBonuses: { policyKnowledge: 8, intelligence: 5, fundraisingProwess: 6 },
      favorability: { college_white: 0.08, youth: 0.06 },
      cashBonus: 14_000_000,
    },
    {
      id: "klobuchar",
      name: "Amy Klobuchar",
      ticket: "biden",
      blurb: "Midwestern pragmatist — rebuilds the blue wall with non-college whites and seniors.",
      traitBonuses: { energy: 5, debatePrep: 5 },
      favorability: { noncollege_white: 0.07, seniors: 0.06, suburban_women: 0.04 },
    },
    {
      id: "whitmer",
      name: "Gretchen Whitmer",
      ticket: "biden",
      blurb: "Battleground governor — a tireless surrogate who locks in suburban Michigan and the upper Midwest.",
      traitBonuses: { charisma: 5, energy: 6 },
      favorability: { suburban_women: 0.08, noncollege_white: 0.05 },
      candidateDayBonus: 1,
    },
    {
      id: "demings",
      name: "Val Demings",
      ticket: "biden",
      blurb: "Former police chief — blunts the law-and-order attack and energizes Black and senior voters.",
      traitBonuses: { debatePrep: 6, debatingSkill: 5 },
      favorability: { black: 0.07, seniors: 0.05 },
    },
  ],
  trump: [
    {
      id: "pence",
      name: "Mike Pence",
      ticket: "trump",
      historical: true,
      blurb: "Evangelical anchor — guarantees the base, holds non-college whites and seniors, steadies the debate.",
      traitBonuses: { debatePrep: 6, policyKnowledge: 4 },
      favorability: { noncollege_white: 0.07, seniors: 0.06 },
    },
    {
      id: "haley",
      name: "Nikki Haley",
      ticket: "trump",
      blurb: "Suburban bridge — wins back suburban women and college whites the top of the ticket bleeds.",
      traitBonuses: { charisma: 6, debatingSkill: 6 },
      favorability: { suburban_women: 0.08, college_white: 0.06, asian_other: 0.04 },
      cashBonus: 8_000_000,
    },
    {
      id: "scott",
      name: "Tim Scott",
      ticket: "trump",
      blurb: "Outreach closer — a magnetic fundraiser who softens the margins with Black and suburban voters.",
      traitBonuses: { charisma: 6, fundraisingProwess: 5 },
      favorability: { black: 0.06, suburban_women: 0.05 },
      cashBonus: 10_000_000,
    },
    {
      id: "cotton",
      name: "Tom Cotton",
      ticket: "trump",
      blurb: "Hardliner — maximizes non-college turnout and runs hot on law and order.",
      traitBonuses: { debatePrep: 5, energy: 5 },
      favorability: { noncollege_white: 0.09, seniors: 0.04 },
    },
    {
      id: "noem",
      name: "Kristi Noem",
      ticket: "trump",
      blurb: "Heartland energy — a relentless campaigner who runs up the score in rural America.",
      traitBonuses: { energy: 8, charisma: 4 },
      favorability: { noncollege_white: 0.07, seniors: 0.04 },
      candidateDayBonus: 1,
    },
  ],
};

// The default (historical) VP for a ticket — used when the player hasn't chosen
// and for the AI opponent.
export function defaultRunningMate(ticket: CandidateId): RunningMate {
  const list = RUNNING_MATES[ticket];
  return list.find((m) => m.historical) ?? list[0];
}

// Resolve a chosen VP id to its record, falling back to the historical default.
export function resolveRunningMate(ticket: CandidateId, id?: string): RunningMate {
  if (!id) return defaultRunningMate(ticket);
  return RUNNING_MATES[ticket].find((m) => m.id === id) ?? defaultRunningMate(ticket);
}
