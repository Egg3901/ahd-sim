import { describe, it, expect } from "vitest";
import { createUkGame, computeUkResult } from "@engine/ukGame";
import { UK_ELECTIONS, UK_ELECTION_IDS } from "@content/uk/elections";
import { UK_REGIONS_BY_ID } from "@content/uk/regions";

// Every authored election must be structurally sound (seats sum to the region
// pools and to 650) and reproduce the right headline outcome at the neutral
// baseline: the right largest party and the right kind of government.
const EXPECTED: Record<string, { largest: string; gov: string }> = {
  "1951": { largest: "con", gov: "majority" },
  "2024": { largest: "lab", gov: "majority" },
  "2019": { largest: "con", gov: "majority" },
  "2017": { largest: "con", gov: "confidence_supply" },
  "2015": { largest: "con", gov: "majority" },
  "2010": { largest: "con", gov: "coalition" },
  "2005": { largest: "lab", gov: "majority" },
  "2001": { largest: "lab", gov: "majority" },
  "1997": { largest: "lab", gov: "majority" },
  "1992": { largest: "con", gov: "majority" },
  "1987": { largest: "con", gov: "majority" },
  "1983": { largest: "con", gov: "majority" },
  "1979": { largest: "con", gov: "majority" },
};

describe("UK elections roster", () => {
  it("covers the expected modern elections", () => {
    expect(UK_ELECTION_IDS.sort()).toEqual(
      ["1951", "1979", "1983", "1987", "1992", "1997", "2001", "2005", "2010", "2015", "2017", "2019", "2024"],
    );
  });

  for (const id of UK_ELECTION_IDS) {
    describe(`${id} — ${UK_ELECTIONS[id].label}`, () => {
      it("each region's seats sum to its pool, totalling 650", () => {
        let total = 0;
        for (const [rid, res] of Object.entries(UK_ELECTIONS[id].regions)) {
          const sum = Object.values(res.s).reduce((a, b) => a + b, 0);
          expect(sum, `${id}/${rid}`).toBe(UK_REGIONS_BY_ID[rid].seats);
          total += sum;
        }
        expect(total).toBe(650);
      });

      it("neutral play reproduces the right winner and government type", () => {
        const g = createUkGame({ election: id, seed: 3 });
        const r = computeUkResult(g);
        expect(Object.values(r.seats).reduce((a, b) => a + b, 0)).toBe(650);
        expect(r.largestParty).toBe(EXPECTED[id].largest);
        expect(r.government.kind).toBe(EXPECTED[id].gov);
      });
    });
  }
});
