import { useGameStore } from "@store/gameStore";
import { GRID, SPLIT_UNITS, GRID_COLS, GRID_ROWS } from "@content/mapLayout";
import { tallyContest, computeResult, type GameState } from "@engine/index";
import { shareToColor } from "./colors";

// Resolve a contest's current two-party Biden share for coloring. Aggregate
// units (ME-AL/NE-AL) derive theirs from their districts.
function contestShare(game: GameState, id: string): number {
  const st = game.states.find((s) => s.id === id);
  if (!st) return 0.5;
  if (st.blocs.length > 0) return tallyContest(st).bidenShare;
  const sr = computeResult(game).stateResults.find((s) => s.stateId === id);
  return sr?.bidenShare ?? 0.5;
}

function Tile({ id, game, size }: { id: string; game: GameState; size?: number }) {
  const selected = useGameStore((s) => s.selectedStateId === id);
  const select = useGameStore((s) => s.selectState);
  const st = game.states.find((s) => s.id === id);
  if (!st) return null;
  const share = contestShare(game, id);
  return (
    <div
      className={`tile${selected ? " selected" : ""}${st.battleground ? " bg" : ""}`}
      style={{ background: shareToColor(share), width: size }}
      onClick={() => select(id)}
      title={`${st.name} — ${st.electoralVotes} EV`}
    >
      <span>{st.abbr}</span>
      <span className="ev">{st.electoralVotes}</span>
    </div>
  );
}

export function USMap() {
  const game = useGameStore((s) => s.game)!;
  return (
    <div className="card mapwrap">
      <h3>Electoral Map</h3>
      <div
        className="tilegrid"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
        }}
      >
        {GRID.map((t) => (
          <div key={t.id} style={{ gridColumn: t.col + 1, gridRow: t.row + 1 }}>
            <Tile id={t.id} game={game} />
          </div>
        ))}
      </div>

      <div className="splitstrip">
        {SPLIT_UNITS.map((grp) => (
          <div className="splitgroup" key={grp.label}>
            <span className="lab">{grp.label}</span>
            <div className="row">
              {grp.ids.map((id) => (
                <Tile key={id} id={id} game={game} size={38} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="legend">
        <span>Trump</span>
        <span className="bar" />
        <span>Biden</span>
        <span style={{ marginLeft: 12 }}>◻ gold outline = battleground</span>
      </div>
    </div>
  );
}
