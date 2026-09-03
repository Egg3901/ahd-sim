import { describe, expect, it } from "vitest";
import {
  activePlanBonusIds,
  orderedPlan,
  planBonusMultiplier,
  planBonusesForAction,
  type PlanActionLike,
} from "../planBonuses";

describe("weekly plan bonuses", () => {
  it("rewards setup and follow-through on later days", () => {
    const plan: PlanActionLike[] = [
      { type: "rally", stateId: "PA", day: 1 },
      { type: "ground_game", stateId: "MI", day: 2 },
      { type: "advertise", stateId: "PA", adMode: "positive", day: 3 },
      { type: "gotv", stateId: "MI", day: 5 },
    ];

    expect(planBonusesForAction(plan[2], plan).map((b) => b.id)).toEqual(["earned_media"]);
    expect(planBonusesForAction(plan[3], plan).map((b) => b.id)).toEqual(["field_machine"]);
    expect(activePlanBonusIds(plan)).toEqual(new Set(["earned_media", "field_machine"]));
  });

  it("does not reward the wrong target, same-day actions, or reversed sequencing", () => {
    const plan: PlanActionLike[] = [
      { type: "advertise", stateId: "PA", day: 1 },
      { type: "rally", stateId: "PA", day: 3 },
      { type: "rally", stateId: "MI", day: 2 },
      { type: "advertise", stateId: "PA", day: 3 },
    ];
    expect(planBonusesForAction(plan[0], plan)).toEqual([]);
    expect(planBonusesForAction(plan[3], plan)).toEqual([]);
  });

  it("supports issue and attack chains across both advertising vocabularies", () => {
    const plan: PlanActionLike[] = [
      { type: "policy_prep", day: 1 },
      { type: "oppo_research", regionId: "north", day: 1 },
      { type: "broadcast", mode: "issue", regionId: "south", day: 2 },
      { type: "broadcast", mode: "contrast", regionId: "north", day: 3 },
    ];
    expect(planBonusesForAction(plan[2], plan).map((b) => b.id)).toEqual(["message_discipline"]);
    expect(planBonusesForAction(plan[3], plan).map((b) => b.id)).toEqual(["attack_line"]);
  });

  it("stacks distinct chains but leaves undated AI and legacy plans unchanged", () => {
    const payoff: PlanActionLike = { type: "broadcast", mode: "issue", regionId: "scot", day: 3 };
    const plan: PlanActionLike[] = [
      { type: "rally", regionId: "scot", day: 1 },
      { type: "policy_prep", day: 2 },
      payoff,
    ];
    expect(planBonusMultiplier(planBonusesForAction(payoff, plan))).toBeCloseTo(1.44);
    expect(planBonusesForAction({ type: "gotv", regionId: "scot" }, [
      { type: "ground_game", regionId: "scot" },
    ])).toEqual([]);
  });

  it("orders the calendar stably instead of using click order", () => {
    const dayThreeA = { type: "rally", day: 3 };
    const dayOne = { type: "advertise", day: 1 };
    const dayThreeB = { type: "gotv", day: 3 };
    expect(orderedPlan([dayThreeA, dayOne, dayThreeB])).toEqual([dayOne, dayThreeA, dayThreeB]);
  });
});
