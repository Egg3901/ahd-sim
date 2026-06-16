import { describe, it, expect } from "vitest";
import { createGame } from "../setup";
import { computeResult } from "../voteModel";
import { createRng } from "../rng";
import { TOTAL_EV } from "@content/states";

// ── Calibration: a neutral game must reproduce history (Section 11). ───────
describe("calibration to 2020", () => {
  it("awards exactly 538 electoral votes across all contests", () => {
    expect(TOTAL_EV).toBe(538);
  });

  it("neutral (do-nothing) play lands on Biden 306 / Trump 232", () => {
    const game = createGame({ seed: "calibration", playerCandidate: "dem" });
    const result = computeResult(game);
    expect(result.electoralVotes.dem).toBe(306);
    expect(result.electoralVotes.rep).toBe(232);
    expect(result.winner).toBe("dem");
  });

  it("neutral national two-party share is Biden ~52% (real: 52.3%)", () => {
    const game = createGame({ seed: "calibration" });
    const result = computeResult(game);
    expect(result.popularShare.dem).toBeGreaterThan(0.515);
    expect(result.popularShare.dem).toBeLessThan(0.53);
  });

  it("the seven battlegrounds are all genuinely close (<6 pt margin)", () => {
    const game = createGame({ seed: "calibration" });
    const result = computeResult(game);
    const battlegrounds = ["AZ", "GA", "WI", "PA", "NV", "NC", "FL"];
    for (const id of battlegrounds) {
      const sr = result.stateResults.find((s) => s.stateId === id)!;
      expect(sr.margin, `${id} margin`).toBeLessThan(6);
    }
  });

  // 1000 neutral sims with realistic per-state noise: the mean must center on
  // history and the tossups must actually swing both ways across the runs.
  it("1000 noisy neutral sims center near Biden ~306 EV", () => {
    const runs = 1000;
    let evSum = 0;
    let demWins = 0;
    const flips = new Set<string>();
    for (let r = 0; r < runs; r++) {
      const game = createGame({ seed: `neutral-${r}` });
      const rng = createRng(`noise-${r}`);
      // Apply a small symmetric national + per-state polling-style perturbation.
      const national = rng.normal(0, 0.015); // ~1.5pt national sd, zero-mean
      for (const st of game.states) {
        const stateNoise = rng.normal(0, 0.02);
        for (const bloc of st.blocs) {
          bloc.campaignMargin += (national + stateNoise) * 4; // logit-space nudge
        }
      }
      const result = computeResult(game);
      evSum += result.electoralVotes.dem;
      if (result.electoralVotes.dem >= 270) demWins++;
      for (const id of ["AZ", "GA", "WI", "PA", "NV", "NC", "FL"]) {
        const sr = result.stateResults.find((s) => s.stateId === id)!;
        if (sr.winner === "rep") flips.add(id);
      }
    }
    const meanEv = evSum / runs;
    expect(meanEv).toBeGreaterThan(290);
    expect(meanEv).toBeLessThan(325);
    // Biden should usually but not always win under neutral noise (real 2020
    // forecasts put him in the ~65–90% range; the tossups are live).
    expect(demWins).toBeGreaterThan(620);
    expect(demWins).toBeLessThan(950);
    // The tossups must be genuinely swingable: each flips Trump in some runs.
    expect(flips.size).toBeGreaterThanOrEqual(5);
  });
});
