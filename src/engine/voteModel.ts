import type {
  CandidateId,
  GameResult,
  GameState,
  StateContest,
  StateResult,
} from "./types";
import { sigmoid } from "./setup";

// Effective two-party Biden share for a single bloc = sigmoid of its baseline
// margin plus everything the campaign has done to it (campaignMargin). This is
// the whole vote model: legible because campaignMargin is literally the sum of
// the causes logged against that bloc.
export function blocBidenShare(baselineMargin: number, campaignMargin: number): number {
  return sigmoid(baselineMargin + campaignMargin);
}

export interface ContestTally {
  stateId: string;
  bidenVotes: number;
  trumpVotes: number;
  totalVotes: number;
  bidenShare: number; // two-party
  winner: CandidateId;
}

// Per-point coupling of signed state momentum (Biden−Trump) into vote margin.
// Transient: momentum decays each turn, so this term fades — it never bakes
// into campaignMargin. Zero at neutral, so calibration is untouched.
const MOMENTUM_COUPLING = 0.0025;

// Tallies one vote-bearing contest (a contest with blocs).
export function tallyContest(state: StateContest): ContestTally {
  let bidenVotes = 0;
  let totalVotes = 0;
  const momentumTerm = state.momentum * MOMENTUM_COUPLING;
  for (const bloc of state.blocs) {
    const votes = bloc.size * bloc.turnoutPropensity * bloc.enthusiasm;
    const share = blocBidenShare(bloc.baselineMargin, bloc.campaignMargin + momentumTerm);
    bidenVotes += votes * share;
    totalVotes += votes;
  }
  const trumpVotes = totalVotes - bidenVotes;
  const bidenShare = totalVotes > 0 ? bidenVotes / totalVotes : 0.5;
  return {
    stateId: state.id,
    bidenVotes,
    trumpVotes,
    totalVotes,
    bidenShare,
    winner: bidenShare >= 0.5 ? "biden" : "trump",
  };
}

// Runs the full electoral model: every contest, the ME/NE at-large aggregates,
// the EV tally, the national popular vote, and the winner (incl. 269–269 tie).
export function computeResult(game: GameState): GameResult {
  const tallies = new Map<string, ContestTally>();
  for (const st of game.states) {
    if (st.blocs.length > 0) tallies.set(st.id, tallyContest(st));
  }

  const ev: Record<CandidateId, number> = { biden: 0, trump: 0 };
  const popularVote: Record<CandidateId, number> = { biden: 0, trump: 0 };
  const stateResults: StateResult[] = [];

  for (const st of game.states) {
    let winner: CandidateId;
    let bidenShare: number;

    if (st.aggregateOf && st.aggregateOf.length > 0) {
      // At-large unit: winner of the combined district vote.
      let b = 0;
      let t = 0;
      for (const id of st.aggregateOf) {
        const dt = tallies.get(id);
        if (dt) {
          b += dt.bidenVotes;
          t += dt.trumpVotes;
        }
      }
      winner = b >= t ? "biden" : "trump";
      bidenShare = b + t > 0 ? b / (b + t) : 0.5;
      // Aggregate units add no popular vote (already counted in districts).
    } else {
      const dt = tallies.get(st.id)!;
      winner = dt.winner;
      bidenShare = dt.bidenShare;
      popularVote.biden += dt.bidenVotes;
      popularVote.trump += dt.trumpVotes;
    }

    ev[winner] += st.electoralVotes;
    stateResults.push({
      stateId: st.id,
      electoralVotes: st.electoralVotes,
      bidenShare,
      winner,
      margin: Math.abs(bidenShare - 0.5) * 2 * 100,
    });
  }

  const totalPop = popularVote.biden + popularVote.trump;
  const winner: GameResult["winner"] =
    ev.biden >= 270 ? "biden" : ev.trump >= 270 ? "trump" : "tie";

  // Post-mortem: the player's biggest self-caused swings, by magnitude.
  const postMortem = [...game.causes]
    .sort((a, b) => Math.abs(b.marginDelta) - Math.abs(a.marginDelta))
    .slice(0, 8);

  return {
    electoralVotes: ev,
    winner,
    popularVote,
    popularShare: {
      biden: totalPop > 0 ? popularVote.biden / totalPop : 0.5,
      trump: totalPop > 0 ? popularVote.trump / totalPop : 0.5,
    },
    stateResults,
    postMortem,
  };
}

// Lightweight EV projection used in-game (for the tally bar / AI), with a
// "tossup" band for contests inside `margin` points of 50/50.
export interface Projection {
  ev: Record<CandidateId, number>;
  tossupEv: number;
  contests: { stateId: string; bidenShare: number; lean: CandidateId | "tossup"; ev: number }[];
}

export function projectElection(game: GameState, tossupBand = 3): Projection {
  const result = computeResult(game);
  const ev: Record<CandidateId, number> = { biden: 0, trump: 0 };
  let tossupEv = 0;
  const contests = result.stateResults.map((sr) => {
    const pts = (sr.bidenShare - 0.5) * 200; // Biden margin in points
    let lean: CandidateId | "tossup";
    if (Math.abs(pts) <= tossupBand) {
      lean = "tossup";
      tossupEv += sr.electoralVotes;
    } else {
      lean = pts > 0 ? "biden" : "trump";
      ev[lean] += sr.electoralVotes;
    }
    return { stateId: sr.stateId, bidenShare: sr.bidenShare, lean, ev: sr.electoralVotes };
  });
  return { ev, tossupEv, contests };
}
