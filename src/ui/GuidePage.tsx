import { useState } from "react";

const TABS = [
  { id: "actions", label: "Actions" },
  { id: "blocs", label: "Voter Blocs" },
  { id: "turns", label: "Turn Structure" },
  { id: "scoring", label: "Scoring & Polls" },
  { id: "changelog", label: "Changelog" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const ACTION_GUIDE = [
  {
    name: "Advertising",
    cost: "Variable ($1M–$30M)",
    target: "Any state",
    effect:
      "Positive ads raise your appeal among aligned blocs. Contrast ads attack the opponent but risk depressing turnout. Issue ads raise national salience of a chosen issue. Effect scales with media market cost, fundraising trait, and issue alignment. Diminishing returns apply.",
    when: "Use positive in friendly states, contrast in tossups where you're behind, issue ads to shift national conversation to your strength.",
  },
  {
    name: "Rally / Candidate Stop",
    cost: "1+ candidate days",
    target: "Any state",
    effect:
      "Boosts state momentum, national momentum, and local enthusiasm. Gaffe risk rises with low stamina and heavy travel schedule. Charisma amplifies effect.",
    when: "High-stamina candidates can rally aggressively. Use in battlegrounds with low enthusiasm. Avoid back-to-back rallies in low-stamina weeks.",
  },
  {
    name: "Surrogate / VP Stop",
    cost: "$250K",
    target: "Any state",
    effect:
      "Weaker than principal rally but costs no candidate days. Small momentum bump and modest bloc shifts.",
    when: "Cover states the candidate can't reach. Stack with rallies for compound effect.",
  },
  {
    name: "Fundraising",
    cost: "1+ candidate days",
    target: "None (national)",
    effect:
      "Haul scales with fundraising trait, national momentum, and random variance. Typical return: $8M–$12M per day for average trait.",
    when: "Do early and often. Momentum bonus means fundraising gets easier as you win.",
  },
  {
    name: "Field Offices (Ground Game)",
    cost: "$1.5M + 1 staff capacity",
    target: "Any state",
    effect:
      "Builds persistent GOTV infrastructure. Sticky — persists for rest of campaign. Required for effective GOTV later.",
    when: "Build in battlegrounds by week 3–4. Staff is limited; prioritize states with most EV per dollar.",
  },
  {
    name: "GOTV (Get Out The Vote)",
    cost: "$1M",
    target: "Any state with field offices",
    effect:
      "Turnout push. Effective only where ground game exists. Bigger impact on low-turnout-propensity blocs. Wastes money if no field offices.",
    when: "Late game (weeks 5–9). Use where ground game is built and margin is tight.",
  },
  {
    name: "Opposition Research",
    cost: "$2M",
    target: "National",
    effect:
      "55% chance to land a scandal on opponent (hits college whites and suburban women). 45% chance to backfire as 'desperate,' damaging media narrative.",
    when: "High-risk, high-reward. Use when behind and narrative is already poor. Avoid when ahead.",
  },
  {
    name: "Debate Prep",
    cost: "1+ candidate days",
    target: "None (buffs next debate)",
    effect:
      "Temporarily raises debating trait (+4 per day). Decays after debate event. Improves debate performance odds.",
    when: "Use 2–3 days before scheduled debate events. Check calendar for debate weeks.",
  },
  {
    name: "Issue Pivot",
    cost: "Free",
    target: "National",
    effect:
      "Shift your position on an issue. Gains blocs who like the new position, loses blocs who liked the old one. 'Flip-flopper' tax with suburban women and college whites.",
    when: "Rare, costly in trust. Use only when current position is clearly wrong for your coalition.",
  },
];

const BLOC_GUIDE = [
  {
    id: "college_white",
    name: "College-Educated White",
    lean: "Slightly Democratic",
    cares: "Economy, healthcare, climate, competence",
    notes: "Persuadable, authenticity-sensitive. Punishes flip-flops and negative ads.",
  },
  {
    id: "noncollege_white",
    name: "Non-College White",
    lean: "Republican",
    cares: "Economy, immigration, culture, jobs",
    notes: "High turnout propensity. Responds to economic nationalism and cultural appeals.",
  },
  {
    id: "suburban_women",
    name: "Suburban Women",
    lean: "Swing",
    cares: "Healthcare, education, temperament, stability",
    notes: "Critical tipping-point bloc. Hates chaos and gaffes. Values steady leadership.",
  },
  {
    id: "black",
    name: "Black Voters",
    lean: "Democratic",
    cares: "Criminal justice, economy, healthcare, turnout",
    notes: "High Democratic floor but turnout varies. Enthusiasm matters more than persuasion.",
  },
  {
    id: "hispanic",
    name: "Hispanic Voters",
    lean: "Swing",
    cares: "Economy, immigration, healthcare, jobs",
    notes: "Geographically concentrated. Issue alignment varies by state and origin.",
  },
  {
    id: "young",
    name: "Young Voters (18–29)",
    lean: "Democratic",
    cares: "Climate, student debt, jobs, social issues",
    notes: "Low turnout propensity. GOTV and enthusiasm critical. Responsive to issue salience.",
  },
  {
    id: "senior",
    name: "Seniors (65+)",
    lean: "Slightly Republican",
    cares: "Healthcare, Social Security, stability, economy",
    notes: "High turnout, low persuadability. Values competence and experience.",
  },
  {
    id: "evangelical",
    name: "Evangelical Christians",
    lean: "Republican",
    cares: "Culture, abortion, religious liberty, judges",
    notes: "Very high turnout. Low persuadability. Motivated by cultural threat framing.",
  },
];

const CHANGELOG = [
  { version: "0.1.0", date: "2024-06", changes: ["Initial release. 9 action types, 8 voter blocs, 2020 map.", "Mobile responsive layout.", "Guide page with actions, blocs, turns, scoring docs.", "Candidate profiles with stat bars and running mate tabs.", "Renamed traits: energy, debate prep, intelligence, policy knowledge, debating skill, fundraising prowess."] },
];

export function GuidePage({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<TabId>("actions");

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal guide" onClick={(e) => e.stopPropagation()}>
        <div className="head">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="tag">GUIDE</div>
              <h2>How to Play</h2>
            </div>
            <button className="ghost" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="body">
          <div className="tabbar">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "actions" && (
            <div className="guide-section">
              {ACTION_GUIDE.map((a) => (
                <div className="guide-card" key={a.name}>
                  <div className="guide-header">
                    <strong>{a.name}</strong>
                    <span className="guide-meta">{a.cost} · {a.target}</span>
                  </div>
                  <p className="guide-text">{a.effect}</p>
                  <p className="guide-when"><strong>When to use:</strong> {a.when}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "blocs" && (
            <div className="guide-section">
              <p className="guide-intro">
                Every state is divided into voter blocs. Each bloc has its own issue priorities, baseline lean, and turnout propensity. Campaign actions target blocs individually — a rally in Pennsylvania hits suburban women and non-college whites differently.
              </p>
              {BLOC_GUIDE.map((b) => (
                <div className="guide-card" key={b.id}>
                  <div className="guide-header">
                    <strong>{b.name}</strong>
                    <span className="guide-meta">{b.lean}</span>
                  </div>
                  <p className="guide-text">{b.notes}</p>
                  <p className="guide-when"><strong>Cares about:</strong> {b.cares}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "turns" && (
            <div className="guide-section">
              <h3>Turn Structure</h3>
              <p className="guide-text">
                Each turn represents one week of the campaign (September 1 through Election Day). The sequence:
              </p>
              <ol className="guide-list">
                <li><strong>Player phase:</strong> Queue actions (ads, rallies, fundraising, etc.). You can undo before ending the turn.</li>
                <li><strong>AI phase:</strong> Opponent acts according to difficulty — targeting, spending, and responding to events.</li>
                <li><strong>Event phase:</strong> Random or scheduled events surface. Some require immediate decisions; others apply automatically.</li>
                <li><strong>Resolution:</strong> Polls update, momentum shifts, resources refresh. A week-in-review recap shows what moved and why.</li>
              </ol>
              <h3>Resource Limits</h3>
              <ul className="guide-list">
                <li><strong>Cash:</strong> Spend on ads, surrogates, field offices, GOTV, oppo research. Replenished via fundraising.</li>
                <li><strong>Candidate days:</strong> Limited per week. Rallies, fundraising, and debate prep consume them. Replenish each turn.</li>
                <li><strong>Staff capacity:</strong> Hard cap on field offices. Does not replenish.</li>
                <li><strong>Momentum:</strong> National and state-level. Drives poll movement and fundraising efficiency. Can be positive or negative.</li>
              </ul>
            </div>
          )}

          {tab === "scoring" && (
            <div className="guide-section">
              <h3>Polls & Margin</h3>
              <p className="guide-text">
                Polls show the Democrat's two-party share in each state. The margin is Democrat − Republican. Positive = the Democrat leads. The model uses a logit transform: small changes near 50% matter more than changes at the extremes.
              </p>
              <h3>Electoral Votes</h3>
              <p className="guide-text">
                Winner-take-all in every state except Maine and Nebraska (which use congressional districts). The EV bar at the top tracks live projections. 270 wins.
              </p>
              <h3>Turnout</h3>
              <p className="guide-text">
                Each bloc has a base turnout propensity. Enthusiasm (from rallies, events, momentum) raises it. GOTV multiplies it where ground game exists. Low turnout blocs (young, Hispanic in some states) have more upside.
              </p>
              <h3>What Moves Polls</h3>
              <ul className="guide-list">
                <li>Advertising (alignment-dependent, diminishing returns)</li>
                <li>Rallies (momentum + enthusiasm, gaffe risk)</li>
                <li>Events (random, often national)</li>
                <li>Issue pivots (realignment, flip-flopper cost)</li>
                <li>Opposition research (scandal or backfire)</li>
                <li>Ground game + GOTV (turnout, not margin)</li>
              </ul>
            </div>
          )}

          {tab === "changelog" && (
            <div className="guide-section">
              {CHANGELOG.map((c) => (
                <div className="guide-card" key={c.version}>
                  <div className="guide-header">
                    <strong>v{c.version}</strong>
                    <span className="guide-meta">{c.date}</span>
                  </div>
                  <ul className="guide-list">
                    {c.changes.map((ch, i) => (
                      <li key={i}>{ch}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
