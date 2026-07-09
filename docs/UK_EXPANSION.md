# CAMPAIGN — UK Expansion Mega Plan

Turn the 2020 U.S. simulator into a multi-system game where **every modern UK
general election (1979–2024)** is playable, on a **regional map** where polling %
drives **seats** the way polling % drives electoral votes in the U.S.

---

## Implementation status (live)

**Playable today:** pick 🇬🇧 from the country screen → choose an election and a
party → campaign across the 12 regions → win seats → form a government.

| Phase | Scope | State |
|---|---|---|
| P0 | System abstraction (`PoliticalSystem`, `PartyId`, allocation strategy) | ✅ done |
| P1 | N-party engine: softmax vote model (US = N=2 special case, proven identity) | ✅ done |
| P2 | Regional seats curve (swing-elasticity on real baseline) + hung-parliament/coalition formation | ✅ done |
| P3 | UK content + calibrated setup (IPF solve), NI sub-system, multiparty AI | ✅ done |
| P4 | UK UI on the real design system: battleground country picker, **real-boundary geographic region map** (ONS/EER TopoJSON for the 12 ITL1 regions + NI, decoded → projected → simplified SVG paths via `scripts/build_uk_paths.cjs`; geo/square toggle), EvBar-style seat bar, region detail (vote-share + per-party bars), national standings, 3-step setup wizard with historical leaders, **full 10-verb action grid + 7-day planner + live what-if seat delta (US parity)**, news ticker, hung-parliament results | ✅ done |
| P5 | Elections authored: **1951, 1979, 1983, 1987, 1992, 1997, 2001, 2005, 2010, 2015, 2017, 2019, 2024** — each with real regional results, historical leaders & issue salience; every one reproduces the right winner + government type at neutral | ✅ done |
| P6 | Northern Ireland (DUP/SF/UUP/SDLP/Alliance) + Sinn Féin abstention math | ✅ done |
| P7 | Multiparty AI (shared `multipartyAi` with easy/normal/hard) | ✅ done |
| P8 | Campaign events deck (stochastic, traceable) + player-choice events | ✅ done |
| P9 | Per-election boundary pools (1951–2024 chamber sizes) + next-scenario retention | ✅ done |

**Remaining:** TV-debate events; richer demographic profiles per region; optional
650-constituency sim for power users.

**Tests:** UK calibration asserts every authored election reproduces the right
winner and government type, with region seats summing to that year's boundary
pool (not a fixed 650).

Engine modules: `engine/system.ts`, `engine/multiparty.ts`, `engine/ukSetup.ts`,
`engine/ukGame.ts`, `engine/mpTurnHelpers.ts`. Content: `content/uk/*`,
`content/nextScenario.ts`. UI: `ui/uk/*`, `store/ukStore.ts`.

---

## Decisions (locked)

| Decision | Choice |
|---|---|
| Seats from votes | **Region-level seats curve** — ~12 regions, per-party vote share → seats via a calibrated FPTP disproportionality curve, solved so neutral play reproduces the real seat count. No 650-constituency sim. |
| Election span | **Modern era 1979–2024** — 13 scenarios: 1979, 1983, 1987, 1992, 1997, 2001, 2005, 2010, 2015, 2017, 2019, 2024 (2010 carries the hung-parliament/coalition ending). |
| Parties / nations | **Full GB + NI** — Con, Lab, LD, SNP, Plaid Cymru, Green, Reform/UKIP/Brexit; NI modeled as its own sub-system (DUP, Sinn Féin, UUP, SDLP, Alliance). |
| Engine strategy | **Generalize to N parties** — one shared engine. Two-party (`dem`/`rep`) becomes the N=2 special case via softmax. The existing U.S. calibration suite is the guardrail that the U.S. path stays byte-identical. |

## Why this is a rearchitecture, not a content pack

The engine is deeply two-party and electoral-college shaped today:

- `CandidateId = "dem" | "rep"` is hard-wired across `engine/`, `ui/`, `store/`.
- The whole vote model is a **binary sigmoid**: `support_dem(bloc) = sigmoid(baselineMargin + campaignMargin)` (`voteModel.ts:15`). One scalar margin = Biden − Trump.
- Allocation is **winner-take-all electoral votes** to 270 (`voteModel.ts:66`), with ME/NE district aggregates.
- `setup.ts` solves a single per-state scalar so neutral play reproduces 2020.
- Calibration asserts U.S. specifics (538 EV, Biden 306, 7 battlegrounds).

UK is multiparty, FPTP→seats, hung-parliament math, 4 nations, and a coalition
ending. The scenario layer (`content/scenarios.ts`) and the tile-grid map
(`content/mapLayout.ts`) are already clean seams — but the **engine core** has to
become party-count-agnostic and allocation-strategy-agnostic.

The guiding invariant, unchanged: *every shift is an additive, logged cause, so
any poll/seat move traces back to the ad/rally/event that caused it.*

---

## 1. Target architecture: "political system" as a first-class concept

Introduce a `PoliticalSystem` that a scenario belongs to. It supplies the party
list, the bloc taxonomy, the issue set, the map, and — critically — the
**allocation strategy** (how local vote shares become the seats/EVs that decide
the contest).

```
PoliticalSystem
  id: "US" | "UK"
  parties: Party[]                       // dem/rep  OR  con/lab/ld/snp/pc/grn/ref/...
  blocs: BlocDef[]                        // US demographics OR UK demographics
  issues: Issue[]                         // US issues OR UK issues
  map: TilePos[]                          // cartogram tiles
  allocation: AllocationStrategy          // winnerTakeAll(EV)  OR  regionalSeatsCurve
  majority: MajorityRule                  // 270 of 538  OR  326 of 650 (SF-abstention adjusted)
  outcome: OutcomeModel                   // EV winner / contingent  OR  largest party / hung / coalition
```

A `Scenario` picks a system and fills its slots with one election's leaders,
priors, salience, and (UK) regional seat totals — exactly how scenarios already
fill the dem/rep slots today.

---

## 2. Data-model changes (`engine/types.ts`)

The refactor is mechanical but wide. Core moves:

- **`CandidateId` → `PartyId` (string), plus a per-scenario party list.** Keep
  `"dem"`/`"rep"` as the U.S. ids so U.S. content is untouched. UK ids:
  `con, lab, ld, snp, pc, grn, ref` (+ NI: `dup, sf, uup, sdlp, apni`).
- **Bloc scoring: scalar margin → per-party appeal vector.**
  - `baselineMargin: number` → `baselineAppeal: Record<PartyId, number>` (logit-space appeal per party).
  - `campaignMargin: number` → `campaignAppeal: Record<PartyId, number>`.
  - `support: Record<CandidateId, number>` is already a record → `Record<PartyId, number>`.
  - **N=2 identity (keeps U.S. byte-identical):** softmax over `{dem: m, rep: 0}`
    yields `share_dem = e^m/(e^m+1) = sigmoid(m)`. Set the U.S. appeal to
    `{dem: oldMargin, rep: 0}` and the model is mathematically unchanged.
- **`StateContest` → `Contest`** with `seats` (UK) coexisting with
  `electoralVotes` (US). A UK "contest" is a **region** with a seat pool.
- **`BlocId`** becomes a per-system string set (widen the union, or make it
  `string` validated against the active system's bloc list).
- **`Region`** union (`Northeast|South|…`) generalized / per-system.
- New: `AllocationStrategy`, `MajorityRule`, `SeatResult`, hung-parliament fields
  on `GameResult`.

`CauseEntry`, `TurnPoint`, `Resources`, actions, events — all already keyed by
candidate/record, so they widen to `PartyId` cleanly.

---

## 3. The vote model: sigmoid → softmax (`engine/voteModel.ts`)

```
// N-party generalization of blocDemShare()
shares(bloc) = softmax_p( baselineAppeal[p] + campaignAppeal[p] + momentumTerm[p] )
```

- `blocDemShare` is kept as a thin `N=2` wrapper so nothing U.S.-side changes.
- `tallyContest` sums `size * turnout * enthusiasm * share_p` per party → a
  per-party vote total for the contest, instead of dem/rep votes.
- `momentum` becomes per-party (or a leader-vs-field scalar that maps into the
  appeal of the surging party). Start simple: per-party momentum coupling,
  zero at neutral so U.S. calibration is untouched.

---

## 4. Seats from vote share: the regional seats curve

This is the heart of the UK model and the answer to "polling % controls # of
seats." Each region has a fixed **seat pool** (e.g. London 75, Scotland 57). The
strategy converts the region's per-party vote shares into integer seats with a
**calibrated disproportionality curve**:

```
seat_weight_p = efficiency[region][p] * share_p ^ k[region]
seats_p       = largestRemainder( seatPool * seat_weight_p / Σ seat_weight , seatPool )
```

- **`k[region] > 1`** is the FPTP "decisiveness" exponent — it rewards the
  regional leader (winner's bonus) the way FPTP does. `k = 1` would be pure
  proportional; real UK behaves like `k ≈ 1.5–2.5`.
- **`efficiency[region][p]`** captures vote *distribution*, not just size: the
  SNP's concentrated Scottish vote converts far better than the Greens' spread
  vote or the LibDems' (region-dependent) efficiency. This is the lever that lets
  a 4% national party win 0 seats while a 4% regional party wins 40.
- **Largest-remainder rounding** keeps the region's seats summing exactly to its
  pool — the UK analog of "538 EV by construction."

**Calibration (the correctness test, mirroring the U.S. baseline solve):**
1. Solve each region's per-bloc baseline appeals so the region's **vote shares**
   match the real result for that election (the `setup.ts` solve, generalized).
2. Solve `k[region]` and `efficiency[region][p]` so neutral play reproduces the
   region's **real seat counts** (and thus the national total).
3. Assert: neutral do-nothing play reproduces the actual 1979–2024 seat results
   within tolerance, and the national seat total = 650.

NI option: run the same curve over NI's 18 seats with NI parties, or (fallback)
pin NI seats to history as a fixed bloc. Plan models it properly; pinned is the
de-risking fallback.

---

## 5. Outcome: hung parliaments & coalitions

- Majority rule: **326 of 650**, with a toggle for the *effective* majority
  (~320) once Sinn Féin abstention + the Speaker are netted out.
- `GameResult` gains: `seats: Record<PartyId, number>`, `largestParty`,
  `hung: boolean`, and a `government` outcome (single-party majority / minority /
  coalition / confidence-and-supply).
- Results screen models the post-election arithmetic the way the U.S. version
  models the 269–269 contingent election: who can reach 326, plausible
  coalitions (2010 Con+LD, 2017 Con+DUP C&S, 2010-style scenarios), and a
  narrative call. This reuses the existing "contingent ending" seam.

---

## 6. Content build-out (`content/uk/`)

Designers never touch engine code — same contract as today. New data:

- **`parties.ts`** — GB + NI parties: id, name, colour, leader-as-principal.
- **`regions.ts`** — 12 ITL1 regions (NE, NW, Yorks & Humber, E Mid, W Mid, East,
  London, SE, SW, Scotland, Wales, NI), each with a seat pool and demographic
  profile (the UK analog of `STATE_SEEDS`).
- **`blocs.ts`** — UK bloc taxonomy: age (under-30 / pensioner), class (ABC1 /
  C2DE), education (graduate / non-graduate), tenure (homeowner / renter),
  Leave/Remain, and nation (Scottish / Welsh) blocs that carry SNP/Plaid appeal.
- **`issues.ts`** — UK issues: economy, NHS, immigration, Europe/Brexit, cost of
  living, crime, housing, climate, Scottish independence, taxation, defence.
- **`leaders.ts`** — party leaders as campaign principals with traits (the
  `Candidate` analog): Thatcher, Foot/Kinnock/Smith/Blair/Brown/Miliband/
  Corbyn/Starmer, Steel/Ashdown/Kennedy/Clegg/Cable/Davey/Farron/Swinson,
  Salmond/Sturgeon, Farage, etc. "Running mate" → key surrogate / chancellor.
- **`scenarios.ts`** — the 13 elections, each: system=UK, leaders in party slots,
  per-region vote-share priors, regional seat pools for that boundary set, and
  national issue salience (Europe spikes in 2015/2019; cost-of-living in 2024;
  the Falklands afterglow in 1983; the Iraq drag in 2005).
- **`events.ts`** — UK campaign beats (manifesto launches, the 2010 "I agree with
  Nick" debates from 2010 on, 1992 Sheffield rally, 2017 dementia tax, 2019
  "get Brexit done," Gillian Duffy, the Sun front pages).

Boundary changes are handled per-scenario: each election ships its own region
seat pools and priors (1983, 1997, 2010, 2024 boundary reviews differ), exactly
like the U.S. per-cycle `evOverrides`.

---

## 7. UI changes (`ui/`)

- **Map**: `USMap.tsx` → a system-agnostic `ContestMap` reading the active
  system's tiles and colouring each contest by **winning party** (multi-colour,
  not 2-colour). UK tiles = the 12 regions; a region shows its seat split.
- **Seat bar**: `EvBar` → `SeatBar` showing an N-party seat tally toward 326,
  with a hung-parliament zone.
- **Region panel**: `StatePanel` → shows per-party vote share + projected seats +
  the swing that flips the next seat.
- **Results**: hung-parliament arithmetic + coalition builder + post-mortem.
- **Colours/labels**: party palette (Con blue, Lab red, LD orange, SNP yellow,
  Green, Reform turquoise, Plaid, DUP, SF…), system-aware labels.
- Setup screen: pick system → election → party you lead.

---

## 8. AI, events, polls

- **AI** (`ai.ts`): today it's a tipping-point optimiser for one opponent.
  Generalize to **N−1 AI parties**, each optimising its own seat yield (defend
  marginal regions, attack the leader's soft regions). Tiered easy/normal/hard
  preserved.
- **Events** (`events.ts`): already data-driven; widen effects to per-party
  appeal. Debates become multi-leader (2010+); pre-2010 elections have no TV
  debates — a nice period-accurate flavour gate.
- **Polls** (`polls.ts`): per-party polling with house effects; UK polling noise
  is famously larger (1992, 2015, 2017 misses) — a knob for "shy Tory"/late-swing
  drama.

---

## 9. Testing & calibration

- **U.S. guardrail (must stay green the whole time):** existing
  `calibration.test.ts` is the contract that the N-party refactor didn't change
  the two-party path. Run it after every engine commit in Phase 1.
- **UK calibration:** new suite asserting neutral play reproduces each 1979–2024
  result within tolerance — national seats, largest party, hung vs majority, and
  the headline regional splits (Scotland SNP wave 2015, Red Wall 2019, Blair
  landslide 1997).
- **Seat-curve unit tests:** monotonicity (more votes ⇒ ≥ seats), region sums to
  pool, national sums to 650, SNP-efficiency sanity.

---

## 10. Phased roadmap

Each phase is independently shippable and leaves the build + U.S. game working.

**P0 — Abstraction scaffold.** Introduce `PoliticalSystem`, `PartyId`,
`AllocationStrategy` types. No behaviour change; U.S. wired as a system. Exit: U.S.
calibration green, build passes.

**P1 — N-party engine (riskiest).** sigmoid→softmax, scalar margin→appeal vector,
per-party tally, winner-take-all expressed as a strategy. U.S. = N=2 special case.
Exit: `npm run calibrate` byte-identical (Biden 306, 538 EV).

**P2 — Regional seats curve + hung parliament.** Implement `regionalSeatsCurve`,
the calibration solve for `k`/efficiency, majority/outcome model. Exit: a
hand-built UK test region returns sane seats; 650 total holds.

**P3 — UK content vertical slice (2024 only).** Parties, regions, blocs, issues,
2024 leaders + priors + seat pools + salience. One fully playable UK election,
ugly UI ok. Exit: neutral 2024 reproduces real seats within tolerance.

**P4 — UK UI.** ContestMap, SeatBar, RegionPanel, party palette, hung-parliament
results + coalition builder, setup flow. Exit: 2024 is fun to play end-to-end.

**P5 — The other elections.** ✅ All modern elections (1951 + 1979–2024) authored
with real regional priors, leaders & salience; every one calibrates green
(right winner + government type). Per-cycle boundary pools set chamber size
(625 / 635 / 646 / 650 / 651 / 659) from the review in force that year.

**P6 — NI sub-system.** DUP/SF/UUP/SDLP/Alliance over 18 seats, abstention-aware
majority. Exit: NI seats reproduce history; effective-majority math correct.

**P7 — AI for N parties.** ✅ Shared multiparty AI with easy/normal/hard tiers.

**P8 — UK events & polish.** Manifesto launches, debates (2010+), historical
beats, period-accurate flavour, polling-miss drama. Exit: each election *feels*
like its year.

**P9 — Boundaries + retention.** ✅ Per-election seat pools; shared UK/country
turn helpers; next-scenario chain on results screens.

---

## 11. Risks & mitigations

- **Breaking U.S. calibration** → P1 is gated on the calibration suite; the N=2
  softmax identity is proven, not hoped. Commit small, run calibrate each step.
- **Seat curve won't fit history with one knob** → per-region `k` + per-party
  `efficiency` gives enough degrees of freedom; if a region still misfits, allow a
  small per-party seat offset (a "lumpiness" residual), still solved at setup.
- **NI complexity sinks the schedule** → P6 is late and isolated; pinned-NI is the
  fallback that still lets every election ship.
- **Boundary changes across 45 years** → handled as per-scenario region seat
  pools + priors, identical pattern to U.S. `evOverrides`; no engine cost.
- **Scope creep ("all elections" → more pre-1979)** → 1951 ships as the early
  anchor; further mid-century years stay optional.

## 12. Deferred / future

Devolved & Holyrood/Senedd elections, by-elections, the 650-constituency
high-fidelity mode (the abstraction supports swapping the allocation strategy),
manifesto-as-policy-platform depth, multiplayer (the pure `advanceTurn` already
supports server-authoritative promotion).
