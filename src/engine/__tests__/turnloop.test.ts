import { describe, it, expect } from "vitest";
import { createGame } from "../setup";
import { advanceTurn, beginGame } from "../turn";
import { computeResult, projectElection } from "../voteModel";
import { resolveEvent } from "../events";
import type { CampaignAction, GameState } from "../types";

function playToEnd(game: GameState, actionsFor: (g: GameState) => CampaignAction[]): GameState {
  let g = beginGame(game);
  let guard = 0;
  while (g.phase !== "result" && guard++ < 50) {
    g = advanceTurn(g, actionsFor(g), "test-seed");
  }
  return g;
}

describe("turn loop", () => {
  it("advanceTurn is pure and deterministic", () => {
    const game = beginGame(createGame({ seed: "determinism", playerCandidate: "biden" }));
    const a = advanceTurn(game, [], "s1");
    const b = advanceTurn(game, [], "s1");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    // The input is not mutated.
    expect(game.turn).toBe(0);
  });

  it("runs a full neutral campaign to a decided result", () => {
    const end = playToEnd(createGame({ seed: "neutral-run" }), () => []);
    expect(end.phase).toBe("result");
    expect(end.result).toBeDefined();
    const totalEv = end.result!.electoralVotes.biden + end.result!.electoralVotes.trump;
    expect(totalEv).toBe(538);
    expect(["biden", "trump", "tie"]).toContain(end.result!.winner);
  });

  it("heavy Biden ad+rally investment in tossups improves his margin there", () => {
    const base = beginGame(createGame({ seed: "invest", playerCandidate: "biden" }));
    const targets = ["GA", "AZ", "NC"];

    const neutral = playToEnd(createGame({ seed: "invest" }), () => []);
    const invested = (() => {
      let g = base;
      let guard = 0;
      while (g.phase !== "result" && guard++ < 50) {
        const actions: CampaignAction[] = targets.flatMap((id) => [
          { type: "advertise", candidate: "biden", stateId: id, adMode: "positive", spend: 12_000_000 },
          { type: "rally", candidate: "biden", stateId: id, days: 1 },
        ]);
        g = advanceTurn(g, actions, "test-seed");
      }
      return g;
    })();

    for (const id of targets) {
      const inv = invested.result!.stateResults.find((s) => s.stateId === id)!;
      const neu = neutral.result!.stateResults.find((s) => s.stateId === id)!;
      expect(inv.bidenShare).toBeGreaterThan(neu.bidenShare);
    }
  });

  it("answering a debate for Biden shifts the targeted blocs in his favor", () => {
    const game = beginGame(createGame({ seed: "debate-test", playerCandidate: "biden", totalTurns: 9 }));
    // Fast-forward to the first debate (turn 4).
    let g = game;
    while (g.turn < 4 && g.phase !== "result") g = advanceTurn(g, [], "ff");
    const before = projectElection(g).contests.find((c) => c.stateId === "PA")!.bidenShare;
    const pending = g.pendingEvents.find((p) => p.eventId === "debate_1" && p.forCandidate === "biden");
    expect(pending).toBeDefined();
    const res = resolveEvent(g, "debate_1", "calm_presidential", "biden");
    expect(res).not.toBeNull();
    const after = computeResult(g).stateResults.find((s) => s.stateId === "PA")!.bidenShare;
    expect(after).toBeGreaterThan(before);
  });

  it("AI opponent contests close states (Trump gains somewhere vs a passive baseline)", () => {
    // Player is Biden and does nothing; the Trump AI should be working the map,
    // so at least one battleground ends redder than the neutral result.
    const neutral = computeResult(createGame({ seed: "ai-x" }));
    const withAi = playToEnd(createGame({ seed: "ai-x", playerCandidate: "biden" }), () => []);
    const bgs = ["GA", "AZ", "WI", "PA", "NV", "NC", "FL"];
    const someRedder = bgs.some((id) => {
      const a = withAi.result!.stateResults.find((s) => s.stateId === id)!;
      const n = neutral.stateResults.find((s) => s.stateId === id)!;
      return a.bidenShare < n.bidenShare - 0.001;
    });
    expect(someRedder).toBe(true);
  });
});
