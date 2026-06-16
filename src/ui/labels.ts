import type { BlocId, RunningMate } from "@engine/index";

export const TRAIT_LABELS: Record<string, string> = {
  charisma: "Charisma",
  energy: "Energy",
  debatePrep: "Debate Prep",
  intelligence: "Intelligence",
  policyKnowledge: "Policy Knowledge",
  debatingSkill: "Debating Skill",
  fundraisingProwess: "Fundraising Prowess",
};

export const BLOC_LABELS: Record<BlocId, string> = {
  noncollege_white: "Non-college white",
  college_white: "College white",
  suburban_women: "Suburban women",
  black: "Black",
  hispanic: "Hispanic",
  asian_other: "AAPI / other",
  seniors: "Seniors",
  youth: "Youth",
};

// Compact, human-readable summary of a running mate's bonuses, for chips.
export function mateBonusChips(m: RunningMate): string[] {
  const chips: string[] = [];
  if (m.traitBonuses) {
    for (const [k, v] of Object.entries(m.traitBonuses)) {
      if (v) chips.push(`+${v} ${TRAIT_LABELS[k] ?? k}`);
    }
  }
  if (m.favorability) {
    for (const [b, v] of Object.entries(m.favorability)) {
      if (v) chips.push(`+${Math.round(v * 100)} ${BLOC_LABELS[b as BlocId] ?? b}`);
    }
  }
  if (m.cashBonus) chips.push(`+$${Math.round(m.cashBonus / 1_000_000)}M war chest`);
  if (m.candidateDayBonus) chips.push(`+${m.candidateDayBonus} candidate day`);
  return chips;
}
