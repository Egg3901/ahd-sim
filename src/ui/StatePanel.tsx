import { useGameStore } from "@store/gameStore";
import { tallyContest, pollState, pollAverage } from "@engine/index";
import { BLOCS } from "@content/blocs";
import { shareToColor, leanLabel } from "./colors";
import { pct } from "./format";
import { MapPin } from "lucide-react";

export function StatePanel() {
  const game = useGameStore((s) => s.game)!;
  const selectedId = useGameStore((s) => s.selectedStateId);
  const queueAction = useGameStore((s) => s.queueAction);
  const removeQueuedAction = useGameStore((s) => s.removeQueuedAction);
  const st = selectedId ? game.states.find((s) => s.id === selectedId) : null;

  if (!st) {
    return (
      <div className="card">
        <h3>State Detail</h3>
        <p className="muted small">Select a state on the map to inspect its demographic blocs, polling, and your operation there.</p>
      </div>
    );
  }

  // Aggregate units have no blocs of their own.
  if (st.blocs.length === 0) {
    return (
      <div className="card">
        <h3>{st.name} — {st.electoralVotes} EV</h3>
        <p className="muted small">At-large electors, awarded to the winner of this state's combined district vote.</p>
      </div>
    );
  }

  const tally = tallyContest(st);
  const player = game.playerCandidate;
  const dem = game.candidates.dem.shortName;
  const rep = game.candidates.rep.shortName;
  const polls = pollState(game, st.id);
  const avg = pollAverage(game, st.id);

  // "Travel here" queues (or cancels) a one-day campaign rally in this state.
  const travelIdx = game.queuedActions.findIndex(
    (a) => a.type === "rally" && a.candidate === player && a.stateId === st.id,
  );
  const traveling = travelIdx >= 0;
  const toggleTravel = () => {
    if (traveling) removeQueuedAction(travelIdx);
    else queueAction({ type: "rally", candidate: player, stateId: st.id, days: 1 });
  };

  return (
    <div className="card scroll">
      <h3>{st.name} — {st.electoralVotes} EV</h3>
      <button
        className={traveling ? "primary" : "secondary"}
        onClick={toggleTravel}
        style={{ width: "100%", margin: "2px 0 12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
      >
        <MapPin size={14} />
        {traveling ? "Campaign stop planned — tap to cancel" : "Travel here — hold a rally"}
      </button>
      <div className="kv"><span className="k">Lean (true model)</span><span style={{ color: shareToColor(tally.demShare) }}>{leanLabel(tally.demShare)}</span></div>
      <div className="kv"><span className="k">{dem} / {rep}</span><span>{pct(tally.demShare)} / {pct(1 - tally.demShare)}</span></div>
      {avg !== null && <div className="kv"><span className="k">Poll average</span><span>{dem} {pct(avg)}</span></div>}
      <div className="kv"><span className="k">Your ground game</span><span>{pct(st.groundGame[player], 0)}</span></div>
      <div className="kv"><span className="k">Momentum (D−R)</span><span>{st.momentum >= 0 ? "+" : ""}{st.momentum.toFixed(0)}</span></div>

      <h3 style={{ marginTop: 14 }}>Demographic Blocs</h3>
      {st.blocs.map((b) => {
        const arche = BLOCS[b.blocId];
        const d = b.support.dem;
        return (
          <div className="bloc" key={b.blocId}>
            <span className="name">{arche.name}</span>
            <span className="meta">{(b.size / 1000).toFixed(0)}k · turnout {pct(b.turnoutPropensity, 0)}</span>
            <div className="suppbar">
              <div className="d" style={{ width: `${d * 100}%` }} />
              <div className="r" style={{ width: `${(1 - d) * 100}%` }} />
            </div>
            <span className="meta" style={{ gridColumn: "1 / -1" }}>
              {dem} {pct(d)} · {rep} {pct(1 - d)}{b.enthusiasm !== 1 ? ` · enthusiasm ${b.enthusiasm.toFixed(2)}×` : ""}
            </span>
          </div>
        );
      })}

      <h3 style={{ marginTop: 14 }}>Recent Polls</h3>
      {polls.map((p) => (
        <div className="pollrow" key={p.pollster}>
          <span>{p.pollster}</span>
          <span>{dem} {pct(p.demShare)} <span className="moe">±{p.marginOfError}</span></span>
        </div>
      ))}
    </div>
  );
}
