// Tile-grid cartogram positions. A square tile per contest in an approximately
// geographic layout — clean, modern, data-forward, and it sidesteps fiddly SVG
// paths. ME/NE split into a separate strip since they award by district.

export interface TilePos {
  id: string;
  row: number;
  col: number;
}

// 49 whole-state tiles (50 states + DC, minus ME & NE which split).
export const GRID: TilePos[] = [
  { id: "AK", row: 0, col: 0 },
  { id: "VT", row: 0, col: 8 }, { id: "NH", row: 0, col: 9 },

  { id: "WA", row: 1, col: 0 }, { id: "ID", row: 1, col: 1 }, { id: "MT", row: 1, col: 2 },
  { id: "ND", row: 1, col: 3 }, { id: "MN", row: 1, col: 4 }, { id: "WI", row: 1, col: 5 },
  { id: "MI", row: 1, col: 7 }, { id: "NY", row: 1, col: 8 }, { id: "MA", row: 1, col: 9 },

  { id: "OR", row: 2, col: 0 }, { id: "NV", row: 2, col: 1 }, { id: "WY", row: 2, col: 2 },
  { id: "SD", row: 2, col: 3 }, { id: "IA", row: 2, col: 4 }, { id: "IL", row: 2, col: 5 },
  { id: "IN", row: 2, col: 6 }, { id: "OH", row: 2, col: 7 }, { id: "PA", row: 2, col: 8 },
  { id: "CT", row: 2, col: 9 },

  { id: "CA", row: 3, col: 0 }, { id: "UT", row: 3, col: 1 }, { id: "CO", row: 3, col: 2 },
  { id: "MO", row: 3, col: 5 }, { id: "KY", row: 3, col: 6 }, { id: "WV", row: 3, col: 7 },
  { id: "VA", row: 3, col: 8 }, { id: "NJ", row: 3, col: 9 },

  { id: "AZ", row: 4, col: 1 }, { id: "NM", row: 4, col: 2 }, { id: "KS", row: 4, col: 3 },
  { id: "AR", row: 4, col: 4 }, { id: "TN", row: 4, col: 5 }, { id: "NC", row: 4, col: 6 },
  { id: "MD", row: 4, col: 7 }, { id: "DE", row: 4, col: 8 }, { id: "RI", row: 4, col: 9 },

  { id: "HI", row: 5, col: 0 }, { id: "OK", row: 5, col: 3 }, { id: "LA", row: 5, col: 4 },
  { id: "MS", row: 5, col: 5 }, { id: "AL", row: 5, col: 6 }, { id: "SC", row: 5, col: 7 },
  { id: "DC", row: 5, col: 8 },

  { id: "TX", row: 6, col: 3 }, { id: "GA", row: 6, col: 6 }, { id: "FL", row: 6, col: 7 },
];

// District + at-large units shown in a dedicated split-state strip.
export const SPLIT_UNITS: { label: string; ids: string[] }[] = [
  { label: "Maine", ids: ["ME-1", "ME-2", "ME-AL"] },
  { label: "Nebraska", ids: ["NE-1", "NE-2", "NE-3", "NE-AL"] },
];

export const GRID_ROWS = 7;
export const GRID_COLS = 10;
