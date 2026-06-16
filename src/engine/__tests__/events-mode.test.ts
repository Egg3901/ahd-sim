import { describe, it, expect } from "vitest";
import { createGame } from "../setup";
import { advanceTurn, beginGame } from "../turn";
import { choiceAvailable } from "../events";
import { EVENTS_BY_ID } from "@content/events";
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
    expect(g.pendingEvents.map((p) => p.eventId)).toContain("h20_debate1");
  });

  it("asymmetric events offer each ticket its own non-overlapping choices", () => {
    const game = createGame({ scenario: "2020" });
    const ev = EVENTS_BY_ID["h20_unrest"];
    const dem = ev.choices.filter((c) => choiceAvailable(game, "dem", c)).map((c) => c.id);
    const rep = ev.choices.filter((c) => choiceAvailable(game, "rep", c)).map((c) => c.id);
    expect(dem).toEqual(["d_tightrope", "d_justice"]);
    expect(rep).toEqual(["r_lawandorder", "r_calm"]);
    expect(dem.some((c) => rep.includes(c))).toBe(false); // the two sides never share an option
  });

  it("a symmetric event (debate) has no side-tagged choices", () => {
    // Both tickets face the same debate options (trait gates aside).
    expect(EVENTS_BY_ID["h20_debate1"].choices.every((c) => !c.side)).toBe(true);
  });
});
