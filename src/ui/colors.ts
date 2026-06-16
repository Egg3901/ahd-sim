// Map a two-party Biden share to a red↔blue lean color. Tossups (near 0.5) read
// as muted purple; safe states saturate toward team colors.
export function shareToColor(bidenShare: number): string {
  const margin = (bidenShare - 0.5) * 2; // -1..+1 (Biden positive)
  const m = Math.max(-1, Math.min(1, margin));
  // Strength of saturation grows with |margin|; tossups stay pale.
  const strength = Math.min(1, Math.abs(m) / 0.18); // saturates ~9pt margin
  if (m >= 0) {
    // toward blue
    const t = strength;
    return mix([226, 232, 240], [37, 99, 235], t);
  }
  const t = strength;
  return mix([226, 232, 240], [220, 38, 38], t);
}

function mix(a: number[], b: number[], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

export function leanLabel(bidenShare: number): string {
  const pts = (bidenShare - 0.5) * 200;
  const a = Math.abs(pts);
  const who = pts >= 0 ? "D" : "R";
  if (a < 1) return "Tossup";
  if (a < 3) return `Tilt ${who} +${a.toFixed(1)}`;
  if (a < 6) return `Lean ${who} +${a.toFixed(1)}`;
  if (a < 12) return `Likely ${who} +${a.toFixed(0)}`;
  return `Safe ${who} +${a.toFixed(0)}`;
}
