import { useCountryStore } from "@store/countryStore";
import type { CountryBundle } from "@engine/countryGame";
import { CountrySetup } from "./CountrySetup";
import { CountryMap, CountrySeatBar, CountryStandings, CountryRegionPanel } from "./CountryPanels";
import { CountryActionPanel } from "./CountryActionPanel";
import { CountryResults } from "./CountryResults";
import { partyColor, partyName } from "./helpers";
import { Vote } from "lucide-react";

// The generic country shell — the UkApp pattern, parameterized by bundle.
export function CountryApp({ country, onExit, initialElection }: { country: CountryBundle; onExit: () => void; initialElection?: string }) {
  const storeCountry = useCountryStore((s) => s.country);
  const game = useCountryStore((s) => s.game);
  const endTurn = useCountryStore((s) => s.endTurn);
  const undo = useCountryStore((s) => s.undo);
  const canUndo = useCountryStore((s) => s.history.length > 0);
  const live = useCountryStore((s) => s.liveProjection)();

  // A game from a different country in the store doesn't belong to this shell.
  const activeGame = storeCountry?.id === country.id ? game : null;

  if (!activeGame) return <div className="app screen"><CountrySetup country={country} onBack={onExit} initialElection={initialElection} /></div>;
  if (activeGame.phase === "result") return <div className="app screen"><CountryResults onExit={onExit} /></div>;

  const weeksLeft = activeGame.totalTurns - activeGame.turn;
  const res = activeGame.resources[activeGame.playerParty];
  const used = activeGame.queuedActions.length;
  const playerSeats = live ? live.seats[activeGame.playerParty] ?? 0 : 0;

  return (
    <div className="app screen">
      <div className="topbar">
        <div className="brand-lockup">
          <span className="mark"><Vote size={22} /></span>
          <div>
            <div className="brand-name">A HOUSE DIVIDED</div>
            <div className="brand-yr">{country.flag} {country.label.toUpperCase()} · {activeGame.label}</div>
          </div>
        </div>
        <div className="turnchip">
          {weeksLeft} {weeksLeft === 1 ? "week" : "weeks"} to election day · leading{" "}
          <strong style={{ color: partyColor(country, activeGame.playerParty) }}>{partyName(country, activeGame.playerParty)}</strong>
        </div>
        {live && <CountrySeatBar country={country} result={live} />}
        <div className="stat"><span className="v" style={{ color: partyColor(country, activeGame.playerParty) }}>{playerSeats}</span><span className="l">Your {country.unitNamePlural}</span></div>
        <div className="stat"><span className="v">{country.currency}{res.funds.toFixed(0)}M</span><span className="l">Funds</span></div>
        <div className="stat"><span className="v" style={{ color: used >= res.maxActions ? "var(--gold)" : undefined }}>{res.maxActions - used}/{res.maxActions}</span><span className="l">Actions</span></div>
        <button className="ghost small" onClick={onExit}>Exit</button>
        <button onClick={undo} disabled={!canUndo}>↶ Undo</button>
        <button className="primary" onClick={endTurn}>End Week →</button>
      </div>

      {activeGame.news.length > 0 && (
        <div className="ticker" role="status" aria-live="polite">
          <span className="ticker-tag"><span className="ticker-dot" /> WIRE</span>
          <span className="ticker-line">{activeGame.news[0].text}</span>
        </div>
      )}

      <div className="main">
        <div className="col">
          <CountryMap />
          <CountryStandings />
        </div>
        <div className="col">
          <CountryRegionPanel />
          <CountryActionPanel />
        </div>
      </div>
    </div>
  );
}
