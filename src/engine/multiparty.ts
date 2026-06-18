// ─────────────────────────────────────────────────────────────────────────
// MULTIPARTY VOTE MODEL + REGIONAL SEATS CURVE (the UK engine path).
//
// The two-party U.S. path stays the sigmoid model in voteModel.ts. This module
// is its N-party generalization:
//   - vote shares come from a softmax over per-party appeal (sigmoid is the N=2
//     case: softmax({dem:m, rep:0}).dem === sigmoid(m)).
//   - a region's fixed seat pool is split by a calibrated FPTP disproportionality
//     curve: seats_p ∝ efficiency[p] · share_p ^ k, largest-remainder rounded.
//
// Everything is pure + deterministic — no RNG, no DOM.
// ─────────────────────────────────────────────────────────────────────────

import type { PartyId, MajorityRule } from "./system";
import type {
  Government,
  SeatResult,
  StateBloc,
  StateContest,
} from "./types";

// Numerically-stable softmax over an appeal vector → vote shares summing to 1.
export function softmax(appeals: Record<PartyId, number>): Record<PartyId, number> {
  const ids = Object.keys(appeals);
  if (ids.length === 0) return {};
  const max = Math.max(...ids.map((i) => appeals[i]));
  let sum = 0;
  const exps: Record<PartyId, number> = {};
  for (const i of ids) {
    const e = Math.exp(appeals[i] - max);
    exps[i] = e;
    sum += e;
  }
  const out: Record<PartyId, number> = {};
  for (const i of ids) out[i] = sum > 0 ? exps[i] / sum : 1 / ids.length;
  return out;
}

// Live per-party vote shares for a single bloc: softmax over baseline appeal
// plus everything the campaign has done to it. Legible because campaignAppeal is
// literally the sum of the causes logged against that bloc.
export function blocPartyShares(bloc: StateBloc): Record<PartyId, number> {
  const appeal = bloc.appeal ?? {};
  const camp = bloc.campaignAppeal ?? {};
  const combined: Record<PartyId, number> = {};
  for (const p of Object.keys(appeal)) combined[p] = appeal[p] + (camp[p] ?? 0);
  return softmax(combined);
}

// Turnout-weighted per-party vote totals for one region (a contest with blocs).
export function tallyRegion(region: StateContest): {
  votesByParty: Record<PartyId, number>;
  totalVotes: number;
  shareByParty: Record<PartyId, number>;
} {
  const votesByParty: Record<PartyId, number> = {};
  let totalVotes = 0;
  for (const bloc of region.blocs) {
    const weight = bloc.size * bloc.turnoutPropensity * bloc.enthusiasm;
    const shares = blocPartyShares(bloc);
    for (const p of Object.keys(shares)) {
      votesByParty[p] = (votesByParty[p] ?? 0) + weight * shares[p];
    }
    totalVotes += weight;
  }
  const shareByParty: Record<PartyId, number> = {};
  for (const p of Object.keys(votesByParty)) {
    shareByParty[p] = totalVotes > 0 ? votesByParty[p] / totalVotes : 0;
  }
  return { votesByParty, totalVotes, shareByParty };
}

// Largest-remainder rounding of fractional seat counts to integers summing
// exactly to `total`. The UK analog of "538 EV by construction".
export function largestRemainder(
  weights: Record<PartyId, number>,
  total: number,
): Record<PartyId, number> {
  const ids = Object.keys(weights);
  const sumW = ids.reduce((s, i) => s + Math.max(0, weights[i]), 0);
  const out: Record<PartyId, number> = {};
  if (sumW <= 0 || total <= 0) {
    for (const i of ids) out[i] = 0;
    return out;
  }
  const exact: Record<PartyId, number> = {};
  let assigned = 0;
  for (const i of ids) {
    exact[i] = (Math.max(0, weights[i]) / sumW) * total;
    out[i] = Math.floor(exact[i]);
    assigned += out[i];
  }
  let remaining = total - assigned;
  // Hand out the leftover seats to the largest fractional remainders.
  const byRemainder = ids
    .map((i) => ({ i, frac: exact[i] - Math.floor(exact[i]) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < byRemainder.length && remaining > 0; k++) {
    out[byRemainder[k].i] += 1;
    remaining--;
  }
  return out;
}

// Default FPTP amplification: ~2.5 seats-share points move per point of
// vote-share swing, the disproportionality that turns a vote lead into a much
// bigger seat lead.
export const DEFAULT_SEAT_ELASTICITY = 2.6;

// THE SEATS CURVE. Convert a region's per-party vote shares into integer seats by
// swinging off the real baseline: neutral (current == baseline) reproduces the
// region's real seats exactly; as a party's share rises above its baseline it
// gains seats (amplified by elasticity), as it falls it sheds them. The result
// is largest-remainder renormalized so it always sums to the region's pool — so
// every seat a surging party wins is one a fading party loses.
export function allocateRegionSeats(region: StateContest, shareByParty: Record<PartyId, number>): Record<PartyId, number> {
  const seats = region.seats ?? 0;
  const baseSeats = region.baselineSeats ?? {};
  const baseShare = region.baselineShare ?? {};
  const elasticity = region.seatElasticity ?? DEFAULT_SEAT_ELASTICITY;

  const ids = new Set<PartyId>([...Object.keys(baseSeats), ...Object.keys(shareByParty)]);
  const raw: Record<PartyId, number> = {};
  for (const p of ids) {
    const swing = (shareByParty[p] ?? 0) - (baseShare[p] ?? 0);
    // Seat delta = elasticity · swing · poolSize. Clamp at zero (a party can't
    // win negative seats), then renormalize below preserves the pool total.
    raw[p] = Math.max(0, (baseSeats[p] ?? 0) + elasticity * swing * seats);
  }
  return largestRemainder(raw, seats);
}

// Run the full multiparty election: every region's vote shares → seats, summed
// to a national seat total + national vote share + the government-formation call.
export function computeSeatsResult(
  regions: StateContest[],
  majority: MajorityRule,
  abstainingParties: PartyId[] = [],
  // Optional coalition-compatibility predicate: can `lead` govern with `partner`?
  // (UK: the two main rivals never partner each other.) Omitted ⇒ anyone may.
  compatible?: (lead: PartyId, partner: PartyId) => boolean,
): {
  seats: Record<PartyId, number>;
  voteShare: Record<PartyId, number>;
  seatResults: SeatResult[];
  largestParty: PartyId;
  hung: boolean;
  government: Government;
} {
  const seats: Record<PartyId, number> = {};
  const nationalVotes: Record<PartyId, number> = {};
  let nationalTotal = 0;
  const seatResults: SeatResult[] = [];

  for (const region of regions) {
    if (!region.seats || region.blocs.length === 0) continue;
    const { votesByParty, totalVotes, shareByParty } = tallyRegion(region);
    const seatsByParty = allocateRegionSeats(region, shareByParty);
    for (const p of Object.keys(seatsByParty)) seats[p] = (seats[p] ?? 0) + seatsByParty[p];
    for (const p of Object.keys(votesByParty)) nationalVotes[p] = (nationalVotes[p] ?? 0) + votesByParty[p];
    nationalTotal += totalVotes;

    let winner = "";
    let best = -1;
    for (const p of Object.keys(seatsByParty)) {
      if (seatsByParty[p] > best) { best = seatsByParty[p]; winner = p; }
    }
    seatResults.push({
      contestId: region.id,
      name: region.name,
      totalSeats: region.seats,
      seatsByParty,
      voteShare: shareByParty,
      winner,
    });
  }

  const voteShare: Record<PartyId, number> = {};
  for (const p of Object.keys(nationalVotes)) voteShare[p] = nationalTotal > 0 ? nationalVotes[p] / nationalTotal : 0;

  // Largest party by seats.
  let largestParty = "";
  let mostSeats = -1;
  for (const p of Object.keys(seats)) {
    if (seats[p] > mostSeats) { mostSeats = seats[p]; largestParty = p; }
  }

  const government = formGovernment(seats, majority, abstainingParties, largestParty, compatible);
  const hung = government.kind === "hung" || government.kind === "minority" ||
    government.kind === "coalition" || government.kind === "confidence_supply";

  return { seats, voteShare, seatResults, largestParty, hung, government };
}

// The government-formation call. Effective threshold accounts for abstaining
// parties (Sinn Féin) + the Speaker — the bar to actually command the Commons.
export function formGovernment(
  seats: Record<PartyId, number>,
  majority: MajorityRule,
  abstainingParties: PartyId[],
  largestParty: PartyId,
  compatible: (lead: PartyId, partner: PartyId) => boolean = () => true,
): Government {
  const abstainSeats = abstainingParties.reduce((s, p) => s + (seats[p] ?? 0), 0);
  // Effective Commons size after abstentions; majority is half of that + 1.
  const effectiveTotal = majority.total - abstainSeats;
  const threshold = majority.effectiveThreshold ?? Math.floor(effectiveTotal / 2) + 1;

  const lead = seats[largestParty] ?? 0;
  if (lead >= threshold) return { kind: "majority", party: largestParty, seats: lead };

  // No majority — look for the most natural coalition / arrangement, among
  // partners the largest party could actually govern with.
  const partners = Object.keys(seats)
    .filter((p) => p !== largestParty && !abstainingParties.includes(p) && compatible(largestParty, p))
    .sort((a, b) => (seats[b] ?? 0) - (seats[a] ?? 0));

  // A two-party coalition that clears the bar (lead + the largest willing partner).
  for (const partner of partners) {
    if (lead + (seats[partner] ?? 0) >= threshold) {
      // A small partner = confidence-and-supply; a large one = formal coalition.
      if ((seats[partner] ?? 0) < lead * 0.2) {
        return { kind: "confidence_supply", lead: largestParty, partner, seats: lead + (seats[partner] ?? 0) };
      }
      return { kind: "coalition", parties: [largestParty, partner], seats: lead + (seats[partner] ?? 0) };
    }
  }

  // Largest party short even with a partner — a minority government attempt, or
  // a genuinely hung parliament if it's nowhere close.
  if (lead >= threshold * 0.85) return { kind: "minority", party: largestParty, seats: lead };
  return { kind: "hung", largest: largestParty };
}
