# US-066: Google Search Along Route Tool

> Task ID: US-066
> Type: FEATURE
> Priority: P1
> Estimate: 90 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- Create agent tool `searchAlongRoute` that uses Google Places Text Search with Search Along Route (SAR) parameters
- Accept: encoded polyline, search query (e.g., "gas station", "restaurant"), and optional origin offset (hours into trip)
- Return: up to 5 places with name, address, type, detour time, and distance from route

### NEVER
- Make SAR calls without a route polyline — this tool requires a compiled route first
- Return more than 10 results (UI can't render more; LLM can't reason about more)
- Use deprecated Places API endpoints — use the new `places:searchText` endpoint with `searchAlongRouteParameters`

### STRICTLY
- Use encoded polyline from the Routes API response (already available after compileSegments)
- Include `routingParameters.origin` for detour time calculation when origin offset is provided
- Request routing summaries for distance/duration to each place

## SPECIFICATION

**Objective:** Let the LLM find relevant stops (gas, food, scenic overlooks) along a planned route so it can proactively suggest them or respond to rider requests like "find me lunch halfway through."

**Success looks like:** LLM calls `searchAlongRoute(polyline, "restaurant", {originOffset: 2})` and gets `[{ name: "Alice's Restaurant", detourMinutes: 3, distanceFromRoute: "0.2 mi" }, ...]`.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | An encoded route polyline and query "gas station" | `searchAlongRoute` is called | Returns 1-5 gas stations along the route with name and address | `npx vitest run convex/actions/agent/tools/__tests__/searchAlongRoute.test.ts -t "basic search"` |
| 2 | A polyline, query "restaurant", and originOffset of 2 hours | `searchAlongRoute` is called | Returns restaurants biased toward the 2-hour mark of the route, with detour time per result | `npx vitest run convex/actions/agent/tools/__tests__/searchAlongRoute.test.ts -t "offset search"` |
| 3 | A polyline and query with no results (e.g., "scuba shop" on a mountain route) | `searchAlongRoute` is called | Returns empty array, does NOT throw | `npx vitest run convex/actions/agent/tools/__tests__/searchAlongRoute.test.ts -t "no results"` |
| 4 | Google Places API error (invalid key, rate limit) | `searchAlongRoute` is called | Returns `{ status: 'error', reason: 'places_api_error' }` without throwing | `npx vitest run convex/actions/agent/tools/__tests__/searchAlongRoute.test.ts -t "api error"` |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | searchAlongRoute returns 1-5 places with name and address for valid polyline and query | AC-1 | `npx vitest run convex/actions/agent/tools/__tests__/searchAlongRoute.test.ts -t "basic search"` | [ ] TRUE [ ] FALSE |
| 2 | searchAlongRoute returns places biased toward origin offset with detour time when offset provided | AC-2 | `npx vitest run convex/actions/agent/tools/__tests__/searchAlongRoute.test.ts -t "offset search"` | [ ] TRUE [ ] FALSE |
| 3 | searchAlongRoute returns empty array for queries with no matching places | AC-3 | `npx vitest run convex/actions/agent/tools/__tests__/searchAlongRoute.test.ts -t "no results"` | [ ] TRUE [ ] FALSE |
| 4 | searchAlongRoute returns error status without throwing on API failure | AC-4 | `npx vitest run convex/actions/agent/tools/__tests__/searchAlongRoute.test.ts -t "api error"` | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/tools/searchAlongRoute.ts` (NEW)
- `convex/actions/agent/tools/__tests__/searchAlongRoute.test.ts` (NEW)
- `convex/actions/agent/lib/piTools.ts` (MODIFY) — add `searchAlongRoute` schema

### WRITE-PROHIBITED
- `convex/actions/agent/providers/routingProvider.ts` — SAR is a Places API feature, not Routes
- `convex/actions/agent/ridePlanningAgent.ts` — wiring in US-069

## DESIGN

### References
- Research: holocron §4 (Points of Interest Along Route)
- Google docs: https://developers.google.com/maps/architecture/search-along-route-places-and-routes-api
- Google Places Text Search: `POST /v1/places:searchText` with `searchAlongRouteParameters`

### Interaction Notes
- Requires a compiled route polyline — called AFTER compileSegments, not before
- The LLM can proactively call this for gas stations on long routes without being asked
- Origin offset allows "find food 2 hours in" — uses Routes API step durations to find the point

### Code Pattern
```typescript
const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.types,routingSummaries'
  },
  body: JSON.stringify({
    textQuery: query,
    searchAlongRouteParameters: {
      polyline: { encodedPolyline: routePolyline }
    },
    routingParameters: originOffset ? {
      origin: { latitude: originPoint.lat, longitude: originPoint.lng }
    } : undefined,
    maxResultCount: 5
  })
})
```

### Anti-pattern (DO NOT)
Do NOT use the deprecated Nearby Search API — use the new Text Search with SAR parameters. Do NOT hardcode place types — let the LLM pass natural language queries ("scenic overlook", "coffee shop with parking").

## CODING STANDARDS

- **`convex/_generated/ai/guidelines.md`**: Convex patterns
- **`brain/docs/TDD-METHODOLOGY.md`**: RED-GREEN-REFACTOR

## DEPENDENCIES

- Depends on: Epic 3 (compileSegments provides the encoded polyline)
- Blocks: US-069 (wiring)

## REQUIRED READING

1. Google Search Along Route tutorial: https://developers.google.com/maps/architecture/search-along-route-places-and-routes-api
2. `convex/actions/agent/providers/routingProvider.ts` — where encoded polylines come from

## NOTES

- Google Places API (New) pricing: ~$32 per 1,000 Text Search requests. Budget for this.
- The `routingSummaries` field returns detour duration/distance — critical for the LLM to say "3 minute detour."
- For unit tests, mock the Places API response.
