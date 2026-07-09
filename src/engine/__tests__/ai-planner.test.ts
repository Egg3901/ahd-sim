import { describe, it, expect } from "vitest";
import { createGame } from "../setup";
import { beginGame } from "../turn";
import { createRng } from "../rng";
import { planAiActions, rankTargets, competitiveBand, DIFFICULTY } from "../ai";

describe("US AI planner", () => {
  it("competitive band widens when behind and tightens when ahead", () => {
    expect(competitiveBand(-90)).toBeGreaterThan(competitiveBand(0));
    expect(competitiveBand(70)).toBeLessThan(competitiveBand(0));
  });

  it("rankTargets prefers EV-per-dollar over raw closeness", () => {
    const g = beginGame(createGame({ scenario: "2020", playerCandidate: "dem", seed: "ai-rank" }));
    const targets = rankTargets(g, "rep", DIFFICULTY.hard);
    expect(targets.length).toBeGreaterThan(0);
    // Priorities are sorted descending.
    for (let i = 1; i < targets.length; i++) {
      expect(targets[i - 1].priority).toBeGreaterThanOrEqual(targets[i].priority);
    }
    // Every target exposes an EV/$ estimate.
    expect(targets.every((t) => t.evPerDollar > 0)).toBe(true);
  });

  it("planAiActions is budget-first: most slots are persuasion, not overhead", () => {
    const g = beginGame(createGame({ scenario: "2020", playerCandidate: "dem", seed: "ai-plan", difficulty: "normal" }));
    const rng = createRng(7);
    const actions = planAiActions(g, rng, DIFFICULTY.hard);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.length).toBeLessThanOrEqual(g.resources.rep.actions);
    const persuasion = actions.filter((a) =>
      a.type === "advertise" || a.type === "rally" || a.type === "gotv",
    ).length;
    const overhead = actions.filter((a) =>
      a.type === "ground_game" || a.type === "debate_prep" || a.type === "policy_prep" || a.type === "fundraise",
    ).length;
    expect(persuasion).toBeGreaterThanOrEqual(overhead);
    expect(actions.some((a) => a.type === "advertise" || a.type === "rally")).toBe(true);
  });

  it("easy environment handicap tilts the map toward the underdog", () => {
    const hard = createGame({ scenario: "1984", playerCandidate: "dem", seed: "env", difficulty: "hard" });
    const easy = createGame({ scenario: "1984", playerCandidate: "dem", seed: "env", difficulty: "easy" });
    // Same seed/scenario: easy blocs should have a higher dem baseline than hard.
    const hardBloc = hard.states.find((s) => s.id === "PA")!.blocs[0];
    const easyBloc = easy.states.find((s) => s.id === "PA")!.blocs[0];
    expect(easyBloc.baselineMargin).toBeGreaterThan(hardBloc.baselineMargin);
    expect(easy.resources.dem.cash).toBeGreaterThan(hard.resources.dem.cash);
  });
});
