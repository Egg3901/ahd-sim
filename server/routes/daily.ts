// DAILY CHALLENGE routes. The assignment itself is computed, not stored —
// src/lib/daily.ts is shared with the client, so both sides independently
// agree on today's scenario/seed/role. The DB only holds scores.

import { Router } from "express";
import { randomUUID } from "node:crypto";
import { getDb } from "../db.js";
import { requireAuth, optionalAuth, type AuthedRequest } from "../auth.js";
import { validateSubmission, type ScoreSubmission } from "../scoreValidation.js";
import { SCENARIOS_BY_ID } from "../../src/content/scenarioRegistry.js";
import { dailyAssignment, isDailyDate, utcDateString } from "../../src/lib/daily.js";

export const dailyRouter = Router();

interface BoardRow {
  score: number;
  ev_margin: number | null;
  popular_margin: number | null;
  difficulty: string;
  finished_at: number;
  username: string;
}

function boardEntries(date: string, limit: number) {
  const rows = getDb().prepare(`
    SELECT d.score, d.ev_margin, d.popular_margin, d.difficulty, d.finished_at, u.username
    FROM daily_scores d JOIN users u ON u.id = d.user_id
    WHERE d.date = ?
    ORDER BY d.score DESC, d.finished_at ASC
    LIMIT ?
  `).all(date, limit) as BoardRow[];
  return rows.map((r, i) => ({
    rank: i + 1,
    username: r.username,
    score: r.score,
    evMargin: r.ev_margin,
    popularVoteMargin: r.popular_margin,
    difficulty: r.difficulty,
    finishedAt: r.finished_at,
  }));
}

function rankFor(date: string, score: number, finishedAt: number): number {
  return (getDb().prepare(`
    SELECT COUNT(*) + 1 AS r FROM daily_scores
    WHERE date = ? AND (score > ? OR (score = ? AND finished_at < ?))
  `).get(date, score, score, finishedAt) as { r: number }).r;
}

// GET /api/daily — today's assignment (+ label/flag) and the top 10 board.
dailyRouter.get("/", (_req, res) => {
  const a = dailyAssignment(utcDateString());
  const meta = SCENARIOS_BY_ID[a.scenarioId];
  res.json({
    ...a,
    label: meta?.label ?? a.scenarioId,
    flag: meta?.flag ?? "",
    board: boardEntries(a.date, 10),
  });
});

// POST /api/daily — submit today's run. Validated exactly like the main
// leaderboard (facts must recompute to the score, against TODAY's scenario);
// one row per user per day, best score kept. No paywall gate: the daily is
// the same free race for everyone even when a scenario is normally packed.
dailyRouter.post("/", requireAuth, (req: AuthedRequest, res) => {
  const a = dailyAssignment(utcDateString());
  const body = (req.body ?? {}) as Partial<ScoreSubmission> & { scenarioId?: string };

  // A submission built for some other scenario is not today's daily.
  if (body.scenarioId !== undefined && body.scenarioId !== a.scenarioId) {
    return res.status(400).json({ error: `Not today's daily scenario (expected ${a.scenarioId})` });
  }

  const sub: ScoreSubmission = {
    scenarioId: a.scenarioId, // validate against the assignment, never the client's claim
    difficulty: (body.difficulty ?? body.facts?.difficulty) as ScoreSubmission["difficulty"],
    score: Number(body.score),
    facts: body.facts as ScoreSubmission["facts"],
    evMargin: body.evMargin,
    popularVoteMargin: body.popularVoteMargin,
  };
  const verdict = validateSubmission(sub);
  if (!verdict.ok) return res.status(400).json({ error: verdict.error });

  const db = getDb();
  const userId = req.auth!.userId;
  const existing = db.prepare(
    "SELECT score, finished_at FROM daily_scores WHERE user_id = ? AND date = ?",
  ).get(userId, a.date) as { score: number; finished_at: number } | undefined;

  const score = Math.round(sub.score);
  const isBest = !existing || score > existing.score;
  const finishedAt = isBest ? Date.now() : existing!.finished_at;
  if (isBest) {
    db.prepare(`
      INSERT INTO daily_scores (id, user_id, date, scenario_id, score, ev_margin, popular_margin, difficulty, finished_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, date) DO UPDATE SET
        scenario_id = excluded.scenario_id, score = excluded.score,
        ev_margin = excluded.ev_margin, popular_margin = excluded.popular_margin,
        difficulty = excluded.difficulty, finished_at = excluded.finished_at
    `).run(
      randomUUID(), userId, a.date, a.scenarioId, score,
      sub.evMargin ?? null, sub.popularVoteMargin ?? null, sub.difficulty, finishedAt,
    );
  }

  const best = isBest ? score : existing!.score;
  res.json({ posted: isBest, personalBest: best, rank: rankFor(a.date, best, finishedAt), date: a.date });
});

// GET /api/daily/board?date=YYYY-MM-DD — top 25 for a day (defaults to
// today), plus the caller's own rank when a token is supplied.
dailyRouter.get("/board", optionalAuth, (req: AuthedRequest, res) => {
  const date = req.query.date ? String(req.query.date) : utcDateString();
  if (!isDailyDate(date)) return res.status(400).json({ error: "date must be YYYY-MM-DD" });

  let me: { rank: number; score: number } | null = null;
  if (req.auth) {
    const mine = getDb().prepare(
      "SELECT score, finished_at FROM daily_scores WHERE user_id = ? AND date = ?",
    ).get(req.auth.userId, date) as { score: number; finished_at: number } | undefined;
    if (mine) me = { rank: rankFor(date, mine.score, mine.finished_at), score: mine.score };
  }

  res.json({
    date,
    scenarioId: dailyAssignment(date).scenarioId,
    entries: boardEntries(date, 25),
    me,
  });
});

interface ChampionRow {
  username: string;
  wins: number;     // days finished #1
  podiums: number;  // days finished top 3
  played: number;   // days entered
  total_score: number;
}

// GET /api/daily/champions — the all-time Daily Challenge standings: who wins
// the most days. One winner per date (highest score, earliest finish breaks
// ties), aggregated per player and ranked by wins, then total points.
dailyRouter.get("/champions", optionalAuth, (req: AuthedRequest, res) => {
  const rows = getDb().prepare(`
    WITH ranked AS (
      SELECT user_id, date, score,
        ROW_NUMBER() OVER (PARTITION BY date ORDER BY score DESC, finished_at ASC) AS rk
      FROM daily_scores
    )
    SELECT u.username,
      SUM(CASE WHEN r.rk = 1 THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN r.rk <= 3 THEN 1 ELSE 0 END) AS podiums,
      COUNT(*) AS played,
      SUM(r.score) AS total_score
    FROM ranked r JOIN users u ON u.id = r.user_id
    GROUP BY r.user_id
    ORDER BY wins DESC, total_score DESC, played DESC
    LIMIT 25
  `).all() as ChampionRow[];

  const entries = rows.map((r, i) => ({
    rank: i + 1,
    username: r.username,
    wins: r.wins,
    podiums: r.podiums,
    played: r.played,
    totalScore: Math.round(r.total_score),
  }));

  // Distinct days that have any entry — context for "N wins out of M days".
  const totalDays = (getDb().prepare(
    "SELECT COUNT(DISTINCT date) AS d FROM daily_scores",
  ).get() as { d: number }).d;

  res.json({ totalDays, entries });
});
