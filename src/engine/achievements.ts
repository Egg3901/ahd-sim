// ─────────────────────────────────────────────────────────────────────────
// ACHIEVEMENTS — checked once, at game end, against the finished GameState +
// GameResult. Pure predicates over recorded facts (timeline, debateHistory,
// adSpend, stateResults); no RNG, no side effects. Registered users sync them
// to the server; guests keep them in localStorage.
// ─────────────────────────────────────────────────────────────────────────

import type { CandidateId, GameResult, GameState } from "./types";
import { OPPONENT_OF } from "@content/candidates";

export interface AchievementContext {
  result: GameResult;
  game: GameState;
  player: CandidateId;
  difficulty: "easy" | "normal" | "hard";
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  check: (ctx: AchievementContext) => boolean;
}

const wonState = (ctx: AchievementContext, id: string): boolean =>
  ctx.result.stateResults.find((s) => s.stateId === id)?.winner === ctx.player;

const playerWon = (ctx: AchievementContext): boolean => ctx.result.winner === ctx.player;

const evMargin = (ctx: AchievementContext): number =>
  (ctx.result.electoralVotes[ctx.player] ?? 0) - (ctx.result.electoralVotes[OPPONENT_OF[ctx.player]] ?? 0);

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "landslide", name: "Landslide", icon: "🌊",
    description: "Win the Electoral College by 100 or more.",
    check: (c) => playerWon(c) && evMargin(c) >= 100,
  },
  {
    id: "keystone-flip", name: "Keystone Flip", icon: "🔑",
    description: "Flip Pennsylvania — win it after it started in the other column.",
    check: (c) => {
      const pa = c.game.states.find((s) => s.id === "PA");
      if (!pa) return false;
      const startedAgainst = c.player === "dem" ? pa.prior2020DemShare < 0.5 : pa.prior2020DemShare > 0.5;
      return startedAgainst && wonState(c, "PA");
    },
  },
  {
    id: "swing-sweep", name: "Swing State Sweep", icon: "🧹",
    description: "Win every battleground state.",
    check: (c) => c.game.states.filter((s) => s.battleground && s.blocs.length > 0).every((s) => wonState(c, s.id)),
  },
  {
    id: "debate-dominator", name: "Debate Dominator", icon: "🎤",
    description: "Win every debate by 10+ points.",
    check: (c) => {
      const debates = c.game.debateHistory ?? [];
      return debates.length > 0 && debates.every((d) => d.winner === c.player && d.margin >= 10);
    },
  },
  {
    id: "grassroots", name: "Grassroots", icon: "🌱",
    description: "Win the election without spending a dollar on ads.",
    check: (c) => playerWon(c) && (c.game.adSpend?.[c.player] ?? 0) === 0,
  },
  {
    id: "war-chest", name: "War Chest", icon: "💰",
    description: "Finish the campaign with $50M+ unspent.",
    check: (c) => c.game.resources[c.player].cash >= 50_000_000,
  },
  {
    id: "nailbiter", name: "Nailbiter", icon: "😰",
    description: "Win with fewer than 5 electoral votes to spare.",
    check: (c) => playerWon(c) && (c.result.electoralVotes[c.player] ?? 0) - 270 < 5,
  },
  {
    id: "comeback", name: "Comeback Kid", icon: "🔄",
    description: "Trail in the projection at midpoint — then win.",
    check: (c) => {
      const mid = c.game.timeline?.find((t) => t.turn === Math.floor(c.game.totalTurns / 2));
      if (!mid) return false;
      const behind = c.player === "dem" ? mid.demEV < mid.repEV : mid.repEV < mid.demEV;
      return behind && playerWon(c);
    },
  },
  {
    id: "beltway", name: "Inside the Beltway", icon: "🏛️",
    description: "As a Democrat, carry DC by 90+; as a Republican, hold the loss under 60 points.",
    check: (c) => {
      const dc = c.result.stateResults.find((s) => s.stateId === "DC");
      if (!dc) return false;
      const demMargin = (dc.demShare - (1 - dc.demShare)) * 100;
      return c.player === "dem" ? demMargin >= 90 : demMargin < 60;
    },
  },
  {
    id: "sun-belt", name: "Sun Belt Flip", icon: "🌵",
    description: "Win Arizona, Georgia, and Nevada.",
    check: (c) => wonState(c, "AZ") && wonState(c, "GA") && wonState(c, "NV"),
  },
  {
    id: "blue-wall", name: "Blue Wall", icon: "🧱",
    description: "Win Pennsylvania, Michigan, and Wisconsin.",
    check: (c) => wonState(c, "PA") && wonState(c, "MI") && wonState(c, "WI"),
  },
  {
    id: "steady-hand", name: "Steady Hand", icon: "🧘",
    description: "No gaffes and no backfired stunts, the whole campaign.",
    check: (c) => {
      const sign = c.player === "dem" ? 1 : -1;
      return !c.game.causes.some(
        (x) => (x.cause.includes("Gaffe") || x.cause.includes("backfires")) && x.marginDelta * sign < 0,
      );
    },
  },
  {
    id: "dirt-digger", name: "Dirt Digger", icon: "🕵️",
    description: "Land a scandal on your opponent and win a state by under 1.5 points.",
    check: (c) => {
      const oppName = c.game.candidates[OPPONENT_OF[c.player]].shortName;
      const landed = c.game.causes.some((x) => x.cause === `Scandal lands on ${oppName}`);
      const squeaker = c.result.stateResults.some((s) => s.winner === c.player && s.margin < 1.5);
      return landed && squeaker;
    },
  },
  {
    id: "vp-mvp", name: "VP MVP", icon: "🤝",
    description: "Your running mate's coalition bonus helps carry a battleground by under 3.",
    check: (c) => {
      const vpPicked = c.game.runningMates?.[c.player];
      if (!vpPicked) return false;
      return c.result.stateResults.some((s) => {
        const st = c.game.states.find((x) => x.id === s.stateId);
        return st?.battleground && s.winner === c.player && s.margin < 3;
      });
    },
  },
  {
    id: "coast-to-coast", name: "Coast to Coast", icon: "🗽",
    description: "Win California, New York, Florida, and Texas in one campaign.",
    check: (c) => wonState(c, "CA") && wonState(c, "NY") && wonState(c, "FL") && wonState(c, "TX"),
  },
  {
    id: "history-defied", name: "History, Defied", icon: "⚔️",
    description: "Win on Hard — the real map, no help, a ruthless opponent.",
    check: (c) => playerWon(c) && c.difficulty === "hard",
  },
  {
    id: "money-machine", name: "Money Machine", icon: "🖨️",
    description: "Raise more than $150M over the campaign.",
    check: (c) => (c.game.fundsRaised?.[c.player] ?? 0) >= 150_000_000,
  },
];

/** Every achievement earned by the player for a finished game. */
export function checkAchievements(ctx: AchievementContext): Achievement[] {
  if (!ctx.game.result) return [];
  return ACHIEVEMENTS.filter((a) => {
    try {
      return a.check(ctx);
    } catch {
      return false;
    }
  });
}

// ── Guest-side persistence (registered users sync to the server instead) ──
const LOCAL_KEY = "campaign_achievements";

export function localAchievements(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function recordLocalAchievements(scenarioId: string, ids: string[]): void {
  try {
    const all = localAchievements();
    all[scenarioId] = [...new Set([...(all[scenarioId] ?? []), ...ids])];
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  } catch {
    // storage unavailable — guests just lose persistence
  }
}
