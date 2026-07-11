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

## Agent layer components (AGT, v2.0.0 · refreshed v3.0.1)

| Component | Type | Role |
|---|---|---|
| `convex/actions/agent/rideAgent.ts` | New (`'use node'`) | The single `@mastra/core` Agent as a **module-level stateless singleton** (`getRideAgent()` memoized at module scope — warm-sandbox reuse is the point; statelessness is the contract, see 01-architecture-posture). Sonnet-class `orchestrator` tier via ModelRouter string; tool registry; `maxSteps` 8–12 wrapped by the `budgetTracker`/`loopDetector` code guards. Entry stays `sendMessage.ts` (deterministic wrap: identity, persistence, rate/budget); the app contract is unchanged. |
| `convex/actions/agent/prompts/orchestrator.v1.ts` | New | The **versioned prompt artifact**: `PROMPT_VERSION` + `buildSystemPrompt(requestContext)` (static policy + per-turn dynamic blocks). Change-controlled by the fixtured eval lane — full spec in 12-agent-prompting. |
| Agent tool registry (9 tools) | New / Wrapped | `createTool` with Zod in/out schemas + errors-as-data; the full per-tool contract table (args→returns, behavior, error taxonomy) lives in 04-api-design. New: `searchCuratedRoutes` (center REQUIRED), `geocodePlace`, `getUserFavorites` (newly wired to the real `favorite_roads`/`saved_routes` tables). Wrapped existing capabilities: `planRoute` (sketch→compile pipeline), `getRouteWeather`, `searchAlongRoute`/`searchNearby`, `webSearch`, `enrichRoute`. |
| `convex/actions/agent/lib/mastraConvexStore.ts` | New | The custom Convex storage adapter behind `@mastra/memory`: thread ⇄ `planning_sessions`, messages ⇄ `session_messages`, working memory ⇄ `planning_sessions.agentMemory` (mapping table in 01-architecture-posture; risk #16 governs interface drift). No new tables. |
| Agent eval harness (`scripts/agent-evals/`) | New | `*.transcript.json` fixtures (SLC/Ogden canonical) replayed through the real Agent with `MockLanguageModel` at the model seam — tools/queries/gates run REAL; deterministic graders (blocking) + LLM-judge scorers (`createScorer`) + negative control; emits `report.json`. Full spec in 11-e2e-testing §5c. |
| Mastra `Observability` → OTLP → LangSmith | New (replaces stub) | Per-turn/model/tool spans stamped with `promptVersion`/`sessionId`/`tier`, `SensitiveDataFilter` on outputs. **Replaces `lib/tracing.ts`, which is a no-op stub today** — delete the stub wrappers so nothing masquerades as wired (risk #20; span spec in 11-e2e-testing §5d). |
| Deleted: orchestrator dispatch + sub-agent meta-tools + `buildDiscoveryIntentFromQuery` + `KNOWN_PLACE_STATES` + `runAgent.ts` conversation loop + `lib/tracing.ts` stub | Retired | The regex intent path and the query-paraphrase dispatch hops are removed, not tuned. `executeDiscoverCuratedRoutes`'s query logic is absorbed into `searchCuratedRoutes`. pi-ai remains for pipeline tiers only. |
