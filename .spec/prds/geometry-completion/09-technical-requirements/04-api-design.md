---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# API Design

All functions are `internal*` and **operator-only** (`npx convex run`, deployment-env keys)
unless marked PUBLIC. Kinds: `iA` = internalAction, `iM` = internalMutation, `iQ` =
internalQuery. Trust boundary mirrors the enrichment sibling: the rider never triggers a
write; public reads stay Clerk-gated.

## Hygiene — `convex/curatedGeometryHygiene.ts` (default runtime)

| Function | Kind | Args → Returns | Contract |
|---|---|---|---|
| `normalizeEditorialScores` | iA | `{sample?,cursor?}` → `{scanned,normalized}` | ÷100 any 0–100 score where `scoreScaleNormalizedAt` absent ∧ value>1; stamp marker. Idempotent — never divides twice. |
| `dedupeGroups` | iA | `{dryRun?}` → `{groups,shadows}` | Detect ~50 dup groups (`by_name_lower` + centroid proximity); pick canonical (best geometry ∧ highest score); set `duplicateOf` on shadows. `dryRun` returns the plan for founder review before commit. |
| `fixLengthOutliers` | iA | `{}` → `{zeroed,flagged}` | `lengthMiles ≤0` → null + quarantine `zero_length` (routed length becomes truth on recovery); `>1000mi` → quarantine `length_outlier`. |
| `quarantineTestRows` | iA | `{}` → `{flagged}` | Name-pattern test/seed rows → quarantine `test_row`. |
| `normalizeStates` | iA | `{}` → `{changed}` | Canonicalize state strings; multi-state → ordered set. Idempotent. |

## Gate — `convex/curatedGeometryGate.ts` (pure module, no Convex wrapper)

| Export | Signature | Contract |
|---|---|---|
| `lengthRatio` | `(routedMi, claimedMi\|null) → number\|null` | Null when claimed ≤0/quarantined. |
| `ratioVerdict` | `(ratio\|null) → 'pass'\|'review'` | PASS iff ratio ∈ [0.6, 1.6]; null ratio → degenerate+region checks decide. |
| `degenerateCheck` | `(points, routedMi) → boolean` | Fail iff points ≤4 ∨ points < routedMi (<1 pt/mi). |
| `regionCheck` | `(anchorLatLng, centroid, maxMi=150) → boolean` | Reject anchors >150 mi from centroid. |
| `gate` | `(input) → {verdict,ratio,degenerate,anchorCount}` | Composed deterministic verdict written to the verification block. |

## Data-access — `convex/curatedGeometry.ts` (default runtime, extends existing)

| Function | Kind | Args → Returns | Contract |
|---|---|---|---|
| `listForLever1Promote` | iQ | `{cursor,batchSize}` → page | `routePolyline` present ∧ not `generated`, by score desc. |
| `listForLever2Reconstruct` | iQ | `{cursor,batchSize}` → page | Turn-by-turn-rich `summary`/`oneLiner` ∧ unresolved. |
| `listForLever3Reroute` | iQ | `{cursor,batchSize}` → page | `parseRouteEndpoints(name)≠null ∨ highwayNumber` ∧ unresolved. |
| `persistGeometryVerified` | iM | `{routeId,geometry,verification,provenance}` → void | Atomic: upsert side-table line + verification + provenance; patch route `geometryStatus='generated'`; recompute `riderReady`. |
| `setReviewVerdict` | iM | `{routeId,geometry?,verification}` → void | Store candidate (if any) + verdict `review`; route status `review`; `riderReady=false`. |
| `retireRoute` / `unretireRoute` | iM | `{routeId,reason}` / `{routeId}` → void | Set/clear `retiredAt` + `retirementReason` + status `retired`; recompute `riderReady`. Reversible. |
| `setDuplicateOf` | iM | `{routeId,canonicalRouteId}` → void | Flag shadow; `riderReady=false`. |
| `recomputeRiderReady(+Batch)` | iM | `{routeId}` / `{cursor}` → flag / page | Pure predicate → patch; batch sweep backfills the index. |
| `listGeometryReviewQueue` | iQ | `{cursor,batchSize}` → rows + verification | `by_geometry_status='review'` joined to side-table numbers + failure reason. |
| `coverageReport` | iQ | `{}` → totals + per-state | Counts by status/provenance/riderReady, per-lever yields, gate PASS %, live T1 verdict. |

## Pipeline actions

| Function | Kind | Args → Returns | Contract |
|---|---|---|---|
| `curatedGeometryPromote:promoteForRoute` / `backfillPromote` | iA (default rt) | `{routeId}` / `{sample?,cursor?}` → result/report | Lever 1: decode → gate → persist `scraped_promoted` \| review. $0. |
| `curatedGeometryReconstruct:reconstructForRoute` / `backfillReconstruct` | iA (`'use node'`) | `{routeId}` / `{sample?,cursor?,batchSize?}` → result / `{processed,generated,review,failed,continueCursor,isDone,perRoute[]}` | Lever 2 (PoC productionized): geometry-tier LLM `emit_anchors` → Google Geocoding (bias+150mi) → Google Routes via-waypoints → gate → repair ≤2 → persist \| review. Halts after N consecutive provider errors; cursor-resumable. |
| `curatedGeometryReroute:rerouteForRoute` / `backfillReroute` | iA (`'use node'`) | `{routeId}` / `{sample?,cursor?}` → result/report | Lever 3: deterministic endpoints → geocode → route → gate → `name_routed` \| review. No LLM. |
| `curatedGeometryClassify:classifyForRoute` / `backfillClassify` | iA (`'use node'`) | `{routeId}` / `{sample?,cursor?}` → verdict/report | Cross-provider (low tier) forced `emit_verdict` → patch `rideWorthiness` → recompute `riderReady`. |

## Review / couch ops — `convex/curatedGeometryReview.ts` (default runtime)

| Function | Kind | Args → Returns | Contract |
|---|---|---|---|
| `approveReviewItem` | iM | `{routeId}` → void | Founder override: `review`→`generated`; recompute flag; disposition recorded. |
| `rejectReviewItem` | iM | `{routeId,reason,disposition:'retry'\|'retire'}` → void | `review`→`unresolved` (re-queue) or →`retired`; recorded. |
| `recordCouchVerdict` | iM | `{routeId,verdict:'true'\|'off'\|'wrong',notes?}` → void | Persist per-route couch verdict on the doc. |
| `couchGateStatus` | iQ | `{}` → `{sampled,true,off,wrong,pass}` | Deterministic gate: pass iff sampled ≥ target ∧ zero `wrong` ∧ true-rate ≥ threshold. The full batch driver refuses `--all` while not pass. |

## Public reads (MODIFIED, Clerk-gated) — `convex/curatedRoutes.ts`

| Function | Kind | Change |
|---|---|---|
| `listCuratedRoutes` | PUBLIC query | All modes gated `riderReady=true` via `by_riderReady_and_composite_score`; exclude shadows + retired + quarantined. |
| `getCuratedRouteDetail` | PUBLIC query | Redirect `duplicateOf`→canonical; stays reachable for saved routes regardless of gate; returns `geometryProvenance` for the caption; retired rows resolve for saved-route holders, never appear in suggestions. |
| `discoverCuratedRoutes` (agent tool) | iA | Centroid fallback removed; rider-ready only; honest "matches exist but none rider-ready" message added. |

## Driver scripts (local, `npx convex run` per bounded batch)

`scripts/hygiene-curated-routes.ts` · `scripts/reconstruct-curated-geometry.ts`
(`--lever=1|2|3 --sample=N --all --cursor=X --top=N`; refuses `--all` for lever 2 while
`couchGateStatus` ≠ pass) · `scripts/classify-curated-routes.ts` ·
`scripts/geometry-coverage-report.ts` · `scripts/geometry-couch-sample.ts` (reads top-25
candidates, renders Mapbox static PNGs locally → `.tmp/GEO/couch-sample/`, writes manifest;
no image bytes through Convex).
