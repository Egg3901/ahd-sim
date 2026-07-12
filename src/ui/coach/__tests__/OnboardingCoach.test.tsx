// @vitest-environment jsdom
// Component tests for the first-run onboarding coach. jsdom has no
// window.matchMedia, which is exactly the gate the coach uses to bail in the
// existing App render tests — so here we polyfill it to let the coach run,
// and use fake timers to cross the 600ms arm delay.
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { OnboardingCoach, COACH_DONE_KEY } from "../OnboardingCoach";
import { useGameStore } from "@store/gameStore";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Minimal matchMedia polyfill: desktop layout (no query matches).
const installMatchMedia = () => {
  (window as unknown as { matchMedia: (q: string) => MediaQueryList }).matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
};

function mount() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<OnboardingCoach />);
  });
  return {
    container,
    html: () => container.innerHTML,
    cleanup: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

const arm = () => act(() => void vi.advanceTimersByTime(700)); // past the 600ms delay

function clickButton(container: HTMLElement, text: string) {
  const btn = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes(text));
  if (!btn) throw new Error(`button containing "${text}" not found`);
  act(() => {
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

describe("OnboardingCoach", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installMatchMedia();
    window.localStorage.clear();
    useGameStore.setState({ game: null, history: [], lastEventResult: null, selectedStateId: null });
    act(() => {
      useGameStore.getState().newGame({ seed: "coach-test", playerCandidate: "dem" });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("first run: hidden before the arm delay, shows step 1 of 8 after it", () => {
    const m = mount();
    expect(m.html()).toBe(""); // synchronous render never sees the coach
    arm();
    expect(m.html()).toContain("TOUR · 1/8");
    expect(m.html()).toContain("war room");
    expect(m.html()).toContain("270 electoral votes");
    expect(m.html()).toContain("Skip tour");
    m.cleanup();
  });

  it("skip tour sets the done key and hides the coach", () => {
    const m = mount();
    arm();
    clickButton(m.container, "Skip tour");
    expect(window.localStorage.getItem(COACH_DONE_KEY)).toBe("1");
    expect(m.html()).toBe("");
    m.cleanup();
  });

  it("done key prevents the coach from ever showing again", () => {
    window.localStorage.setItem(COACH_DONE_KEY, "1");
    const m = mount();
    arm();
    expect(m.html()).toBe("");
    m.cleanup();
  });

  it("never shows when resuming a game past turn 0", () => {
    act(() => {
      useGameStore.getState().endTurn(); // turn 0 -> 1 before the coach mounts
    });
    const m = mount();
    arm();
    expect(m.html()).toBe("");
    m.cleanup();
  });

  it("map step advances when a state is selected", () => {
    const m = mount();
    arm();
    clickButton(m.container, "Show me"); // step 1 -> map step
    expect(m.html()).toContain("TOUR · 2/8");
    act(() => {
      useGameStore.getState().selectState("PA");
    });
    expect(m.html()).toContain("TOUR · 3/8");
    expect(m.html()).toContain("coalition of voter blocs");
    m.cleanup();
  });

  it("steps through the whole tour to completion without errors", () => {
    const m = mount();
    arm();

    // Step 1: welcome
    expect(m.html()).toContain("TOUR · 1/8");
    clickButton(m.container, "Show me"); // -> step 2, map

    // Step 2: map, waits for a state pick
    expect(m.html()).toContain("TOUR · 2/8");
    act(() => {
      useGameStore.getState().selectState("PA");
    });

    // Step 3: coalitions
    expect(m.html()).toContain("TOUR · 3/8");
    clickButton(m.container, "Next"); // -> step 4, plan your week

    // Step 4: actions, waits for a queued action
    expect(m.html()).toContain("TOUR · 4/8");
    expect(m.html()).toContain("Queue your week");
    act(() => {
      useGameStore.getState().queueAction({ type: "rally", candidate: "dem", stateId: "PA" });
    });

    // Step 5: lock it in, waits for the turn to advance
    expect(m.html()).toContain("TOUR · 5/8");
    act(() => {
      useGameStore.getState().endTurn();
    });

    // Step 6: events/debates (informational)
    expect(m.html()).toContain("TOUR · 6/8");
    expect(m.html()).toContain("Curveballs");
    expect(m.html()).toContain("debates");
    clickButton(m.container, "Next");

    // Step 7: where Settings/Guide/Timeline live
    expect(m.html()).toContain("TOUR · 7/8");
    expect(m.html()).toContain("Replay tutorial");
    clickButton(m.container, "Next");

    // Step 8: final step, "Done" closes and marks it complete
    expect(m.html()).toContain("TOUR · 8/8");
    clickButton(m.container, "Done");
    expect(window.localStorage.getItem(COACH_DONE_KEY)).toBe("1");
    expect(m.html()).toBe("");
    m.cleanup();
  });

  it("forceOpen replays the tour, bypassing the done key and turn-0 gate", () => {
    window.localStorage.setItem(COACH_DONE_KEY, "1");
    act(() => {
      useGameStore.getState().endTurn(); // turn 0 -> 1
    });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(<OnboardingCoach forceOpen />);
    });
    arm();
    expect(container.innerHTML).toContain("TOUR · 1/8");
    act(() => root.unmount());
    container.remove();
  });
});
