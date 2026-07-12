import { useEffect } from "react";
import { useSettingsStore } from "@store/settingsStore";

export interface HotkeyHandlers {
  /** Enter/Space: end the current turn. Only wired up when it's safe to do so. */
  onEndTurn?: () => void;
  /** Escape: close whatever modal/overlay is on top. */
  onEscape?: () => void;
  /** 1-9: pick the Nth available action. Called with a 0-based index. */
  onPickAction?: (index: number) => void;
  /** ?: toggle the shortcut help overlay. */
  onHelp?: () => void;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

/**
 * Global keyboard shortcuts for the game screen. No-ops entirely while the
 * player is typing in a field, and respects the settings toggle so it can be
 * turned off from the settings panel.
 */
export function useHotkeys(handlers: HotkeyHandlers): void {
  const hotkeysOn = useSettingsStore((s) => s.hotkeysOn);

  useEffect(() => {
    if (!hotkeysOn) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Escape") {
        if (handlers.onEscape) { e.preventDefault(); handlers.onEscape(); }
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        if (handlers.onEndTurn) { e.preventDefault(); handlers.onEndTurn(); }
        return;
      }
      if (e.key === "?") {
        if (handlers.onHelp) { e.preventDefault(); handlers.onHelp(); }
        return;
      }
      if (/^[1-9]$/.test(e.key)) {
        if (handlers.onPickAction) { e.preventDefault(); handlers.onPickAction(Number(e.key) - 1); }
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotkeysOn, handlers.onEndTurn, handlers.onEscape, handlers.onPickAction, handlers.onHelp]);
}
