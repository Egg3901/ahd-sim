// The Daily Challenge banner on the landing page. Compact by design: flag,
// title, seed line, play button. No cover photo. The assignment renders
// entirely from the shared local function (the SPA stays fully playable
// offline/static); the top-3 board is a best-effort fetch that simply stays
// hidden when the campaign server is unreachable.

import { useEffect, useState } from "react";
import { SCENARIOS_BY_ID } from "@content/scenarioRegistry";
import { dailyAssignment, hasPlayedDaily, roleShortName, utcDateString, dailyStreak, dailyBest } from "@lib/daily";
import { api, type DailyBoardEntry } from "@lib/api";
import { CalendarDays, Check, Play, Trophy, Flame } from "lucide-react";

export function DailyCard({ onPlay }: { onPlay: () => void }) {
  const [today] = useState(() => utcDateString());
  const assignment = dailyAssignment(today);
  const meta = SCENARIOS_BY_ID[assignment.scenarioId];
  const played = hasPlayedDaily(today);
  const streak = dailyStreak();
  const best = dailyBest(today);
  const [top3, setTop3] = useState<DailyBoardEntry[]>([]);

  useEffect(() => {
    let alive = true;
    api.daily()
      .then((d) => { if (alive && Array.isArray(d.board)) setTop3(d.board.slice(0, 3)); })
      .catch(() => { /* offline / no server: the card still works */ });
    return () => { alive = false; };
  }, []);

  if (!meta) return null;

  return (
    <button
      type="button"
      className="daily-banner"
      onClick={onPlay}
      title={meta.description}
    >
      <span className="daily-banner-main">
        <span className="row" style={{ gap: 8, alignItems: "center" }}>
          <CalendarDays size={14} style={{ color: "var(--gold)" }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "var(--gold)", textTransform: "uppercase" }}>
            Daily Challenge · {today}
          </span>
        </span>
        <span className="scenario-year" style={{ fontSize: 16 }}>
          <span style={{ marginRight: 6 }}>{meta.flag}</span>{meta.label}
          <span className="muted" style={{ fontWeight: 600, fontSize: 13, marginLeft: 8 }}>as {roleShortName(assignment.role)}</span>
        </span>
        <span className="muted small" style={{ fontSize: 11, lineHeight: 1.4 }}>
          {played
            ? <>Played ✓{best != null ? ` · best ${best}` : ""}. See today's board, or replay to beat your best.</>
            : <>Seed <strong>{assignment.seed}</strong>. Everyone plays the same race and the same events today.</>}
        </span>
        {(streak > 0 || top3.length > 0) && (
          <span className="row" style={{ gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 11 }}>
            {streak > 0 && (
              <span style={{ display: "inline-flex", gap: 4, alignItems: "center", color: "var(--gold)", fontWeight: 700 }}>
                <Flame size={12} /> {streak}-day streak
              </span>
            )}
            {top3.length > 0 && (
              <>
                <Trophy size={12} style={{ color: "var(--gold)" }} />
                {top3.map((e) => (
                  <span key={e.rank} className="muted small" style={{ fontSize: 11 }}>
                    <strong style={{ color: e.rank === 1 ? "var(--gold)" : undefined }}>#{e.rank}</strong>{" "}
                    {e.username} · {e.score}
                  </span>
                ))}
              </>
            )}
          </span>
        )}
      </span>
      <span className={`daily-banner-cta${played ? " played" : ""}`}>
        {played ? <><Check size={14} /> Played</> : <><Play size={14} /> Play now</>}
      </span>
    </button>
  );
}
