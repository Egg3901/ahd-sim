// ELECTION NIGHT — the staged reveal that plays before each results screen.
// Results are already final when this mounts; the component is pure theater,
// sequencing the calls for drama: safe units flood in first in waves, the
// tightest races hold back as "too close to call" and resolve one by one, and
// the moment a party's running tally crosses the winning post a full-width
// projection banner fires. One shared component drives all three engines
// (US / UK / country) via the normalized RevealProps shape (see adapters.ts).
import { useEffect, useMemo, useRef, useState } from "react";
import "./electionNight.css";

export interface RevealUnit {
  id: string;
  name: string;
  abbr: string;
  winnerId: string; // party id the tally credits this unit to
  winnerColor: string;
  winnerShort: string;
  units: number; // EV or seats
  margin: number; // winner's margin in points, for drama ordering
  upset?: boolean; // flipped vs the scenario baseline
}

export interface RevealParty {
  id: string;
  short: string;
  color: string;
}

// Optional real-geography map: SVG paths keyed by unit id. Units without a
// shape (e.g. ME/NE congressional districts) simply don't appear on the map —
// their calls still show up in the callout and chip feed.
export interface RevealMap {
  viewBox: string;
  shapes: Record<string, { d: string; label?: [number, number] }>;
}

export interface RevealProps {
  title: string; // "Election Night · 1984"
  totalUnits: number; // 538 / 650 / 343…
  threshold: number; // 270 / 326 / 172…
  parties: RevealParty[]; // running tally rows (top 4 + others for multiparty)
  units: RevealUnit[]; // ALL units, with final winners
  playerPartyId: string;
  unitLabel?: string; // "EV" | "seats" | "points"
  map?: RevealMap; // live-filling map centerpiece; omitted ⇒ chip-only layout
  noMajorityLabel?: string; // hung-parliament / contingent-election banner text
  storageKey?: string; // sessionStorage key so refresh/resume doesn't replay
  onDone: () => void;
}

// Tally row id for the aggregated small parties in multiparty elections.
export const OTHERS_ID = "__others";

// Whether this environment can meaningfully play the reveal at all. jsdom /
// non-browser renders have no matchMedia; the results screens skip straight
// to the full results there instead of mounting dead theater.
export function revealSupported(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

export function hasSeenReveal(key: string): boolean {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
function markSeen(key?: string) {
  if (!key) return;
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* private mode etc. — replaying is harmless */
  }
}

const prefersReduced = () =>
  typeof window === "undefined" ||
  typeof window.matchMedia !== "function" ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Choreography schedule ────────────────────────────────────────────────
// The whole reveal is precomputed as a flat timeline of entries with absolute
// times (ms at 1x). The driver just steps an index through it; speed changes
// scale the remaining gaps, "instant" jumps to the end.
export interface ScheduleEntry {
  at: number; // ms from t0 at 1x speed
  kind: "wave" | "call" | "cliff" | "end";
  unit?: RevealUnit;
  wave?: number; // 1-based, on wave markers and wave calls
  isCliff?: boolean; // call belongs to the too-close-to-call endgame
  projectedId?: string; // set on the call whose tally crosses the threshold
}

const POLLS_BEAT = 1300; // "polls are closing…" hold
const WAVE_BEAT = 400; // pause after each wave banner
const CALL_STAGGER = 110; // between calls inside a wave
const WAVE_GAP = 1800; // between waves (tally bars animate)
const CLIFF_INTRO = 1700; // "too close to call" hold before the endgame
const CLIFF_GAP_MIN = 1000; // first cliffhanger resolves fastest…
const CLIFF_GAP_EXTRA = 1300; // …the tightest race waits the longest
const PROJECTION_PAUSE = 2200; // dramatic beat after the projection call
const END_HOLD = 1400; // hold on the final board before the CTA

export function buildSchedule(
  units: RevealUnit[],
  threshold: number,
): { entries: ScheduleEntry[]; waveCount: number; projectedId: string | null } {
  const sorted = [...units].sort((a, b) => b.margin - a.margin);
  const n = sorted.length;
  // The closest ~8 races get individual "too close to call" drama at the end.
  const cliffN = Math.min(8, Math.floor(n / 3));
  const safe = sorted.slice(0, n - cliffN);
  const cliff = sorted.slice(n - cliffN); // desc margin → tightest resolves LAST
  const waveCount = Math.max(1, Math.min(6, Math.ceil(safe.length / 3)));
  const perWave = Math.ceil(safe.length / waveCount);

  const entries: ScheduleEntry[] = [];
  const tally = new Map<string, number>();
  let projectedId: string | null = null;
  let t = POLLS_BEAT;

  const pushCall = (u: RevealUnit, wave?: number, isCliff?: boolean) => {
    const e: ScheduleEntry = { at: t, kind: "call", unit: u, wave, isCliff };
    if (!projectedId) {
      const v = (tally.get(u.winnerId) ?? 0) + u.units;
      tally.set(u.winnerId, v);
      if (v >= threshold) {
        projectedId = u.winnerId;
        e.projectedId = u.winnerId;
        t += PROJECTION_PAUSE; // let the banner land
      }
    }
    entries.push(e);
  };

  for (let w = 0; w < waveCount; w++) {
    const slice = safe.slice(w * perWave, (w + 1) * perWave);
    if (slice.length === 0) break;
    entries.push({ at: t, kind: "wave", wave: w + 1 });
    t += WAVE_BEAT;
    for (const u of slice) {
      pushCall(u, w + 1);
      t += CALL_STAGGER;
    }
    t += WAVE_GAP;
  }

  if (cliff.length > 0) {
    entries.push({ at: t, kind: "cliff" });
    t += CLIFF_INTRO;
    cliff.forEach((u, i) => {
      t += CLIFF_GAP_MIN + (i / Math.max(1, cliff.length - 1)) * CLIFF_GAP_EXTRA;
      pushCall(u, undefined, true);
    });
  }

  t += END_HOLD;
  entries.push({ at: t, kind: "end" });
  return { entries, waveCount, projectedId };
}

type Speed = "1x" | "2x" | "instant";

export function ElectionNight(props: RevealProps) {
  const { title, totalUnits, threshold, parties, units, playerPartyId, storageKey, map, onDone } = props;
  const unitLabel = props.unitLabel ?? "seats";
  const noMajorityLabel = props.noMajorityLabel ?? "NO OVERALL MAJORITY: HUNG PARLIAMENT";

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const { entries, waveCount } = useMemo(() => buildSchedule(units, threshold), [units, threshold]);

  // Reduced-motion users get the final board immediately (no theater).
  const [speed, setSpeed] = useState<Speed>(() => (prefersReduced() ? "instant" : "1x"));
  const [idx, setIdx] = useState(0); // number of schedule entries executed
  const finished = idx >= entries.length;

  // Already seen this game's reveal (refresh / resume) → straight through.
  useEffect(() => {
    if (storageKey && hasSeenReveal(storageKey)) onDoneRef.current();
  }, [storageKey]);

  // Driver: one timer per step; gaps scale with speed, instant jumps to end.
  useEffect(() => {
    if (finished) return;
    if (speed === "instant") {
      setIdx(entries.length);
      return;
    }
    const factor = speed === "2x" ? 2 : 1;
    const prevAt = idx === 0 ? 0 : entries[idx - 1].at;
    const delay = Math.max(30, (entries[idx].at - prevAt) / factor);
    const h = setTimeout(() => setIdx((i) => i + 1), delay);
    return () => clearTimeout(h);
  }, [idx, speed, finished, entries]);

  // Sequence complete: persist "seen"; in instant mode, hold briefly on the
  // final board and then advance to the full results automatically.
  useEffect(() => {
    if (!finished) return;
    markSeen(storageKey);
    if (speed === "instant") {
      const h = setTimeout(() => onDoneRef.current(), 1500);
      return () => clearTimeout(h);
    }
  }, [finished, speed, storageKey]);

  const skip = () => {
    markSeen(storageKey);
    onDoneRef.current();
  };

  // ── Derived board state from the executed prefix ──
  const executed = entries.slice(0, idx);
  const calls = executed.filter((e) => e.kind === "call");
  const tallies: Record<string, number> = {};
  let calledUnits = 0;
  const calledById = new Map<string, RevealUnit>();
  for (const c of calls) {
    const u = c.unit!;
    tallies[u.winnerId] = (tallies[u.winnerId] ?? 0) + u.units;
    calledUnits += u.units;
    calledById.set(u.id, u);
  }
  const knownSum = parties.reduce((s, p) => (p.id === OTHERS_ID ? s : s + (tallies[p.id] ?? 0)), 0);
  const othersTotal = Math.max(0, calledUnits - knownSum);
  const remaining = Math.max(0, totalUnits - calledUnits);

  const lastCall = calls.length > 0 ? calls[calls.length - 1] : null;
  const inCliff = executed.some((e) => e.kind === "cliff");
  const currentWave = lastCall?.wave ?? executed.filter((e) => e.kind === "wave").length;

  // Projection: the executed call that crossed the threshold (if any).
  const projEntry = executed.find((e) => e.projectedId);
  const projected = projEntry
    ? (parties.find((p) => p.id === projEntry.projectedId) ?? {
        id: projEntry.projectedId!,
        short: projEntry.unit!.winnerShort,
        color: projEntry.unit!.winnerColor,
      })
    : null;

  // Too-close-to-call chips: cliff calls not yet executed.
  const pendingCliff = inCliff && !finished ? entries.slice(idx).filter((e) => e.isCliff) : [];

  const status = finished
    ? "ALL RESULTS IN"
    : inCliff
      ? "TOO CLOSE TO CALL"
      : calls.length === 0
        ? "POLLS ARE CLOSING"
        : `CALLS COMING IN · WAVE ${currentWave} OF ${waveCount}`;

  return (
    <div className="en-root">
      <div className={`card sheen en-stage${map ? " with-map" : ""}`}>
        <div className="en-top">
          <div>
            <div className="en-eyebrow">
              <span className="en-live" /> LIVE · ELECTION NIGHT
            </div>
            <h2 className="en-title">{title}</h2>
          </div>
          <div className="en-controls">
            {(["1x", "2x", "instant"] as const).map((s) => (
              <button
                key={s}
                className={`en-speed${speed === s ? " active" : ""}`}
                onClick={() => setSpeed(s)}
                title={s === "instant" ? "Skip straight to the final board" : `Play at ${s}`}
              >
                {s === "instant" ? "⚡" : s.replace("x", "×")}
              </button>
            ))}
            <button className="en-skip" onClick={skip}>Skip ⏭</button>
          </div>
        </div>

        <div className={`en-status${inCliff && !finished ? " gold" : ""}`}>{status}</div>

        {map && (
          <div className={`en-map${speed === "instant" ? " instant" : ""}`}>
            <svg viewBox={map.viewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Election map">
              {units.map((u) => {
                const shape = map.shapes[u.id];
                if (!shape) return null;
                const called = calledById.get(u.id);
                return (
                  <path
                    key={u.id}
                    d={shape.d}
                    className={`en-map-unit${called ? " called" : ""}`}
                    style={called ? { fill: called.winnerColor } : undefined}
                  >
                    <title>{called ? `${u.name} · ${called.winnerShort}` : u.name}</title>
                  </path>
                );
              })}
              {/* Upset rings render in a second pass so the gold pulse sits on top. */}
              {units.map((u) => {
                const called = calledById.get(u.id);
                if (!called?.upset || !map.shapes[u.id]) return null;
                return <path key={`ring-${u.id}`} d={map.shapes[u.id].d} className="en-map-upset-ring" />;
              })}
            </svg>
          </div>
        )}

        <div className="en-callout">
          {lastCall ? (
            <span className="en-call-flash" key={lastCall.unit!.id}>
              <span className="en-call-label">{lastCall.unit!.upset ? "UPSET" : "CALL"}</span>
              <span className="en-call-name">{lastCall.unit!.name}</span>
              <span className="en-call-winner" style={{ color: lastCall.unit!.winnerColor }}>
                → {lastCall.unit!.winnerShort}
              </span>
              <span className="en-call-margin">+{lastCall.unit!.margin.toFixed(1)}</span>
            </span>
          ) : (
            <span className="en-polls-closing">POLLS ARE CLOSING…</span>
          )}
        </div>

        {projected && (
          <div className="en-banner" style={{ background: projected.color }}>
            PROJECTION: {projected.short} WINS
          </div>
        )}
        {finished && !projected && <div className="en-banner hung">{noMajorityLabel}</div>}

        <div className="en-board">
          {parties.map((p) => {
            const val = p.id === OTHERS_ID ? othersTotal : (tallies[p.id] ?? 0);
            return (
              <div className={`en-row${p.id === playerPartyId ? " mine" : ""}`} key={p.id}>
                <span className="en-party" style={{ color: p.color }}>{p.short}</span>
                <div className="en-track">
                  <div className="en-fill" style={{ width: `${totalUnits > 0 ? (val / totalUnits) * 100 : 0}%`, background: p.color }} />
                  <div className="en-thresh" style={{ left: `${totalUnits > 0 ? (threshold / totalUnits) * 100 : 50}%` }} />
                </div>
                <span className="en-num">{val}</span>
              </div>
            );
          })}
        </div>

        <div className="en-remaining">
          {remaining} {unitLabel} still out · {threshold} to win
        </div>

        <div className="en-feed">
          {pendingCliff.map((e) => (
            <span className="en-chip tctc" key={`tctc-${e.unit!.id}`}>
              {e.unit!.abbr} · TOO CLOSE TO CALL
            </span>
          ))}
          {[...calls].reverse().slice(0, 14).map((c) => (
            <span className={`en-chip${c.unit!.upset ? " upset" : ""}`} key={c.unit!.id}>
              <span className="en-chip-call">CALL</span>
              {c.unit!.abbr}
              <span style={{ color: c.unit!.winnerColor }}>{c.unit!.winnerShort}</span>
              {c.unit!.upset && <span className="en-chip-upset-tag">UPSET</span>}
            </span>
          ))}
        </div>

        {finished && (
          <button className="primary en-cta" onClick={skip}>
            See full results →
          </button>
        )}
      </div>
    </div>
  );
}
