# Sprint 3 Handoff & Coordination

**Sprint**: Sprint 3 — Backend data flows: PlanRide action + providers + overlays

**Status**: ✅ COMPLETE

All tasks completed and integrated. No active blockers. Backend pipeline fully operational.

---

## Active Blockers

- None. Sprint 3 complete.

---

## Integration Points

### ✅ COMPLETE: LangGraph Planning Pipeline
- **File**: `convex/actions/agent/graphs/planningGraph.ts`
- **Type**: LangGraph StateGraph with structured LLM output
- **Model**: GPT-4O with temperature 0
- **Structured Output**: Via `model.withStructuredOutput(routeSketchSchema)`
- **Nodes**: 
  - `generateSketches` - LLM generates 2-3 route sketches
  - `processRoutes` - Deterministic tools chain (compile→normalize→index→conditions)
- **LangSmith Integration**: Enabled with project default `LaneShadowDev`
- **Status**: 🟢 Ready to consume from frontend/S002 Route Options UI

### ✅ COMPLETE: Error Handling
- **File**: `lib/errors.ts`
- **Pattern**: Throw `new Error('CODE')` where CODE is TRD §11 planning code
- **Codes Supported**: `INVALID_INPUT`, `LLM_SKETCH_INVALID`, `LLM_SKETCH_AMBIGUOUS`, `ROUTING_COMPILE_FAILED`, `CONDITIONS_LOOKUP_FAILED`
- **Status**: 🟢 Ready for deterministic UI error mapping

### ✅ COMPLETE: Route Validation Contract
- **File**: `models/route-sketch.ts`
- **Exports**: `routeSketchValidator` (Convex `v`), `RouteSketch` type, co-located Zod schemas
- **Nested**: `RouteSketchSegment`, `RouteSketchAnchorPoint` validators with kind union
- **Status**: 🟢 LangChain outputs validate deterministically

### ✅ COMPLETE: Routing Provider Abstraction
- **File**: `convex/actions/agent/providers/routing-provider.ts`
- **Type**: `RoutingProvider` (functional composition)
- **Mock Mode**: Deterministic mock provider for POC
- **Status**: 🟢 Ready for real provider swap-in (e.g., Google Maps, Mapbox)

### ✅ COMPLETE: Compile Sketch Tool
- **File**: `convex/actions/agent/tools/compile-sketch.ts`
- **Input**: `RouteSketch` + `PlanInput`
- **Output**: Provider-compatible request + response parsing
- **Status**: 🟢 Functional, passes all tests

### ✅ COMPLETE: Route Normalization
- **File**: `convex/actions/agent/tools/normalize-route.ts`
- **POC Geometry**: Overview polyline + leg polylines (no turn-by-turn steps)
- **Output**: `RouteSnapshot` with bounds, origin, destination, waypoints, legs[]
- **Status**: 🟢 Ready for map rendering

### ✅ COMPLETE: Route Index Computation
- **File**: `convex/actions/agent/tools/compute-route-index.ts`
- **Method**: FNV-1a fingerprinting + capped point sampling (100-300 points)
- **Deterministic**: Yes, bounded + repeatable
- **Status**: 🟢 Ready for analytics/dedup

### ✅ COMPLETE: Weather Provider + Wind Overlay
- **Weather Provider**: `convex/actions/agent/providers/weather-provider.ts` (Open-Meteo, no auth required)
- **Probing**: `convex/actions/agent/tools/probe-conditions.ts` (bounded sampling at route points)
- **Mapping**: `convex/actions/agent/tools/map-conditions.ts` (legend: low/moderate/high)
- **Soft-Fail**: Conditions failures return `conditionsStatus: "unavailable"` without throwing
- **Status**: 🟢 Ready, graceful degradation tested

### ✅ COMPLETE: Main PlanRide Action
- **File**: `convex/actions/agent/planRide.ts`
- **Public API**: `actions.agent.planRide(input: PlanInput): Promise<PlannedRouteOptionsView>`
- **Auth**: `requireIdentity(ctx)` from `convex/guards.ts`
- **Pipeline**: LLM → Compile → Normalize → Index → Conditions (soft-fail) → View Model
- **Returns**: 2-3 options with route snapshot, overlays preview, wind summary, conditions status
- **Status**: 🟢 Ready for frontend integration

---

## Decisions Finalized

1. **LangChain → LangGraph Refactor**: Moved from raw `createAgent` to LangGraph `StateGraph` for:
   - Clearer separation of probabilistic (LLM) vs deterministic (tools) logic
   - Built-in conditional edges + graph structure
   - LangSmith observability support
   - Future extensibility (streaming, human-in-the-loop)

2. **Structured Output Strategy**: Use `model.withStructuredOutput(zod_schema)` directly on Claude/GPT-4O, no agent/tools overhead for sketch generation (no dynamic tool calling needed)

3. **Weather Provider**: Open-Meteo chosen for POC:
   - No API key required
   - Bounded probing prevents fan-out
   - Soft-fail contract allows graceful degradation

4. **Wind Summary Levels**: Centralized in `models/saved-routes.ts`:
   - `WIND_SUMMARY = { LOW, MODERATE, HIGH, UNAVAILABLE }`
   - Single source of truth for enum literals + validator

5. **Environment Variables**: Centralized in `convex/lib/env.ts`:
   - `OPENAI_API_KEY` (required for LLM)
   - `LANGSMITH_TRACING`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT` (optional observability)
   - Optional routing provider env vars (non-breaking)

---

## Cross-Agent Notes

### For Frontend/S002 Route Options UI
- Consume `planRide` action via `api.actions.agent.planRide(planInput)`
- Expected output: `PlannedRouteOptionsView` with 2-3 `RouteOption` candidates
- Each option includes:
  - `routeOptionId`, `label`, `rationale`
  - `stats`: `{ distanceMeters, durationSeconds, legsCount }`
  - `map`: `{ bounds, overviewGeometry, legs[] }` (ready for map rendering)
  - `overlaysPreview`: `{ windSummary: 'low'|'moderate'|'high'|'unavailable' }`
  - `conditionsStatus`: `'ok'|'unavailable'` (if 'unavailable', no wind overlay in route snapshot)

### Error Handling
- Hard failures throw deterministic error codes (e.g., `INVALID_INPUT`, `ROUTING_COMPILE_FAILED`)
- Soft failures (weather) do NOT throw; return routes with `conditionsStatus: "unavailable"`
- UI can map error codes to user-friendly messages via `lib/errors.ts` lookup

### Testing & QA
- All unit/integration tests pass (see standup log for test files)
- Manual verification playbook documented in task 09 (convex/README.md appendix)
- LangSmith project `LaneShadowDev` available for tracing/debugging (set `LANGSMITH_TRACING=true`)

### Next Sprint Integration
- If real routing provider (Google Maps, Mapbox) is chosen:
  - Swap implementation in `convex/actions/agent/providers/routing-provider.ts`
  - Update `convex/lib/env.ts` with provider keys
  - No changes needed to `planRide` or tool layer (abstraction holds)
- If frontend needs additional overlay types (elevation, traffic, etc.):
  - Add new provider in `convex/actions/agent/providers/*`
  - Wire into conditions probing/mapping in `planRide` graph
  - Update `RouteSnapshot.overlays` union as needed

---

## Archived Items

- `convex/actions/agent/llm/routerAgent.ts` (deleted in favor of LangGraph)
- Original sketch-generation via `createAgent` (superseded by `StateGraph` + `model.withStructuredOutput()`)

---

## Sprint 3 Summary

✅ **All 8 tasks completed and integrated**

| Task | Status | Key Files |
|------|--------|-----------|
| 01 - Error codes | ✅ | `lib/errors.ts` |
| 02 - RouteSketch contract | ✅ | `models/route-sketch.ts` |
| 03 - Routing provider + compile | ✅ | `convex/actions/agent/providers/routing-provider.ts`, `tools/compile-sketch.ts` |
| 04 - Route normalization | ✅ | `convex/actions/agent/tools/normalize-route.ts` |
| 05 - RouteIndex computation | ✅ | `convex/actions/agent/tools/compute-route-index.ts` |
| 06 - Conditions + wind overlay | ✅ | `convex/actions/agent/providers/weather-provider.ts`, `tools/probe-conditions.ts`, `tools/map-conditions.ts` |
| 07 - Reliability standards | ✅ | Timeouts + concurrency caps in all providers + tools |
| 08 - PlanRide orchestration | ✅ | `convex/actions/agent/planRide.ts`, `convex/actions/agent/graphs/planningGraph.ts` |

**Ready for**: Sprint 4 frontend integration (Route Options UI), or next backend iteration (real routing provider, additional overlays)
