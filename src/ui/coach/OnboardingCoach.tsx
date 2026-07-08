import { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "@store/gameStore";
import "./coach.css";

// First-run onboarding coach: a spotlight-tooltip walkthrough. Shows once
// (localStorage key), advances on real player actions where it can, and stays
// out of the way everywhere else:
//  - never shows again once done or skipped
//  - never shows when resuming a game past turn 0
//  - bails without window/matchMedia (SSR, jsdom) and arms 600ms after
//    mount so synchronous test renders never see it.
//
// US GameScreen uses the default export with no props (US store + copy).
// UK / country shells pass engine-specific selectors and win-line copy.

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

export interface OnboardingCoachProps {
  doneKey?: string;
  winLine?: string;
  mapHint?: string;
  mapBody?: string;
  planBody?: string;
  /** When provided, drives eligibility + action advances (non-US engines). */
  selectedId?: string | null;
  queuedLen?: number;
  turn?: number;
  totalTurns?: number;
  mapSelector?: string;
  detailSelector?: (mobile: boolean) => Element | null;
}

const sameRect = (a: Rect | null, b: Rect | null): boolean => {
  if (a === null || b === null) return a === b;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

function buildSteps(props: OnboardingCoachProps): CoachStep[] {
  const mapSel = props.mapSelector ?? ".mapwrap";
  const detail =
    props.detailSelector ??
    ((mobile: boolean) =>
      mobile
        ? document.querySelector(".sheet .card") ?? document.querySelector(".sheet")
        : document.querySelectorAll(".main .col")[1]?.querySelector(".card") ?? null);

  return [
    {
      title: "Welcome to the war room",
      body: props.winLine ?? "This is your war room. Win 270 electoral votes in {N} weeks. No pressure.",
      next: "Show me",
      target: () => null,
    },
    {
      title: "The battleground",
      body: props.mapBody ?? "Your battleground. Blue and red show the current lean; the gold-edged states are in play. Click a battleground state.",
      hint: props.mapHint ?? "Click a state on the map to continue.",
      next: "Next",
      waits: true,
      target: () => document.querySelector(mapSel),
    },
    {
      title: "Coalitions, not colors",
      body: "Every contest is a coalition of voter blocs. Move the ones that are persuadable and stop courting the ones that aren't.",
      next: "Next",
      target: detail,
    },
    {
      title: "Plan your week",
      body: props.planBody ?? "Queue your week: ads, rallies, ground game. Actions cost slots. Spend all of them; unspent slots win nothing.",
      hint: "Queue at least one action to continue.",
      next: "Next",
      waits: true,
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
}

export function OnboardingCoach(props: OnboardingCoachProps = {}) {
  const doneKey = props.doneKey ?? COACH_DONE_KEY;
  const steps = useMemo(
    () => buildSteps(props),
    // Copy strings + selectors; detailSelector identity is stable enough for spotlight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.doneKey, props.winLine, props.mapHint, props.mapBody, props.planBody, props.mapSelector],
  );
  const external = props.turn !== undefined;

  // Eligibility is decided once, at mount, against the world as it is then.
  const [eligible] = useState<boolean>(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return false;
    if (typeof window.matchMedia !== "function") return false; // jsdom / non-browser
    try {
      if (window.localStorage.getItem(doneKey)) return false;
    } catch {
      return false;
    }
    if (external) return (props.turn ?? 0) === 0;
    const g = useGameStore.getState().game;
    return g !== null && g.turn === 0;
  });

  const [armed, setArmed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mobile, setMobile] = useState(false);
  const baseTurn = useRef<number>(
    external ? (props.turn ?? 0) : (useGameStore.getState().game?.turn ?? 0),
  );

  // US store subscriptions (ignored when external props drive the coach).
  const usTotalTurns = useGameStore((s) => s.game?.totalTurns ?? 0);
  const usSelected = useGameStore((s) => s.selectedStateId);
  const usQueued = useGameStore((s) => s.game?.queuedActions.length ?? 0);
  const usTurn = useGameStore((s) => s.game?.turn ?? 0);

  const totalTurns = external ? (props.totalTurns ?? 0) : usTotalTurns;
  const selectedId = external ? (props.selectedId ?? null) : usSelected;
  const queuedLen = external ? (props.queuedLen ?? 0) : usQueued;
  const turn = external ? (props.turn ?? 0) : usTurn;

  const active = eligible && armed && !dismissed;

  useEffect(() => {
    if (!eligible) return;
    const t = window.setTimeout(() => setArmed(true), 600);
    return () => window.clearTimeout(t);
  }, [eligible]);

  useEffect(() => {
    if (!eligible) return;
    const mq = window.matchMedia("(max-width: 768px)");
    const fn = () => setMobile(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [eligible]);

  useEffect(() => {
    if (active && step === 1 && selectedId !== null) setStep(2);
  }, [active, step, selectedId]);
  useEffect(() => {
    if (active && step === 3 && queuedLen > 0) setStep(4);
  }, [active, step, queuedLen]);
  useEffect(() => {
    if (active && step === 4 && turn > baseTurn.current) setStep(5);
  }, [active, step, turn]);

  useEffect(() => {
    if (!active) return;
    const el = steps[step].target(window.matchMedia("(max-width: 768px)").matches);
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
  }, [active, step, steps]);

  useEffect(() => {
    if (!active) return;
    const update = () => {
      const el = steps[step].target(window.matchMedia("(max-width: 768px)").matches);
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
  }, [active, step, steps]);

  if (!active) return null;

  const finish = () => {
    try {
      window.localStorage.setItem(doneKey, "1");
    } catch {
      /* private mode etc. */
    }
    setDismissed(true);
  };
  const advance = () => (step >= steps.length - 1 ? finish() : setStep(step + 1));

  const s = steps[step];
  const body = s.body.replace("{N}", String(totalTurns));

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
        <div className="coach-eyebrow">TOUR · {step + 1}/{steps.length}</div>
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
