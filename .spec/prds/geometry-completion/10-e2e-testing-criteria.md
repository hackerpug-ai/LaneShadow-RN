---
stability: TEST_SPEC
last_validated: 2026-07-10
prd_version: 1.0.0
---

# E2E / Human Testing Criteria — Geometry Completion

Version 1.0.0 · 2026-07-10 · **67 criteria across 20 UCs** — every AC referenced by ≥1
criterion. Types: [human-gate] · [e2e-automated] (Maestro, iOS sim, live dev deployment) ·
[integration-test] (vitest vs real dev deployment; pipeline tier hits REAL Google + LLM APIs)
· [api-contract] · [build-gate]. AC refs are positional within each UC (AC-1 = first ☐).

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

## Summary

| Type | Count |
|---|---|
| [integration-test] | 49 |
| [e2e-automated] | 10 |
| [human-gate] | 5 |
| [api-contract] | 5 |
| [build-gate] | 1 |
| **Total** | **67 rows** (3 rows carry a second type; type-tags sum to 70) |

AC coverage: 106/106 ACs referenced by ≥1 criterion (positional refs per UC).

## Maintenance

Adding a UC or AC requires a matching criterion row here (T-{PREFIX}-{NNN} IDs are stable;
append, never renumber). Sprint planning draws its human-testing gates from the [human-gate]
rows; kb-run-sprint binds [e2e-automated] rows to Maestro flows JIT.
