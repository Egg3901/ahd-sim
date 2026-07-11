import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join, dirname as pathDirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = pathDirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.CAMPAIGN_DB_PATH ?? join(HERE, "data", "campaign.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      scenario_id TEXT,
      pack_id TEXT,
      code TEXT NOT NULL,
      redeemed_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activation_codes (
      code TEXT PRIMARY KEY,
      scenario_id TEXT,
      pack_id TEXT,
      created_at INTEGER NOT NULL,
      redeemed_by TEXT REFERENCES users(id),
      redeemed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS leaderboard (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      scenario_id TEXT NOT NULL,
      score REAL NOT NULL,
      ev_margin INTEGER,
      popular_vote_margin REAL,
      turns_played INTEGER,
      difficulty TEXT NOT NULL,
      finished_at INTEGER NOT NULL,
      UNIQUE(user_id, scenario_id)
    );

    CREATE TABLE IF NOT EXISTS daily_scores (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      scenario_id TEXT NOT NULL,
      score REAL NOT NULL,
      ev_margin INTEGER,
      popular_margin REAL,
      difficulty TEXT NOT NULL,
      finished_at INTEGER NOT NULL,
      UNIQUE(user_id, date)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      user_id TEXT NOT NULL REFERENCES users(id),
      scenario_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      earned_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, scenario_id, achievement_id)
    );

    -- Purchases ledger (Lakeside ID contract). provider 'stripe' rows come from
    -- checkout webhooks; provider 'code' rows are backfilled on code redemption.
    -- provider_ref (stripe session id / activation code) is the idempotency key.
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      ahd_user_id TEXT,
      email TEXT NOT NULL,
      pack_id TEXT,
      scenario_id TEXT,
      provider TEXT NOT NULL CHECK (provider IN ('stripe', 'code')),
      provider_ref TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('paid', 'refunded')),
      created_at INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS purchases_provider_ref ON purchases(provider_ref);

    -- Single-use SSO handoff codes for lakesidegames.net consumers (60s TTL).
    CREATE TABLE IF NOT EXISTS handoff_codes (
      code TEXT PRIMARY KEY,
      ahd_user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      username TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Lakeside account link: AHD userId attached to a local user. Additive column
  // migration, same idiom as the CREATE IF NOT EXISTS blocks above.
  const userCols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!userCols.some((c) => c.name === "ahd_user_id")) {
    db.exec("ALTER TABLE users ADD COLUMN ahd_user_id TEXT");
  }
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS users_ahd_user_id ON users(ahd_user_id) WHERE ahd_user_id IS NOT NULL");

  return db;
}

export interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: number;
  ahd_user_id: string | null;
}

export interface PurchaseRow {
  id: string;
  user_id: string;
  ahd_user_id: string | null;
  email: string;
  pack_id: string | null;
  scenario_id: string | null;
  provider: "stripe" | "code";
  provider_ref: string;
  amount_cents: number;
  currency: string;
  status: "paid" | "refunded";
  created_at: number;
}

export interface ActivationRow {
  id: string;
  user_id: string;
  scenario_id: string | null;
  pack_id: string | null;
  code: string;
  redeemed_at: number;
}
