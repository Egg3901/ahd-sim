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
import { localProvider } from "@persistence/local";
import type { SaveMeta, SaveRecord } from "@persistence/types";

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
  difficulty: "normal",
  selectedStateId: null,
  lastEventResult: null,
  lastDebate: null,
  saves: [],

  newGame: (opts) => {
    const difficulty = opts.difficulty ?? "normal";
    const fresh = beginGame(createGame(opts));
    autosave(fresh);
    set({
      game: fresh,
      history: [],
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
    autosave(next);
    set({ game: next, history, lastEventResult: null, lastDebate: null });
  },

  undo: () => {
    const history = [...get().history];
    const prev = history.pop();
    if (!prev) return;
    set({ game: prev, history });
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
    await get().refreshSaves();
  },

  loadGame: async (id) => {
    const record = await localProvider.load(id);
    if (!record) return;
    set({ game: record.state, history: [], lastEventResult: null });
  },

  deleteSave: async (id) => {
    await localProvider.remove(id);
    await get().refreshSaves();
  },

  exportSave: () => {
    const game = get().game;
    if (!game) return null;
    return JSON.stringify(game, null, 2);
  },

  importSave: (json) => {
    try {
      const state = JSON.parse(json) as GameState;
      if (!state.states || !state.candidates) throw new Error("Invalid save");
      set({ game: state, history: [], lastEventResult: null });
    } catch (e) {
      console.error("Import failed", e);
      throw e;
    }
  },
}));

export type { CandidateId };
