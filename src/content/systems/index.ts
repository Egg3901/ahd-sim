import type { PoliticalSystem } from "@engine/system";
import { US_SYSTEM } from "./us";

// Registry of playable political systems. The UK system will join here in P2/P3.
// A scenario references a system by id; createGame will (from P1) read the
// active system's party roster + allocation strategy instead of hard-coding
// dem/rep + electoral votes.
export const SYSTEMS: Record<string, PoliticalSystem> = {
  US: US_SYSTEM,
};

export const DEFAULT_SYSTEM_ID = "US";

export function getSystem(id?: string): PoliticalSystem {
  return (id && SYSTEMS[id]) || SYSTEMS[DEFAULT_SYSTEM_ID];
}
