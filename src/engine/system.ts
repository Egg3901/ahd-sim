// ─────────────────────────────────────────────────────────────────────────
// POLITICAL SYSTEM — the layer that makes the engine multi-country.
//
// A `PoliticalSystem` declares *who is competing* (the party list) and *how
// local vote shares become the awardable units that decide the contest* (the
// allocation strategy + majority rule). The U.S. (two-party, winner-take-all
// electoral votes, 270 of 538) and the U.K. (multiparty, regional seats curve,
// 326 of 650) are both instances of this one shape.
//
// P0 NOTE: these are *type-level + descriptor* additions only. Nothing here is
// wired into createGame / the vote model yet, so behaviour — and the U.S. 2020
// calibration — is unchanged. The engine still runs on the concrete dem/rep
// path; this is the seam the N-party generalization (P1) will grow into.
// ─────────────────────────────────────────────────────────────────────────

// A party slot. Today the engine's concrete ids are the U.S. "dem" | "rep"
// (see CandidateId in types.ts); UK ids will be "con" | "lab" | "ld" | … . We
// keep it a string so a system can declare its own roster without the engine
// hard-coding any country's parties.
export type PartyId = string;

// Which geographic footprint a party competes on — informational at P0, used
// later so a Scotland-only party (SNP) isn't offered seats it never contests.
export type PartyScope = "national" | "scotland" | "wales" | "northern_ireland";

export interface PartyDef {
  id: PartyId;
  name: string;
  shortName: string;
  // Map / bar colour for this party.
  color: string;
  scope?: PartyScope; // defaults to "national"
}

// How a contest's per-party vote shares become the awardable units it confers.
//  - winner_take_all_ev : the share-leading party takes the whole contest's EVs
//                         (the current U.S. behaviour, expressed as a strategy).
//  - regional_seats_curve: a region's seat pool is split across parties by the
//                         calibrated FPTP disproportionality curve (UK).
export type AllocationStrategyId = "winner_take_all_ev" | "regional_seats_curve";

export interface AllocationStrategy {
  id: AllocationStrategyId;
  label: string;
  // What one awardable unit is called, for UI/debug ("electoral vote", "seat").
  unit: string;
}

// The chamber's winning arithmetic.
export interface MajorityRule {
  // Total awardable units in the chamber (538 EV, 650 seats).
  total: number;
  // Units needed to win outright (270, 326).
  threshold: number;
  // Effective threshold once abstentions + the Speaker are netted out (UK ≈ 320,
  // because Sinn Féin do not take their seats). Absent ⇒ same as `threshold`.
  effectiveThreshold?: number;
}

export interface PoliticalSystem {
  id: string; // "US" | "UK"
  label: string;
  parties: PartyDef[];
  allocation: AllocationStrategy;
  majority: MajorityRule;
}

// Convenience: look a party up by id within a system.
export function partyById(system: PoliticalSystem, id: PartyId): PartyDef | undefined {
  return system.parties.find((p) => p.id === id);
}
