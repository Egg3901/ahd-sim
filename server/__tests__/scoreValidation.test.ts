import { describe, it, expect } from "vitest";
import { validateSubmission } from "../scoreValidation";
import { computeScoreFromFacts, usScoreFacts, multipartyScoreFacts } from "../src/engine/scoring";

describe("validateSubmission", () => {
  it("accepts a consistent US submission built from raw EV + popular share", () => {
    const result = {
      electoralVotes: { dem: 306, rep: 232 },
      popularShare: { dem: 0.513, rep: 0.469 },
    };
    const facts = usScoreFacts(result, "dem", "normal");
    const score = computeScoreFromFacts(facts);
    const verdict = validateSubmission({
      scenarioId: "us-2020",
      difficulty: "normal",
      score,
      electoralVotes: result.electoralVotes,
      popularShare: result.popularShare,
      playerSide: "dem",
      facts,
    });
    expect(verdict.ok).toBe(true);
  });

  it("rejects a forged US score even when facts look plausible", () => {
    const result = {
      electoralVotes: { dem: 306, rep: 232 },
      popularShare: { dem: 0.513, rep: 0.469 },
    };
    const facts = usScoreFacts(result, "dem", "normal");
    const verdict = validateSubmission({
      scenarioId: "us-2020",
      difficulty: "normal",
      score: 999, // forged
      electoralVotes: result.electoralVotes,
      popularShare: result.popularShare,
      playerSide: "dem",
      facts,
    });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.error).toMatch(/recompute/i);
  });

  it("rejects raw facts that disagree with reduced facts", () => {
    const result = {
      electoralVotes: { dem: 306, rep: 232 },
      popularShare: { dem: 0.513, rep: 0.469 },
    };
    const facts = usScoreFacts(result, "dem", "normal");
    const score = computeScoreFromFacts(facts);
    const verdict = validateSubmission({
      scenarioId: "us-2020",
      difficulty: "normal",
      score,
      electoralVotes: result.electoralVotes,
      popularShare: result.popularShare,
      playerSide: "dem",
      facts: { ...facts, unitMargin: 200 }, // lie about the margin
    });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.error).toMatch(/disagree/i);
  });

  it("accepts a consistent UK multiparty submission from seats + voteShare", () => {
    const result = {
      seats: { con: 318, lab: 262, ld: 12, snp: 35, dup: 10, sf: 7, pc: 4, grn: 1, oth: 1 },
      voteShare: { con: 0.42, lab: 0.40, ld: 0.07, snp: 0.03, dup: 0.01, sf: 0.01, pc: 0.005, grn: 0.01, oth: 0.045 },
    };
    const facts = multipartyScoreFacts(result, "con", 326, 650, "hard");
    const score = computeScoreFromFacts(facts);
    const verdict = validateSubmission({
      scenarioId: "uk-2017",
      difficulty: "hard",
      score,
      seats: result.seats,
      voteShare: result.voteShare,
      playerSide: "con",
    });
    expect(verdict.ok).toBe(true);
  });

  it("rejects unknown scenarios and bad chamber sizes", () => {
    expect(validateSubmission({
      scenarioId: "us-1896",
      difficulty: "normal",
      score: 500,
      facts: { unitMargin: 0, chamberSize: 538, popularMargin: 0, difficulty: "normal" },
    }).ok).toBe(false);

    expect(validateSubmission({
      scenarioId: "us-2020",
      difficulty: "normal",
      score: 500,
      facts: { unitMargin: 0, chamberSize: 650, popularMargin: 0, difficulty: "normal" },
    }).ok).toBe(false);
  });

  it("still accepts legacy facts-only submissions that recompute", () => {
    const facts = { unitMargin: 36, chamberSize: 538, popularMargin: 4.4, difficulty: "normal" as const };
    const score = computeScoreFromFacts(facts);
    const verdict = validateSubmission({
      scenarioId: "us-2020",
      difficulty: "normal",
      score,
      facts,
    });
    expect(verdict.ok).toBe(true);
  });
});
