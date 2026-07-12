// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "../settingsStore";

const reset = () =>
  useSettingsStore.setState({ soundOn: true, volume: 0.6, reducedMotion: false, hotkeysOn: true });

describe("settingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    reset();
  });

  it("defaults to sound on, hotkeys on, motion normal", () => {
    const s = useSettingsStore.getState();
    expect(s.soundOn).toBe(true);
    expect(s.hotkeysOn).toBe(true);
    expect(s.reducedMotion).toBe(false);
    expect(s.volume).toBeCloseTo(0.6);
  });

  it("toggles sound on and off", () => {
    useSettingsStore.getState().toggleSound();
    expect(useSettingsStore.getState().soundOn).toBe(false);
    useSettingsStore.getState().toggleSound();
    expect(useSettingsStore.getState().soundOn).toBe(true);
  });

  it("clamps volume to the 0..1 range", () => {
    useSettingsStore.getState().setVolume(5);
    expect(useSettingsStore.getState().volume).toBe(1);
    useSettingsStore.getState().setVolume(-2);
    expect(useSettingsStore.getState().volume).toBe(0);
  });

  it("sets reduced motion and hotkeys independently", () => {
    useSettingsStore.getState().setReducedMotion(true);
    useSettingsStore.getState().setHotkeysOn(false);
    const s = useSettingsStore.getState();
    expect(s.reducedMotion).toBe(true);
    expect(s.hotkeysOn).toBe(false);
    expect(s.soundOn).toBe(true); // unaffected
  });

  it("persists settings to localStorage", () => {
    useSettingsStore.getState().setSoundOn(false);
    const raw = localStorage.getItem("campaign-settings");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.soundOn).toBe(false);
  });
});
