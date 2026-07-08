// ─────────────────────────────────────────────────────────────────────────
// BALANCE GAUNTLET REPORT — runs the FULL scenario × side × difficulty × bot
// matrix and writes docs/balance/report-<date>.md (plus a stdout summary).
//
//   npx tsx scripts/balance-report.ts            # full matrix, 20 seeds/cell
//   GAUNTLET_SEEDS=10 npx tsx scripts/balance-report.ts
//
// The report is the design record behind the registry's difficulty labels:
// it flags threshold breaches and lists label mismatches (measured focused-
// bot underdog win rate vs the authored easy/medium/hard label).
// ─────────────────────────────────────────────────────────────────────────

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  runGauntlet,
  scenarioBaseline,
  suggestedLabel,
  easiestDifficultyFor,
  hardestDifficultyFor,
  defaultDifficultyFor,
  GAUNTLET_THRESHOLDS,
  type GauntletRow,
} from "@engine/balance/harness";
import { SCENARIO_REGISTRY } from "@content/scenarioRegistry";

const SEEDS = Number(process.env.GAUNTLET_SEEDS ?? 20);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
const num = (x: number) => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(1));

console.log(`Balance gauntlet: full matrix, ${SEEDS} seeds/cell…`);
const t0 = Date.now();
let lastTick = 0;
const rows = runGauntlet({
  seedsPerCell: SEEDS,
  onProgress: (done, total) => {
    const tick = Math.floor((done / total) * 20);
    if (tick > lastTick) {
      lastTick = tick;
      process.stdout.write(`  ${pct(done / total)} (${done}/${total} games, ${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
    }
  },
});
const elapsed = (Date.now() - t0) / 1000;
const totalGames = rows.reduce((s, r) => s + r.seeds, 0);
console.log(`Done: ${rows.length} rows / ${totalGames} games in ${elapsed.toFixed(0)}s.\n`);

// ── Flags: threshold breaches ──────────────────────────────────────────────
interface Flag {
  scenarioId: string;
  kind: string;
  detail: string;
}
const flags: Flag[] = [];
const baselines = new Map(SCENARIO_REGISTRY.map((m) => [m.scenarioId, scenarioBaseline(m)]));

for (const meta of SCENARIO_REGISTRY) {
  const b = baselines.get(meta.scenarioId)!;
  const mine = rows.filter((r) => r.scenarioId === meta.scenarioId);
  const easiest = easiestDifficultyFor(meta.engine);
  const hardest = hardestDifficultyFor(meta.engine);
  const dflt = defaultDifficultyFor(meta.engine);

  const floor = mine.find((r) => r.side === b.underdog && r.bot === "focused" && r.difficulty === easiest);
  if (floor && floor.winRate < GAUNTLET_THRESHOLDS.winnabilityFloor) {
    flags.push({
      scenarioId: meta.scenarioId,
      kind: "winnability-floor",
      detail: `focused underdog (${b.underdog}) on ${easiest}: winRate ${pct(floor.winRate)} < ${pct(GAUNTLET_THRESHOLDS.winnabilityFloor)}`,
    });
  }
  const push = mine.find((r) => r.side === b.winner && r.bot === "focused" && r.difficulty === hardest);
  if (push && push.winRate < GAUNTLET_THRESHOLDS.noPushoverFloor) {
    flags.push({
      scenarioId: meta.scenarioId,
      kind: "no-pushover",
      detail: `focused winner (${b.winner}) on ${hardest}: winRate ${pct(push.winRate)} < ${pct(GAUNTLET_THRESHOLDS.noPushoverFloor)}`,
    });
  }
  // Calibration under noise: passive play on the UNDERDOG side (so the engine
  // AI holds the historical winner) should reproduce history. Winner-side
  // passive rows are excluded by design: a competent AI beating a do-nothing
  // player is fun-correct, not a calibration drift.
  const fidelity = mine.find((r) => r.side === b.underdog && r.bot === "passive" && r.difficulty === dflt);
  if (fidelity && fidelity.historyMatchRate < GAUNTLET_THRESHOLDS.passiveFidelity) {
    flags.push({
      scenarioId: meta.scenarioId,
      kind: "passive-fidelity",
      detail: `passive underdog (${b.underdog}) on ${dflt}: history match ${pct(fidelity.historyMatchRate)} < ${pct(GAUNTLET_THRESHOLDS.passiveFidelity)}`,
    });
  }
}

// ── Label suggestions vs the registry ──────────────────────────────────────
interface LabelRow {
  scenarioId: string;
  authored: string;
  suggested: string;
  underdog: string;
  winRate: number;
  mismatch: boolean;
}
const labels: LabelRow[] = SCENARIO_REGISTRY.map((meta) => {
  const b = baselines.get(meta.scenarioId)!;
  const dflt = defaultDifficultyFor(meta.engine);
  const row = rows.find(
    (r) => r.scenarioId === meta.scenarioId && r.side === b.underdog && r.bot === "focused" && r.difficulty === dflt,
  );
  const winRate = row?.winRate ?? 0;
  const suggested = suggestedLabel(winRate);
  return {
    scenarioId: meta.scenarioId,
    authored: meta.difficulty,
    suggested,
    underdog: b.underdog,
    winRate,
    mismatch: suggested !== meta.difficulty,
  };
});
const mismatches = labels.filter((l) => l.mismatch);

// ── Markdown report ────────────────────────────────────────────────────────
const date = new Date().toISOString().slice(0, 10);
const lines: string[] = [];
lines.push(`# Balance gauntlet report — ${date}`);
lines.push("");
lines.push(
  `Full matrix: ${rows.length} cells / ${totalGames} games, ${SEEDS} seeds per cell, ${elapsed.toFixed(0)}s runtime. ` +
    `Seeds are \`\${scenarioId}-\${side}-\${bot}-\${i}\` — reruns are identical.`,
);
lines.push("");
lines.push(
  `Thresholds: winnability floor ${pct(GAUNTLET_THRESHOLDS.winnabilityFloor)} (focused underdog, easiest setting), ` +
    `no-pushover ${pct(GAUNTLET_THRESHOLDS.noPushoverFloor)} (focused winner, hardest setting), ` +
    `passive fidelity ${pct(GAUNTLET_THRESHOLDS.passiveFidelity)} (passive underdog, default setting). ` +
    `Suggested labels from focused-underdog win rate on the default setting: ` +
    `easy ≥ ${pct(GAUNTLET_THRESHOLDS.labelEasyMin)}, medium ≥ ${pct(GAUNTLET_THRESHOLDS.labelMediumMin)}, else hard.`,
);

for (const engine of ["us", "uk", "country"] as const) {
  const engineRows = rows.filter((r) => r.engine === engine);
  if (engineRows.length === 0) continue;
  lines.push("");
  lines.push(`## Engine: ${engine}`);
  lines.push("");
  const demEvCol = engine === "us" ? " avg dem EV |" : "";
  lines.push(`| scenario | side | role | difficulty | bot | winRate | avgMargin | blowout% | avgScore | histMatch |${demEvCol}`);
  lines.push(`|---|---|---|---|---|---|---|---|---|---|${engine === "us" ? "---|" : ""}`);
  for (const r of engineRows) {
    const demEv = engine === "us" ? ` ${num(r.avgDemEV ?? 0)} |` : "";
    lines.push(
      `| ${r.scenarioId} | ${r.side} | ${r.sideRole} | ${r.difficulty} | ${r.bot} | ${pct(r.winRate)} | ${num(r.avgUnitMargin)} | ${pct(r.blowoutRate)} | ${num(r.avgScore)} | ${pct(r.historyMatchRate)} |${demEv}`,
    );
  }
}

lines.push("");
lines.push("## Flags (threshold breaches)");
lines.push("");
if (flags.length === 0) {
  lines.push("None — every scenario clears the winnability floor, the no-pushover bar, and passive fidelity.");
} else {
  for (const f of flags) lines.push(`- **${f.scenarioId}** [${f.kind}]: ${f.detail}`);
}

lines.push("");
lines.push("## Difficulty labels: measured vs registry");
lines.push("");
lines.push(
  "Caveat: the suggested label is a pure underdog-challenge rating (focused bot playing the " +
    "baseline loser). Several authored labels instead rate the marquee side's experience " +
    "(us-2008 'easy' = playing Obama; uk-1997 'easy' = playing Blair), so a mismatch here can " +
    "mean either a mislabeled scenario or a labeling-convention difference — decide per row " +
    "before the paywall flip.",
);
lines.push("");
lines.push("| scenario | authored | suggested | underdog focused winRate (default setting) | match |");
lines.push("|---|---|---|---|---|");
for (const l of labels) {
  lines.push(`| ${l.scenarioId} | ${l.authored} | ${l.suggested} | ${l.underdog}: ${pct(l.winRate)} | ${l.mismatch ? "MISMATCH" : "ok"} |`);
}
lines.push("");
lines.push(
  mismatches.length === 0
    ? "All registry labels match the measured difficulty."
    : `${mismatches.length} label mismatch(es): ${mismatches.map((l) => `${l.scenarioId} (${l.authored}→${l.suggested})`).join(", ")}.`,
);
lines.push("");

const outDir = join(root, "docs", "balance");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `report-${date}.md`);
writeFileSync(outPath, lines.join("\n"));

// ── stdout summary ─────────────────────────────────────────────────────────
console.log(`Report written to ${outPath}\n`);
console.log(`Flags (${flags.length}):`);
if (flags.length === 0) console.log("  none");
for (const f of flags) console.log(`  - ${f.scenarioId} [${f.kind}]: ${f.detail}`);
console.log(`\nLabel mismatches (${mismatches.length}):`);
if (mismatches.length === 0) console.log("  none");
for (const l of mismatches) {
  console.log(`  - ${l.scenarioId}: authored ${l.authored} → suggested ${l.suggested} (underdog ${l.underdog} focused winRate ${pct(l.winRate)})`);
}
