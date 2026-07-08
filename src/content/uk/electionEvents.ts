import type { UkEvent } from "./events";

// Named historical event decks per UK election — the real story beats of each
// campaign. Entries with `turn` fire deterministically that week (0-based,
// once); the rest join the weekly random draw alongside the generic pool
// (uk/events.ts), also once each. `party` pins a beat to the party history
// says it hit. Keyed by election id ("2024", "1997", …).

export const UK_ELECTION_EVENTS: Record<string, UkEvent[]> = {};
