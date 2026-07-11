import { nationalMpPoll } from "@engine/multipartyPolls";
import type { PartyId } from "@engine/system";
import type { StateContest } from "@engine/types";

/** Noisy national vote-share poll row for multiparty intel panels. */
export function MpPollBlock({
  seed,
  turn,
  regions,
  parties,
  playerParty,
  partyLabel,
  partyColor,
}: {
  seed: number;
  turn: number;
  regions: StateContest[];
  parties: PartyId[];
  playerParty: PartyId;
  partyLabel: (p: PartyId) => string;
  partyColor: (p: PartyId) => string;
}) {
  const poll = nationalMpPoll(seed, turn, regions);
  const order = [...parties].sort((a, b) => (poll[b] ?? 0) - (poll[a] ?? 0));

  return (
    <>
      <h3 style={{ marginTop: 14 }}>National poll (noisy)</h3>
      <p className="muted small" style={{ marginBottom: 8 }}>
        Blurred view of the true model: house effects and sampling noise. Not ground truth.
      </p>
      {order.slice(0, 6).map((p) => (
        <div className="bloc" key={p}>
          <span
            className="name"
            style={{
              color: p === playerParty ? partyColor(p) : undefined,
              fontWeight: p === playerParty ? 700 : 500,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 9,
                height: 9,
                borderRadius: 2,
                background: partyColor(p),
                marginRight: 6,
              }}
            />
            {partyLabel(p)}
          </span>
          <span className="meta">{((poll[p] ?? 0) * 100).toFixed(1)}%</span>
          <div className="suppbar">
            <div style={{ width: `${(poll[p] ?? 0) * 100}%`, background: partyColor(p) }} />
          </div>
        </div>
      ))}
    </>
  );
}
