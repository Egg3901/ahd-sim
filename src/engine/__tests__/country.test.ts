import { describe, expect, it } from "vitest";
import { createCountryGame, countryAdvanceTurn, computeCountryResult, playablePartiesIn } from "../countryGame";
import { COUNTRIES } from "@content/countries";
import { computeScoreFromFacts, multipartyScoreFacts } from "../scoring";

describe("country bundles", () => {
  it("every region's baseline seats sum to its pool, chambers total correctly", () => {
    const chamber: Record<string, number> = { CA: 343, DE: 630, FR: 100 };
    for (const [cid, country] of Object.entries(COUNTRIES)) {
      for (const election of Object.values(country.elections)) {
        let total = 0;
        for (const [rid, res] of Object.entries(election.regions)) {
          const meta = country.regions.find((r) => r.id === rid)!;
          expect(meta, `${cid}: region meta ${rid}`).toBeDefined();
          const seats = Object.values(res.s).reduce((s, x) => s + x, 0);
          expect(seats, `${cid} ${election.id} ${rid} seats`).toBe(meta.seats);
          total += seats;
        }
        expect(total, `${cid} chamber`).toBe(chamber[cid]);
        expect(country.system.majority.total).toBe(chamber[cid]);
      }
    }
  });

  it("neutral play reproduces each election's real result (calibration anchor)", () => {
    for (const country of Object.values(COUNTRIES)) {
      for (const election of Object.values(country.elections)) {
        let g = createCountryGame(country, { election: election.id, seed: 42 });
        for (let t = 0; t < g.totalTurns; t++) g = countryAdvanceTurn(g, country, { disableAi: true });
        const result = g.result ?? computeCountryResult(g, country);

        // Baseline seats per party across regions:
        const expected: Record<string, number> = {};
        for (const res of Object.values(election.regions)) {
          for (const [p, s] of Object.entries(res.s)) expected[p] = (expected[p] ?? 0) + s;
        }
        for (const [p, s] of Object.entries(expected)) {
          expect(
            Math.abs((result.seats[p] ?? 0) - s),
            `${country.id} ${election.id} ${p}: got ${result.seats[p]}, real ${s}`,
          ).toBeLessThanOrEqual(2); // largest-remainder wobble tolerance
        }
      }
    }
  });

  it("known winners: LPC largest in CA-2025, Union in DE-2025, Centre wins FR-2027", () => {
    const expectWinner = (cid: string, party: string) => {
      const country = COUNTRIES[cid];
      let g = createCountryGame(country, { seed: 7 });
      for (let t = 0; t < g.totalTurns; t++) g = countryAdvanceTurn(g, country, { disableAi: true });
      expect(g.result!.largestParty, cid).toBe(party);
    };
    expectWinner("CA", "lpc");
    expectWinner("DE", "cdu");
    expectWinner("FR", "ens");
  });

  it("Germany's firewall: no government ever includes the AfD as a partner", () => {
    const country = COUNTRIES.DE;
    for (const seed of [1, 2, 3, 4, 5]) {
      let g = createCountryGame(country, { seed, playerParty: "afd" });
      for (let t = 0; t < g.totalTurns; t++) g = countryAdvanceTurn(g, country);
      const gov = g.result!.government;
      if (gov.kind === "coalition") expect(gov.parties).not.toContain("afd");
      if (gov.kind === "confidence_supply") expect(gov.partner).not.toBe("afd");
    }
  });

  it("a played game runs to completion and scores sanely", () => {
    const country = COUNTRIES.CA;
    let g = createCountryGame(country, { seed: 99, playerParty: "cpc" });
    expect(playablePartiesIn(country, "2025")).toContain("cpc");
    for (let t = 0; t < g.totalTurns; t++) {
      g.queuedActions = [
        { type: "rally", party: "cpc", regionId: "ON" },
        { type: "canvass", party: "cpc", regionId: "QC" },
        { type: "fundraise", party: "cpc" },
      ];
      g = countryAdvanceTurn(g, country);
    }
    expect(g.phase).toBe("result");
    const facts = multipartyScoreFacts(g.result!, "cpc", 172, 343, "normal");
    const score = computeScoreFromFacts(facts);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1000);
  });
});
