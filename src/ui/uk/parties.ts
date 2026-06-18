import { PARTY_BY_ID } from "@content/uk/parties";
import type { PartyId } from "@engine/system";

export function partyColor(id: PartyId): string {
  return PARTY_BY_ID[id]?.color ?? "#888";
}
export function partyShort(id: PartyId): string {
  return PARTY_BY_ID[id]?.shortName ?? id.toUpperCase();
}
export function partyName(id: PartyId): string {
  return PARTY_BY_ID[id]?.name ?? id;
}

// Display order for tallies/legends.
const ORDER = ["lab", "con", "ld", "ref", "grn", "snp", "pc", "dup", "sf", "uup", "sdlp", "apni", "oth"];
export function byDisplayOrder(a: PartyId, b: PartyId): number {
  const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
}

// Sort party ids by seats descending, then display order.
export function sortBySeats(seats: Record<PartyId, number>): PartyId[] {
  return Object.keys(seats)
    .filter((p) => (seats[p] ?? 0) > 0)
    .sort((a, b) => (seats[b] - seats[a]) || byDisplayOrder(a, b));
}
