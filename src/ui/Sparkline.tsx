// A tiny inline trend line for dense panels (e.g. a state's polling history).
// Draws the series plus a faint midline reference; the latest point is dotted.
export function Sparkline({
  values,
  color,
  mid = 0.5,
  width = 132,
  height = 34,
}: {
  values: number[];
  color: string;
  mid?: number;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;
  const lo0 = Math.min(...values, mid);
  const hi0 = Math.max(...values, mid);
  const pad = (hi0 - lo0) * 0.18 || 0.02;
  const lo = lo0 - pad;
  const hi = hi0 + pad;
  const x = (i: number) => (width * i) / (values.length - 1);
  const y = (v: number) => height * (1 - (v - lo) / (hi - lo || 1));
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const last = values[values.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="sparkline" preserveAspectRatio="none">
      <line x1={0} x2={width} y1={y(mid)} y2={y(mid)} className="spark-mid" />
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(last)} r={2.4} fill={color} />
    </svg>
  );
}
