// The Daily Challenge hero card on the landing page. The assignment renders
// entirely from the shared local function (the SPA stays fully playable
// offline/static); the top-3 board is a best-effort fetch that simply stays
// hidden when the campaign server is unreachable.

import { useEffect, useState } from "react";
import { SCENARIOS_BY_ID } from "@content/scenarioRegistry";
import { dailyAssignment, hasPlayedDaily, roleShortName, utcDateString } from "@lib/daily";
import { api, type DailyBoardEntry } from "@lib/api";
import { CalendarDays, Check, Play, Trophy } from "lucide-react";

export function DailyCard({ onPlay }: { onPlay: () => void }) {
  const [today] = useState(() => utcDateString());
  const assignment = dailyAssignment(today);
  const meta = SCENARIOS_BY_ID[assignment.scenarioId];
  const played = hasPlayedDaily(today);
  const [top3, setTop3] = useState<DailyBoardEntry[]>([]);

  useEffect(() => {
    let alive = true;
    api.daily()
      .then((d) => { if (alive && Array.isArray(d.board)) setTop3(d.board.slice(0, 3)); })
      .catch(() => { /* offline / no server — the card still works */ });
    return () => { alive = false; };
  }, []);

  if (!meta) return null;

  return (
    <button
      type="button"
      className="scenario-card"
      onClick={onPlay}
      title={meta.description}
      style={{
        width: "100%",
        textAlign: "left",
        alignItems: "flex-start",
        border: "1px solid var(--gold)",
        boxShadow: "var(--glow-gold)",
      }}
    >
      <span className="row" style={{ gap: 8, alignItems: "center", width: "100%" }}>
        <CalendarDays size={14} style={{ color: "var(--gold)" }} />
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "var(--gold)", textTransform: "uppercase" }}>
          Daily Challenge · {today}
        </span>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 5, alignItems: "center", fontSize: 11, fontWeight: 700, color: played ? "var(--green)" : "var(--gold)" }}>
          {played ? <><Check size={13} /> Played</> : <><Play size={13} /> Play now</>}
        </span>
      </span>

      <span className="scenario-year" style={{ fontSize: 16 }}>
        <span style={{ marginRight: 6 }}>{meta.flag}</span>{meta.label}
      </span>

      <span className="scenario-match" style={{ fontWeight: 700 }}>
        Play as {roleShortName(assignment.role)}
      </span>

      <span className="muted small" style={{ fontSize: 11, lineHeight: 1.4 }}>
        {played
          ? "Played ✓ — see today's board, or replay to beat your best (the server keeps your top score)."
          : <>Seed <strong>{assignment.seed}</strong> — the same race, same events, for everyone on Earth today.</>}
      </span>

      {top3.length > 0 && (
        <span className="row" style={{ gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 11 }}>
          <Trophy size={12} style={{ color: "var(--gold)" }} />
          {top3.map((e) => (
            <span key={e.rank} className="muted small" style={{ fontSize: 11 }}>
              <strong style={{ color: e.rank === 1 ? "var(--gold)" : undefined }}>#{e.rank}</strong>{" "}
              {e.username} · {e.score}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}
