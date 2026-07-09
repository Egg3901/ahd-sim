// Election Night Reveal 2.0 — shared polished results overlay.
// Replaces the spreadsheet-style panels after the staged ElectionNight theater
// finishes. Presentation only: callers keep their own score-posting / auth /
// next-scenario wiring and pass the results in via props + children/footer.
import type { ReactNode } from "react";
import { RollingCounter } from "./RollingCounter";
import { Swingometer, type SwingometerProps } from "./Swingometer";
import "./shell.css";

export interface ShellNextScenario {
  title: string;
  blurb: string;
  unlocked: boolean;
  ctaLabel: string;
  lockLabel: string;
  onPlay: () => void;
  onUnlock: () => void;
  /** Optional mini map / cartogram preview shown beside the copy. */
  mapPreview?: ReactNode;
}

export interface ElectionNightShellProps {
  /** Uppercase strip above the headline — "PROJECTED WINNER", "HUNG PARLIAMENT". */
  eyebrow: string;
  /** Animated winner / hung headline. */
  headline: string;
  headlineColor?: string;
  /** One-line verdict under the headline. */
  subhead?: string;
  subheadTone?: "win" | "loss" | "neutral";

  /** Primary rolling counter (EV / seats). */
  counterValue: number;
  counterLabel: string;
  counterColor?: string;
  /** Optional secondary figure (e.g. popular-vote %). */
  secondaryCounter?: { value: number; label: string; decimals?: number; suffix?: string };

  swing: SwingometerProps;

  nextScenario?: ShellNextScenario | null;

  /** Mode-specific body: US call grid / map, UK seat bar, daily score, etc. */
  children?: ReactNode;
  /** Score posting, post-mortem, replay CTAs — kept intact by callers. */
  footer?: ReactNode;
}

export function ElectionNightShell({
  eyebrow,
  headline,
  headlineColor,
  subhead,
  subheadTone = "neutral",
  counterValue,
  counterLabel,
  counterColor,
  secondaryCounter,
  swing,
  nextScenario,
  children,
  footer,
}: ElectionNightShellProps) {
  return (
    <div className="ens-root" data-testid="election-night-shell">
      <div className="ens-hero">
        <div className="ens-eyebrow">{eyebrow}</div>
        <h1
          className="ens-headline"
          style={headlineColor ? { color: headlineColor } : undefined}
          data-testid="ens-headline"
        >
          {headline}
        </h1>
        {subhead && (
          <p className={`ens-subhead ens-${subheadTone}`} data-testid="ens-subhead">
            {subhead}
          </p>
        )}

        <div className="ens-counters">
          <div className="ens-counter-block">
            <RollingCounter
              value={counterValue}
              className="ens-counter"
              style={counterColor ? { color: counterColor } : undefined}
            />
            <div className="ens-counter-label">{counterLabel}</div>
          </div>
          {secondaryCounter && (
            <div className="ens-counter-block ens-secondary">
              <RollingCounter
                value={secondaryCounter.value}
                decimals={secondaryCounter.decimals ?? 1}
                className="ens-counter ens-counter-sm"
              />
              <div className="ens-counter-label">
                {secondaryCounter.label}
                {secondaryCounter.suffix ?? ""}
              </div>
            </div>
          )}
        </div>

        <Swingometer {...swing} />
      </div>

      {children && <div className="ens-body">{children}</div>}

      {nextScenario && <NextScenarioCard {...nextScenario} />}

      {footer && <div className="ens-footer">{footer}</div>}
    </div>
  );
}

function NextScenarioCard({
  title,
  blurb,
  unlocked,
  ctaLabel,
  lockLabel,
  onPlay,
  onUnlock,
  mapPreview,
}: ShellNextScenario) {
  return (
    <div className={`ens-next${unlocked ? "" : " locked"}`} data-testid="ens-next-scenario">
      <div className="ens-next-copy">
        <div className="ens-next-tag">{unlocked ? "NEXT SCENARIO" : "LOCKED SCENARIO"}</div>
        <div className="ens-next-title">{title}</div>
        <div className="ens-next-blurb">
          {blurb}
          {!unlocked ? " · locked" : ""}
        </div>
        {unlocked ? (
          <button className="secondary" onClick={onPlay}>{ctaLabel}</button>
        ) : (
          <button className="secondary" onClick={onUnlock}>{lockLabel}</button>
        )}
      </div>
      {mapPreview && <div className="ens-next-preview" aria-hidden>{mapPreview}</div>}
    </div>
  );
}
