---
stability: TEST_SPEC
last_validated: 2026-07-11
prd_version: 3.1.0
---

# E2E / Human Testing Criteria — Route & Agent Quality

Version 3.1.0 · 2026-07-11 · **94 criteria across 26 UCs** — every AC referenced by ≥1
criterion. Types: [human-gate] · [e2e-automated] (Maestro, iOS sim, live dev deployment) ·
[integration-test] (vitest vs real dev deployment; pipeline tier hits REAL Google + LLM APIs;
agent tier includes fixtured-seam transcript replay) · [api-contract] · [build-gate]. AC refs
are positional within each UC (AC-1 = first ☐).

## HYG: Catalog Hygiene

### UC-HYG-01: Normalize the editorial score scale

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-HYG-001 | ÷100 pass normalizes all out-of-scale rows at rest | AC-1, AC-2, AC-3 | [integration-test] | Real dev deployment; seed 3 rows with 0–100 scores; run `normalizeEditorialScores` | Changed-count equals seeded out-of-scale count; direct table query returns 0–1 values; `scoreScaleNormalizedAt` stamped |
| T-HYG-002 | Second run is a no-op (idempotent) | AC-4 | [integration-test] | Re-run the pass after T-HYG-001 | Changed-count = 0; no score value differs from the first run's output |
| T-HYG-003 | Catalog-wide invariant: no composite score > 1.0 | AC-5 | [integration-test] | After full pass on dev data | Full-table scan finds zero rows with compositeScore > 1.0 |

### UC-HYG-02: Merge duplicate route groups

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-HYG-004 | Dup groups detected and canonical selected by geometry+score | AC-1, AC-2 | [integration-test] | Seed a 3-row "Cherohala Skyway" group (one with gate-passing geometry); run `dedupeGroups --dryRun` | Plan lists the group; canonical is the gate-passing/highest-score row; shadows listed |
| T-HYG-005 | Founder reviews the plan before commit | AC-3 | [human-gate] | `dedupeGroups --dryRun` output on real dev data | Founder confirms canonical-vs-shadow selection for each group before the commit run |
| T-HYG-006 | Shadows excluded from every suggestion surface | AC-4, AC-5 | [integration-test] | After committed merge; query `listCuratedRoutes` + name search | No `duplicateOf` row in any result; "Cherohala Skyway" search returns exactly one row |

### UC-HYG-03: Quarantine length outliers, zero-length, and test rows

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-HYG-007 | Zero-length + outlier rows flagged with reasons | AC-1, AC-4 | [integration-test] | Seed rows with length 0 and 5,000 mi; run `fixLengthOutliers` | Both rows carry `quarantine` with the correct reason; zero-length row's claimed length nulled |
| T-HYG-008 | Test/seed-named rows quarantined | AC-2 | [integration-test] | Seed a "Test Route CO-04" row; run `quarantineTestRows` | Row carries `quarantine.reason='test_row'`; never appears rider-ready |
| T-HYG-009 | Quarantined rows excluded from rider-ready | AC-3, AC-6 | [integration-test] | After T-HYG-007/008 + `recomputeRiderReady` | No quarantined row has `riderReady=true`; no rider-ready row reports length ≤0 or >1,000 mi |
| T-HYG-010 | Recovery clears length quarantine with measured truth | AC-5 | [integration-test] | Recover geometry for the nulled-length row via a real lever run | Quarantine cleared; stored length = routed length within sane range |

### UC-HYG-04: Normalize state strings

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-HYG-011 | Dirty variants canonicalize; multi-state preserved | AC-1, AC-2, AC-3 | [integration-test] | Seed `New-York`, `North-Carolina`, `Alabama / Mississippi / Tennessee`; run `normalizeStates` | All resolve to canonical forms; the tri-state row keeps an ordered 3-state set; variant pairs unify |
| T-HYG-012 | Pass reports count and is idempotent | AC-4, AC-5 | [integration-test] | Run twice | First run reports changed-count; second run reports 0 changed |

## REC: Geometry Recovery

### UC-REC-01: Promote validated in-row scraped polylines (Lever 1)

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-REC-001 | Real BBR in-row polyline promotes with provenance at $0 | AC-1, AC-2, AC-3, AC-4 | [integration-test] | Real dev deployment; a real BBR row with in-row `routePolyline`; run `promoteForRoute` | Side-table row created with `verification.verdict='pass'`, `provenance='scraped_promoted'`; zero external API calls made (no keys touched) |
| T-REC-002 | Gate-failing in-row line is not promoted; falls through | AC-5 | [integration-test] | Seed a row whose in-row line decodes to 3× claimed length | No `generated` status from lever 1; route remains eligible for the next lever (or `review` if terminal) |
| T-REC-003 | Lever-1 report shows promoted vs rejected counts | AC-6 | [api-contract] | `backfillPromote {sample:10}` on real data | Report contains promoted + rejected counts summing to processed |

### UC-REC-02: Reconstruct geometry from turn-by-turn descriptions (Lever 2)

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-REC-004 | PoC route reconstructs end-to-end on real APIs | AC-1, AC-2, AC-3, AC-4, AC-5 | [integration-test] | Real dev deployment + real LLM + real Google; `reconstructForRoute` on Twist of Tepusquet Loop | Persisted `generated` row with `ai_reconstructed`, ratio ∈ [0.6,1.6] (PoC baseline 1.00, 7 anchors); anchors[] persisted; all anchors ≤150 mi from centroid |
| T-REC-005 | Off-region anchor is rejected during geocoding | AC-2 | [integration-test] | Fixture LLM seam returns one anchor 300 mi away; real gate path | That anchor excluded from routing; geocode log records the rejection |
| T-REC-006 | Gate-failing reconstruction enters the repair round, never persists as servable | AC-6 | [integration-test] | Old Hwy 40 (real PoC REVIEW case) via `reconstructForRoute` | No `generated` status on first failure; repair round runs; final state `review` with both attempts recorded |
| T-REC-016 | **Spike gate (§5): geometry reference flow proven end-to-end before the REC deep build** | AC-5 | [human-gate] | ONE real PoC route reconstructed through a Convex action (real LLM + real Google) → gate → persist `ai_reconstructed` → `recomputeRiderReady` → `listCuratedRoutes` returns it (pin the mode: national-best AND nearest) → Maestro plots it from a cold boot. **Decoupling:** anchor extraction may use a direct AI-SDK completion so this spike does NOT depend on the §5b Mastra-in-Convex spike; if it uses the Mastra structured-output primitive instead, sequence it AFTER T-AGT-023 | Founder observes the recovered line plotted on the sim from a cold boot; the gate→query→render seam is green through the turnkey runners; recorded as the prerequisite that unblocks the REC deep build |

### UC-REC-03: Re-route from endpoints or road names (Lever 3)

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-REC-007 | Endpoint-named route re-routes with provenance on real APIs | AC-1, AC-2, AC-3, AC-4, AC-5 | [integration-test] | Real dev deployment + real Google; `rerouteForRoute` on a real `A – B`-named row (e.g. Route 680 — Alameda County) | Deterministic parse yields endpoints; persisted line passes gate + region check; `provenance='name_routed'`; measured result visible in report |
| T-REC-008 | Gate-failing re-route goes to REVIEW, not storage | AC-6 | [integration-test] | Seed an endpoint-named row whose claimed length is 10× the real road distance | `geometryStatus='review'`; no `generated` row; failure reason recorded |

### UC-REC-04: Orchestrate the resumable rescue waterfall

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-REC-009 | Waterfall order: first PASSing lever wins and stamps provenance | AC-1, AC-2 | [integration-test] | Mixed seeded pool (in-row poly + turn-by-turn + endpoint-named); run levers in order | Each route resolved by the earliest applicable lever; provenance matches the winning lever |
| T-REC-010 | Kill + restart resumes without reprocessing PASSed routes | AC-3 | [integration-test] | Kill the driver mid-batch; re-run same command | Already-`generated` routes skipped (original `verifiedAt` preserved — proof of no re-spend); totals converge to an uninterrupted run's |
| T-REC-011 | Every processed route ends in exactly one terminal state | AC-4 | [integration-test] | After a full sample batch | Each processed routeId is exactly one of `generated` / `review` / retirement-eligible; none untouched-but-marked |
| T-REC-012 | Live per-lever/per-state counts + cost telemetry | AC-5, AC-6 | [api-contract] | `backfillReconstruct` report + `coverageReport` during a run | Report exposes per-lever counts and running call/cost counters within the ~$0.07/route envelope |
| T-REC-017 | Realized-yield acceptance gate: batch not "complete" on low yield | AC-7 | [human-gate] | After a full (or full-sample) batch on real dev data: `coverageReport` per-lever PASS rates + realized rider-ready count vs the expected-yield table | Founder records accept/reject on the realized numbers; a per-lever rate far below its estimate (e.g. reconstruct <40%) surfaces as an escalation, not a silent completion; retirement stays locked until acceptance is recorded |
| T-REC-018 | **Founder-region coverage gate (the Saturday test)** on the real post-batch catalog | AC-8 | [human-gate] | Cold boot near SLC/Ogden on the REAL, un-seeded catalog after the batch; no fixtures | Founder asks "scenic rides near SLC", gets ≥ threshold rider-ready options with real distances, browses → taps → plots → saves end to end; the previous catalog's near-Ogden failure (3 routes ≤30 mi, 0 plottable) is demonstrably fixed on real data |

### UC-REC-05: Retire only after every lever fails

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-REC-013 | Retirement-eligibility requires all-lever failure | AC-1, AC-2 | [integration-test] | A route that fails levers 1–3 on real APIs vs one that passed lever 2 | Only the all-failed route is retirement-eligible; the classifier-rescuable route is not |
| T-REC-014 | Founder reviews candidates with failure reasons before commit | AC-3, AC-4 | [human-gate] | `listGeometryReviewQueue` + retirement candidate list on real data | Founder sees per-route failure reasons; retirement requires explicit confirm; nothing auto-retires |
| T-REC-015 | Retirement is reversible with record preserved | AC-5 | [integration-test] | `retireRoute` then `unretireRoute` on a test route | Row never deleted; `retirementReason` recorded; un-retire restores prior status + flag recompute |

## VER: Verification & Review

### UC-VER-01: Enforce the deterministic geometry gate

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-VER-001 | Ratio band enforced at the boundaries | AC-1 | [integration-test] | Seeded lines at ratio 0.59 / 0.61 / 1.59 / 1.61 through the real persist path | 0.61 and 1.59 admit; 0.59 and 1.61 → `review`; verification block records exact ratio |
| T-VER-002 | Anchor count + region preconditions enforced | AC-2 | [integration-test] | Fixture LLM seam yields 1 valid anchor; run reconstruct | Route → `review` with reason (insufficient anchors); no routing call made |
| T-VER-003 | Degenerate geometry rejected | AC-3 | [integration-test] | Seed a 2-point line and a 10-point/50-mi line via lever-1 path | Both rejected as degenerate; `verification.degenerate=true`; never `generated` |
| T-VER-004 | Gate re-evaluates pre-existing rows | AC-4 | [integration-test] | Run the gate sweep over seeded legacy `generated` rows incl. one wrong-length Overpass fetch | The wrong-length legacy row flips to `review`; correct rows stay `generated` |
| T-VER-005 | Quarantined claimed length yields ratio-skip mode | AC-5 | [integration-test] | Nulled-length row through a real lever | Admission decided by degenerate + region checks; routed length stored as truth |
| T-VER-006 | Rejected route exposes which condition failed | AC-6 | [api-contract] | Any `review` row from T-VER-001..003 | Queue entry names the failed condition (ratio / anchors / degenerate) |

### UC-VER-02: Run the bounded LLM repair round

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-VER-007 | Failure evidence feeds the repair attempt | AC-1 | [integration-test] | Fixture LLM seam capturing the second prompt; force first-attempt gate fail | Second LLM call's input contains the geocode log + routed/claimed lengths |
| T-VER-008 | Attempt budget hard-capped at 2; better attempt kept | AC-2, AC-3 | [integration-test] | Old Hwy 40 real run (PoC: 91.7 → 25.9 mi) | Exactly 2 attempts recorded; kept candidate is the ratio-closer one; a passing repair persists as `generated` |
| T-VER-009 | Post-budget failure is fail-closed to REVIEW | AC-4, AC-5 | [integration-test] | Old Hwy 40 continued | Final `geometryStatus='review'`; both attempts' lengths + verdicts visible to the operator; never `riderReady` |

### UC-VER-03: Classify ride-worthiness across the whole catalog

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-VER-010 | Classifier runs catalog-wide incl. freeway rows, verdict recorded | AC-1, AC-2, AC-5 | [integration-test] | Real dev deployment + real low-tier LLM; sample incl. "Route 680--Alameda County" + a known twisty | Every sampled route gains a persisted `rideWorthiness` verdict + reason; verdicts are stored fields, not read-time |
| T-VER-011 | `not_a_ride` blocks rider-ready despite valid geometry | AC-3 | [integration-test] | Freeway row with gate-passing `name_routed` geometry + `not_a_ride` verdict | `riderReady=false`; absent from all suggestion queries |
| T-VER-012 | Cross-provider separation + marginal never auto-retires | AC-4, AC-5 | [build-gate] + [integration-test] | Grep tier config; seed a `marginal` verdict | Classifier tier provider ≠ geometry tier provider; `marginal` row not retirement-eligible from the verdict alone |
| T-VER-013 | Founder can read verdict + rationale per route | AC-6 | [api-contract] | Query a classified route | Verdict, reason, model, classifiedAt retrievable by routeId |

### UC-VER-04: Hold gate failures in a REVIEW queue

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-VER-014 | Every post-budget failure lands in the queue, incl. no-candidate cases | AC-1 | [integration-test] | One ratio-fail route + one <2-anchors route | Both appear via `listGeometryReviewQueue`; the no-candidate route has status `review` with no side-table line |
| T-VER-015 | REVIEW rows excluded from rider-ready surfaces | AC-2 | [integration-test] | After T-VER-014 + recompute | Neither route in `listCuratedRoutes` or discovery results |
| T-VER-016 | Queue lists reason + best candidate; founder dispositions recorded | AC-3, AC-4, AC-5 | [integration-test] + [human-gate] | Founder runs approve / retry / retire on three queue items | Each disposition persisted and auditable; approve → `generated`+recompute; retry → re-queued; retire → `retired` |

### UC-VER-05: Gate the full batch on a founder couch-sample

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-VER-017 | Sample is ~25 and stratified across provenance + difficulty | AC-1 | [integration-test] | `geometry-couch-sample.ts` after a real `--sample` run | Manifest contains ~25 routes spanning all three provenance values and non-trivial difficulty spread |
| T-VER-018 | Founder reviews rendered lines + records verdicts | AC-2, AC-3 | [human-gate] | Local PNG renders + `recordCouchVerdict` | Founder records true/off/wrong per route + overall verdict; verdicts persisted on route docs |
| T-VER-019 | Full batch is blocked until pass; one `wrong` forces red | AC-4, AC-5 | [integration-test] | `couchGateStatus` with a seeded `wrong` verdict; driver `--all` attempt | Driver refuses `--all` while status ≠ pass; clearing the `wrong` + meeting threshold unlocks |
| T-VER-020 | **Top-50-by-rank founder review** (FOUNDER-BAR T2), independent of the couch sample | AC-6 | [human-gate] | Post-hygiene, post-gate top-50 curated routes by composite rank rendered for review on real dev data | Founder confirms each of the first-surface top-50 is the correct road at plausible length, no duplicate headliner, no test/seed row; a single wrong-road or dup among the top-50 fails the gate (the provenance-stratified couch sample cannot catch a rank-surface survivor) |

## SURF: Rider-Ready Surface

### UC-SURF-01: Compute the rider-ready flag

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-SURF-001 | Flag composes all seven conditions; single-input flips | AC-1, AC-3 | [integration-test] | A fully-qualifying route; flip each input (geometry verdict, name, score, length, verdict, retired, shadow) one at a time + recompute | Flag true only in the all-good state; each single flip drives it false |
| T-SURF-002 | Flag is stored + indexed, not read-time | AC-2 | [api-contract] | Inspect the row + query plan | `riderReady` present on the doc; gated query uses `by_riderReady_and_composite_score` |
| T-SURF-003 | Recompute triggers on every relevant change | AC-4 | [integration-test] | Change geometry verdict, classifier verdict, retirement in sequence | Flag updates after each mutation without a manual sweep |
| T-SURF-004 | Rider-ready count observable, baseline ≈1,171 | AC-5 | [integration-test] | `coverageReport` on real dev data pre-batch | Count within tolerance of the audited baseline; rises as sample batches land |

### UC-SURF-02: Gate the discovery agent tool

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-SURF-005 | Discovery returns rider-ready only; centroid fallback removed | AC-1, AC-2 | [integration-test] | Real dev deployment; region with mixed ready/centroid routes; call the agent tool | Every returned option is `riderReady`; code path for `candidateRoutes.slice()` fallback gone; a centroid-only region yields the honest message |
| T-SURF-006 | National suggestions all plot real roads (cold boot) | AC-3 | [e2e-automated] | Maestro `discovery-full-gate.yaml` extension; live dev deployment | Every plotted suggestion decodes ≥2-pt line geometry; zero dots plotted as routes |
| T-SURF-007 | No padding with non-ready routes; no centroid dot under any query | AC-4, AC-5 | [integration-test] | Query a region with 2 ready + 5 centroid routes, limit 10 | Result has exactly 2 routes + honest partial message; centroid rows absent under every intent shape |

### UC-SURF-03: Gate browse queries and the carousel

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-SURF-008 | All listCuratedRoutes modes gated via the index | AC-1 | [integration-test] | Each browse mode against real dev data with seeded non-ready rows | No mode returns a non-rider-ready row; best-mode query walks the composite index |
| T-SURF-009 | Carousel + chat cards inherit the gate | AC-2, AC-3 | [e2e-automated] | Maestro flow: discovery → carousel page → tap → map plot | Every carousel card corresponds to a rider-ready route and plots a real line on tap |
| T-SURF-010 | Quarantined/shadow/retired excluded in the same read path | AC-4, AC-5 | [integration-test] | Seed one of each adjacent to ready rows | None appear in browse; visible count matches `coverageReport` rider-ready count |

### UC-SURF-04: Show honest thin-region absence

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-SURF-011 | Thin region yields honest empty, distinct from error/loading | AC-1, AC-4 | [e2e-automated] | Maestro: seeded thin region; observe pill row + chat | "No routes near you yet" state visible; visually/testID-distinct from spinner and error states |
| T-SURF-012 | Fallback-to-national is labeled, never silent | AC-2 | [e2e-automated] | Location with zero nearby ready routes but national results | Leading label chip "No routes nearby — here's our top-rated" precedes pills |
| T-SURF-013 | No fabricated distance labels | AC-3 | [integration-test] + [e2e-automated] | Fallback results with null `distanceMi` | Pill omits the `· Xmi` suffix entirely; zero pills render "0mi" |
| T-SURF-014 | Absence/fallback served from the same gate as discovery/browse | AC-5 | [integration-test] | Compare tool + browse + pill-row data for the same seeded region | All three derive from identical rider-ready row sets; no divergence |
| T-SURF-015 | Screen-reader announcement on content swap | AC-6 | [e2e-automated] | Accessibility inspection of the pill row during a swap | Live-region (polite) attribute present on the swapped container |

### UC-SURF-05: Render the provenance caption on detail

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-SURF-016 | Caption renders for ai_reconstructed + name_routed with exact copy | AC-1, AC-2 | [e2e-automated] | Maestro `curated-route-detail.yaml` extension; one route of each provenance on dev | `curated-detail-provenance` shows the matching copy per provenance value |
| T-SURF-017 | No caption for scraped_promoted / pre-provenance rows | AC-3 | [e2e-automated] | Detail views of a promoted row and a legacy GOOD row | Provenance caption node absent on both |
| T-SURF-018 | Caption is plain informational text, not a warning badge | AC-4 | [human-gate] | Founder eyeballs detail on device (light + dark) | Caption reads as context, not alert; muted text style; no badge/warning affordance |

### UC-SURF-06: Never hide a rider's saved routes

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-SURF-019 | Saved non-ready route still opens detail | AC-1, AC-4 | [e2e-automated] | Save a route, then flip it non-ready (quarantine) on the backend; reopen from Saved | Detail resolves normally; no error, no block; suggestion surfaces omit it |
| T-SURF-020 | Un-recovered saved route renders the honest approximate state | AC-2 | [e2e-automated] | Saved centroid-only route reopened | Existing "Approximate location" state (`curated-detail-approximate-badge`) shown; no fake line |
| T-SURF-021 | Shadow-merged saved route resolves to canonical | AC-3 | [integration-test] | Save a row, then mark it `duplicateOf` a canonical | `getCuratedRouteDetail` returns the canonical row's detail |

## AGT: Agent Quality

### UC-AGT-01: Rebuild the conversation layer on Mastra

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-AGT-001 | One Mastra loop serves discovery, routing, search, and enrichment end to end | AC-1 | [integration-test] | Real dev deployment; Mastra agent in the `'use node'` action on the real `orchestrator` tier; one request of each class | Each request completes through the single agent loop; replies persist via the existing session-message path; no orchestrator dispatch code in the trace |
| T-AGT-002 | Regex intent path deleted; model resolution tier-mapped | AC-2, AC-4 | [build-gate] | Grep + tsc | `buildDiscoveryIntentFromQuery` and the place gazetteer are absent from the codebase; zero provider/model literals outside the tier map; `orchestrator` tier resolves a Sonnet-class Anthropic model; tsc clean |
| T-AGT-003 | Deterministic routing pipeline preserved as tools | AC-3 | [integration-test] | "Slc to park city" through the rebuilt agent on dev | A compiled route with real polyline persists, matching the pre-rebuild behavior; the pipeline ran via tool calls |
| T-AGT-004 | In-session memory carries context across turns | AC-5 | [integration-test] | Turn 1 establishes SLC context; turn 2 = "OK what's scenic" | Turn 2's `searchCuratedRoutes` call carries a center within ~25 mi of SLC, proven from captured tool args |
| T-AGT-005 | Guarantees are code, not prompt | AC-6 | [integration-test] | Malformed tool args injected at the seam; budget/rate paths exercised | Validator rejects the call before any side effect; budget/rate enforcement fires from code paths; rider-ready gate identical to browse's |
| T-AGT-016 | Personal-library awareness: "something new" and "which of my saved fits" | AC-7 | [integration-test] | Seed 3 saved routes for the test rider on dev; ask "something new near SLC" then "which of my saved rides fits 3 hours tomorrow" | First reply's suggestions exclude all 3 saved routeIds (captured tool results vs reply); second reply names only saved routes, grounded in `getUserFavorites` output |
| T-AGT-023 | **Spike gate (§5b): Mastra reference conversation proven in Convex before the AGT deep build — numeric pass/fail** | AC-1, AC-5 | [human-gate] | A `@mastra/core` agent in a Convex `'use node'` action on the real `orchestrator` tier, `geocodePlace` + `searchCuratedRoutes` registered, answers "twisty roads near Ogden" AND a 2-turn "OK what's scenic" that must inherit the Ogden center | ALL of: cold-start under the recorded ceiling and bundle delta under the agreed MB ceiling (numbers recorded, not vibes); the 2-turn center inheritance works (exercises the memory path, risk #16); ONE visible LangSmith trace whose exported span JSON contains NO api-key substring (redaction, risk #20) and carries `promptVersion`/`sessionId`/`tier`/cost across model + tool spans. Any miss BLOCKS the AGT deep build (risk #11 fallback triggers) |

### UC-AGT-02: Ground discovery in the rider's location and intent

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-AGT-006 | Center always resolved; tool refuses ungrounded calls | AC-1, AC-3 | [integration-test] | Session-location case + "near Ogden" (no session location) case; `searchCuratedRoutes` called without center as negative control | Both cases produce a real center (session coords / geocoded Ogden ≈41.22,-111.97); the center-less call throws; geocoding uses the shared provider (no hardcoded list) |
| T-AGT-007 | "Near Ogden" returns within-radius, nearest-first | AC-2 | [integration-test] | Seeded rider-ready routes at 10/40/170 mi from Ogden on dev | Result contains the 10- and 40-mi routes ordered nearest-first; the 170-mi route (Capitol Reef class) is absent |
| T-AGT-008 | No silent widening; far routes never "near" | AC-4, AC-5 | [integration-test] | Thin-radius region; replay grader over the reply | Any widened search is explicitly labeled in the reply; no suggestion beyond the stated radius appears without its distance; grader passes |
| T-AGT-017 | Duration-expressed requests translate to distance windows | AC-6 | [integration-test] | "Find me a 2–3 hour loop" with known session location; capture `searchCuratedRoutes` args | Captured args carry a distance window consistent with a recreational-pace translation of 2–3 h (not the default radius, not ignored); returned suggestions fall inside it |
| T-AGT-018 | Waypoint-anchored composition from real POI data | AC-7 | [integration-test] | Seeded BBQ POI near a rider-ready loop's midpoint on dev; "loop with a good BBQ spot at the halfway point" | Reply's named stop matches a real waypoint tool result (`searchAlongRoute`/`searchNearby`) tied to the suggested route; grader fails any stop name absent from tool results |

### UC-AGT-03: Interrogate when intent is ambiguous

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-AGT-009 | Unresolvable location yields exactly one targeted question | AC-1, AC-3 | [integration-test] | No session location; "find me something scenic" (no place named); then rider declines to clarify | Reply is one clarifying question (not results, not deflection); after decline, agent proceeds best-effort with honest labeling; never two questions in one turn |
| T-AGT-010 | Unclear ride type asks; resolvable requests answer | AC-2, AC-4 | [integration-test] | "Something that slaps" (unmappable) vs "scenic rides near SLC" with known location | First yields one targeted question; second yields grounded results with zero questions |

### UC-AGT-04: Be honest about distance and thin data

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-AGT-011 | Distances visible; thin coverage stated with alternative + custom offer | AC-1, AC-3, AC-4 | [e2e-automated] | Maestro: chat discovery in a seeded thin region (Ogden-like) on the sim, live dev deployment | Every suggested route's reply text/card carries its real distance; thin reply names the searched radius + nearest option with distance + offers a custom route |
| T-AGT-012 | No false proximity; claims tool-sourced | AC-2, AC-5 | [integration-test] | Replay grader over discovery replies incl. the Ogden fixture | Zero replies describe a beyond-radius route as "near"; every name/distance/score in prose maps to a tool-result field |
| T-AGT-019 | Dated suggestions volunteer a weather verdict | AC-6 | [integration-test] | "Saturday morning" ride request; fixtured-seam replay + one real `getRouteWeather` smoke case | Reply contains a go/no-go grounded in the weather tool result for the stated window without the rider asking; grader fails a dated reply with no forecast-sourced verdict |

### UC-AGT-05: Prove and observe agent behavior

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-AGT-013 | Captured failure session replays deterministically with policy graders | AC-1, AC-2 | [integration-test] | `pnpm agent:eval` on the recorded 2026-07-10 SLC/Ogden transcript; model seam fixtured; tools/queries real vs dev | Replay asserts tool selection + center args + outcome states; the old behavior (ungrounded state-best) fails; the rebuilt behavior passes; any policy violation exits non-zero naming policy + turn |
| T-AGT-014 | Real-API smoke + per-turn traces inspectable | AC-3, AC-4 | [human-gate] | Founder runs `pnpm agent:eval --smoke` (cost-capped) then opens the LangSmith project | Smoke lane completes on the real orchestrator model against dev; founder locates the per-turn trace (model + tool calls with args, timings, cost) for a conversation |
| T-AGT-015 | Eval artifacts + negative control | AC-5 | [e2e-automated] | Full eval run + a deliberately-injected false-proximity reply fixture | `agent-evals/report.json` produced and archived; the injected violation FAILS the grader (proves the teeth) |

### UC-AGT-06: Shape replies to the rider

| # | Criterion | AC Ref | Type | Setup | Pass/Fail |
|---|---|---|---|---|---|
| T-AGT-020 | Concise default; depth only on request | AC-1 | [integration-test] | Discovery request with 10+ eligible rider-ready routes; then a follow-up "tell me more about the second one" | First reply suggests ≤3 routes with a one-line reason each (grader counts); follow-up reply carries deeper detail sourced from tool results; no unprompted data dumps |
| T-AGT-021 | Honest comfort labels + persistent constraints (no-highways applied as a tool arg) | AC-2, AC-3 | [integration-test] | "Beginner-friendly ride, no highways" with seeded routes incl. one high-technical-score road; two follow-up discovery turns | No route with high technical evidence is labeled easy (negative control fails the grader if so); the no-highways constraint is applied as a structured tool arg (`planRoute.preferences.avoidHighways` / search filter) on later turns without being restated — a highway route appearing in a later reply fails the run |
| T-AGT-022 | Suggestions close with a saveable next step (Save to library) | AC-4 | [e2e-automated] | Maestro: chat discovery on the sim, live dev deployment | Suggestion reply exposes the Save affordance; acting on it adds the route to the rider's saved library. *Share-to-link is DEFERRED to a future PRD — no share affordance is built or asserted here.* |

## Summary

| Type | Count |
|---|---|
| [integration-test] | 66 |
| [e2e-automated] | 13 |
| [human-gate] | 11 |
| [api-contract] | 5 |
| [build-gate] | 2 |
| **Total** | **94 rows** (3 rows carry a second type; type-tags sum to 97) |

AC coverage: 142/142 ACs referenced by ≥1 criterion (positional refs per UC).

> **v3.1.0 additions:** T-REC-016 (geometry §5 spike), T-REC-017 (realized-yield acceptance
> gate), T-REC-018 (founder-region/Saturday-arc coverage gate), T-VER-020 (top-50-by-rank
> review), T-AGT-023 (Mastra §5b spike with numeric pass/fail). T-AGT-022 descoped to
> Save-only. Five new [human-gate] rows (6 → 11).

## Maintenance

Adding a UC or AC requires a matching criterion row here (T-{PREFIX}-{NNN} IDs are stable;
append, never renumber). Sprint planning draws its human-testing gates from the [human-gate]
rows; kb-run-sprint binds [e2e-automated] rows to Maestro flows JIT.
