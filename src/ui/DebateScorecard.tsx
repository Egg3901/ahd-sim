import { useGameStore } from "@store/gameStore";
import type { CandidateId } from "@engine/index";
import { Avatar } from "@ui/Avatar";
import { Gavel } from "lucide-react";

// Post-debate scorecard: both tickets scored 0–100, the winner called, and the
// momentum swing spelled out. A lopsided loss is flagged as a meltdown.
export function DebateScorecard() {
  const game = useGameStore((s) => s.game);
  const debate = useGameStore((s) => s.lastDebate);
  const dismiss = useGameStore((s) => s.dismissDebate);
  if (!game || !debate) return null;

  const cands = game.candidates;
  const player = game.playerCandidate;
  const order: CandidateId[] = debate.winner === "rep" ? ["rep", "dem"] : ["dem", "rep"];
  const playerWon = debate.winner === player;

  const banner =
    debate.winner === "tie"
      ? "Too close to call — a draw."
      : debate.meltdown
        ? `Debate meltdown — ${cands[debate.winner].shortName} routs ${cands[debate.winner === "dem" ? "rep" : "dem"].shortName}`
        : `${cands[debate.winner].shortName} wins the debate`;

  return (
    <div className="overlay">
      <div className="modal scorecard">
        <div className="head">
          <div className="tag"><Gavel size={12} style={{ verticalAlign: "-2px", marginRight: 6 }} />DEBATE SCORECARD</div>
          <h2>{debate.title}</h2>
        </div>
        <div className="body">
          <div className={`sc-banner ${debate.winner === "tie" ? "tie" : playerWon ? "win" : "lose"}${debate.meltdown ? " meltdown" : ""}`}>
            {banner}
          </div>

          {order.map((c) => {
            const isWinner = debate.winner === c;
            return (
              <div key={c} className={`sc-row${isWinner ? " sc-win" : ""}`}>
                <Avatar name={cands[c].name} color={cands[c].color} size={38} />
                <div className="sc-meta">
                  <div className="sc-name" style={{ color: cands[c].color }}>
                    {cands[c].name} {c === player && <span className="sc-you">you</span>}
                  </div>
                  <div className="sc-choice">{debate.choiceText[c]}</div>
                  <div className="sc-bar"><div className="sc-fill" style={{ width: `${debate.scores[c]}%`, background: cands[c].color }} /></div>
                </div>
                <div className="sc-score" style={{ color: cands[c].color }}>{debate.scores[c]}</div>
              </div>
            );
          })}

          {debate.winner !== "tie" && (
            <div className="sc-momentum">
              National momentum
              <span className="up"> +{debate.momentumSwing.toFixed(0)} {cands[debate.winner].shortName}</span>
              <span className="down"> −{debate.momentumSwing.toFixed(0)} {cands[debate.winner === "dem" ? "rep" : "dem"].shortName}</span>
            </div>
          )}

          <p className="resulttext">{debate.resultText[player]}</p>

          <button className="primary" style={{ width: "100%" }} onClick={dismiss}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
