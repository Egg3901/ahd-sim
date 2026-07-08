// Shared multiparty AI for the UK and country engines. The balance gauntlet's
// focused/scattershot bots lived in harness.ts; this module is the in-game
// planner those bots now call, with difficulty tiers (easy/normal/hard) that
// mirror the US AI's efficiency / mistake / foresight knobs.

import type { PartyId } from "./system";
import type { StateContest } from "./types";
import type { Rng } from "./rng";
import { tallyRegion } from "./multiparty";

export type MpDifficulty = "easy" | "normal" | "hard";

export interface MpAiConfig {
  // 0..1 budget-efficiency: higher = spends more, smarter target mix.
  efficiency: number;
  // 0..1 chance of a misallocation (shuffle targets) per planning pass.
  mistakeRate: number;
  // How many close regions the AI considers.
  foresight: number;
}

export const MP_DIFFICULTY: Record<MpDifficulty, MpAiConfig> = {
  easy: { efficiency: 0.55, mistakeRate: 0.35, foresight: 3 },
  normal: { efficiency: 0.85, mistakeRate: 0.12, foresight: 4 },
  hard: { efficiency: 1.0, mistakeRate: 0.04, foresight: 6 },
};

/** Action verbs shared by UkAction / CountryAction (and the gauntlet bots). */
export interface MpActionLike {
  type: "canvass" | "rally" | "ground_game" | "gotv" | "fundraise" | "broadcast" | "oppo_research";
  party: PartyId;
  regionId?: string;
  spend?: number;
  mode?: "positive" | "contrast";
  targetParty?: PartyId;
}

export interface MpView {
  regions: StateContest[];
  turn: number;
  totalTurns: number;
  funds: number;
  actions: number;
}

// Regions ranked by how close the party sits to the local top rival.
export function mpTargets(view: MpView, party: PartyId, max: number) {
  const standing = view.regions.filter((r) => r.baselineShare?.[party] !== undefined);
  const rows = standing.map((r) => {
    const { shareByParty } = tallyRegion(r);
    const mine = shareByParty[party] ?? 0;
    const rival = Math.max(
      0,
      ...Object.keys(shareByParty)
        .filter((p) => p !== party)
        .map((p) => shareByParty[p] ?? 0),
    );
    return { region: r, margin: mine - rival, rivalParty: topRival(shareByParty, party) };
  });
  // Winnable = within striking distance of the local lead; fall back to the
  // closest contests so small parties still campaign somewhere.
  const winnable = rows.filter((r) => r.margin > -0.2);
  const pool = winnable.length > 0 ? winnable : rows;
  return pool.sort((a, b) => Math.abs(a.margin) - Math.abs(b.margin)).slice(0, max);
}

function topRival(shareByParty: Record<string, number>, party: PartyId): PartyId | undefined {
  let best: PartyId | undefined;
  let bestShare = -1;
  for (const [p, s] of Object.entries(shareByParty)) {
    if (p === party) continue;
    if (s > bestShare) {
      bestShare = s;
      best = p as PartyId;
    }
  }
  return best;
}

export function mpFocusedActions(
  view: MpView,
  party: PartyId,
  cfg: MpAiConfig = MP_DIFFICULTY.normal,
  rng?: Rng,
): MpActionLike[] {
  let targets = mpTargets(view, party, cfg.foresight);
  if (targets.length === 0) return [];

  // Occasional misallocation: shuffle priority (a "mistake").
  if (rng && targets.length > 1 && rng.chance(cfg.mistakeRate)) {
    const i = rng.int(0, targets.length - 1);
    const j = rng.int(0, targets.length - 1);
    [targets[i], targets[j]] = [targets[j], targets[i]];
  }

  const slots = view.actions;
  const turnsLeft = Math.max(1, view.totalTurns - view.turn);
  const out: MpActionLike[] = [];
  let funds = view.funds;

  if (funds < 2) {
    out.push({ type: "fundraise", party });
    funds += 1.5;
  }

  // Trailing hard AIs occasionally dig dirt nationally.
  const nationalShare = averageShare(view.regions, party);
  const losing = nationalShare < 0.28;
  if (losing && cfg.efficiency > 0.8 && funds >= 2 && slots > 2 && (!rng || rng.chance(0.15 + cfg.efficiency * 0.2))) {
    out.push({ type: "oppo_research", party });
    funds -= 2;
  }

  // One paid push per target: GOTV in the last stretch, field offices earlier;
  // canvass (free) when the kitty is empty. Plus a rally on the closest race.
  out.push({ type: "rally", party, regionId: targets[0].region.id });

  for (const t of targets) {
    if (out.length >= slots) break;
    if (turnsLeft <= 2 && funds >= 1) {
      out.push({ type: "gotv", party, regionId: t.region.id });
      funds -= 1;
    } else if (funds >= 1.5 && cfg.efficiency >= 0.7) {
      // Disciplined AIs buy a small regional broadcast on their closest race.
      if (out.length < slots - 1 && funds >= 2.5 && t === targets[0]) {
        const foe = t.rivalParty;
        out.push({
          type: "broadcast",
          party,
          regionId: t.region.id,
          spend: 1.5,
          mode: t.margin < 0 ? "contrast" : "positive",
          targetParty: foe,
        });
        funds -= 1.5;
      } else {
        out.push({ type: "ground_game", party, regionId: t.region.id });
        funds -= 1.5;
      }
    } else if (funds >= 1.5) {
      out.push({ type: "ground_game", party, regionId: t.region.id });
      funds -= 1.5;
    } else {
      out.push({ type: "canvass", party, regionId: t.region.id });
    }
  }

  // Remaining slots: free canvassing round-robin over the same targets.
  let i = 0;
  while (out.length < slots) {
    out.push({ type: "canvass", party, regionId: targets[i % targets.length].region.id });
    i++;
  }
  return out.slice(0, slots);
}

export function mpScattershotActions(view: MpView, party: PartyId): MpActionLike[] {
  const standing = view.regions.filter((r) => r.baselineShare?.[party] !== undefined);
  if (standing.length === 0) return [];
  const slots = view.actions;
  const out: MpActionLike[] = [];
  if (view.funds < 1) out.push({ type: "fundraise", party });
  let i = 0;
  while (out.length < slots) {
    out.push({ type: "canvass", party, regionId: standing[i % standing.length].id });
    i++;
  }
  return out.slice(0, slots);
}

function averageShare(regions: StateContest[], party: PartyId): number {
  let num = 0;
  let den = 0;
  for (const r of regions) {
    if (r.baselineShare?.[party] === undefined) continue;
    const { shareByParty, totalVotes } = tallyRegion(r);
    num += (shareByParty[party] ?? 0) * totalVotes;
    den += totalVotes;
  }
  return den > 0 ? num / den : 0;
}

/** In-game planner used by ukGame / countryGame. */
export function planMultipartyAi(
  view: MpView,
  party: PartyId,
  difficulty: MpDifficulty,
  rng: Rng,
): MpActionLike[] {
  const cfg = MP_DIFFICULTY[difficulty];
  // Easy AI occasionally goes scattershot (sloppy opponent).
  if (difficulty === "easy" && rng.chance(0.35)) return mpScattershotActions(view, party);
  return mpFocusedActions(view, party, cfg, rng);
}
