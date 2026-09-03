// Weekly plans are more than bags of actions. Deliberately sequencing a setup
// action on an earlier day makes the follow-through land harder. Keeping this
// module structural lets the US and multiparty engines share the same rules.

export interface PlanActionLike {
  type: string;
  day?: number;
  stateId?: string;
  regionId?: string;
  adMode?: string;
  mode?: string;
}

export type PlanBonusId = "earned_media" | "field_machine" | "message_discipline" | "attack_line";

export interface PlanBonus {
  id: PlanBonusId;
  name: string;
  multiplier: number;
  recipe: string;
  description: string;
}

export const PLAN_BONUSES: readonly PlanBonus[] = [
  {
    id: "earned_media",
    name: "Own the news cycle",
    multiplier: 1.2,
    recipe: "Rally -> ads",
    description: "Rally in a target, then advertise there on a later day.",
  },
  {
    id: "field_machine",
    name: "Turnout machine",
    multiplier: 1.25,
    recipe: "Field -> GOTV",
    description: "Build field offices, then run GOTV there on a later day.",
  },
  {
    id: "message_discipline",
    name: "Make the case",
    multiplier: 1.2,
    recipe: "Policy -> issue",
    description: "Do policy prep, then make an issue pitch or issue ad on a later day.",
  },
  {
    id: "attack_line",
    name: "Define the attack",
    multiplier: 1.25,
    recipe: "Oppo -> contrast",
    description: "Research the opposition, then run contrast ads on a later day.",
  },
] as const;

function targetOf(action: PlanActionLike): string | undefined {
  return action.stateId ?? action.regionId;
}

function isAdvertise(action: PlanActionLike): boolean {
  return action.type === "advertise" || action.type === "broadcast";
}

function modeOf(action: PlanActionLike): string | undefined {
  return action.adMode ?? action.mode;
}

function earlier(setup: PlanActionLike, payoff: PlanActionLike): boolean {
  // Programmatic actions and AI plans historically omitted days. Requiring two
  // explicit days keeps those paths balance-identical and rewards the human
  // planner for actually using the calendar.
  return setup.day !== undefined && payoff.day !== undefined && setup.day < payoff.day;
}

function sameTarget(setup: PlanActionLike, payoff: PlanActionLike): boolean {
  const a = targetOf(setup);
  const b = targetOf(payoff);
  return a !== undefined && a === b;
}

function overlappingScope(setup: PlanActionLike, payoff: PlanActionLike): boolean {
  const a = targetOf(setup);
  const b = targetOf(payoff);
  return a === undefined || b === undefined || a === b;
}

export function planBonusesForAction(
  payoff: PlanActionLike,
  plan: readonly PlanActionLike[],
): PlanBonus[] {
  const active: PlanBonus[] = [];
  const hasSetup = (test: (setup: PlanActionLike) => boolean) =>
    plan.some((setup) => earlier(setup, payoff) && test(setup));

  if (isAdvertise(payoff) && hasSetup((a) => a.type === "rally" && sameTarget(a, payoff))) {
    active.push(PLAN_BONUSES[0]);
  }
  if (payoff.type === "gotv" && hasSetup((a) => a.type === "ground_game" && sameTarget(a, payoff))) {
    active.push(PLAN_BONUSES[1]);
  }
  if (
    (payoff.type === "issue_pivot" || (isAdvertise(payoff) && modeOf(payoff) === "issue")) &&
    hasSetup((a) => a.type === "policy_prep")
  ) {
    active.push(PLAN_BONUSES[2]);
  }
  if (
    isAdvertise(payoff) && modeOf(payoff) === "contrast" &&
    hasSetup((a) => a.type === "oppo_research" && overlappingScope(a, payoff))
  ) {
    active.push(PLAN_BONUSES[3]);
  }
  return active;
}

export function planBonusMultiplier(bonuses: readonly PlanBonus[]): number {
  return bonuses.reduce((mult, bonus) => mult * bonus.multiplier, 1);
}

export function orderedPlan<T extends PlanActionLike>(plan: readonly T[]): T[] {
  return plan
    .map((action, index) => ({ action, index }))
    .sort((a, b) => (a.action.day ?? 1) - (b.action.day ?? 1) || a.index - b.index)
    .map(({ action }) => action);
}

export function activePlanBonusIds(plan: readonly PlanActionLike[]): Set<PlanBonusId> {
  const active = new Set<PlanBonusId>();
  for (const action of plan) {
    for (const bonus of planBonusesForAction(action, plan)) active.add(bonus.id);
  }
  return active;
}
