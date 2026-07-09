// @vitest-environment jsdom
// Election Night Reveal 2.0 shell: headline, rolling counter, swingometer,
// next-scenario lock/unlock. Presentation-only — no score posting here.
import { describe, it, expect, afterEach, vi } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ElectionNightShell } from "../ElectionNightShell";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

const swing = {
  value: 4.5,
  leftLabel: "DEM",
  rightLabel: "GOP",
  leftColor: "#2563eb",
  rightColor: "#dc2626",
  unitLabel: "pts",
  caption: "Final margin",
};

describe("ElectionNightShell", () => {
  it("renders the animated winner headline and rolling counter", () => {
    mount(
      <ElectionNightShell
        eyebrow="PROJECTED WINNER"
        headline="Joe Biden"
        headlineColor="#2563eb"
        subhead="You won the campaign."
        subheadTone="win"
        counterValue={306}
        counterLabel="Electoral votes"
        counterColor="#2563eb"
        secondaryCounter={{ value: 51.3, label: "Popular vote", decimals: 1, suffix: "%" }}
        swing={swing}
      />,
    );

    expect(container.querySelector("[data-testid='election-night-shell']")).toBeTruthy();
    expect(container.querySelector("[data-testid='ens-headline']")!.textContent).toBe("Joe Biden");
    expect(container.textContent).toContain("PROJECTED WINNER");
    expect(container.textContent).toContain("You won the campaign.");
    expect(container.querySelector("[data-testid='rolling-counter']")).toBeTruthy();
    expect(container.querySelector("[data-testid='swingometer']")).toBeTruthy();
    expect(container.textContent).toContain("Final margin");
  });

  it("shows the next-scenario card unlocked with a play CTA", () => {
    const onPlay = vi.fn();
    mount(
      <ElectionNightShell
        eyebrow="PROJECTED WINNER"
        headline="Winner"
        counterValue={270}
        counterLabel="EV"
        swing={swing}
        nextScenario={{
          title: "2024 Rematch",
          blurb: "Continue the timeline",
          unlocked: true,
          ctaLabel: "Play 2024 →",
          lockLabel: "🔒 Unlock 2024",
          onPlay,
          onUnlock: vi.fn(),
        }}
      />,
    );

    const card = container.querySelector("[data-testid='ens-next-scenario']")!;
    expect(card.textContent).toContain("NEXT SCENARIO");
    expect(card.textContent).toContain("2024 Rematch");
    expect(card.className).not.toContain("locked");
    const btn = [...card.querySelectorAll("button")].find((b) => b.textContent?.includes("Play 2024"));
    expect(btn).toBeTruthy();
    act(() => {
      btn!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it("shows the locked next-scenario state and unlock CTA", () => {
    const onUnlock = vi.fn();
    mount(
      <ElectionNightShell
        eyebrow="PROJECTED WINNER"
        headline="Winner"
        counterValue={270}
        counterLabel="EV"
        swing={swing}
        nextScenario={{
          title: "2000 Recount",
          blurb: "Try a different era",
          unlocked: false,
          ctaLabel: "Play 2000 →",
          lockLabel: "🔒 Unlock 2000",
          onPlay: vi.fn(),
          onUnlock,
        }}
      />,
    );

    const card = container.querySelector("[data-testid='ens-next-scenario']")!;
    expect(card.className).toContain("locked");
    expect(card.textContent).toContain("LOCKED SCENARIO");
    expect(card.textContent).toContain("· locked");
    const btn = [...card.querySelectorAll("button")].find((b) => b.textContent?.includes("Unlock 2000"));
    act(() => {
      btn!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it("renders children and footer slots for map / score posting", () => {
    mount(
      <ElectionNightShell
        eyebrow="PROJECTED WINNER"
        headline="Winner"
        counterValue={270}
        counterLabel="EV"
        swing={swing}
        footer={<div data-testid="score-slot">Post to Leaderboard</div>}
      >
        <div data-testid="map-slot">Final Map</div>
      </ElectionNightShell>,
    );
    expect(container.querySelector("[data-testid='map-slot']")!.textContent).toBe("Final Map");
    expect(container.querySelector("[data-testid='score-slot']")!.textContent).toContain("Post to Leaderboard");
  });
});
