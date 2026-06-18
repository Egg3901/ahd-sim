import type { PoliticalSystem } from "@engine/system";

// The United States, expressed as a PoliticalSystem descriptor. This documents
// the system the engine *already* implements — two parties, winner-take-all
// electoral votes, 270 of 538 — so the UK can be added as a sibling without the
// engine hard-coding either country. At P0 this descriptor is not yet consumed
// by createGame; it's the target the N-party generalization (P1) will read from.

const DEM_BLUE = "#2563eb";
const GOP_RED = "#dc2626";

export const US_SYSTEM: PoliticalSystem = {
  id: "US",
  label: "United States",
  parties: [
    { id: "dem", name: "Democratic Party", shortName: "Dem", color: DEM_BLUE, scope: "national" },
    { id: "rep", name: "Republican Party", shortName: "Rep", color: GOP_RED, scope: "national" },
  ],
  allocation: {
    id: "winner_take_all_ev",
    label: "Electoral College (winner-take-all)",
    unit: "electoral vote",
  },
  majority: {
    total: 538,
    threshold: 270,
  },
};
