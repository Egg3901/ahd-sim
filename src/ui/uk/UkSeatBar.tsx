import type { UkResult } from "@engine/ukGame";
import { partyColor, partyShort, sortBySeats } from "./parties";

// Seat tally bar styled like the U.S. EvBar: largest party on the left, a
// stacked track sized to this election's chamber, and the majority marker.
export function UkSeatBar({
  result,
  total = 650,
  threshold = 326,
}: {
  result: UkResult;
  total?: number;
  threshold?: number;
}) {
  const order = sortBySeats(result.seats);
  const w = (n: number) => `${(n / total) * 100}%`;
  const largest = order[0];

  return (
    <div className="evbar" title={`Seats won: ${threshold} for a majority`}>
      <div className="endlabel dem" style={{ color: largest ? partyColor(largest) : undefined }}>
        {largest ? result.seats[largest] : 0}
      </div>
      <div className="track" style={{ position: "relative" }}>
        {order.map((p) => (
          <div key={p} className="seg" style={{ width: w(result.seats[p]), background: partyColor(p), color: "#0c0d10" }}>
            {result.seats[p] >= 40 ? partyShort(p) : ""}
          </div>
        ))}
        <div style={{ position: "absolute", left: `${(threshold / total) * 100}%`, top: -3, bottom: -3, width: 2, background: "#fff", opacity: 0.9 }} />
      </div>
      <div className="endlabel gop">{threshold}</div>
    </div>
  );
}
