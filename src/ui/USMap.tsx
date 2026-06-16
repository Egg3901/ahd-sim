import { useState } from "react";
import { useGameStore } from "@store/gameStore";
import { GRID, SPLIT_UNITS, GRID_COLS, GRID_ROWS } from "@content/mapLayout";
import { STATE_PATHS } from "@content/statePaths";
import { tallyContest, computeResult, type GameState } from "@engine/index";
import { shareToColor } from "./colors";

function contestShare(game: GameState, id: string): number {
  const st = game.states.find((s) => s.id === id);
  if (!st) return 0.5;
  if (st.blocs.length > 0) return tallyContest(st).demShare;
  const sr = computeResult(game).stateResults.find((s) => s.stateId === id);
  return sr?.demShare ?? 0.5;
}

function GeoState({ id, game, onClick, selected }: { id: string; game: GameState; onClick: () => void; selected: boolean }) {
  const st = game.states.find((s) => s.id === id);
  if (!st) return null;
  const share = contestShare(game, id);
  // Split-state districts (ME-1, NE-2, etc.) use the parent state path
  const parentId = id.split("-")[0];
  const path = STATE_PATHS[id] ?? STATE_PATHS[parentId];
  if (!path) return null;

  return (
    <g
      onClick={onClick}
      style={{ cursor: "pointer" }}
      className={selected ? "geo-selected" : ""}
    >
      <path
        d={path}
        fill={shareToColor(share)}
        stroke={selected ? "var(--gold)" : "#1a2744"}
        strokeWidth={selected ? 2 : 0.5}
      />
    </g>
  );
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
  const [mode, setMode] = useState<"geo" | "square">("square");
  const select = useGameStore((s) => s.selectState);
  const selectedId = useGameStore((s) => s.selectedStateId);

  if (mode === "geo") {
    return (
      <div className="card mapwrap sheen">
        <div className="mapcontrols" style={{ justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--muted)" }}>Electoral Map</h3>
          <div className="row" style={{ gap: 4 }}>
            <button className={`ghost small active`} onClick={() => setMode("geo")}>Geo</button>
            <button className={`ghost small`} onClick={() => setMode("square")}>Square</button>
          </div>
        </div>
        <svg viewBox="0 0 1000 650" className="geo-map" preserveAspectRatio="xMidYMid meet">
          {GRID.map((t) => (
            <GeoState
              key={t.id}
              id={t.id}
              game={game}
              onClick={() => select(t.id)}
              selected={selectedId === t.id}
            />
          ))}
          {/* Split states: only render at-large units on geo map */}
          {SPLIT_UNITS.map((grp) => {
            const atLarge = grp.ids.find((id) => id.endsWith("-AL"));
            return atLarge ? (
              <GeoState
                key={atLarge}
                id={atLarge}
                game={game}
                onClick={() => select(atLarge)}
                selected={selectedId === atLarge}
              />
            ) : null;
          })}
        </svg>
        <div className="legend">
          <span>{game.candidates.rep.shortName}</span>
          <span className="bar" />
          <span>{game.candidates.dem.shortName}</span>
          <span style={{ marginLeft: 12 }}>◻ gold outline = battleground</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card mapwrap sheen">
      <div className="mapcontrols" style={{ justifyContent: "space-between" }}>
        <h3 style={{ margin: 0, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--muted)" }}>Electoral Map</h3>
        <div className="row" style={{ gap: 4 }}>
          <button className={`ghost small`} onClick={() => setMode("geo")}>Geo</button>
          <button className={`ghost small active`} onClick={() => setMode("square")}>Square</button>
        </div>
      </div>
      <div
        className="tilegrid"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
          aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`,
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
        <span>{game.candidates.rep.shortName}</span>
        <span className="bar" />
        <span>{game.candidates.dem.shortName}</span>
        <span style={{ marginLeft: 12 }}>◻ gold outline = battleground</span>
      </div>
    </div>
  );
}
