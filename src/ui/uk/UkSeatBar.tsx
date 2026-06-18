import type { UkResult } from "@engine/ukGame";
import { partyColor, partyShort, sortBySeats } from "./parties";

// Seat tally bar styled like the U.S. EvBar: the largest party's count at the
// left, a stacked 650-wide track in seat order, and the 326 majority marker.
export function UkSeatBar({ result }: { result: UkResult }) {
  const order = sortBySeats(result.seats);
  const total = 650;
  const w = (n: number) => `${(n / total) * 100}%`;
  const largest = order[0];

  return (
    <div className="evbar" title="Seats won — 326 for a majority">
      <div className="endlabel dem" style={{ color: largest ? partyColor(largest) : undefined }}>
        {largest ? result.seats[largest] : 0}
      </div>
      <div className="track" style={{ position: "relative" }}>
        {order.map((p) => (
          <div key={p} className="seg" style={{ width: w(result.seats[p]), background: partyColor(p), color: "#0c0d10" }}>
            {result.seats[p] >= 40 ? partyShort(p) : ""}
          </div>
        ))}
        <div style={{ position: "absolute", left: `${(326 / total) * 100}%`, top: -3, bottom: -3, width: 2, background: "#fff", opacity: 0.9 }} />
      </div>
      <div className="endlabel gop">326</div>
    </div>
  );
}
