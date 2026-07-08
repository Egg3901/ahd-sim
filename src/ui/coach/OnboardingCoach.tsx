import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@store/gameStore";
import "./coach.css";

// First-run onboarding coach: a spotlight-tooltip walkthrough over the US
// game. Shows once (localStorage), advances on real player actions where it
// can, and stays out of the way everywhere else:
//  - never shows again once done or skipped (coach-done-v1)
//  - never shows when resuming a game past turn 0
//  - only lives in the US GameScreen, so other engines never see it
//  - bails without window/matchMedia (SSR, jsdom) and arms 600ms after
//    mount so synchronous test renders never see it.

export const COACH_DONE_KEY = "coach-done-v1";

type Rect = { top: number; left: number; width: number; height: number };

type CoachStep = {
  title: string;
  body: string;
  /** Shown on steps that wait for a real player action. */
  hint?: string;
  /** Label for the manual advance button. */
  next: string;
  /** True when the primary way forward is a player action, not the button. */
  waits?: boolean;
  /** Resolve the spotlight target; null = centered card, no spotlight. */
  target: (mobile: boolean) => Element | null;
};

// Anchors ride on stable classes owned by other components (.mapwrap on the
// USMap card, .actiongrid inside the ActionPanel card, .sheet for the mobile
// state sheet) plus one data-coach attribute on the End Week button, which
// lives in App.tsx where we're allowed to tag it.
const STEPS: CoachStep[] = [
  {
    title: "Welcome to the war room",
    body: "This is your war room. Win 270 electoral votes in {N} weeks. No pressure.",
    next: "Show me",
    target: () => null,
  },
  {
    title: "The battleground",
    body: "Your battleground. Blue and red show the current lean; the gold-edged states are in play. Click a battleground state.",
    hint: "Click a state on the map to continue.",
    next: "Next",
    waits: true,
    target: () => document.querySelector(".mapwrap"),
  },
  {
    title: "Coalitions, not colors",
    body: "Every state is a coalition of voter blocs. Move the ones that are persuadable and stop courting the ones that aren't.",
    next: "Next",
    target: (mobile) =>
      mobile
        ? document.querySelector(".sheet .card") ?? document.querySelector(".sheet")
        : document.querySelectorAll(".main .col")[1]?.querySelector(".card") ?? null,
  },
  {
    title: "Plan your week",
    body: "Queue your week: ads, rallies, ground game. Actions cost slots. Spend all of them; unspent slots win nothing.",
    hint: "Queue at least one action to continue.",
    next: "Next",
    waits: true,
    // The whole Week Plan card can run taller than the viewport, so the
    // spotlight rides the action grid itself.
    target: () => document.querySelector(".actiongrid"),
  },
  {
    title: "Lock it in",
    body: "Lock it in. The week resolves, events hit, and you pick trade-offs, not right answers.",
    hint: "Click End Week to continue.",
    next: "Next",
    waits: true,
    target: () => document.querySelector('[data-coach="endweek"]'),
  },
  {
    title: "That's the loop",
    body: "Watch the projection up top. Election Night decides everything. Good luck.",
    next: "Done",
    target: () => null,
  },
];

const sameRect = (a: Rect | null, b: Rect | null): boolean => {
  if (a === null || b === null) return a === b;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

export function OnboardingCoach() {
  // Eligibility is decided once, at mount, against the world as it is then:
  // a browser-ish environment, no done-flag, and a US game on its first turn.
  const [eligible] = useState<boolean>(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return false;
    if (typeof window.matchMedia !== "function") return false; // jsdom / non-browser
    try {
      if (window.localStorage.getItem(COACH_DONE_KEY)) return false;
    } catch {
      return false;
    }
    const g = useGameStore.getState().game;
    return g !== null && g.turn === 0;
  });

  const [armed, setArmed] = useState(false); // becomes true 600ms after mount
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mobile, setMobile] = useState(false);
  const baseTurn = useRef<number>(useGameStore.getState().game?.turn ?? 0);

  // Read-only store subscriptions drive the action-based advances.
  const totalTurns = useGameStore((s) => s.game?.totalTurns ?? 0);
  const selectedStateId = useGameStore((s) => s.selectedStateId);
  const queuedLen = useGameStore((s) => s.game?.queuedActions.length ?? 0);
  const turn = useGameStore((s) => s.game?.turn ?? 0);

  const active = eligible && armed && !dismissed;

  // Arm after a beat so act()-wrapped synchronous renders never see the coach.
  useEffect(() => {
    if (!eligible) return;
    const t = window.setTimeout(() => setArmed(true), 600);
    return () => window.clearTimeout(t);
  }, [eligible]);

  // Track the mobile breakpoint (card becomes a bottom sheet under 768px).
  useEffect(() => {
    if (!eligible) return;
    const mq = window.matchMedia("(max-width: 768px)");
    const fn = () => setMobile(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [eligible]);

  // Action-driven advances (each with a Next fallback in the card).
  useEffect(() => {
    if (active && step === 1 && selectedStateId !== null) setStep(2);
  }, [active, step, selectedStateId]);
  useEffect(() => {
    if (active && step === 3 && queuedLen > 0) setStep(4);
  }, [active, step, queuedLen]);
  useEffect(() => {
    if (active && step === 4 && turn > baseTurn.current) setStep(5);
  }, [active, step, turn]);

  // Bring the step's target into view once when the step starts (the columns
  // scroll independently and some targets live below the fold).
  useEffect(() => {
    if (!active) return;
    const el = STEPS[step].target(window.matchMedia("(max-width: 768px)").matches);
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
  }, [active, step]);

  // Follow the spotlight target: recompute on resize/scroll and poll lightly,
  // since the panels re-render and reflow under us.
  useEffect(() => {
    if (!active) return;
    const update = () => {
      const el = STEPS[step].target(window.matchMedia("(max-width: 768px)").matches);
      const r = el ? el.getBoundingClientRect() : null;
      const next: Rect | null =
        r && r.width > 0 ? { top: r.top, left: r.left, width: r.width, height: r.height } : null;
      setRect((prev) => (sameRect(prev, next) ? prev : next));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const iv = window.setInterval(update, 300);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.clearInterval(iv);
    };
  }, [active, step]);

  if (!active) return null;

  const finish = () => {
    try {
      window.localStorage.setItem(COACH_DONE_KEY, "1");
    } catch {
      /* private mode etc. — just dismiss for this session */
    }
    setDismissed(true);
  };
  const advance = () => (step >= STEPS.length - 1 ? finish() : setStep(step + 1));

  const s = STEPS[step];
  const body = s.body.replace("{N}", String(totalTurns));

  // Desktop card placement: below the target when there's room, else above,
  // clamped to the viewport. Mobile pins the card to the bottom as a sheet.
  const CARD_W = 340;
  const CARD_H = 200;
  const GAP = 14;
  const PAD = 12;
  let cardStyle: React.CSSProperties | undefined;
  if (!mobile && rect) {
    const below = rect.top + rect.height + GAP + CARD_H <= window.innerHeight;
    const rawTop = below ? rect.top + rect.height + GAP : rect.top - GAP - CARD_H;
    cardStyle = {
      top: clamp(rawTop, PAD, window.innerHeight - CARD_H - PAD),
      left: clamp(rect.left + rect.width / 2 - CARD_W / 2, PAD, window.innerWidth - CARD_W - PAD),
      width: CARD_W,
    };
  }

  return (
    <div className="coach" role="dialog" aria-label="Onboarding tour">
      {rect ? (
        <div
          className="coach-spot"
          style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
        />
      ) : (
        <div className="coach-dim" />
      )}
      <div
        className={`coach-card${mobile ? " sheet-mode" : ""}${!mobile && !rect ? " centered" : ""}`}
        style={cardStyle}
      >
        <div className="coach-eyebrow">TOUR · {step + 1}/{STEPS.length}</div>
        <h4 className="coach-title">{s.title}</h4>
        <p className="coach-body">{body}</p>
        {s.hint && <p className="coach-hint">{s.hint}</p>}
        <div className="coach-actions">
          <button className="ghost small coach-skip" onClick={finish}>
            Skip tour
          </button>
          <button className={`small${s.waits ? " ghost" : " primary"}`} onClick={advance}>
            {s.next}
          </button>
        </div>
      </div>
    </div>
  );
}
