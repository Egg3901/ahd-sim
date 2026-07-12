import { create } from "zustand";
import {
  createGame,
  beginGame,
  advanceTurn,
  resolveEvent,
  resolveDebate,
  applyAction,
  projectElection,
  createRng,
  DIFFICULTY,
  type GameState,
  type CampaignAction,
  type DebateResult,
  type NewGameOptions,
  type Projection,
  type CandidateId,
} from "@engine/index";
import { EVENTS_BY_ID } from "@content/events";
import { STAFF_BY_ID, staffEffects } from "@content/staff";
import { localProvider } from "@persistence/local";
import type { SaveMeta, SaveRecord } from "@persistence/types";
import type { ReplayLog, ReplayMode } from "@lib/replay";
import { truncateToTurn } from "@lib/replay";
import { initUsReplayLog, recordUsWeek } from "./usReplay";

const AUTOSAVE_ID = "autosave";
const UNDO_DEPTH = 12;

export type Difficulty = "easy" | "normal" | "hard";

interface EventResult {
  title: string;
  text: string;
}

interface GameStore {
  game: GameState | null;
  history: GameState[]; // snapshot ring buffer (undo)
  replay: ReplayLog | null; // compact per-turn timeline/replay log
  difficulty: Difficulty;
  selectedStateId: string | null;
  lastEventResult: EventResult | null;
  lastDebate: DebateResult | null;
  saves: SaveMeta[];

  newGame: (opts: NewGameOptions & { difficulty?: Difficulty }) => void;
  selectState: (id: string | null) => void;
  setDifficulty: (d: Difficulty) => void;

  queueAction: (action: CampaignAction) => void;
  removeQueuedAction: (index: number) => void;
  clearQueue: () => void;

  resolvePlayerEvent: (eventId: string, choiceId: string) => void;
  dismissDebate: () => void;
  endTurn: () => void;
  undo: () => void;

  // Projection of the map *if the queued actions were resolved now* (preview).
  previewProjection: () => Projection | null;
  liveProjection: () => Projection | null;

  refreshSaves: () => Promise<void>;
  saveGame: (name: string) => Promise<void>;
  loadGame: (id: string) => Promise<void>;
  deleteSave: (id: string) => Promise<void>;
  exportSave: () => string | null;
  importSave: (json: string) => void;
}

function autosave(game: GameState) {
  const record: SaveRecord = {
    id: AUTOSAVE_ID,
    name: "Autosave",
    updatedAt: Date.now(),
    turn: game.turn,
    playerCandidate: game.playerCandidate,
    state: game,
  };
  // Fire-and-forget; persistence failures never block gameplay.
  void localProvider.save(record).catch(() => {});
}

// Persist the replay log next to the autosave so a resumed game (or a results
// screen reached after reload) still has its full timeline. Fire-and-forget.
function autosaveReplay(log: ReplayLog | null) {
  if (!log) return;
  void localProvider
    .saveReplay({ id: AUTOSAVE_ID, updatedAt: Date.now(), log })
    .catch(() => {});
}

// Bring a loaded replay log back in step with the game it belongs to. Two
// cases:
//   - No log at all (an old save from before the replay log existed, or a
//     save/import path that does not carry one). Start a brand new log seeded
//     from the game's current turn, so the Timeline and post-game WhyReport
//     have something to show from this point forward instead of crashing on
//     a null log. We default to "casual" mode here: GameState does not carry
//     a "this was a daily challenge" flag, and a reseeded log for an old save
//     is the rare case, so showing the (otherwise-gated) scrubber is a safe
//     degrade rather than a real leak.
//   - A log whose last snapshot is ahead of the loaded game's turn (should not
//     normally happen, but can if a save and its log fall out of sync).
//     Truncate it back so the timeline never shows a turn the loaded game
//     has not reached yet.
function resumeReplayLog(game: GameState, log: ReplayLog | null): ReplayLog {
  if (!log) return initUsReplayLog(game, "casual");
  const aheadOfGame = log.snapshots.some((s) => s.turn > game.turn);
  return aheadOfGame ? truncateToTurn(log, game.turn) : log;
}

// Applies the queued player actions to a throwaway clone so the UI can preview
// the resulting map without committing the turn.
function projectWithQueue(game: GameState): Projection {
  const clone: GameState = structuredClone(game);
  const rng = createRng(`preview:${game.seed}:${game.turn}`);
  for (const action of clone.queuedActions) {
    if (action.candidate !== clone.playerCandidate) continue;
    applyAction(clone, action, rng);
  }
  return projectElection(clone);
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  history: [],
  replay: null,
  difficulty: "normal",
  selectedStateId: null,
  lastEventResult: null,
  lastDebate: null,
  saves: [],

  newGame: (opts) => {
    const difficulty = opts.difficulty ?? "normal";
    // Daily-challenge games are gated: the live scrubber is hidden mid-game so
    // it can't be used to scout the shared board. The daily seed is the string
    // "daily-<date>" before it is hashed into GameState.seed.
    const mode: ReplayMode =
      typeof opts.seed === "string" && opts.seed.startsWith("daily") ? "daily" : "casual";
    // The Daily Challenge is the same race for everyone, scored and compared
    // head to head, so its length can't be a player choice: always the
    // standard 9-week campaign, no matter what a casual game's setup screen
    // passed through.
    const fresh = beginGame(createGame(mode === "daily" ? { ...opts, totalTurns: 9 } : opts));
    const replay = initUsReplayLog(fresh, mode);
    autosave(fresh);
    autosaveReplay(replay);
    set({
      game: fresh,
      history: [],
      replay,
      difficulty,
      selectedStateId: null,
      lastEventResult: null,
      lastDebate: null,
    });
  },

  selectState: (id) => set({ selectedStateId: id }),
  setDifficulty: (d) => set({ difficulty: d }),

  queueAction: (action) => {
    const game = get().game;
    if (!game) return;
    const next = structuredClone(game);
    next.queuedActions.push(action);
    set({ game: next });
  },

  removeQueuedAction: (index) => {
    const game = get().game;
    if (!game) return;
    const next = structuredClone(game);
    next.queuedActions.splice(index, 1);
    set({ game: next });
  },

  clearQueue: () => {
    const game = get().game;
    if (!game) return;
    const next = structuredClone(game);
    next.queuedActions = [];
    set({ game: next });
  },

  resolvePlayerEvent: (eventId, choiceId) => {
    const game = get().game;
    if (!game) return;
    const next = structuredClone(game);
    const event = EVENTS_BY_ID[eventId];
    if (event?.isDebate) {
      // Debate night: resolve both tickets at once, score it, surface the card.
      const debate = resolveDebate(next, event, { [next.playerCandidate]: choiceId });
      set({
        game: next,
        lastDebate: debate,
        lastEventResult: { title: event.title, text: debate.resultText[next.playerCandidate] },
      });
      return;
    }
    const result = resolveEvent(next, eventId, choiceId, next.playerCandidate);
    set({
      game: next,
      lastEventResult: result
        ? { title: eventId, text: result.resultText }
        : get().lastEventResult,
    });
  },
  dismissDebate: () => set({ lastDebate: null }),

  endTurn: () => {
    const game = get().game;
    if (!game || game.phase === "result") return;
    const history = [...get().history, game].slice(-UNDO_DEPTH);
    const next = advanceTurn(game, game.queuedActions, game.seed, {
      difficulty: DIFFICULTY[get().difficulty],
    });

    // ── Staff upkeep (store layer — the engine stays pure) ──
    // Weekly salaries come off the war chest; a staffer whose loyalty is thin
    // may walk when the map turns ugly.
    const player = next.playerCandidate;
    const hires = next.staff?.[player] ?? [];
    if (hires.length > 0 && next.phase !== "result") {
      const fx = staffEffects(next, player);
      next.resources[player].cash = Math.max(0, next.resources[player].cash - fx.salaryPerWeek);
      next.lastRecap.push({
        label: "Staff payroll",
        detail: hires.map((id) => STAFF_BY_ID[id]?.role ?? id).join(", "),
        marginDelta: undefined,
      });

      const proj = projectElection(next);
      const playerEV = player === "dem" ? proj.ev.dem : proj.ev.rep;
      if (playerEV < 195) {
        const remaining: string[] = [];
        for (const id of hires) {
          const def = STAFF_BY_ID[id];
      const quits = def && def.loyalty < 65 && createRng(`staff:${next.seed}:${next.turn}:${id}`).next() < 0.22;
          if (quits) {
            // Losing an action-granting staffer shrinks the weekly pool too.
            const slots = def.effects.maxActions ?? 0;
            next.resources[player].maxActions = Math.max(1, next.resources[player].maxActions - slots);
            next.resources[player].actions = Math.min(next.resources[player].actions, next.resources[player].maxActions);
            next.lastRecap.unshift({
              label: `${def.emoji} ${def.name} quits the campaign`,
              detail: `"${def.role}s don't go down with the ship." The polls looked terminal.`,
            });
          } else {
            remaining.push(id);
          }
        }
        next.staff = { ...next.staff, [player]: remaining };
      }
    }

    // Record the completed week into the compact replay log.
    const priorLog = get().replay;
    const replay = priorLog ? recordUsWeek(priorLog, game, next) : priorLog;

    autosave(next);
    autosaveReplay(replay);
    set({ game: next, history, replay, lastEventResult: null, lastDebate: null });
  },

  undo: () => {
    const history = [...get().history];
    const prev = history.pop();
    if (!prev) return;
    // Keep the replay log in step with the rewind so the timeline never shows a
    // week that has been undone.
    const priorLog = get().replay;
    const replay = priorLog ? truncateToTurn(priorLog, prev.turn) : priorLog;
    autosaveReplay(replay);
    set({ game: prev, history, replay });
  },

  previewProjection: () => {
    const game = get().game;
    if (!game) return null;
    return projectWithQueue(game);
  },

  liveProjection: () => {
    const game = get().game;
    if (!game) return null;
    return projectElection(game);
  },

  refreshSaves: async () => {
    const saves = await localProvider.list();
    set({ saves });
  },

  saveGame: async (name) => {
    const game = get().game;
    if (!game) return;
    const id = `save-${Date.now()}`;
    await localProvider.save({
      id,
      name,
      updatedAt: Date.now(),
      turn: game.turn,
      playerCandidate: game.playerCandidate,
      state: game,
    });
    const log = get().replay;
    if (log) await localProvider.saveReplay({ id, updatedAt: Date.now(), log }).catch(() => {});
    await get().refreshSaves();
  },

  loadGame: async (id) => {
    const record = await localProvider.load(id);
    if (!record) return;
    const replayRec = await localProvider.loadReplay(id).catch(() => null);
    const replay = resumeReplayLog(record.state, replayRec?.log ?? null);
    autosaveReplay(replay);
    set({ game: record.state, history: [], replay, lastEventResult: null });
  },

  deleteSave: async (id) => {
    await localProvider.remove(id);
    await get().refreshSaves();
  },

  exportSave: () => {
    // Decision: export the raw GameState only, not the replay log. The log is
    // cheap to persist but re-deriving it during play (recordUsWeek runs off
    // GameState.timeline anyway) is not something export/import needs to
    // preserve exactly, and skipping it keeps the exported JSON exactly what
    // it already was for every existing save file (no new version field to
    // carry, nothing to migrate). Import regenerates a fresh log from the
    // imported turn instead (see importSave / resumeReplayLog), which is the
    // simpler correct option and degrades gracefully (Timeline still renders,
    // just starting from the import point).
    const game = get().game;
    if (!game) return null;
    return JSON.stringify(game, null, 2);
  },

  importSave: (json) => {
    try {
      const state = JSON.parse(json) as GameState;
      if (!state.states || !state.candidates) throw new Error("Invalid save");
      // Exported saves are just the raw GameState JSON (see exportSave), so an
      // imported save never carries a replay log. Regenerating a fresh log
      // from the current turn is the simpler-and-correct option here (see
      // exportSave for why we did not also serialize the log): the Timeline
      // and WhyReport still render, just starting from the import point
      // rather than crashing or showing stale history.
      const replay = resumeReplayLog(state, null);
      set({ game: state, history: [], replay, lastEventResult: null });
    } catch (e) {
      console.error("Import failed", e);
      throw e;
    }
  },
}));

export type { CandidateId };
