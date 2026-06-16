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
import { CANDIDATES } from "@content/candidates";
import { money, turnLabel } from "@ui/format";

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

  const player = game.playerCandidate;
  const res = game.resources[player];
  const cand = CANDIDATES[player];
  const hasPendingEvent = game.pendingEvents.some((p) => p.forCandidate === player);

  const handleEndTurn = () => {
    endTurn();
    const g = useGameStore.getState().game;
    if (g && g.phase !== "result" && g.lastRecap.length > 0) setRecapOpen(true);
  };

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">CAMPAIGN <span className="yr">2020</span></div>
        <div className="turnchip">{turnLabel(game.turn, game.totalTurns)} · playing <strong style={{ color: cand.color }}>{cand.shortName}</strong></div>
        {live && <EvBar projection={live} />}
        <div className="stat"><span className="v">{money(res.cash)}</span><span className="l">Cash</span></div>
        <div className="stat"><span className="v">{res.candidateDays}/{res.maxCandidateDays}</span><span className="l">Days</span></div>
        <div className="stat"><span className="v">{res.nationalMomentum.toFixed(0)}</span><span className="l">Momentum</span></div>
        <SaveControls />
        <button className="ghost small" onClick={() => setCandOpen(true)}>Candidates</button>
        <button className="ghost small" onClick={() => setGuideOpen(true)}>Guide</button>
        <button onClick={undo} disabled={!canUndo}>↶ Undo</button>
        <button className="primary" onClick={handleEndTurn} disabled={hasPendingEvent}>
          {hasPendingEvent ? "Resolve event first" : "End Week →"}
        </button>
      </div>

      <div className="main">
        <div className="col">
          <USMap />
          <IntelPanel />
        </div>
        <div className="col">
          <StatePanel />
          <ActionPanel />
        </div>
      </div>

      {recapOpen && <RecapModal onClose={() => setRecapOpen(false)} />}
      {!recapOpen && hasPendingEvent && <EventModal />}
      {guideOpen && <GuidePage onClose={() => setGuideOpen(false)} />}
      {candOpen && <CandidateScreen onClose={() => setCandOpen(false)} />}
    </div>
  );
}

export function App() {
  const game = useGameStore((s) => s.game);
  const refreshSaves = useGameStore((s) => s.refreshSaves);
  useEffect(() => { void refreshSaves(); }, [refreshSaves]);

  if (!game) return <div className="app"><SetupScreen /></div>;
  if (game.phase === "result") return <div className="app"><ResultsScreen /></div>;
  return <GameScreen />;
}
