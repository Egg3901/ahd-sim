import { randomBytes, randomUUID } from "node:crypto";
import { getDb, type ActivationRow } from "./db.js";
import { PACKS, PACKS_BY_ID } from "../src/content/packs.js";
import { isFreeScenario } from "../src/content/scenarioRegistry.js";

// CAMP-XXXX-XXXX-XXXX — uppercase alphanumerics minus ambiguous O/0/I/1 (L kept
// out too for safety).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomBlock(len: number): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

function makeCode(): string {
  return `CAMP-${randomBlock(4)}-${randomBlock(4)}-${randomBlock(4)}`;
}

export function generateCodes(scenarioId: string | null, packId: string | null, count: number): string[] {
  const db = getDb();
  const insert = db.prepare(
    "INSERT OR IGNORE INTO activation_codes (code, scenario_id, pack_id, created_at) VALUES (?, ?, ?, ?)",
  );
  const out: string[] = [];
  const tx = db.transaction(() => {
    while (out.length < count) {
      const code = makeCode();
      if (insert.run(code, scenarioId, packId, Date.now()).changes > 0) out.push(code);
    }
  });
  tx();
  return out;
}

/** Pre-seed 100 codes per pack on first run. */
export function ensureSeedCodes(): void {
  const db = getDb();
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM activation_codes").get() as { n: number };
  if (n > 0) return;
  for (const pack of PACKS) generateCodes(null, pack.id, 100);
  console.log(`[activation] seeded ${PACKS.length * 100} codes (100 per pack)`);
}

export interface RedeemOutcome {
  ok: boolean;
  error?: string;
  scenarioId?: string;
  packId?: string;
  packName?: string;
}

export function redeemCode(userId: string, rawCode: string): RedeemOutcome {
  const code = rawCode.trim().toUpperCase();
  if (!/^CAMP-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code)) {
    return { ok: false, error: "Invalid code format — expected CAMP-XXXX-XXXX-XXXX" };
  }
  const db = getDb();
  const row = db.prepare("SELECT * FROM activation_codes WHERE code = ?").get(code) as
    | { code: string; scenario_id: string | null; pack_id: string | null; redeemed_by: string | null }
    | undefined;
  if (!row) return { ok: false, error: "Code not found" };
  if (row.redeemed_by) return { ok: false, error: "Code already redeemed" };

  try {
    db.transaction(() => {
      const claim = db.prepare(
        "UPDATE activation_codes SET redeemed_by = ?, redeemed_at = ? WHERE code = ? AND redeemed_by IS NULL",
      ).run(userId, Date.now(), code);
      if (claim.changes === 0) throw new Error("raced");
      db.prepare(
        "INSERT INTO activations (id, user_id, scenario_id, pack_id, code, redeemed_at) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(randomUUID(), userId, row.scenario_id, row.pack_id, code, Date.now());
    })();
  } catch {
    return { ok: false, error: "Code already redeemed" };
  }

  return {
    ok: true,
    scenarioId: row.scenario_id ?? undefined,
    packId: row.pack_id ?? undefined,
    packName: row.pack_id ? PACKS_BY_ID[row.pack_id]?.name : undefined,
  };
}

export interface Unlocked {
  scenarioIds: string[];
  packIds: string[];
}

export function unlockedForUser(userId: string): Unlocked {
  const rows = getDb().prepare("SELECT * FROM activations WHERE user_id = ?").all(userId) as ActivationRow[];
  const scenarioIds = new Set<string>();
  const packIds = new Set<string>();
  for (const a of rows) {
    if (a.scenario_id) scenarioIds.add(a.scenario_id);
    if (a.pack_id) {
      packIds.add(a.pack_id);
      for (const sid of PACKS_BY_ID[a.pack_id]?.scenarios ?? []) scenarioIds.add(sid);
    }
  }
  return { scenarioIds: [...scenarioIds], packIds: [...packIds] };
}

export function canAccessScenario(userId: string | null, scenarioId: string): boolean {
  if (isFreeScenario(scenarioId)) return true;
  if (!userId) return false;
  return unlockedForUser(userId).scenarioIds.includes(scenarioId);
}
