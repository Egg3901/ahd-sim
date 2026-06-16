import { useState } from "react";
import { useGameStore, type Difficulty } from "@store/gameStore";
import { CANDIDATES } from "@content/candidates";
import { RUNNING_MATES, defaultRunningMate } from "@content/runningMates";
import { GuidePage } from "@ui/GuidePage";
import { CandidateScreen } from "@ui/CandidateScreen";
import { mateBonusChips } from "@ui/labels";
import type { CandidateId } from "@engine/index";
import { Vote } from "lucide-react";

export function SetupScreen() {
  const newGame = useGameStore((s) => s.newGame);
  const [pick, setPick] = useState<CandidateId>("dem");
  const [mate, setMate] = useState<string>(defaultRunningMate("dem").id);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [seed, setSeed] = useState<string>("2020");
  const [guideOpen, setGuideOpen] = useState(false);
  const [candOpen, setCandOpen] = useState(false);

  // Switching the top of the ticket resets the VP to that side's default.
  const choosePick = (id: CandidateId) => { setPick(id); setMate(defaultRunningMate(id).id); };
  const roster = RUNNING_MATES[pick];
  const selectedMate = roster.find((m) => m.id === mate) ?? roster[0];

  return (
    <div className="center">
      <div className="setup">
        <div className="setup-eyebrow"><span className="mark"><Vote size={18} /></span>CAMPAIGN 2020</div>
        <div className="title">A House Divided</div>
        <p className="sub">September 1st. Sixty-three days to Election Day. You are the campaign manager. Read the map, spend what you have, answer the moments that matter, and get to 270.</p>

        <div className="pick">
          {(Object.keys(CANDIDATES) as CandidateId[]).map((id) => {
            const c = CANDIDATES[id];
            const selClass = pick === id ? (id === "dem" ? " sel-d" : " sel-r") : "";
            return (
              <div key={id} className={`candcard${selClass}`} onClick={() => choosePick(id)} style={{ cursor: "pointer" }}>
                <div className="nm" style={{ color: c.color }}>{c.name}</div>
                <div className="rm">{c.party}</div>
              </div>
            );
          })}
        </div>

        <div className="field" style={{ textAlign: "left" }}>
          <label>Running mate — shapes your coalition</label>
          <div className="vp-roster">
            {roster.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`vp-card${mate === m.id ? " sel" : ""}`}
                onClick={() => setMate(m.id)}
              >
                <span className="vp-name">{m.name}</span>
                {m.historical && <span className="vp-star" title="Historical 2020 pick">★</span>}
              </button>
            ))}
          </div>
          <p className="vp-blurb">{selectedMate.blurb}</p>
          <div className="vp-bonuses">
            {mateBonusChips(selectedMate).map((label, i) => (
              <span key={i} className="chip up">{label}</span>
            ))}
          </div>
        </div>

        <div className="field" style={{ textAlign: "left" }}>
          <label>Difficulty (AI opponent strength)</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            <option value="easy">Easy — sloppy, under-spending opponent</option>
            <option value="normal">Normal — a competent campaign</option>
            <option value="hard">Hard — ruthless tipping-point targeting</option>
          </select>
        </div>

        <div className="field" style={{ textAlign: "left" }}>
          <label>Seed (same seed = same events & RNG)</label>
          <input type="text" value={seed} onChange={(e) => setSeed(e.target.value)} />
        </div>

        <div className="setup-actions">
          <button className="ghost" onClick={() => setGuideOpen(true)}>How to Play</button>
          <button className="ghost" onClick={() => setCandOpen(true)}>Candidates</button>
          <button
            className="primary begin"
            onClick={() => newGame({ seed, playerCandidate: pick, difficulty, runningMate: mate })}
          >
            Begin Campaign as {CANDIDATES[pick].shortName} →
          </button>
        </div>
      </div>
      {guideOpen && <GuidePage onClose={() => setGuideOpen(false)} />}
      {candOpen && <CandidateScreen onClose={() => setCandOpen(false)} />}
    </div>
  );
}
