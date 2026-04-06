# US-065: Elevation Profile Tool

> Task ID: US-065
> Type: FEATURE
> Priority: P1
> Estimate: 90 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- Create agent tool `getElevation` that takes a route polyline (array of lat/lng) and returns an elevation profile
- Return: total elevation gain (ft), total elevation loss (ft), max elevation (ft), max grade (%), and per-segment elevation data
- Use Open-Elevation API (free, SRTM data) as primary source with Google Elevation API as fallback

### NEVER
- Send more than 100 points per API call — sample the polyline at regular intervals if it exceeds this
- Block route compilation on elevation failure — elevation is enrichment, not validation
- Return metric-only values — always include imperial (feet) since US riders expect it

### STRICTLY
- Sample polyline at ~500m intervals for elevation queries (balances accuracy vs API cost)
- Grade calculation: `(elevation_change / horizontal_distance) * 100` between consecutive sampled points
- Flag segments with sustained grade > 8% (relevant for loaded touring motorcycles)

## SPECIFICATION

**Objective:** Enrich compiled routes with elevation data so the LLM can describe climbs, mountain passes, and elevation character in its route descriptions.

**Success looks like:** After a route is compiled, `getElevation(polyline)` returns `{ totalGainFt: 3200, totalLossFt: 2800, maxElevationFt: 4800, maxGradePct: 12, steepSegments: [{from: "mile 12", to: "mile 14", grade: 11}] }`.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | A route polyline with significant elevation changes (mountain road) | `getElevation` is called | Returns positive totalGainFt, totalLossFt, and maxGradePct > 5% | `npx vitest run convex/actions/agent/tools/__tests__/getElevation.test.ts -t "mountain route"` |
| 2 | A flat route polyline (coastal or valley road) | `getElevation` is called | Returns totalGainFt < 200, maxGradePct < 3% | `npx vitest run convex/actions/agent/tools/__tests__/getElevation.test.ts -t "flat route"` |
| 3 | A polyline with more than 100 points | `getElevation` is called | Samples down to ≤100 points before querying API | `npx vitest run convex/actions/agent/tools/__tests__/getElevation.test.ts -t "sampling"` |
| 4 | Open-Elevation API is unreachable | `getElevation` is called | Returns `{ status: 'unavailable' }` without throwing | `npx vitest run convex/actions/agent/tools/__tests__/getElevation.test.ts -t "api failure"` |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | getElevation returns positive gain/loss and grade above 5% for mountain road geometry | AC-1 | `npx vitest run convex/actions/agent/tools/__tests__/getElevation.test.ts -t "mountain route"` | [ ] TRUE [ ] FALSE |
| 2 | getElevation returns minimal gain and low grade for flat road geometry | AC-2 | `npx vitest run convex/actions/agent/tools/__tests__/getElevation.test.ts -t "flat route"` | [ ] TRUE [ ] FALSE |
| 3 | getElevation samples polyline to 100 or fewer points before API call | AC-3 | `npx vitest run convex/actions/agent/tools/__tests__/getElevation.test.ts -t "sampling"` | [ ] TRUE [ ] FALSE |
| 4 | getElevation returns unavailable status without throwing when API is unreachable | AC-4 | `npx vitest run convex/actions/agent/tools/__tests__/getElevation.test.ts -t "api failure"` | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/tools/getElevation.ts` (NEW)
- `convex/actions/agent/tools/__tests__/getElevation.test.ts` (NEW)
- `convex/actions/agent/lib/piTools.ts` (MODIFY) — add `getElevation` schema

### WRITE-PROHIBITED
- `convex/actions/agent/tools/compileSketch.ts` — elevation enrichment is separate from compilation
- `convex/actions/agent/ridePlanningAgent.ts` — wiring in US-069

## DESIGN

### References
- Research: holocron §3 (Elevation & Terrain Data)
- Open-Elevation API: https://open-elevation.com/ — POST /api/v1/lookup with locations array
- Google Elevation API: fallback only (costs ~$5/1000 requests)

### Interaction Notes
- Called AFTER route compilation — needs the polyline from Google Maps response
- LLM uses elevation data to describe routes: "This route climbs 3,200 ft through the Santa Cruz Mountains"
- Steep segment flagging helps the LLM warn about loaded touring conditions

### Code Pattern
```typescript
// Open-Elevation API call
const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    locations: sampledPoints.map(p => ({ latitude: p.lat, longitude: p.lng }))
  })
})
```

### Anti-pattern (DO NOT)
Do NOT compute grade from raw GPS elevation — GPS altitude is inaccurate. Always use DEM data from the elevation API. Do NOT send the full polyline to the API — sample at intervals.

## CODING STANDARDS

- **`convex/_generated/ai/guidelines.md`**: Convex patterns
- **`brain/docs/TDD-METHODOLOGY.md`**: RED-GREEN-REFACTOR

## DEPENDENCIES

- Depends on: Epic 3 (compiled route provides polyline)
- No task dependencies within this epic

## REQUIRED READING

1. Open-Elevation API docs: https://open-elevation.com/
2. `convex/actions/agent/tools/compileSketch.ts` — where compiled route polylines come from

## NOTES

- Open-Elevation free tier: 1,000 requests/month. A 5-segment route with sampling = ~5 API calls. Budget for ~200 route plans/month on free tier.
- For unit tests, mock the elevation API and use fixture polylines with known elevation profiles.
- Imperial conversion: meters * 3.281 = feet
