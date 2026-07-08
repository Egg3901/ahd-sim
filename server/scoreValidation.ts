// Server-side score validation: the client submits the result FACTS alongside
// the score, the server recomputes with the exact same shared function and
// rejects anything that doesn't reproduce — a forged score has to at least be
// self-consistent and inside the game's physical bounds.

import { computeScoreFromFacts, DIFFICULTY_MULTIPLIER, type ScoreDifficulty, type ScoreFacts } from "../src/engine/scoring.js";
import { SCENARIOS_BY_ID, type ScenarioMeta } from "../src/content/scenarioRegistry.js";
import { COUNTRIES } from "../src/content/countries/index.js";

// The chamber a scenario's game plays for — a submitted chamberSize must
// match. Country chambers resolve per ELECTION (Canada 2021 = 338 next to
// 2025 = 343; the 2021 Bundestag = 735 with overhang).
function chamberFor(meta: ScenarioMeta): number | undefined {
  if (meta.engine === "us") return 538;
  if (meta.engine === "uk") return 650;
  const country = COUNTRIES[meta.country];
  const election = country?.elections[meta.nativeId];
  return (election?.majority ?? country?.system.majority)?.total;
}

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

  const chamber = chamberFor(meta);
  if (!chamber) return { ok: false, error: `No chamber known for ${sub.scenarioId}` };
  if (f.chamberSize !== chamber) return { ok: false, error: `Chamber size must be ${chamber} for ${sub.scenarioId}` };
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
