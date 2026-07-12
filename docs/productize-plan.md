# Productize Plan: ELECTIONEER (ahd-sim)

Handoff document for the productization pass completed 2026-07-12. Seven feature
branches were built in parallel worktrees, merged to `main` one at a time with
typecheck and the full test suite run between merges, and deployed to
sim.ahousedividedgame.com via the auto-deploy timer.

Final state on `main`: typecheck clean, 33 test files / 277 tests passing,
production build green.

## 1. Audit findings

**Stack (pre-project, unchanged):**

- Vite 5.4 + React 18.3 + TypeScript 5.5, Zustand 4.5 for state
- Vitest 2 (jsdom + fake-indexeddb), Playwright available as a dev dep
- Express 5 + better-sqlite3 server (`server/`, runs on :3400) for auth,
  entitlements, leaderboard, and score validation
- Dexie (IndexedDB) local persistence, Sentry browser SDK
- No router library; view switching is app state in `App.tsx`
- Deployed by `/root/bin/auto-deploy.sh` (systemd timer, 2 min): fetch, pull,
  build, restart `ahd-sim-campaign.service`, build-gated

**Already existed before this project** (the original handoff prompt assumed a
hobby prototype; the repo was well past that):

- Engine/UI split: `src/engine` is pure and tested in isolation (calibration,
  balance gauntlet, AI planner suites)
- Events and historical events, debates (DebateScorecard), endorsements,
  difficulty picker, scenario registry with 34 scenarios across 6 countries
  (US, UK multiparty, and generic country engine)
- Ad buying with per-state media market costs and a saturating
  diminishing-returns curve (`src/engine/actions.ts`); going negative dents
  your own media narrative
- Freemium commerce through the external Lakeside platform
  (lakesidegames.net/store): 2 free scenarios + daily challenge, 32 in paid
  packs, entitlement consumption and code redemption already wired. No Stripe
  or Paddle work was needed.
- Privacy-friendly analytics (self-hosted umami, inert until configured),
  legal page (privacy + terms), onboarding coach, local save/export/import
- Baseline at project start: typecheck clean, 28 test files / 244 tests
  passing

**Real gaps found:** product-grade landing page, campaign editor, turn
replay/timeline, post-game report, sound, keyboard shortcuts, settings store,
loading states, campaign length in the UI, desktop packaging, Steam assets.

## 2. Architecture

```
                    +----------------------------------------------+
                    |                  src/ui                      |
                    |  LandingPage  SetupScreen  GameScreen (App)  |
                    |  EditorScreen TimelineView WhyReport         |
                    |  SettingsModal OnboardingCoach Skeleton      |
                    |  uk/ country/ auth/ electionNight/          |
                    +-------+------------------+-------------------+
                            |                  |
              +-------------+------+   +-------+-----------------+
              |     src/store      |   |       src/lib           |
              | gameStore ukStore  |   | sfx (WebAudio) hotkeys  |
              | countryStore       |   | replay (log + derive)   |
              | authStore          |   | daily                   |
              | settingsStore -----+-> localStorage              |
              | usReplay mpReplay  |   +-------------------------+
              +---+----------+-----+
                  |          |
        +---------+--+   +---+--------------------------+
        | src/engine |   |     src/persistence          |
        | (pure, no  |   | local.ts: Dexie "campaign-   |
        |  UI deps)  |   |  2020" v2 tables:            |
        | setup turn |   |   saves, customScenarios,    |
        | actions ai |   |   replays                    |
        | polls vote |   | remote.ts: stub (throws)     |
        | events ... |   +------------------------------+
        +------+-----+
               |
        +------+---------------+
        |     src/content      |
        | scenarios registry   |
        | customScenario.ts    |
        | (schema + validator  |
        |  + runtime register) |
        +----------------------+

  server/ (Express + SQLite :3400)          Lakeside platform (external)
    auth, entitlements, leaderboard,  <-->    store, checkout, code
    score validation, catalog                 redemption, refunds

  src-tauri/ (desktop scaffold, config only, no binaries built)
```

## 3. File-by-file changes

### Wave 1

**product/lander** (landing page rework)
- `src/ui/LandingPage.tsx`: headline/subhead name the product; three feature
  blocks illustrated with real components (Sparkline, EvBar, flag strip);
  honest pricing section (free tier vs one-time packs); FAQ; expanded footer
  (privacy/terms, contact mailto, store link, Discord marked coming soon)
- `src/ui/styles.css`: lander section styles

**product/polish** (settings, sound, shortcuts, loading states)
- `src/store/settingsStore.ts` (new): Zustand + localStorage persist;
  soundOn, volume, reducedMotion, hotkeysOn
- `src/lib/sfx.ts` (new): WebAudio oscillator synth, no binary assets;
  turn advance, poll up/down, event popup, win/lose stings; AudioContext
  armed on first user gesture
- `src/lib/hotkeys.ts` (new): Enter/Space end turn, Escape close, 1-9 pick
  action, ? help; ignores keydowns in form fields; gated on the settings
  toggle
- `src/ui/SettingsModal.tsx` (new), `src/ui/Skeleton.tsx` (new: SkeletonRows,
  Spinner)
- `src/App.tsx`: settings button, sfx and hotkey wiring, Spinner in lazy
  fallback
- `src/ui/ActionPanel.tsx`: hotkey-pick-action listener
- `src/ui/ResultsScreen.tsx`: win/lose sting after election night reveal
- `src/ui/LeaderboardScreen.tsx`, `src/ui/auth/{Login,Register,Activation,Account}Modal.tsx`:
  skeleton rows and spinner busy states
- `src/ui/styles.css`: skeleton/spinner styles; animations off under
  prefers-reduced-motion
- Tests: `src/store/__tests__/settingsStore.test.ts`,
  `src/lib/__tests__/hotkeys.test.ts`

**product/editor** (campaign editor)
- `src/content/customScenario.ts` (new): versioned CustomScenario schema
  (version 1), hand-rolled validator with readable errors, adapter to the
  engine Scenario shape, runtime registry injection, serialize/parse
- `src/ui/EditorScreen.tsx` (new): saved-campaign list (play/edit/export/
  delete), JSON import, ticket forms for both sides, live validation
- `src/persistence/local.ts`: customScenarios Dexie table +
  customScenarioStore (validates at save AND load), startup re-registration
- `src/ui/SetupScreen.tsx`: "Create custom" entry
- `src/App.tsx`: re-register saved custom scenarios on startup
- Tests: `src/content/__tests__/custom-scenario.test.ts` (8 tests: round-trip
  validation, load-into-engine smoke)
- Custom scenarios are free tier; they bypass the entitlement gate.

**product/replay-report** (timeline + post-game report)
- `src/lib/replay.ts` (new): ReplayLog/ReplaySnapshot model (aggregate
  numbers only; a week snapshot is under 4 KB, test-asserted), appendSnapshot,
  truncateToTurn (stays in step with undo), deriveReport (pure)
- `src/store/usReplay.ts`, `src/store/mpReplay.ts`, `ukReplay.ts`,
  `countryReplay.ts` (new): per-engine recorders wired into gameStore,
  ukStore, countryStore
- `src/persistence/local.ts`: replays Dexie table; SyncProvider gained
  saveReplay/loadReplay/removeReplay
- `src/ui/TimelineView.tsx` (new): read-only turn scrubber (standings, margin
  sparkline, what changed, actions/events, closest contests); never calls
  game setters, hidden during daily games, always available after game end
- `src/ui/WhyReport.tsx` (new): "Why You Won/Lost" card in ResultsScreen,
  UkResults, and CountryResults; omits blocks that do not apply
- Tests: `src/lib/__tests__/replay.test.ts`,
  `src/store/__tests__/replayRecording.test.ts`

Merge note: editor and replay both introduced Dexie version(2); the merge
reconciled them into a single v2 migration containing both new tables
(`customScenarios`, `replays`). Anyone rebasing pre-merge branches must keep
that single v2.

### Wave 2

**product/packaging** (desktop scaffold + Steam kit)
- `src-tauri/tauri.conf.json`, `Cargo.toml`, `build.rs`, `src/main.rs` (new):
  Tauri v2 app "Electioneer", devUrl :5173, frontendDist ../dist, window
  1280x800 min 900x600
- `package.json` / lockfile: `tauri:dev`, `tauri:build` scripts,
  @tauri-apps/cli dev dep
- `docs/desktop.md` (new): what is scaffolded vs verified (nothing built;
  no Rust toolchain on this box), platform deps, signing, output paths
- `docs/steam/description.md`, `docs/steam/assets.md`,
  `docs/steam/pricing-notes.md` (new): store copy, exact capsule/screenshot
  dimensions and a shot list from the real game, note that Steam needs its
  own payment path (Steamworks entitlements) separate from Lakeside

**product/length** (campaign length picker)
- `src/ui/SetupScreen.tsx`: Short (5wk) / Standard (9wk) / Long (14wk) picker
  in the Briefing step; hidden for Daily Challenge
- `src/store/gameStore.ts`: newGame forces totalTurns 9 for daily mode as a
  backstop regardless of what the UI sends
- `src/ui/ResultsScreen.tsx`: non-standard lengths are casual only and do not
  post to the leaderboard (plain note replaces the post button)
- Tests: `src/engine/__tests__/turnloop.test.ts` gained 5-week and 14-week
  full-run tests
- No engine changes were needed; setup.ts already accepted totalTurns and the
  end condition is relative.

**product/tutorial** (first-launch tutorial)
- `src/ui/coach/OnboardingCoach.tsx`: 6 steps grown to 8 (adds events/debates
  "curveballs" step and a top-bar orientation step), forceOpen prop for replay
- `src/App.tsx`: Replay tutorial handler (clears done key, remounts coach),
  data-coach anchor on the settings button
- `src/ui/SettingsModal.tsx`: Help section with Replay tutorial button
- `src/ui/NewsTicker.tsx`: data-coach anchor
- Tests: coach suite extended with a full 8-step end-to-end walkthrough

## 4. Implemented vs stubbed/open

**Implemented and verified (tests + build green, deployed):**

- Product landing page with honest pricing, FAQ, footer
- Campaign editor with validated, versioned custom scenarios (save, export,
  import, play; free tier)
- Turn replay/timeline (read-only, cheat-proofed for daily) and post-game
  "why you won/lost" report across US, UK, and country engines
- Settings store, WebAudio sound with mute and volume, keyboard shortcuts
  with help overlay, skeleton/spinner loading states, reduced-motion support
- Campaign length picker (leaderboard integrity preserved: daily pinned to 9
  weeks, non-standard lengths casual only)
- 8-step first-launch tutorial with skip and replay
- Tauri v2 desktop scaffold, Steam store page kit (copy + asset specs)
- Payments, license gating, analytics, legal pages: already existed via
  Lakeside platform + umami; nothing new needed

**Open / stubbed:**

- Tauri: icon files referenced in tauri.conf.json do not exist yet; no binary
  has been built (needs a Rust toolchain and platform deps; see
  docs/desktop.md)
- Steam: screenshots not taken, capsule art not made, Steamworks payment
  path not built (Lakeside checkout does not apply inside Steam)
- Discord footer link is labeled "coming soon" until a server exists
- Historical event decks use fixed turn literals calibrated for 9 weeks:
  Short games never see turn 6-7 beats, Long games get a quieter back half
  (stochastic pool only). Harmless, but re-scale turn numbers or switch to
  fractional triggers if Short/Long get balance attention.
- US replay log persists to IndexedDB but there is no resume-from-Dexie path
  wired in the app, so persistence mainly guards the within-session results
  view; UK/country keep their logs in memory
- `src/persistence/remote.ts` is a deliberate stub (throws); backend sync is
  a future migration path
- Vite warns about >500 kB chunks; UK/country/leaderboard are already lazy,
  further code-splitting is optional
- "Endless mode" from the original prompt was dropped on purpose: the
  election date is the game clock, so length settings are the honest
  substitute.

## 5. How to run and test locally

```
npm install
npm run dev            # Vite dev server (game) on :5173
npm run server         # Express API + static serving on :3400
npm run server:watch   # same, with restart on change
npm run build          # tsc -b && vite build -> dist/
npm run test           # vitest, 33 files / 277 tests
npm run typecheck      # tsc --noEmit
npm run calibrate      # engine calibration suite only
npm run tauri:dev      # desktop shell; needs Rust toolchain (see docs/desktop.md)
```

The game runs fully offline against localStorage/IndexedDB; the server is
only needed for accounts, leaderboard, and entitlements.

## 6. Needs a human

- Steam and store art: take real in-game screenshots per docs/steam/assets.md
  and produce capsules at the listed dimensions. No AI-generated images of
  real politicians.
- Legal review of the privacy policy and terms text in LegalPage.tsx.
- Create the Discord server and replace the "coming soon" footer label.
- Tauri code-signing certificates (Windows cert, Apple Developer ID) and a
  machine with the Rust toolchain to produce and test desktop builds.
- Pricing decision for scenario packs on Steam, and the Steamworks
  entitlement integration that follows from it.
- App icon set for the desktop build (src-tauri references paths that do not
  exist yet).
