// Stripe Checkout for scenario packs. Boots with no Stripe keys set: the
// checkout endpoint answers 503 until STRIPE_SECRET_KEY exists, and the
// webhook answers 400 (no verifiable signature) until STRIPE_WEBHOOK_SECRET
// exists. The webhook MUST be mounted on a raw body (see server/index.ts:
// express.raw runs for /api/stripe/webhook before the global JSON parser).

import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import { getDb, type PurchaseRow, type UserRow } from "../db.js";
import { requireAuth, type AuthedRequest } from "../auth.js";
import { recordPurchase } from "../activation.js";
import { PACKS_BY_ID } from "../../src/content/packs.js";

let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

export const DEFAULT_BASE_URL = "https://sim.ahousedividedgame.com";

// BASE_URL is also a Vite-reserved env name ("/" under vitest), so only honor
// values that are actual absolute URLs.
export function configuredBaseUrl(): string {
  const raw = process.env.BASE_URL;
  return (raw && /^https?:\/\//.test(raw) ? raw : DEFAULT_BASE_URL).replace(/\/+$/, "");
}

// The SPA lives at the root on sim.* but under /games/electioneer/ on the
// Lakeside site, so success/cancel redirects need the right path prefix.
const ORIGIN_BASE_PATHS: Record<string, string> = {
  "https://sim.ahousedividedgame.com": "/",
  "https://lakesidegames.net": "/games/electioneer/",
  "https://www.lakesidegames.net": "/games/electioneer/",
};

/** App base URL (with trailing slash) for the requesting origin. */
export function checkoutBase(origin: string | undefined): string {
  if (origin && ORIGIN_BASE_PATHS[origin]) return origin + ORIGIN_BASE_PATHS[origin];
  const base = configuredBaseUrl();
  return ORIGIN_BASE_PATHS[base] ? base + ORIGIN_BASE_PATHS[base] : base + "/";
}

export const checkoutRouter = Router();

checkoutRouter.post("/api/checkout", requireAuth, async (req: AuthedRequest, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: "Payments are not configured yet" });

  const { packId } = req.body ?? {};
  const pack = typeof packId === "string" ? PACKS_BY_ID[packId] : undefined;
  if (!pack) return res.status(400).json({ error: "Unknown pack" });

  const user = getDb().prepare("SELECT * FROM users WHERE id = ?").get(req.auth!.userId) as UserRow | undefined;
  if (!user) return res.status(401).json({ error: "Login required" });

  const already = getDb().prepare(
    "SELECT 1 FROM activations WHERE user_id = ? AND pack_id = ?",
  ).get(user.id, pack.id);
  if (already) return res.status(409).json({ error: "You already own this pack" });

  const base = checkoutBase(req.headers.origin as string | undefined);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: pack.price,
          product_data: { name: pack.name, description: pack.description },
        },
      }],
      metadata: { userId: user.id, packId: pack.id, email: user.email },
      client_reference_id: user.id,
      customer_email: user.email,
      success_url: `${base}?purchase=success&pack=${encodeURIComponent(pack.id)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}?purchase=cancelled`,
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error("[checkout] session create failed:", e);
    res.status(502).json({ error: "Could not start checkout" });
  }
});

checkoutRouter.get("/api/purchases", requireAuth, (req: AuthedRequest, res) => {
  const rows = getDb().prepare(
    "SELECT * FROM purchases WHERE user_id = ? ORDER BY created_at DESC",
  ).all(req.auth!.userId) as PurchaseRow[];
  res.json({
    purchases: rows.map((r) => ({
      packId: r.pack_id,
      packName: r.pack_id ? PACKS_BY_ID[r.pack_id]?.name ?? r.pack_id : null,
      scenarioId: r.scenario_id,
      provider: r.provider,
      amountCents: r.amount_cents,
      currency: r.currency,
      status: r.status,
      createdAt: r.created_at,
    })),
  });
});

/**
 * Grant path for a completed checkout session. Exported for tests; idempotent
 * via the purchases.provider_ref unique index.
 */
export function handleCheckoutCompleted(session: {
  id: string;
  payment_status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, string> | null;
}): boolean {
  if (session.payment_status !== "paid") return false;
  const userId = session.metadata?.userId;
  const packId = session.metadata?.packId;
  if (!userId || !packId || !PACKS_BY_ID[packId]) return false;
  const user = getDb().prepare("SELECT * FROM users WHERE id = ?").get(userId) as UserRow | undefined;
  if (!user) return false;
  return recordPurchase({
    userId: user.id,
    ahdUserId: user.ahd_user_id,
    email: session.metadata?.email ?? user.email,
    packId,
    provider: "stripe",
    providerRef: session.id,
    amountCents: session.amount_total ?? PACKS_BY_ID[packId].price,
    currency: session.currency ?? "usd",
  });
}

/** Raw-body webhook handler. Mounted with express.raw in server/index.ts. */
export function stripeWebhook(req: Request, res: Response): void {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers["stripe-signature"];
  if (!stripe || !secret || typeof sig !== "string" || !Buffer.isBuffer(req.body)) {
    res.status(400).json({ error: "Webhook not configured or unsigned" });
    return;
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch {
    res.status(400).json({ error: "Invalid signature" });
    return;
  }
  if (event.type === "checkout.session.completed") {
    const granted = handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    console.log(`[checkout] session ${(event.data.object as Stripe.Checkout.Session).id} completed, granted=${granted}`);
  }
  // Unknown/other events: acknowledge so Stripe stops retrying.
  res.json({ received: true });
}
