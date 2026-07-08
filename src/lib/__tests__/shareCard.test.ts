import { describe, it, expect } from "vitest";
import { buildShareText } from "../shareCard";
import { BRAND } from "../../brand";

describe("buildShareText", () => {
  it("produces the compact 4-line Wordle-idiom card", () => {
    const text = buildShareText({
      date: "2026-07-08",
      label: "2021 · Scholz v. Laschet",
      flag: "🇩🇪",
      role: "SPD",
      won: true,
      unitLine: "371 seats",
      score: 8420,
    });
    expect(text).toBe(
      "Electioneer Daily · 2026-07-08\n" +
      "🇩🇪 2021 · Scholz v. Laschet — as SPD\n" +
      "🏆 371 seats · Score 8,420\n" +
      BRAND.domain, // interim staging host until the real domain is purchased
    );
  });

  it("brands from BRAND (name + domain)", () => {
    const text = buildShareText({
      date: "2026-01-01", label: "2024 · Harris v. Trump", flag: "🇺🇸",
      role: "Democrats", won: false, unitLine: "226 EVs", score: 312,
    });
    const lines = text.split("\n");
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe(`${BRAND.name} Daily · 2026-01-01`);
    expect(lines[3]).toBe(BRAND.domain);
  });

  it("swaps the trophy for a ballot box on a loss and formats the score", () => {
    const text = buildShareText({
      date: "2026-01-01", label: "x", flag: "🇬🇧", role: "Labour",
      won: false, unitLine: "180 seats", score: 1005,
    });
    expect(text).toContain("🗳️ 180 seats · Score 1,005");
    expect(text).not.toContain("🏆");
  });
});
