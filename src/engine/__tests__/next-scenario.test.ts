import { describe, it, expect } from "vitest";
import { US_NEXT_SCENARIO, UK_NEXT_SCENARIO, countryNextScenario } from "@content/nextScenario";
import { UK_ELECTION_IDS, UK_ELECTIONS } from "@content/uk/elections";
import { SCENARIOS } from "@content/scenarios";
import { COUNTRIES } from "@content/countries";

describe("next-scenario retention chains", () => {
  it("US chain points at authored scenarios", () => {
    for (const [from, next] of Object.entries(US_NEXT_SCENARIO)) {
      expect(SCENARIOS[from], from).toBeTruthy();
      expect(SCENARIOS[next.id], next.id).toBeTruthy();
    }
  });

  it("UK chain covers every election and wraps", () => {
    for (const id of UK_ELECTION_IDS) {
      const next = UK_NEXT_SCENARIO[id];
      expect(next, id).toBeTruthy();
      expect(UK_ELECTIONS[next.id], next.id).toBeTruthy();
    }
    expect(UK_NEXT_SCENARIO["2024"].id).toBe("1951");
    expect(UK_NEXT_SCENARIO["2019"].id).toBe("2024");
  });

  it("country chains stay inside each pack", () => {
    expect(countryNextScenario("CA", "2021")?.id).toBe("2025");
    expect(countryNextScenario("CA", "2025")?.id).toBe("2021");
    expect(countryNextScenario("FR", "2017")?.id).toBe("2022");
    expect(countryNextScenario("FR", "2027")?.id).toBe("2017");
    expect(countryNextScenario("AU", "2022")?.id).toBe("2025");
    expect(countryNextScenario("AU", "2025")?.id).toBe("2022");
    for (const [cid, country] of Object.entries(COUNTRIES)) {
      for (const eid of Object.keys(country.elections)) {
        const next = countryNextScenario(cid, eid);
        expect(next, `${cid}/${eid}`).toBeTruthy();
        expect(country.elections[next!.id], `${cid}→${next!.id}`).toBeTruthy();
      }
    }
  });
});
