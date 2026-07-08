import { create } from "zustand";
import {
  createCountryGame,
  countryAdvanceTurn,
  projectCountry,
  projectCountryPreview,
  playablePartiesIn,
  type CountryBundle,
  type CountryGameState,
  type CountryAction,
  type CountryResult,
  type Difficulty,
} from "@engine/countryGame";
import { COUNTRIES } from "@content/countries";
import type { PartyId } from "@engine/system";

interface CountryStore {
  country: CountryBundle | null;
  game: CountryGameState | null;
  history: CountryGameState[];
  selectedRegionId: string | null;

  newGame: (countryId: string, election: string, party: PartyId, seed?: string, difficulty?: Difficulty) => void;
  reset: () => void;
  selectRegion: (id: string | null) => void;

  queueAction: (a: CountryAction) => void;
  removeAction: (index: number) => void;
  clearActions: () => void;

  endTurn: () => void;
  undo: () => void;

  liveProjection: () => CountryResult | null;
  previewProjection: () => CountryResult | null;
}

const MAX_HISTORY = 12;

export const useCountryStore = create<CountryStore>((set, get) => ({
  country: null,
  game: null,
  history: [],
  selectedRegionId: null,

  newGame: (countryId, election, party, seed, difficulty) => {
    const country = COUNTRIES[countryId];
    if (!country) return;
    const playable = playablePartiesIn(country, election);
    const p = playable.includes(party) ? party : playable[0];
    set({
      country,
      game: createCountryGame(country, { election, playerParty: p, seed: seed ?? `${countryId}-${Date.now()}`, difficulty }),
      history: [],
      selectedRegionId: null,
    });
  },

  reset: () => set({ country: null, game: null, history: [], selectedRegionId: null }),

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
    const { game, country, history } = get();
    if (!game || !country) return;
    const next = countryAdvanceTurn(game, country);
    set({
      game: next,
      history: [...history, game].slice(-MAX_HISTORY),
      selectedRegionId: null,
    });
  },

  undo: () => {
    const { history } = get();
    if (history.length === 0) return;
    set({ game: history[history.length - 1], history: history.slice(0, -1) });
  },

  liveProjection: () => {
    const { game, country } = get();
    return game && country ? projectCountry(game, country) : null;
  },

  previewProjection: () => {
    const { game, country } = get();
    return game && country ? projectCountryPreview(game, country) : null;
  },
}));
