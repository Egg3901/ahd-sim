import { useMemo } from "react";
import { useGameStore } from "@store/gameStore";
import type { CandidateId, TurnPoint } from "@engine/index";
import { money } from "./format";
import { BarChart3 } from "lucide-react";

// ── Inline SVG line chart ──────────────────────────────────────────────
interface Series {
  color: string;
  label: string;
  values: number[];
}
interface RefLine {
  y: number;
  label: string;
}

function TrendChart({
  labels,
  series,
  yMin,
  yMax,
  fmtY,
  refLines = [],
  height = 196,
}: {
  labels: string[];
  series: Series[];
  yMin: number;
  yMax: number;
  fmtY: (v: number) => string;
  refLines?: RefLine[];
  height?: number;
}) {
  const W = 620;
  const H = height;
  const padL = 46, padR = 16, padT = 12, padB = 28;
  const n = labels.length;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const span = yMax - yMin || 1;
  const x = (i: number) => (n <= 1 ? padL + innerW / 2 : padL + (innerW * i) / (n - 1));
  const y = (v: number) => padT + innerH * (1 - (v - yMin) / span);

  // A few evenly spaced y gridlines/ticks.
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + t * span);
  // Avoid crowding the x-axis: thin labels out when there are many weeks.
  const labelStep = n > 8 ? 2 : 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="trendchart" preserveAspectRatio="xMidYMid meet">
      {/* y gridlines + ticks */}
      {yTicks.map((v, i) => (
        <g key={`yt${i}`}>
          <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} className="tc-grid" />
          <text x={padL - 8} y={y(v) + 3} className="tc-ytick" textAnchor="end">{fmtY(v)}</text>
        </g>
      ))}
      {/* reference lines (270, tie, etc.) */}
      {refLines.map((r, i) => (
        <g key={`rl${i}`}>
          <line x1={padL} x2={W - padR} y1={y(r.y)} y2={y(r.y)} className="tc-ref" />
          <text x={W - padR} y={y(r.y) - 4} className="tc-reflabel" textAnchor="end">{r.label}</text>
        </g>
      ))}
      {/* x labels */}
      {labels.map((lab, i) =>
        i % labelStep === 0 || i === n - 1 ? (
          <text key={`xl${i}`} x={x(i)} y={H - 9} className="tc-xtick" textAnchor="middle">{lab}</text>
        ) : null,
      )}
      {/* series */}
      {series.map((s, si) => {
        const d = s.values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
        return (
          <g key={`s${si}`}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={2.6} fill={s.color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="tc-legend">
      {items.map((it, i) => (
        <span key={i} className="tc-legend-item">
          <span className="tc-swatch" style={{ background: it.color }} /> {it.label}
        </span>
      ))}
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="stat-cell">
      <div className="stat-cell-v" style={color ? { color } : undefined}>{value}</div>
      <div className="stat-cell-l">{label}</div>
    </div>
  );
}

const signedPts = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;

export function StatsScreen({ onClose }: { onClose: () => void }) {
  const game = useGameStore((s) => s.game)!;
  const cands = game.candidates;
  const dem = cands.dem;
  const rep = cands.rep;
  const tl: TurnPoint[] = game.timeline ?? [];

  const player: CandidateId = game.playerCandidate;

  const labelFor = (turn: number) =>
    turn === 0 ? "Start" : turn >= game.totalTurns ? "Eve" : `Wk ${turn}`;

  // Player-perspective two-party poll margin, in points (+ = player ahead).
  const playerMargin = (p: TurnPoint) => {
    const share = player === "dem" ? p.demPoll : 1 - p.demPoll;
    return (2 * share - 1) * 100;
  };
  const playerEV = (p: TurnPoint) => (player === "dem" ? p.demEV : p.repEV);

  const stats = useMemo(() => {
    if (tl.length === 0) return null;
    const first = tl[0];
    const last = tl[tl.length - 1];
    const marginNow = playerMargin(last);
    const marginStart = playerMargin(first);
    // EV lead changes across the campaign (sign flips of dem−rep).
    let leadChanges = 0;
    let prevSign = 0;
    for (const p of tl) {
      const s = Math.sign(p.demEV - p.repEV);
      if (s !== 0 && prevSign !== 0 && s !== prevSign) leadChanges++;
      if (s !== 0) prevSign = s;
    }
    const peakEV = Math.max(...tl.map(playerEV));
    const lowEV = Math.min(...tl.map(playerEV));
    return { first, last, marginNow, marginStart, leadChanges, peakEV, lowEV };
  }, [tl]);

  const labels = tl.map((p) => labelFor(p.turn));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal stats" onClick={(e) => e.stopPropagation()}>
        <div className="head">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="tag"><BarChart3 size={12} style={{ verticalAlign: "-2px", marginRight: 6 }} />RACE STATS</div>
              <h2>Campaign Trends</h2>
            </div>
            <button className="ghost" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="body">
          {!stats ? (
            <p className="muted">Trends become available once the first week is in the books.</p>
          ) : (
            <>
              {/* ── Headline numbers ─────────────────────────────────── */}
              <div className="stat-grid">
                <StatCell
                  label="Electoral votes"
                  value={`${stats.last.demEV}–${stats.last.repEV}`}
                  color={stats.last.demEV >= stats.last.repEV ? dem.color : rep.color}
                />
                <StatCell
                  label={`${(player === "dem" ? dem : rep).shortName} national margin`}
                  value={`${signedPts(stats.marginNow)} pts`}
                  color={stats.marginNow >= 0 ? (player === "dem" ? dem.color : rep.color) : "var(--muted)"}
                />
                <StatCell label="Swing since Labor Day" value={`${signedPts(stats.marginNow - stats.marginStart)} pts`} />
                <StatCell label="EV lead changes" value={String(stats.leadChanges)} />
                <StatCell label="Your peak / floor EV" value={`${stats.peakEV} / ${stats.lowEV}`} />
                <StatCell label="Cash on hand" value={money(player === "dem" ? stats.last.demCash : stats.last.repCash)} />
              </div>

              {/* ── National polling trend ───────────────────────────── */}
              <div className="chart-block">
                <div className="chart-title">National Polling Average — {(player === "dem" ? dem : rep).shortName}'s two-party margin</div>
                <TrendChart
                  labels={labels}
                  series={[{ color: (player === "dem" ? dem : rep).color, label: "Margin", values: tl.map(playerMargin) }]}
                  yMin={Math.min(-6, Math.floor(Math.min(...tl.map(playerMargin)) - 2))}
                  yMax={Math.max(6, Math.ceil(Math.max(...tl.map(playerMargin)) + 2))}
                  fmtY={(v) => `${v > 0 ? "+" : ""}${v.toFixed(0)}`}
                  refLines={[{ y: 0, label: "Tie" }]}
                />
              </div>

              {/* ── Electoral vote trend ─────────────────────────────── */}
              <div className="chart-block">
                <div className="chart-title">Electoral Vote Projection</div>
                <TrendChart
                  labels={labels}
                  series={[
                    { color: dem.color, label: dem.shortName, values: tl.map((p) => p.demEV) },
                    { color: rep.color, label: rep.shortName, values: tl.map((p) => p.repEV) },
                  ]}
                  yMin={0}
                  yMax={538}
                  fmtY={(v) => v.toFixed(0)}
                  refLines={[{ y: 270, label: "270 to win" }]}
                />
                <Legend items={[{ color: dem.color, label: dem.shortName }, { color: rep.color, label: rep.shortName }]} />
              </div>

              {/* ── Momentum trend ───────────────────────────────────── */}
              <div className="chart-block">
                <div className="chart-title">National Momentum</div>
                <TrendChart
                  labels={labels}
                  series={[
                    { color: dem.color, label: dem.shortName, values: tl.map((p) => p.demMomentum) },
                    { color: rep.color, label: rep.shortName, values: tl.map((p) => p.repMomentum) },
                  ]}
                  yMin={-100}
                  yMax={100}
                  fmtY={(v) => v.toFixed(0)}
                  refLines={[{ y: 0, label: "" }]}
                  height={150}
                />
                <Legend items={[{ color: dem.color, label: dem.shortName }, { color: rep.color, label: rep.shortName }]} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
