import { describe, it, expect } from "vitest";
import {
  appendSnapshot,
  createReplayLog,
  deriveReport,
  truncateToTurn,
  type ReplayLog,
  type ReplaySnapshot,
} from "../replay";

function snap(turn: number, demPoll: number, demEV: number, over: Partial<ReplaySnapshot> = {}): ReplaySnapshot {
  return {
    turn,
    leaderId: demEV >= 538 - demEV ? "dem" : "rep",
    standings: [
      { id: "dem", poll: demPoll, units: demEV },
      { id: "rep", poll: 1 - demPoll, units: 538 - demEV },
    ],
    tossupUnits: 0,
    playerCash: 100_000_000 - turn * 10_000_000,
    contestShare: { PA: demPoll, GA: demPoll - 0.02, FL: demPoll + 0.03 },
    actions: [],
    events: [],
    ...over,
  };
}

function baseLog(): ReplayLog {
  return createReplayLog({
    engine: "us",
    scenarioId: "2020",
    playerId: "dem",
    unitLabel: "electoral votes",
    unitTotal: 538,
    majority: 270,
    totalTurns: 3,
    mode: "casual",
    parties: [
      { id: "dem", name: "Biden", color: "#00f" },
      { id: "rep", name: "Trump", color: "#f00" },
    ],
    contestNames: { PA: "Pennsylvania", GA: "Georgia", FL: "Florida" },
  });
}

describe("replay log bookkeeping", () => {
  it("appends snapshots and dedupes on replayed turns", () => {
    let log = baseLog();
    log = appendSnapshot(log, snap(0, 0.5, 240));
    log = appendSnapshot(log, snap(1, 0.51, 260));
    // Replaying turn 1 overwrites rather than duplicating.
    log = appendSnapshot(log, snap(1, 0.53, 300));
    expect(log.snapshots.map((s) => s.turn)).toEqual([0, 1]);
    expect(log.snapshots[1].standings[0].units).toBe(300);
  });

  it("truncates to a turn to stay in step with undo", () => {
    let log = baseLog();
    for (let t = 0; t <= 3; t++) log = appendSnapshot(log, snap(t, 0.5 + t * 0.01, 240 + t * 10));
    const back = truncateToTurn(log, 1);
    expect(back.snapshots.map((s) => s.turn)).toEqual([0, 1]);
  });
});

describe("deriveReport", () => {
  it("returns an empty, safe report for a null or empty log", () => {
    expect(deriveReport(null).hasData).toBe(false);
    expect(deriveReport(baseLog()).hasData).toBe(false);
  });

  it("derives trends, swing, flips, decisive contests and tallies", () => {
    let log = baseLog();
    // Dem starts behind (poll .48, 250 EV), pulls ahead by eve (poll .54, 300 EV),
    // so the unit lead flips once toward the player.
    log = appendSnapshot(log, snap(0, 0.48, 250, { actions: ["Held a rally in PA"] }));
    log = appendSnapshot(log, snap(1, 0.5, 268, {
      actions: ["Ran ads in GA", "Held a rally in PA"],
      events: ["Debate: First Debate (a win)"],
    }));
    log = appendSnapshot(log, snap(2, 0.54, 300, { actions: ["Ran ads in GA"] }));

    const r = deriveReport(log);
    expect(r.hasData).toBe(true);
    expect(r.playerName).toBe("Biden");
    expect(r.topRivalName).toBe("Trump");

    // Margin trend goes from negative to positive; swing is positive.
    expect(r.startMarginPts).toBeLessThan(0);
    expect(r.finalMarginPts).toBeGreaterThan(0);
    expect(r.swingPts).toBeCloseTo(r.finalMarginPts - r.startMarginPts, 5);

    // Units: peak/floor across the three snapshots.
    expect(r.peakUnits).toBe(300);
    expect(r.floorUnits).toBe(250);

    // Exactly one lead flip, in the player's favor.
    expect(r.flips.length).toBe(1);
    expect(r.flips[0].toPlayer).toBe(true);

    // Decisive contests read from the final snapshot, closest first.
    expect(r.decisiveContests[0].name).toBeDefined();
    const ga = r.decisiveContests.find((c) => c.id === "GA")!;
    expect(ga.won).toBe(ga.finalPlayerShare >= 0.5);

    // Cash spent = start minus end (each recorded snapshot drops cash).
    expect(r.cashSpent).toBeGreaterThan(0);

    // Action tally aggregates repeated actions across weeks.
    const rally = r.actionTally.find((a) => a.label === "Held a rally in PA")!;
    expect(rally.count).toBe(2);

    // Debate surfaces in the events list.
    expect(r.events.some((e) => e.text.startsWith("Debate:"))).toBe(true);
  });

  it("names the strongest rival in a multiparty field", () => {
    const log = createReplayLog({
      engine: "uk",
      scenarioId: "2019",
      playerId: "lab",
      unitLabel: "seats",
      unitTotal: 650,
      majority: 326,
      totalTurns: 1,
      mode: "casual",
      parties: [
        { id: "lab", name: "Labour", color: "#e00" },
        { id: "con", name: "Conservatives", color: "#00e" },
        { id: "ld", name: "Lib Dems", color: "#fa0" },
      ],
      contestNames: { SE: "South East" },
      snapshots: [
        {
          turn: 0,
          leaderId: "con",
          standings: [
            { id: "lab", poll: 0.32, units: 200 },
            { id: "con", poll: 0.43, units: 360 },
            { id: "ld", poll: 0.11, units: 15 },
          ],
          tossupUnits: 0,
          contestShare: { SE: 0.3 },
          actions: [],
          events: [],
        },
      ],
    });
    const r = deriveReport(log);
    expect(r.topRivalId).toBe("con");
    expect(r.unitLabel).toBe("seats");
  });
});
