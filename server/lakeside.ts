// Lakeside ID: verify the A House Divided game JWT (cookie `auth-token-*` on
// .ahousedividedgame.com) and map it to a local Electioneer user. Also mints
// and redeems the 60 second single-use SSO handoff codes that other
// lakesidegames.net consumers (the account portal) use.
//
// Verification mirrors verifyGameJwt in LSGD-ops-dash/server.js: HS256 over
// header.payload with the shared AUTH_SECRET, timing-safe compare, honor exp.
// Player-level identity does not need the Mongo role check the ops dash does.

import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import bcrypt from "bcryptjs";
import { getDb, type UserRow } from "./db.js";

export interface LakesideIdentity {
  ahdUserId: string;
  email: string;
  username: string;
}

export const DEFAULT_BASE_URL = "https://sim.ahousedividedgame.com";

// BASE_URL is also a Vite-reserved env name ("/" under vitest), so only honor
// values that are actual absolute URLs.
export function configuredBaseUrl(): string {
  const raw = process.env.BASE_URL;
  return (raw && /^https?:\/\//.test(raw) ? raw : DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function b64urlToBuf(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function verifyGameJwt(token: string): Record<string, unknown> | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [h, p, sig] = parts;
    const expected = createHmac("sha256", secret).update(h + "." + p).digest();
    const actual = b64urlToBuf(sig);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const payload = JSON.parse(b64urlToBuf(p).toString("utf8")) as Record<string, unknown>;
    if (typeof payload.exp === "number" && Date.now() / 1000 > payload.exp) return null;
    return payload; // { userId, email, username, role, isAdmin, iat, exp }
  } catch {
    return null;
  }
}

/** Read the game session from the request's cookies, if present and valid. */
export function getLakesideIdentity(req: Request): LakesideIdentity | null {
  const cookies = (req.headers["cookie"] ?? "").split(";").map((c) => c.trim());
  const tokens = cookies
    .filter((c) => c.startsWith("auth-token-"))
    .map((c) => c.slice(c.indexOf("=") + 1))
    .filter(Boolean);
  for (const token of tokens) {
    const payload = verifyGameJwt(token);
    if (!payload) continue;
    const { userId, email, username } = payload;
    if (typeof userId !== "string" || typeof email !== "string" || typeof username !== "string") continue;
    return { ahdUserId: userId, email, username };
  }
  return null;
}

// ── Local account linking ────────────────────────────────────────────────────
// Rule from the contract: match ahd_user_id first, else lowercased email (and
// attach the link), else create a fresh local user with an unusable password.

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

function availableUsername(db: ReturnType<typeof getDb>, wanted: string): string {
  let base = wanted.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 20);
  if (!USERNAME_RE.test(base)) base = `player_${randomBytes(3).toString("hex")}`;
  let candidate = base;
  for (let i = 2; db.prepare("SELECT 1 FROM users WHERE username = ?").get(candidate); i++) {
    const suffix = String(i);
    candidate = base.slice(0, 20 - suffix.length) + suffix;
  }
  return candidate;
}

export function linkOrCreateUser(identity: LakesideIdentity): UserRow {
  const db = getDb();
  const email = identity.email.toLowerCase();

  const byAhd = db.prepare("SELECT * FROM users WHERE ahd_user_id = ?").get(identity.ahdUserId) as UserRow | undefined;
  if (byAhd) return byAhd;

  // A random unusable password: nothing bcrypt-verifies against it, so the
  // local password door is closed until the player deliberately sets one.
  const unusablePassword = () => bcrypt.hashSync(randomBytes(32).toString("hex"), 10);

  // Email match is NOT trusted for silent linking: local registration accepts
  // any unverified email, so an attacker could pre-register a victim's address
  // (with a password they know) and inherit the victim's AHD identity + future
  // purchases on first SSO. The AHD identity's email IS verified (owned at the
  // game), so we make it authoritative: attach this ahd_user_id to the colliding
  // row AND rotate its password_hash to an unusable value, which severs any
  // local-password access a squatter set up. The legitimate AHD owner keeps the
  // account and its data, reached through Lakeside sign-in.
  const byEmail = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
  if (byEmail) {
    db.prepare("UPDATE users SET ahd_user_id = ?, password_hash = ? WHERE id = ?")
      .run(identity.ahdUserId, unusablePassword(), byEmail.id);
    return { ...byEmail, ahd_user_id: identity.ahdUserId };
  }

  const id = randomUUID();
  const username = availableUsername(db, identity.username);
  db.prepare(
    "INSERT INTO users (id, username, email, password_hash, created_at, ahd_user_id) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(id, username, email, unusablePassword(), Date.now(), identity.ahdUserId);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow;
}

// ── Single-use handoff codes (60s TTL) ───────────────────────────────────────

export const HANDOFF_TTL_MS = 60_000;

export function mintHandoffCode(identity: LakesideIdentity, now = Date.now()): string {
  const code = randomBytes(24).toString("base64url");
  getDb().prepare(
    "INSERT INTO handoff_codes (code, ahd_user_id, email, username, expires_at, used) VALUES (?, ?, ?, ?, ?, 0)",
  ).run(code, identity.ahdUserId, identity.email, identity.username, now + HANDOFF_TTL_MS);
  return code;
}

/** Redeem a handoff code exactly once. Expired, unknown, or used → null. */
export function redeemHandoffCode(code: string, now = Date.now()): LakesideIdentity | null {
  const db = getDb();
  const claim = db.prepare(
    "UPDATE handoff_codes SET used = 1 WHERE code = ? AND used = 0 AND expires_at > ?",
  ).run(code, now);
  if (claim.changes === 0) return null;
  const row = db.prepare("SELECT ahd_user_id, email, username FROM handoff_codes WHERE code = ?").get(code) as
    { ahd_user_id: string; email: string; username: string };
  // Opportunistic sweep so the table never accumulates.
  db.prepare("DELETE FROM handoff_codes WHERE expires_at < ?").run(now - HANDOFF_TTL_MS);
  return { ahdUserId: row.ahd_user_id, email: row.email, username: row.username };
}

// ── Internal API auth (account portal) ───────────────────────────────────────

export function checkInternalToken(header: string | undefined): boolean {
  const expected = process.env.INTERNAL_TOKEN;
  if (!expected || !header?.startsWith("Bearer ")) return false;
  const got = Buffer.from(header.slice(7));
  const want = Buffer.from(expected);
  return got.length === want.length && timingSafeEqual(got, want);
}

/** Constant-time secret compare; false when the secret is unset (fail closed). */
export function secretEquals(provided: unknown, expected: string | undefined): boolean {
  if (!expected || typeof provided !== "string") return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ── Return URL allowlist (contract: https only, exact hostnames) ─────────────

const ALLOWED_RETURN_HOSTS = new Set(["lakesidegames.net", "www.lakesidegames.net", "sim.ahousedividedgame.com"]);

/** Resolve a ?return= value to a safe absolute URL, or null if not allowed. */
export function resolveReturnUrl(raw: string | undefined, fallbackBase: string): string | null {
  const base = fallbackBase.replace(/\/+$/, "");
  if (!raw) return base + "/";
  if (raw.startsWith("/")) return base + raw; // relative path: same host
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !ALLOWED_RETURN_HOSTS.has(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
