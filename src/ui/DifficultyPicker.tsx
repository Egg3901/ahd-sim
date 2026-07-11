import { Flag, Swords, Crosshair } from "lucide-react";

export type Difficulty = "easy" | "normal" | "hard";

// Shared easy/normal/hard picker for the UK + country setup screens (the US
// SetupScreen has its own inline cards). "normal" is the true historical fight;
// "easy" grants the underdog handicap so any year is winnable; "hard" is the
// pure-challenge headwind.
const OPTIONS: { id: Difficulty; name: string; blurb: string; Icon: typeof Flag }[] = [
  { id: "easy", name: "Easy", blurb: "A favorable climate, a bigger war chest, a sloppier opponent. Flip even a landslide.", Icon: Flag },
  { id: "normal", name: "Normal", blurb: "The real historical fight, on the calibrated map, against a disciplined campaign.", Icon: Swords },
  { id: "hard", name: "Hard", blurb: "No help, a relentless opponent. Only the tightest races are yours to steal.", Icon: Crosshair },
];

export function DifficultyPicker({ value, onChange }: { value: Difficulty; onChange: (d: Difficulty) => void }) {
  return (
    <div className="field" style={{ textAlign: "left", margin: "0 0 10px" }}>
      <label>Difficulty</label>
      <div className="su-optgrid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {OPTIONS.map(({ id, name, blurb, Icon }) => {
          const sel = value === id;
          return (
            <button
              key={id}
              type="button"
              className={`scenario-card${sel ? " sel" : ""}`}
              style={{ textAlign: "left", alignItems: "flex-start", borderColor: sel ? "var(--gold)" : undefined, boxShadow: sel ? "var(--glow-gold)" : undefined }}
              onClick={() => onChange(id)}
            >
              <span className="scenario-year" style={{ fontSize: 14, display: "inline-flex", gap: 6, alignItems: "center" }}>
                <Icon size={14} /> {name}
              </span>
              <span className="muted small" style={{ fontSize: 11, lineHeight: 1.35 }}>{blurb}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
