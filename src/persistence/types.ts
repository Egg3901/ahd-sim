import type { GameState } from "@engine/index";
import type { ReplayLog } from "@lib/replay";

// A stored replay/timeline log, keyed by the save id it belongs to (the
// autosave uses AUTOSAVE_ID). Kept in its own Dexie table so the compact
// per-turn numbers persist alongside the game without bloating the SaveRecord.
export interface ReplayRecord {
  id: string;
  updatedAt: number;
  log: ReplayLog;
}

// A single saved game. The full engine snapshot is portable JSON, so saves move
// freely across web, desktop (Tauri), and export/import.
export interface SaveRecord {
  id: string;
  name: string;
  updatedAt: number;
  turn: number;
  playerCandidate: GameState["playerCandidate"];
  state: GameState;
}

export interface SaveMeta {
  id: string;
  name: string;
  updatedAt: number;
  turn: number;
  playerCandidate: GameState["playerCandidate"];
}

// Cloud-save seam (Section 10). Single-player MVP ships only LocalSyncProvider;
// RemoteSyncProvider is stubbed behind the same interface so a backend can be
// added later with no UI rewrite.
export interface SyncProvider {
  readonly kind: "local" | "remote";
  save(record: SaveRecord): Promise<void>;
  load(id: string): Promise<SaveRecord | null>;
  list(): Promise<SaveMeta[]>;
  remove(id: string): Promise<void>;
  // Replay/timeline logs, persisted separately from the game snapshot.
  saveReplay(record: ReplayRecord): Promise<void>;
  loadReplay(id: string): Promise<ReplayRecord | null>;
  removeReplay(id: string): Promise<void>;
}
