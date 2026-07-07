import type { CountryBundle } from "@engine/countryGame";
import type { PartyId } from "@engine/system";

// Bundle-scoped party display helpers (the generic analog of ui/uk/parties.ts).
export function partyColor(country: CountryBundle, id: PartyId): string {
  return country.system.parties.find((p) => p.id === id)?.color ?? "#888";
}
export function partyShort(country: CountryBundle, id: PartyId): string {
  return country.system.parties.find((p) => p.id === id)?.shortName ?? id.toUpperCase();
}
export function partyName(country: CountryBundle, id: PartyId): string {
  return country.system.parties.find((p) => p.id === id)?.name ?? id;
}

export function byDisplayOrder(country: CountryBundle, a: PartyId, b: PartyId): number {
  const order = country.system.parties.map((p) => p.id);
  const ia = order.indexOf(a), ib = order.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
}

export function sortBySeats(country: CountryBundle, seats: Record<PartyId, number>): PartyId[] {
  return Object.keys(seats)
    .filter((p) => (seats[p] ?? 0) > 0)
    .sort((a, b) => (seats[b] - seats[a]) || byDisplayOrder(country, a, b));
}
