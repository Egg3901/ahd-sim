// ─────────────────────────────────────────────────────────────────────────
// BRAND — the single point of truth for the game's identity. The product is
// being renamed away from "A House Divided" (that's the separate multiplayer
// polsim); until the owner picks the final name, a neutral working title
// ships here. Renaming the game = editing this file only.
// ─────────────────────────────────────────────────────────────────────────

export const BRAND = {
  name: "Electioneer",
  nameCaps: "ELECTIONEER",
  tagline: "Run the race. Rewrite history.",
  eyebrow: "RUN THE RACE",
  // Interim: the staging host. Swap both when the real domain is purchased
  // (electioneer.app recommended — never point share text at a domain we
  // don't own).
  domain: "sim.ahousedividedgame.com",
  url: "https://sim.ahousedividedgame.com",
  // Attribution line for footers/about.
  from: "From the maker of A House Divided",
} as const;
