export function money(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function pct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
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
  "Final Week — Oct 27",
];

export function turnLabel(turn: number, total: number): string {
  if (turn >= total) return "Election Day";
  return WEEK_LABELS[turn] ?? `Week ${turn + 1}`;
}
