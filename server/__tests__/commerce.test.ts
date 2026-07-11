// Stripe checkout grants, Lakeside ID linking, handoff codes, and internal
// auth. Uses a throwaway SQLite file (CAMPAIGN_DB_PATH must be set before the
// db module loads, hence the dynamic imports).

import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHmac, randomUUID } from "node:crypto";
import Stripe from "stripe";

process.env.CAMPAIGN_DB_PATH = join(mkdtempSync(join(tmpdir(), "campaign-test-")), "test.db");
process.env.AUTH_SECRET = "test-auth-secret";
process.env.INTERNAL_TOKEN = "test-internal-token";
process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_dummy";

const dbMod = await import("../db.ts");
const activation = await import("../activation.ts");
const lakeside = await import("../lakeside.ts");
const checkout = await import("../routes/checkout.ts");

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

function fakeSession(id: string, userId: string, packId = "us-historical", paid = true) {
  return {
    id,
    payment_status: paid ? "paid" : "unpaid",
    amount_total: 499,
    currency: "usd",
    metadata: { userId, packId, email: "buyer@example.com" },
  };
}

// Minimal express-shaped req/res for the webhook handler.
function fakeRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
  return res;
}

beforeAll(() => {
  dbMod.getDb();
});

describe("stripe webhook", () => {
  const stripe = new Stripe("sk_test_dummy");

  it("rejects a bad signature with 400 and grants nothing", () => {
    const user = makeUser();
    const payload = Buffer.from(JSON.stringify({
      type: "checkout.session.completed",
      data: { object: fakeSession("cs_bad_sig", user.id) },
    }));
    const res = fakeRes();
    checkout.stripeWebhook(
      { headers: { "stripe-signature": "t=1,v1=deadbeef" }, body: payload } as never,
      res as never,
    );
    expect(res.statusCode).toBe(400);
    expect(activation.unlockedForUser(user.id).packIds).toEqual([]);
  });

  it("accepts a correctly signed event and grants the pack", () => {
    const user = makeUser();
    const event = {
      id: "evt_1", object: "event", type: "checkout.session.completed",
      data: { object: fakeSession("cs_signed_ok", user.id) },
    };
    const payload = JSON.stringify(event);
    const sig = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_test_dummy" });
    const res = fakeRes();
    checkout.stripeWebhook(
      { headers: { "stripe-signature": sig }, body: Buffer.from(payload) } as never,
      res as never,
    );
    expect(res.statusCode).toBe(200);
    expect(activation.unlockedForUser(user.id).packIds).toContain("us-historical");
  });

  it("ignores unrelated event types with 200", () => {
    const event = { id: "evt_2", object: "event", type: "invoice.paid", data: { object: {} } };
    const payload = JSON.stringify(event);
    const sig = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_test_dummy" });
    const res = fakeRes();
    checkout.stripeWebhook(
      { headers: { "stripe-signature": sig }, body: Buffer.from(payload) } as never,
      res as never,
    );
    expect(res.statusCode).toBe(200);
  });
});

describe("checkout grant path", () => {
  it("grants the pack and unlocks its scenarios on paid completion", () => {
    const user = makeUser();
    const granted = checkout.handleCheckoutCompleted(fakeSession("cs_grant_1", user.id));
    expect(granted).toBe(true);
    const unlocked = activation.unlockedForUser(user.id);
    expect(unlocked.packIds).toContain("us-historical");
    expect(unlocked.scenarioIds).toContain("us-2016");
  });

  it("is idempotent: a retried webhook records and grants nothing new", () => {
    const user = makeUser();
    expect(checkout.handleCheckoutCompleted(fakeSession("cs_dup", user.id))).toBe(true);
    expect(checkout.handleCheckoutCompleted(fakeSession("cs_dup", user.id))).toBe(false);
    const db = dbMod.getDb();
    const purchases = db.prepare("SELECT COUNT(*) AS n FROM purchases WHERE provider_ref = ?").get("cs_dup") as { n: number };
    const grants = db.prepare("SELECT COUNT(*) AS n FROM activations WHERE user_id = ?").get(user.id) as { n: number };
    expect(purchases.n).toBe(1);
    expect(grants.n).toBe(1);
  });

  it("does not grant on unpaid sessions", () => {
    const user = makeUser();
    expect(checkout.handleCheckoutCompleted(fakeSession("cs_unpaid", user.id, "us-historical", false))).toBe(false);
    expect(activation.unlockedForUser(user.id).packIds).toEqual([]);
  });
});

describe("checkout base URL", () => {
  it("maps origins to their app mount", () => {
    expect(checkout.checkoutBase("https://sim.ahousedividedgame.com")).toBe("https://sim.ahousedividedgame.com/");
    expect(checkout.checkoutBase("https://lakesidegames.net")).toBe("https://lakesidegames.net/games/electioneer/");
    expect(checkout.checkoutBase("https://www.lakesidegames.net")).toBe("https://www.lakesidegames.net/games/electioneer/");
    expect(checkout.checkoutBase("https://evil.example.com")).toBe("https://sim.ahousedividedgame.com/");
    expect(checkout.checkoutBase(undefined)).toBe("https://sim.ahousedividedgame.com/");
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
