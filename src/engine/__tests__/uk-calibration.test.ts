import { describe, it, expect } from "vitest";
import { createUkGame, ukAdvanceTurn, computeUkResult } from "@engine/ukGame";
import { tallyRegion } from "@engine/multiparty";
import { UK_REGIONS, UK_TOTAL_SEATS } from "@content/uk/regions";
import { UK_ELECTIONS } from "@content/uk/elections";

// The UK analog of the U.S. 2020 calibration: neutral, do-nothing play must
// reproduce the real 2024 result by construction.
describe("UK 2024 calibration", () => {
  it("the 12 regions' seat pools total 650", () => {
    expect(UK_TOTAL_SEATS).toBe(650);
  });

  it("each region's authored seats sum to its pool", () => {
    for (const region of UK_REGIONS) {
      const seats = UK_ELECTIONS["2024"].regions[region.id].s;
      const sum = Object.values(seats).reduce((a, b) => a + b, 0);
      expect(sum, region.name).toBe(region.seats);
    }
  });

  it("solved bloc appeals reproduce each region's real vote share", () => {
    const g = createUkGame({ election: "2024", seed: 1 });
    for (const region of g.regions) {
      const { shareByParty } = tallyRegion(region);
      const target = region.baselineShare!;
      for (const p of Object.keys(target)) {
        expect(shareByParty[p], `${region.name} ${p}`).toBeCloseTo(target[p], 2);
      }
    }
  });

  it("neutral play (nobody campaigns) reproduces the 2024 landslide", () => {
    let g = createUkGame({ election: "2024", seed: 1, playerParty: "lab" });
    // Calibration anchor: nobody campaigns (AI off, no player actions).
    while (g.phase !== "result") {
      g.queuedActions = [];
      g = ukAdvanceTurn(g, { disableAi: true });
    }
    const r = g.result!;
    const total = Object.values(r.seats).reduce((a, b) => a + b, 0);
    expect(total).toBe(650);
    // Labour landslide reproduced near the real ~411 seats.
    expect(r.largestParty).toBe("lab");
    expect(r.seats.lab).toBeGreaterThan(395);
    expect(r.seats.con).toBeGreaterThan(110);
    expect(r.seats.con).toBeLessThan(140);
    expect(r.government.kind).toBe("majority");
  });

  it("doing nothing while opponents campaign costs the player ground (but it's recoverable)", () => {
    let g = createUkGame({ election: "2024", seed: 1, playerParty: "lab" });
    let guard = 0;
    while (g.phase !== "result" && guard++ < 20) {
      g.queuedActions = [];
      g = ukAdvanceTurn(g, { autoResolvePlayerEvents: true }); // AI active, player passive
    }
    // Labour erodes from its peak but the engine stays sane (still 650 seats).
    const total = Object.values(g.result!.seats).reduce((a, b) => a + b, 0);
    expect(total).toBe(650);
    expect(g.result!.seats.lab).toBeLessThan(411); // passivity has a cost
  });

  it("a full campaign with player actions and events yields a valid government", () => {
    let g = createUkGame({ election: "2024", seed: 42, playerParty: "lab" });
    let guard = 0;
    while (g.phase !== "result" && guard++ < 20) {
      // Player canvasses its weakest English region each week.
      const target = g.regions
        .filter((r) => r.baselineShare?.lab !== undefined)
        .sort((a, b) => (a.baselineShare!.lab ?? 0) - (b.baselineShare!.lab ?? 0))[0];
      g.queuedActions = [{ type: "canvass", party: "lab", regionId: target.id }];
      g = ukAdvanceTurn(g, { autoResolvePlayerEvents: true });
    }
    expect(Object.values(g.result!.seats).reduce((a, b) => a + b, 0)).toBe(650);
    expect(["majority", "minority", "coalition", "confidence_supply", "hung"]).toContain(g.result!.government.kind);
    // Events fired over the campaign and were logged as news.
    expect(g.news.length).toBeGreaterThan(0);
  });

  it("a do-nothing snapshot reproduces seats exactly at turn 0", () => {
    const g = createUkGame({ election: "2024", seed: 7 });
    const r = computeUkResult(g);
    // Each region should return its authored baseline seats exactly.
    for (const sr of r.seatResults) {
      const authored = UK_ELECTIONS["2024"].regions[sr.contestId].s;
      for (const p of Object.keys(authored)) {
        expect(sr.seatsByParty[p] ?? 0, `${sr.name} ${p}`).toBe(authored[p]);
      }
    }
  });
});
