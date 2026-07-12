import Dexie, { type Table } from "dexie";
import type { ReplayRecord, SaveMeta, SaveRecord, SyncProvider } from "./types";
import {
  registerCustomScenario,
  validateCustomScenario,
  type CustomScenario,
} from "@content/customScenario";

// IndexedDB-backed local saves via Dexie. Works as-is inside a Tauri webview.
class CampaignDb extends Dexie {
  saves!: Table<SaveRecord, string>;
  customScenarios!: Table<CustomScenario, string>;
  replays!: Table<ReplayRecord, string>;
  constructor() {
    super("campaign-2020");
    this.version(1).stores({
      // index by id (primary) and updatedAt for sorting.
      saves: "id, updatedAt",
    });
    // v2 adds the custom scenarios store (Campaign Editor) and the
    // replay/timeline log store. Existing saves carry over untouched.
    this.version(2).stores({
      saves: "id, updatedAt",
      customScenarios: "id, updatedAt",
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

// ─────────────────────────────────────────────────────────────────────────
// Custom scenarios (Campaign Editor). Validated at the save AND load boundary
// so a corrupt row can never reach the engine. list() drops any invalid rows
// rather than throwing, so one bad record does not break the whole library.
// ─────────────────────────────────────────────────────────────────────────
export const customScenarioStore = {
  async save(scenario: CustomScenario): Promise<void> {
    const result = validateCustomScenario(scenario);
    if (!result.ok) throw new Error(result.errors.join("\n"));
    await db.customScenarios.put(result.value);
  },

  async load(id: string): Promise<CustomScenario | null> {
    const row = await db.customScenarios.get(id);
    if (!row) return null;
    const result = validateCustomScenario(row);
    if (!result.ok) throw new Error(result.errors.join("\n"));
    return result.value;
  },

  async list(): Promise<CustomScenario[]> {
    const all = await db.customScenarios.orderBy("updatedAt").reverse().toArray();
    const valid: CustomScenario[] = [];
    for (const row of all) {
      const result = validateCustomScenario(row);
      if (result.ok) valid.push(result.value);
    }
    return valid;
  },

  async remove(id: string): Promise<void> {
    await db.customScenarios.delete(id);
  },
};

// Load every saved custom scenario and inject it into the runtime scenario
// registry, so getScenario(id) resolves it after a page reload (a resumed
// autosave of a custom race shows the right year and can be replayed). Best
// effort: persistence failures never block startup.
export async function registerSavedCustomScenarios(): Promise<void> {
  try {
    const all = await customScenarioStore.list();
    for (const cs of all) registerCustomScenario(cs);
  } catch {
    // ignore — the built-in scenarios still work
  }
}
