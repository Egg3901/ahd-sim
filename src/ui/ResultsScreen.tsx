import { useGameStore } from "@store/gameStore";
import { GRID, SPLIT_UNITS, GRID_COLS, GRID_ROWS } from "@content/mapLayout";
import { CANDIDATES } from "@content/candidates";
import { shareToColor } from "./colors";
import { money, pct } from "./format";

export function ResultsScreen() {
  const game = useGameStore((s) => s.game)!;
  const newGame = useGameStore((s) => s.newGame);
  const result = game.result!;
  const byState = new Map(result.stateResults.map((s) => [s.stateId, s]));

  const winnerName =
    result.winner === "tie" ? "No one — 269–269" : CANDIDATES[result.winner].name;
  const playerWon = result.winner === game.playerCandidate;

  const tile = (id: string, size?: number) => {
    const sr = byState.get(id);
    const st = game.states.find((s) => s.id === id);
    if (!sr || !st) return null;
    return (
      <div className="tile" key={id} style={{ background: shareToColor(sr.demShare), width: size }} title={`${st.name}: ${sr.winner === "dem" ? "Biden" : "Trump"} +${sr.margin.toFixed(1)}`}>
        <span>{st.abbr}</span>
        <span className="ev">{st.electoralVotes}</span>
      </div>
    );
  };

  return (
    <div className="center">
      <div className="results scroll">
        <div className="bigresult">
          <div className="tag muted small">{result.winner === "tie" ? "CONTINGENT ELECTION" : "PROJECTED WINNER"}</div>
          <div className="who" style={{ color: result.winner === "tie" ? "var(--gold)" : CANDIDATES[result.winner].color }}>
            {winnerName}
          </div>
          {result.winner !== "tie" && (
            <div className="ev" style={{ color: CANDIDATES[result.winner].color }}>{result.electoralVotes[result.winner]}</div>
          )}
          <div className="muted">
            Biden {result.electoralVotes.dem} — Trump {result.electoralVotes.rep} ·
            Popular vote: Biden {pct(result.popularShare.dem)} ({money(result.popularVote.dem)} votes)
          </div>
          {result.winner === "tie" ? (
            <p className="muted small" style={{ marginTop: 8 }}>
              Neither ticket reached 270. The election is thrown to the House of Representatives, where each state delegation casts a single vote. The campaign is over; the contingent election is another story.
            </p>
          ) : (
            <h2 style={{ marginTop: 8, color: playerWon ? "var(--green)" : "#fca5a5" }}>
              {playerWon ? "You won the campaign." : "You came up short."}
            </h2>
          )}
        </div>

        <div className="card">
          <h3>Final Map</h3>
          <div className="tilegrid" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`, maxWidth: 560, margin: "0 auto" }}>
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
        </div>

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
          onClick={() => newGame({ seed: String(Date.now()), playerCandidate: game.playerCandidate })}>
          Run it back — New Campaign →
        </button>
      </div>
    </div>
  );
}
