// Server-side score validation: the client submits the result FACTS alongside
// the score, the server recomputes with the exact same shared function and
// rejects anything that doesn't reproduce — a forged score has to at least be
// self-consistent and inside the game's physical bounds.

import { computeScoreFromFacts, DIFFICULTY_MULTIPLIER, type ScoreDifficulty, type ScoreFacts } from "../src/engine/scoring.js";
import { SCENARIOS_BY_ID, type CountryCode } from "../src/content/scenarioRegistry.js";

// The chamber every country's game plays for — a submitted chamberSize must match.
const CHAMBER_BY_COUNTRY: Record<CountryCode, number> = {
  US: 538,
  UK: 650,
  CA: 343,
  DE: 630,
  FR: 100, // two-round runoff, modeled as a 100-point electoral pool
};

export interface ScoreSubmission {
  scenarioId: string;
  difficulty: ScoreDifficulty;
  score: number;
  facts: ScoreFacts;
  evMargin?: number;          // display metadata (US: EV margin; multiparty: seat margin)
  popularVoteMargin?: number; // points
  turnsPlayed?: number;
}

export function validateSubmission(sub: ScoreSubmission): { ok: true } | { ok: false; error: string } {
  const meta = SCENARIOS_BY_ID[sub.scenarioId];
  if (!meta) return { ok: false, error: `Unknown scenario: ${sub.scenarioId}` };
  if (!(sub.difficulty in DIFFICULTY_MULTIPLIER)) return { ok: false, error: "Unknown difficulty" };

  const f = sub.facts;
  if (!f || typeof f.unitMargin !== "number" || typeof f.chamberSize !== "number" || typeof f.popularMargin !== "number") {
    return { ok: false, error: "Missing result facts" };
  }
  if (f.difficulty !== sub.difficulty) return { ok: false, error: "Difficulty mismatch between score and facts" };

  const chamber = CHAMBER_BY_COUNTRY[meta.country];
  if (f.chamberSize !== chamber) return { ok: false, error: `Chamber size must be ${chamber} for ${meta.country}` };
  if (Math.abs(f.unitMargin) > chamber) return { ok: false, error: "Unit margin out of bounds" };
  if (Math.abs(f.popularMargin) > 100) return { ok: false, error: "Popular margin out of bounds" };
  if (typeof sub.turnsPlayed === "number" && (sub.turnsPlayed < 1 || sub.turnsPlayed > 30)) {
    return { ok: false, error: "Turns played out of bounds" };
  }

  const recomputed = computeScoreFromFacts(f);
  if (recomputed !== Math.round(sub.score)) {
    return { ok: false, error: `Score does not recompute (expected ${recomputed})` };
  }
  return { ok: true };
}
