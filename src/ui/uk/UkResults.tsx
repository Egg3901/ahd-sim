import { useUkStore } from "@store/ukStore";
import type { Government } from "@engine/types";
import { UkSeatBar } from "./UkSeatBar";
import { partyName, partyShort, sortBySeats, partyColor } from "./parties";

function govText(g: Government): string {
  switch (g.kind) {
    case "majority": return `${partyName(g.party)} wins a majority — ${g.seats} seats.`;
    case "minority": return `${partyName(g.party)} forms a minority government on ${g.seats} seats — no overall control.`;
    case "coalition": return `Hung parliament. A ${g.parties.map(partyName).join(" – ")} coalition reaches ${g.seats} seats.`;
    case "confidence_supply": return `Hung parliament. ${partyName(g.lead)} governs with ${partyName(g.partner)} confidence-and-supply (${g.seats}).`;
    case "hung": return `Hung parliament — no workable majority. ${partyName(g.largest)} is the largest party.`;
  }
}

export function UkResults() {
  const game = useUkStore((s) => s.game)!;
  const reset = useUkStore((s) => s.reset);
  const r = game.result!;
  const order = sortBySeats(r.seats);
  const playerSeats = r.seats[game.playerParty] ?? 0;
  const won = r.government.kind === "majority" && r.government.party === game.playerParty;
  const inGov = ("party" in r.government && r.government.party === game.playerParty) ||
    ("lead" in r.government && r.government.lead === game.playerParty) ||
    (r.government.kind === "coalition" && r.government.parties.includes(game.playerParty));

  return (
    <div className="card" style={{ maxWidth: 780, margin: "24px auto" }}>
      <div className={`win270 ${won ? "dem" : ""}`} style={{ textAlign: "center" }}>
        {won ? "🎉 You won a majority" : inGov ? "You're in government" : "You're in opposition"}
      </div>
      <h3 style={{ marginTop: 4 }}>{game.label} — Result</h3>
      <p className="muted">{govText(r.government)}</p>
      <p>You led <strong style={{ color: partyColor(game.playerParty) }}>{partyName(game.playerParty)}</strong> to <strong>{playerSeats}</strong> seats.</p>

      <div style={{ margin: "16px 0" }}><UkSeatBar result={r} /></div>

      <h3>Final standings</h3>
      {order.map((p) => (
        <div className="bloc" key={p}>
          <span className="name" style={{ color: p === game.playerParty ? partyColor(p) : undefined }}>
            <span style={{ display: "inline-block", width: 10, height: 10, background: partyColor(p), borderRadius: 2, marginRight: 6 }} />
            {partyShort(p)}
          </span>
          <span className="meta">{r.seats[p]} seats · {((r.voteShare[p] ?? 0) * 100).toFixed(1)}%</span>
          <div className="suppbar"><div style={{ width: `${(r.seats[p] / 650) * 100 * 1.6}%`, background: partyColor(p) }} /></div>
        </div>
      ))}

      {r.postMortem.length > 0 && (
        <>
          <h3 style={{ marginTop: 16 }}>Biggest swings you caused</h3>
          {r.postMortem.map((c, i) => (
            <div className="kv" key={i}>
              <span className="k">{c.cause}</span>
              <span className={c.marginDelta >= 0 ? "chip up" : "chip down"}>{c.marginDelta > 0 ? "+" : ""}{(c.marginDelta * 100).toFixed(1)}</span>
            </div>
          ))}
        </>
      )}

      <button className="primary" style={{ marginTop: 18, width: "100%" }} onClick={reset}>New campaign</button>
    </div>
  );
}
