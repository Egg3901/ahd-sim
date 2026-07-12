import { describe, it, expect } from "vitest";
import { createUkGame, computeUkResult } from "@engine/ukGame";
import {
  UK_ELECTIONS,
  UK_ELECTION_IDS,
  UK_BOUNDARY_POOLS,
  majorityForElection,
  poolFor,
} from "@content/uk/elections";

// Every authored election must be structurally sound (seats sum to that year's
// boundary pools) and reproduce the right headline outcome at the neutral
// baseline: the right largest party and the right kind of government.
const EXPECTED: Record<string, { largest: string; gov: string }> = {
  "1951": { largest: "con", gov: "majority" },
  "1964": { largest: "lab", gov: "majority" },
  "1966": { largest: "lab", gov: "majority" },
  "1970": { largest: "con", gov: "majority" },
  // February 1974: no majority. Labour is largest but short of 318, and Con is an
  // incompatible partner, so the engine returns a Labour minority — its honest
  // reading of a hung parliament (exactly what happened: a Wilson minority).
  "1974feb": { largest: "lab", gov: "minority" },
  "1974oct": { largest: "lab", gov: "majority" },
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
      ["1951", "1964", "1966", "1970", "1974feb", "1974oct", "1979", "1983", "1987", "1992", "1997", "2001", "2005", "2010", "2015", "2017", "2019", "2024"],
    );
  });

  it("boundary pools match each election's chamber size", () => {
    for (const id of UK_ELECTION_IDS) {
      const maj = majorityForElection(id);
      const pool = UK_BOUNDARY_POOLS[id];
      expect(pool, id).toBeTruthy();
      const sum = Object.values(pool).reduce((a, b) => a + b, 0);
      expect(sum, id).toBe(maj.total);
      expect(UK_ELECTIONS[id].majority?.total ?? maj.total, id).toBe(maj.total);
    }
  });

  for (const id of UK_ELECTION_IDS) {
    describe(`${id} — ${UK_ELECTIONS[id].label}`, () => {
      it("each region's seats sum to its boundary pool", () => {
        const maj = majorityForElection(id);
        let total = 0;
        for (const [rid, res] of Object.entries(UK_ELECTIONS[id].regions)) {
          const sum = Object.values(res.s).reduce((a, b) => a + b, 0);
          expect(sum, `${id}/${rid}`).toBe(poolFor(id, rid));
          total += sum;
        }
        expect(total).toBe(maj.total);
      });

      it("neutral play reproduces the right winner and government type", () => {
        const g = createUkGame({ election: id, seed: 3 });
        const r = computeUkResult(g);
        const maj = majorityForUkSeats(g.electionId);
        expect(Object.values(r.seats).reduce((a, b) => a + b, 0)).toBe(maj);
        expect(r.largestParty).toBe(EXPECTED[id].largest);
        expect(r.government.kind).toBe(EXPECTED[id].gov);
      });
    });
  }
});

function majorityForUkSeats(electionId: string): number {
  return majorityForElection(electionId).total;
}
