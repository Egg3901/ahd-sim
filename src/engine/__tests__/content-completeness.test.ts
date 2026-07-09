import { describe, expect, it } from "vitest";
import { SCENARIO_REGISTRY, SCENARIOS_BY_ID } from "@content/scenarioRegistry";
import { PACKS, ALL_PAID, packForScenario } from "@content/packs";
import { SCENARIOS } from "@content/scenarios";
import { HISTORICAL_EVENTS } from "@content/events";
import { UK_ELECTIONS } from "@content/uk/elections";
import { UK_ELECTION_EVENTS } from "@content/uk/electionEvents";
import { COUNTRIES } from "@content/countries";
import { playablePartiesIn } from "../countryGame";

// ─────────────────────────────────────────────────────────────────────────
// CONTENT COMPLETENESS — the sellability bar, as a test.
// Every scenario we list (and would one day charge for) must be complete:
// resolvable content, real leaders, a named historical event deck, and (for
// country bundles) a real-geography map. If a scenario can't clear this bar,
// it doesn't belong in a pack.
// ─────────────────────────────────────────────────────────────────────────

describe("registry ↔ content resolution", () => {
  it("every registry row resolves to playable content", () => {
    for (const s of SCENARIO_REGISTRY) {
      if (s.engine === "us") {
        expect(SCENARIOS[s.nativeId], `US scenario ${s.scenarioId}`).toBeDefined();
      } else if (s.engine === "uk") {
        expect(UK_ELECTIONS[s.nativeId], `UK election ${s.scenarioId}`).toBeDefined();
      } else {
        const country = COUNTRIES[s.country];
        expect(country, `country bundle ${s.country}`).toBeDefined();
        expect(country.elections[s.nativeId], `election ${s.scenarioId}`).toBeDefined();
      }
    }
  });

  it("every country election and US scenario is listed in the registry", () => {
    for (const [cid, country] of Object.entries(COUNTRIES)) {
      for (const eid of Object.keys(country.elections)) {
        expect(SCENARIOS_BY_ID[`${cid.toLowerCase()}-${eid}`], `${cid} ${eid} missing from registry`).toBeDefined();
      }
    }
    for (const id of Object.keys(SCENARIOS)) {
      expect(SCENARIOS_BY_ID[`us-${id}`], `us-${id} missing from registry`).toBeDefined();
    }
    for (const id of Object.keys(UK_ELECTIONS)) {
      expect(SCENARIOS_BY_ID[`uk-${id}`], `uk-${id} missing from registry`).toBeDefined();
    }
  });
});

describe("packs are honest", () => {
  it("every pack scenario exists in the registry, no duplicates", () => {
    for (const p of PACKS) {
      const seen = new Set<string>();
      for (const id of p.scenarios) {
        expect(SCENARIOS_BY_ID[id], `${p.id}: unknown scenario ${id}`).toBeDefined();
        expect(seen.has(id), `${p.id}: duplicate ${id}`).toBe(false);
        seen.add(id);
      }
    }
  });

  it("every non-free scenario is purchasable via some pack", () => {
    for (const s of SCENARIO_REGISTRY) {
      if (s.free) continue;
      expect(packForScenario(s.scenarioId), `${s.scenarioId} not in any pack`).toBeDefined();
      expect(ALL_PAID.includes(s.scenarioId), `${s.scenarioId} missing from ALL_PAID`).toBe(true);
    }
  });
});

describe("US scenarios: full-fat content", () => {
  it("every US scenario has a named historical deck with a debate", () => {
    for (const id of Object.keys(SCENARIOS)) {
      const deck = HISTORICAL_EVENTS[id];
      expect(deck, `historical deck for ${id}`).toBeDefined();
      expect(deck.length, `${id} deck size`).toBeGreaterThanOrEqual(4);
      expect(deck.some((e) => e.isDebate), `${id} deck has a debate`).toBe(true);
      const ids = new Set(deck.map((e) => e.id));
      expect(ids.size, `${id} deck ids unique`).toBe(deck.length);
    }
  });

  it("every US ticket ships a 4-deep VP shortlist with exactly one historical pick", () => {
    for (const [id, sc] of Object.entries(SCENARIOS)) {
      for (const side of ["dem", "rep"] as const) {
        const mates = sc[side].runningMates;
        expect(mates.length, `${id} ${side} VP roster`).toBeGreaterThanOrEqual(4);
        expect(mates.filter((m) => m.historical).length, `${id} ${side} historical VP`).toBe(1);
      }
    }
  });
});

describe("UK elections: full-fat content", () => {
  it("every UK election has a named story-beat deck", () => {
    for (const id of Object.keys(UK_ELECTIONS)) {
      const deck = UK_ELECTION_EVENTS[id];
      expect(deck, `UK deck for ${id}`).toBeDefined();
      expect(deck.length, `UK ${id} deck size`).toBeGreaterThanOrEqual(5);
      expect(deck.some((e) => e.turn !== undefined), `UK ${id} has scheduled beats`).toBe(true);
      for (const e of deck) {
        if (e.turn !== undefined) expect(e.turn, `UK ${id} ${e.id} turn in range`).toBeLessThan(6);
      }
      const ids = new Set(deck.map((e) => e.id));
      expect(ids.size, `UK ${id} deck ids unique`).toBe(deck.length);
    }
  });
});

describe("country elections: full-fat content", () => {
  it("every election has leaders for all its playable parties", () => {
    for (const [cid, country] of Object.entries(COUNTRIES)) {
      for (const eid of Object.keys(country.elections)) {
        for (const p of playablePartiesIn(country, eid)) {
          expect(country.leaders[eid]?.[p], `${cid} ${eid}: leader for ${p}`).toBeDefined();
        }
      }
    }
  });

  it("every election has a named story-beat deck", () => {
    for (const [cid, country] of Object.entries(COUNTRIES)) {
      for (const [eid, election] of Object.entries(country.elections)) {
        const deck = election.events ?? [];
        expect(deck.length, `${cid} ${eid} deck size`).toBeGreaterThanOrEqual(5);
        expect(deck.some((e) => e.turn !== undefined), `${cid} ${eid} scheduled beats`).toBe(true);
        for (const e of deck) {
          if (e.turn !== undefined) expect(e.turn, `${cid} ${eid} ${e.id} turn in range`).toBeLessThan(6);
          if (e.party) expect(country.system.parties.some((p) => p.id === e.party), `${cid} ${eid} ${e.id} pinned party exists`).toBe(true);
        }
        const ids = new Set(deck.map((e) => e.id));
        expect(ids.size, `${cid} ${eid} deck ids unique`).toBe(deck.length);
        expect(Object.keys(election.salience).length, `${cid} ${eid} salience`).toBeGreaterThan(0);
      }
    }
  });

  it("every country bundle ships a real-geography map covering all regions", () => {
    for (const [cid, country] of Object.entries(COUNTRIES)) {
      expect(country.map, `${cid} map`).toBeDefined();
      for (const r of country.regions) {
        const shape = country.map!.shapes[r.id];
        expect(shape, `${cid} map shape for ${r.id}`).toBeDefined();
        expect(shape.d.length, `${cid} ${r.id} path`).toBeGreaterThan(10);
      }
    }
  });
});

describe("scenario & country cover images", () => {
  it("every registry scenario and country has a cover mapping", async () => {
    const { SCENARIO_COVERS, COUNTRY_COVERS, PACK_COVERS } = await import("@content/covers");
    const { PACKS } = await import("@content/packs");
    for (const s of SCENARIO_REGISTRY) {
      expect(SCENARIO_COVERS[s.scenarioId], `cover for ${s.scenarioId}`).toBeTruthy();
    }
    for (const code of ["US", "UK", "CA", "DE", "FR", "AU"] as const) {
      expect(COUNTRY_COVERS[code], `country cover ${code}`).toBeTruthy();
    }
    for (const p of PACKS) {
      expect(PACK_COVERS[p.id], `pack cover ${p.id}`).toBeTruthy();
    }
  });
});
