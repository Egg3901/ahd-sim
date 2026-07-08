import { useUkStore } from "@store/ukStore";
import { UkSetup } from "./UkSetup";
import { UkMap } from "./UkMap";
import { UkSeatBar } from "./UkSeatBar";
import { UkRegionPanel } from "./UkRegionPanel";
import { UkActionPanel } from "./UkActionPanel";
import { UkStandings } from "./UkStandings";
import { UkResults } from "./UkResults";
import { partyName, partyColor } from "./parties";
import { Vote } from "lucide-react";
import { BRAND } from "../../brand";

export function UkApp({ onExit, initialElection }: { onExit: () => void; initialElection?: string }) {
  const game = useUkStore((s) => s.game);
  const endTurn = useUkStore((s) => s.endTurn);
  const undo = useUkStore((s) => s.undo);
  const canUndo = useUkStore((s) => s.history.length > 0);
  const live = useUkStore((s) => s.liveProjection)();

  if (!game) return <div className="app screen"><UkSetup onBack={onExit} initialElection={initialElection} /></div>;
  if (game.phase === "result") return <div className="app screen"><UkResults /></div>;

  const weeksLeft = game.totalTurns - game.turn;
  const res = game.resources[game.playerParty];
  const used = game.queuedActions.length;
  const playerSeats = live ? live.seats[game.playerParty] ?? 0 : 0;

  return (
    <div className="app screen">
      <div className="topbar">
        <div className="brand-lockup">
          <span className="mark"><Vote size={22} /></span>
          <div>
            <div className="brand-name">{BRAND.nameCaps}</div>
            <div className="brand-yr">UK · {game.label}</div>
          </div>
        </div>
        <div className="turnchip">
          {weeksLeft} {weeksLeft === 1 ? "week" : "weeks"} to polling day · leading{" "}
          <strong style={{ color: partyColor(game.playerParty) }}>{partyName(game.playerParty)}</strong>
        </div>
        {live && <UkSeatBar result={live} />}
        <div className="stat"><span className="v" style={{ color: partyColor(game.playerParty) }}>{playerSeats}</span><span className="l">Your seats</span></div>
        <div className="stat"><span className="v">£{res.funds.toFixed(0)}M</span><span className="l">Funds</span></div>
        <div className="stat"><span className="v" style={{ color: used >= res.maxActions ? "var(--gold)" : undefined }}>{res.maxActions - used}/{res.maxActions}</span><span className="l">Actions</span></div>
        <button className="ghost small" onClick={onExit}>Exit</button>
        <button onClick={undo} disabled={!canUndo}>↶ Undo</button>
        <button className="primary" onClick={endTurn}>End Week →</button>
      </div>

      {game.news.length > 0 && (
        <div className="ticker" role="status" aria-live="polite">
          <span className="ticker-tag"><span className="ticker-dot" /> WIRE</span>
          <span className="ticker-line">{game.news[0].text}</span>
        </div>
      )}

      <div className="main">
        <div className="col">
          <UkMap />
          <UkStandings />
        </div>
        <div className="col">
          <UkRegionPanel />
          <UkActionPanel />
        </div>
      </div>
    </div>
  );
}
