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
import { PAYWALL_ENABLED } from "@content/scenarioRegistry";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const reset = () => useGameStore.setState({ game: null, history: [], lastEventResult: null });

function mount(): { html: () => string; container: HTMLElement; cleanup: () => void; flush: () => Promise<void> } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(<App />); });
  return {
    html: () => container.innerHTML,
    container,
    cleanup: () => { act(() => root.unmount()); container.remove(); },
    // Some screens/modals are lazy() — let their dynamic import + suspense
    // resolve before asserting on rendered output.
    flush: async () => {
      // Dynamic import() + Suspense resolution can take a few extra
      // microtask/macrotask turns in the test environment (first load of a
      // lazy chunk is slower than a cached one), so poll a bit longer than a
      // single tick before giving up.
      for (let i = 0; i < 20; i++) {
        await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
      }
    },
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

  it("shows the landing scenario browser on first load, then the U.S. setup wizard", () => {
    const m = mount();
    // The landing page: featured tier up top, full catalog, packs strip.
    expect(m.html()).toContain(PAYWALL_ENABLED ? "Play free" : "Start here");
    expect(m.html()).toContain("Harris v. Trump");
    expect(m.html()).toContain("Scenario packs");
    // Entering a free U.S. scenario shows the setup wizard on that year.
    clickButton(m.container, "Biden v. Trump");
    const html = m.html();
    expect(html).toContain("The Election"); // step 1 of the setup wizard
    expect(html).toContain("The War Room"); // staff-hire step present
    m.cleanup();
  });

  it(PAYWALL_ENABLED
      ? "locked scenarios open the auth/paywall modal instead of a game"
      : "paywall off: pack scenarios go straight to the setup wizard", async () => {
    const m = mount();
    // Country-first browsing: open the United States, then a pack scenario.
    // Behavior past the card depends on the master paywall switch.
    clickButton(m.container, "United States");
    clickButton(m.container, "Clinton v. Trump");
    await m.flush(); // AuthModals is lazy-loaded
    const html = m.html();
    if (PAYWALL_ENABLED) {
      expect(html).toContain("Log In"); // signed-out click routes to login
      expect(m.html()).not.toContain("The War Room"); // no setup wizard
    } else {
      expect(html).toContain("The Election"); // setup wizard, no gate
      expect(html).not.toContain("Log In");
    }
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

  it("renders the results screen at the end of the campaign", async () => {
    act(() => { useGameStore.getState().newGame({ seed: "render-end", playerCandidate: "dem" }); });
    let guard = 0;
    while (useGameStore.getState().game!.phase !== "result" && guard++ < 40) {
      act(() => { useGameStore.getState().endTurn(); }); // auto-resolves events with defaults
    }
    const m = mount();
    await m.flush(); // ResultsScreen is lazy-loaded
    const html = m.html();
    expect(html).toMatch(/PROJECTED WINNER|CONTINGENT ELECTION/);
    expect(html).toContain("Post-Mortem");
    m.cleanup();
  });
});
