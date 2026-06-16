import { useState } from "react";
import { useGameStore, type Difficulty } from "@store/gameStore";
import { SCENARIOS, SCENARIO_IDS } from "@content/scenarios";
import { defaultRunningMate } from "@content/runningMates";
import { GuidePage } from "@ui/GuidePage";
import { CandidateScreen } from "@ui/CandidateScreen";
import { mateBonusChips } from "@ui/labels";
import { Avatar } from "@ui/Avatar";
import type { CandidateId } from "@engine/index";
import { Vote } from "lucide-react";

export function SetupScreen() {
  const newGame = useGameStore((s) => s.newGame);
  const [scenarioId, setScenarioId] = useState<string>("2024");
  const [pick, setPick] = useState<CandidateId>("dem");
  const scenario = SCENARIOS[scenarioId];
  const ticket = pick === "dem" ? scenario.dem : scenario.rep;
  const [mate, setMate] = useState<string>(defaultRunningMate(scenario.dem.runningMates).id);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [seed, setSeed] = useState<string>("1789");
  const [guideOpen, setGuideOpen] = useState(false);
  const [candOpen, setCandOpen] = useState(false);

  const chooseScenario = (id: string) => {
    setScenarioId(id);
    setPick("dem");
    setMate(defaultRunningMate(SCENARIOS[id].dem.runningMates).id);
  };
  const choosePick = (id: CandidateId) => {
    setPick(id);
    const t = id === "dem" ? scenario.dem : scenario.rep;
    setMate(defaultRunningMate(t.runningMates).id);
  };
  const roster = ticket.runningMates;
  const selectedMate = roster.find((m) => m.id === mate) ?? roster[0];

  return (
    <div className="center">
      <div className="setup">
        <div className="setup-eyebrow"><span className="mark"><Vote size={18} /></span>PRESIDENTIAL CAMPAIGN</div>
        <div className="title">A House Divided</div>
        <p className="sub">{scenario.tagline}</p>

        <div className="field" style={{ textAlign: "left" }}>
          <label>Election</label>
          <div className="scenario-grid">
            {SCENARIO_IDS.map((id) => {
              const s = SCENARIOS[id];
              return (
                <button
                  key={id}
                  type="button"
                  className={`scenario-card${scenarioId === id ? " sel" : ""}`}
                  onClick={() => chooseScenario(id)}
                >
                  <span className="scenario-year">{s.year}</span>
                  <span className="scenario-match">{s.dem.shortName} v. {s.rep.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pick">
          {(["dem", "rep"] as CandidateId[]).map((id) => {
            const c = id === "dem" ? scenario.dem : scenario.rep;
            const selClass = pick === id ? (id === "dem" ? " sel-d" : " sel-r") : "";
            return (
              <div key={id} className={`candcard${selClass}`} onClick={() => choosePick(id)} style={{ cursor: "pointer" }}>
                <div className="row" style={{ gap: 10 }}>
                  <Avatar name={c.name} color={c.color} size={40} />
                  <div>
                    <div className="nm" style={{ color: c.color }}>{c.name}</div>
                    <div className="rm">{c.party}</div>
                  </div>
                </div>
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
                {m.historical && <span className="vp-star" title="Historical pick">★</span>}
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
            onClick={() => newGame({ seed, scenario: scenarioId, playerCandidate: pick, difficulty, runningMate: mate })}
          >
            Begin {scenario.year} as {ticket.shortName} →
          </button>
        </div>
      </div>
      {guideOpen && <GuidePage onClose={() => setGuideOpen(false)} />}
      {candOpen && <CandidateScreen scenarioId={scenarioId} onClose={() => setCandOpen(false)} />}
    </div>
  );
}
