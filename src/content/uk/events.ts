import type { PartyId } from "@engine/system";

// Lightweight UK campaign events. Each week one may fire: it picks a target party
// by role (the player, the leader, a surging challenger, or anyone) and applies a
// national appeal / momentum nudge, logged as a cause so it shows in the
// post-mortem and the news line. Authored as DATA; the engine applies them.
//
// Events with `choices` become player decisions when the resolved target is the
// human's party — the UI surfaces them via a modal (US EventModal parity).

export type EventRole = "any" | "player" | "leader" | "challenger";

export interface UkEventChoice {
  id: string;
  text: string;
  resultText: string;
  // Applied to the player's party (or inverted for contrast-style picks).
  appeal?: number;
  momentum?: number;
  // Optional hit on the strongest rival (contrast / attack options).
  rivalAppeal?: number;
}

export interface UkEvent {
  id: string;
  // {party} is substituted with the target party's short name.
  headline: string;
  role: EventRole;
  weight: number;
  // National appeal delta (logit) for the target party, and momentum delta.
  appeal?: number;
  momentum?: number;
  // Fixed target: this exact party is hit regardless of role (real history —
  // "the Ed Stone" always lands on Labour).
  party?: PartyId;
  // Scheduled story beat: fires deterministically at this turn index (0-based)
  // instead of the random draw. Only meaningful on election decks.
  turn?: number;
  // Player-facing prompt when this event becomes a decision.
  prompt?: string;
  // Branching choices — if present and the target is the player, the event
  // queues as pending instead of auto-applying.
  choices?: UkEventChoice[];
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

  // ── Player decisions (agency beats) ───────────────────────────────────────
  {
    id: "tv_debate_call",
    headline: "The networks offer {party} a head-to-head debate slot",
    role: "player",
    weight: 4,
    prompt: "The broadcasters want a head-to-head. How do you play it?",
    choices: [
      { id: "accept_attack", text: "Accept and go on the attack", resultText: "You land blows — and take a few. The overnight polls twitch your way.", appeal: 0.03, momentum: 10, rivalAppeal: -0.015 },
      { id: "accept_safe", text: "Accept and play it safe", resultText: "A steady, on-message night. No gaffes, no fireworks.", appeal: 0.015, momentum: 4 },
      { id: "decline", text: "Decline — protect the lead / avoid the ambush", resultText: "You dodge the studio lights. The press calls it cowardice; your base calls it discipline.", appeal: -0.01, momentum: -4 },
    ],
  },
  {
    id: "tabloid_splash",
    headline: "A Sunday tabloid is sitting on a story about {party}",
    role: "player",
    weight: 3,
    prompt: "A red-top has dirt. What's the play?",
    choices: [
      { id: "prebut", text: "Pre-but: get your version out first", resultText: "You blunt the splash. The story still runs — softer, and on your terms.", appeal: -0.01, momentum: -2 },
      { id: "ignore", text: "Ignore it and stay on message", resultText: "The splash dominates a news cycle. Your grid holds, barely.", appeal: -0.025, momentum: -6 },
      { id: "sue", text: "Threaten legal action and dare them", resultText: "They blink on the worst claims. You look thin-skinned to everyone else.", appeal: -0.015, momentum: -3 },
    ],
  },
  {
    id: "manifesto_fork",
    headline: "{party}'s manifesto committee is split on the big pledge",
    role: "player",
    weight: 3,
    prompt: "The draft is ready. Which way do you push the manifesto?",
    choices: [
      { id: "bold", text: "Go bold — a defining, risky pledge", resultText: "The base roars. The spreadsheets at HQ look nervous.", appeal: 0.035, momentum: 12 },
      { id: "cautious", text: "Play it cautious — Ming vase politics", resultText: "No hostages to fortune. Also no spark.", appeal: 0.01, momentum: 2 },
      { id: "contrast", text: "Make it a contrast document against the rival", resultText: "You define them more than yourself — and it lands.", appeal: 0.02, momentum: 6, rivalAppeal: -0.02 },
    ],
  },
  {
    id: "ground_surge",
    headline: "Activists beg {party} HQ for a late ground-game surge",
    role: "player",
    weight: 3,
    prompt: "Do you empty the war chest into the final ground push?",
    choices: [
      { id: "all_in", text: "All in — flood the marginals", resultText: "Doors knocked, leaflets out. The machine is humming.", appeal: 0.025, momentum: 8 },
      { id: "balanced", text: "Balanced — keep powder dry for broadcast", resultText: "A competent final week. Nothing wasted, nothing spectacular.", appeal: 0.012, momentum: 3 },
      { id: "air_war", text: "Pivot to the air war instead", resultText: "The ads blanket the regions. Field organisers grumble.", appeal: 0.018, momentum: 5 },
    ],
  },
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
