export function money(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function pct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

// The model electorate is an abstract scaled-down sample (~100K "votes"
// nationwide). For the broadcast verdict we scale it up to a believable
// national two-party turnout (~155M) and comma-group it so it reads like a
// real election-night chyron rather than "$52K".
const NATIONAL_VOTE_SCALE = 1550;
export function votes(modelVotes: number): string {
  return Math.round(modelVotes * NATIONAL_VOTE_SCALE).toLocaleString("en-US");
}

export function signed(n: number, digits = 2): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}`;
}

// Weekly date labels for the 9-turn Sept→Nov calendar.
const WEEK_LABELS = [
  "Week of Sept 1",
  "Week of Sept 8",
  "Week of Sept 15",
  "Week of Sept 22",
  "Week of Sept 29",
  "Week of Oct 6",
  "Week of Oct 13",
  "Week of Oct 20",
  "Final Week: Oct 27",
];

export function turnLabel(turn: number, total: number): string {
  if (turn >= total) return "Election Day";
  return WEEK_LABELS[turn] ?? `Week ${turn + 1}`;
}
