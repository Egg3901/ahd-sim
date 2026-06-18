import type { PartyId } from "@engine/system";

// Lightweight UK campaign events. Each week one may fire: it picks a target party
// by role (the player, the leader, a surging challenger, or anyone) and applies a
// national appeal / momentum nudge, logged as a cause so it shows in the
// post-mortem and the news line. Authored as DATA; the engine applies them.

export type EventRole = "any" | "player" | "leader" | "challenger";

export interface UkEvent {
  id: string;
  // {party} is substituted with the target party's short name.
  headline: string;
  role: EventRole;
  weight: number;
  // National appeal delta (logit) for the target party, and momentum delta.
  appeal?: number;
  momentum?: number;
}

export const UK_EVENTS: UkEvent[] = [
  { id: "manifesto_hit", headline: "{party}'s manifesto launch lands well with voters", role: "any", weight: 3, appeal: 0.035, momentum: 8 },
  { id: "manifesto_miss", headline: "{party} manifesto unravels under scrutiny", role: "leader", weight: 2, appeal: -0.04, momentum: -10 },
  { id: "debate_win", headline: "{party} leader judged the winner of the TV debate", role: "any", weight: 3, appeal: 0.03, momentum: 12 },
  { id: "gaffe", headline: "{party} leader's campaign-trail gaffe dominates the news", role: "any", weight: 3, appeal: -0.035, momentum: -9 },
  { id: "tabloid", headline: "A major newspaper swings behind {party}", role: "any", weight: 2, appeal: 0.03 },
  { id: "scandal", headline: "Scandal engulfs a {party} candidate", role: "leader", weight: 2, appeal: -0.03, momentum: -7 },
  { id: "surge_poll", headline: "Shock poll shows {party} surging", role: "challenger", weight: 2, appeal: 0.025, momentum: 14 },
  { id: "economy_good", headline: "Upbeat economic figures lift the governing mood for {party}", role: "leader", weight: 2, appeal: 0.025 },
  { id: "nhs_row", headline: "An NHS winter-crisis row hurts {party}", role: "leader", weight: 2, appeal: -0.03, momentum: -6 },
  { id: "rally_energy", headline: "A huge {party} rally electrifies the base", role: "player", weight: 2, appeal: 0.025, momentum: 10 },
  { id: "endorsement", headline: "A popular figure endorses {party}", role: "any", weight: 2, appeal: 0.02, momentum: 5 },
  { id: "u_turn", headline: "{party} forced into an embarrassing policy U-turn", role: "any", weight: 2, appeal: -0.025, momentum: -6 },
];

// Roughly the chance a campaign event fires in a given week.
export const UK_EVENT_CHANCE = 0.7;

export function headlineFor(ev: UkEvent, partyShort: string): string {
  return ev.headline.replace("{party}", partyShort);
}

// Pick a target party id for an event's role, given the field.
export function pickTarget(
  role: EventRole,
  player: PartyId,
  leader: PartyId,
  parties: PartyId[],
  pick: (xs: PartyId[]) => PartyId,
): PartyId {
  const majors = parties.filter((p) => ["lab", "con", "ld", "ref", "grn", "snp", "pc"].includes(p));
  switch (role) {
    case "player": return player;
    case "leader": return leader;
    case "challenger": return pick(majors.filter((p) => p !== leader)) ?? player;
    default: return pick(majors) ?? player;
  }
}
