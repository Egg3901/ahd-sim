import { describe, it, expect } from "vitest";
import { createGame } from "../setup";
import { advanceTurn, beginGame } from "../turn";
import { scheduledTurnMap } from "../events";
import { HISTORICAL_EVENTS } from "@content/events";
import type { GameState } from "../types";

const SCENARIO = "2020";
const deck = HISTORICAL_EVENTS[SCENARIO];
const scheduledIds = deck
  .filter((e) => e.trigger.kind === "scheduled")
  .map((e) => e.id);

// Plays a full game and records, per turn, which scheduled events first appear
// as pending. Auto-resolve is left off so every queued beat is observable, then
// we clear pending each turn to catch the next batch cleanly.
function firedSchedule(totalTurns: number): Array<{ turn: number; eventId: string }> {
  let g: GameState = beginGame(
    createGame({ scenario: SCENARIO, eventMode: "historical", seed: "pace", totalTurns }),
  );
  const fired: Array<{ turn: number; eventId: string }> = [];
  const seen = new Set<string>();
  while (g.phase !== "result") {
    for (const p of g.pendingEvents) {
      if (scheduledIds.includes(p.eventId) && !seen.has(p.eventId)) {
        seen.add(p.eventId);
        fired.push({ turn: g.turn, eventId: p.eventId });
      }
    }
    g = advanceTurn(g, [], "ff", { autoResolvePlayerEvents: true });
  }
  // Final turn's queue.
  for (const p of g.pendingEvents) {
    if (scheduledIds.includes(p.eventId) && !seen.has(p.eventId)) {
      seen.add(p.eventId);
      fired.push({ turn: g.turn, eventId: p.eventId });
    }
  }
  return fired;
}

// Reference for the pre-mapping behaviour: authored turn N fires on turn N, with
// the turn-0 beat surfaced on week 1 (the opening week is modal-free).
function legacySchedule(): Array<{ turn: number; eventId: string }> {
  return deck
    .filter((e) => e.trigger.kind === "scheduled")
    .map((e) => {
      const n = (e.trigger as { turn: number }).turn;
      return { turn: n === 0 ? 1 : n, eventId: e.id };
    })
    .sort((a, b) => a.turn - b.turn || scheduledIds.indexOf(a.eventId) - scheduledIds.indexOf(b.eventId));
}

describe("scheduled event pacing", () => {
  it("9-week game is bit-identical to the pre-mapping schedule (mapping is a no-op)", () => {
    const map = scheduledTurnMap(deck, 9);
    // Identity mapping.
    for (const e of deck) {
      if (e.trigger.kind === "scheduled") {
        expect(map.get(e.id)).toBe((e.trigger as { turn: number }).turn);
      }
    }
    const got = firedSchedule(9).sort(
      (a, b) => a.turn - b.turn || scheduledIds.indexOf(a.eventId) - scheduledIds.indexOf(b.eventId),
    );
    expect(got).toEqual(legacySchedule());
  });

  it("5-week game fires every scheduled beat (none dropped), order preserved", () => {
    const fired = firedSchedule(5);
    // No beat silently dropped.
    expect(new Set(fired.map((f) => f.eventId))).toEqual(new Set(scheduledIds));
    // All within the shortened campaign.
    expect(Math.max(...fired.map((f) => f.turn))).toBeLessThanOrEqual(4);
    // Calendar order preserved: turns are non-decreasing in authored order.
    const orderedTurns = scheduledIds.map((id) => fired.find((f) => f.eventId === id)!.turn);
    for (let i = 1; i < orderedTurns.length; i++) {
      expect(orderedTurns[i]).toBeGreaterThanOrEqual(orderedTurns[i - 1]);
    }
  });

  it("14-week game spreads beats across the campaign (uses the back half)", () => {
    const fired = firedSchedule(14);
    expect(new Set(fired.map((f) => f.eventId))).toEqual(new Set(scheduledIds));
    // The old deck topped out at turn 7; the stretched campaign pushes beats past it.
    expect(Math.max(...fired.map((f) => f.turn))).toBeGreaterThan(7);
    expect(Math.max(...fired.map((f) => f.turn))).toBeLessThanOrEqual(13);
  });

  it("collisions resolve to consecutive free turns, not drops", () => {
    // 5-week squeeze: authored turns 0..7 -> 5 slots. Every beat still lands and
    // no two share a turn unless the campaign genuinely runs out of room.
    const map = scheduledTurnMap(deck, 5);
    const turns = [...map.values()].sort((a, b) => a - b);
    expect(map.size).toBe(scheduledIds.length);
    expect(Math.min(...turns)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...turns)).toBeLessThanOrEqual(4);
  });
});
