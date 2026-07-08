import { useState } from "react";
import { useCountryStore } from "@store/countryStore";
import { useAuthStore } from "@store/authStore";
import { playablePartiesIn, type CountryBundle } from "@engine/countryGame";
import { partyColor, partyName, partyShort } from "./helpers";
import { Avatar } from "@ui/Avatar";
import { Vote, Dices, ChevronLeft, Flag } from "lucide-react";
import type { PartyId } from "@engine/system";
import { BRAND } from "../../brand";

function randomSeed(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

export function CountrySetup({ country, onBack, initialElection }: { country: CountryBundle; onBack: () => void; initialElection?: string }) {
  const newGame = useCountryStore((s) => s.newGame);
  const canPlay = useAuthStore((s) => s.canPlay);
  const openModal = useAuthStore((s) => s.openModal);
  const user = useAuthStore((s) => s.user);
  const ids = Object.keys(country.elections).sort((a, b) => Number(b) - Number(a));
  const [election, setElection] = useState(initialElection && country.elections[initialElection] ? initialElection : ids[0]);
  const [party, setParty] = useState<PartyId>(country.playable[0]);
  const [seed, setSeed] = useState<string>(randomSeed);
  const data = country.elections[election];
  const playable = playablePartiesIn(country, election);
  const activeParty = playable.includes(party) ? party : playable[0];
  const leader = country.leaders[election]?.[activeParty];

  return (
    <div className="center">
      <div className="setup">
        <div className="setup-eyebrow">
          <span className="mark"><Vote size={18} /></span>{country.flag} {country.label.toUpperCase()} — {data.year}
        </div>
        <div className="title">{BRAND.name}</div>
        <p className="sub">{data.tagline}</p>

        <div className="su-panel">
          {ids.length > 1 && (
            <div className="field" style={{ textAlign: "left", margin: "0 0 10px" }}>
              <label>Election</label>
              <div className="scenario-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {ids.map((id) => (
                  <button key={id} type="button" className={`scenario-card${election === id ? " sel" : ""}`} onClick={() => setElection(id)}>
                    <span className="scenario-year">{country.elections[id].year}</span>
                    <span className="scenario-match">{country.elections[id].label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="field" style={{ textAlign: "left", margin: "0 0 10px" }}>
            <label>Lead which side? — your leader's traits shape the campaign</label>
            <div className="pick" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {playable.map((p) => {
                const ld = country.leaders[election]?.[p];
                const sel = activeParty === p;
                return (
                  <div key={p} className="candcard" onClick={() => setParty(p)}
                    style={{ cursor: "pointer", borderColor: sel ? partyColor(country, p) : undefined, borderWidth: sel ? 2 : 1, borderStyle: "solid", boxShadow: sel ? "var(--glow-gold)" : undefined }}>
                    <div className="row" style={{ gap: 10 }}>
                      <Avatar name={ld?.name ?? partyName(country, p)} color={partyColor(country, p)} size={40} />
                      <div>
                        <div className="nm" style={{ color: partyColor(country, p) }}>{partyName(country, p)}</div>
                        <div className="rm">{ld?.name ?? `${partyShort(country, p)} leader`}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {leader && (
              <div className="su-summary" style={{ marginTop: 12 }}>
                <div className="su-summary-row"><span className="su-summary-k">Charisma</span><span className="su-summary-v">{leader.charisma}</span></div>
                <div className="su-summary-row"><span className="su-summary-k">Energy</span><span className="su-summary-v">{leader.energy}</span></div>
                <div className="su-summary-row"><span className="su-summary-k">Competence</span><span className="su-summary-v">{leader.competence}</span></div>
                <div className="su-summary-row"><span className="su-summary-k">Machine</span><span className="su-summary-v">{leader.machine}</span></div>
              </div>
            )}
          </div>

          <div className="field" style={{ textAlign: "left" }}>
            <label>Seed — same seed replays the same events & RNG</label>
            <div className="su-seed">
              <input type="text" value={seed} onChange={(e) => setSeed(e.target.value)} />
              <button type="button" className="ghost su-reroll" title="Reroll seed" onClick={() => setSeed(randomSeed())}>
                <Dices size={16} /> Reroll
              </button>
            </div>
          </div>

          <div className="su-summary">
            <div className="su-summary-row">
              <span className="su-summary-k">Leading</span>
              <span className="su-summary-v" style={{ color: partyColor(country, activeParty) }}>
                {partyName(country, activeParty)}{leader ? ` · ${leader.name}` : ""}
              </span>
            </div>
            <div className="su-summary-row"><span className="su-summary-k">Goal</span><span className="su-summary-v">{data.goalText ?? country.goalText}</span></div>
          </div>
        </div>

        <div className="su-nav">
          <button className="ghost" onClick={onBack}><ChevronLeft size={16} /> All scenarios</button>
          <button
            className="primary su-next"
            onClick={() => {
              const sid = `${country.id.toLowerCase()}-${election}`;
              if (!canPlay(sid)) { openModal(user ? "activate" : "login", sid); return; }
              newGame(country.id, election, activeParty, seed);
            }}
          >
            <Flag size={15} /> {canPlay(`${country.id.toLowerCase()}-${election}`)
              ? <>Begin {data.year} as {partyShort(country, activeParty)}</>
              : "🔒 Unlock to play"}
          </button>
        </div>
      </div>
    </div>
  );
}
