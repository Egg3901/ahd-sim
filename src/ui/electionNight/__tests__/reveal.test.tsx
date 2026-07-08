// @vitest-environment jsdom
// Election Night reveal: instant-mode auto-advance, the projection banner for
// a majority, and the hung-parliament banner when nobody crosses the post.
// jsdom has no matchMedia, so the component defaults to "instant" speed here
// (the prefers-reduced-motion fallback) — everything reveals on mount and the
// auto-onDone timer arms. Fake timers drive the clock.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ElectionNight, buildSchedule, type RevealProps, type RevealUnit } from "../ElectionNight";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const PARTIES = [
  { id: "a", short: "ALPHA", color: "#2563eb" },
  { id: "b", short: "BETA", color: "#dc2626" },
];

// 10 equal 10-unit regions; winners per the pattern, margins spread so the
// wave/cliffhanger ordering is deterministic.
function makeUnits(winners: string[]): RevealUnit[] {
  return winners.map((w, i) => ({
    id: `u${i}`,
    name: `Unit ${i}`,
    abbr: `U${i}`,
    winnerId: w,
    winnerColor: w === "a" ? "#2563eb" : "#dc2626",
    winnerShort: w === "a" ? "ALPHA" : "BETA",
    units: 10,
    margin: 30 - i * 3,
    upset: false,
  }));
}

function baseProps(winners: string[], onDone: () => void): RevealProps {
  return {
    title: "Election Night · Test",
    totalUnits: winners.length * 10,
    threshold: Math.floor((winners.length * 10) / 2) + 1, // 51 of 100
    parties: PARTIES,
    units: makeUnits(winners),
    playerPartyId: "a",
    unitLabel: "seats",
    noMajorityLabel: "NO OVERALL MAJORITY — HUNG PARLIAMENT",
    onDone,
  };
}

let container: HTMLElement;
let root: Root;

function mount(props: RevealProps) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<ElectionNight {...props} />);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.useRealTimers();
});

describe("ElectionNight reveal", () => {
  it("instant mode reveals everything and auto-calls onDone after the hold", () => {
    const onDone = vi.fn();
    mount(baseProps(["a", "a", "a", "a", "a", "a", "a", "b", "b", "b"], onDone));

    // Instant: the full board is on screen immediately, but onDone waits for
    // the brief final hold.
    expect(container.innerHTML).toContain("ALL RESULTS IN");
    expect(onDone).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("shows the projection banner when a party crosses the threshold", () => {
    const onDone = vi.fn();
    // ALPHA wins 7 of 10 units → 70 of 100, past the 51 post.
    mount(baseProps(["a", "a", "a", "a", "a", "a", "a", "b", "b", "b"], onDone));

    expect(container.innerHTML).toContain("PROJECTION: ALPHA WINS");
    expect(container.innerHTML).not.toContain("NO OVERALL MAJORITY");
  });

  it("shows the no-majority banner when nobody crosses the threshold", () => {
    const onDone = vi.fn();
    // 50–50 split → neither side reaches 51.
    mount(baseProps(["a", "b", "a", "b", "a", "b", "a", "b", "a", "b"], onDone));

    expect(container.innerHTML).toContain("NO OVERALL MAJORITY — HUNG PARLIAMENT");
    expect(container.innerHTML).not.toContain("PROJECTION:");
  });

  it("auto-calls onDone immediately when this game's reveal was already seen", () => {
    const onDone = vi.fn();
    sessionStorage.setItem("reveal-test-key", "1");
    mount({ ...baseProps(["a", "a", "a", "b"], onDone), storageKey: "reveal-test-key" });
    expect(onDone).toHaveBeenCalled();
  });
});

describe("buildSchedule", () => {
  it("holds the tightest races back as cliffhangers, tightest resolving last", () => {
    const units = makeUnits(["a", "a", "a", "a", "a", "a", "a", "b", "b", "b"]);
    const { entries } = buildSchedule(units, 51);
    const calls = entries.filter((e) => e.kind === "call");
    expect(calls).toHaveLength(10);
    // The last call is the smallest margin (units are margin 30 − 3i → u9).
    expect(calls[calls.length - 1].unit!.id).toBe("u9");
    expect(calls[calls.length - 1].isCliff).toBe(true);
    // Marks exactly one projection call for a majority outcome.
    expect(entries.filter((e) => e.projectedId).length).toBe(1);
    // Ends with an "end" entry after everything else.
    expect(entries[entries.length - 1].kind).toBe("end");
  });
});
