# CAMPAIGN — 2020

A single-player, turn-based **2020 U.S. general election** campaign simulator
(Biden/Harris vs. Trump/Pence). Inspired by *President Infinity*'s resource
management and *New Campaign Trail*'s branching demographic events, with a clean,
data-forward web UI.

> You are the campaign manager. Read the map, allocate finite resources each
> week, answer the moments that matter, and get to 270.

## Quick start

```bash
npm install
npm run dev        # play at the printed localhost URL
npm test           # engine unit + calibration tests
npm run calibrate  # just the 2020 calibration suite
npm run build      # static SPA → dist/ (Tauri-wrappable as-is)
```

No backend. The whole game runs client-side; saves go to IndexedDB.

## Architecture

The simulation engine is the core asset and is kept **completely isolated**:
`src/engine` is pure TypeScript with **zero React/DOM/browser dependencies**, so
it runs in the browser, in a Tauri shell, in tests, or headless for batch
calibration.

```
src/
  engine/        Pure, deterministic, seedable sim. The single source of truth.
    types.ts        Data model (Section 4)
    rng.ts          Seedable RNG (mulberry32) — determinism for undo/replay/tests
    setup.ts        createGame() + per-state baseline-margin solver
    voteModel.ts    The scoring model (Section 5): blocs → state → EV → winner
    actions.ts      9 campaign actions, all routed through the vote model
    events.ts       Events engine (applies authored event data)
    ai.ts           Tipping-point AI opponent (easy/normal/hard)
    turn.ts         advanceTurn(state, actions, seed) → newState  (PURE)
    polls.ts        Polls-with-noise + house effects (a blurred view of truth)
  content/       DATA ONLY — designers never touch engine code.
    issues.ts, blocs.ts, candidates.ts, states.ts, events.ts, mapLayout.ts
  persistence/   SyncProvider interface; LocalSyncProvider (Dexie/IndexedDB);
                 RemoteSyncProvider stub (cloud-save seam, not built)
  store/         Zustand store: canonical state, undo ring buffer, autosave
  ui/            React SPA — a pure function of engine state
```

### The vote model (why the map moves is always legible)

Each state's `prior2020BidenShare` (the real result) anchors a per-state
**baseline margin solve**: a single scalar is fitted so the turnout-weighted
aggregate of that state's demographic blocs reproduces 2020 exactly. Everything
the campaign does writes **margin deltas** into `campaignMargin` and logs a
human-readable **cause**. A bloc's two-party support is simply:

```
support_Biden(bloc) = sigmoid(baselineMargin + campaignMargin + momentumTerm)
```

Because every shift is an additive, logged cause, the "week in review" recap and
the end-game post-mortem can trace any poll move back to the ad, rally, event
answer, or gaffe that caused it (Pillar C).

### Determinism

`advanceTurn(state, actions, seed)` is pure: same inputs → same next state. This
powers undo (a snapshot ring buffer in the store), reproducible tests, and a
future server-authoritative multiplayer promotion with no engine rewrite.

## Calibration (the correctness test)

`npm run calibrate` asserts that **neutral, do-nothing play reproduces history**:

- Exactly **538** electoral votes across all contests (incl. ME/NE districts).
- **Biden 306 / Trump 232**, ~52% two-party popular vote.
- All seven battlegrounds (AZ, GA, WI, PA, NV, NC, FL) within 6 points.
- 1000 noisy neutral sims center near Biden ~306 EV, with the tossups genuinely
  swinging both ways.

## Scope

**In:** the 2020 general only, two tickets, 51 contests + ME/NE district splits,
Electoral College with a defined 269–269 contingent-election ending, weekly turn
loop (9 turns Sept 1 → Nov 3), resource allocation, events, AI opponent,
polls-with-noise, results + post-mortem, local saves + undo + JSON export/import.

**Out (deferred):** primaries, downballot, multiplayer, other years, modding,
governance. Cloud saves and the Tauri desktop wrapper are designed-for but not
built.
