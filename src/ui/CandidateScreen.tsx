import { useState } from "react";
import { CANDIDATES } from "@content/candidates";
import { CANDIDATE_PORTRAITS, RUNNING_MATE_PORTRAITS } from "@content/portraits";
import type { CandidateId } from "@engine/index";

const TRAIT_LABELS: Record<string, string> = {
  charisma: "Charisma",
  energy: "Energy",
  debatePrep: "Debate Prep",
  intelligence: "Intelligence",
  policyKnowledge: "Policy Knowledge",
  debatingSkill: "Debating Skill",
  fundraisingProwess: "Fundraising Prowess",
};

function StatBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value);
  const color = pct >= 70 ? "var(--green)" : pct >= 50 ? "var(--gold)" : "var(--gop-bright)";
  return (
    <div className="statbar">
      <div className="statbar-label">
        <span>{label}</span>
        <span style={{ color }}>{pct}</span>
      </div>
      <div className="statbar-track">
        <div className="statbar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function CandidateCard({
  id,
  selected,
  onSelect,
}: {
  id: CandidateId;
  selected: boolean;
  onSelect: (id: CandidateId) => void;
}) {
  const c = CANDIDATES[id];
  return (
    <div
      className={`candprofile${selected ? " sel" : ""}`}
      onClick={() => onSelect(id)}
      style={{ cursor: "pointer", borderColor: selected ? c.color : undefined }}
    >
      <img
        src={CANDIDATE_PORTRAITS[id]}
        alt={c.name}
        className="pfp-img"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <div className="candinfo">
        <div className="nm" style={{ color: c.color }}>{c.name}</div>
        <div className="rm">{c.party}</div>
      </div>
    </div>
  );
}

export function CandidateScreen({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<CandidateId>("biden");
  const [view, setView] = useState<"candidate" | "runningMate">("candidate");
  const c = CANDIDATES[selected];
  const traits = c.traits;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal candidate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="head">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="tag">CANDIDATES</div>
              <h2>Ticket Profiles</h2>
            </div>
            <button className="ghost" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="body">
          <div className="candselector">
            {(Object.keys(CANDIDATES) as CandidateId[]).map((id) => (
              <CandidateCard key={id} id={id} selected={selected === id} onSelect={setSelected} />
            ))}
          </div>

          <div className="profile-tabs">
            <button className={view === "candidate" ? "active" : ""} onClick={() => setView("candidate")}>
              {c.name}
            </button>
            <button className={view === "runningMate" ? "active" : ""} onClick={() => setView("runningMate")}>
              {c.runningMate}
            </button>
          </div>

          <div className="profile-body">
            <div className="profile-header">
              <img
                src={view === "candidate" ? CANDIDATE_PORTRAITS[selected] : RUNNING_MATE_PORTRAITS[c.runningMate]}
                alt={view === "candidate" ? c.name : c.runningMate}
                className="pfp-large-img"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div>
                <h3>{view === "candidate" ? c.name : c.runningMate}</h3>
                <p className="muted">{c.party} · {view === "candidate" ? "Presidential nominee" : "Vice Presidential nominee"}</p>
              </div>
            </div>

            {view === "candidate" && (
              <div className="stats-grid">
                {Object.entries(traits).map(([key, val]) => (
                  <StatBar key={key} label={TRAIT_LABELS[key] ?? key} value={val} />
                ))}
              </div>
            )}

            {view === "runningMate" && (
              <div className="stats-grid">
                <StatBar label="Charisma" value={traits.charisma * 0.85} />
                <StatBar label="Energy" value={traits.energy * 0.9} />
                <StatBar label="Debate Prep" value={traits.debatePrep * 0.7} />
                <StatBar label="Intelligence" value={traits.intelligence * 0.9} />
                <StatBar label="Policy Knowledge" value={traits.policyKnowledge * 0.6} />
                <StatBar label="Debating Skill" value={traits.debatingSkill * 0.8} />
                <StatBar label="Fundraising Prowess" value={traits.fundraisingProwess * 0.75} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
