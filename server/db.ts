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

    CREATE TABLE IF NOT EXISTS achievements (
      user_id TEXT NOT NULL REFERENCES users(id),
      scenario_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      earned_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, scenario_id, achievement_id)
    );
  `);

  return db;
}

export interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
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
