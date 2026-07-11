// @vitest-environment jsdom
// Election Night Reveal 2.0 — shell variants for US / UK / country / daily,
// plus logged-in vs offline score-posting states on the daily panel.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ElectionNight, buildSchedule, type RevealMap, type RevealProps, type RevealUnit } from "../ElectionNight";
import { ElectionNightShell } from "../ElectionNightShell";
import { MultipartySeatPanel } from "../MultipartySeatPanel";
import { estimatePercentile, DailyRevealPanel } from "../DailyRevealPanel";
import { useAuthStore } from "@store/authStore";
import { dailyAssignment, utcDateString } from "@lib/daily";
import { hashStr } from "@engine/setup";
import { hashSeed } from "@engine/rng";
import { api } from "@lib/api";
import type { Government } from "@engine/types";
import type { ScoreFacts } from "@engine/scoring";
import { SCENARIOS_BY_ID } from "@content/scenarioRegistry";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const PARTIES = [
  { id: "a", short: "ALPHA", color: "#2563eb" },
  { id: "b", short: "BETA", color: "#dc2626" },
];

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
    threshold: Math.floor((winners.length * 10) / 2) + 1,
    parties: PARTIES,
    units: makeUnits(winners),
    playerPartyId: "a",
    unitLabel: "seats",
    noMajorityLabel: "NO OVERALL MAJORITY: HUNG PARLIAMENT",
    onDone,
  };
}

function makeMap(n: number): RevealMap {
  const shapes: RevealMap["shapes"] = {};
  for (let i = 0; i < n; i++) shapes[`u${i}`] = { d: `M${i * 10} 0h8v8h-8z` };
  return { viewBox: "0 0 100 10", shapes };
}

let container: HTMLElement;
let root: Root;

function mount(ui: ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(ui);
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
  delete (window as { matchMedia?: unknown }).matchMedia;
  useAuthStore.setState({ user: null, serverDown: false });
});

describe("ElectionNight reveal (staged theater)", () => {
  it("instant mode reveals everything and auto-calls onDone after the hold", () => {
    const onDone = vi.fn();
    mount(<ElectionNight {...baseProps(["a", "a", "a", "a", "a", "a", "a", "b", "b", "b"], onDone)} />);
    expect(container.innerHTML).toContain("ALL RESULTS IN");
    expect(onDone).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("shows the projection banner when a party crosses the threshold", () => {
    mount(<ElectionNight {...baseProps(["a", "a", "a", "a", "a", "a", "a", "b", "b", "b"], vi.fn())} />);
    expect(container.innerHTML).toContain("PROJECTION: ALPHA WINS");
    expect(container.innerHTML).not.toContain("NO OVERALL MAJORITY");
  });

  it("shows the no-majority banner when nobody crosses the threshold", () => {
    mount(<ElectionNight {...baseProps(["a", "b", "a", "b", "a", "b", "a", "b", "a", "b"], vi.fn())} />);
    expect(container.innerHTML).toContain("NO OVERALL MAJORITY: HUNG PARLIAMENT");
    expect(container.innerHTML).not.toContain("PROJECTION:");
  });

  it("renders no map when the adapter provides none (chip-only layout)", () => {
    mount(<ElectionNight {...baseProps(["a", "a", "b", "b"], vi.fn())} />);
    expect(container.querySelector(".en-map")).toBeNull();
  });

  it("instant mode paints every mapped unit with its winner's fill immediately", () => {
    const winners = ["a", "a", "a", "a", "a", "a", "a", "b", "b", "b"];
    mount(<ElectionNight {...baseProps(winners, vi.fn())} map={makeMap(winners.length)} />);
    const called = container.querySelectorAll<SVGPathElement>(".en-map-unit.called");
    expect(called).toHaveLength(10);
    expect(container.querySelector(".en-map")!.className).toContain("instant");
  });

  it("a call fills that unit on the map while uncalled units stay neutral", () => {
    (window as unknown as { matchMedia: unknown }).matchMedia = () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    });
    const winners = ["a", "a", "a", "a", "a", "a", "a", "b", "b", "b"];
    mount(<ElectionNight {...baseProps(winners, vi.fn())} map={makeMap(winners.length)} />);
    expect(container.querySelectorAll(".en-map-unit.called")).toHaveLength(0);
    act(() => vi.advanceTimersByTime(1300));
    act(() => vi.advanceTimersByTime(400));
    expect(container.querySelectorAll(".en-map-unit.called")).toHaveLength(1);
  });

  it("marks upset calls with the gold ring overlay", () => {
    const winners = ["a", "a", "a", "a", "a", "a", "a", "b", "b", "b"];
    const props = baseProps(winners, vi.fn());
    props.units[3].upset = true;
    mount(<ElectionNight {...props} map={makeMap(winners.length)} />);
    expect(container.querySelectorAll(".en-map-upset-ring")).toHaveLength(1);
  });

  it("auto-calls onDone immediately when this game's reveal was already seen", () => {
    const onDone = vi.fn();
    sessionStorage.setItem("reveal-test-key", "1");
    mount(<ElectionNight {...baseProps(["a", "a", "a", "b"], onDone)} storageKey="reveal-test-key" />);
    expect(onDone).toHaveBeenCalled();
  });
});

describe("buildSchedule", () => {
  it("holds the tightest races back as cliffhangers, tightest resolving last", () => {
    const units = makeUnits(["a", "a", "a", "a", "a", "a", "a", "b", "b", "b"]);
    const { entries } = buildSchedule(units, 51);
    const calls = entries.filter((e) => e.kind === "call");
    expect(calls).toHaveLength(10);
    expect(calls[calls.length - 1].unit!.id).toBe("u9");
    expect(calls[calls.length - 1].isCliff).toBe(true);
    expect(entries.filter((e) => e.projectedId).length).toBe(1);
    expect(entries[entries.length - 1].kind).toBe("end");
  });
});

const swing = {
  value: 4.5,
  leftLabel: "DEM",
  rightLabel: "GOP",
  leftColor: "#2563eb",
  rightColor: "#dc2626",
  unitLabel: "pts",
};

describe("Reveal 2.0 shell — US mode", () => {
  it("renders winner headline, EV counter, and swingometer", () => {
    mount(
      <ElectionNightShell
        eyebrow="PROJECTED WINNER"
        headline="Joe Biden"
        headlineColor="#2563eb"
        subhead="You won the campaign."
        subheadTone="win"
        counterValue={306}
        counterLabel="Electoral votes"
        secondaryCounter={{ value: 51.3, label: "Popular vote", decimals: 1, suffix: "%" }}
        swing={swing}
      >
        <div data-testid="state-call-grid">State calls</div>
      </ElectionNightShell>,
    );
    expect(container.querySelector("[data-testid='ens-headline']")!.textContent).toBe("Joe Biden");
    expect(container.textContent).toContain("Electoral votes");
    expect(container.querySelector("[data-testid='swingometer']")).toBeTruthy();
    expect(container.querySelector("[data-testid='state-call-grid']")).toBeTruthy();
  });
});

describe("Reveal 2.0 shell — UK / country mode", () => {
  const segments = [
    { id: "con", seats: 318, short: "CON", color: "#0087dc" },
    { id: "dup", seats: 10, short: "DUP", color: "#d46a4c" },
    { id: "lab", seats: 262, short: "LAB", color: "#e4003b" },
    { id: "ld", seats: 11, short: "LD", color: "#faa61a" },
  ];
  const nameOf = (id: string) =>
    ({ con: "Conservative", dup: "DUP", lab: "Labour", ld: "Lib Dem" }[id] ?? id);

  it("shows coalition math for a hung parliament coalition", () => {
    const government: Government = { kind: "coalition", parties: ["con", "dup"], seats: 328 };
    mount(
      <ElectionNightShell
        eyebrow="NO OVERALL MAJORITY"
        headline="Conservative"
        counterValue={318}
        counterLabel="Your seats"
        swing={{ ...swing, leftLabel: "CON", rightLabel: "LAB", value: -8 }}
      >
        <MultipartySeatPanel
          segments={segments}
          total={650}
          threshold={326}
          government={government}
          nameOf={nameOf}
        />
      </ElectionNightShell>,
    );
    expect(container.querySelector("[data-testid='ens-hung']")).toBeTruthy();
    expect(container.querySelector("[data-testid='ens-coalition-math']")!.textContent).toContain(
      "Conservative 318 + DUP 10 = 328",
    );
    expect(container.querySelector("[data-testid='multiparty-seat-panel']")).toBeTruthy();
  });

  it("shows hung parliament state when nobody can form a majority", () => {
    const government: Government = { kind: "hung", largest: "con" };
    mount(
      <MultipartySeatPanel
        segments={segments}
        total={650}
        threshold={326}
        government={government}
        nameOf={nameOf}
      />,
    );
    expect(container.querySelector("[data-testid='ens-hung']")!.textContent).toMatch(/HUNG PARLIAMENT/);
    expect(container.querySelector("[data-testid='ens-coalition-math']")).toBeNull();
  });

  it("shows majority equation without a hung banner", () => {
    const government: Government = { kind: "majority", party: "lab", seats: 412 };
    mount(
      <MultipartySeatPanel
        segments={[
          { id: "lab", seats: 412, short: "LAB", color: "#e4003b" },
          { id: "con", seats: 121, short: "CON", color: "#0087dc" },
        ]}
        total={650}
        threshold={326}
        government={government}
        nameOf={nameOf}
      />,
    );
    expect(container.querySelector("[data-testid='ens-hung']")).toBeNull();
    expect(container.querySelector("[data-testid='ens-coalition-math']")!.textContent).toContain(
      "Labour 412, majority of 326",
    );
  });
});

describe("estimatePercentile", () => {
  it("ranks a score against today's board", () => {
    const board = [
      { rank: 1, username: "a", score: 900, evMargin: null, popularVoteMargin: null, difficulty: "normal", finishedAt: 0 },
      { rank: 2, username: "b", score: 800, evMargin: null, popularVoteMargin: null, difficulty: "normal", finishedAt: 0 },
      { rank: 3, username: "c", score: 700, evMargin: null, popularVoteMargin: null, difficulty: "normal", finishedAt: 0 },
    ];
    expect(estimatePercentile(750, board, null)).toBe(75); // 2 better → (2+1)/(3+1)=75%
    expect(estimatePercentile(950, board, 1)).toBe(33); // rank 1 of 3 → round(100/3)
  });

  it("returns null with no board data", () => {
    expect(estimatePercentile(800, null, null)).toBeNull();
  });
});

describe("Daily reveal — logged-in vs offline score posting", () => {
  const facts: ScoreFacts = {
    unitMargin: 10,
    chamberSize: 538,
    popularMargin: 2,
    difficulty: "normal",
  };

  function mountTodayDaily() {
    const today = dailyAssignment(utcDateString());
    const meta = SCENARIOS_BY_ID[today.scenarioId];
    const engine = meta?.engine === "uk" ? "uk" : meta?.engine === "country" ? "country" : "us";
    const gameSeed = engine === "us" ? hashStr(today.seed) : hashSeed(today.seed);
    mount(
      <DailyRevealPanel
        gameSeed={gameSeed}
        scenarioId={today.scenarioId}
        engine={engine}
        won
        unitLine="306 EV"
        score={820}
        facts={facts}
        evMargin={36}
        popularVoteMargin={2.1}
        onReplay={vi.fn()}
      />,
    );
  }

  beforeEach(() => {
    // Board fetch is best-effort; keep tests offline-friendly.
    vi.spyOn(api, "dailyBoard").mockRejectedValue(new Error("offline"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows Post to daily board when logged in", () => {
    useAuthStore.setState({
      user: { id: "u1", username: "tester", email: "t@x.com" },
      serverDown: false,
    });
    mountTodayDaily();
    expect(container.querySelector("[data-testid='daily-reveal-panel']")).toBeTruthy();
    expect(container.querySelector("[data-testid='daily-post']")!.textContent).toContain("Post to daily board");
    expect(container.querySelector("[data-testid='daily-login']")).toBeNull();
    expect(container.querySelector("[data-testid='daily-replay']")).toBeTruthy();
  });

  it("shows Log in to post when signed out and online", () => {
    useAuthStore.setState({ user: null, serverDown: false });
    mountTodayDaily();
    expect(container.querySelector("[data-testid='daily-login']")!.textContent).toContain("Log in to post");
  });

  it("shows Offline on the post button when logged in but server is down", () => {
    useAuthStore.setState({
      user: { id: "u1", username: "tester", email: "t@x.com" },
      serverDown: true,
    });
    mountTodayDaily();
    const btn = container.querySelector<HTMLButtonElement>("[data-testid='daily-post']");
    expect(btn).toBeTruthy();
    expect(btn!.disabled).toBe(true);
    expect(btn!.textContent).toContain("Offline");
  });

  it("shows Play offline when signed out and server is down", () => {
    useAuthStore.setState({ user: null, serverDown: true });
    mountTodayDaily();
    expect(container.querySelector("[data-testid='daily-offline']")!.textContent).toContain("Play offline");
  });

  it("DailyRevealPanel returns null when the game is not today's daily", () => {
    mount(
      <DailyRevealPanel
        gameSeed={999999}
        scenarioId="us-2020"
        engine="us"
        won
        unitLine="306 EV"
        score={800}
        facts={facts}
        evMargin={36}
        popularVoteMargin={2.1}
      />,
    );
    expect(container.querySelector("[data-testid='daily-reveal-panel']")).toBeNull();
  });
});
