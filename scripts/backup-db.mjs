// Nightly SQLite backup for the Electioneer campaign server.
// Uses better-sqlite3's online backup API (safe against a live WAL database),
// writes dated snapshots, and prunes to the newest KEEP copies.
// Run via the electioneer-backup.timer systemd unit.

import Database from "better-sqlite3";
import { mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const SRC = process.env.CAMPAIGN_DB_PATH ?? new URL("../server/data/campaign.db", import.meta.url).pathname;
const DEST_DIR = process.env.BACKUP_DIR ?? "/var/backups/electioneer";
const KEEP = Number(process.env.BACKUP_KEEP ?? 14);

mkdirSync(DEST_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
const dest = join(DEST_DIR, `campaign-${stamp}.db`);

const db = new Database(SRC, { readonly: true });
await db.backup(dest);
db.close();
console.log(`[backup] ${SRC} -> ${dest}`);

const old = readdirSync(DEST_DIR)
  .filter((f) => f.startsWith("campaign-") && f.endsWith(".db"))
  .map((f) => ({ f, t: statSync(join(DEST_DIR, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t)
  .slice(KEEP);
for (const { f } of old) {
  unlinkSync(join(DEST_DIR, f));
  console.log(`[backup] pruned ${f}`);
}
