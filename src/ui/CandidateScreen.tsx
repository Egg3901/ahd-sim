import { useState } from "react";
import { getScenario, type ScenarioTicket } from "@content/scenarios";
import { TRAIT_LABELS, mateBonusChips } from "@ui/labels";
import { Avatar } from "@ui/Avatar";
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
  ticket,
  selected,
  onSelect,
}: {
  ticket: ScenarioTicket;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`candprofile${selected ? " sel" : ""}`}
      onClick={onSelect}
      style={{ cursor: "pointer", borderColor: selected ? ticket.color : undefined }}
    >
      <Avatar name={ticket.name} color={ticket.color} size={44} />
      <div className="candinfo">
        <div className="nm" style={{ color: ticket.color }}>{ticket.name}</div>
        <div className="rm">{ticket.party}</div>
      </div>
    </div>
  );
}

export function CandidateScreen({ scenarioId, onClose }: { scenarioId?: string; onClose: () => void }) {
  const scenario = getScenario(scenarioId);
  const [selected, setSelected] = useState<CandidateId>("dem");
  const [view, setView] = useState<"candidate" | "runningMate">("candidate");
  const ticket = selected === "dem" ? scenario.dem : scenario.rep;
  const roster = ticket.runningMates;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal candidate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="head">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="tag">{scenario.label}</div>
              <h2>Ticket Profiles</h2>
            </div>
            <button className="ghost" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="body">
          <div className="candselector">
            <CandidateCard ticket={scenario.dem} selected={selected === "dem"} onSelect={() => setSelected("dem")} />
            <CandidateCard ticket={scenario.rep} selected={selected === "rep"} onSelect={() => setSelected("rep")} />
          </div>

          <div className="profile-tabs">
            <button className={view === "candidate" ? "active" : ""} onClick={() => setView("candidate")}>
              {ticket.name}
            </button>
            <button className={view === "runningMate" ? "active" : ""} onClick={() => setView("runningMate")}>
              Running mates
            </button>
          </div>

          {view === "candidate" && (
            <div className="profile-body">
              <div className="profile-header">
                <Avatar name={ticket.name} color={ticket.color} size={64} />
                <div>
                  <h3>{ticket.name}</h3>
                  <p className="muted">{ticket.party} · Presidential nominee</p>
                </div>
              </div>
              <div className="stats-grid">
                {Object.entries(ticket.traits).map(([key, val]) => (
                  <StatBar key={key} label={TRAIT_LABELS[key] ?? key} value={val} />
                ))}
              </div>
            </div>
          )}

          {view === "runningMate" && (
            <div className="profile-body">
              <p className="muted small" style={{ marginTop: 0 }}>
                Pick one at setup. Each folds their bonuses into your ticket's traits, bloc appeal,
                and starting resources. ★ marks the historical nominee.
              </p>
              <div className="vp-list">
                {roster.map((m) => (
                  <div className="vp-row" key={m.id}>
                    <Avatar name={m.name} color={ticket.color} size={44} />
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
