// Placeholder rows for tables/lists that are still loading. Sized to match
// the eventual content so the layout doesn't jump when data arrives.
export function SkeletonRows({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div className="skeleton-row" key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className={`skeleton-line${c === 0 ? " narrow" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Small inline spinner + label, for one-line loading states. */
export function Spinner({ label }: { label?: string }) {
  return (
    <span role="status">
      <span className="spinner" aria-hidden="true" />
      {label ?? "Loading…"}
    </span>
  );
}
