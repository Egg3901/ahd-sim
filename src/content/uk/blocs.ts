// UK demographic blocs. Like the U.S. set, a deliberately overlapping partition
// chosen for narrative utility: the storylines that decide modern UK elections
// (the youth/graduate Labour coalition, the pensioner Tory vote, the Red Wall
// non-graduate worker, the Remain-leaning city, the renter generation) each get
// a scoreable bucket. `share` is the national fraction of the electorate; tilts
// are small per-party logit nudges layered on a region's baseline appeal so
// blocs vote a little differently (the engine re-solves the region to stay
// calibrated). Parties not listed in a tilt default to 0.

export type UkBlocId =
  | "young"        // 18–29
  | "graduate"     // degree-holders
  | "workingclass" // non-graduate C2DE
  | "homeowner"    // older owner-occupiers
  | "renter"       // private/social renters
  | "pensioner";   // 65+

export interface UkBlocDef {
  id: UkBlocId;
  name: string;
  share: number;            // national electorate fraction (need not sum to 1; normalized per region)
  turnoutPropensity: number; // 0..1
  // Small per-party appeal tilt (logit) vs the region baseline.
  tilt: Record<string, number>;
}

export const UK_BLOCS: UkBlocDef[] = [
  { id: "young", name: "Young voters (18–29)", share: 0.18, turnoutPropensity: 0.55,
    tilt: { lab: 0.35, grn: 0.45, ld: 0.1, con: -0.5, ref: -0.4 } },
  { id: "graduate", name: "Graduates", share: 0.30, turnoutPropensity: 0.74,
    tilt: { lab: 0.2, ld: 0.3, grn: 0.25, con: -0.15, ref: -0.6 } },
  { id: "workingclass", name: "Non-graduate workers (C2DE)", share: 0.34, turnoutPropensity: 0.6,
    tilt: { ref: 0.55, con: 0.1, lab: 0.1, grn: -0.3, ld: -0.25 } },
  { id: "homeowner", name: "Homeowners", share: 0.30, turnoutPropensity: 0.74,
    tilt: { con: 0.4, ref: 0.15, lab: -0.2, grn: -0.2 } },
  { id: "renter", name: "Renters", share: 0.24, turnoutPropensity: 0.58,
    tilt: { lab: 0.3, grn: 0.25, con: -0.35, ref: -0.1 } },
  { id: "pensioner", name: "Pensioners (65+)", share: 0.22, turnoutPropensity: 0.8,
    tilt: { con: 0.5, ref: 0.2, lab: -0.25, grn: -0.4, ld: 0.05 } },
];

export const UK_BLOCS_BY_ID: Record<UkBlocId, UkBlocDef> = Object.fromEntries(
  UK_BLOCS.map((b) => [b.id, b]),
) as Record<UkBlocId, UkBlocDef>;

export const UK_BLOC_IDS = UK_BLOCS.map((b) => b.id);
