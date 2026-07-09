import { signed } from "./format";

export interface RecapLine {
  label: string;
  detail: string;
  marginDelta?: number;
}

// Engine-agnostic "Week in Review" — US RecapModal and UK/country shells share this.
export function WeekRecapModal({
  title,
  subtitle,
  items,
  unitLabel = "",
  onClose,
}: {
  title: string;
  subtitle?: string;
  items: RecapLine[];
  /** Shown after the first line's delta (e.g. " seats" / " EV"). */
  unitLabel?: string;
  onClose: () => void;
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="overlay">
      <div className="modal">
        <div className="head">
          <div className="tag">Week in Review</div>
          <h2>{title}</h2>
        </div>
        <div className="body">
          <p className="muted small">{subtitle ?? "What moved the needle, and why. Every shift traces to a cause."}</p>
          {items.map((item, i) => (
            <div className="recapitem" key={i}>
              <div>
                <div>{item.label}</div>
                <div className="muted small">{item.detail}</div>
              </div>
              {item.marginDelta !== undefined && (
                <span className={`delta ${item.marginDelta > 0.001 ? "up" : item.marginDelta < -0.001 ? "down" : "flat"}`}>
                  {i === 0 && unitLabel
                    ? signed(item.marginDelta, 0) + unitLabel
                    : signed(item.marginDelta, i === 0 ? 0 : 2)}
                </span>
              )}
            </div>
          ))}
          <button className="primary" style={{ width: "100%", marginTop: 14 }} onClick={onClose}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
