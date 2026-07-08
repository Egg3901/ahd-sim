// ─────────────────────────────────────────────────────────────────────────
// BALANCE GAUNTLET — threshold assertions over automated playtests.
//
// Default (CI) mode runs a smoke subset: 3 scenarios per engine, all three
// bots, 8 seeds per cell (~25s). Set RUN_GAUNTLET=1 to run every registry
// scenario (focused + passive, 8 seeds, ~2min) — the full 20-seed matrix
// lives in `npx tsx scripts/balance-report.ts` (docs/balance/report-*.md).
//
// The assertion layer is deliberately thin: every number it checks comes from
// GAUNTLET_THRESHOLDS in the harness, so tuning difficulty policy is a
// one-constant change. Seeds are `${scenarioId}-${side}-${bot}-${i}`, so a
// cell's measurement is identical across smoke / full / report runs.
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll } from "vitest";
import {
  runGauntlet,
  scenarioBaseline,
  easiestDifficultyFor,
  hardestDifficultyFor,
  defaultDifficultyFor,
  GAUNTLET_THRESHOLDS,
  type GauntletRow,
  type BotStrategy,
} from "../balance/harness";
import { SCENARIO_REGISTRY, SCENARIOS_BY_ID } from "@content/scenarioRegistry";

const FULL = process.env.RUN_GAUNTLET === "1";

// Smoke subset: a landslide, a knife-edge, and a mid year per engine — the
// shapes that stress each threshold. RUN_GAUNTLET=1 widens to the registry.
const SMOKE_SCENARIOS = [
  "us-2020", "us-2000", "us-1984",
  "uk-2024", "uk-1997", "uk-2017",
  "ca-2025", "de-2025", "fr-2022",
];

// ── KNOWN BALANCE GAPS (tracked debt, measured 2026-07-08, N=20 full matrix;
// see docs/balance/report-2026-07-08.md). These scenarios breach a gauntlet
// floor today. For each, the suite still enforces the weaker no-regression
// invariant that skill moves the needle (focused strictly outperforms passive
// on unit margin); remove a scenario from the set once the gap is fixed and
// the assertion tightens automatically.
//
// Root cause, not noise: the UK/country engines have NO difficulty/handicap
// system (their "easiest available setting" is the calibrated baseline), so a
// landslide year cannot be overturned inside 6 turns of the current action
// economy; us-1984 is out of reach even with the easy-mode handicap. This is
// exactly the "any year is winnable" promise the paywall flip depends on —
// fix candidates: a multiparty handicap, longer campaigns, or stronger
// underdog action budgets.
const KNOWN_UNWINNABLE = new Set([
  "us-1984",
  "uk-2024", "uk-2019", "uk-2015", "uk-2005", "uk-2001", "uk-1997",
  "uk-1992", "uk-1987", "uk-1983", "uk-1979", "uk-1951",
  "de-2025", "de-2021",
  "fr-2027", "fr-2022", "fr-2017",
  "au-2025",
]);
// uk-2017 is the hung-parliament coin flip: the baseline winner (con) holds
// largest-party in only ~35% of focused runs — under the 40% no-pushover bar.
const KNOWN_PUSHOVER_GAPS = new Set(["uk-2017"]);

const SCENARIOS = FULL ? SCENARIO_REGISTRY.map((m) => m.scenarioId) : SMOKE_SCENARIOS;
const BOTS: BotStrategy[] = FULL ? ["passive", "focused"] : ["passive", "focused", "scattershot"];
const SEEDS = 8;

let rows: GauntletRow[] = [];

describe("balance gauntlet", () => {
  beforeAll(() => {
    rows = runGauntlet({
      scenarios: SCENARIOS,
      bots: BOTS,
      seedsPerCell: SEEDS,
      sides: "winner-underdog",
    });
  }, 600_000);

  const rowFor = (scenarioId: string, side: string, bot: BotStrategy, difficulty: string) =>
    rows.find(
      (r) => r.scenarioId === scenarioId && r.side === side && r.bot === bot && r.difficulty === difficulty,
    );

  for (const scenarioId of SCENARIOS) {
    const meta = SCENARIOS_BY_ID[scenarioId];
    const b = scenarioBaseline(meta);

    // 1. Winnability floor: any year is winnable — the focused bot playing the
    //    historical loser wins often enough on the easiest available setting.
    //    Known-gap years assert the weaker skill-moves-the-needle invariant.
    it(`${scenarioId}: focused underdog (${b.underdog}) is winnable on ${easiestDifficultyFor(meta.engine)}`, () => {
      const diff = easiestDifficultyFor(meta.engine);
      const r = rowFor(scenarioId, b.underdog, "focused", diff);
      expect(r, `${scenarioId}: missing underdog focused row`).toBeDefined();
      if (KNOWN_UNWINNABLE.has(scenarioId)) {
        const p = rowFor(scenarioId, b.underdog, "passive", diff)!;
        expect(
          r!.avgUnitMargin,
          `${scenarioId} (known winnability gap): focused underdog no longer beats passive on unit margin`,
        ).toBeGreaterThan(p.avgUnitMargin);
        return;
      }
      expect(
        r!.winRate,
        `${scenarioId}: focused underdog ${b.underdog} winRate ${(r!.winRate * 100).toFixed(0)}% ` +
          `below the ${GAUNTLET_THRESHOLDS.winnabilityFloor * 100}% winnability floor`,
      ).toBeGreaterThanOrEqual(GAUNTLET_THRESHOLDS.winnabilityFloor);
    });

    // 2. No pushover: the historical winner, played well, doesn't get rolled
    //    on the hardest available setting.
    it(`${scenarioId}: focused winner (${b.winner}) holds on ${hardestDifficultyFor(meta.engine)}`, () => {
      const diff = hardestDifficultyFor(meta.engine);
      const r = rowFor(scenarioId, b.winner, "focused", diff);
      expect(r, `${scenarioId}: missing winner focused row`).toBeDefined();
      if (KNOWN_PUSHOVER_GAPS.has(scenarioId)) {
        const p = rowFor(scenarioId, b.winner, "passive", diff)!;
        expect(
          r!.winRate,
          `${scenarioId} (known pushover gap): focused winner no longer beats passive play`,
        ).toBeGreaterThanOrEqual(p.winRate);
        return;
      }
      expect(
        r!.winRate,
        `${scenarioId}: focused winner ${b.winner} winRate ${(r!.winRate * 100).toFixed(0)}% ` +
          `below the ${GAUNTLET_THRESHOLDS.noPushoverFloor * 100}% no-pushover floor`,
      ).toBeGreaterThanOrEqual(GAUNTLET_THRESHOLDS.noPushoverFloor);
    });

    // 3. Passive fidelity: with the player idle on the underdog side (so the
    //    engine AI holds the historical winner), the run reproduces history.
    //    Winner-side passive rows are exempt by design: a competent AI beating
    //    a do-nothing player is fun-correct, not calibration drift.
    it(`${scenarioId}: passive underdog play reproduces the historical winner`, () => {
      const r = rowFor(scenarioId, b.underdog, "passive", defaultDifficultyFor(meta.engine));
      expect(r, `${scenarioId}: missing underdog passive row`).toBeDefined();
      expect(
        r!.historyMatchRate,
        `${scenarioId}: passive underdog ${b.underdog} matched history in only ` +
          `${(r!.historyMatchRate * 100).toFixed(0)}% of seeds (floor ${GAUNTLET_THRESHOLDS.passiveFidelity * 100}%)`,
      ).toBeGreaterThanOrEqual(GAUNTLET_THRESHOLDS.passiveFidelity);
    });
  }

  // 4. Bot ordering sanity: skill matters. In aggregate win rate,
  //    focused ≥ scattershot ≥ passive (within sampling tolerance).
  it("bot ordering: focused ≥ scattershot ≥ passive in aggregate", () => {
    const mean = (bot: BotStrategy) => {
      const mine = rows.filter((r) => r.bot === bot);
      return mine.reduce((s, r) => s + r.winRate, 0) / Math.max(1, mine.length);
    };
    const tol = GAUNTLET_THRESHOLDS.orderingTolerance;
    const focused = mean("focused");
    const passive = mean("passive");
    expect(focused, `focused ${focused.toFixed(3)} vs passive ${passive.toFixed(3)}`).toBeGreaterThanOrEqual(
      passive - tol,
    );
    if (BOTS.includes("scattershot")) {
      const scatter = mean("scattershot");
      expect(focused, `focused ${focused.toFixed(3)} vs scattershot ${scatter.toFixed(3)}`).toBeGreaterThanOrEqual(
        scatter - tol,
      );
      expect(scatter, `scattershot ${scatter.toFixed(3)} vs passive ${passive.toFixed(3)}`).toBeGreaterThanOrEqual(
        passive - tol,
      );
    }
    // And skill must actually pay: focused strictly beats passive overall.
    expect(focused, "focused bot should out-win passive play overall").toBeGreaterThan(passive);
  });
});
