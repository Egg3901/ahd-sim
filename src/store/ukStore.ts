import { create } from "zustand";
import {
  createUkGame,
  ukAdvanceTurn,
  projectUk,
  projectUkPreview,
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

  newGame: (election: string, party: PartyId, seed?: string, difficulty?: Difficulty) => void;
  reset: () => void;
  selectRegion: (id: string | null) => void;

  queueAction: (a: UkAction) => void;
  removeAction: (index: number) => void;
  clearActions: () => void;

  endTurn: () => void;
  undo: () => void;

  liveProjection: () => UkResult | null;
  previewProjection: () => UkResult | null;
}

const MAX_HISTORY = 12;

export const useUkStore = create<UkStore>((set, get) => ({
  game: null,
  history: [],
  selectedRegionId: null,

  newGame: (election, party, seed, difficulty) => {
    const p = UK_PLAYABLE.includes(party) ? party : "lab";
    set({
      game: createUkGame({ election, playerParty: p, seed: seed ?? `uk-${Date.now()}`, difficulty }),
      history: [],
      selectedRegionId: null,
    });
  },

  reset: () => set({ game: null, history: [], selectedRegionId: null }),

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

  endTurn: () => {
    const { game, history } = get();
    if (!game) return;
    const next = ukAdvanceTurn(game);
    set({
      game: next,
      history: [...history, game].slice(-MAX_HISTORY),
      selectedRegionId: null,
    });
  },

  undo: () => {
    const { history } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
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
}));
