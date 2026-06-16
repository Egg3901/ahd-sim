import type { CampaignAction, CandidateId, GameState } from "./types";
import type { Rng } from "./rng";
import { projectElection } from "./voteModel";
import { OPPONENT_OF } from "@content/candidates";

export interface AiConfig {
  // 0..1 budget-efficiency multiplier; higher = spends more, smarter.
  efficiency: number;
  // 0..1 chance of a misallocation per planning pass.
  mistakeRate: number;
  // How many target states the AI considers (foresight depth).
  foresight: number;
}

export const DIFFICULTY: Record<"easy" | "normal" | "hard", AiConfig> = {
  easy: { efficiency: 0.55, mistakeRate: 0.3, foresight: 3 },
  normal: { efficiency: 0.8, mistakeRate: 0.15, foresight: 5 },
  hard: { efficiency: 1.0, mistakeRate: 0.05, foresight: 8 },
};

function aiShareOf(demShare: number, ai: CandidateId): number {
  return ai === "dem" ? demShare : 1 - demShare;
}

// Ranks contests by tipping-point value to the AI: close races worth more EV in
// cheaper media markets float to the top (Section 8).
interface Target {
  stateId: string;
  ev: number;
  aiShare: number;
  mediaCost: number;
  priority: number;
}

function rankTargets(game: GameState, ai: CandidateId, cfg: AiConfig): Target[] {
  const proj = projectElection(game);
  const targets: Target[] = [];
  for (const sr of proj.contests) {
    const st = game.states.find((s) => s.id === sr.stateId);
    if (!st || st.blocs.length === 0) continue;
    const aiShare = aiShareOf(sr.demShare, ai);
    const closeness = 1 - Math.abs(aiShare - 0.5) * 2; // 1 = a coin flip
    // Only contest genuinely competitive states (within ~10 pts two-party).
    // A campaign doesn't dump its budget into a state it trails by 11+ (NY) or
    // 17 (CA) — that over-investment is what was flipping safe states.
    if (Math.abs(sr.demShare - 0.5) > 0.045) continue;
    // Tipping-point value: EV per dollar of media, weighted by how flippable.
    const priority = (st.electoralVotes * closeness) / st.mediaMarketCost;
    targets.push({
      stateId: st.id,
      ev: st.electoralVotes,
      aiShare,
      mediaCost: st.mediaMarketCost,
      priority,
    });
  }
  targets.sort((a, b) => b.priority - a.priority);
  return targets.slice(0, cfg.foresight);
}

// Builds the AI's action list for this turn. Pure given (game, rng, cfg).
export function planAiActions(game: GameState, rng: Rng, cfg: AiConfig): CampaignAction[] {
  const ai = OPPONENT_OF[game.playerCandidate];
  const res = game.resources[ai];
  const actions: CampaignAction[] = [];
  let targets = rankTargets(game, ai, cfg);
  if (targets.length === 0) return actions;

  // Occasional misallocation: shuffle the priority order (a "mistake").
  if (rng.chance(cfg.mistakeRate)) {
    const i = rng.int(0, targets.length - 1);
    const j = rng.int(0, targets.length - 1);
    [targets[i], targets[j]] = [targets[j], targets[i]];
  }

  // Every action costs one slot from the weekly pool — the AI plays within the
  // same budget the player does (energy-derived). Build a prioritized plan and
  // take as many as the pool allows.
  let budget = res.actions;
  const turnsLeft = game.totalTurns - game.turn;
  const adBudget = res.cash * 0.45 * cfg.efficiency;
  const prioritySum = targets.reduce((s, t) => s + t.priority, 0) || 1;

  // Reserve a fundraising slot when cash is thin, and a ground-game/GOTV anchor.
  if (res.cash < 60_000_000 && budget > 2) {
    // Fundraise in the biggest available target — big-state hauls are larger.
    const richest = [...targets].sort((a, b) => b.ev - a.ev)[0];
    actions.push({ type: "fundraise", candidate: ai, stateId: richest.stateId });
    budget -= 1;
  }
  if (turnsLeft > 3 && res.staffCapacity > 0 && budget > 0) {
    actions.push({ type: "ground_game", candidate: ai, stateId: targets[0].stateId });
    budget -= 1;
  }

  // Interleave an ad and a rally per target, in priority order, until the pool
  // runs out — so the budget spreads across the map instead of all into one ad.
  const queue: CampaignAction[] = [];
  for (const t of targets) {
    // Rally first so the principal's stop (and the map marker) is reliably set.
    queue.push({ type: "rally", candidate: ai, stateId: t.stateId });
    const spend = (adBudget * t.priority) / prioritySum;
    if (spend >= 200_000) {
      const mode = t.aiShare < 0.49 ? "contrast" : "positive";
      queue.push({ type: "advertise", candidate: ai, stateId: t.stateId, adMode: mode, spend });
    }
  }
  if (turnsLeft <= 2) {
    for (const t of targets.slice(0, 3)) {
      const st = game.states.find((s) => s.id === t.stateId);
      if (st && st.groundGame[ai] > 0.05) {
        queue.push({ type: "gotv", candidate: ai, stateId: t.stateId });
      }
    }
  }
  for (const a of queue) {
    if (budget <= 0) break;
    actions.push(a);
    budget -= 1;
  }

  return actions;
}
