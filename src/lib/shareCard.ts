// ─────────────────────────────────────────────────────────────────────────
// SHARE CARD — the Wordle-style paste-anywhere result string for the Daily
// Challenge, plus a clipboard helper. The results screens wire the button;
// this module only builds the text and copies it.
// ─────────────────────────────────────────────────────────────────────────

import { BRAND } from "../brand";

export interface ShareCardOpts {
  date: string;     // "2026-07-08"
  label: string;    // registry label, e.g. "2021 · Scholz v. Laschet"
  flag: string;     // "🇩🇪"
  role: string;     // short role name, e.g. "SPD"
  won: boolean;
  unitLine: string; // "371 seats" / "312 EVs" — the headline result
  score: number;
}

/**
 * Compact multi-line share string, e.g.:
 *   Electioneer Daily · 2026-07-08
 *   🇩🇪 2021 · Scholz v. Laschet — as SPD
 *   🏆 371 seats · Score 8,420
 *   electioneer.game
 */
export function buildShareText(o: ShareCardOpts): string {
  return [
    `${BRAND.name} Daily · ${o.date}`,
    `${o.flag} ${o.label} — as ${o.role}`,
    `${o.won ? "🏆" : "🗳️"} ${o.unitLine} · Score ${o.score.toLocaleString("en-US")}`,
    BRAND.domain,
  ].join("\n");
}

/** Copy to clipboard; falls back to execCommand for older/HTTP contexts. */
export async function copyShare(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to the legacy path */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
