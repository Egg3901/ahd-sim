// Lakeside ID routes.
//
// Player-facing (cookie only works on sim.ahousedividedgame.com):
//   GET /api/lakeside/login?return=   game cookie -> local session, via a
//                                     one-time code appended to the return URL
//                                     (?lakeside_code=). The SPA exchanges it.
//   POST /api/lakeside/exchange       { code } -> { token, user } (public; the
//                                     code itself is the credential)
//   GET /api/lakeside/handoff?return= SSO for OTHER lakesidegames.net apps:
//                                     302 to return?code=<60s single-use>
//
// Portal-facing (Authorization: Bearer INTERNAL_TOKEN):
//   POST /api/internal/redeem-handoff  { code } -> identity, once
//   GET  /api/internal/entitlements?ahdUserId=&email=
//
// Why a one-time code instead of an HTML token-drop page for login: the SPA
// stores its JWT in localStorage, which is per-origin. A page served by
// sim.ahousedividedgame.com can only write sim's localStorage, so it would
// break the lakesidegames.net/games/electioneer mount. Redirecting back to the
// caller's own origin with a short-lived code lets the SPA store the token in
// the right origin, and the same flow works on both hosts.

import { Router } from "express";
import { getDb, type PurchaseRow, type UserRow } from "../db.js";
import { signToken } from "../auth.js";
import { unlockedForUser } from "../activation.js";
import {
  checkInternalToken, getLakesideIdentity, linkOrCreateUser,
  mintHandoffCode, redeemHandoffCode, resolveReturnUrl,
} from "../lakeside.js";
import { DEFAULT_BASE_URL } from "./checkout.js";
import { PACKS_BY_ID } from "../../src/content/packs.js";

const AHD_LOGIN_URL = "https://www.ahousedividedgame.com/login";

function baseUrl(): string {
  return (process.env.BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
}

export const lakesideRouter = Router();

lakesideRouter.get("/api/lakeside/login", (req, res) => {
  const target = resolveReturnUrl(typeof req.query.return === "string" ? req.query.return : undefined, baseUrl());
  if (!target) return res.status(400).json({ error: "Return URL not allowed" });
  const identity = getLakesideIdentity(req);
  if (!identity) return res.redirect(AHD_LOGIN_URL);
  const url = new URL(target);
  url.searchParams.set("lakeside_code", mintHandoffCode(identity));
  res.redirect(url.toString());
});

lakesideRouter.post("/api/lakeside/exchange", (req, res) => {
  const { code } = req.body ?? {};
  if (typeof code !== "string" || !code) return res.status(400).json({ error: "Code required" });
  const identity = redeemHandoffCode(code);
  if (!identity) return res.status(401).json({ error: "Sign in link expired, try again" });
  const user = linkOrCreateUser(identity);
  res.json({
    token: signToken({ userId: user.id, username: user.username }),
    user: { id: user.id, username: user.username, email: user.email },
    unlocked: unlockedForUser(user.id),
  });
});

lakesideRouter.get("/api/lakeside/handoff", (req, res) => {
  const raw = typeof req.query.return === "string" ? req.query.return : undefined;
  if (!raw) return res.status(400).json({ error: "return required" });
  const target = resolveReturnUrl(raw, baseUrl());
  if (!target) return res.status(400).json({ error: "Return URL not allowed" });
  const identity = getLakesideIdentity(req);
  if (!identity) return res.redirect(AHD_LOGIN_URL);
  const url = new URL(target);
  url.searchParams.set("code", mintHandoffCode(identity));
  res.redirect(url.toString());
});

lakesideRouter.post("/api/internal/redeem-handoff", (req, res) => {
  if (!checkInternalToken(req.headers.authorization)) return res.status(401).json({ error: "Unauthorized" });
  const { code } = req.body ?? {};
  if (typeof code !== "string" || !code) return res.status(400).json({ error: "Code required" });
  const identity = redeemHandoffCode(code);
  if (!identity) return res.status(404).json({ error: "Code invalid, used, or expired" });
  res.json(identity);
});

lakesideRouter.get("/api/internal/entitlements", (req, res) => {
  if (!checkInternalToken(req.headers.authorization)) return res.status(401).json({ error: "Unauthorized" });
  const ahdUserId = typeof req.query.ahdUserId === "string" ? req.query.ahdUserId : null;
  const email = typeof req.query.email === "string" ? req.query.email.toLowerCase() : null;
  if (!ahdUserId && !email) return res.status(400).json({ error: "ahdUserId or email required" });

  const db = getDb();
  const userIds = new Set<string>();
  if (ahdUserId) {
    for (const u of db.prepare("SELECT id FROM users WHERE ahd_user_id = ?").all(ahdUserId) as UserRow[]) userIds.add(u.id);
  }
  if (email) {
    for (const u of db.prepare("SELECT id FROM users WHERE email = ?").all(email) as UserRow[]) userIds.add(u.id);
  }
  const rows: PurchaseRow[] = [];
  for (const id of userIds) {
    rows.push(...(db.prepare("SELECT * FROM purchases WHERE user_id = ? ORDER BY created_at DESC").all(id) as PurchaseRow[]));
  }
  res.json({
    purchases: rows.map((r) => ({
      game: "electioneer",
      packId: r.pack_id,
      packName: r.pack_id ? PACKS_BY_ID[r.pack_id]?.name ?? r.pack_id : null,
      amountCents: r.amount_cents,
      currency: r.currency,
      provider: r.provider,
      createdAt: r.created_at,
      status: r.status,
    })),
  });
});
