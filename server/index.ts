// CAMPAIGN backend — a thin Express + SQLite process, separate from the static
// SPA. Auth (JWT), activation codes, leaderboard with server-side score
// validation, and achievement sync. Start: `npm run server` (default port 3401;
// 3001 per the original plan is taken on the production box).

import express from "express";
import cors from "cors";
import { getDb } from "./db.js";
import { ensureSeedCodes, generateCodes } from "./activation.js";
import { authRouter } from "./routes/auth.js";
import { leaderboardRouter, achievementsRouter } from "./routes/leaderboard.js";

const PORT = Number(process.env.PORT ?? 3401);

const app = express();
app.use(cors());
app.use(express.json({ limit: "256kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "campaign-server" });
});

app.use("/api/auth", authRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/achievements", achievementsRouter);

// Ops backdoor for minting more codes (never exposed in the client).
app.post("/api/admin/codes", (req, res) => {
  const { secret, packId, scenarioId, count } = req.body ?? {};
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const n = Math.min(1000, Math.max(1, Number(count) || 10));
  res.json({ codes: generateCodes(scenarioId ?? null, packId ?? null, n) });
});

getDb();
ensureSeedCodes();

app.listen(PORT, () => {
  console.log(`[campaign-server] listening on :${PORT}`);
});
