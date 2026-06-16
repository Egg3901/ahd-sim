// ─────────────────────────────────────────────────────────────────────────
// CAMPAIGN — core data model (Section 4 of the design).
// These types are the single shared contract between ENGINE, CONTENT and UI.
// The engine is pure: no React, no DOM, no browser globals appear here.
// ─────────────────────────────────────────────────────────────────────────

export type IssueId =
  | "economy"
  | "covid_response"
  | "healthcare"
  | "immigration"
  | "race_policing"
  | "climate"
  | "taxes"
  | "law_and_order"
  | "abortion"
  | "trade";

// Demographic bloc archetypes. A clean partition of each state's electorate
// (sizes sum to the electorate) chosen for narrative utility: the classic 2020
// storylines (working-class whites, suburban women, seniors, youth turnout)
// each get their own scoreable bucket. The race/age/geography overlap is a
// deliberate game-model simplification.
export type BlocId =
  | "noncollege_white"
  | "college_white"
  | "suburban_women"
  | "black"
  | "hispanic"
  | "asian_other"
  | "seniors"
  | "youth";

// The two tickets. Player picks one; the other is AI.
export type CandidateId = "dem" | "rep";

// Campaign-event source: scripted real beats for the year, or a random draw
// from a year-agnostic plausible pool.
export type EventMode = "historical" | "plausible";

export type Party = "Democratic" | "Republican";

export interface Issue {
  id: IssueId;
  name: string;
  // National salience 0..1 — how much this issue weighs in the model right now.
  // Mutated by events (a covid spike raises covid salience, etc.).
  baseSalience: number;
  // Short description for tooltips/UI.
  blurb: string;
}

export interface CandidateTraits {
  charisma: number; // 0..100
  energy: number; // was stamina
  debatePrep: number; // was leadership (repurposed)
  intelligence: number; // was integrity (repurposed)
  policyKnowledge: number; // was experience (repurposed)
  debatingSkill: number; // was debating (renamed)
  fundraisingProwess: number; // was fundraising (renamed)
}

export interface Candidate {
  id: CandidateId;
  name: string;
  shortName: string;
  party: Party;
  runningMate: string;
  color: string;
  traits: CandidateTraits;
  // Issue stance, left(-1) ↔ right(+1). Mutable via Issue Pivot action.
  issuePositions: Record<IssueId, number>;
  // Baseline favorability per bloc, -1..+1. Mutated by ads/events.
  baseFavorability: Partial<Record<BlocId, number>>;
}

// A selectable running mate. Picked at setup; its bonuses are folded into the
// ticket's traits / bloc favorability / starting resources at game creation.
export interface RunningMate {
  id: string;
  name: string;
  // Which presidential nominee this VP runs with.
  ticket: CandidateId;
  // One-line newsroom-style description of the pick's strategic value.
  blurb: string;
  // The real 2020 running mate (used as each side's default).
  historical?: boolean;
  // Added to the ticket's candidate traits (clamped 0..100).
  traitBonuses?: Partial<CandidateTraits>;
  // Added to the ticket's baseline bloc favorability.
  favorability?: Partial<Record<BlocId, number>>;
  // One-time starting-cash bonus (fundraiser VPs).
  cashBonus?: number;
  // Extra candidate-days each week (energetic surrogates).
  candidateDayBonus?: number;
}

// A demographic bloc *inside a particular state*. The heart of the scoring model.
export interface StateBloc {
  blocId: BlocId;
  // Number of eligible voters of this bloc in the state.
  size: number;
  // 0..1: how strongly this bloc turns out at baseline.
  turnoutPropensity: number;
  // Biden-minus-Trump baseline appeal margin (logit space). Solved at game
  // init so the turnout-weighted state aggregate reproduces the real 2020
  // two-party result. Campaign effects add to this margin during play.
  baselineMargin: number;
  // Mutable per-turn state:
  // Two-party support for each candidate, 0..1, sums to 1.
  support: Record<CandidateId, number>;
  // Accumulated campaign margin shift (Biden − Trump), layered onto baseline.
  campaignMargin: number;
  // Enthusiasm multiplier on turnout, around 1.0.
  enthusiasm: number;
}

export type Region =
  | "Northeast"
  | "South"
  | "Midwest"
  | "West"
  | "Swing";

// A contest = an awardable electoral unit. Most are whole states; ME/NE
// at-large and congressional districts are modeled as separate contests.
export interface StateContest {
  id: string; // e.g. "PA", "ME-2", "NE-AL"
  name: string;
  abbr: string;
  electoralVotes: number;
  region: Region;
  // Real 2020 two-party Biden share, used only to solve baselineMargin.
  prior2020DemShare: number;
  // Cost multiplier for ads in this media market (1.0 = national average).
  mediaMarketCost: number;
  // True for the seven genuinely swingable contests (UI emphasis + AI focus).
  battleground: boolean;
  blocs: StateBloc[];
  // Built-up ground-game strength per ticket (0..1), persistent + sticky.
  groundGame: Record<CandidateId, number>;
  // Per-state momentum, -100..+100.
  momentum: number;
  // ME-AL / NE-AL at-large units award their EVs to whoever wins the combined
  // vote of these district contests. Such aggregate units carry no blocs.
  aggregateOf?: string[];
}

// ── Resources (player + AI each hold one) ────────────────────────────────
export interface Resources {
  cash: number; // dollars on hand
  candidateDays: number; // action points for the principal this turn
  maxCandidateDays: number;
  staffCapacity: number; // limits simultaneous ground-game states
  nationalMomentum: number; // -100..+100
  mediaNarrative: number; // -100 (hostile) .. +100 (favorable)
}

// ── Actions (Section 6) ───────────────────────────────────────────────────
export type ActionType =
  | "advertise" // positive / contrast / issue
  | "rally" // candidate stop
  | "surrogate" // VP / surrogate stop
  | "fundraise"
  | "ground_game"
  | "gotv"
  | "oppo_research"
  | "debate_prep"
  | "issue_pivot";

export type AdMode = "positive" | "contrast" | "issue";

export interface CampaignAction {
  type: ActionType;
  candidate: CandidateId;
  stateId?: string;
  blocId?: BlocId;
  issueId?: IssueId;
  adMode?: AdMode;
  // Dollars committed (ads, fundraising venues, etc.).
  spend?: number;
  // Candidate-days committed (rallies, debate prep, fundraising galas).
  days?: number;
  // For issue_pivot: new position -1..+1.
  newPosition?: number;
}

// ── Events (Section 7) — authored as DATA, applied by the engine ──────────
export interface BlocDelta {
  blocId: BlocId;
  // Direct shift to campaignMargin (Biden − Trump) for this bloc, nationwide.
  margin?: number;
  // Enthusiasm/turnout shift.
  enthusiasm?: number;
}

export interface EventEffect {
  // Margin deltas keyed by bloc, applied to the *answering* candidate's favor.
  // Positive favors the candidate who is the event's subject.
  blocDeltas?: BlocDelta[];
  salienceDeltas?: Partial<Record<IssueId, number>>;
  momentum?: number; // national momentum delta for subject
  cash?: number;
  narrative?: number; // media narrative delta
  favorability?: Partial<Record<BlocId, number>>;
}

export interface EventChoice {
  id: string;
  text: string;
  // Optional gate (e.g. requires a trait threshold or prior action).
  requires?: { trait?: keyof CandidateTraits; min?: number };
  effects: EventEffect;
  resultText: string;
}

export type EventTrigger =
  | { kind: "scheduled"; turn: number } // fires on a specific turn
  | { kind: "stochastic"; baseWeight: number }; // drawn from the random pool

export interface GameEvent {
  id: string;
  title: string;
  prompt: string;
  // Which candidate the event is "about" (whose choices we resolve). For
  // scripted shared events (debates) this is the viewing/player perspective;
  // the engine resolves the player's choice and lets the AI auto-pick.
  subject: "player" | "opponent" | "both";
  trigger: EventTrigger;
  choices: EventChoice[];
  // Optional gating on game state for stochastic events.
  gate?: {
    minTurn?: number;
    maxTurn?: number;
    // Only fire if this candidate's stamina-driven gaffe risk is high, etc.
    requiresLowStamina?: boolean;
  };
  // Debate flag — affected by debate_prep.
  isDebate?: boolean;
  oncePerGame?: boolean;
}

// A queued event instance awaiting resolution this turn.
export interface PendingEvent {
  eventId: string;
  forCandidate: CandidateId;
}

// ── Causality log — every poll move traces to a cause (Pillar C) ──────────
export interface CauseEntry {
  turn: number;
  stateId?: string;
  blocId?: BlocId;
  cause: string; // human-readable, e.g. "Positive ads in PA"
  marginDelta: number; // Biden − Trump contribution
}

// ── Top-level game state ──────────────────────────────────────────────────
export type GamePhase = "setup" | "intel" | "events" | "allocate" | "result";

export interface TurnRecapItem {
  label: string;
  detail: string;
  marginDelta?: number;
  stateId?: string;
}

export interface GameState {
  seed: number;
  rngState: number;
  turn: number; // 0-based; 0 = first playable week
  totalTurns: number;
  granularity: "week" | "day";
  phase: GamePhase;
  playerCandidate: CandidateId;
  // Election scenario id (see content/scenarios); absent on pre-scenario saves.
  scenarioId?: string;
  // How campaign events are drawn (see content/events). Absent → "historical".
  eventMode?: EventMode;
  candidates: Record<CandidateId, Candidate>;
  issues: Record<IssueId, Issue>;
  // Live national salience, starts from issue.baseSalience, shifts via events.
  salience: Record<IssueId, number>;
  states: StateContest[];
  resources: Record<CandidateId, Resources>;
  pendingEvents: PendingEvent[];
  firedEventIds: string[];
  // Actions queued this turn by the player (resolved on endTurn).
  queuedActions: CampaignAction[];
  causes: CauseEntry[];
  lastRecap: TurnRecapItem[];
  // Chosen running mate id per ticket (drives the applied bonuses + UI). Optional
  // for backward compatibility with saves predating VP selection.
  runningMates?: Record<CandidateId, string>;
  // Set once the game is decided.
  result?: GameResult;
}

export interface StateResult {
  stateId: string;
  electoralVotes: number;
  demShare: number; // two-party
  winner: CandidateId;
  margin: number; // winner's two-party margin in points
}

export interface GameResult {
  electoralVotes: Record<CandidateId, number>;
  winner: CandidateId | "tie";
  popularVote: Record<CandidateId, number>; // raw vote totals
  popularShare: Record<CandidateId, number>; // two-party share
  stateResults: StateResult[];
  // Post-mortem: biggest swings the player caused.
  postMortem: CauseEntry[];
}
