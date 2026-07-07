// CAMPAIGN STAFF — hire up to 3 from a pool of 8 at setup. Each gives one
// passive bonus; each draws a weekly salary from your war chest; each has a
// loyalty threshold — fall far enough behind and they may walk. Instant-effect
// bonuses (actions, traits) apply at game creation; the in-flight multipliers
// (ads, fundraising, oppo shield) are read by the engine via staffEffects().

import type { CandidateId, CandidateTraits, GameState } from "@engine/types";

export interface StaffDef {
  id: string;
  name: string;
  emoji: string;
  role: string;
  blurb: string;
  salaryPerWeek: number; // dollars
  // 0..100: below this projected-EV share (player EV / 270), the staffer may quit.
  loyalty: number;
  effects: {
    maxActions?: number;          // extra weekly action slots
    adMult?: number;              // multiplier on ad effectiveness (1.05 = +5%)
    fundraiseMult?: number;       // multiplier on fundraising hauls
    oppoShield?: number;          // subtracted from opponents' oppo success chance
    debatePrepBonus?: number;     // extra readiness from each debate-prep action
    traitBonuses?: Partial<CandidateTraits>;
  };
}

export const STAFF_POOL: StaffDef[] = [
  {
    id: "field_director", name: "Ray Ortega", emoji: "🗺️", role: "Field Director",
    blurb: "A machine of clipboards and county maps. One more thing gets done every single week.",
    salaryPerWeek: 400_000, loyalty: 55,
    effects: { maxActions: 1 },
  },
  {
    id: "media_guru", name: "Dana Whitfield", emoji: "🎬", role: "Media Strategist",
    blurb: "Cut her teeth on Super Bowl spots. Your ad dollars simply buy more.",
    salaryPerWeek: 550_000, loyalty: 60,
    effects: { adMult: 1.12 },
  },
  {
    id: "finance_chair", name: "Marcus Boone", emoji: "💰", role: "Finance Chair",
    blurb: "Knows every bundler from Palo Alto to Palm Beach. Fundraisers close bigger.",
    salaryPerWeek: 350_000, loyalty: 50,
    effects: { fundraiseMult: 1.15 },
  },
  {
    id: "debate_coach", name: "Prof. Elena Vasquez", emoji: "🎓", role: "Debate Coach",
    blurb: "Drills you until the zingers are muscle memory. Sharper on stage, week one.",
    salaryPerWeek: 300_000, loyalty: 70,
    effects: { traitBonuses: { debatePrep: 6, debatingSkill: 4 }, debatePrepBonus: 3 },
  },
  {
    id: "spin_doctor", name: "Tommy Callahan", emoji: "🌀", role: "Rapid Response Director",
    blurb: "Kills opposition hits before the second news cycle. Their dirt sticks less.",
    salaryPerWeek: 450_000, loyalty: 45,
    effects: { oppoShield: 0.15 },
  },
  {
    id: "pollster", name: "Dr. Ingrid Chen", emoji: "📊", role: "Chief Pollster",
    blurb: "Her crosstabs read like prophecy. Your message lands closer to the mark.",
    salaryPerWeek: 400_000, loyalty: 65,
    effects: { adMult: 1.05, traitBonuses: { policyKnowledge: 4 } },
  },
  {
    id: "body_man", name: "Petey Sullivan", emoji: "🧃", role: "Body Man",
    blurb: "Coffee, briefings, and a sixth sense for when you need a nap. The candidate stays fresh.",
    salaryPerWeek: 150_000, loyalty: 90,
    effects: { traitBonuses: { energy: 6 } },
  },
  {
    id: "veteran_manager", name: "Claudia Marsh", emoji: "♟️", role: "Campaign Manager",
    blurb: "Three cycles, two upsets. Steadies the whole operation — a bit of everything.",
    salaryPerWeek: 600_000, loyalty: 55,
    effects: { maxActions: 1, fundraiseMult: 1.05, adMult: 1.04 },
  },
];

export const STAFF_BY_ID: Record<string, StaffDef> = Object.fromEntries(STAFF_POOL.map((s) => [s.id, s]));

export const MAX_STAFF = 3;

export interface StaffEffects {
  maxActions: number;
  adMult: number;
  fundraiseMult: number;
  oppoShield: number;
  debatePrepBonus: number;
  salaryPerWeek: number;
}

/** Aggregate passive effects of a ticket's current staff. */
export function staffEffects(game: GameState, candidate: CandidateId): StaffEffects {
  const out: StaffEffects = { maxActions: 0, adMult: 1, fundraiseMult: 1, oppoShield: 0, debatePrepBonus: 0, salaryPerWeek: 0 };
  for (const id of game.staff?.[candidate] ?? []) {
    const s = STAFF_BY_ID[id];
    if (!s) continue;
    out.maxActions += s.effects.maxActions ?? 0;
    out.adMult *= s.effects.adMult ?? 1;
    out.fundraiseMult *= s.effects.fundraiseMult ?? 1;
    out.oppoShield += s.effects.oppoShield ?? 0;
    out.debatePrepBonus += s.effects.debatePrepBonus ?? 0;
    out.salaryPerWeek += s.salaryPerWeek;
  }
  return out;
}
