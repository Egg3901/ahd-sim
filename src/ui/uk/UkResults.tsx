import { useMemo, useState } from "react";
import { useUkStore } from "@store/ukStore";
import { useAuthStore } from "@store/authStore";
import { api } from "@lib/api";
import { computeScoreFromFacts, multipartyScoreFacts } from "@engine/scoring";
import { majorityForUk, playablePartiesIn } from "@engine/ukGame";
import type { Government } from "@engine/types";
import { UK_ELECTIONS } from "@content/uk/elections";
import { UK_NEXT_SCENARIO } from "@content/nextScenario";
import { UkSeatBar } from "./UkSeatBar";
import { partyName, partyShort, sortBySeats, partyColor } from "./parties";
import { ElectionNight, hasSeenReveal, revealSupported } from "../electionNight/ElectionNight";
import { ukReveal } from "../electionNight/adapters";
import { DailyResultPanel } from "../DailyResultPanel";
import { NextCampaignCard } from "../NextCampaignCard";

function govText(g: Government): string {
  switch (g.kind) {
    case "majority": return `${partyName(g.party)} wins a majority — ${g.seats} seats.`;
    case "minority": return `${partyName(g.party)} forms a minority government on ${g.seats} seats — no overall control.`;
    case "coalition": return `Hung parliament. A ${g.parties.map(partyName).join(" – ")} coalition reaches ${g.seats} seats.`;
    case "confidence_supply": return `Hung parliament. ${partyName(g.lead)} governs with ${partyName(g.partner)} confidence-and-supply (${g.seats}).`;
    case "hung": return `Hung parliament — no workable majority. ${partyName(g.largest)} is the largest party.`;
  }
}

function UkNextScenario() {
  const game = useUkStore((s) => s.game)!;
  const newGame = useUkStore((s) => s.newGame);
  const canPlay = useAuthStore((s) => s.canPlay);
  const openModal = useAuthStore((s) => s.openModal);
  const user = useAuthStore((s) => s.user);

  const next = UK_NEXT_SCENARIO[game.electionId];
  if (!next) return null;
  const data = UK_ELECTIONS[next.id];
  if (!data) return null;
  const unlocked = canPlay(`uk-${next.id}`);
  const playable = playablePartiesIn(next.id);
  const party = playable.includes(game.playerParty) ? game.playerParty : playable[0];

  return (
    <NextCampaignCard
      title={data.label}
      blurb={next.blurb}
      unlocked={unlocked}
      ctaLabel={`Play ${data.year} →`}
      lockLabel={`🔒 Unlock ${data.year}`}
      onPlay={() => newGame(next.id, party, String(Date.now()), game.difficulty)}
      onUnlock={() => openModal(user ? "activate" : "login", `uk-${next.id}`)}
    />
  );
}

export function UkResults() {
  const game = useUkStore((s) => s.game)!;
  const reset = useUkStore((s) => s.reset);
  const r = game.result!;
  const order = sortBySeats(r.seats);
  const maj = majorityForUk(game);
  const playerSeats = r.seats[game.playerParty] ?? 0;
  const won = r.government.kind === "majority" && r.government.party === game.playerParty;
  const inGov = ("party" in r.government && r.government.party === game.playerParty) ||
    ("lead" in r.government && r.government.lead === game.playerParty) ||
    (r.government.kind === "coalition" && r.government.parties.includes(game.playerParty));

  // ── Campaign score + leaderboard post ──
  const user = useAuthStore((s) => s.user);
  const openModal = useAuthStore((s) => s.openModal);
  const scenarioId = `uk-${game.electionId}`;
  const difficulty = game.difficulty ?? "normal";
  const facts = useMemo(
    () => multipartyScoreFacts(r, game.playerParty, maj.threshold, maj.total, difficulty),
    [r, game.playerParty, maj, difficulty],
  );
  const score = computeScoreFromFacts(facts);
  const [postState, setPostState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [postNote, setPostNote] = useState("");
  const post = async () => {
    setPostState("busy");
    try {
      const out = await api.postScore({
        scenarioId, difficulty, score, facts,
        evMargin: Math.round(facts.unitMargin), popularVoteMargin: facts.popularMargin, turnsPlayed: game.turn,
      });
      setPostState("done");
      setPostNote(out.posted ? `Posted — rank #${out.rank}.` : `Kept your best (${out.personalBest}). Rank #${out.rank}.`);
    } catch (e) {
      setPostState("error");
      setPostNote(e instanceof Error ? e.message : "Server unreachable");
    }
  };

  // ── Election Night reveal — plays instead of the results until done ──
  const reveal = useMemo(() => ukReveal(game), [game]);
  const [nightDone, setNightDone] = useState(() => !revealSupported() || hasSeenReveal(reveal.storageKey ?? ""));
  if (!nightDone) {
    return <ElectionNight {...reveal} onDone={() => setNightDone(true)} />;
  }

  return (
    <div className="card" style={{ maxWidth: 780, margin: "24px auto" }}>
      <div className={`win270 ${won ? "dem" : ""}`} style={{ textAlign: "center" }}>
        {won ? "🎉 You won a majority" : inGov ? "You're in government" : "You're in opposition"}
      </div>
      <h3 style={{ marginTop: 4 }}>{game.label} — Result</h3>
      <p className="muted">{govText(r.government)}</p>
      <p>You led <strong style={{ color: partyColor(game.playerParty) }}>{partyName(game.playerParty)}</strong> to <strong>{playerSeats}</strong> seats.</p>

      <div style={{ margin: "16px 0" }}><UkSeatBar result={r} total={maj.total} threshold={maj.threshold} /></div>

      <DailyResultPanel gameSeed={game.seed} scenarioId={scenarioId} engine="uk" won={won}
        unitLine={`${playerSeats} seats`} score={score} facts={facts}
        evMargin={Math.round(facts.unitMargin)} popularVoteMargin={facts.popularMargin} />

      <div className="kv" style={{ alignItems: "center", margin: "0 0 14px" }}>
        <span className="k">
          Campaign score <strong style={{ fontSize: 20 }}>{score}</strong><span className="muted small"> / 1000</span>
          <span className="muted small"> · seat margin {facts.unitMargin >= 0 ? "+" : ""}{Math.round(facts.unitMargin)} vs {maj.threshold}</span>
        </span>
        {user ? (
          <button className="secondary" disabled={postState === "busy" || postState === "done"} onClick={post}>
            {postState === "done" ? "Posted ✓" : postState === "busy" ? "Posting…" : "Post to Leaderboard"}
          </button>
        ) : (
          <button className="secondary" onClick={() => openModal("login")}>Log in to post</button>
        )}
      </div>
      {postNote && <p className="muted small">{postNote}</p>}

      <h3>Final standings</h3>
      {order.map((p) => (
        <div className="bloc" key={p}>
          <span className="name" style={{ color: p === game.playerParty ? partyColor(p) : undefined }}>
            <span style={{ display: "inline-block", width: 10, height: 10, background: partyColor(p), borderRadius: 2, marginRight: 6 }} />
            {partyShort(p)}
          </span>
          <span className="meta">{r.seats[p]} seats · {((r.voteShare[p] ?? 0) * 100).toFixed(1)}%</span>
          <div className="suppbar"><div style={{ width: `${(r.seats[p] / maj.total) * 100 * 1.6}%`, background: partyColor(p) }} /></div>
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

      <div style={{ marginTop: 16 }}><UkNextScenario /></div>

      <button className="primary" style={{ marginTop: 18, width: "100%" }} onClick={reset}>New campaign</button>
    </div>
  );
}
