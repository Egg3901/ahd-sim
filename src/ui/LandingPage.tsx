import { useMemo, useState } from "react";
import { SCENARIO_REGISTRY, type ScenarioMeta } from "@content/scenarioRegistry";
import { PACKS } from "@content/packs";
import { useAuthStore } from "@store/authStore";
import { UserMenu } from "@ui/auth/UserMenu";
import { Vote, Lock, Play, Trophy, KeyRound } from "lucide-react";

export type LandingDestination =
  | { kind: "us"; scenarioId: string }   // native id, e.g. "2024"
  | { kind: "uk"; electionId?: string }
  | { kind: "country"; countryId: string }
  | { kind: "leaderboard" };

const DIFF_COLOR: Record<ScenarioMeta["difficulty"], string> = {
  easy: "var(--green)",
  medium: "var(--gold)",
  hard: "var(--rose)",
};

function ScenarioCard({ s, unlocked, onPlay, onLocked }: {
  s: ScenarioMeta;
  unlocked: boolean;
  onPlay: () => void;
  onLocked: () => void;
}) {
  return (
    <button
      type="button"
      className="scenario-card"
      style={{ position: "relative", textAlign: "left", alignItems: "flex-start", opacity: unlocked ? 1 : 0.75, minHeight: 96 }}
      onClick={unlocked ? onPlay : onLocked}
      title={s.description}
    >
      <span className="row" style={{ gap: 8, alignItems: "center", width: "100%" }}>
        <span style={{ fontSize: 18 }}>{s.flag}</span>
        <span className="scenario-year" style={{ fontSize: 15 }}>{s.label.split("·")[0].trim()}</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: DIFF_COLOR[s.difficulty] }}>{s.difficulty}</span>
          {s.free ? (
            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--green)", border: "1px solid var(--green)", borderRadius: 4, padding: "1px 5px" }}>FREE</span>
          ) : !unlocked ? (
            <Lock size={13} style={{ color: "var(--gold)" }} />
          ) : (
            <Play size={13} style={{ color: "var(--green)" }} />
          )}
        </span>
      </span>
      <span className="scenario-match" style={{ fontWeight: 700 }}>{s.label.split("·")[1]?.trim() ?? s.label}</span>
      <span className="muted small" style={{ fontSize: 11, lineHeight: 1.4 }}>{s.description}</span>
      {!unlocked && (
        <span className="muted small" style={{ fontSize: 10, color: "var(--gold)" }}>
          <KeyRound size={10} style={{ verticalAlign: "-1px" }} /> Unlock with a code
        </span>
      )}
    </button>
  );
}

export function LandingPage({ onGo }: { onGo: (dest: LandingDestination) => void }) {
  const canPlay = useAuthStore((s) => s.canPlay);
  const unlocked = useAuthStore((s) => s.unlocked);
  const openModal = useAuthStore((s) => s.openModal);
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<"all" | "US" | "UK" | "global">("all");

  const scenarios = useMemo(() => {
    if (tab === "US") return SCENARIO_REGISTRY.filter((s) => s.country === "US");
    if (tab === "UK") return SCENARIO_REGISTRY.filter((s) => s.country === "UK");
    if (tab === "global") return SCENARIO_REGISTRY.filter((s) => !["US", "UK"].includes(s.country));
    return SCENARIO_REGISTRY;
  }, [tab]);

  const free = SCENARIO_REGISTRY.filter((s) => s.free);

  const play = (s: ScenarioMeta) => {
    if (s.engine === "us") onGo({ kind: "us", scenarioId: s.nativeId });
    else if (s.engine === "uk") onGo({ kind: "uk", electionId: s.nativeId });
    else onGo({ kind: "country", countryId: s.country });
  };

  const locked = (s: ScenarioMeta) => {
    openModal(user ? "activate" : "login", s.scenarioId);
  };

  return (
    <div className="center" style={{ alignItems: "flex-start", paddingTop: 18 }}>
      <div className="setup" style={{ maxWidth: 980 }}>
        {/* Top bar: brand left, auth right */}
        <div className="row" style={{ justifyContent: "space-between", width: "100%", marginBottom: 6 }}>
          <div className="setup-eyebrow" style={{ margin: 0 }}>
            <span className="mark"><Vote size={18} /></span>CAMPAIGN — RUN THE RACE
          </div>
          <div className="row" style={{ gap: 6 }}>
            <button className="ghost small" onClick={() => onGo({ kind: "leaderboard" })}>
              <Trophy size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Leaderboard
            </button>
            <UserMenu />
          </div>
        </div>

        <div className="title">A House Divided</div>
        <p className="sub">
          Twenty-three elections across five countries — presidential duels, multiparty brawls, a French runoff.
          Two are free forever. The rest unlock with a pack code.
        </p>

        {/* Free tier, front and center */}
        <div className="field" style={{ textAlign: "left", margin: "10px 0 4px" }}>
          <label>Play free — no account needed</label>
          <div className="scenario-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {free.map((s) => (
              <ScenarioCard key={s.scenarioId} s={s} unlocked onPlay={() => play(s)} onLocked={() => {}} />
            ))}
          </div>
        </div>

        {/* Full catalog */}
        <div className="field" style={{ textAlign: "left", margin: "14px 0 0" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <label>Browse all scenarios</label>
            <div className="row" style={{ gap: 4 }}>
              {([["all", "All"], ["US", "🇺🇸 US"], ["UK", "🇬🇧 UK"], ["global", "🌍 Global"]] as const).map(([id, label]) => (
                <button key={id} className={`ghost small${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="scenario-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {scenarios.map((s) => (
              <ScenarioCard
                key={s.scenarioId}
                s={s}
                unlocked={canPlay(s.scenarioId)}
                onPlay={() => play(s)}
                onLocked={() => locked(s)}
              />
            ))}
          </div>
        </div>

        {/* Packs strip */}
        <div className="field" style={{ textAlign: "left", margin: "16px 0 0" }}>
          <label>Scenario packs — redeem a code to unlock</label>
          <div className="scenario-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
            {PACKS.map((p) => {
              const owned = unlocked.packIds.includes(p.id);
              return (
                <button key={p.id} type="button" className={`scenario-card${owned ? " sel" : ""}`}
                  style={{ textAlign: "left", alignItems: "flex-start" }}
                  onClick={() => openModal(user ? "activate" : "register")}>
                  <span className="scenario-year" style={{ fontSize: 14 }}>
                    {p.name} {owned && "✓"}
                  </span>
                  <span className="scenario-match">{p.scenarios.length} scenarios · ${(p.price / 100).toFixed(2)}</span>
                  <span className="muted small" style={{ fontSize: 11 }}>{p.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
