import { useState } from "react";
import { useGameStore, type Difficulty } from "@store/gameStore";
import { CANDIDATES } from "@content/candidates";
import { GuidePage } from "@ui/GuidePage";
import { CandidateScreen } from "@ui/CandidateScreen";
import type { CandidateId } from "@engine/index";
import { Vote } from "lucide-react";

export function SetupScreen() {
  const newGame = useGameStore((s) => s.newGame);
  const [pick, setPick] = useState<CandidateId>("biden");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [seed, setSeed] = useState<string>("2020");
  const [guideOpen, setGuideOpen] = useState(false);
  const [candOpen, setCandOpen] = useState(false);

  return (
    <div className="center">
      <div className="setup">
        <div className="setup-eyebrow"><span className="mark"><Vote size={18} /></span>CAMPAIGN 2020</div>
        <div className="title">A House Divided</div>
        <p className="sub">September 1st. Sixty-three days to Election Day. You are the campaign manager. Read the map, spend what you have, answer the moments that matter, and get to 270.</p>

        <div className="pick">
          {(Object.keys(CANDIDATES) as CandidateId[]).map((id) => {
            const c = CANDIDATES[id];
            const selClass = pick === id ? (id === "biden" ? " sel-d" : " sel-r") : "";
            return (
              <div key={id} className={`candcard${selClass}`} onClick={() => setPick(id)} style={{ cursor: "pointer" }}>
                <div className="nm" style={{ color: c.color }}>{c.name}</div>
                <div className="rm">{c.party} · {c.runningMate}</div>
              </div>
            );
          })}
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

        <div className="row" style={{ marginTop: 10, gap: 8 }}>
          <button className="ghost" style={{ flex: 1 }} onClick={() => setGuideOpen(true)}>How to Play</button>
          <button className="ghost" style={{ flex: 1 }} onClick={() => setCandOpen(true)}>Candidates</button>
          <button
            className="primary"
            style={{ flex: 2, padding: 12, fontSize: 15 }}
            onClick={() => newGame({ seed, playerCandidate: pick, difficulty })}
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
