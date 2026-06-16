import type { SaveMeta, SaveRecord, SyncProvider } from "./types";

// STUB ONLY (Section 10). Defines the thin REST shape a future cloud-save
// backend would implement (PUT/GET/LIST/DELETE saves by id). Not wired up — the
// MVP is fully offline. Implementing this + a server is the only work needed to
// light up cloud saves later; nothing else in the app changes.
export class RemoteSyncProvider implements SyncProvider {
  readonly kind = "remote" as const;
  constructor(private baseUrl: string, private token?: string) {}

  // The auth header a real implementation would send on every request.
  // PUT /saves/:id, GET /saves/:id, GET /saves, DELETE /saves/:id.
  protected headers(): HeadersInit {
    return {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }

  async save(record: SaveRecord): Promise<void> {
    // PUT /saves/:id  — not implemented in MVP.
    void this.baseUrl;
    void this.headers;
    void record;
    throw new Error("RemoteSyncProvider is a stub: cloud saves are not enabled in the MVP.");
  }

  async load(id: string): Promise<SaveRecord | null> {
    void id;
    throw new Error("RemoteSyncProvider is a stub: cloud saves are not enabled in the MVP.");
  }

  async list(): Promise<SaveMeta[]> {
    throw new Error("RemoteSyncProvider is a stub: cloud saves are not enabled in the MVP.");
  }

  async remove(id: string): Promise<void> {
    void id;
    throw new Error("RemoteSyncProvider is a stub: cloud saves are not enabled in the MVP.");
  }
}
