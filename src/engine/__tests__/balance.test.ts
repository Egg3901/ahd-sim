import { describe, it, expect } from "vitest";
import { createGame } from "../setup";
import { advanceTurn, beginGame } from "../turn";
import { DIFFICULTY } from "../ai";
import { projectElection } from "../voteModel";

// Regression: the AI used to dump its whole ad budget into California (54 EV) and
// flip it in a single turn, because campaign effects scaled ~linearly with spend
// and safe-state leans weren't sticky. Safe states should stay safe.
describe("balance: leans are sticky", () => {
  const safe: Record<string, "dem" | "rep"> = {
    CA: "dem", NY: "dem", MA: "dem", // deep blue
    WY: "rep", WV: "rep", OK: "rep", // deep red
  };

  for (const scenario of ["2024", "2020"]) {
    it(`the AI cannot flip safe states against a passive player (${scenario}, hard)`, () => {
      let g = beginGame(createGame({ scenario, playerCandidate: "dem", seed: `safe-${scenario}` }));
      const worst: Record<string, number> = {};
      let guard = 0;
      while (g.phase !== "result" && guard++ < 12) {
        g = advanceTurn(g, [], `safe-${scenario}`, { difficulty: DIFFICULTY.hard, autoResolvePlayerEvents: true });
        for (const c of projectElection(g).contests) {
          if (!(c.stateId in safe)) continue;
          // Track the closest each safe state ever came to flipping.
          const lead = safe[c.stateId] === "dem" ? c.demShare - 0.5 : 0.5 - c.demShare;
          worst[c.stateId] = Math.min(worst[c.stateId] ?? 1, lead);
        }
      }
      for (const [id, lead] of Object.entries(worst)) {
        expect(lead, `${id} stayed ${safe[id]}`).toBeGreaterThan(0);
      }
    });
  }
});
