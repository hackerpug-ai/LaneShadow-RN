# US-076: Create searchNearby Tool

> Epic: 3c — Agent Orchestrator Refactor
> Sequence: 2 (depends on US-070, parallel with US-071/072/077)
> Agent: convex-implementer
> Reviewer: convex-reviewer

## Context

`searchAlongRoute` requires an encoded route polyline — it can't answer "is there a gas station nearby?" when no route exists. `searchNearby` is a simpler location-based Google Places search that only needs lat/lng + radius.

## Tool Schema

### Input (TypeBox)

```typescript
searchNearby: Type.Object({
  query: Type.String({
    description: 'Natural language search query (e.g., "gas station", "scenic overlook", "coffee shop")',
  }),
  location: Type.Object({
    lat: Type.Number({ description: 'Latitude in decimal degrees' }),
    lng: Type.Number({ description: 'Longitude in decimal degrees' }),
  }, { description: 'Center point for the search — use rider\'s current location' }),
  radiusMeters: Type.Union([Type.Number(), Type.Null()], {
    description: 'Search radius in meters. Null for default (5000m / ~3mi). Max 50000m.',
  }),
})
```

### Output

```typescript
type SearchNearbyResult =
  | PlaceResult[]                           // success — reuse existing PlaceResult type
  | { status: 'error'; reason: string }     // API failure

// PlaceResult (reused from searchAlongRoute.ts):
type PlaceResult = {
  name: string
  address: string
  types?: string[]
  distanceMeters?: number    // distance from search center (NEW — not detour)
}
```

## Reusable Modules

This tool reuses two modules created in US-070:

| Module | What it provides | Created in |
|--------|-----------------|------------|
| `providers/placesProvider.ts` | `createPlacesProvider().searchNearby()` — shared Google Places API wrapper | US-070 |
| `lib/geo.ts` | `haversineDistance()` for computing distance from search center | Existing (enhanced in US-070) |

The `searchNearby` tool is a **thin wrapper** around `placesProvider.searchNearby()` + `traceableToolAsync`. Most of the implementation lives in the provider.

## Acceptance Criteria

- [ ] `convex/actions/agent/tools/searchNearby.ts` exists
- [ ] Delegates to `createPlacesProvider().searchNearby()` (created in US-070) — does NOT call Google Places API directly
- [ ] Input: `query`, `location: { lat, lng }`, optional `radiusMeters` (default 5000m)
- [ ] Output: reuses `PlaceResult` type from `providers/placesProvider.ts`, with `distanceMeters` from search center
- [ ] Soft-fail: returns `{ status: 'error', reason }` on provider failure (never throws)
- [ ] Tool schema added to `piTools.ts` as `AgentToolSchemas.searchNearby`
- [ ] Wrapped with `traceableToolAsync` for observability (same pattern as `searchAlongRoute`)
- [ ] `searchAlongRoute.ts` also updated to use `createPlacesProvider().searchAlongRoute()` instead of direct API call (dedup)

## Files to Create/Modify

| File | Change |
|------|--------|
| `convex/actions/agent/tools/searchNearby.ts` | **CREATE** — thin wrapper around placesProvider |
| `convex/actions/agent/tools/searchAlongRoute.ts` | Refactor to use `createPlacesProvider().searchAlongRoute()` — remove direct API call, import `decodePolyline`/`haversineKm` from `lib/geo.ts` |
| `convex/actions/agent/lib/piTools.ts` | Add `searchNearby` schema |

## Implementation Notes

- The `placesProvider` (created in US-070) handles API key, endpoint, field mask, max results — the tool just passes params and wraps with tracing
- `distanceMeters` computed using `haversineDistance()` from `lib/geo.ts` between result location and search center
- The Google Places `searchText` API supports `locationBias` with a circle: `{ circle: { center: { latitude, longitude }, radius } }`
- No `routingSummaries` needed (no route to measure detour from)
- Request `places.location` in field mask to get result coordinates for distance calculation
