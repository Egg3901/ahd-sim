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

function mount(): { html: () => string; cleanup: () => void } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(<App />); });
  return {
    html: () => container.innerHTML,
    cleanup: () => { act(() => root.unmount()); container.remove(); },
  };
}

describe("App renders without crashing", () => {
  beforeEach(reset);

  it("renders the setup screen with the scenario picker on first load", () => {
    const m = mount();
    const html = m.html();
    expect(html).toContain("A House Divided");
    expect(html).toContain("Begin"); // "Begin <year> as <name> →"
    expect(html).toContain("Gore v. Bush"); // scenario picker is present
    m.cleanup();
  });

  it("renders the in-game dashboard (map, panels) with no blocking event on the opening week", () => {
    act(() => { useGameStore.getState().newGame({ seed: "render", playerCandidate: "dem" }); });
    const m = mount();
    const html = m.html();
    expect(html).toContain("Electoral Map");
    expect(html).toContain("Allocate Resources");
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
