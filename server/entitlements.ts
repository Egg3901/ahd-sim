// Platform entitlements consumer. Commerce lives on the Lakeside platform now
// (lakesidegames.net/account); this game is a consumer. We ask the platform
// which Electioneer products a signed-in identity owns and treat those as pack
// unlocks. Local activation-code unlocks are separate and OR'd on top by the
// caller (see activation.ts).
//
// Fail soft: any network error, timeout, missing token, or bad response yields
// an empty list so the game never blocks play on the platform being reachable.

import { getDb } from "./db.js";

const GAME = "electioneer";
const CACHE_MS = 30_000;
const TIMEOUT_MS = 5_000;

function entitlementsUrl(): string {
  return process.env.LAKESIDE_ENTITLEMENTS_URL || "https://lakesidegames.net/account/api/entitlements";
}

export interface PlatformPurchase {
  game: string;
  productId: string;
  name: string | null;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: number;
}

export interface Identity {
  ahdUserId: string | null;
  email: string | null;
}

interface CacheEntry { at: number; purchases: PlatformPurchase[] }
const cache = new Map<string, CacheEntry>();

/** Look up the local user's Lakeside identity (ahd_user_id + email). */
export function identityForUser(userId: string): Identity | null {
  const row = getDb().prepare("SELECT email, ahd_user_id FROM users WHERE id = ?").get(userId) as
    | { email: string; ahd_user_id: string | null }
    | undefined;
  if (!row) return null;
  return { ahdUserId: row.ahd_user_id, email: row.email };
}

/**
 * Fetch the platform's Electioneer purchases for an identity. Cached ~30s per
 * identity. Returns [] on any failure.
 */
export async function fetchPlatformPurchases(identity: Identity): Promise<PlatformPurchase[]> {
  const ahdUserId = identity.ahdUserId ?? "";
  const email = (identity.email ?? "").toLowerCase();
  if (!ahdUserId && !email) return [];

  const token = process.env.INTERNAL_TOKEN;
  if (!token) return [];

  const key = `${ahdUserId}|${email}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.at < CACHE_MS) return hit.purchases;

  const url = new URL(entitlementsUrl());
  url.searchParams.set("ahdUserId", ahdUserId);
  url.searchParams.set("email", email);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const body = (await res.json().catch(() => ({}))) as { purchases?: unknown };
    const raw = Array.isArray(body.purchases) ? body.purchases : [];
    const purchases: PlatformPurchase[] = raw
      .map((p) => p as Record<string, unknown>)
      .filter((p) => p && p.game === GAME && p.status !== "refunded")
      .map((p) => ({
        game: GAME,
        productId: String(p.productId ?? p.packId ?? ""),
        name: (p.name ?? p.packName ?? null) as string | null,
        amountCents: Number(p.amountCents ?? 0),
        currency: String(p.currency ?? "usd"),
        status: String(p.status ?? "paid"),
        createdAt: Number(p.createdAt ?? now),
      }))
      .filter((p) => p.productId);
    cache.set(key, { at: now, purchases });
    return purchases;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** The distinct Electioneer product (pack) ids the identity owns. */
export async function ownedProductIds(identity: Identity): Promise<string[]> {
  const purchases = await fetchPlatformPurchases(identity);
  return [...new Set(purchases.map((p) => p.productId))];
}

/** Test-only: drop the per-identity cache. */
export function clearEntitlementsCache(): void {
  cache.clear();
}
