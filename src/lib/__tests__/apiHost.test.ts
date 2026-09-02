// @vitest-environment jsdom
// Regression tests for ticket #1258: Electioneer black-screen on the
// lakesidegames.net/games/electioneer mount. The page origin there serves no
// /api/*, so every call used to resolve to the SPA's index.html with HTTP 200,
// whose body failed JSON parsing and fell back to {}. The auth store then set
// unlocked to undefined and the landing page crashed reading .packIds.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type FetchMock = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const fetchCalls: { url: string; init?: RequestInit }[] = [];

function setOrigin(hostname: string): void {
  Object.defineProperty(window, "location", {
    value: { hostname, origin: `https://${hostname}`, pathname: "/", search: "", href: `https://${hostname}/` },
    writable: true,
  });
}

async function mockFetch(status: number, rawBody: string): Promise<FetchMock> {
  return vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
    fetchCalls.push({ url: String(_input), init });
    return new Response(rawBody, { status, headers: { "Content-Type": "application/json" } });
  }) as unknown as FetchMock;
}

describe("api host routing", () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    fetchCalls.length = 0;
  });

  it("addresses the campaign server host when mounted off sim (lakesidegames.net)", async () => {
    setOrigin("lakesidegames.net");
    const { api } = await import("../api");
    globalThis.fetch = await mockFetch(200, JSON.stringify({
      date: "2026-09-02", scenarioId: "us-2016", seed: "s", role: "dem", label: "", flag: "", board: [],
    }));

    await api.daily();
    expect(fetchCalls[0].url).toBe("https://sim.ahousedividedgame.com/api/daily");
  });

  it("stays same-origin on sim and localhost", async () => {
    setOrigin("sim.ahousedividedgame.com");
    vi.resetModules();
    const { api } = await import("../api");
    globalThis.fetch = await mockFetch(200, JSON.stringify({
      date: "2026-09-02", scenarioId: "us-2016", seed: "s", role: "dem", label: "", flag: "", board: [],
    }));

    await api.daily();
    expect(fetchCalls[0].url).toBe("/api/daily");

    setOrigin("localhost");
    fetchCalls.length = 0;
    await api.daily();
    expect(fetchCalls[0].url).toBe("/api/daily");
  });
});

describe("malformed 200 payloads (the SPA-fallback HTML case)", () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("auth store keeps a usable unlocked set when /auth/me returns non-JSON 200", async () => {
    setOrigin("lakesidegames.net");
    vi.resetModules();
    const { api } = await import("../api");
    const { useAuthStore } = await import("@store/authStore");
    globalThis.fetch = await mockFetch(200, "<!doctype html><html>SPA fallback</html>");

    // A signed-in player: a stored token routes refresh() through /auth/me.
    localStorage.setItem("campaign_token", "tok");
    useAuthStore.setState({ user: { id: "u", username: "u", email: "e" } });
    await useAuthStore.getState().refresh();

    const { unlocked, serverDown } = useAuthStore.getState();
    // Pre-fix this was undefined and crashed the landing page on .packIds.
    expect(unlocked).toEqual({ scenarioIds: [], packIds: [] });
    // The payload was garbage; the store must treat the server as unreachable
    // rather than trusting an empty success.
    expect(serverDown).toBe(true);
    void api;
  });

  it("cloud-save list stays an array when /saves returns non-JSON 200", async () => {
    setOrigin("lakesidegames.net");
    vi.resetModules();
    const { api } = await import("../api");
    const { remoteProvider } = await import("@persistence/remote");
    globalThis.fetch = await mockFetch(200, "<!doctype html><html>SPA fallback</html>");

    // Signed in, so the remote provider actually calls out; pre-fix this threw
    // "Cannot read properties of undefined (reading 'map')" inside list().
    const meta = await remoteProvider.list();
    expect(Array.isArray(meta)).toBe(true);
    expect(meta).toEqual([]);
    void api;
  });
});