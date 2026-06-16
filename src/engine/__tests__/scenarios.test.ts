import { describe, it, expect } from "vitest";
import { createGame } from "../setup";
import { projectElection } from "../voteModel";
import { SCENARIO_IDS, SCENARIOS, getScenario } from "@content/scenarios";

describe("scenarios", () => {
  it("every scenario's map totals 538 electoral votes", () => {
    for (const id of SCENARIO_IDS) {
      const game = createGame({ scenario: id, seed: "ev" });
      const total = game.states.reduce((s, st) => s + st.electoralVotes, 0);
      expect(total, `scenario ${id}`).toBe(538);
    }
  });

  it("each scenario installs its own tickets into the dem/rep slots", () => {
    for (const id of SCENARIO_IDS) {
      const scen = SCENARIOS[id];
      const game = createGame({ scenario: id, seed: "tickets" });
      expect(game.scenarioId).toBe(id);
      expect(game.candidates.dem.shortName).toBe(scen.dem.shortName);
      expect(game.candidates.rep.shortName).toBe(scen.rep.shortName);
      // The opponent gets the historical running mate by default.
      const histRep = scen.rep.runningMates.find((m) => m.historical) ?? scen.rep.runningMates[0];
      expect(game.candidates.rep.runningMate).toBe(histRep.name);
    }
  });

  it("an unknown scenario id falls back to 2020", () => {
    expect(getScenario("9999").id).toBe("2020");
    expect(getScenario(undefined).id).toBe("2020");
  });

  it("scenario state priors drive the projected map (2016 differs from 2024)", () => {
    const a = projectElection(createGame({ scenario: "2016", seed: "p" }));
    const b = projectElection(createGame({ scenario: "2024", seed: "p" }));
    expect(a.contests.find((c) => c.stateId === "PA")!.demShare)
      .not.toBeCloseTo(b.contests.find((c) => c.stateId === "PA")!.demShare, 3);
  });
});
