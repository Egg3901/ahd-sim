import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@store/gameStore";
import { ISSUES } from "@content/issues";
import { BLOCS } from "@content/blocs";
import type { BlocId, IssueId } from "@engine/types";
import {
  makeDefaultCustomScenario,
  validateCustomScenario,
  registerCustomScenario,
  serializeCustomScenario,
  parseCustomScenario,
  newCustomId,
  TRAIT_KEYS,
  type CustomScenario,
  type CustomTicketInput,
} from "@content/customScenario";
import { customScenarioStore } from "@persistence/local";
import { X, Dices, Trash2, Play, Download, Upload, Save } from "lucide-react";

const TRAIT_LABELS: Record<string, string> = {
  charisma: "Charisma",
  energy: "Energy",
  debatePrep: "Debate prep",
  intelligence: "Intelligence",
  policyKnowledge: "Policy knowledge",
  debatingSkill: "Debating skill",
  fundraisingProwess: "Fundraising",
};

function num(e: React.ChangeEvent<HTMLInputElement>): number {
  return Number(e.target.value);
}

function TicketForm({
  side,
  ticket,
  onChange,
}: {
  side: "dem" | "rep";
  ticket: CustomTicketInput;
  onChange: (t: CustomTicketInput) => void;
}) {
  const set = (patch: Partial<CustomTicketInput>) => onChange({ ...ticket, ...patch });
  const setTrait = (k: string, v: number) => set({ traits: { ...ticket.traits, [k]: v } });
  const setIssue = (id: IssueId, v: number) => set({ issuePositions: { ...ticket.issuePositions, [id]: v } });
  const setFav = (id: BlocId, v: number) => {
    const next = { ...ticket.baseFavorability };
    if (v === 0) delete next[id];
    else next[id] = v;
    set({ baseFavorability: next });
  };

  return (
    <div className="field" style={{ textAlign: "left" }}>
      <label style={{ color: ticket.color }}>
        {side === "dem" ? "Your candidate" : "The opponent"}
      </label>

      <div className="ed-grid2">
        <div>
          <span className="muted small">Full name</span>
          <input type="text" value={ticket.name} maxLength={40} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div>
          <span className="muted small">Short name</span>
          <input type="text" value={ticket.shortName} maxLength={16} onChange={(e) => set({ shortName: e.target.value })} />
        </div>
        <div>
          <span className="muted small">Party</span>
          <select value={ticket.party} onChange={(e) => set({ party: e.target.value as CustomTicketInput["party"] })} style={{ width: "100%" }}>
            <option value="Democratic">Democratic</option>
            <option value="Republican">Republican</option>
          </select>
        </div>
        <div>
          <span className="muted small">Color</span>
          <input type="color" value={ticket.color} onChange={(e) => set({ color: e.target.value })} style={{ width: "100%", height: 34, padding: 2 }} />
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <span className="muted small">Traits (0 to 100)</span>
        {TRAIT_KEYS.map((k) => (
          <div key={k} className="ed-slider">
            <span className="ed-slider-k">{TRAIT_LABELS[k]}</span>
            <input type="range" min={0} max={100} step={1} value={ticket.traits[k]} onChange={(e) => setTrait(k, num(e))} />
            <span className="ed-slider-v">{ticket.traits[k]}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <span className="muted small">Issue positions (left -1 to right +1)</span>
        {(Object.keys(ISSUES) as IssueId[]).map((id) => (
          <div key={id} className="ed-slider">
            <span className="ed-slider-k">{ISSUES[id].name}</span>
            <input type="range" min={-1} max={1} step={0.05} value={ticket.issuePositions[id]} onChange={(e) => setIssue(id, num(e))} />
            <span className="ed-slider-v">{ticket.issuePositions[id].toFixed(2)}</span>
          </div>
        ))}
      </div>

      <details style={{ marginTop: 10 }}>
        <summary className="muted small" style={{ cursor: "pointer" }}>Bloc favorability (optional, -1 to +1)</summary>
        {(Object.keys(BLOCS) as BlocId[]).map((id) => (
          <div key={id} className="ed-slider">
            <span className="ed-slider-k">{BLOCS[id].name}</span>
            <input type="range" min={-1} max={1} step={0.02} value={ticket.baseFavorability[id] ?? 0} onChange={(e) => setFav(id, num(e))} />
            <span className="ed-slider-v">{(ticket.baseFavorability[id] ?? 0).toFixed(2)}</span>
          </div>
        ))}
      </details>
    </div>
  );
}

export function EditorScreen({ onClose }: { onClose: () => void }) {
  const newGame = useGameStore((s) => s.newGame);
  const [draft, setDraft] = useState<CustomScenario>(() => makeDefaultCustomScenario());
  const [saved, setSaved] = useState<CustomScenario[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => { void customScenarioStore.list().then(setSaved); };
  useEffect(() => { refresh(); }, []);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2400); };

  const validated = () => {
    const result = validateCustomScenario({ ...draft, updatedAt: Date.now() });
    if (!result.ok) { setErrors(result.errors); return null; }
    setErrors([]);
    return result.value;
  };

  const save = async (): Promise<CustomScenario | null> => {
    const value = validated();
    if (!value) return null;
    await customScenarioStore.save(value);
    setDraft(value);
    refresh();
    flash("Custom campaign saved");
    return value;
  };

  const play = (cs: CustomScenario) => {
    registerCustomScenario(cs);
    // Custom scenarios are free: start the game directly, no entitlement gate.
    newGame({ scenario: cs.id, playerCandidate: "dem", difficulty: "normal", eventMode: cs.eventMode ?? "historical" });
  };

  const saveAndPlay = async () => {
    const value = await save();
    if (value) play(value);
  };

  const exportOne = (cs: CustomScenario) => {
    const blob = new Blob([serializeCustomScenario(cs)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `custom-campaign-${cs.id.slice(0, 14)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Scenario exported");
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const cs = parseCustomScenario(String(reader.result));
        // Re-key on import so an imported file never overwrites an existing save.
        const copy: CustomScenario = { ...cs, id: newCustomId(), updatedAt: Date.now() };
        await customScenarioStore.save(copy);
        refresh();
        flash("Scenario imported");
      } catch (err) {
        flash("Import failed");
        setErrors([err instanceof Error ? err.message : "Invalid file"]);
      }
    };
    reader.readAsText(file);
  };

  const remove = async (id: string) => {
    await customScenarioStore.remove(id);
    refresh();
  };

  const startNew = () => { setDraft(makeDefaultCustomScenario()); setErrors([]); };
  const edit = (cs: CustomScenario) => { setDraft(cs); setErrors([]); };

  return (
    <div className="overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
        <div className="head">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="tag">CAMPAIGN EDITOR</div>
              <h2>Build your own race</h2>
            </div>
            <button className="ghost" onClick={onClose}><X size={16} /> Close</button>
          </div>
        </div>
        <div className="body">
        <p className="sub" style={{ margin: "0 0 14px" }}>Create your candidates and opponent, save them, and play on the standard map.</p>

        {saved.length > 0 && (
          <div className="field" style={{ textAlign: "left" }}>
            <label>Your saved campaigns</label>
            <div className="scenario-grid" style={{ gridTemplateColumns: "1fr" }}>
              {saved.map((cs) => (
                <div key={cs.id} className="scenario-card" style={{ textAlign: "left", alignItems: "stretch", cursor: "default" }}>
                  <span className="scenario-year" style={{ fontSize: 14 }}>{cs.year} · {cs.label}</span>
                  <span className="scenario-match">{cs.dem.shortName} v. {cs.rep.shortName}</span>
                  <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    <button className="primary small" onClick={() => play(cs)}><Play size={13} /> Play</button>
                    <button className="ghost small" onClick={() => edit(cs)}>Edit</button>
                    <button className="ghost small" onClick={() => exportOne(cs)}><Download size={13} /> Export</button>
                    <button className="ghost small" onClick={() => remove(cs.id)}><Trash2 size={13} /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="row" style={{ gap: 6, margin: "6px 0 12px", flexWrap: "wrap" }}>
          <button className="ghost small" onClick={startNew}><Dices size={13} /> New campaign</button>
          <button className="ghost small" onClick={() => fileRef.current?.click()}><Upload size={13} /> Import file</button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = ""; }} />
        </div>

        {/* ── Scenario params ─────────────────────────────────────────── */}
        <div className="field" style={{ textAlign: "left" }}>
          <label>Race details</label>
          <div className="ed-grid2">
            <div>
              <span className="muted small">Title</span>
              <input type="text" value={draft.label} maxLength={60} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
            </div>
            <div>
              <span className="muted small">Year</span>
              <input type="number" value={draft.year} min={1788} max={2100} onChange={(e) => setDraft({ ...draft, year: Number(e.target.value) })} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <span className="muted small">Tagline</span>
            <input type="text" value={draft.tagline} maxLength={200} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} />
          </div>
          <div style={{ marginTop: 8 }}>
            <span className="muted small">Events</span>
            <div className="su-optgrid">
              <button type="button" className={`su-opt${(draft.eventMode ?? "historical") === "historical" ? " sel" : ""}`} onClick={() => setDraft({ ...draft, eventMode: "historical" })}>
                <span className="su-opt-name">Historical</span>
                <span className="su-opt-blurb">The scripted beats for the year.</span>
              </button>
              <button type="button" className={`su-opt${draft.eventMode === "plausible" ? " sel" : ""}`} onClick={() => setDraft({ ...draft, eventMode: "plausible" })}>
                <span className="su-opt-name">Random / plausible</span>
                <span className="su-opt-blurb">A shuffled deck, different every run.</span>
              </button>
            </div>
          </div>
        </div>

        <TicketForm side="dem" ticket={draft.dem} onChange={(t) => setDraft({ ...draft, dem: t })} />
        <TicketForm side="rep" ticket={draft.rep} onChange={(t) => setDraft({ ...draft, rep: t })} />

        {errors.length > 0 && (
          <div className="field" style={{ textAlign: "left" }}>
            <div className="ed-errors">
              <strong>Fix these before saving:</strong>
              <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </div>
          </div>
        )}

        <div className="su-nav" style={{ marginTop: 12 }}>
          <button className="ghost" onClick={onClose}>Close</button>
          <div className="row" style={{ gap: 8 }}>
            <button className="ghost" onClick={() => void save()}><Save size={15} /> Save</button>
            <button className="primary" onClick={() => void saveAndPlay()}><Play size={15} /> Save and play</button>
          </div>
        </div>

        {toast && <div className="toast">{toast}</div>}
        </div>
      </div>
    </div>
  );
}
