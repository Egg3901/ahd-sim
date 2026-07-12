// UK glue for the shared multiparty replay adapter (see mpReplay.ts).

import { projectUk, majorityForUk, type UkGameState, type UkAction } from "@engine/ukGame";
import { PARTY_BY_ID } from "@content/uk/parties";
import type { PartyId } from "@engine/system";
import type { ReplayLog, ReplayMode } from "@lib/replay";
import { initMpReplayLog, recordMpWeek, type MpConfig } from "./mpReplay";

const VERB: Record<UkAction["type"], string> = {
  broadcast: "Ran a broadcast",
  rally: "Held a rally",
  surrogate: "Sent a surrogate",
  fundraise: "Fundraised",
  ground_game: "Built ground game",
  gotv: "Ran GOTV",
  canvass: "Canvassed",
  oppo_research: "Dug up oppo",
  debate_prep: "Prepped for debate",
  policy_prep: "Worked the manifesto",
  issue_pivot: "Pivoted on an issue",
};

function describe(a: UkAction, game: UkGameState): string {
  const verb = VERB[a.type] ?? a.type;
  const where = a.regionId ? game.regions.find((r) => r.id === a.regionId)?.abbr ?? a.regionId : null;
  return where ? `${verb} in ${where}` : verb;
}

function cfg(game: UkGameState, mode: ReplayMode): MpConfig {
  const maj = majorityForUk(game);
  return {
    engine: "uk",
    scenarioId: game.electionId,
    unitLabel: "seats",
    unitTotal: maj.total,
    majority: maj.threshold,
    mode,
    partyName: (id: PartyId) => PARTY_BY_ID[id]?.name ?? id,
    partyColor: (id: PartyId) => PARTY_BY_ID[id]?.color ?? "#888",
    contestNames: Object.fromEntries(game.regions.map((r) => [r.id, r.name])),
  };
}

export function initUkReplayLog(game: UkGameState, mode: ReplayMode): ReplayLog {
  return initMpReplayLog(cfg(game, mode), game, projectUk(game));
}

export function recordUkWeek(log: ReplayLog, prev: UkGameState, next: UkGameState): ReplayLog {
  const actions = prev.queuedActions
    .filter((a) => a.party === prev.playerParty)
    .map((a) => describe(a, prev));
  return recordMpWeek(next, projectUk(next), actions, prev.news.length, log);
}
