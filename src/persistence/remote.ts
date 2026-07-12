import type { ReplayRecord, SaveMeta, SaveRecord, SyncProvider } from "./types";
import type { GameState } from "@engine/index";
import type { ReplayLog } from "@lib/replay";
import { api, getToken } from "@lib/api";

// Server-backed save sync for signed-in players. This is the cross-device
// mirror, NOT the source of truth: src/persistence/local.ts (Dexie) always
// works offline and is written first. Every method here is wrapped so a network
// failure degrades to local-only silently (console.warn only) and never blocks
// or breaks play. Reads fail soft to null / empty list; writes fire-and-forget
// with a single retry.
//
// isActive() lets callers skip remote work entirely when logged out.
export class RemoteSyncProvider implements SyncProvider {
  readonly kind = "remote" as const;

  // Only sync when the player is signed in (a token is stored).
  isActive(): boolean {
    return !!getToken();
  }

  private warn(op: string, err: unknown): void {
    console.warn(`[cloud-saves] ${op} failed, staying local only:`, err);
  }

  // Run a write with one retry, swallowing failures. Never throws.
  private async push(op: string, fn: () => Promise<unknown>): Promise<void> {
    if (!this.isActive()) return;
    try {
      await fn();
    } catch (first) {
      try {
        await fn();
      } catch (second) {
        void first;
        this.warn(op, second);
      }
    }
  }

  async save(record: SaveRecord): Promise<void> {
    await this.push("save", () =>
      api.putSave(record.id, {
        name: record.name,
        turn: record.turn,
        playerCandidate: record.playerCandidate,
        state: record.state,
        updatedAt: record.updatedAt,
      }),
    );
  }

  async load(id: string): Promise<SaveRecord | null> {
    if (!this.isActive()) return null;
    try {
      const r = await api.getSave(id);
      return {
        id: r.id,
        name: r.name,
        updatedAt: r.updatedAt,
        turn: r.turn,
        playerCandidate: r.playerCandidate as GameState["playerCandidate"],
        state: r.state as GameState,
      };
    } catch (err) {
      this.warn("load", err);
      return null;
    }
  }

  async list(): Promise<SaveMeta[]> {
    if (!this.isActive()) return [];
    try {
      const { saves } = await api.listSaves();
      return saves.map((s) => ({
        id: s.id,
        name: s.name,
        updatedAt: s.updatedAt,
        turn: s.turn,
        playerCandidate: s.playerCandidate as GameState["playerCandidate"],
      }));
    } catch (err) {
      this.warn("list", err);
      return [];
    }
  }

  async remove(id: string): Promise<void> {
    await this.push("remove", () => api.deleteSave(id));
  }

  async saveReplay(record: ReplayRecord): Promise<void> {
    await this.push("saveReplay", () =>
      api.putReplay(record.id, { log: record.log, updatedAt: record.updatedAt }),
    );
  }

  async loadReplay(id: string): Promise<ReplayRecord | null> {
    if (!this.isActive()) return null;
    try {
      const r = await api.getReplay(id);
      return { id: r.id, updatedAt: r.updatedAt, log: r.log as ReplayLog };
    } catch (err) {
      this.warn("loadReplay", err);
      return null;
    }
  }

  async removeReplay(id: string): Promise<void> {
    // The replay lives on the save row server-side; deleting the save removes
    // it. A standalone replay delete is a no-op the local provider handles.
    void id;
  }
}

export const remoteProvider = new RemoteSyncProvider();
