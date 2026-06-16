import { useGameStore } from "@store/gameStore";
import { tallyContest, pollState, pollAverage } from "@engine/index";
import { BLOCS } from "@content/blocs";
import { shareToColor, leanLabel } from "./colors";
import { pct } from "./format";

export function StatePanel() {
  const game = useGameStore((s) => s.game)!;
  const selectedId = useGameStore((s) => s.selectedStateId);
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
  const polls = pollState(game, st.id);
  const avg = pollAverage(game, st.id);

  return (
    <div className="card scroll">
      <h3>{st.name} — {st.electoralVotes} EV</h3>
      <div className="kv"><span className="k">Lean (true model)</span><span style={{ color: shareToColor(tally.bidenShare) }}>{leanLabel(tally.bidenShare)}</span></div>
      <div className="kv"><span className="k">Biden / Trump</span><span>{pct(tally.bidenShare)} / {pct(1 - tally.bidenShare)}</span></div>
      {avg !== null && <div className="kv"><span className="k">Poll average</span><span>Biden {pct(avg)}</span></div>}
      <div className="kv"><span className="k">Your ground game</span><span>{pct(st.groundGame[player], 0)}</span></div>
      <div className="kv"><span className="k">Momentum (D−R)</span><span>{st.momentum >= 0 ? "+" : ""}{st.momentum.toFixed(0)}</span></div>

      <h3 style={{ marginTop: 14 }}>Demographic Blocs</h3>
      {st.blocs.map((b) => {
        const arche = BLOCS[b.blocId];
        const d = b.support.biden;
        return (
          <div className="bloc" key={b.blocId}>
            <span className="name">{arche.name}</span>
            <span className="meta">{(b.size / 1000).toFixed(0)}k · turnout {pct(b.turnoutPropensity, 0)}</span>
            <div className="suppbar">
              <div className="d" style={{ width: `${d * 100}%` }} />
              <div className="r" style={{ width: `${(1 - d) * 100}%` }} />
            </div>
            <span className="meta" style={{ gridColumn: "1 / -1" }}>
              Biden {pct(d)} · Trump {pct(1 - d)}{b.enthusiasm !== 1 ? ` · enthusiasm ${b.enthusiasm.toFixed(2)}×` : ""}
            </span>
          </div>
        );
      })}

      <h3 style={{ marginTop: 14 }}>Recent Polls</h3>
      {polls.map((p) => (
        <div className="pollrow" key={p.pollster}>
          <span>{p.pollster}</span>
          <span>Biden {pct(p.bidenShare)} <span className="moe">±{p.marginOfError}</span></span>
        </div>
      ))}
    </div>
  );
}
