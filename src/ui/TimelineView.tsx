import { useState } from "react";
import type { ReplayLog, ReplaySnapshot } from "@lib/replay";
import { Sparkline } from "./Sparkline";
import { money } from "./format";
import { History } from "lucide-react";

// Read-only campaign timeline. Scrub across recorded turns and see the polling
// numbers, the map standings, and what the player did / what happened that
// week. It NEVER writes back to the live game (no jump-to-turn, no state load),
// so it can never be used to time-travel or cheat a scored run.

const partyColor = (log: ReplayLog, id: string) =>
  log.parties.find((p) => p.id === id)?.color ?? "var(--muted)";
const partyName = (log: ReplayLog, id: string) =>
  log.parties.find((p) => p.id === id)?.name ?? id;

function turnLabel(log: ReplayLog, turn: number): string {
  if (turn === 0) return "Campaign start";
  if (turn >= log.totalTurns) return "Election eve";
  return `Week ${turn}`;
}

const pts = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;

export function TimelineView({ log, onClose }: { log: ReplayLog; onClose: () => void }) {
  const snaps = [...log.snapshots].sort((a, b) => a.turn - b.turn);
  const [idx, setIdx] = useState(snaps.length - 1);

  if (snaps.length === 0) {
    return (
      <div className="overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
          <div className="head"><h2>Campaign Timeline</h2></div>
          <div className="body"><p className="muted">The timeline fills in as you play each week.</p></div>
        </div>
      </div>
    );
  }

  const snap = snaps[Math.min(idx, snaps.length - 1)];
  const prev = idx > 0 ? snaps[idx - 1] : null;
  const player = log.playerId;
  const rivalId = snap.standings.find((s) => s.id !== player)?.id ?? null;

  const playerStanding = snap.standings.find((s) => s.id === player);
  const rivalStanding = rivalId ? snap.standings.find((s) => s.id === rivalId) : null;

  // National margin (player minus strongest rival) trend up to the shown turn.
  const marginSeries = snaps.slice(0, idx + 1).map((s: ReplaySnapshot) => {
    const me = s.standings.find((x) => x.id === player)?.poll ?? 0.5;
    const rv = rivalId ? s.standings.find((x) => x.id === rivalId)?.poll ?? 0.5 : 0.5;
    return me - rv;
  });

  const unitDelta = prev && playerStanding
    ? playerStanding.units - (prev.standings.find((s) => s.id === player)?.units ?? 0)
    : 0;
  const marginNow = playerStanding && rivalStanding ? (playerStanding.poll - rivalStanding.poll) * 100 : 0;

  // The closest contests on this turn (nearest to a coin flip), player-perspective.
  const closest = Object.entries(snap.contestShare)
    .map(([id, share]) => ({ id, share }))
    .sort((a, b) => Math.abs(a.share - 0.5) - Math.abs(b.share - 0.5))
    .slice(0, 6);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="head">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="tag"><History size={12} style={{ verticalAlign: "-2px", marginRight: 6 }} />REPLAY</div>
              <h2>Campaign Timeline</h2>
            </div>
            <button className="ghost" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="body">
          {/* Scrubber */}
          <div className="field" style={{ marginBottom: 6 }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
              <strong>{turnLabel(log, snap.turn)}</strong>
              <span className="muted small">{idx + 1} / {snaps.length}</span>
            </div>
            <input
              type="range"
              min={0}
              max={snaps.length - 1}
              value={idx}
              onChange={(e) => setIdx(Number(e.target.value))}
            />
          </div>

          {/* Standings */}
          <div className="row" style={{ gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            {snap.standings.map((s) => (
              <div key={s.id} className="card" style={{ flex: "1 1 160px", padding: 12 }}>
                <div style={{ color: partyColor(log, s.id), fontWeight: 700 }}>{partyName(log, s.id)}</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{s.units}</div>
                <div className="muted small">{log.unitLabel} · {(s.poll * 100).toFixed(1)}% poll</div>
              </div>
            ))}
            {snap.tossupUnits > 0 && (
              <div className="card" style={{ flex: "1 1 120px", padding: 12 }}>
                <div className="muted" style={{ fontWeight: 700 }}>Tossup</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{snap.tossupUnits}</div>
                <div className="muted small">still in play</div>
              </div>
            )}
          </div>

          {/* What changed vs last week */}
          <div className="card" style={{ padding: "10px 14px", marginBottom: 12 }}>
            <div className="row" style={{ gap: 18, flexWrap: "wrap" }}>
              <span>Your margin: <strong>{pts(marginNow)} pts</strong></span>
              {prev && <span className="muted">This week: <strong className={unitDelta >= 0 ? "up" : "down"}>{unitDelta >= 0 ? "+" : ""}{unitDelta} {log.unitLabel}</strong></span>}
              {snap.playerCash !== undefined && <span className="muted">Cash: {money(snap.playerCash)}</span>}
              {snap.playerMomentum !== undefined && <span className="muted">Momentum: {snap.playerMomentum.toFixed(0)}</span>}
            </div>
            {marginSeries.length >= 2 && (
              <div style={{ marginTop: 8 }}>
                <Sparkline values={marginSeries} color={partyColor(log, player)} mid={0} width={320} height={40} />
              </div>
            )}
          </div>

          <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
            {/* Actions + events this week */}
            <div className="card" style={{ flex: "1 1 300px", padding: 12 }}>
              <h3 style={{ marginTop: 0 }}>This week</h3>
              {snap.turn === 0 ? (
                <p className="muted small">Opening baseline, before any campaigning.</p>
              ) : (
                <>
                  {snap.actions.length > 0 ? (
                    <ul className="tl-list">{snap.actions.map((a, i) => <li key={`a${i}`}>{a}</li>)}</ul>
                  ) : (
                    <p className="muted small">No moves this week.</p>
                  )}
                  {snap.events.length > 0 && (
                    <ul className="tl-list muted">{snap.events.map((e, i) => <li key={`e${i}`}>{e}</li>)}</ul>
                  )}
                </>
              )}
            </div>

            {/* Closest contests this turn */}
            <div className="card" style={{ flex: "1 1 220px", padding: 12 }}>
              <h3 style={{ marginTop: 0 }}>Closest contests</h3>
              {closest.length === 0 ? (
                <p className="muted small">No per-contest data.</p>
              ) : (
                <ul className="tl-list">
                  {closest.map(({ id, share }) => (
                    <li key={id}>
                      <span>{log.contestNames[id] ?? id}</span>{" "}
                      <span className={share >= 0.5 ? "up" : "down"}>
                        {share >= 0.5 ? "lead" : "behind"} {pts((share - 0.5) * 100)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
