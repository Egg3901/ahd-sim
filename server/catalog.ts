// Catalog price consumer. The Lakeside platform owns the one product catalog
// (price + Stripe id + scenario membership) and exposes it at
// /account/api/catalog. This game reads the price from there so there is no
// second hand-maintained price list; the bundled PACKS prices are kept only as
// an instant, offline-safe fallback if the platform is briefly unreachable.

import { PACKS } from "../src/content/packs.js";

const LAKESIDE_BASE = (process.env.LAKESIDE_BASE || "https://lakesidegames.net").replace(/\/+$/, "");
const CATALOG_URL = process.env.LAKESIDE_CATALOG_URL || `${LAKESIDE_BASE}/account/api/catalog?game=electioneer`;
const CACHE_MS = 5 * 60_000;
const TIMEOUT_MS = 5_000;

export interface CatalogItem {
  id: string;
  name: string;
  priceCents: number;
  scenarios: string[];
}

// Bundled fallback: the game's own membership + last-known price.
function bundled(): CatalogItem[] {
  return PACKS.map((p) => ({ id: p.id, name: p.name, priceCents: p.price, scenarios: p.scenarios }));
}

let cache: { at: number; items: CatalogItem[] } | null = null;

/**
 * The Electioneer catalog with platform prices. Fetches the platform catalog
 * (5 min cache) and overlays its prices onto the bundled membership; on any
 * failure returns the bundled fallback so prices always render.
 */
export async function getCatalog(): Promise<CatalogItem[]> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.items;

  const fallback = bundled();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(CATALOG_URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`catalog HTTP ${res.status}`);
    const body = (await res.json()) as { products?: Array<{ id: string; name?: string; priceCents?: number; scenarios?: string[] }> };
    const platform = new Map((body.products ?? []).map((p) => [p.id, p]));
    // Membership stays the game's; price (and name if present) come from the platform.
    const items = fallback.map((f) => {
      const p = platform.get(f.id);
      return p && typeof p.priceCents === "number"
        ? { id: f.id, name: p.name ?? f.name, priceCents: p.priceCents, scenarios: f.scenarios }
        : f;
    });
    cache = { at: now, items };
    return items;
  } catch {
    // Do not cache failures; keep serving bundled prices and retry next call.
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
