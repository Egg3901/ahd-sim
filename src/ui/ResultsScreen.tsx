import { useEffect, useMemo, useState } from "react";
import { useGameStore } from "@store/gameStore";
import { GRID, SPLIT_UNITS, GRID_COLS, GRID_ROWS } from "@content/mapLayout";
import { STATE_PATHS } from "@content/statePaths";
import type { Projection } from "@engine/index";
import { EvBar } from "./EvBar";
import { money, pct } from "./format";

const prefersReduced = () =>
  typeof window === "undefined" ||
  typeof window.matchMedia !== "function" ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ResultsScreen() {
  const game = useGameStore((s) => s.game)!;
  const newGame = useGameStore((s) => s.newGame);
  const result = game.result!;
  const cands = game.candidates;
  const dem = cands.dem.shortName;
  const rep = cands.rep.shortName;

  const byState = useMemo(() => new Map(result.stateResults.map((s) => [s.stateId, s])), [result]);
  const evOf = (id: string) => game.states.find((s) => s.id === id)?.electoralVotes ?? 0;

  // Call order: safe states first, the closest battlegrounds last — for drama.
  const calls = useMemo(
    () => [...result.stateResults].sort((a, b) => Math.abs(b.demShare - 0.5) - Math.abs(a.demShare - 0.5)),
    [result],
  );

  const [revealed, setRevealed] = useState(() => (prefersReduced() ? calls.length : 0));
  const [mapMode, setMapMode] = useState<"geo" | "square">("geo");
  const done = revealed >= calls.length;

  useEffect(() => {
    if (done) return;
    // Slow down for the final, decisive calls.
    const delay = revealed > calls.length - 8 ? 280 : 70;
    const t = setTimeout(() => setRevealed((r) => Math.min(calls.length, r + 1)), delay);
    return () => clearTimeout(t);
  }, [revealed, calls.length, done]);

  const calledIds = useMemo(() => new Set(calls.slice(0, revealed).map((c) => c.stateId)), [calls, revealed]);
  let demEV = 0;
  let repEV = 0;
  for (const c of calls.slice(0, revealed)) {
    if (c.winner === "dem") demEV += evOf(c.stateId);
    else repEV += evOf(c.stateId);
  }
  const tossupEV = Math.max(0, 538 - demEV - repEV);
  const lastCalled = revealed > 0 ? game.states.find((s) => s.id === calls[revealed - 1].stateId) : null;

  const winnerName = result.winner === "tie" ? "No one — 269–269" : cands[result.winner].name;
  const playerWon = result.winner === game.playerCandidate;

  const tile = (id: string, size?: number) => {
    const sr = byState.get(id);
    const st = game.states.find((s) => s.id === id);
    if (!sr || !st) return null;
    const called = calledIds.has(id);
    return (
      <div
        className={`tile${called ? " called" : ""}`}
        key={id}
        style={{ background: called ? cands[sr.winner].color : "var(--navy-600)", opacity: called ? 1 : 0.45, width: size }}
        title={`${st.name}: ${called ? (sr.winner === "dem" ? dem : rep) + " +" + sr.margin.toFixed(1) : "—"}`}
      >
        <span>{st.abbr}</span>
        <span className="ev">{st.electoralVotes}</span>
      </div>
    );
  };

  return (
    <div className="center">
      <div className="results scroll">
        {/* Election-night call counter / verdict */}
        <div className="bigresult">
          {!done ? (
            <>
              <div className="tag muted small" style={{ letterSpacing: "3px", color: "var(--gold)" }}>
                {lastCalled ? `CALLING ${lastCalled.name.toUpperCase()}…` : "POLLS CLOSING…"}
              </div>
              <div className="ev" style={{ color: "var(--text-strong)" }}>{demEV}<span style={{ color: "var(--muted)", fontWeight: 600 }}> – </span>{repEV}</div>
              <div className="muted">270 to win · {tossupEV} EV still out</div>
            </>
          ) : (
            <>
              <div className="tag muted small" style={{ letterSpacing: "3px", color: "var(--gold)" }}>
                {result.winner === "tie" ? "CONTINGENT ELECTION" : "PROJECTED WINNER"}
              </div>
              <div className="who" style={{ color: result.winner === "tie" ? "var(--gold)" : cands[result.winner].color }}>
                {winnerName}
              </div>
              {result.winner !== "tie" && (
                <div className="ev" style={{ color: cands[result.winner].color }}>{result.electoralVotes[result.winner]}</div>
              )}
              <div className="muted">
                {dem} {result.electoralVotes.dem} — {rep} {result.electoralVotes.rep} ·
                Popular vote: {dem} {pct(result.popularShare.dem)} ({money(result.popularVote.dem)} votes)
              </div>
              {result.winner === "tie" ? (
                <p className="muted small" style={{ marginTop: 8 }}>
                  Neither ticket reached 270. The election is thrown to the House of Representatives, where each state delegation casts a single vote. The campaign is over; the contingent election is another story.
                </p>
              ) : (
                <h2 style={{ marginTop: 8, color: playerWon ? "var(--green)" : "var(--rose)" }}>
                  {playerWon ? "You won the campaign." : "You came up short."}
                </h2>
              )}
            </>
          )}
        </div>

        <div style={{ marginBottom: 18 }}>
          <EvBar projection={{ ev: { dem: demEV, rep: repEV }, tossupEv: tossupEV, contests: [] } as unknown as Projection} />
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ margin: 0 }}>{done ? "Final Map" : "Election Night"}</h3>
            <div className="row" style={{ gap: 6 }}>
              <button className={`ghost small${mapMode === "geo" ? " active" : ""}`} onClick={() => setMapMode("geo")}>Geo</button>
              <button className={`ghost small${mapMode === "square" ? " active" : ""}`} onClick={() => setMapMode("square")}>Square</button>
              {!done && <button className="ghost small" onClick={() => setRevealed(calls.length)}>Skip ⏭</button>}
            </div>
          </div>

          {mapMode === "geo" ? (
            <svg viewBox="0 0 1000 650" className="geo-map" preserveAspectRatio="xMidYMid meet" style={{ maxWidth: 640, margin: "10px auto 0" }}>
              {[...GRID.map((t) => t.id), ...SPLIT_UNITS.map((g) => g.ids.find((id) => id.endsWith("-AL"))).filter(Boolean) as string[]].map((id) => {
                const sr = byState.get(id);
                const path = STATE_PATHS[id] ?? STATE_PATHS[id.split("-")[0]];
                if (!sr || !path) return null;
                const called = calledIds.has(id);
                const st = game.states.find((s) => s.id === id);
                return (
                  <path key={id} d={path}
                    fill={called ? cands[sr.winner].color : "#1b2740"}
                    stroke="#0b1120" strokeWidth={0.6}
                    style={{ transition: "fill 0.35s var(--ease)" }}>
                    <title>{st?.name}{called ? `: ${sr.winner === "dem" ? dem : rep} +${sr.margin.toFixed(1)}` : ""}</title>
                  </path>
                );
              })}
            </svg>
          ) : (
            <>
              <div className="tilegrid" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`, aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`, maxWidth: 560, margin: "10px auto 0" }}>
                {GRID.map((t) => (
                  <div key={t.id} style={{ gridColumn: t.col + 1, gridRow: t.row + 1 }}>{tile(t.id)}</div>
                ))}
              </div>
              <div className="splitstrip" style={{ justifyContent: "center", marginTop: 10 }}>
                {SPLIT_UNITS.map((g) => (
                  <div className="splitgroup" key={g.label}>
                    <span className="lab">{g.label}</span>
                    <div className="row">{g.ids.map((id) => tile(id, 34))}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {done && (
          <>
            <div className="card">
              <h3>Post-Mortem — What Moved the Needle</h3>
              <p className="muted small">Your biggest self-caused swings across the campaign.</p>
              {result.postMortem.length === 0 && <p className="muted small">A hands-off campaign. History took its course.</p>}
              {result.postMortem.map((c, i) => (
                <div className="recapitem" key={i}>
                  <div>
                    <div>{c.cause}</div>
                    <div className="muted small">Week {c.turn + 1}{c.stateId ? ` · ${c.stateId}` : ""}</div>
                  </div>
                  <span className={`delta ${c.marginDelta >= 0 ? "up" : "down"}`}>{c.marginDelta >= 0 ? "+" : ""}{c.marginDelta.toFixed(3)}</span>
                </div>
              ))}
            </div>

            <button className="primary" style={{ width: "100%", padding: 12, marginTop: 4 }}
              onClick={() => newGame({ seed: String(Date.now()), playerCandidate: game.playerCandidate, scenario: game.scenarioId, eventMode: game.eventMode })}>
              Run it back — New Campaign →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
