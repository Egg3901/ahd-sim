// Proves the US store actually records a compact replay log as the game is
// played (Task A), and that the post-game report derives from it (Task B).
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../gameStore";
import { EVENTS_BY_ID } from "@content/events";
import { deriveReport } from "@lib/replay";

const reset = () =>
  useGameStore.setState({ game: null, history: [], replay: null, lastEventResult: null });

function clearPlayerEvents() {
  const { game, resolvePlayerEvent } = useGameStore.getState();
  if (!game) return;
  const pending = game.pendingEvents.filter((p) => p.forCandidate === game.playerCandidate);
  for (const p of pending) {
    const ev = EVENTS_BY_ID[p.eventId];
    resolvePlayerEvent(p.eventId, ev.choices[0].id);
  }
}

describe("replay log recording (store layer)", () => {
  beforeEach(reset);

  it("seeds a turn-0 baseline snapshot on new game", () => {
    useGameStore.getState().newGame({ seed: "replay-init", playerCandidate: "dem" });
    const log = useGameStore.getState().replay!;
    expect(log).toBeTruthy();
    expect(log.engine).toBe("us");
    expect(log.mode).toBe("casual");
    expect(log.snapshots).toHaveLength(1);
    expect(log.snapshots[0].turn).toBe(0);
    expect(log.snapshots[0].standings.map((s) => s.id).sort()).toEqual(["dem", "rep"]);
  });

  it("flags daily games so the live scrubber can be gated", () => {
    useGameStore.getState().newGame({ seed: "daily-2026-07-12", playerCandidate: "dem" });
    expect(useGameStore.getState().replay!.mode).toBe("daily");
  });

  it("appends one snapshot per played week, capturing the player's actions", () => {
    useGameStore.getState().newGame({ seed: "replay-week", playerCandidate: "dem" });
    clearPlayerEvents();
    useGameStore.getState().queueAction({ type: "rally", candidate: "dem", stateId: "PA", day: 1 });
    useGameStore.getState().endTurn();

    const log = useGameStore.getState().replay!;
    expect(log.snapshots.length).toBeGreaterThanOrEqual(2);
    const wk1 = log.snapshots.find((s) => s.turn === 1)!;
    expect(wk1.actions.some((a) => a.includes("PA"))).toBe(true);
    // Snapshots stay compact: numbers plus a few short strings, no GameState.
    expect(JSON.stringify(wk1).length).toBeLessThan(4000);
  });

  it("keeps the log in step with undo", () => {
    useGameStore.getState().newGame({ seed: "replay-undo", playerCandidate: "dem" });
    clearPlayerEvents();
    useGameStore.getState().endTurn();
    const afterTurn = useGameStore.getState().replay!.snapshots.length;
    useGameStore.getState().undo();
    const afterUndo = useGameStore.getState().replay!.snapshots.length;
    expect(afterUndo).toBe(afterTurn - 1);
  });

  it("produces a derivable report at the end of a full game", () => {
    useGameStore.getState().newGame({ seed: "replay-full", playerCandidate: "dem" });
    let guard = 0;
    while (useGameStore.getState().game!.phase !== "result" && guard++ < 40) {
      clearPlayerEvents();
      const s = useGameStore.getState();
      s.queueAction({ type: "rally", candidate: "dem", stateId: "GA", day: 1 });
      s.endTurn();
    }
    const log = useGameStore.getState().replay!;
    const report = deriveReport(log);
    expect(report.hasData).toBe(true);
    expect(report.unitLabel).toBe("electoral votes");
    expect(report.unitTrend.length).toBeGreaterThan(1);
    expect(report.decisiveContests.length).toBeGreaterThan(0);
    // Every recorded turn is unique and ordered.
    const turns = log.snapshots.map((s) => s.turn);
    expect(new Set(turns).size).toBe(turns.length);
  });
});
