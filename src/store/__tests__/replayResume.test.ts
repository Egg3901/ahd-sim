// Proves the resume path re-hydrates the replay log: saving a game persists
// the log alongside it, and loading it back (after the in-memory store is
// cleared, simulating a page reload) restores a log consistent with the
// loaded game's turn. Also proves a save with no log (an old save from
// before the replay log existed) degrades gracefully instead of crashing.
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../gameStore";
import { localProvider } from "@persistence/local";
import { EVENTS_BY_ID } from "@content/events";
import { deriveReport, truncateToTurn } from "@lib/replay";

const reset = () =>
  useGameStore.setState({ game: null, history: [], replay: null, saves: [], lastEventResult: null });

function clearPlayerEvents() {
  const { game, resolvePlayerEvent } = useGameStore.getState();
  if (!game) return;
  const pending = game.pendingEvents.filter((p) => p.forCandidate === game.playerCandidate);
  for (const p of pending) {
    const ev = EVENTS_BY_ID[p.eventId];
    resolvePlayerEvent(p.eventId, ev.choices[0].id);
  }
}

describe("replay resume (load path)", () => {
  beforeEach(reset);

  it("hydrates the replay log when a save is loaded", async () => {
    useGameStore.getState().newGame({ seed: "resume-basic", playerCandidate: "dem" });
    clearPlayerEvents();
    useGameStore.getState().queueAction({ type: "rally", candidate: "dem", stateId: "PA", day: 1 });
    useGameStore.getState().endTurn();
    const turnBeforeSave = useGameStore.getState().game!.turn;
    const snapshotCountBeforeSave = useGameStore.getState().replay!.snapshots.length;

    await useGameStore.getState().saveGame("Resume test");
    const saves = await localProvider.list();
    const saveId = saves[0].id;

    // Simulate a reload: wipe the in-memory store entirely.
    reset();
    expect(useGameStore.getState().replay).toBeNull();

    await useGameStore.getState().loadGame(saveId);
    const state = useGameStore.getState();
    expect(state.game).toBeTruthy();
    expect(state.game!.turn).toBe(turnBeforeSave);
    expect(state.replay).toBeTruthy();
    expect(state.replay!.snapshots.length).toBe(snapshotCountBeforeSave);
    // Consistent with the loaded turn: never shows a week ahead of the game.
    expect(state.replay!.snapshots.every((s) => s.turn <= state.game!.turn)).toBe(true);

    const report = deriveReport(state.replay);
    expect(report.hasData).toBe(true);
  });

  it("truncates a log that is ahead of the loaded game's turn", async () => {
    useGameStore.getState().newGame({ seed: "resume-ahead", playerCandidate: "dem" });
    clearPlayerEvents();
    useGameStore.getState().endTurn();
    await useGameStore.getState().saveGame("Ahead test");
    const saves = await localProvider.list();
    const saveId = saves[0].id;

    // Simulate the log having gotten ahead of the saved game state (should
    // not normally happen, but the load path should be defensive about it).
    const rec = await localProvider.loadReplay(saveId);
    const inflatedLog = { ...rec!.log, snapshots: [...rec!.log.snapshots] };
    inflatedLog.snapshots.push({ ...inflatedLog.snapshots[inflatedLog.snapshots.length - 1], turn: 99 });
    await localProvider.saveReplay({ id: saveId, updatedAt: Date.now(), log: inflatedLog });

    reset();
    await useGameStore.getState().loadGame(saveId);
    const state = useGameStore.getState();
    const expected = truncateToTurn(inflatedLog, state.game!.turn);
    expect(state.replay!.snapshots.map((s) => s.turn)).toEqual(expected.snapshots.map((s) => s.turn));
    expect(state.replay!.snapshots.every((s) => s.turn <= state.game!.turn)).toBe(true);
  });

  it("seeds a fresh log and still renders a report when a save has no log", async () => {
    useGameStore.getState().newGame({ seed: "resume-nolog", playerCandidate: "dem" });
    clearPlayerEvents();
    useGameStore.getState().endTurn();
    useGameStore.getState().endTurn();
    await useGameStore.getState().saveGame("No-log test");
    const saves = await localProvider.list();
    const saveId = saves[0].id;

    // Simulate an old save that predates the replay log: drop its row.
    await localProvider.removeReplay(saveId);

    reset();
    await expect(useGameStore.getState().loadGame(saveId)).resolves.not.toThrow();
    const state = useGameStore.getState();
    expect(state.game).toBeTruthy();
    expect(state.replay).toBeTruthy();
    // Fresh log seeded at the loaded turn, not a crash and not stale history.
    expect(state.replay!.snapshots.length).toBeGreaterThanOrEqual(1);
    expect(state.replay!.snapshots.every((s) => s.turn <= state.game!.turn)).toBe(true);

    const report = deriveReport(state.replay);
    expect(report.hasData).toBe(true);
  });

  it("seeds a fresh log on import (no log travels with exported JSON)", () => {
    useGameStore.getState().newGame({ seed: "resume-import", playerCandidate: "dem" });
    clearPlayerEvents();
    useGameStore.getState().endTurn();
    const json = useGameStore.getState().exportSave()!;

    reset();
    useGameStore.getState().importSave(json);
    const state = useGameStore.getState();
    expect(state.replay).toBeTruthy();
    const report = deriveReport(state.replay);
    expect(report.hasData).toBe(true);
  });
});
