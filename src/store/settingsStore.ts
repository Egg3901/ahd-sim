import { create } from "zustand";
import { persist } from "zustand/middleware";

// Player preferences. Deliberately separate from gameStore: these are
// device-level choices (sound, motion, hotkeys) that should survive across
// every game, save, and scenario, not travel with a campaign save.
export interface SettingsState {
  soundOn: boolean;
  volume: number; // 0..1
  reducedMotion: boolean;
  hotkeysOn: boolean;

  setSoundOn: (on: boolean) => void;
  setVolume: (v: number) => void;
  setReducedMotion: (on: boolean) => void;
  setHotkeysOn: (on: boolean) => void;
  toggleSound: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      soundOn: true,
      volume: 0.6,
      reducedMotion: false,
      hotkeysOn: true,

      setSoundOn: (on) => set({ soundOn: on }),
      setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)) }),
      setReducedMotion: (on) => set({ reducedMotion: on }),
      setHotkeysOn: (on) => set({ hotkeysOn: on }),
      toggleSound: () => set({ soundOn: !get().soundOn }),
    }),
    { name: "campaign-settings" },
  ),
);
