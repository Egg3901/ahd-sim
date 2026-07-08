import { describe, it, expect } from "vitest";
import {
  DAILY_ROLE_PAIRS,
  dailyAssignment,
  fnv1a,
  isDailyDate,
  roleShortName,
  utcDateString,
} from "../daily";
import { SCENARIOS_BY_ID, SCENARIO_REGISTRY } from "../../content/scenarioRegistry";
import { COUNTRIES } from "../../content/countries";
import { playablePartiesIn as countryPlayable } from "../../engine/countryGame";
import { playablePartiesIn as ukPlayable } from "../../engine/ukGame";

// 30 consecutive UTC dates starting at a fixed anchor.
function dates(n: number, from = "2026-07-08"): string[] {
  const start = new Date(`${from}T00:00:00Z`).getTime();
  return Array.from({ length: n }, (_, i) => new Date(start + i * 86_400_000).toISOString().slice(0, 10));
}

describe("dailyAssignment", () => {
  it("is deterministic — same date, same assignment, every call", () => {
    for (const d of dates(30)) {
      const a = dailyAssignment(d);
      const b = dailyAssignment(d);
      expect(b).toEqual(a);
      expect(a.date).toBe(d);
      expect(a.seed).toBe(`daily-${d}`);
    }
  });

  it("hash is the stable FNV-1a, not Math.random", () => {
    // Known-answer test: FNV-1a 32-bit of "" is the offset basis; "a" is fixed.
    expect(fnv1a("")).toBe(0x811c9dc5);
    expect(fnv1a("a")).toBe(0xe40c292c);
    expect(fnv1a("daily:2026-07-08")).toBe(fnv1a("daily:2026-07-08"));
  });

  it("always picks a registered scenario and a major-party role for it", () => {
    for (const d of dates(60)) {
      const a = dailyAssignment(d);
      const meta = SCENARIOS_BY_ID[a.scenarioId];
      expect(meta).toBeDefined();
      const pair = DAILY_ROLE_PAIRS[meta!.country];
      expect(pair).toContain(a.role);
    }
  });

  it("assigned roles are actually playable in their engine + election", () => {
    for (const d of dates(60)) {
      const a = dailyAssignment(d);
      const meta = SCENARIOS_BY_ID[a.scenarioId]!;
      if (meta.engine === "us") {
        expect(["dem", "rep"]).toContain(a.role);
      } else if (meta.engine === "uk") {
        expect(ukPlayable(meta.nativeId)).toContain(a.role);
      } else {
        const country = COUNTRIES[meta.country];
        expect(country).toBeDefined();
        expect(countryPlayable(country, meta.nativeId)).toContain(a.role);
      }
    }
  });

  it("rotation over 30 consecutive dates spreads across scenarios and countries", () => {
    const picks = dates(30).map((d) => dailyAssignment(d));
    const scenarios = new Set(picks.map((p) => p.scenarioId));
    const countries = new Set(picks.map((p) => SCENARIOS_BY_ID[p.scenarioId]!.country));
    // A stable hash over a 34-scenario pool should not collapse to a rut.
    expect(scenarios.size).toBeGreaterThanOrEqual(10);
    expect(countries.size).toBeGreaterThanOrEqual(3);
  });

  it("both sides of each pair come up over a long horizon", () => {
    const roles = new Set(dates(120).map((d) => dailyAssignment(d).role));
    expect(roles.size).toBeGreaterThanOrEqual(4);
  });

  it("every registry scenario belongs to a country with a role pair", () => {
    for (const s of SCENARIO_REGISTRY) {
      expect(DAILY_ROLE_PAIRS[s.country], `missing role pair for ${s.country}`).toBeDefined();
    }
  });
});

describe("date helpers", () => {
  it("utcDateString formats as YYYY-MM-DD in UTC", () => {
    expect(utcDateString(new Date("2026-07-08T23:59:59Z"))).toBe("2026-07-08");
    expect(utcDateString(new Date("2026-07-09T00:00:01Z"))).toBe("2026-07-09");
    expect(isDailyDate(utcDateString())).toBe(true);
  });

  it("isDailyDate accepts the shape and rejects junk", () => {
    expect(isDailyDate("2026-07-08")).toBe(true);
    expect(isDailyDate("2026-7-8")).toBe(false);
    expect(isDailyDate("today")).toBe(false);
    expect(isDailyDate("2026-07-08'; DROP TABLE daily_scores;--")).toBe(false);
  });
});

describe("roleShortName", () => {
  it("names every daily role, and falls back to uppercase", () => {
    for (const [a, b] of Object.values(DAILY_ROLE_PAIRS)) {
      expect(roleShortName(a)).not.toBe(a.toUpperCase());
      expect(roleShortName(b)).not.toBe(b.toUpperCase());
    }
    expect(roleShortName("xyz")).toBe("XYZ");
  });
});
