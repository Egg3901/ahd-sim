import Dexie, { type Table } from "dexie";
import type { SaveMeta, SaveRecord, SyncProvider } from "./types";

// IndexedDB-backed local saves via Dexie. Works as-is inside a Tauri webview.
class CampaignDb extends Dexie {
  saves!: Table<SaveRecord, string>;
  constructor() {
    super("campaign-2020");
    this.version(1).stores({
      // index by id (primary) and updatedAt for sorting.
      saves: "id, updatedAt",
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
  }
}

export const localProvider = new LocalSyncProvider();
