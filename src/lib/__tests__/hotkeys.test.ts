// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act, createElement } from "react";
import { useHotkeys, type HotkeyHandlers } from "../hotkeys";
import { useSettingsStore } from "@store/settingsStore";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function mountHotkeys(handlers: HotkeyHandlers): { root: Root; container: HTMLDivElement } {
  function Harness() {
    useHotkeys(handlers);
    return null;
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(createElement(Harness)); });
  return { root, container };
}

function press(key: string, target: EventTarget = window) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  act(() => { target.dispatchEvent(event); });
}

describe("useHotkeys", () => {
  beforeEach(() => {
    useSettingsStore.setState({ hotkeysOn: true, soundOn: true, volume: 0.6, reducedMotion: false });
    document.body.innerHTML = "";
  });

  it("fires onEndTurn on Enter and Space", () => {
    const onEndTurn = vi.fn();
    const { root, container } = mountHotkeys({ onEndTurn });
    press("Enter");
    press(" ");
    expect(onEndTurn).toHaveBeenCalledTimes(2);
    act(() => root.unmount());
    container.remove();
  });

  it("fires onEscape on Escape", () => {
    const onEscape = vi.fn();
    const { root, container } = mountHotkeys({ onEscape });
    press("Escape");
    expect(onEscape).toHaveBeenCalledTimes(1);
    act(() => root.unmount());
    container.remove();
  });

  it("fires onPickAction with a 0-based index for digits 1-9", () => {
    const onPickAction = vi.fn();
    const { root, container } = mountHotkeys({ onPickAction });
    press("3");
    expect(onPickAction).toHaveBeenCalledWith(2);
    act(() => root.unmount());
    container.remove();
  });

  it("fires onHelp on ?", () => {
    const onHelp = vi.fn();
    const { root, container } = mountHotkeys({ onHelp });
    press("?");
    expect(onHelp).toHaveBeenCalledTimes(1);
    act(() => root.unmount());
    container.remove();
  });

  it("never fires while typing in an input", () => {
    const onEndTurn = vi.fn();
    const { root, container } = mountHotkeys({ onEndTurn });
    const input = document.createElement("input");
    document.body.appendChild(input);
    press("Enter", input);
    expect(onEndTurn).not.toHaveBeenCalled();
    act(() => root.unmount());
    container.remove();
  });

  it("does nothing when the settings toggle is off", () => {
    useSettingsStore.setState({ hotkeysOn: false });
    const onEndTurn = vi.fn();
    const { root, container } = mountHotkeys({ onEndTurn });
    press("Enter");
    expect(onEndTurn).not.toHaveBeenCalled();
    act(() => root.unmount());
    container.remove();
  });
});
