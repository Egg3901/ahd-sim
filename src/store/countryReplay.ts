// Country glue for the shared multiparty replay adapter (see mpReplay.ts).

import {
  projectCountry,
  majorityFor,
  type CountryBundle,
  type CountryGameState,
  type CountryAction,
} from "@engine/countryGame";
import type { PartyId } from "@engine/system";
import type { ReplayLog, ReplayMode } from "@lib/replay";
import { initMpReplayLog, recordMpWeek, type MpConfig } from "./mpReplay";

const VERB: Record<CountryAction["type"], string> = {
  broadcast: "Ran a broadcast",
  rally: "Held a rally",
  surrogate: "Sent a surrogate",
  fundraise: "Fundraised",
  ground_game: "Built ground game",
  gotv: "Ran GOTV",
  canvass: "Canvassed",
  oppo_research: "Dug up oppo",
  debate_prep: "Prepped for debate",
  policy_prep: "Worked the platform",
  issue_pivot: "Pivoted on an issue",
};

function describe(a: CountryAction, game: CountryGameState): string {
  const verb = VERB[a.type] ?? a.type;
  const where = a.regionId ? game.regions.find((r) => r.id === a.regionId)?.abbr ?? a.regionId : null;
  return where ? `${verb} in ${where}` : verb;
}

function cfg(game: CountryGameState, country: CountryBundle, mode: ReplayMode): MpConfig {
  const maj = majorityFor(game, country);
  const nameOf = (id: PartyId) => country.system.parties.find((p) => p.id === id);
  return {
    engine: "country",
    scenarioId: `${country.id}-${game.electionId}`,
    unitLabel: country.unitNamePlural ?? "seats",
    unitTotal: maj.total,
    majority: maj.threshold,
    mode,
    partyName: (id: PartyId) => nameOf(id)?.name ?? id,
    partyColor: (id: PartyId) => nameOf(id)?.color ?? "#888",
    contestNames: Object.fromEntries(game.regions.map((r) => [r.id, r.name])),
  };
}

export function initCountryReplayLog(
  game: CountryGameState,
  country: CountryBundle,
  mode: ReplayMode,
): ReplayLog {
  return initMpReplayLog(cfg(game, country, mode), game, projectCountry(game, country));
}

export function recordCountryWeek(
  log: ReplayLog,
  prev: CountryGameState,
  next: CountryGameState,
  country: CountryBundle,
): ReplayLog {
  const actions = prev.queuedActions
    .filter((a) => a.party === prev.playerParty)
    .map((a) => describe(a, prev));
  return recordMpWeek(next, projectCountry(next, country), actions, prev.news.length, log);
}
