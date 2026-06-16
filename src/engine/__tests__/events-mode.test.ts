import { describe, it, expect } from "vitest";
import { createGame } from "../setup";
import { advanceTurn, beginGame } from "../turn";
import type { GameState } from "../types";

// Advance to a target turn without auto-resolving the player's events, so we can
// inspect exactly what each turn queues.
function advanceTo(start: GameState, turn: number): GameState {
  let g = start;
  while (g.turn < turn && g.phase !== "result") {
    g = advanceTurn(g, [], "ff", { autoResolvePlayerEvents: false });
  }
  return g;
}

describe("event modes", () => {
  it("historical mode fires the scenario's scripted beats (2016 debate at turn 2)", () => {
    const g = advanceTo(beginGame(createGame({ scenario: "2016", eventMode: "historical", seed: "h16" })), 2);
    expect(g.pendingEvents.map((p) => p.eventId)).toContain("h16_debate1");
  });

  it("plausible mode never fires scenario-specific historical beats", () => {
    let g = beginGame(createGame({ scenario: "2016", eventMode: "plausible", seed: "p16" }));
    const seen = new Set<string>();
    while (g.turn < 8 && g.phase !== "result") {
      g.pendingEvents.forEach((p) => seen.add(p.eventId));
      g = advanceTurn(g, [], "ff", { autoResolvePlayerEvents: false });
    }
    g.pendingEvents.forEach((p) => seen.add(p.eventId));
    expect([...seen].some((id) => id.startsWith("h16_"))).toBe(false);
  });

  it("default (no eventMode) is historical 2020 — the original beats still fire", () => {
    const g = advanceTo(beginGame(createGame({ scenario: "2020", seed: "d" })), 4);
    expect(g.pendingEvents.map((p) => p.eventId)).toContain("debate_1");
  });
});
