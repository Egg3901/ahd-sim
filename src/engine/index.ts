// Public engine API. Pure, framework-agnostic — import this from UI, tests,
// a Tauri shell, or a headless batch runner. Zero React/DOM here.

export * from "./types";
export {
  partyById,
  type PartyId,
  type PartyScope,
  type PartyDef,
  type AllocationStrategyId,
  type AllocationStrategy,
  type MajorityRule,
  type PoliticalSystem,
} from "./system";
export { createRng, hashSeed, type Rng } from "./rng";
export { createGame, buildStates, sigmoid, type NewGameOptions } from "./setup";
export {
  computeResult,
  projectElection,
  tallyContest,
  blocDemShare,
  liveBlocDemShare,
  type Projection,
  type ContestTally,
} from "./voteModel";
export { applyAction, issueAlignment, clamp } from "./actions";
export {
  resolveEvent,
  applyEventEffect,
  choiceAvailable,
  queueEventsForTurn,
  aiChooseEvent,
  resolveAiEvents,
  debateReadiness,
  turnsUntilDebate,
  resolveDebate,
} from "./events";
export { planAiActions, DIFFICULTY, type AiConfig } from "./ai";
export { advanceTurn, beginGame, type AdvanceOptions } from "./turn";
export { pollState, pollAverage, nationalPoll, type Poll } from "./polls";
export {
  planMultipartyAi,
  mpFocusedActions,
  mpScattershotActions,
  MP_DIFFICULTY,
  type MpAiConfig,
  type MpDifficulty,
  type MpActionLike,
  type MpView,
} from "./multipartyAi";
export {
  pollRegion,
  nationalMpPoll,
  type MpRegionPoll,
  type MpPollster,
} from "./multipartyPolls";
