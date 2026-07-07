import { describe, expect, it } from "vitest";
import { createGame, beginGame, advanceTurn } from "../index";
import { checkAchievements, ACHIEVEMENTS } from "../achievements";
import { computeScoreFromFacts, usScoreFacts } from "../scoring";
import { GENERIC_EVENTS, EVENTS_BY_ID } from "@content/events";
import { ENDORSEMENT_EVENTS } from "@content/endorsements";
import { STAFF_POOL } from "@content/staff";

describe("campaign v2 features", () => {
  it("staff hires apply: extra action slot, trait bonuses, roster recorded", () => {
    const base = createGame({ seed: 1, playerCandidate: "dem", scenario: "2024" });
    const staffed = createGame({ seed: 1, playerCandidate: "dem", scenario: "2024", staff: ["field_director", "debate_coach", "body_man"] });
    expect(staffed.resources.dem.maxActions).toBe(base.resources.dem.maxActions + 1);
    expect(staffed.candidates.dem.traits.debatePrep).toBeGreaterThan(base.candidates.dem.traits.debatePrep);
    expect(staffed.staff?.dem).toEqual(["field_director", "debate_coach", "body_man"]);
    // Cap: a fourth hire is dropped.
    const greedy = createGame({ seed: 1, staff: STAFF_POOL.map((s) => s.id) });
    expect(greedy.staff?.dem?.length).toBe(3);
  });

  it("modifiers: what-if flips a state's prior, pandemic raises covid salience, mirror match boosts resources", () => {
    const base = createGame({ seed: 2, scenario: "2024" });
    const modded = createGame({ seed: 2, scenario: "2024", modifiers: { whatIfState: "TX", pandemic: true, mirrorMatch: true } });
    const txBase = base.states.find((s) => s.id === "TX")!;
    const txMod = modded.states.find((s) => s.id === "TX")!;
    expect(txBase.prior2020DemShare).toBeLessThan(0.49);
    expect(txMod.prior2020DemShare).toBe(0.5);
    expect(modded.salience.covid_response).toBeGreaterThanOrEqual(0.85);
    expect(base.salience.covid_response).toBeLessThan(0.85);
    expect(modded.resources.dem.cash).toBe(base.resources.dem.cash + 40_000_000);
    expect(modded.resources.dem.maxActions).toBe(base.resources.dem.maxActions + 2);
  });

  it("endorsement events ride the stochastic pool and resolve cleanly", () => {
    expect(ENDORSEMENT_EVENTS.length).toBeGreaterThanOrEqual(8);
    for (const e of ENDORSEMENT_EVENTS) {
      expect(GENERIC_EVENTS).toContain(e);
      expect(EVENTS_BY_ID[e.id]).toBe(e);
      expect(e.oncePerGame).toBe(true);
      // Both tickets always have at least one available choice.
      for (const side of ["dem", "rep"] as const) {
        expect(e.choices.some((c) => !c.side || c.side === side), `${e.id} ${side}`).toBe(true);
      }
    }
  });

  it("a full game yields a result, a valid score, and computable achievements", () => {
    let game = beginGame(createGame({ seed: 42, playerCandidate: "dem", scenario: "2024", staff: ["finance_chair"] }));
    let guard = 0;
    while (game.phase !== "result" && guard++ < 20) {
      game = advanceTurn(game, [
        { type: "rally", candidate: "dem", stateId: "PA" },
        { type: "advertise", candidate: "dem", stateId: "MI", spend: 3_000_000, adMode: "positive" },
        { type: "fundraise", candidate: "dem" },
      ], game.seed);
    }
    expect(game.result).toBeDefined();
    const facts = usScoreFacts(game.result!, "dem", "normal");
    const score = computeScoreFromFacts(facts);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1000);
    // Achievements evaluate without throwing and stay within the defined set.
    const earned = checkAchievements({ result: game.result!, game, player: "dem", difficulty: "normal" });
    const validIds = new Set(ACHIEVEMENTS.map((a) => a.id));
    for (const a of earned) expect(validIds.has(a.id)).toBe(true);
    // Tracking fields were populated by the run.
    expect(game.adSpend?.dem ?? 0).toBeGreaterThan(0);
    expect(game.fundsRaised?.dem ?? 0).toBeGreaterThan(0);
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(15);
  });

  it("difficulty multiplies the score: hard > normal > easy for the same result", () => {
    const facts = (d: "easy" | "normal" | "hard") => ({ unitMargin: 36, chamberSize: 538, popularMargin: 2, difficulty: d });
    const easy = computeScoreFromFacts(facts("easy"));
    const normal = computeScoreFromFacts(facts("normal"));
    const hard = computeScoreFromFacts(facts("hard"));
    expect(hard).toBeGreaterThan(normal);
    expect(normal).toBeGreaterThan(easy);
  });
});
