import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@store/gameStore";
import { SetupScreen } from "@ui/SetupScreen";
import { ResultsScreen } from "@ui/ResultsScreen";
import { USMap } from "@ui/USMap";
import { StatePanel } from "@ui/StatePanel";
import { IntelPanel } from "@ui/IntelPanel";
import { ActionPanel } from "@ui/ActionPanel";
import { EventModal } from "@ui/EventModal";
import { DebateScorecard } from "@ui/DebateScorecard";
import { RecapModal } from "@ui/RecapModal";
import { EvBar } from "@ui/EvBar";
import { GuidePage } from "@ui/GuidePage";
import { CandidateScreen } from "@ui/CandidateScreen";
import { StatsScreen } from "@ui/StatsScreen";
import { NewsTicker } from "@ui/NewsTicker";
import { OnboardingCoach } from "@ui/coach/OnboardingCoach";
import { getScenario } from "@content/scenarios";
import { money, turnLabel } from "@ui/format";
import { lazy, Suspense } from "react";
import { LandingPage, type LandingDestination } from "@ui/LandingPage";
import { LegalPage } from "@ui/LegalPage";
import { dailyAssignment, utcDateString } from "@lib/daily";
import { SCENARIOS_BY_ID } from "@content/scenarioRegistry";

// The UK and country shells carry their engines, content, and map geometry —
// they load on demand so the main bundle stays lean (the US game is the
// default/resume path and stays eager).
const UkApp = lazy(() => import("@ui/uk/UkApp").then((m) => ({ default: m.UkApp })));
const CountryApp = lazy(() => import("@ui/country/CountryApp").then((m) => ({ default: m.CountryApp })));
const LeaderboardScreen = lazy(() => import("@ui/LeaderboardScreen").then((m) => ({ default: m.LeaderboardScreen })));

const LazyFallback = () => (
  <div className="app screen center"><div className="setup"><p className="sub">Loading…</p></div></div>
);
import { AuthModals } from "@ui/auth/AuthModals";
import { Vote, X } from "lucide-react";
import { BRAND } from "./brand";

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

  const debateOpen = useGameStore((s) => s.lastDebate) !== null;
  const player = game.playerCandidate;
  const res = game.resources[player];
  const cand = game.candidates[player];
  const plannedActions = game.queuedActions.length;
  const year = getScenario(game.scenarioId).year;
  const hasPendingEvent = game.pendingEvents.some((p) => p.forCandidate === player);

  const handleEndTurn = () => {
    if (hasPendingEvent) return;
    if (game.queuedActions.length === 0) {
      const ok = window.confirm("You have no actions queued this week. Unspent slots win nothing. End the week anyway?");
      if (!ok) return;
    }
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
            <div className="brand-name">{BRAND.nameCaps}</div>
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
        <button className="primary" data-coach="endweek" onClick={handleEndTurn} disabled={hasPendingEvent}>
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
      {!recapOpen && !debateOpen && hasPendingEvent && <EventModal />}
      {debateOpen && <DebateScorecard />}
      {guideOpen && <GuidePage onClose={() => setGuideOpen(false)} />}
      {candOpen && <CandidateScreen scenarioId={game.scenarioId} onClose={() => setCandOpen(false)} />}
      {statsOpen && <StatsScreen onClose={() => setStatsOpen(false)} />}

      {/* First-run guided tour; self-gating (localStorage, turn 0, US only). */}
      <OnboardingCoach />
    </div>
  );
}

// Where the app currently is: the landing scenario browser, one of the game
// shells (US / UK / a generic country), or the leaderboard. The optional
// initialSeed/initialParty prefill the setup screens (Daily Challenge).
type View =
  | { kind: "landing" }
  | { kind: "us"; scenarioId?: string; initialSeed?: string; initialParty?: string }
  | { kind: "uk"; electionId?: string; initialSeed?: string; initialParty?: string }
  | { kind: "country"; countryId: string; electionId?: string; initialSeed?: string; initialParty?: string }
  | { kind: "leaderboard" }
  | { kind: "legal"; tab?: "privacy" | "terms" };

export function App() {
  const game = useGameStore((s) => s.game);
  const refreshSaves = useGameStore((s) => s.refreshSaves);
  const [view, setView] = useState<View>({ kind: "landing" });
  useEffect(() => { void refreshSaves(); }, [refreshSaves]);

  const go = (dest: LandingDestination) => {
    // The daily destination resolves locally (client and server share the
    // same deterministic assignment) and lands on the right engine's setup
    // with the day's seed + side prefilled.
    if (dest.kind === "daily") {
      const assignment = dailyAssignment(utcDateString());
      const meta = SCENARIOS_BY_ID[assignment.scenarioId];
      if (!meta) return;
      // Played marker is set on results finish (DailyResultPanel), not on click.
      const prefill = { initialSeed: assignment.seed, initialParty: assignment.role };
      if (meta.engine === "us") setView({ kind: "us", scenarioId: meta.nativeId, ...prefill });
      else if (meta.engine === "uk") setView({ kind: "uk", electionId: meta.nativeId, ...prefill });
      else setView({ kind: "country", countryId: meta.country, electionId: meta.nativeId, ...prefill });
      return;
    }
    setView(dest as View);
  };
  const home = () => setView({ kind: "landing" });

  // Everything renders above the shared auth/paywall modals.
  const withModals = (node: React.ReactNode) => (
    <>
      {node}
      <AuthModals />
    </>
  );

  // A live U.S. game (or a resumed autosave) takes over the screen.
  if (view.kind === "us" || game) {
    if (!game) {
      return withModals(
        <div className="app screen" key="setup">
          <SetupScreen
            initialScenarioId={view.kind === "us" ? view.scenarioId : undefined}
            initialSeed={view.kind === "us" ? view.initialSeed : undefined}
            initialParty={view.kind === "us" ? view.initialParty : undefined}
            onExit={home}
          />
        </div>,
      );
    }
    if (game.phase === "result") return withModals(<div className="app screen" key="result"><ResultsScreen /></div>);
    return withModals(<GameScreen />);
  }

  if (view.kind === "uk") {
    return withModals(<Suspense fallback={<LazyFallback />}><UkApp onExit={home} initialElection={view.electionId} initialSeed={view.initialSeed} initialParty={view.initialParty} /></Suspense>);
  }

  if (view.kind === "country") {
    return withModals(<Suspense fallback={<LazyFallback />}><CountryApp countryId={view.countryId} onExit={home} initialElection={view.electionId} initialSeed={view.initialSeed} initialParty={view.initialParty} /></Suspense>);
  }

  if (view.kind === "leaderboard") {
    return withModals(<Suspense fallback={<LazyFallback />}><LeaderboardScreen onBack={home} /></Suspense>);
  }

  if (view.kind === "legal") {
    return withModals(<LegalPage initialTab={view.tab} onBack={home} />);
  }

  return withModals(<LandingPage onGo={go} />);
}
