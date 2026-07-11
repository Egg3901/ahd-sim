import { tideBlurb, scenarioTags, SCENARIOS_BY_ID, type ScenarioMeta } from "@content/scenarioRegistry";

/** Setup warning for landslide / coin-flip scenarios. */
export function TideBanner({ scenarioId, meta }: { scenarioId?: string; meta?: ScenarioMeta }) {
  const m = meta ?? (scenarioId ? SCENARIOS_BY_ID[scenarioId] : undefined);
  if (!m) return null;
  const blurb = tideBlurb(m);
  if (!blurb) return null;
  const tags = scenarioTags(m);
  const isTide = tags.includes("tide");
  return (
    <div
      className="su-summary"
      style={{
        marginTop: 12,
        borderColor: isTide ? "var(--rose)" : "var(--gold)",
        background: "var(--navy-600)",
      }}
    >
      <div className="muted small" style={{ color: isTide ? "var(--rose)" : "var(--gold)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", fontSize: 10 }}>
        {isTide ? "Historical tide" : "Coin-flip election"}
      </div>
      <div className="muted small" style={{ marginTop: 4, lineHeight: 1.4 }}>{blurb}</div>
    </div>
  );
}

/** Shown when the player picks a minor / non-front-runner party. */
export function ChallengePartyBanner({ partyLabel }: { partyLabel: string }) {
  return (
    <div className="su-summary" style={{ marginTop: 12, borderColor: "var(--gold)", background: "var(--navy-600)" }}>
      <div className="muted small" style={{ color: "var(--gold)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", fontSize: 10 }}>
        Challenge path
      </div>
      <div className="muted small" style={{ marginTop: 4, lineHeight: 1.4 }}>
        Leading {partyLabel} is a challenge scenario. Majority wins are rare. Play for kingmaker leverage, seat gains, or the post-mortem brag.
      </div>
    </div>
  );
}
