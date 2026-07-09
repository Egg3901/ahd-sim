// Rolling digit counter — animates from 0 (or a start value) up to the final
// EV / seat / vote-share figure. Pure presentation; reduced-motion snaps.
import { useEffect, useRef, useState, type CSSProperties } from "react";

function prefersReduced(): boolean {
  return (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function RollingCounter({
  value,
  duration = 1200,
  decimals = 0,
  className,
  style,
}: {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const [display, setDisplay] = useState(() => (prefersReduced() ? value : 0));
  const fromRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (prefersReduced()) {
      setDisplay(value);
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Ease-out cubic — broadcast-desk snap at the end.
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (value - from) * eased;
      setDisplay(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : String(Math.round(display));

  return (
    <span className={className} style={style} data-testid="rolling-counter">
      {formatted}
    </span>
  );
}
