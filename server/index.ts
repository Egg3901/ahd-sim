// CAMPAIGN backend — a thin Express + SQLite process, separate from the static
// SPA. Auth (JWT), activation codes, leaderboard with server-side score
// validation, and achievement sync. Start: `npm run server` (default port 3401;
// 3001 per the original plan is taken on the production box).

import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "./db.js";
import { ensureSeedCodes, generateCodes } from "./activation.js";
import { authRouter } from "./routes/auth.js";
import { leaderboardRouter, achievementsRouter } from "./routes/leaderboard.js";
import { dailyRouter } from "./routes/daily.js";
import { lakesideRouter } from "./routes/lakeside.js";
import { secretEquals } from "./lakeside.js";
import { requireAuth, type AuthedRequest } from "./auth.js";
import { fetchPlatformPurchases, identityForUser } from "./entitlements.js";
import { PACKS_BY_ID } from "../src/content/packs.js";

const PORT = Number(process.env.PORT ?? 3401);
const HERE = dirname(fileURLToPath(import.meta.url));
// Production single-process mode: serve the built SPA alongside the API (the
// sim.ahousedividedgame.com deployment — Caddy proxies the whole host here).
const DIST = process.env.CAMPAIGN_DIST ?? join(HERE, "..", "dist");

const app = express();
app.use(cors());
app.use(express.json({ limit: "256kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "campaign-server" });
});

app.use("/api/auth", authRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/achievements", achievementsRouter);
app.use("/api/daily", dailyRouter);
app.use(lakesideRouter);   // /api/lakeside/*, /api/internal/*

// Same-origin proxy so the client can list the current user's platform
// purchases without ever seeing INTERNAL_TOKEN. Commerce is owned by the
// Lakeside platform now; this game only reads.
app.get("/api/my-entitlements", requireAuth, async (req: AuthedRequest, res) => {
  const identity = identityForUser(req.auth!.userId);
  const purchases = identity ? await fetchPlatformPurchases(identity) : [];
  res.json({
    purchases: purchases.map((p) => ({
      packId: p.productId,
      packName: p.name ?? PACKS_BY_ID[p.productId]?.name ?? p.productId,
      scenarioId: null,
      provider: "stripe" as const,
      amountCents: p.amountCents,
      currency: p.currency,
      status: p.status === "refunded" ? "refunded" : "paid",
      createdAt: p.createdAt,
    })),
  });
});

// Ops backdoor for minting more codes (never exposed in the client).
app.post("/api/admin/codes", (req, res) => {
  const { secret, packId, scenarioId, count } = req.body ?? {};
  if (!secretEquals(secret, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const n = Math.min(1000, Math.max(1, Number(count) || 10));
  res.json({ codes: generateCodes(scenarioId ?? null, packId ?? null, n) });
});

// Static SPA (when a build exists): assets first, then the index fallback for
// client-side routes. API routes above always win.
if (existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(join(DIST, "index.html"));
  });
  console.log(`[campaign-server] serving SPA from ${DIST}`);
}

getDb();
ensureSeedCodes();

app.listen(PORT, () => {
  console.log(`[campaign-server] listening on :${PORT}`);
});
