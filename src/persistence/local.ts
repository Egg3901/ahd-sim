import Dexie, { type Table } from "dexie";
import type { ReplayRecord, SaveMeta, SaveRecord, SyncProvider } from "./types";

// IndexedDB-backed local saves via Dexie. Works as-is inside a Tauri webview.
class CampaignDb extends Dexie {
  saves!: Table<SaveRecord, string>;
  replays!: Table<ReplayRecord, string>;
  constructor() {
    super("campaign-2020");
    this.version(1).stores({
      // index by id (primary) and updatedAt for sorting.
      saves: "id, updatedAt",
    });
    // v2 adds the replay/timeline log store. Existing saves carry over
    // untouched; the new table starts empty and fills as games are played.
    this.version(2).stores({
      saves: "id, updatedAt",
      replays: "id, updatedAt",
    });
  }
}

const db = new CampaignDb();

export class LocalSyncProvider implements SyncProvider {
  readonly kind = "local" as const;

  async save(record: SaveRecord): Promise<void> {
    await db.saves.put(record);
  }

  async load(id: string): Promise<SaveRecord | null> {
    return (await db.saves.get(id)) ?? null;
  }

  async list(): Promise<SaveMeta[]> {
    const all = await db.saves.orderBy("updatedAt").reverse().toArray();
    return all.map(({ id, name, updatedAt, turn, playerCandidate }) => ({
      id,
      name,
      updatedAt,
      turn,
      playerCandidate,
    }));
  }

  async remove(id: string): Promise<void> {
    await db.saves.delete(id);
    await db.replays.delete(id).catch(() => {});
  }

  async saveReplay(record: ReplayRecord): Promise<void> {
    await db.replays.put(record);
  }

  async loadReplay(id: string): Promise<ReplayRecord | null> {
    return (await db.replays.get(id)) ?? null;
  }

  async removeReplay(id: string): Promise<void> {
    await db.replays.delete(id);
  }
}

export const localProvider = new LocalSyncProvider();
