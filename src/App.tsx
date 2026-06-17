import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@store/gameStore";
import { SetupScreen } from "@ui/SetupScreen";
import { ResultsScreen } from "@ui/ResultsScreen";
import { USMap } from "@ui/USMap";
import { StatePanel } from "@ui/StatePanel";
import { IntelPanel } from "@ui/IntelPanel";
import { ActionPanel } from "@ui/ActionPanel";
import { EventModal } from "@ui/EventModal";
import { RecapModal } from "@ui/RecapModal";
import { EvBar } from "@ui/EvBar";
import { GuidePage } from "@ui/GuidePage";
import { CandidateScreen } from "@ui/CandidateScreen";
import { StatsScreen } from "@ui/StatsScreen";
import { NewsTicker } from "@ui/NewsTicker";
import { getScenario } from "@content/scenarios";
import { money, turnLabel } from "@ui/format";
import { Vote, X } from "lucide-react";

// True when the viewport is in the single-column mobile layout. Re-renders on
// viewport changes so State Detail can switch between inline and bottom-sheet.
function useIsMobile(): boolean {
  const hasMM = typeof window !== "undefined" && typeof window.matchMedia === "function";
  const [mobile, setMobile] = useState(() => hasMM && window.matchMedia("(max-width: 768px)").matches);
  useEffect(() => {
    if (!hasMM) return;
    const mq = window.matchMedia("(max-width: 768px)");
    const fn = () => setMobile(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [hasMM]);
  return mobile;
}

function SaveControls() {
  const exportSave = useGameStore((s) => s.exportSave);
  const importSave = useGameStore((s) => s.importSave);
  const saveGame = useGameStore((s) => s.saveGame);
  const fileRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const doExport = () => {
    const json = exportSave();
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Save exported");
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try { importSave(String(reader.result)); flash("Save imported"); }
      catch { flash("Import failed — invalid file"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="row" style={{ gap: 6 }}>
      <button className="ghost small" onClick={async () => { await saveGame(`Save ${new Date().toLocaleString()}`); flash("Saved locally"); }}>Save</button>
      <button className="ghost small" onClick={doExport}>Export</button>
      <button className="ghost small" onClick={() => fileRef.current?.click()}>Import</button>
      <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = ""; }} />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function GameScreen() {
  const game = useGameStore((s) => s.game)!;
  const endTurn = useGameStore((s) => s.endTurn);
  const undo = useGameStore((s) => s.undo);
  const canUndo = useGameStore((s) => s.history.length > 0);
  const live = useGameStore((s) => s.liveProjection)();
  const [recapOpen, setRecapOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [candOpen, setCandOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  const isMobile = useIsMobile();
  const selectedStateId = useGameStore((s) => s.selectedStateId);
  const selectState = useGameStore((s) => s.selectState);

  const player = game.playerCandidate;
  const res = game.resources[player];
  const cand = game.candidates[player];
  const plannedActions = game.queuedActions.length;
  const year = getScenario(game.scenarioId).year;
  const hasPendingEvent = game.pendingEvents.some((p) => p.forCandidate === player);

  const handleEndTurn = () => {
    endTurn();
    const g = useGameStore.getState().game;
    if (g && g.phase !== "result" && g.lastRecap.length > 0) setRecapOpen(true);
  };

  return (
    <div className="app screen" key="game">
      <div className="topbar">
        <div className="brand-lockup">
          <span className="mark"><Vote size={22} /></span>
          <div>
            <div className="brand-name">A HOUSE DIVIDED</div>
            <div className="brand-yr">CAMPAIGN {year}</div>
          </div>
        </div>
        <div className="turnchip">{turnLabel(game.turn, game.totalTurns)} · playing <strong style={{ color: cand.color }}>{cand.shortName}–{cand.runningMate.split(" ").slice(-1)[0]}</strong></div>
        {live && <EvBar projection={live} />}
        <div className="stat"><span className="v">{money(res.cash)}</span><span className="l">Cash</span></div>
        <div className="stat"><span className="v" style={{ color: plannedActions >= res.maxActions ? "var(--gold)" : undefined }}>{res.maxActions - plannedActions}/{res.maxActions}</span><span className="l">Actions left</span></div>
        <div className="stat"><span className="v">{res.nationalMomentum.toFixed(0)}</span><span className="l">Momentum</span></div>
        <SaveControls />
        <button className="ghost small" onClick={() => setStatsOpen(true)}>Stats</button>
        <button className="ghost small" onClick={() => setCandOpen(true)}>Candidates</button>
        <button className="ghost small" onClick={() => setGuideOpen(true)}>Guide</button>
        <button onClick={undo} disabled={!canUndo}>↶ Undo</button>
        <button className="primary" onClick={handleEndTurn} disabled={hasPendingEvent}>
          {hasPendingEvent ? "Resolve event first" : "End Week →"}
        </button>
      </div>

      <NewsTicker />

      <div className="main">
        <div className="col">
          <USMap />
          <IntelPanel />
        </div>
        <div className="col">
          {/* On mobile, State Detail is a tap-to-open bottom sheet (below), not a
              persistent card that pushes the map and actions around. */}
          {!isMobile && <StatePanel />}
          <ActionPanel />
        </div>
      </div>

      {isMobile && selectedStateId && (
        <div className="sheet-scrim" onClick={() => selectState(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <button className="sheet-close" onClick={() => selectState(null)} aria-label="Close"><X size={18} /></button>
            <StatePanel />
          </div>
        </div>
      )}

      {recapOpen && <RecapModal onClose={() => setRecapOpen(false)} />}
      {!recapOpen && hasPendingEvent && <EventModal />}
      {guideOpen && <GuidePage onClose={() => setGuideOpen(false)} />}
      {candOpen && <CandidateScreen scenarioId={game.scenarioId} onClose={() => setCandOpen(false)} />}
      {statsOpen && <StatsScreen onClose={() => setStatsOpen(false)} />}
    </div>
  );
}

export function App() {
  const game = useGameStore((s) => s.game);
  const refreshSaves = useGameStore((s) => s.refreshSaves);
  useEffect(() => { void refreshSaves(); }, [refreshSaves]);

  if (!game) return <div className="app screen" key="setup"><SetupScreen /></div>;
  if (game.phase === "result") return <div className="app screen" key="result"><ResultsScreen /></div>;
  return <GameScreen />;
}
