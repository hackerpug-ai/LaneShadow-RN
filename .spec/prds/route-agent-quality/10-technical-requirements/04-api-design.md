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
| `listCuratedRoutes` | PUBLIC query | **Mode-4 (national best)** gated `riderReady=true` via `by_riderReady_and_composite_score`. **bbox + nearest modes run through the geospatial component** (filterKeys `state`+`primaryArchetype` only) and CANNOT use that Convex index — gate them via a `riderReady` geospatial filterKey (deploy re-index, risk #22) OR an in-memory post-filter with raised over-fetch + documented sparse-region failure mode. Exclude shadows + retired + quarantined in every mode. **`searchCuratedRoutes` wraps `nearest`, so this is load-bearing, not cosmetic** (the earlier "all modes gated" phrasing was false). |
| `getCuratedRouteDetail` | PUBLIC query | Redirect `duplicateOf`→canonical; stays reachable for saved routes regardless of gate; returns `geometryProvenance` for the caption; retired rows resolve for saved-route holders, never appear in suggestions. |
| `discoverCuratedRoutes` (agent tool) | iA | Centroid fallback removed; rider-ready only; honest "matches exist but none rider-ready" message added. |

## Driver scripts (local, `npx convex run` per bounded batch)

`scripts/hygiene-curated-routes.ts` · `scripts/reconstruct-curated-geometry.ts`
(`--lever=1|2|3 --sample=N --all --cursor=X --top=N`; refuses `--all` for lever 2 while
`couchGateStatus` ≠ pass) · `scripts/classify-curated-routes.ts` ·
`scripts/geometry-coverage-report.ts` · `scripts/geometry-couch-sample.ts` (reads top-25
candidates, renders Mapbox static PNGs locally → `.tmp/GEO/couch-sample/`, writes manifest;
no image bytes through Convex).

## Agent tool contracts (AGT — full contract, v3.0.1)

The app-facing entry (`actions/agent/sendMessage`) keeps its existing signature — the
rebuild is behind it. Every tool is a Mastra `createTool` with real Zod `inputSchema` +
`outputSchema` (return values runtime-validated — fake-shaped returns are structurally
dead); `execute(inputData, ctx)` reads the per-request DI bag (`runQuery`/`runMutation`/
`clerkUserId`/`planningSessionId`/`currentLocation`) from `ctx.requestContext`, never module
scope. **Errors are returned as typed data** (`{ error: CODE, … }`), never thrown strings —
the model reasons over the code and reacts (re-ask, widen, fall back).

| Tool | Input schema (Zod) | Output schema | Behavior contract | Error taxonomy (as data) | New/Wrapped |
|---|---|---|---|---|---|
| **searchCuratedRoutes** | `{ center:{lat,lng} REQUIRED, radiusMi:num.default(50).max(150), archetypes?:string[], text?:string, durationHours?:{min,max}, limit?:num.max(20) }` | `{ routes:[{routeId,name,distanceMi,archetype,lengthMiles,score,oneLiner}], searchedRadiusMi, totalWithinRadius }` | Wraps `listCuratedRoutes` nearest-mode; SURF-gated riderReady-only. `center` required — ungrounded discovery unrepresentable. `distanceMi` server-computed by the geospatial query, never fabricated; nearest-first. `durationHours` → miles band via the repo's speed constant (deterministic). | `NO_CENTER` · `ZERO_RESULTS_IN_RADIUS` (returns `searchedRadiusMi` + `totalWithinRadius:0` → honest absence) · `RATE_LIMITED` · `PROVIDER_DOWN` | **New** (absorbs `executeDiscoverCuratedRoutes`; centroid fallback deleted) |
| **geocodePlace** | `{ query:string, biasCenter?:{lat,lng} }` | `{ lat,lng,formatted } \| { notFound:true }` | Wraps `providers/geocodingProvider.ts` — the same provider the routing pipeline uses; `biasCenter` feeds the regional bias tier. Deletes the hardcoded gazetteer. | `GEOCODE_MISS` · `GEOCODE_PROVIDER_ERROR` (typed — replaces today's silent `[]`) · `MISSING_KEY` | **New** (wraps existing provider) |
| **planRoute** | `{ start:{lat,lng,label}, end:{lat,lng,label}, departureTime:number, preferences:{scenicBias,avoidHighways,avoidTolls} }` | `{ routePlanId, options[] } \| { error }` | Wraps `lib/planRideOrchestrator.ts` (waypoints → sketch → compile → weather) unchanged. The custom-route fallback for thin curated coverage. Coordinates required — call `geocodePlace` first. | `NO_ROUTES_GENERATED` (typed, was a throw) · `COMPILE_FAILED` | **Wrapped** |
| **getRouteWeather** | `{ polyline:{lat,lng}[], departureTimeMs:number }` | `{ status:'ok', segments[], routeWeatherSummary } \| { status:'unavailable' }` | Wraps existing tool (already errors-as-data); ≤5 sample points; deterministic summary. Powers the volunteered go/no-go (UC-AGT-04). | `WEATHER_UNAVAILABLE` | **Wrapped** |
| **getUserFavorites** | `{ bbox?:{n,s,e,w}, near?:{lat,lng,radiusMi} }` | `{ favorites:[{routeId?,roadName,rating?,rideCount?,lastRidden?,lengthMiles?,technicalScore?,lat,lng}] }` | **Newly wired to the real `favorite_roads`/`saved_routes` tables** (the current handler is a pure fn needing a caller-supplied list). Powers "which of my saved fits" + the "something new" exclusion set — answers grounded in real rows. **Schema note (v3.1.0, L4):** `favorite_roads` stores only `{name, geometry, bounds}` today — no `rating/rideCount/lastRidden/lat/lng`; source those from `saved_routes.curatedRouteRef` → curated scores (derived), or add a `favorite_roads` schema delta (03-data-schema). Fields absent in both are returned optional/omitted, **never fabricated**. | `{favorites:[]}` (honest empty) | **Wrapped + newly wired to a Convex query** |
| **searchAlongRoute** | `{ routePolyline:string, query:string, originOffset?:number }` | `PlaceResult[] \| { error:'PLACES_API_ERROR' }` | Wraps existing Google Places tool. Composes "BBQ at the halfway point" from REAL waypoint lookup; `originOffset` biases N-hours-in via speed interpolation. Never invents businesses. | `PLACES_API_ERROR` | **Wrapped** |
| **searchNearby** | `{ query:string, location:{lat,lng} REQUIRED, radiusMeters?:num.max(50000) }` | `PlaceResult[] \| { status:'error', reason }` | Wraps existing tool; `location` required — POI queries structurally grounded too. | `PLACES_API_ERROR` | **Wrapped** |
| **webSearch** | `{ query:string, maxResults?:num.default(3) }` | `{ hits:WebSearchHit[] } \| { error:'WEB_SEARCH_ERROR' }` | Wraps existing tool; real-time facts (closures). Typed error replaces today's silent `[]` so the agent can say "couldn't check" honestly. | `WEB_SEARCH_ERROR` | **Wrapped** |
| **enrichRoute** | `{ routes:[{waypoints,legContext?,stats,preferences?,existingLegLabels?}] }` | `{ enrichments:[{label,rationale,highlights,legLabels}] }` | Wraps existing forced-tool-call labeling (low tier); never throws — degrades to generic labels. Route-analysis cluster (`getCurvature`/`getElevation`/`checkSurface`/`lookupRoad`) — confirm top-level vs internal registration at wrap time. | `ENRICH_FALLBACK` (non-fatal) | **Wrapped** |

**Contracts that structurally enforce AGT behavior (make the wrong thing impossible):**
`center` required kills ungrounded discovery (the root-cause bug); server-computed
`distanceMi` + the max-nearest-distance filter kill false proximity; riderReady-only gating
makes the unvetted firehose unreachable; the in-tool `durationHours→miles` translation makes
time constraints undroppable; `location`/`routePolyline` requirements anchor every POI and
waypoint answer to real geometry. The ≤3-option default is enforced as a deterministic
truncation of the options/attachment array at assembly time — not a prompt hope. Full
enforcement ruling: 01-architecture-posture "Tools vs prompting".

**Eval harness surfaces (repo, not Convex):** `pnpm agent:eval` replays
`scripts/agent-evals/fixtures/*.transcript.json` (incl. the captured 2026-07-10 SLC/Ogden
session) with the model seam fixtured; `pnpm agent:eval --smoke` runs the small real-API
lane against the dev deployment; both emit `agent-evals/report.json` artifacts.
