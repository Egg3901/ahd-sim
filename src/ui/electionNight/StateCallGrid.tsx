// US state call grid — color by winner, flip arrows when the call differs
// from the scenario baseline (prior two-party lean). Compact post-reveal
// companion to the full geo/square map.
import type { CandidateId, GameState, StateResult } from "@engine/types";
import "./shell.css";

export interface StateCallGridProps {
  game: GameState;
  /** Cap how many cells render (default: all). */
  limit?: number;
}

function baselineWinner(priorDemShare: number): CandidateId {
  return priorDemShare > 0.5 ? "dem" : "rep";
}

export function StateCallGrid({ game, limit }: StateCallGridProps) {
  const result = game.result!;
  const cands = game.candidates;
  const byId = new Map(game.states.map((s) => [s.id, s]));

  // Closest races first — the ones viewers care about after the reveal.
  const rows = [...result.stateResults]
    .sort((a, b) => a.margin - b.margin)
    .slice(0, limit ?? result.stateResults.length);

  return (
    <div className="ens-call-grid" data-testid="state-call-grid">
      <div className="ens-call-grid-head">
        <h3 style={{ margin: 0 }}>State calls</h3>
        <span className="muted small">Flip arrows mark baseline upsets</span>
      </div>
      <div className="ens-call-cells">
        {rows.map((sr) => (
          <CallCell key={sr.stateId} sr={sr} byId={byId} cands={cands} />
        ))}
      </div>
    </div>
  );
}

function CallCell({
  sr,
  byId,
  cands,
}: {
  sr: StateResult;
  byId: Map<string, GameState["states"][number]>;
  cands: GameState["candidates"];
}) {
  const st = byId.get(sr.stateId);
  if (!st) return null;
  const base = baselineWinner(st.prior2020DemShare);
  const flipped = sr.winner !== base;
  // Arrow direction: flipped toward Dem = up (blue), toward GOP = down (red).
  const arrow = flipped ? (sr.winner === "dem" ? "↑" : "↓") : null;

  return (
    <div
      className={`ens-call-cell${flipped ? " flipped" : ""}`}
      style={{ borderColor: cands[sr.winner].color }}
      title={`${st.name}: ${cands[sr.winner].shortName} +${sr.margin.toFixed(1)}${flipped ? " · FLIP" : ""}`}
      data-testid={`call-${sr.stateId}`}
    >
      <span className="ens-call-abbr" style={{ color: cands[sr.winner].color }}>
        {st.abbr}
        {arrow && <span className="ens-call-flip" aria-label="flip">{arrow}</span>}
      </span>
      <span className="ens-call-ev">{st.electoralVotes}</span>
      <span className="ens-call-margin">+{sr.margin.toFixed(1)}</span>
    </div>
  );
}
