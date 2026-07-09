import { describe, it, expect } from "vitest";
import { advanceToRunoff, topTwo, regionalRunoff } from "../runoff";
import { FR_FIRST_ROUND, FR_TRANSFERS } from "@content/countries/france";

describe("two-round runoff", () => {
  it("picks the top two from a crowded first round", () => {
    const [a, b] = topTwo({ ens: 0.28, rn: 0.23, lfi: 0.22, lr: 0.15, other: 0.12 });
    expect(a).toBe("ens");
    expect(b).toBe("rn");
  });

  it("transfers eliminated voters to finalists (front républicain)", () => {
    const first = { ens: 0.24, rn: 0.21, lfi: 0.20, lr: 0.20, other: 0.15 };
    const transfers = {
      lfi: { ens: 0.55, rn: 0.10, _abstain: 0.35 },
      lr: { ens: 0.70, rn: 0.20, _abstain: 0.10 },
      other: { ens: 0.50, rn: 0.25, _abstain: 0.25 },
    };
    const r = advanceToRunoff(first, transfers);
    expect(r.finalists).toEqual(["ens", "rn"]);
    expect(r.secondRound.ens).toBeGreaterThan(0.55);
    expect(r.secondRound.ens + r.secondRound.rn).toBeCloseTo(1, 6);
    expect(r.abstentionRate).toBeGreaterThan(0.05);
  });

  it("a weak front républicain narrows the runoff", () => {
    const first = { ens: 0.28, rn: 0.27, lfi: 0.22, lr: 0.12, other: 0.11 };
    const soft = {
      lfi: { ens: 0.25, rn: 0.35, _abstain: 0.40 },
      lr: { ens: 0.40, rn: 0.45, _abstain: 0.15 },
      other: { ens: 0.35, rn: 0.40, _abstain: 0.25 },
    };
    const hard = {
      lfi: { ens: 0.70, rn: 0.05, _abstain: 0.25 },
      lr: { ens: 0.75, rn: 0.15, _abstain: 0.10 },
      other: { ens: 0.60, rn: 0.20, _abstain: 0.20 },
    };
    const softR = advanceToRunoff(first, soft);
    const hardR = advanceToRunoff(first, hard);
    expect(hardR.secondRound.ens).toBeGreaterThan(softR.secondRound.ens);
  });

  it("regionalRunoff applies the same finalists everywhere", () => {
    const regions = {
      IDF: { ens: 0.35, rn: 0.15, lfi: 0.25, lr: 0.15, other: 0.10 },
      HDF: { ens: 0.18, rn: 0.35, lfi: 0.20, lr: 0.15, other: 0.12 },
    };
    const transfers = {
      lfi: { ens: 0.6, rn: 0.1, _abstain: 0.3 },
      lr: { ens: 0.65, rn: 0.25, _abstain: 0.1 },
      other: { ens: 0.5, rn: 0.3, _abstain: 0.2 },
    };
    const { finalists, regions: round2 } = regionalRunoff(regions, transfers);
    expect(finalists).toEqual(["ens", "rn"]);
    expect(round2.IDF.ens).toBeGreaterThan(round2.HDF.ens);
    expect(Object.keys(round2.IDF).sort()).toEqual(["ens", "rn"]);
  });

  it("France transfer matrices put the centre ahead in every authored runoff", () => {
    for (const year of ["2017", "2022", "2027"] as const) {
      const r = advanceToRunoff(FR_FIRST_ROUND[year], FR_TRANSFERS[year]);
      expect(r.finalists).toEqual(["ens", "rn"]);
      expect(r.secondRound.ens, `${year} centre share`).toBeGreaterThan(0.5);
      // 2017 was a landslide; 2022/2027 are closer — both still centre-favoured.
      if (year === "2017") expect(r.secondRound.ens).toBeGreaterThan(0.58);
    }
  });
});
