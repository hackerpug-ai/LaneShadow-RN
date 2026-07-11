---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# System Components

| Component | Type | Role |
|---|---|---|
| `convex/curatedGeometryHygiene.ts` + `scripts/hygiene-curated-routes.ts` | New (default runtime) | HYG group: ÷100 editorial-score normalization (idempotent via `scoreScaleNormalizedAt`), dedup of the ~50 groups (`duplicateOf` on shadows), length-outlier + test-row quarantine, state normalization. Deterministic, zero external calls. |
| `convex/curatedGeometryGate.ts` | New (pure module — UNIT_TEST_JUSTIFIED, zero I/O) | The single deterministic gate: `lengthRatio`, `ratioVerdict` (0.6–1.6), `degenerateCheck` (>4 pts ∧ ≥1 pt/mi), `regionCheck` (≤150 mi), composed `gate()`. Imported by every lever + QA; owned by UC-VER-01. |
| `convex/actions/curatedGeometryPromote.ts` | New (default-runtime action) | Lever 1 (≈1,752 rows): decode legacy in-row `routePolyline` → gate → side table, `provenance='scraped_promoted'`. $0, no LLM, no Google. |
| `convex/actions/curatedGeometryReconstruct.ts` | New (`'use node'`) | Lever 2 (≈948 rows): productionized PoC — LLM anchors (geometry tier, forced `emit_anchors`) → Google Geocoding (region bias + 150 mi) → Google Routes `computeRoutes` (via-waypoints) → gate → repair round (≤2, keep better by ratio distance) → `ai_reconstructed`. |
| `convex/actions/curatedGeometryReroute.ts` | New (`'use node'`) | Lever 3 (≈1,076 rows): deterministic `parseRouteEndpoints()` / `highwayNumber` → Google Geocoding → Google Routes → same gate → `name_routed`. No LLM. |
| `convex/actions/curatedGeometryClassify.ts` | New (`'use node'`) | Ride-worthiness classifier (all routes): cross-provider LLM verdict `{ride\|marginal\|not_a_ride}` + reason → feeds `riderReady`. Probabilistic seam #2. |
| `convex/curatedGeometry.ts` | Modified (extend existing data-access) | Adds per-lever `listForLever{1,2,3}` scans, `persistGeometryVerified` (extends `patchRouteGeometry` with verification block + provenance + `riderReady` recompute), `setReviewVerdict`, `retireRoute`/`unretireRoute`, `setDuplicateOf`, `recomputeRiderReady(+Batch)`, `listGeometryReviewQueue`, `coverageReport`. |
| Review queue (status-field pattern) | New behavior, **no new table** | `geometryStatus='review'` on the route doc + candidate line & numeric verdict in the side table's verification block. Queue = indexed query on `by_geometry_status`. Rationale in 03-data-schema. |
| `riderReady` recompute | New (deterministic predicate in `curatedGeometry.ts`) | Pure function of (gate-passed geometry ∧ verification PASS ∧ ride-worthy ∧ sane score/length ∧ ¬quarantined ∧ ¬retired ∧ ¬duplicateOf). Runs after every lever write + as a sweep. |
| `convex/curatedGeometryReview.ts` | New (default runtime) | Founder ops: `approveReviewItem`, `rejectReviewItem`, `recordCouchVerdict` — recorded dispositions, deterministic couch-gate check. |
| `convex/curatedRoutes.ts` (`listCuratedRoutes`, `getCuratedRouteDetail`) | Modified (SURF gating) | Gate all browse modes to `riderReady=true` via the new composite index; exclude `retired` + `duplicateOf` shadows; detail redirects shadow→canonical, stays reachable for saved routes; detail read gains geometry provenance for the caption. |
| `convex/actions/agent/tools/discoverCuratedRoutes.ts` | Modified (SURF gating) | Remove the centroid fallback (`:183-186`) and the centroid branch of map-geometry building; serve rider-ready only; add the "matches exist but none rider-ready" honest message. |
| `hooks/use-curated-discovery.ts` + `app/(app)/(tabs)/index.tsx` + `components/chat/chat-input.tsx` | Modified (SURF honesty) | Expose `fellBackToBest`; leading non-tappable label chip for fallback-to-national; fix the fabricated `0mi` distance suffix; honest empty pill copy. |
| `app/(app)/curated-route/[id].tsx` | Modified (SURF caption) | Provenance caption leaf (plain text, `ai_reconstructed`/`name_routed` only); reuse the existing DESIGN-003 "Approximate location" state as `geometry-absent`. |
| `convex/curatedGeometryQa.ts` | Modified | Fold legacy `suspect_far`/`suspect_length` heuristics into the shared gate; add coverage/queue helpers. Old Nominatim-era thresholds superseded. |
| `convex/actions/agent/lib/models.ts` + `convex/lib/env.ts` | Modified | Add the dedicated `geometry` LLM tier; confirm `ANTHROPIC_API_KEY` / `GOOGLE_MAPS_API_KEY` deployment-env wiring. |
| Driver scripts | New (precedent: `scripts/backfill-curated-geometry.ts`) | `scripts/reconstruct-curated-geometry.ts` (`--lever=1\|2\|3 --sample/--all/--cursor/--top`), `scripts/classify-curated-routes.ts`, `scripts/geometry-coverage-report.ts`, `scripts/geometry-couch-sample.ts` (renders ~25 Mapbox static PNGs locally + manifest). |
| Superseded: Nominatim/Overpass name-anchored backfill (`convex/actions/curatedGeometry.ts`) | Retired | The name-only geocode + no-validation path is the documented root cause; kept only until the levers land, then removed. Its resumable-scan scaffolding is reused. |

## Agent layer components (AGT, v2.0.0)

| Component | Type | Role |
|---|---|---|
| `convex/actions/agent/rideAgent.ts` (Mastra agent) | New (`'use node'`) | The single `@mastra/core` Agent: Sonnet-class `orchestrator` tier, behavior-policy system prompt, tool registry, in-session memory. Entry stays `sendMessage`; the app contract is unchanged. |
| `searchCuratedRoutes` agent tool | New | The honest discovery contract: `{center, radiusMi, archetypes?, text?, limit?}` → rider-ready routes with per-route `distanceMi`; reads the SURF-gated queries; refuses to run without a center. |
| `geocodePlace` agent tool | New (wraps existing provider) | Place-name → lat/lng via the geocoding provider the routing pipeline already uses; replaces the hardcoded gazetteer. |
| Routing-pipeline tool wrappers | Modified | The deterministic geocode → sketch → compile pipeline (works today) re-registered as Mastra tools; search/enrichment/weather tools re-registered as-is. |
| Mastra memory adapter (Convex-backed) | New | In-session preferences + prior locations persisted through the existing session tables; no new storage system. |
| Agent eval harness (`scripts/agent-evals/` + fixtures) | New | Transcript replay against the fixtured model seam + behavior graders (asked-when-ambiguous, distance-stated, no-false-proximity) + cost-capped real-API smoke lane; results recorded as artifacts. |
| Mastra telemetry → LangSmith wiring | New | Per-turn traces (model calls, tool calls + args, timings, cost) to the already-provisioned LangSmith project. |
| Deleted: orchestrator dispatch + sub-agent meta-tools + `buildDiscoveryIntentFromQuery` + `KNOWN_PLACE_STATES` + `runAgent.ts` loop | Retired | The regex intent path and the query-paraphrase dispatch hops are removed, not tuned. `executeDiscoverCuratedRoutes`'s query logic is absorbed into `searchCuratedRoutes`. |
