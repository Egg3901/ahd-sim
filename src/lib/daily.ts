// ─────────────────────────────────────────────────────────────────────────
// DAILY CHALLENGE — one seeded scenario per day, identical for everyone.
// Pure and shared verbatim by the client (landing card, routing) and the
// server (routes/daily.ts): both derive the assignment independently from
// the UTC date via a stable hash, so no DB row or network round-trip is
// needed to agree on today's race. No vite-specific imports here (the
// scoring.ts / scenarioRegistry.ts sharing pattern).
// ─────────────────────────────────────────────────────────────────────────

import { SCENARIO_REGISTRY, SCENARIOS_BY_ID, type CountryCode, type ScenarioMeta } from "../content/scenarioRegistry.js";

export interface DailyAssignment {
  date: string;       // "YYYY-MM-DD" (UTC)
  scenarioId: string; // global id from SCENARIO_REGISTRY, e.g. "de-2021"
  seed: string;       // "daily-<date>" — same RNG stream for everyone
  role: string;       // the side everyone plays: "dem"/"rep", "lab"/"con", …
}

// FNV-1a 32-bit — stable, dependency-free, identical in browser and Node.
// (Math.random is forbidden here: client and server must agree bit-for-bit.)
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// The two-major pairing per country — the daily keeps everyone on one of the
// big rivals so the shared board is a fair fight (no Greens-on-hard days).
export const DAILY_ROLE_PAIRS: Record<CountryCode, [string, string]> = {
  US: ["dem", "rep"],
  UK: ["lab", "con"],
  CA: ["lpc", "cpc"],
  DE: ["cdu", "spd"],
  FR: ["ens", "rn"],
  AU: ["alp", "lnp"],
};

// Short display names for the assigned role ("Play as <name>", share text).
const ROLE_NAMES: Record<string, string> = {
  dem: "the Democrats",
  rep: "the Republicans",
  lab: "Labour",
  con: "the Conservatives",
  lpc: "the Liberals",
  cpc: "the Conservatives",
  cdu: "CDU/CSU",
  spd: "the SPD",
  ens: "Ensemble",
  rn: "the RN",
  alp: "Labor",
  lnp: "the Coalition",
};

export function roleShortName(role: string): string {
  return ROLE_NAMES[role] ?? role.toUpperCase();
}

/** Today (or the given instant) as a UTC "YYYY-MM-DD" string. */
export function utcDateString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function isDailyDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * The day's assignment: scenario hashed from the date over the whole
 * registry, role hashed independently (salted with the scenario id so the
 * side rotation doesn't mirror the scenario rotation). Same date in, same
 * assignment out — everywhere.
 */
export function dailyAssignment(dateUTC: string): DailyAssignment {
  const pool: ScenarioMeta[] = SCENARIO_REGISTRY;
  const meta = pool[fnv1a(`daily:${dateUTC}`) % pool.length];
  const pair = DAILY_ROLE_PAIRS[meta.country];
  const role = pair[fnv1a(`role:${dateUTC}:${meta.scenarioId}`) % 2];
  return { date: dateUTC, scenarioId: meta.scenarioId, seed: `daily-${dateUTC}`, role };
}

/** Registry metadata (label, flag, engine, nativeId) for an assignment. */
export function dailyScenarioMeta(a: DailyAssignment): ScenarioMeta | undefined {
  return SCENARIOS_BY_ID[a.scenarioId];
}

// ── Played-today marker (client only; guarded so the server can import) ────
// Typed via globalThis so this file compiles under the server tsconfig,
// which has no DOM lib.
type MiniStorage = { getItem(k: string): string | null; setItem(k: string, v: string): void };
function storage(): MiniStorage | undefined {
  return (globalThis as { localStorage?: MiniStorage }).localStorage;
}

const playedKey = (date: string) => `daily-played-${date}`;
const bestKey = (date: string) => `daily-best-${date}`;
const STREAK_KEY = "daily-streak";
const STREAK_LAST_KEY = "daily-streak-last";

export function markDailyPlayed(date: string): void {
  try {
    const s = storage();
    if (!s) return;
    s.setItem(playedKey(date), "1");
    // Streak: consecutive UTC days with a finished daily.
    const last = s.getItem(STREAK_LAST_KEY);
    const prev = Number(s.getItem(STREAK_KEY) ?? "0") || 0;
    if (last === date) return; // already counted today
    const yesterday = (() => {
      const d = new Date(`${date}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - 1);
      return d.toISOString().slice(0, 10);
    })();
    const next = last === yesterday ? prev + 1 : 1;
    s.setItem(STREAK_KEY, String(next));
    s.setItem(STREAK_LAST_KEY, date);
  } catch { /* private mode etc. */ }
}

export function hasPlayedDaily(date: string): boolean {
  try { return storage()?.getItem(playedKey(date)) === "1"; } catch { return false; }
}

export function dailyStreak(): number {
  try { return Number(storage()?.getItem(STREAK_KEY) ?? "0") || 0; } catch { return 0; }
}

export function recordDailyBest(date: string, score: number): number {
  try {
    const s = storage();
    if (!s) return score;
    const prev = Number(s.getItem(bestKey(date)) ?? "0") || 0;
    const best = Math.max(prev, score);
    s.setItem(bestKey(date), String(best));
    return best;
  } catch {
    return score;
  }
}

export function dailyBest(date: string): number | null {
  try {
    const v = storage()?.getItem(bestKey(date));
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
