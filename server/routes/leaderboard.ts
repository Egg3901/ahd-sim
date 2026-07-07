import { Router } from "express";
import { randomUUID } from "node:crypto";
import { getDb } from "../db.js";
import { requireAuth, type AuthedRequest } from "../auth.js";
import { canAccessScenario } from "../activation.js";
import { validateSubmission, type ScoreSubmission } from "../scoreValidation.js";
import { SCENARIOS_BY_ID } from "../../src/content/scenarioRegistry.js";

export const leaderboardRouter = Router();

// GET /api/leaderboard?scenario=us-2024&difficulty=normal&limit=20
leaderboardRouter.get("/", (req, res) => {
  const scenarioId = String(req.query.scenario ?? "");
  if (!SCENARIOS_BY_ID[scenarioId]) return res.status(400).json({ error: "Valid scenario required" });
  const difficulty = req.query.difficulty ? String(req.query.difficulty) : null;
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const rows = getDb().prepare(`
    SELECT l.score, l.ev_margin, l.popular_vote_margin, l.turns_played, l.difficulty, l.finished_at, u.username
    FROM leaderboard l JOIN users u ON u.id = l.user_id
    WHERE l.scenario_id = ? ${difficulty ? "AND l.difficulty = ?" : ""}
    ORDER BY l.score DESC, l.finished_at ASC
    LIMIT ?
  `).all(...(difficulty ? [scenarioId, difficulty, limit] : [scenarioId, limit])) as Record<string, unknown>[];

  res.json({
    scenarioId,
    entries: rows.map((r, i) => ({
      rank: i + 1,
      username: r.username,
      score: r.score,
      evMargin: r.ev_margin,
      popularVoteMargin: r.popular_vote_margin,
      turnsPlayed: r.turns_played,
      difficulty: r.difficulty,
      finishedAt: r.finished_at,
    })),
  });
});

// POST /api/leaderboard — submit a finished game's score (validated + entitled).
leaderboardRouter.post("/", requireAuth, (req: AuthedRequest, res) => {
  const sub = req.body as ScoreSubmission;
  const verdict = validateSubmission(sub);
  if (!verdict.ok) return res.status(400).json({ error: verdict.error });
  if (!canAccessScenario(req.auth!.userId, sub.scenarioId)) {
    return res.status(402).json({ error: "PAYWALL", scenarioId: sub.scenarioId });
  }

  const db = getDb();
  const existing = db.prepare(
    "SELECT score FROM leaderboard WHERE user_id = ? AND scenario_id = ?",
  ).get(req.auth!.userId, sub.scenarioId) as { score: number } | undefined;

  const isBest = !existing || sub.score > existing.score;
  if (isBest) {
    db.prepare(`
      INSERT INTO leaderboard (id, user_id, scenario_id, score, ev_margin, popular_vote_margin, turns_played, difficulty, finished_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, scenario_id) DO UPDATE SET
        score = excluded.score, ev_margin = excluded.ev_margin,
        popular_vote_margin = excluded.popular_vote_margin, turns_played = excluded.turns_played,
        difficulty = excluded.difficulty, finished_at = excluded.finished_at
    `).run(
      randomUUID(), req.auth!.userId, sub.scenarioId, Math.round(sub.score),
      sub.evMargin ?? null, sub.popularVoteMargin ?? null, sub.turnsPlayed ?? null,
      sub.difficulty, Date.now(),
    );
  }

  const rank = (getDb().prepare(
    `SELECT COUNT(*) + 1 AS r FROM leaderboard
     WHERE scenario_id = ? AND (score > ? OR (score = ? AND finished_at < (SELECT finished_at FROM leaderboard WHERE user_id = ? AND scenario_id = ?)))`,
  ).get(sub.scenarioId, sub.score, sub.score, req.auth!.userId, sub.scenarioId) as { r: number }).r;

  res.json({ posted: isBest, personalBest: isBest ? sub.score : existing!.score, rank });
});

// GET /api/leaderboard/me — the caller's rankings across scenarios.
leaderboardRouter.get("/me", requireAuth, (req: AuthedRequest, res) => {
  const rows = getDb().prepare(`
    SELECT l.scenario_id, l.score, l.ev_margin, l.popular_vote_margin, l.turns_played, l.difficulty, l.finished_at,
      (SELECT COUNT(*) + 1 FROM leaderboard b
       WHERE b.scenario_id = l.scenario_id
         AND (b.score > l.score OR (b.score = l.score AND b.finished_at < l.finished_at))) AS rank
    FROM leaderboard l WHERE l.user_id = ?
    ORDER BY l.finished_at DESC
  `).all(req.auth!.userId) as Record<string, unknown>[];

  res.json({
    rankings: rows.map((r) => ({
      scenarioId: r.scenario_id,
      rank: r.rank,
      score: r.score,
      evMargin: r.ev_margin,
      popularVoteMargin: r.popular_vote_margin,
      turnsPlayed: r.turns_played,
      difficulty: r.difficulty,
      finishedAt: r.finished_at,
    })),
  });
});

// ── Achievements sync (auth'd users; guests keep them locally) ──────────────
export const achievementsRouter = Router();

achievementsRouter.get("/", requireAuth, (req: AuthedRequest, res) => {
  const rows = getDb().prepare(
    "SELECT scenario_id, achievement_id, earned_at FROM achievements WHERE user_id = ?",
  ).all(req.auth!.userId);
  res.json({ achievements: rows });
});

achievementsRouter.post("/", requireAuth, (req: AuthedRequest, res) => {
  const { scenarioId, achievementIds } = req.body ?? {};
  if (!SCENARIOS_BY_ID[scenarioId]) return res.status(400).json({ error: "Valid scenarioId required" });
  if (!Array.isArray(achievementIds) || achievementIds.some((a) => typeof a !== "string")) {
    return res.status(400).json({ error: "achievementIds must be a string array" });
  }
  const db = getDb();
  const insert = db.prepare(
    "INSERT OR IGNORE INTO achievements (user_id, scenario_id, achievement_id, earned_at) VALUES (?, ?, ?, ?)",
  );
  let added = 0;
  for (const id of achievementIds.slice(0, 50)) {
    added += insert.run(req.auth!.userId, scenarioId, id, Date.now()).changes;
  }
  res.json({ added });
});
