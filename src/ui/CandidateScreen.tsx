import { useState } from "react";
import { CANDIDATES } from "@content/candidates";
import { CANDIDATE_PORTRAITS, RUNNING_MATE_PORTRAITS } from "@content/portraits";
import { RUNNING_MATES } from "@content/runningMates";
import { TRAIT_LABELS, mateBonusChips } from "@ui/labels";
import type { CandidateId } from "@engine/index";

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
  const [selected, setSelected] = useState<CandidateId>("dem");
  const [view, setView] = useState<"candidate" | "runningMate">("candidate");
  const c = CANDIDATES[selected];
  const traits = c.traits;
  const roster = RUNNING_MATES[selected];

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
              Running mates
            </button>
          </div>

          {view === "candidate" && (
            <div className="profile-body">
              <div className="profile-header">
                <img
                  src={CANDIDATE_PORTRAITS[selected]}
                  alt={c.name}
                  className="pfp-large-img"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div>
                  <h3>{c.name}</h3>
                  <p className="muted">{c.party} · Presidential nominee</p>
                </div>
              </div>
              <div className="stats-grid">
                {Object.entries(traits).map(([key, val]) => (
                  <StatBar key={key} label={TRAIT_LABELS[key] ?? key} value={val} />
                ))}
              </div>
            </div>
          )}

          {view === "runningMate" && (
            <div className="profile-body">
              <p className="muted small" style={{ marginTop: 0 }}>
                Pick one at setup. Each fold their bonuses into your ticket's traits, bloc appeal,
                and starting resources. ★ marks the historical 2020 nominee.
              </p>
              <div className="vp-list">
                {roster.map((m) => (
                  <div className="vp-row" key={m.id}>
                    <img
                      src={RUNNING_MATE_PORTRAITS[m.name] ?? ""}
                      alt={m.name}
                      className="pfp-img"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="vp-row-name">
                        {m.name}{m.historical && <span className="vp-star"> ★</span>}
                      </div>
                      <p className="vp-blurb" style={{ margin: "2px 0 6px" }}>{m.blurb}</p>
                      <div className="vp-bonuses">
                        {mateBonusChips(m).map((label, i) => (
                          <span key={i} className="chip up">{label}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
