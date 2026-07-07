import { useMemo, useState } from "react";
import { useCountryStore } from "@store/countryStore";
import { useAuthStore } from "@store/authStore";
import { api } from "@lib/api";
import { computeScoreFromFacts, multipartyScoreFacts } from "@engine/scoring";
import type { Government } from "@engine/types";
import { CountrySeatBar } from "./CountryPanels";
import { partyColor, partyName, partyShort, sortBySeats } from "./helpers";
import { Trophy } from "lucide-react";

function defaultGovText(g: Government, name: (p: string) => string): string {
  switch (g.kind) {
    case "majority": return `${name(g.party)} wins a majority — ${g.seats} seats.`;
    case "minority": return `${name(g.party)} forms a minority government on ${g.seats} seats.`;
    case "coalition": return `A ${g.parties.map(name).join(" – ")} coalition reaches ${g.seats} seats.`;
    case "confidence_supply": return `${name(g.lead)} governs with ${name(g.partner)} confidence-and-supply (${g.seats}).`;
    case "hung": return `No workable majority. ${name(g.largest)} is the largest party.`;
  }
}

export function CountryResults({ onExit }: { onExit: () => void }) {
  const country = useCountryStore((s) => s.country)!;
  const game = useCountryStore((s) => s.game)!;
  const reset = useCountryStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);
  const openModal = useAuthStore((s) => s.openModal);
  const r = game.result!;

  const scenarioId = `${country.id.toLowerCase()}-${game.electionId}`;
  const majority = country.system.majority;

  const facts = useMemo(
    () => multipartyScoreFacts(r, game.playerParty, majority.threshold, majority.total, "normal"),
    [r, game.playerParty, majority],
  );
  const score = computeScoreFromFacts(facts);

  const [postState, setPostState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [postNote, setPostNote] = useState("");

  const postScore = async () => {
    setPostState("busy");
    try {
      const out = await api.postScore({
        scenarioId,
        difficulty: "normal",
        score,
        facts,
        evMargin: Math.round(facts.unitMargin),
        popularVoteMargin: facts.popularMargin,
        turnsPlayed: game.turn,
      });
      setPostState("done");
      setPostNote(out.posted ? `Posted — rank #${out.rank}.` : `Kept your personal best (${out.personalBest}). Rank #${out.rank}.`);
    } catch (e) {
      setPostState("error");
      setPostNote(e instanceof Error ? e.message : "Could not reach the server");
    }
  };

  const order = sortBySeats(country, r.seats);
  const playerSeats = r.seats[game.playerParty] ?? 0;
  const won = r.government.kind === "majority" && r.government.party === game.playerParty;
  const inGov = ("party" in r.government && r.government.party === game.playerParty) ||
    ("lead" in r.government && r.government.lead === game.playerParty) ||
    (r.government.kind === "coalition" && r.government.parties.includes(game.playerParty));

  const name = (p: string) => partyName(country, p);
  const govText = country.governmentText?.(r.government, name) ?? defaultGovText(r.government, name);

  return (
    <div className="card" style={{ maxWidth: 780, margin: "24px auto" }}>
      <div className={`win270 ${won ? "dem" : ""}`} style={{ textAlign: "center" }}>
        {won ? `🎉 You won ${country.label}` : inGov ? "You're in government" : "You came up short"}
      </div>
      <h3 style={{ marginTop: 4 }}>{game.label} — Result</h3>
      <p className="muted">{govText}</p>
      <p>
        You led <strong style={{ color: partyColor(country, game.playerParty) }}>{partyName(country, game.playerParty)}</strong> to{" "}
        <strong>{playerSeats}</strong> {country.unitNamePlural}.
      </p>

      <div style={{ margin: "16px 0" }}><CountrySeatBar country={country} result={r} /></div>

      {/* Campaign score + leaderboard */}
      <div className="card" style={{ background: "var(--navy-600)", margin: "0 0 14px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="tag muted small" style={{ color: "var(--gold)" }}><Trophy size={12} style={{ verticalAlign: "-2px" }} /> CAMPAIGN SCORE</div>
            <div style={{ fontSize: 34, fontWeight: 800 }}>{score}<span className="muted" style={{ fontSize: 15, fontWeight: 600 }}> / 1000</span></div>
            <div className="muted small">
              {country.unitName} margin {facts.unitMargin >= 0 ? "+" : ""}{Math.round(facts.unitMargin)} · popular {facts.popularMargin >= 0 ? "+" : ""}{facts.popularMargin.toFixed(1)} pts · normal
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {user ? (
              <button className="primary" disabled={postState === "busy" || postState === "done"} onClick={postScore}>
                {postState === "done" ? "Posted ✓" : postState === "busy" ? "Posting…" : "Post to Leaderboard"}
              </button>
            ) : (
              <button className="primary" onClick={() => openModal("login")}>Log in to post</button>
            )}
            {postNote && <div className="muted small" style={{ marginTop: 6 }}>{postNote}</div>}
          </div>
        </div>
      </div>

      <h3>Final standings</h3>
      {order.map((p) => (
        <div className="bloc" key={p}>
          <span className="name" style={{ color: p === game.playerParty ? partyColor(country, p) : undefined }}>
            <span style={{ display: "inline-block", width: 10, height: 10, background: partyColor(country, p), borderRadius: 2, marginRight: 6 }} />
            {partyShort(country, p)}
          </span>
          <span className="meta">{r.seats[p]} {country.unitNamePlural} · {((r.voteShare[p] ?? 0) * 100).toFixed(1)}%</span>
          <div className="suppbar"><div style={{ width: `${(r.seats[p] / majority.total) * 100 * 1.6}%`, background: partyColor(country, p) }} /></div>
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

      <div className="row" style={{ gap: 8, marginTop: 18 }}>
        <button className="primary" style={{ flex: 1 }} onClick={reset}>New campaign</button>
        <button className="ghost" onClick={() => { reset(); onExit(); }}>All scenarios</button>
      </div>
    </div>
  );
}
