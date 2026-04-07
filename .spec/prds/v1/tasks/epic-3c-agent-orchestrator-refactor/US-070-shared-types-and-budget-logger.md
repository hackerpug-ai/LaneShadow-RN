# US-070: Create Shared Agent Types, BudgetTracker Log Mode, and Extract Shared Utilities

> Epic: 3c — Agent Orchestrator Refactor
> Sequence: 1 (no dependencies)
> Agent: convex-implementer
> Reviewer: convex-reviewer

## Context

The multi-agent orchestrator needs shared type contracts between the orchestrator and sub-agents. The BudgetTracker needs a non-throwing log mode so we can observe real cost patterns before setting hard limits per agent.

Additionally, several utilities are duplicated across tool files and need extraction into shared modules before the agent split. Doing this first prevents the refactor from propagating duplicates into new agent files.

## Acceptance Criteria

- [ ] `convex/actions/agent/agents/types.ts` exists with:
  - `RoutingAgentResult` union: `{ status: 'route_ready', routePlanId, summary }` | `{ status: 'needs_clarification', question }` | `{ status: 'failed', reason }`
  - `EnrichmentAgentResult` union: `{ status: 'answered', data, summary }` | `{ status: 'not_applicable', reason }`
  - `SubAgentConfig` type: `{ ctx: AgentContext, executeCtx?: ExecuteContext, budgetTracker: BudgetTracker, userMessage: string }`
- [ ] `BudgetTracker` constructor accepts optional `{ mode: 'log' | 'gate' }` (default: `'log'`)
- [ ] In `'log'` mode, `add()` logs a warning with `console.warn` when limit exceeded but does NOT throw
- [ ] In `'gate'` mode, `add()` throws `ConvexError` as before (backwards compatible)
- [ ] `add()` accepts optional `agentLabel: string` parameter, logged as `[BudgetTracker] agent={label} cost=${cost} cumulative=${total}`
- [ ] Existing `budgetTracker.test.ts` passes unchanged (gate mode is backwards compatible)
- [ ] New test cases for log mode: verify no throw on exceed, verify console.warn called

## Reusable Modules to Extract

Before the agent split, extract duplicated utilities into shared modules. These are currently copy-pasted across tool files.

### Enhance `lib/geo.ts` (existing — 57 lines)

Currently exports: `LatLng`, `haversineDistance` (meters), `circumcircleRadius`

Add:
- `haversineKm(a: LatLng, b: LatLng): number` — thin wrapper, `haversineDistance(a, b) / 1000`
  - Duplicated in: `tools/searchAlongRoute.ts` (local `haversineKm`, lines 133-148)
  - Duplicated in: `tools/getElevation.ts` (local `haversineMeters`, identical to `haversineDistance`)
- `decodePolyline(encoded: string): LatLng[]` — Google encoded polyline decoder
  - Duplicated in: `tools/searchAlongRoute.ts` (local `decodePolyline`, lines 92-128)
  - Will be needed by `searchNearby` (US-076) for potential future use
- `samplePolyline(polyline: LatLng[], maxPoints: number): LatLng[]` — downsample preserving first/last
  - Duplicated in: `tools/getElevation.ts` (exported `samplePolyline`, lines 64-80)
  - Duplicated in: `tools/getRouteWeather.ts` (local `samplePolyline`, lines 43-68, different signature: no maxPoints param, uses fixed MIN/MAX constants)

### Create `providers/placesProvider.ts` (new)

Extract Google Places API access from `tools/searchAlongRoute.ts` (lines 215-277) into a provider factory, matching the pattern of `geocodingProvider.ts`, `routingProvider.ts`, `weatherProvider.ts`.

```typescript
export function createPlacesProvider() {
  return {
    searchAlongRoute(params: { polyline: string; query: string; origin?: LatLng }): Promise<PlaceResult[]>,
    searchNearby(params: { query: string; location: LatLng; radiusMeters?: number }): Promise<PlaceResult[]>,
  }
}
```

- Both methods use the same `places.googleapis.com/v1/places:searchText` endpoint
- `searchAlongRoute` passes `searchAlongRouteParameters.polyline`
- `searchNearby` passes `locationBias.circle`
- Shared: API key from `GOOGLE_MAPS_API_KEY`, field mask, max result count, `PlaceResult` type
- This eliminates the anti-pattern of `process.env.GOOGLE_MAPS_API_KEY ?? ''` in `searchAlongRoute.ts`

### Create `providers/webSearchProvider.ts` (new)

Jina Search wrapper, adapted from holocron patterns at `/Users/justinrich/Projects/holocron/convex/research/search.ts` (lines 469-502) and `/Users/justinrich/Projects/holocron/convex/research/tools.ts` (lines 185-261).

```typescript
export function createWebSearchProvider() {
  return {
    search(params: { query: string; maxResults?: number }): Promise<WebSearchHit[]>,
  }
}

export type WebSearchHit = { title: string; snippet: string; url: string }
```

- Endpoint: `GET https://s.jina.ai/?q=${encodedQuery}`
- Headers: `Accept: application/json`, optional `Authorization: Bearer ${JINA_API_KEY}`
- Response: `{ data: [{ url, title, description }] }` — map `description` → `snippet`
- Truncate snippets to 200 chars (holocron uses 500, but agent context is tighter)
- Timeout: 8 seconds via `withTimeout` from `lib/reliability.ts`
- Soft-fail: returns `[]` on error (never throws)
- No rate limiting needed initially — Jina free tier is 100 RPM, agent use is ~1-2 QPM

## Files to Modify

| File | Change |
|------|--------|
| `convex/actions/agent/agents/types.ts` | **CREATE** — shared type definitions |
| `convex/actions/agent/budgetTracker.ts` | Add `mode` option and `agentLabel` to `add()` |
| `convex/actions/agent/__tests__/budgetTracker.test.ts` | Add log mode test cases |
| `convex/actions/agent/lib/geo.ts` | Add `haversineKm`, `decodePolyline`, `samplePolyline` |
| `convex/actions/agent/tools/searchAlongRoute.ts` | Remove local `haversineKm`, `decodePolyline` — import from `lib/geo.ts` |
| `convex/actions/agent/tools/getElevation.ts` | Remove local `haversineMeters`, `samplePolyline` — import from `lib/geo.ts` |
| `convex/actions/agent/tools/getRouteWeather.ts` | Remove local `samplePolyline` — import from `lib/geo.ts` (adapt to use maxPoints param) |
| `convex/actions/agent/providers/placesProvider.ts` | **CREATE** — Google Places factory wrapping searchAlongRoute + searchNearby |
| `convex/actions/agent/providers/webSearchProvider.ts` | **CREATE** — Jina Search factory (adapted from holocron) |

## Implementation Notes

- Import `AgentContext` and `ExecuteContext` types from `../ridePlanningAgent` in types.ts (these exports survive the refactor)
- Import `Id` from `../../../_generated/dataModel` for `routePlanId` typing
- The `mode` default is `'log'` — we flip to `'gate'` when we have cost data from production
- `agentLabel` is optional to preserve backwards compatibility with existing `add(usage)` calls
- `SubAgentConfig` does NOT include a model field — each agent selects its own model internally (orchestrator uses frontier `AI_MODEL`, sub-agents use Haiku). See `EPIC.md` Model Selection section.
- `getElevation.test.ts` imports `samplePolyline` from `getElevation.ts` — update import to `lib/geo.ts` and verify tests pass
- The `getRouteWeather.ts` variant of `samplePolyline` uses fixed constants (MIN_WEATHER_SAMPLES=3, MAX_WEATHER_SAMPLES=5) instead of a `maxPoints` param — unify by passing `maxPoints: 5` at the call site
