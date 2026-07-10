---
stability: PRODUCT_CONTEXT
last_validated: 2026-07-10
status: ratified (direction brainstorm 2026-07-10)
supersedes: partial — re-frames the 2026-07-08 post-MVP sequencing (see §Why)
---

# The Saturday Bar — founder-worthy gate before the ride loop

> **Direction ratified 2026-07-10.** The founder will not dogfood a rough app —
> "I just don't want to dogfood it till I know it's good." So "good" is defined
> here as a **verifiable gate**, burned down **without founder usage** (agents
> stress-test in his place), and the founder's phone enters only at graduation
> (P3). After the bar is green, the weekly ride loop begins — and *that* loop,
> not forum research, ranks every future bet. If context is compacted, read
> this before proposing product direction.

## Why this exists (the decision)

- **MVP state:** Sprints 01–03 are all "In Progress" — functionality largely
  built (Sprint 01 heavily red-hat-remediated), but **no human-testing gate has
  been closed**, including the Sprint 03 D9 capstone (founder, real devices,
  full arc). "Kind of finished" = built-ish, not proven.
- **Felt problem (founder, 2026-07-10):** "the app as it stands is brittle …
  works but feels rough … honestly I haven't stress tested it. I'm not sure
  functionally what we're missing to make it a really pleasurable user
  experience and reliable."
- **Constraint:** no dogfooding until it's good. Founder goodwill is fuel;
  rough sessions burn it. The bar's job is to make ride #1 delightful enough
  that the ride loop self-sustains.
- **Key insight:** the first wave of "what's missing" is **already known** — a
  verified defect ledger (dot-routes, garbage headliner geometry, test rows in
  the rankings, empty enrichment table, dead-air loading) — so lived usage is
  not needed to start; and **agents can stress-test instead of the founder**
  (Maestro flows, metro runtime tools, review-ui survey loop).
- **Relation to the 2026-07-08 sequencing** (memory
  `post-mvp-direction-rn-enrichment-handoff-nav`): *stay on React Native* and
  *navigation always hands off to Google/Apple Maps* stand unchanged.
  **Superseded in framing:** enrichment is no longer "the next bet after
  geometry" — geometry-finish, enrichment, and feel are **three legs of one
  bar**, pursued as waves of a single push to "good," with the ride loop as
  the goal state.

## The bar

**LaneShadow has earned the founder's Saturday when every box below is
checked.** Nothing on this list requires riding with a rough app.

### Trust — the answers never lie

- [ ] **T1 — 100% plottable catalog.** Every route in `curated_routes` plots a
  real polyline; zero centroid-only routes remain. Path: quick-win recovery
  (562 parseable `A – B` endpoint names + Overpass name-pass over the 630
  clean-descriptive) → then execute the **gated drop** (explicit confirm at
  execution). Final catalog ≈ 2.5–3k honest roads.
- [ ] **T2 — flawless top-50.** The 50 highest-composite routes (the suggestion
  surface) individually verified: correct road, plausible length, no test/seed
  rows (`Test Route CO-04` etc.), no duplicate headliners (Cherohala ×2,
  Beartooth ×2, Going-to-the-Sun ×2, Million Dollar ×2), and the known garbage
  geometries (Beartooth 1,216 mi off, North Cascade 9,074 mi off, Cherohala /
  Coronado Trail / Haines truncated) re-geocoded or dropped.
- [ ] **T3 — clean stored data.** One score scale (0–1) in the *stored* rows
  (not read-path patches), sane lengths (no 710,430 mi), normalized states.
  This is the `curation-hardening` cleanup, applied at the store level.

### Richness — every road answers "why"

- [ ] **R1 — the "why" ships.** Every detail view renders a grounded
  one-paragraph "why this road is worth riding" from a real
  `curated_route_enrichments` pipeline (LLM over geometry/elevation/POIs,
  optionally vision over Street View), **quality-gated against hallucination**.
  Today that table has 0 docs and detail = name + bars + a line. This is O1 in
  `prds/mvp/11-post-mvp-opportunities.md` — rider-validated as the single
  biggest fix to discovery's weakest step.
- [ ] **R2 — the couch test.** For ~10 roads the founder personally knows, the
  generated "why" reads true. Twenty minutes with coffee, not a ride.

### Feel — no dead air, no dead ends

- [ ] **F1 — every async moment shows life.** Chat streams or shows progress
  within ~1s; card-tap → plot has a visible transition; detail opens with
  skeletons; never a blank screen.
- [ ] **F2 — survey findings fixed.** A `review-ui` survey runs against the
  real build (agents + screenshots); every HIGH-severity finding is fixed in a
  polish loop and re-verified visually.
- [ ] **F3 — honest failure states.** Denied location, airplane mode, empty
  results, Convex hiccups — each lands on an honest, recoverable state, never
  a hang or a lie.

### Proof — stressed by agents, not by the founder

- [ ] **P1 — stress battery green.** ~50 varied discovery queries, kill/relaunch,
  offline, denied permissions, all top-50 routes plotted through — zero
  crashes/hangs. Built once (Maestro + metro MCP), kept as regression.
- [ ] **P2 — MVP gates pass.** The already-specced Sprint 01/02 Maestro human-
  testing gates pass on a real build.
- [ ] **P3 — graduation capstone.** The Sprint 03 D9 capstone: founder, real
  iPhone + Android, full discover→detail→save→ride-handoff arc, once (~30 min).
  This is the *last* box, and the first real ride is the diploma.

## Waves

| Wave | Legs | Content | Rough size |
|---|---|---|---|
| **1** | Trust | Re-geocode Queue-B garbage headliners; quick-win recovery (endpoint-parse 562 + Overpass name-pass 630); kill test rows; dedup; store-level score/length/state cleanup; **gated drop** → 100%-plottable catalog | ~1 week (mostly specced in `prds/catalog-geometry-recovery/` + `prds/curation-hardening/`) |
| **2** | Richness ∥ Feel | Enrichment pipeline + detail rendering (needs PRD — author from O1); review-ui survey → polish loop; F1/F3 loading & failure states; close Sprint 01/02 remainders | ~2–3 weeks, parallelizable |
| **3** | Proof | Stress battery → Sprint 01/02 gates → D9 capstone | days |

Target: **bar green by mid-August** → August–October riding season runs the
reward loop.

## Explicitly NOT NOW

Weather-window (O2), waypoints/composition (O3), personalization (O4),
community/share, library/revenue, offline-first substrate, on-device AI,
native rewrite. All queued, none deleted. **The ride loop re-ranks them with
real evidence** — expectation from forum research is weather-window next, but
actual rides decide.

## After green — the ride loop

1. Ride with it weekly (the N=1 success picture: "I ride with it weekly" by
   October).
2. Capture friction per ride (voice memo / one-line note — lightweight, no
   process).
3. Fix in small weekly loops; re-ride.
4. When a *functional* gap recurs across rides (e.g. "I keep wanting a
   go/no-go weather answer"), that's the next bet — now backed by lived
   evidence instead of other riders' forum posts.

## Planning pointers

- **T-leg:** `.spec/prds/catalog-geometry-recovery/00-overview.md` (recover →
  triage → drop pipeline + gates) and `triage.md` (queues + immediate-action
  findings); `.spec/prds/curation-hardening/` (dedup + normalization).
- **R-leg:** **no PRD exists yet** — author from
  `prds/mvp/11-post-mvp-opportunities.md` §O1. (Note: a prior memory claim
  that an enrichment/STEER delta PRD was "already scaffolded" was
  cross-project contamination — nothing in this repo mentions STEER.)
- **F-leg:** `/review-ui` survey + polish mode; remaining Sprint 01/02 tasks in
  `prds/mvp/ROADMAP.md`.
- **P-leg:** Maestro flows under the sprint task dirs + metro MCP;
  Sprint 03 capstone task (`prds/mvp/tasks/sprint-03-on-device-d9-capstone/`).
- **Memory:** `post-mvp-direction-rn-enrichment-handoff-nav` (updated to this
  framing), `curated-catalog-geometry-8pct-incomplete` (catalog state).
