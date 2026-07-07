import { useEffect, useState } from "react";
import { api, type LeaderboardEntry, type MyRanking } from "@lib/api";
import { SCENARIO_REGISTRY, SCENARIOS_BY_ID } from "@content/scenarioRegistry";
import { useAuthStore } from "@store/authStore";
import { ChevronLeft, Trophy } from "lucide-react";

const DIFFS = ["all", "easy", "normal", "hard"] as const;

export function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [scenarioId, setScenarioId] = useState("us-2024");
  const [difficulty, setDifficulty] = useState<(typeof DIFFS)[number]>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [mine, setMine] = useState<MyRanking[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setEntries(null);
    setError("");
    api.leaderboard(scenarioId, difficulty === "all" ? undefined : difficulty, 20)
      .then((r) => setEntries(r.entries))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not reach the server"));
  }, [scenarioId, difficulty]);

  useEffect(() => {
    if (!user) { setMine([]); return; }
    api.myRankings().then((r) => setMine(r.rankings)).catch(() => {});
  }, [user]);

  const meta = SCENARIOS_BY_ID[scenarioId];

  return (
    <div className="center" style={{ alignItems: "flex-start", paddingTop: 18 }}>
      <div className="setup" style={{ maxWidth: 860 }}>
        <div className="row" style={{ justifyContent: "space-between", width: "100%" }}>
          <div className="setup-eyebrow" style={{ margin: 0 }}>
            <span className="mark"><Trophy size={16} /></span>LEADERBOARD
          </div>
          <button className="ghost small" onClick={onBack}><ChevronLeft size={14} /> Back</button>
        </div>
        <div className="title" style={{ fontSize: 34 }}>Hall of Campaigns</div>
        <p className="sub">Best score per player, per scenario. Post yours from the results screen.</p>

        <div className="row" style={{ gap: 10, width: "100%", margin: "8px 0 12px", flexWrap: "wrap" }}>
          <div className="field" style={{ textAlign: "left", margin: 0, flex: 2, minWidth: 260 }}>
            <label>Scenario</label>
            <select value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
              {SCENARIO_REGISTRY.map((s) => (
                <option key={s.scenarioId} value={s.scenarioId}>{s.flag} {s.label}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ textAlign: "left", margin: 0, flex: 1, minWidth: 140 }}>
            <label>Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as (typeof DIFFS)[number])}>
              {DIFFS.map((d) => <option key={d} value={d}>{d === "all" ? "All difficulties" : d}</option>)}
            </select>
          </div>
        </div>

        <div className="card" style={{ width: "100%", textAlign: "left" }}>
          {error && <p className="muted small" style={{ color: "var(--rose)" }}>{error} — is the campaign server running?</p>}
          {!error && entries === null && <p className="muted small">Loading…</p>}
          {entries !== null && entries.length === 0 && (
            <p className="muted small">No scores yet for {meta?.label ?? scenarioId}. Be the first to finish a campaign and post one.</p>
          )}
          {entries !== null && entries.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                  <th style={{ padding: "6px 8px" }}>Rank</th>
                  <th style={{ padding: "6px 8px" }}>Player</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Score</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>{meta?.country === "US" ? "EV margin" : "Unit margin"}</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Popular</th>
                  <th style={{ padding: "6px 8px" }}>Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const isMe = user && e.username === user.username;
                  return (
                    <tr key={`${e.rank}-${e.username}`} style={{ borderTop: "1px solid var(--border)", background: isMe ? "rgba(212,175,55,0.08)" : undefined }}>
                      <td style={{ padding: "7px 8px", fontWeight: 700 }}>{e.rank <= 3 ? ["🥇", "🥈", "🥉"][e.rank - 1] : `#${e.rank}`}</td>
                      <td style={{ padding: "7px 8px", fontWeight: isMe ? 800 : 500, color: isMe ? "var(--gold)" : undefined }}>
                        {e.username}{isMe && " (you)"}
                      </td>
                      <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 800, color: "var(--green)" }}>{Math.round(e.score)}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right" }}>{e.evMargin !== null ? (e.evMargin >= 0 ? `+${e.evMargin}` : e.evMargin) : "—"}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right" }}>{e.popularVoteMargin !== null ? `${e.popularVoteMargin >= 0 ? "+" : ""}${Number(e.popularVoteMargin).toFixed(1)}` : "—"}</td>
                      <td style={{ padding: "7px 8px" }} className="muted">{e.difficulty}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {user && mine.length > 0 && (
          <div className="card" style={{ width: "100%", textAlign: "left", marginTop: 12 }}>
            <h3 style={{ marginTop: 0 }}>Your rankings</h3>
            {mine.map((r) => (
              <div className="kv" key={r.scenarioId}>
                <span className="k">{SCENARIOS_BY_ID[r.scenarioId]?.label ?? r.scenarioId}</span>
                <span>#{r.rank} · {Math.round(r.score)} pts · {r.difficulty}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
