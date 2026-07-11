// Lakeside ID linking, handoff codes, internal auth, activation codes, and the
// platform entitlements consumer. Commerce (Stripe checkout + the purchases
// ledger) moved to the Lakeside platform, so those tests are gone. Uses a
// throwaway SQLite file (CAMPAIGN_DB_PATH must be set before the db module
// loads, hence the dynamic imports).

import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHmac, randomUUID } from "node:crypto";

process.env.CAMPAIGN_DB_PATH = join(mkdtempSync(join(tmpdir(), "campaign-test-")), "test.db");
process.env.AUTH_SECRET = "test-auth-secret";
process.env.INTERNAL_TOKEN = "test-internal-token";

const dbMod = await import("../db.ts");
const activation = await import("../activation.ts");
const lakeside = await import("../lakeside.ts");
const entitlements = await import("../entitlements.ts");

function makeUser(overrides: Partial<{ username: string; email: string; ahd: string | null }> = {}) {
  const id = randomUUID();
  const username = overrides.username ?? `u_${id.slice(0, 8)}`;
  const email = overrides.email ?? `${username}@example.com`;
  dbMod.getDb().prepare(
    "INSERT INTO users (id, username, email, password_hash, created_at, ahd_user_id) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(id, username, email, "x", Date.now(), overrides.ahd ?? null);
  return { id, username, email };
}

function gameJwt(payload: Record<string, unknown>, secret = process.env.AUTH_SECRET!): string {
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const head = enc({ alg: "HS256", typ: "JWT" });
  const body = enc(payload);
  const sig = createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

beforeAll(() => {
  dbMod.getDb();
});

afterEach(() => {
  vi.restoreAllMocks();
  entitlements.clearEntitlementsCache();
});

describe("platform entitlements consumer", () => {
  function mockPlatform(purchases: unknown) {
    return vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ purchases }), { status: 200 }),
    );
  }

  it("unlocks an owned platform pack, OR'd with local activation codes", async () => {
    const user = makeUser({ ahd: "ahd_ent_1", email: "ent1@example.com" });
    // Local code unlock of the global pack.
    const [code] = activation.generateCodes(null, "global", 1);
    activation.redeemCode(user.id, code);
    // Platform reports the user owns the US historical pack.
    const spy = mockPlatform([{ game: "electioneer", productId: "us-historical", status: "paid" }]);

    const unlocked = await activation.unlockedForUserWithPlatform(user.id);
    expect(unlocked.packIds).toContain("global");        // local code
    expect(unlocked.packIds).toContain("us-historical"); // platform
    expect(unlocked.scenarioIds).toContain("us-2016");   // expanded from the pack
    // Bearer token + query identity are sent to the platform.
    const url = String(spy.mock.calls[0][0]);
    expect(url).toContain("ahdUserId=ahd_ent_1");
    expect((spy.mock.calls[0][1] as RequestInit).headers).toMatchObject({
      Authorization: "Bearer test-internal-token",
    });
  });

  it("ignores refunded and other-game rows", async () => {
    const user = makeUser({ ahd: "ahd_ent_2", email: "ent2@example.com" });
    mockPlatform([
      { game: "electioneer", productId: "complete", status: "refunded" },
      { game: "metroforge", productId: "complete", status: "paid" },
    ]);
    const owned = await activation.unlockedForUserWithPlatform(user.id);
    expect(owned.packIds).toEqual([]);
  });

  it("fails soft (no platform unlock) when the platform errors", async () => {
    const user = makeUser({ ahd: "ahd_ent_3", email: "ent3@example.com" });
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    const unlocked = await activation.unlockedForUserWithPlatform(user.id);
    expect(unlocked.packIds).toEqual([]);
    // Free scenarios still resolve (paywall is off), proving the game never
    // blocks play on the platform being reachable.
    expect(await activation.canAccessScenarioWithPlatform(user.id, "us-2016")).toBe(true);
  });
});

describe("lakeside identity", () => {
  it("reads a valid game JWT cookie and rejects a forged one", () => {
    const payload = { userId: "ahd123", email: "Player@Example.com", username: "player", exp: Date.now() / 1000 + 600 };
    const good = { headers: { cookie: `auth-token-game=${gameJwt(payload)}` } };
    const bad = { headers: { cookie: `auth-token-game=${gameJwt(payload, "wrong-secret")}` } };
    expect(lakeside.getLakesideIdentity(good as never)?.ahdUserId).toBe("ahd123");
    expect(lakeside.getLakesideIdentity(bad as never)).toBeNull();
  });

  it("rejects an expired token", () => {
    const payload = { userId: "ahd123", email: "p@e.com", username: "p", exp: Date.now() / 1000 - 10 };
    const req = { headers: { cookie: `auth-token-game=${gameJwt(payload)}` } };
    expect(lakeside.getLakesideIdentity(req as never)).toBeNull();
  });

  it("link-by-email attaches ahd_user_id to the existing local account", () => {
    const local = makeUser({ email: "linkme@example.com" });
    const linked = lakeside.linkOrCreateUser({ ahdUserId: "ahd_link_1", email: "LinkMe@Example.com", username: "whatever" });
    expect(linked.id).toBe(local.id);
    const row = dbMod.getDb().prepare("SELECT ahd_user_id FROM users WHERE id = ?").get(local.id) as { ahd_user_id: string };
    expect(row.ahd_user_id).toBe("ahd_link_1");
    // Second sign-in resolves by ahd_user_id, same account.
    expect(lakeside.linkOrCreateUser({ ahdUserId: "ahd_link_1", email: "other@example.com", username: "x" }).id).toBe(local.id);
  });

  it("creates a fresh local user when nothing matches", () => {
    const u = lakeside.linkOrCreateUser({ ahdUserId: "ahd_new_1", email: "brand-new@example.com", username: "NewPlayer" });
    expect(u.ahd_user_id).toBe("ahd_new_1");
    expect(u.email).toBe("brand-new@example.com");
  });

  it("closes the local password door when linking an email-collision account (takeover fix)", () => {
    // Simulate a squatter who pre-registered the victim's email locally with a
    // password they know (makeUser stores password_hash = "x").
    const squat = makeUser({ email: "victim@example.com" });
    const before = dbMod.getDb().prepare("SELECT password_hash FROM users WHERE id = ?").get(squat.id) as { password_hash: string };
    expect(before.password_hash).toBe("x");

    // The verified AHD owner signs in for the first time.
    const linked = lakeside.linkOrCreateUser({ ahdUserId: "ahd_victim", email: "victim@example.com", username: "victim" });
    expect(linked.id).toBe(squat.id);
    expect(linked.ahd_user_id).toBe("ahd_victim");

    // The squatter's known password no longer opens the account.
    const after = dbMod.getDb().prepare("SELECT password_hash FROM users WHERE id = ?").get(squat.id) as { password_hash: string };
    expect(after.password_hash).not.toBe("x");
    expect(after.password_hash.length).toBeGreaterThan(20); // a real bcrypt hash
  });
});

describe("handoff codes", () => {
  const identity = { ahdUserId: "ahd_h1", email: "h@example.com", username: "handoff" };

  it("redeems exactly once", () => {
    const code = lakeside.mintHandoffCode(identity);
    expect(lakeside.redeemHandoffCode(code)).toEqual(identity);
    expect(lakeside.redeemHandoffCode(code)).toBeNull();
  });

  it("expires after 60 seconds", () => {
    const now = Date.now();
    const code = lakeside.mintHandoffCode(identity, now);
    expect(lakeside.redeemHandoffCode(code, now + lakeside.HANDOFF_TTL_MS + 1)).toBeNull();
  });

  it("rejects unknown codes", () => {
    expect(lakeside.redeemHandoffCode("not-a-code")).toBeNull();
  });
});

describe("internal API auth", () => {
  it("accepts only the exact bearer token", () => {
    expect(lakeside.checkInternalToken("Bearer test-internal-token")).toBe(true);
    expect(lakeside.checkInternalToken("Bearer wrong")).toBe(false);
    expect(lakeside.checkInternalToken(undefined)).toBe(false);
    expect(lakeside.checkInternalToken("test-internal-token")).toBe(false);
  });
});

describe("return URL allowlist", () => {
  const base = "https://sim.ahousedividedgame.com";
  it("allows relative paths, allowlisted https hosts, and nothing else", () => {
    expect(lakeside.resolveReturnUrl("/foo", base)).toBe(`${base}/foo`);
    expect(lakeside.resolveReturnUrl("https://lakesidegames.net/games/electioneer/", base))
      .toBe("https://lakesidegames.net/games/electioneer/");
    expect(lakeside.resolveReturnUrl("https://evil.example.com/", base)).toBeNull();
    expect(lakeside.resolveReturnUrl("http://lakesidegames.net/", base)).toBeNull();
    expect(lakeside.resolveReturnUrl(undefined, base)).toBe(`${base}/`);
  });
});

describe("code redemption purchases backfill", () => {
  it("records a provider=code purchase row when a code is redeemed", () => {
    const user = makeUser({ ahd: "ahd_code_1" });
    const [code] = activation.generateCodes(null, "global", 1);
    const out = activation.redeemCode(user.id, code);
    expect(out.ok).toBe(true);
    const row = dbMod.getDb().prepare("SELECT * FROM purchases WHERE provider_ref = ?").get(code) as Record<string, unknown>;
    expect(row.provider).toBe("code");
    expect(row.pack_id).toBe("global");
    expect(row.amount_cents).toBe(0);
    expect(row.ahd_user_id).toBe("ahd_code_1");
  });
});
