import { describe, it, expect } from "vitest";
import { createGame } from "../setup";
import { advanceTurn, beginGame } from "../turn";
import { applyAction } from "../actions";
import { createRng } from "../rng";
import { DIFFICULTY } from "../ai";
import { projectElection, computeResult, tallyContest } from "../voteModel";
import type { CampaignAction, GameState } from "../types";
import { SCENARIO_IDS } from "@content/scenarios";

const demShareOf = (g: GameState, id: string) =>
  tallyContest(g.states.find((s) => s.id === id)!).demShare;

function playToEnd(game: GameState, actionsFor: (g: GameState) => CampaignAction[]): GameState {
  let g = beginGame(game);
  let guard = 0;
  while (g.phase !== "result" && guard++ < 50) {
    g = advanceTurn(g, actionsFor(g), "bal", { difficulty: DIFFICULTY.normal, autoResolvePlayerEvents: true });
  }
  return g;
}

// ── Scenario calibration ───────────────────────────────────────────────────
// The untouched baseline map should reproduce the real result of each year.
describe("calibration: every scenario reproduces its historical winner", () => {
  const HISTORICAL: Record<string, { winner: "dem" | "rep"; demEV: number }> = {
    "2024": { winner: "rep", demEV: 226 },
    "2020": { winner: "dem", demEV: 306 },
    "2016": { winner: "rep", demEV: 232 },
    "2012": { winner: "dem", demEV: 332 },
    "2008": { winner: "dem", demEV: 365 },
    "2000": { winner: "rep", demEV: 266 },
  };
  for (const [scenario, h] of Object.entries(HISTORICAL)) {
    it(`${scenario} → ${h.winner} (~${h.demEV} dem EV)`, () => {
      const r = computeResult(createGame({ scenario, seed: "cal" }));
      expect(r.winner).toBe(h.winner);
      expect(Math.abs(r.electoralVotes.dem - h.demEV), `${scenario} dem EV`).toBeLessThanOrEqual(40);
    });
  }
});

// ── Sticky leans ───────────────────────────────────────────────────────────
describe("leans are sticky: the AI can't flip deep-safe states", () => {
  const DEEP_DEM = ["CA", "NY", "MA", "HI", "MD"];
  const DEEP_REP = ["WY", "WV", "OK", "ID", "AR"];
  for (const scenario of SCENARIO_IDS) {
    it(`${scenario}: deep states stay put vs a passive player (hard AI)`, () => {
      let g = beginGame(createGame({ scenario, playerCandidate: "dem", seed: `safe-${scenario}` }));
      const worst: Record<string, number> = {};
      let guard = 0;
      while (g.phase !== "result" && guard++ < 12) {
        g = advanceTurn(g, [], `safe-${scenario}`, { difficulty: DIFFICULTY.hard, autoResolvePlayerEvents: true });
        for (const c of projectElection(g).contests) {
          const side = DEEP_DEM.includes(c.stateId) ? "dem" : DEEP_REP.includes(c.stateId) ? "rep" : null;
          if (!side) continue;
          const lead = side === "dem" ? c.demShare - 0.5 : 0.5 - c.demShare;
          worst[c.stateId] = Math.min(worst[c.stateId] ?? 1, lead);
        }
      }
      for (const [id, lead] of Object.entries(worst)) {
        expect(lead, `${scenario} ${id} held`).toBeGreaterThan(0);
      }
    });
  }
});

// ── Tossups are winnable ───────────────────────────────────────────────────
it("sustained investment moves a battleground toward the player", () => {
  const targets = ["GA", "PA", "AZ"];
  const neutral = playToEnd(createGame({ seed: "win" }), () => []);
  const invested = playToEnd(createGame({ seed: "win" }), () =>
    targets.flatMap((id): CampaignAction[] => [
      { type: "advertise", candidate: "dem", stateId: id, adMode: "positive", spend: 10_000_000 },
      { type: "rally", candidate: "dem", stateId: id },
    ]),
  );
  for (const id of targets) {
    const inv = invested.result!.stateResults.find((s) => s.stateId === id)!;
    const neu = neutral.result!.stateResults.find((s) => s.stateId === id)!;
    expect(inv.demShare, `${id} improved with investment`).toBeGreaterThan(neu.demShare);
  }
});

// ── Contrast vs positive trade-off ─────────────────────────────────────────
it("contrast ads are not strictly better than positive (they cost narrative)", () => {
  const base = createGame({ seed: "ct" });
  const run = (mode: "positive" | "contrast") => {
    const g: GameState = structuredClone(base);
    const rng = createRng("ct");
    const before = demShareOf(g, "GA");
    for (let k = 0; k < 4; k++) {
      applyAction(g, { type: "advertise", candidate: "dem", stateId: "GA", adMode: mode, spend: 8_000_000 }, rng);
    }
    return { gain: demShareOf(g, "GA") - before, narrative: g.resources.dem.mediaNarrative };
  };
  const pos = run("positive");
  const con = run("contrast");
  // Positive moves the margin at least as much as contrast…
  expect(pos.gain).toBeGreaterThanOrEqual(con.gain - 0.003);
  // …and going negative dents your own media narrative, while positive doesn't.
  expect(con.narrative).toBeLessThan(pos.narrative);
});

// ── Diminishing returns on ad spend ────────────────────────────────────────
it("ad spend has diminishing returns", () => {
  const measure = (spend: number) => {
    const g = createGame({ seed: "dr" });
    const rng = createRng("dr");
    const before = demShareOf(g, "GA");
    applyAction(g, { type: "advertise", candidate: "dem", stateId: "GA", adMode: "positive", spend }, rng);
    return demShareOf(g, "GA") - before;
  };
  const small = measure(10_000_000);
  const big = measure(30_000_000);
  expect(big).toBeGreaterThan(small); // more spend still does more…
  expect(big).toBeLessThan(small * 2.4); // …but far less than linearly (3× spend ≪ 3× effect)
});

// ── Weekly action pool is a hard cap ───────────────────────────────────────
it("actions beyond the weekly pool don't apply", () => {
  const g = createGame({ seed: "pool" });
  const rng = createRng("pool");
  g.resources.dem.actions = 2;
  const cash0 = g.resources.dem.cash;
  for (let k = 0; k < 5; k++) {
    applyAction(g, { type: "advertise", candidate: "dem", stateId: "GA", adMode: "positive", spend: 5_000_000 }, rng);
  }
  expect(g.resources.dem.actions).toBe(0); // clamped, never negative
  expect(cash0 - g.resources.dem.cash).toBe(10_000_000); // only the 2 affordable ads were charged
});

// ── Momentum is transient ──────────────────────────────────────────────────
it("national momentum decays each week (it's not permanent)", () => {
  // A rally adds momentum…
  let g = beginGame(createGame({ seed: "mo" }));
  g = advanceTurn(g, [{ type: "rally", candidate: "dem", stateId: "PA" }], "mo", { autoResolvePlayerEvents: true });
  expect(g.resources.dem.nationalMomentum).toBeGreaterThan(0);
  // …but it bleeds off: from a high base, an idle week ends well below it even
  // with the small momentum that events inject (decay is 25%/week).
  g.resources.dem.nationalMomentum = 80;
  g = advanceTurn(g, [], "mo", { autoResolvePlayerEvents: true });
  expect(g.resources.dem.nationalMomentum).toBeLessThan(80);
});
