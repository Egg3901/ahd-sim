import { describe, it, expect } from "vitest";
import {
  softmax,
  largestRemainder,
  allocateRegionSeats,
  computeSeatsResult,
  formGovernment,
} from "@engine/multiparty";
import { sigmoid } from "@engine/setup";
import type { StateContest } from "@engine/types";
import type { MajorityRule } from "@engine/system";

describe("multiparty vote model", () => {
  it("softmax over {dem:m, rep:0} equals sigmoid(m) (the N=2 special case)", () => {
    for (const m of [-2, -0.5, 0, 0.3, 1.7]) {
      const s = softmax({ dem: m, rep: 0 });
      expect(s.dem).toBeCloseTo(sigmoid(m), 10);
      expect(s.dem + s.rep).toBeCloseTo(1, 10);
    }
  });

  it("softmax shares always sum to 1 across N parties", () => {
    const s = softmax({ con: 0.4, lab: 0.9, ld: -0.3, snp: 0.1, grn: -1.2, ref: 0.2 });
    expect(Object.values(s).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });
});

describe("regional seats curve", () => {
  it("largest-remainder always sums exactly to the seat pool", () => {
    const seats = largestRemainder({ con: 0.33, lab: 0.41, ld: 0.16, grn: 0.10 }, 75);
    expect(Object.values(seats).reduce((a, b) => a + b, 0)).toBe(75);
  });

  const region = (over: Partial<StateContest> = {}): StateContest => ({
    id: "LON", name: "London", abbr: "LON", electoralVotes: 0, region: "Swing",
    prior2020DemShare: 0.5, mediaMarketCost: 1, battleground: false, blocs: [],
    groundGame: { dem: 0, rep: 0 }, momentum: 0,
    seats: 75,
    baselineShare: { lab: 0.45, con: 0.30, ld: 0.15, grn: 0.10 },
    baselineSeats: { lab: 55, con: 12, ld: 6, grn: 2 },
    ...over,
  });

  it("neutral play reproduces the real baseline seats exactly", () => {
    const r = region();
    const seats = allocateRegionSeats(r, r.baselineShare!);
    expect(seats).toEqual(r.baselineSeats);
  });

  it("a vote-share swing moves seats FPTP-style, summing to the pool", () => {
    // Labour up 6pts, Con down 6pts: Labour should gain seats, Con lose them.
    const seats = allocateRegionSeats(region(), { lab: 0.51, con: 0.24, ld: 0.15, grn: 0.10 });
    expect(seats.lab).toBeGreaterThan(55);
    expect(seats.con).toBeLessThan(12);
    expect(Object.values(seats).reduce((a, b) => a + b, 0)).toBe(75);
  });

  it("more votes never means fewer seats (monotonic)", () => {
    const lo = allocateRegionSeats(region(), { lab: 0.45, con: 0.35, ld: 0.10, grn: 0.10 });
    const hi = allocateRegionSeats(region(), { lab: 0.55, con: 0.30, ld: 0.10, grn: 0.05 });
    expect(hi.lab).toBeGreaterThanOrEqual(lo.lab);
  });
});

describe("government formation", () => {
  const majority: MajorityRule = { total: 650, threshold: 326 };

  it("calls a single-party majority", () => {
    const g = formGovernment({ lab: 411, con: 121, ld: 72 }, majority, [], "lab");
    expect(g.kind).toBe("majority");
  });

  it("calls a hung parliament when no one is close", () => {
    const g = formGovernment({ con: 270, lab: 260, ld: 60, snp: 50 }, majority, [], "con");
    expect(["coalition", "confidence_supply", "minority", "hung"]).toContain(g.kind);
    expect(g.kind).not.toBe("majority");
  });

  it("Sinn Féin abstention lowers the effective bar", () => {
    // 322 seats is short of 326, but with 7 abstaining the effective bar drops.
    const g = formGovernment({ con: 322, sf: 7, lab: 200, ld: 50, other: 71 }, majority, ["sf"], "con");
    expect(g.kind).toBe("majority");
  });

  it("computeSeatsResult sums regional seats to the chamber total", () => {
    const mk = (id: string, seats: number): StateContest => ({
      id, name: id, abbr: id, electoralVotes: 0, region: "Swing",
      prior2020DemShare: 0.5, mediaMarketCost: 1, battleground: false,
      groundGame: { dem: 0, rep: 0 }, momentum: 0, seats,
      baselineShare: { lab: 0.5, con: 0.3, ld: 0.2 },
      baselineSeats: { lab: Math.round(seats * 0.6), con: Math.round(seats * 0.3), ld: seats - Math.round(seats * 0.6) - Math.round(seats * 0.3) },
      blocs: [{
        blocId: "youth" as never, size: 1000, turnoutPropensity: 0.6, baselineMargin: 0,
        support: { dem: 0.5, rep: 0.5 }, campaignMargin: 0, enthusiasm: 1,
        appeal: { lab: 0.3, con: 0.1, ld: -0.2 },
      }],
    });
    const out = computeSeatsResult([mk("A", 40), mk("B", 60)], majority);
    expect(Object.values(out.seats).reduce((a, b) => a + b, 0)).toBe(100);
  });
});
