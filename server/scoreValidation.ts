// Server-side score validation: the client submits result FACTS (raw EV/seats
// + popular share, or the reduced ScoreFacts), the server recomputes with the
// exact same shared scoring.ts helpers and rejects anything that doesn't
// reproduce — a forged score has to at least be self-consistent and inside
// the game's physical bounds.

import {
  computeScoreFromFacts,
  usScoreFacts,
  multipartyScoreFacts,
  DIFFICULTY_MULTIPLIER,
  type ScoreDifficulty,
  type ScoreFacts,
  type UsResultFacts,
  type MultipartyResultFacts,
} from "../src/engine/scoring.js";
import { SCENARIOS_BY_ID, type ScenarioMeta } from "../src/content/scenarioRegistry.js";
import { COUNTRIES } from "../src/content/countries/index.js";
import { UK_SYSTEM } from "../src/content/uk/parties.js";

// The chamber a scenario's game plays for — a submitted chamberSize must
// match. Country chambers resolve per ELECTION (Canada 2021 = 338 next to
// 2025 = 343; the 2021 Bundestag = 735 with overhang).
function chamberFor(meta: ScenarioMeta): number | undefined {
  if (meta.engine === "us") return 538;
  if (meta.engine === "uk") return UK_SYSTEM.majority.total;
  const country = COUNTRIES[meta.country];
  const election = country?.elections[meta.nativeId];
  return (election?.majority ?? country?.system.majority)?.total;
}

function majorityThresholdFor(meta: ScenarioMeta): number | undefined {
  if (meta.engine === "us") return 270;
  if (meta.engine === "uk") return UK_SYSTEM.majority.threshold;
  const country = COUNTRIES[meta.country];
  const election = country?.elections[meta.nativeId];
  return (election?.majority ?? country?.system.majority)?.threshold;
}

export interface ScoreSubmission {
  scenarioId: string;
  difficulty: ScoreDifficulty;
  score: number;
  // Preferred: reduced facts (unitMargin / chamberSize / popularMargin).
  facts?: ScoreFacts;
  // Preferred for anti-spoof: raw engine result. When present, the server
  // rebuilds ScoreFacts via usScoreFacts / multipartyScoreFacts and ignores
  // any client-supplied unitMargin.
  electoralVotes?: UsResultFacts["electoralVotes"];
  popularShare?: UsResultFacts["popularShare"];
  seats?: MultipartyResultFacts["seats"];
  voteShare?: MultipartyResultFacts["voteShare"];
  playerSide?: string; // "dem" | "rep" | partyId — required with raw result fields
  evMargin?: number;          // display metadata (US: EV margin; multiparty: seat margin)
  popularVoteMargin?: number; // points
  turnsPlayed?: number;
}

function factsFromSubmission(sub: ScoreSubmission, meta: ScenarioMeta): ScoreFacts | { error: string } {
  const hasRawUs = sub.electoralVotes != null && sub.popularShare != null;
  const hasRawMp = sub.seats != null && sub.voteShare != null;

  if (hasRawUs || hasRawMp) {
    if (!sub.playerSide || typeof sub.playerSide !== "string") {
      return { error: "playerSide required when submitting raw result facts" };
    }
    if (meta.engine === "us") {
      if (!hasRawUs) return { error: "US submissions need electoralVotes + popularShare" };
      if (sub.playerSide !== "dem" && sub.playerSide !== "rep") {
        return { error: "US playerSide must be dem or rep" };
      }
      const evSum = Object.values(sub.electoralVotes!).reduce((a, b) => a + b, 0);
      if (evSum < 520 || evSum > 538) return { error: "electoralVotes must sum to ~538" };
      return usScoreFacts(
        { electoralVotes: sub.electoralVotes!, popularShare: sub.popularShare! },
        sub.playerSide,
        sub.difficulty,
      );
    }
    if (!hasRawMp) return { error: "Multiparty submissions need seats + voteShare" };
    const chamber = chamberFor(meta);
    const threshold = majorityThresholdFor(meta);
    if (!chamber || threshold == null) return { error: `No chamber known for ${sub.scenarioId}` };
    const seatSum = Object.values(sub.seats!).reduce((a, b) => a + b, 0);
    if (seatSum < chamber - 5 || seatSum > chamber + 5) {
      return { error: `seats must sum to ~${chamber}` };
    }
    return multipartyScoreFacts(
      { seats: sub.seats!, voteShare: sub.voteShare! },
      sub.playerSide,
      threshold,
      chamber,
      sub.difficulty,
    );
  }

  const f = sub.facts;
  if (!f || typeof f.unitMargin !== "number" || typeof f.chamberSize !== "number" || typeof f.popularMargin !== "number") {
    return { error: "Missing result facts" };
  }
  return f;
}

export function validateSubmission(sub: ScoreSubmission): { ok: true; facts: ScoreFacts } | { ok: false; error: string } {
  const meta = SCENARIOS_BY_ID[sub.scenarioId];
  if (!meta) return { ok: false, error: `Unknown scenario: ${sub.scenarioId}` };
  if (!(sub.difficulty in DIFFICULTY_MULTIPLIER)) return { ok: false, error: "Unknown difficulty" };

  const derived = factsFromSubmission(sub, meta);
  if ("error" in derived) return { ok: false, error: derived.error };
  const f = derived;

  if (f.difficulty !== sub.difficulty) return { ok: false, error: "Difficulty mismatch between score and facts" };

  const chamber = chamberFor(meta);
  if (!chamber) return { ok: false, error: `No chamber known for ${sub.scenarioId}` };
  if (f.chamberSize !== chamber) return { ok: false, error: `Chamber size must be ${chamber} for ${sub.scenarioId}` };
  if (Math.abs(f.unitMargin) > chamber) return { ok: false, error: "Unit margin out of bounds" };
  if (Math.abs(f.popularMargin) > 100) return { ok: false, error: "Popular margin out of bounds" };
  if (typeof sub.turnsPlayed === "number" && (sub.turnsPlayed < 1 || sub.turnsPlayed > 30)) {
    return { ok: false, error: "Turns played out of bounds" };
  }

  // If the client also sent reduced facts alongside raw results, they must agree.
  if (sub.facts && (sub.electoralVotes || sub.seats)) {
    if (
      Math.round(sub.facts.unitMargin) !== Math.round(f.unitMargin) ||
      sub.facts.chamberSize !== f.chamberSize ||
      Math.abs(sub.facts.popularMargin - f.popularMargin) > 0.05
    ) {
      return { ok: false, error: "Submitted facts disagree with raw result" };
    }
  }

  const recomputed = computeScoreFromFacts(f);
  if (recomputed !== Math.round(sub.score)) {
    return { ok: false, error: `Score does not recompute (expected ${recomputed})` };
  }
  return { ok: true, facts: f };
}
