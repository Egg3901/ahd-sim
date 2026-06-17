import { useState } from "react";
import { useGameStore, type Difficulty } from "@store/gameStore";
import { SCENARIOS, SCENARIO_IDS } from "@content/scenarios";
import { defaultRunningMate } from "@content/runningMates";
import { GuidePage } from "@ui/GuidePage";
import { CandidateScreen } from "@ui/CandidateScreen";
import { mateBonusChips } from "@ui/labels";
import { Avatar } from "@ui/Avatar";
import type { CandidateId } from "@engine/index";
import {
  Vote,
  Dices,
  ChevronLeft,
  ChevronRight,
  Check,
  Flag,
  Swords,
  Crosshair,
  CalendarDays,
  Shuffle,
} from "lucide-react";

// A fresh random seed every time the setup screen mounts (and on every reroll),
// so no two campaigns share an RNG stream unless the player deliberately types
// one in. Six digits reads cleanly in the input and as a shareable token.
function randomSeed(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

type StepId = 0 | 1 | 2;
const STEPS: { label: string; hint: string }[] = [
  { label: "The Election", hint: "Choose your year" },
  { label: "The Ticket", hint: "Pick your campaign" },
  { label: "The Briefing", hint: "Set the rules" },
];

const DIFFICULTIES: {
  id: Difficulty;
  name: string;
  blurb: string;
  Icon: typeof Flag;
}[] = [
  { id: "easy", name: "Easy", blurb: "Favorable climate, a bigger war chest, and a sloppy opponent — you can win any year.", Icon: Flag },
  { id: "normal", name: "Normal", blurb: "A fair fight on the real map, against a disciplined campaign.", Icon: Swords },
  { id: "hard", name: "Hard", blurb: "The historical map, no help, a ruthless opponent. History is brutal.", Icon: Crosshair },
];

export function SetupScreen() {
  const newGame = useGameStore((s) => s.newGame);
  const [step, setStep] = useState<StepId>(0);
  const [scenarioId, setScenarioId] = useState<string>("2024");
  const [pick, setPick] = useState<CandidateId>("dem");
  const scenario = SCENARIOS[scenarioId];
  const ticket = pick === "dem" ? scenario.dem : scenario.rep;
  const [mate, setMate] = useState<string>(defaultRunningMate(scenario.dem.runningMates).id);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [eventMode, setEventMode] = useState<"historical" | "plausible">("historical");
  const [seed, setSeed] = useState<string>(randomSeed);
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

  const opponent = pick === "dem" ? scenario.rep : scenario.dem;

  const begin = () =>
    newGame({ seed, scenario: scenarioId, playerCandidate: pick, difficulty, runningMate: mate, eventMode });

  return (
    <div className="center">
      <div className="setup">
        <div className="setup-eyebrow">
          <span className="mark"><Vote size={18} /></span>PRESIDENTIAL CAMPAIGN
        </div>
        <div className="title">A House Divided</div>
        <p className="sub">{scenario.tagline}</p>

        {/* ── Stepper ──────────────────────────────────────────────── */}
        <div className="su-stepper" role="tablist">
          {STEPS.map((s, i) => {
            const state = i === step ? "cur" : i < step ? "done" : "todo";
            return (
              <button
                key={s.label}
                type="button"
                className={`su-step ${state}`}
                onClick={() => i < step && setStep(i as StepId)}
                disabled={i > step}
              >
                <span className="su-step-dot">{i < step ? <Check size={14} /> : i + 1}</span>
                <span className="su-step-text">
                  <span className="su-step-label">{s.label}</span>
                  <span className="su-step-hint">{s.hint}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="su-panel" key={step}>
          {/* ── Step 1: Election ───────────────────────────────────── */}
          {step === 0 && (
            <div className="field" style={{ textAlign: "left", margin: 0 }}>
              <label>Election year — each cycle ships its own map, decks & tickets</label>
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
          )}

          {/* ── Step 2: Ticket ─────────────────────────────────────── */}
          {step === 1 && (
            <>
              <div className="field" style={{ textAlign: "left", margin: "0 0 4px" }}>
                <label>Your candidate — the campaign you'll run</label>
              </div>
              <div className="pick">
                {(["dem", "rep"] as CandidateId[]).map((id) => {
                  const c = id === "dem" ? scenario.dem : scenario.rep;
                  const selClass = pick === id ? (id === "dem" ? " sel-d" : " sel-r") : "";
                  return (
                    <div key={id} className={`candcard${selClass}`} onClick={() => choosePick(id)} style={{ cursor: "pointer" }}>
                      <div className="row" style={{ gap: 10 }}>
                        <Avatar name={c.name} color={c.color} size={44} />
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
                      <Avatar name={m.name} color={ticket.color} size={20} />
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
            </>
          )}

          {/* ── Step 3: Briefing ───────────────────────────────────── */}
          {step === 2 && (
            <>
              <div className="field" style={{ textAlign: "left", margin: "0 0 10px" }}>
                <label>Events</label>
                <div className="su-optgrid">
                  <button type="button" className={`su-opt${eventMode === "historical" ? " sel" : ""}`} onClick={() => setEventMode("historical")}>
                    <CalendarDays size={16} className="su-opt-icon" />
                    <span className="su-opt-name">Historical</span>
                    <span className="su-opt-blurb">The real beats of {scenario.year}, in order.</span>
                  </button>
                  <button type="button" className={`su-opt${eventMode === "plausible" ? " sel" : ""}`} onClick={() => setEventMode("plausible")}>
                    <Shuffle size={16} className="su-opt-icon" />
                    <span className="su-opt-name">Random / plausible</span>
                    <span className="su-opt-blurb">A shuffled deck — different every run.</span>
                  </button>
                </div>
              </div>

              <div className="field" style={{ textAlign: "left", margin: "0 0 10px" }}>
                <label>Difficulty — AI opponent strength</label>
                <div className="su-optgrid su-optgrid-3">
                  {DIFFICULTIES.map(({ id, name, blurb, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      className={`su-opt${difficulty === id ? " sel" : ""}`}
                      onClick={() => setDifficulty(id)}
                    >
                      <Icon size={16} className="su-opt-icon" />
                      <span className="su-opt-name">{name}</span>
                      <span className="su-opt-blurb">{blurb}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field" style={{ textAlign: "left" }}>
                <label>Seed — same seed replays the same events & RNG</label>
                <div className="su-seed">
                  <input type="text" value={seed} onChange={(e) => setSeed(e.target.value)} />
                  <button type="button" className="ghost su-reroll" title="Reroll seed" onClick={() => setSeed(randomSeed())}>
                    <Dices size={16} /> Reroll
                  </button>
                </div>
              </div>

              {/* ── Review summary ───────────────────────────────────── */}
              <div className="su-summary">
                <div className="su-summary-row">
                  <span className="su-summary-k">Running as</span>
                  <span className="su-summary-v" style={{ color: ticket.color }}>{ticket.name} / {selectedMate.name}</span>
                </div>
                <div className="su-summary-row">
                  <span className="su-summary-k">Against</span>
                  <span className="su-summary-v" style={{ color: opponent.color }}>{opponent.name}</span>
                </div>
                <div className="su-summary-row">
                  <span className="su-summary-k">Rules</span>
                  <span className="su-summary-v">{scenario.year} · {eventMode === "historical" ? "Historical" : "Plausible"} · {DIFFICULTIES.find((d) => d.id === difficulty)!.name}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <div className="su-nav">
          {step > 0 ? (
            <button className="ghost" onClick={() => setStep((step - 1) as StepId)}>
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <span className="su-nav-spacer" />
          )}
          {step < 2 ? (
            <button className="primary su-next" onClick={() => setStep((step + 1) as StepId)}>
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button className="primary su-next" onClick={begin}>
              Begin {scenario.year} as {ticket.shortName} →
            </button>
          )}
        </div>

        <div className="su-links">
          <button className="su-link" onClick={() => setGuideOpen(true)}>How to Play</button>
          <span className="su-link-sep">·</span>
          <button className="su-link" onClick={() => setCandOpen(true)}>Candidates</button>
        </div>
      </div>
      {guideOpen && <GuidePage onClose={() => setGuideOpen(false)} />}
      {candOpen && <CandidateScreen scenarioId={scenarioId} onClose={() => setCandOpen(false)} />}
    </div>
  );
}
