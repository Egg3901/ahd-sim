// Shared multiparty (UK / country) adapter for the engine-agnostic replay log.
// Both games expose the same shape — seats + national vote share per party,
// per-region vote shares, a news feed, and queued actions — so a single core
// serves both, with each engine supplying only its display glue.

import type { PartyId } from "@engine/system";
import type { SeatResult } from "@engine/types";
import {
  appendSnapshot,
  createReplayLog,
  type ReplayEngine,
  type ReplayLog,
  type ReplayMode,
  type ReplayParty,
  type ReplaySnapshot,
} from "@lib/replay";

export interface MpProjection {
  seats: Record<PartyId, number>;
  voteShare: Record<PartyId, number>;
  seatResults: SeatResult[];
}

// The minimal cross-section of state the recorder needs from either engine.
export interface MpGameLike {
  turn: number;
  totalTurns: number;
  playerParty: PartyId;
  parties: PartyId[];
  resources: Record<PartyId, { funds: number; momentum: number }>;
  news: { turn: number; text: string }[];
}

export interface MpConfig {
  engine: ReplayEngine;
  scenarioId: string;
  unitLabel: string; // "seats"
  unitTotal: number;
  majority: number;
  mode: ReplayMode;
  partyName: (id: PartyId) => string;
  partyColor: (id: PartyId) => string;
  contestNames: Record<string, string>;
}

function buildSnapshot(
  game: MpGameLike,
  proj: MpProjection,
  actions: string[],
  events: string[],
): ReplaySnapshot {
  const player = game.playerParty;
  const standings = game.parties.map((id) => ({
    id,
    poll: proj.voteShare[id] ?? 0,
    units: proj.seats[id] ?? 0,
  }));
  // Multiparty seats are fully allocated, so there is no tossup pool.
  const leader = standings.reduce<{ id: string | null; units: number }>(
    (best, s) => (s.units > best.units ? { id: s.id, units: s.units } : best),
    { id: null, units: -Infinity },
  );

  // Per-region PLAYER vote share.
  const contestShare: Record<string, number> = {};
  for (const sr of proj.seatResults) contestShare[sr.contestId] = sr.voteShare[player] ?? 0;

  return {
    turn: game.turn,
    leaderId: leader.id,
    standings,
    tossupUnits: 0,
    playerCash: game.resources[player]?.funds,
    playerMomentum: game.resources[player]?.momentum,
    contestShare,
    actions,
    events,
  };
}

export function initMpReplayLog(
  cfg: MpConfig,
  game: MpGameLike,
  proj: MpProjection,
): ReplayLog {
  const parties: ReplayParty[] = game.parties.map((id) => ({
    id,
    name: cfg.partyName(id),
    color: cfg.partyColor(id),
  }));
  const log = createReplayLog({
    engine: cfg.engine,
    scenarioId: cfg.scenarioId,
    playerId: game.playerParty,
    unitLabel: cfg.unitLabel,
    unitTotal: cfg.unitTotal,
    majority: cfg.majority,
    totalTurns: game.totalTurns,
    mode: cfg.mode,
    parties,
    contestNames: cfg.contestNames,
  });
  return appendSnapshot(log, buildSnapshot(game, proj, [], []));
}

// Record the just-completed week. `newsBefore` is the length of the news feed
// before the advance, so freshly prepended items are this week's events.
export function recordMpWeek(
  game: MpGameLike,
  proj: MpProjection,
  actions: string[],
  newsBefore: number,
  log: ReplayLog,
): ReplayLog {
  const fresh = Math.max(0, game.news.length - newsBefore);
  const events = game.news.slice(0, fresh).map((n) => n.text);
  return appendSnapshot(log, buildSnapshot(game, proj, actions, events));
}
