import type { GameState } from "./types";
import { createRng } from "./rng";
import { tallyContest } from "./voteModel";

// Polls shown to the player are a *blurred* view of the true model: true share
// + sampling noise + a per-pollster house effect (President Infinity feel).
// They are deterministic for a given (game seed, turn, state, pollster) so the
// UI doesn't reshuffle every render, but they are never ground truth.

export interface Poll {
  stateId: string;
  pollster: string;
  bidenShare: number; // reported two-party
  sampleSize: number;
  marginOfError: number; // points
}

const POLLSTERS = [
  { name: "Quinnipiac", house: 0.005, n: 1100 },
  { name: "Marist", house: -0.004, n: 1000 },
  { name: "Siena/NYT", house: 0.002, n: 900 },
  { name: "Trafalgar", house: -0.012, n: 1050 },
  { name: "Monmouth", house: 0.003, n: 800 },
];

export function pollState(game: GameState, stateId: string): Poll[] {
  const st = game.states.find((s) => s.id === stateId);
  if (!st || st.blocs.length === 0) return [];
  const truth = tallyContest(st).bidenShare;
  return POLLSTERS.map((p, i) => {
    const rng = createRng(`poll:${game.seed}:${game.turn}:${stateId}:${i}`);
    const moe = 1.96 * Math.sqrt((0.25 / p.n)) ; // ~ at 50%
    const sampling = rng.normal(0, moe * 0.6); // probability-space noise
    const reported = Math.min(0.99, Math.max(0.01, truth + p.house + sampling));
    return {
      stateId,
      pollster: p.name,
      bidenShare: reported,
      sampleSize: p.n,
      marginOfError: +(moe * 100).toFixed(1),
    };
  });
}

// A simple poll average across pollsters for a state.
export function pollAverage(game: GameState, stateId: string): number | null {
  const polls = pollState(game, stateId);
  if (polls.length === 0) return null;
  return polls.reduce((s, p) => s + p.bidenShare, 0) / polls.length;
}

// National poll average = electorate-weighted state poll averages.
export function nationalPoll(game: GameState): number {
  let num = 0;
  let den = 0;
  for (const st of game.states) {
    if (st.blocs.length === 0) continue;
    const avg = pollAverage(game, st.id);
    if (avg === null) continue;
    const weight = st.blocs.reduce((s, b) => s + b.size * b.turnoutPropensity, 0);
    num += avg * weight;
    den += weight;
  }
  return den > 0 ? num / den : 0.5;
}
