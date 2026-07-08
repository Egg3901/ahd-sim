import { create } from "zustand";
import {
  createUkGame,
  ukAdvanceTurn,
  projectUk,
  projectUkPreview,
  resolveUkPlayerEvent,
  UK_PLAYABLE,
  type UkGameState,
  type UkAction,
  type UkResult,
  type Difficulty,
} from "@engine/ukGame";
import type { PartyId } from "@engine/system";

interface UkStore {
  game: UkGameState | null;
  history: UkGameState[]; // undo ring
  selectedRegionId: string | null;
  lastEventResult: { title: string; text: string } | null;

  newGame: (election: string, party: PartyId, seed?: string, difficulty?: Difficulty) => void;
  reset: () => void;
  selectRegion: (id: string | null) => void;

  queueAction: (a: UkAction) => void;
  removeAction: (index: number) => void;
  clearActions: () => void;

  resolvePlayerEvent: (choiceId: string) => void;
  endTurn: () => void;
  undo: () => void;

  liveProjection: () => UkResult | null;
  previewProjection: () => UkResult | null;

  tryResumeAutosave: () => boolean;
}

const MAX_HISTORY = 12;
const AUTOSAVE_KEY = "campaign-uk-autosave";

function autosave(game: UkGameState) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ updatedAt: Date.now(), state: game }));
  } catch {
    /* private mode etc. */
  }
}

function loadAutosave(): UkGameState | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: UkGameState };
    if (!parsed.state?.regions || !parsed.state.playerParty) return null;
    // Backfill fields added after older saves.
    if (!parsed.state.lastRecap) parsed.state.lastRecap = [];
    return parsed.state;
  } catch {
    return null;
  }
}

export const useUkStore = create<UkStore>((set, get) => ({
  game: null,
  history: [],
  selectedRegionId: null,
  lastEventResult: null,

  newGame: (election, party, seed, difficulty) => {
    const p = UK_PLAYABLE.includes(party) ? party : "lab";
    const game = createUkGame({ election, playerParty: p, seed: seed ?? `uk-${Date.now()}`, difficulty });
    autosave(game);
    set({
      game,
      history: [],
      selectedRegionId: null,
      lastEventResult: null,
    });
  },

  reset: () => {
    try { localStorage.removeItem(AUTOSAVE_KEY); } catch { /* */ }
    set({ game: null, history: [], selectedRegionId: null, lastEventResult: null });
  },

  selectRegion: (id) => set({ selectedRegionId: id }),

  queueAction: (a) => {
    const game = get().game;
    if (!game) return;
    const res = game.resources[game.playerParty];
    if (game.queuedActions.length >= res.maxActions) return;
    set({ game: { ...game, queuedActions: [...game.queuedActions, a] } });
  },

  removeAction: (index) => {
    const game = get().game;
    if (!game) return;
    set({ game: { ...game, queuedActions: game.queuedActions.filter((_, i) => i !== index) } });
  },

  clearActions: () => {
    const game = get().game;
    if (!game) return;
    set({ game: { ...game, queuedActions: [] } });
  },

  resolvePlayerEvent: (choiceId) => {
    const game = get().game;
    if (!game?.pendingEvent) return;
    const next = resolveUkPlayerEvent(game, choiceId);
    autosave(next);
    set({
      game: next,
      lastEventResult: next.lastRecap[0]
        ? { title: next.lastRecap[0].label, text: next.lastRecap[0].detail }
        : null,
    });
  },

  endTurn: () => {
    const { game, history } = get();
    if (!game || game.pendingEvent) return;
    const next = ukAdvanceTurn(game);
    autosave(next);
    set({
      game: next,
      history: [...history, game].slice(-MAX_HISTORY),
      selectedRegionId: null,
      lastEventResult: null,
    });
  },

  undo: () => {
    const { history } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    autosave(prev);
    set({ game: prev, history: history.slice(0, -1) });
  },

  liveProjection: () => {
    const game = get().game;
    return game ? projectUk(game) : null;
  },

  previewProjection: () => {
    const game = get().game;
    return game ? projectUkPreview(game) : null;
  },

  tryResumeAutosave: () => {
    const saved = loadAutosave();
    if (!saved || saved.phase === "result") return false;
    set({ game: saved, history: [], selectedRegionId: null, lastEventResult: null });
    return true;
  },
}));
