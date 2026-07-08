import { useEffect, useMemo, useState } from "react";
import {
  dailyAssignment,
  utcDateString,
  roleShortName,
  markDailyPlayed,
  recordDailyBest,
  dailyBest,
  dailyStreak,
} from "@lib/daily";
import { SCENARIOS_BY_ID } from "@content/scenarioRegistry";
import { buildShareText, copyShare } from "@lib/shareCard";
import { api } from "@lib/api";
import { useAuthStore } from "@store/authStore";
import { hashSeed } from "@engine/rng";
import { hashStr } from "@engine/setup";
import type { ScoreFacts } from "@engine/scoring";
import { CalendarDays, Share2 } from "lucide-react";

// Shown on a results screen ONLY when the finished game is today's Daily
// Challenge (matched by scenario + the numeric hash of the daily seed).
// Offers the Wordle-style share text and posts the run to the daily board.
export function DailyResultPanel({ gameSeed, scenarioId, engine, won, unitLine, score, facts, evMargin, popularVoteMargin }: {
  gameSeed: number;
  scenarioId: string; // global id, e.g. "us-2020"
  engine: "us" | "uk" | "country";
  won: boolean;
  unitLine: string;   // "322 EV" / "371 seats"
  score: number;
  facts: ScoreFacts;
  evMargin: number;
  popularVoteMargin: number;
}) {
  const user = useAuthStore((s) => s.user);
  const openModal = useAuthStore((s) => s.openModal);
  const today = useMemo(() => dailyAssignment(utcDateString()), []);
  const isDaily =
    today.scenarioId === scenarioId &&
    gameSeed === (engine === "us" ? hashStr(today.seed) : hashSeed(today.seed));

  const [copied, setCopied] = useState(false);
  const [postState, setPostState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [note, setNote] = useState("");
  const [best, setBest] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);

  // Mark played + record personal best on first mount of a finished daily.
  useEffect(() => {
    if (!isDaily) return;
    markDailyPlayed(today.date);
    setBest(recordDailyBest(today.date, score));
    setStreak(dailyStreak());
  }, [isDaily, today.date, score]);

  if (!isDaily) return null;
  const meta = SCENARIOS_BY_ID[scenarioId];
  const pb = best ?? dailyBest(today.date);

  const share = async () => {
    const ok = await copyShare(buildShareText({
      date: today.date,
      label: meta?.label ?? scenarioId,
      flag: meta?.flag ?? "🗳️",
      role: roleShortName(today.role),
      won,
      unitLine,
      score,
    }));
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2500);
  };

  const post = async () => {
    setPostState("busy");
    try {
      const out = await api.postDaily({ score, facts, evMargin, popularVoteMargin });
      setPostState("done");
      setNote(out.posted ? `On the board — rank #${out.rank} today.` : `Kept your best (${out.personalBest}). Rank #${out.rank}.`);
    } catch (e) {
      setPostState("error");
      setNote(e instanceof Error ? e.message : "Could not reach the server");
    }
  };

  return (
    <div className="card" style={{ border: "1px solid var(--gold)", background: "var(--navy-600)", margin: "0 0 14px" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="tag muted small" style={{ color: "var(--gold)" }}>
            <CalendarDays size={12} style={{ verticalAlign: "-2px" }} /> DAILY CHALLENGE · {today.date}
          </div>
          <div className="muted small" style={{ marginTop: 4 }}>
            Same race, same seed, everyone. Score {score}
            {pb != null ? ` · personal best ${pb}` : ""}
            {streak > 0 ? ` · ${streak}-day streak` : ""}.
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="ghost" onClick={share}>
            <Share2 size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />
            {copied ? "Copied ✓" : "Share result"}
          </button>
          {user ? (
            <button className="primary" disabled={postState === "busy" || postState === "done"} onClick={post}>
              {postState === "done" ? "Posted ✓" : postState === "busy" ? "Posting…" : "Post to daily board"}
            </button>
          ) : (
            <button className="primary" onClick={() => openModal("login")}>Log in to post</button>
          )}
        </div>
      </div>
      {note && <div className="muted small" style={{ marginTop: 6 }}>{note}</div>}
    </div>
  );
}
