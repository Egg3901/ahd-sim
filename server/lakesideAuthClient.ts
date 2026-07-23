/**
 * Copy-paste Lakeside Auth client. No runtime dependencies; requires Node 18+.
 * Keep `internalToken` server-side. Never bundle this object into browser code.
 *
 * Source of truth: lakeside-auth/client/lakeside-auth-client.ts — keep in sync
 * when that helper changes.
 */
export type LakesideAuthIdentity = {
  provider: "ahd" | "discord";
  id: string;
  email?: string;
  username: string;
  avatarUrl?: string;
};

export type RedeemResult = {
  identity: LakesideAuthIdentity;
  sessionToken: string;
  expiresAt: number;
};

export type VerifyResult = {
  identity: LakesideAuthIdentity;
  expiresAt: number;
};

export class LakesideAuthClient {
  readonly #baseUrl: string;
  readonly #internalToken: string;

  constructor(options: { baseUrl: string; internalToken: string }) {
    this.#baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.#internalToken = options.internalToken;
  }

  /** URL to use as an Express redirect target or Next.js redirect destination. */
  loginUrl(provider: "ahd" | "discord", returnUrl: string, authOrigin = this.#baseUrl): string {
    const url = new URL(`/auth/${provider}`, `${authOrigin.replace(/\/+$/, "")}/`);
    url.searchParams.set("return", returnUrl);
    return url.toString();
  }

  async redeem(code: string): Promise<RedeemResult | null> {
    return this.#post<RedeemResult>("/internal/redeem", { code });
  }

  async verify(sessionToken: string): Promise<VerifyResult | null> {
    return this.#post<VerifyResult>("/internal/verify", { sessionToken });
  }

  async #post<T>(path: string, body: Record<string, string>): Promise<T | null> {
    const response = await fetch(`${this.#baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.#internalToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5_000),
    });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error(`Lakeside Auth ${path} failed (${response.status})`);
    return response.json() as Promise<T>;
  }
}
