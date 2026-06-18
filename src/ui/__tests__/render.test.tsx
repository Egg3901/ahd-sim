// @vitest-environment jsdom
// DOM-render smoke test: mounts the real React tree into jsdom (client render,
// the same path the browser uses) to catch JSX/component crashes the data-layer
// tests can't. No testing-library — just react-dom/client + act.
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { App } from "../../App";
import { useGameStore } from "@store/gameStore";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const reset = () => useGameStore.setState({ game: null, history: [], lastEventResult: null });

function mount(): { html: () => string; container: HTMLElement; cleanup: () => void } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(<App />); });
  return {
    html: () => container.innerHTML,
    container,
    cleanup: () => { act(() => root.unmount()); container.remove(); },
  };
}

// Click the first <button> whose text contains `text`.
function clickButton(container: HTMLElement, text: string) {
  const btn = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes(text));
  if (!btn) throw new Error(`button containing "${text}" not found`);
  act(() => { btn.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
}

describe("App renders without crashing", () => {
  beforeEach(reset);

  it("shows the country picker on first load, then the U.S. setup wizard", () => {
    const m = mount();
    // The new landing offers both battlegrounds.
    expect(m.html()).toContain("choose your battleground");
    expect(m.html()).toContain("United States");
    expect(m.html()).toContain("United Kingdom");
    // Entering the U.S. game shows the scenario picker wizard.
    clickButton(m.container, "United States");
    const html = m.html();
    expect(html).toContain("The Election"); // step 1 of the setup wizard
    expect(html).toContain("Gore v. Bush"); // scenario picker is present on step 1
    m.cleanup();
  });

  it("enters the U.K. general-election setup from the country picker", () => {
    const m = mount();
    clickButton(m.container, "United Kingdom");
    const html = m.html();
    expect(html).toContain("UNITED KINGDOM — GENERAL ELECTION"); // setup eyebrow
    expect(html).toContain("The Election"); // step 1 of the UK wizard
    expect(html).toContain("Starmer"); // 2024 contenders preview
    m.cleanup();
  });

  it("renders the in-game dashboard (map, panels) with no blocking event on the opening week", () => {
    act(() => { useGameStore.getState().newGame({ seed: "render", playerCandidate: "dem" }); });
    const m = mount();
    const html = m.html();
    expect(html).toContain("Electoral Map");
    expect(html).toContain("Week Plan");
    expect(html).toContain("Day 7"); // the 7-day planner is present
    // The opening week is deliberately event-free so nothing blocks the dashboard
    // on load; campaign events begin after the first End Week.
    const g = useGameStore.getState().game!;
    expect(g.pendingEvents.filter((p) => p.forCandidate === g.playerCandidate)).toHaveLength(0);
    m.cleanup();
  });

  it("renders the results screen at the end of the campaign", () => {
    act(() => { useGameStore.getState().newGame({ seed: "render-end", playerCandidate: "dem" }); });
    let guard = 0;
    while (useGameStore.getState().game!.phase !== "result" && guard++ < 40) {
      act(() => { useGameStore.getState().endTurn(); }); // auto-resolves events with defaults
    }
    const m = mount();
    const html = m.html();
    expect(html).toMatch(/PROJECTED WINNER|CONTINGENT ELECTION/);
    expect(html).toContain("Post-Mortem");
    m.cleanup();
  });
});
