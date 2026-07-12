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
    const game = beginGame(createGame({ seed: "determinism", playerCandidate: "dem" }));
    const a = advanceTurn(game, [], "s1");
    const b = advanceTurn(game, [], "s1");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    // The input is not mutated.
    expect(game.turn).toBe(0);
  });

  it("records a timeline point for the opening week and every advanced week", () => {
    const game = createGame({ seed: "timeline", playerCandidate: "dem" });
    const opened = beginGame(game);
    // beginGame seeds the turn-0 baseline.
    expect(opened.timeline).toHaveLength(1);
    expect(opened.timeline![0].turn).toBe(0);

    const end = playToEnd(game, () => []);
    // One baseline + one per played week (= totalTurns).
    expect(end.timeline!.length).toBe(end.totalTurns + 1);
    const last = end.timeline![end.timeline!.length - 1];
    expect(last.turn).toBe(end.totalTurns);
    expect(last.demEV + last.repEV + last.tossupEV).toBe(538);
    // Poll average is a probability share.
    for (const p of end.timeline!) expect(p.demPoll).toBeGreaterThan(0);
  });

  it("runs a full neutral campaign to a decided result", () => {
    const end = playToEnd(createGame({ seed: "neutral-run" }), () => []);
    expect(end.phase).toBe("result");
    expect(end.result).toBeDefined();
    const totalEv = end.result!.electoralVotes.dem + end.result!.electoralVotes.rep;
    expect(totalEv).toBe(538);
    expect(["dem", "rep", "tie"]).toContain(end.result!.winner);
  });

  it("runs a Short (5-week) campaign to a decided result", () => {
    const end = playToEnd(createGame({ seed: "short-run", totalTurns: 5 }), () => []);
    expect(end.phase).toBe("result");
    expect(end.turn).toBe(5);
    expect(end.result).toBeDefined();
    const totalEv = end.result!.electoralVotes.dem + end.result!.electoralVotes.rep;
    expect(totalEv).toBe(538);
    expect(["dem", "rep", "tie"]).toContain(end.result!.winner);
  });

  it("runs a Long (14-week) campaign to a decided result", () => {
    const end = playToEnd(createGame({ seed: "long-run", totalTurns: 14 }), () => []);
    expect(end.phase).toBe("result");
    expect(end.turn).toBe(14);
    expect(end.result).toBeDefined();
    const totalEv = end.result!.electoralVotes.dem + end.result!.electoralVotes.rep;
    expect(totalEv).toBe(538);
    expect(["dem", "rep", "tie"]).toContain(end.result!.winner);
  });

  it("heavy Biden ad+rally investment in tossups improves his margin there", () => {
    const base = beginGame(createGame({ seed: "invest", playerCandidate: "dem" }));
    const targets = ["GA", "AZ", "NC"];

    const neutral = playToEnd(createGame({ seed: "invest" }), () => []);
    const invested = (() => {
      let g = base;
      let guard = 0;
      while (g.phase !== "result" && guard++ < 50) {
        const actions: CampaignAction[] = targets.flatMap((id) => [
          { type: "advertise", candidate: "dem", stateId: id, adMode: "positive", spend: 12_000_000 },
          { type: "rally", candidate: "dem", stateId: id, days: 1 },
        ]);
        g = advanceTurn(g, actions, "test-seed");
      }
      return g;
    })();

    for (const id of targets) {
      const inv = invested.result!.stateResults.find((s) => s.stateId === id)!;
      const neu = neutral.result!.stateResults.find((s) => s.stateId === id)!;
      expect(inv.demShare).toBeGreaterThan(neu.demShare);
    }
  });

  it("answering a debate for Biden shifts the targeted blocs in his favor", () => {
    const game = beginGame(createGame({ seed: "debate-test", playerCandidate: "dem", totalTurns: 9 }));
    // Fast-forward to the first debate (turn 4).
    let g = game;
    while (g.turn < 4 && g.phase !== "result") g = advanceTurn(g, [], "ff");
    const before = projectElection(g).contests.find((c) => c.stateId === "PA")!.demShare;
    const pending = g.pendingEvents.find((p) => p.eventId === "h20_debate1" && p.forCandidate === "dem");
    expect(pending).toBeDefined();
    const res = resolveEvent(g, "h20_debate1", "calm_presidential", "dem");
    expect(res).not.toBeNull();
    const after = computeResult(g).stateResults.find((s) => s.stateId === "PA")!.demShare;
    expect(after).toBeGreaterThan(before);
  });

  it("AI opponent contests close states (Trump gains somewhere vs a passive baseline)", () => {
    // Player is Biden and does nothing; the Trump AI should be working the map,
    // so at least one battleground ends redder than the neutral result.
    const neutral = computeResult(createGame({ seed: "ai-x" }));
    const withAi = playToEnd(createGame({ seed: "ai-x", playerCandidate: "dem" }), () => []);
    const bgs = ["GA", "AZ", "WI", "PA", "NV", "NC", "FL"];
    const someRedder = bgs.some((id) => {
      const a = withAi.result!.stateResults.find((s) => s.stateId === id)!;
      const n = neutral.stateResults.find((s) => s.stateId === id)!;
      return a.demShare < n.demShare - 0.001;
    });
    expect(someRedder).toBe(true);
  });
});
