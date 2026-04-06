# US-063: Road Curvature Scoring Tool

> Task ID: US-063
> Type: FEATURE
> Priority: P0
> Estimate: 120 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- Create agent tool `getCurvature` that calculates a curvature score for a road segment using OSM geometry data
- Use the circumcircle-radius algorithm from roadcurvature.com: for every 3-point sequence, compute curve radius → weight by tightness → sum weighted lengths
- Return: curvature score (numeric), rating label ("very_twisty" / "twisty" / "moderate" / "mild" / "straight"), and km spent cornering

### NEVER
- Depend on an external curvature API — compute in-process from OSM geometry returned by Overpass
- Return curvature for unpaved roads without flagging surface status — always include surface info alongside score
- Block the agent if Overpass fails — return `null` score with `status: 'unavailable'`

### STRICTLY
- Curvature thresholds match roadcurvature.com: ≥1000 = very_twisty, ≥600 = twisty, ≥300 = moderate, ≥100 = mild, <100 = straight
- Curve radius buckets: straight (>175m radius, weight 0), sweeping (100-175m, weight 1), tight (60-100m, weight 2), hairpin (<60m, weight 4)
- Compute on the OSM way geometry returned by `lookupRoad` (US-062) — do NOT make a separate Overpass call

## SPECIFICATION

**Objective:** Give the LLM a tool to score roads by motorcycle-relevant curviness so it can pick "the fun road" over "the boring road" when authoring route sketches.

**Success looks like:** LLM calls `getCurvature("Skyline Boulevard", {bbox})` and gets `{ score: 2400, rating: "very_twisty", kmCornering: 4.2, segmentCount: 47 }` — enabling it to say "I'm recommending Skyline Blvd (curvature: 2400) because you asked for twisty roads."

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | A road known to be very twisty (e.g., "Skyline Boulevard" in Bay Area with many curves) | `getCurvature` is called with the road's OSM geometry | Returns score ≥ 1000 with rating "very_twisty" and positive kmCornering value | `npx vitest run convex/actions/agent/tools/__tests__/getCurvature.test.ts -t "twisty road"` |
| 2 | A straight highway (e.g., a segment of Interstate 5) | `getCurvature` is called with the road's OSM geometry | Returns score < 100 with rating "straight" and near-zero kmCornering | `npx vitest run convex/actions/agent/tools/__tests__/getCurvature.test.ts -t "straight road"` |
| 3 | An array of OSM way coordinates representing a road with mixed curves and straights | `calculateCurvatureScore` is called on the geometry | Returns a score that correctly weights tight curves (4x) over sweeping curves (1x) | `npx vitest run convex/actions/agent/tools/__tests__/getCurvature.test.ts -t "mixed geometry"` |
| 4 | OSM geometry with fewer than 3 points (edge case) | `calculateCurvatureScore` is called | Returns score 0 with rating "straight" — does NOT throw | `npx vitest run convex/actions/agent/tools/__tests__/getCurvature.test.ts -t "minimal geometry"` |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | getCurvature returns score ≥ 1000 and rating "very_twisty" for road geometry with many tight curves | AC-1 | `npx vitest run convex/actions/agent/tools/__tests__/getCurvature.test.ts -t "twisty road"` | [ ] TRUE [ ] FALSE |
| 2 | getCurvature returns score < 100 and rating "straight" for road geometry with minimal curves | AC-2 | `npx vitest run convex/actions/agent/tools/__tests__/getCurvature.test.ts -t "straight road"` | [ ] TRUE [ ] FALSE |
| 3 | calculateCurvatureScore weights hairpin curves at 4x and sweeping curves at 1x | AC-3 | `npx vitest run convex/actions/agent/tools/__tests__/getCurvature.test.ts -t "mixed geometry"` | [ ] TRUE [ ] FALSE |
| 4 | calculateCurvatureScore returns score 0 for geometry with fewer than 3 points | AC-4 | `npx vitest run convex/actions/agent/tools/__tests__/getCurvature.test.ts -t "minimal geometry"` | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/tools/getCurvature.ts` (NEW) — curvature calculation + agent tool
- `convex/actions/agent/tools/__tests__/getCurvature.test.ts` (NEW) — tests with fixture geometry
- `convex/actions/agent/lib/piTools.ts` (MODIFY) — add `getCurvature` schema
- `convex/actions/agent/lib/geo.ts` (NEW if needed) — shared geometry utilities (circumcircle, haversine)

### WRITE-PROHIBITED
- `convex/actions/agent/tools/findScenicWaypoints.ts` — read only
- `convex/actions/agent/ridePlanningAgent.ts` — wiring happens in US-069

## DESIGN

### References
- Research: holocron doc `js71smnvvxr3k1z5gmbydspsh184bqz7` §2 (Road Quality & Motorcycle-Specific Scoring)
- Algorithm: https://roadcurvature.com/how-it-works — circumcircle radius method
- Source code: https://github.com/adamfranco/curvature — Python reference implementation

### Interaction Notes
- Tool can consume geometry from `lookupRoad` response (US-062) — avoid redundant Overpass calls
- Alternatively, the tool makes its own Overpass call if called standalone
- The LLM uses curvature scores to COMPARE roads: "Skyline (2400) vs Page Mill (800)"

### Code Pattern
Source: roadcurvature.com algorithm (adapted to TypeScript)

```typescript
function calculateCurvatureScore(coords: {lat: number, lng: number}[]): CurvatureResult {
  if (coords.length < 3) return { score: 0, rating: 'straight', kmCornering: 0 }
  
  let totalWeightedLength = 0
  for (let i = 0; i < coords.length - 2; i++) {
    const radius = circumcircleRadius(coords[i], coords[i+1], coords[i+2])
    const segmentLength = haversineDistance(coords[i], coords[i+1])
    const weight = radius < 60 ? 4 : radius < 100 ? 2 : radius < 175 ? 1 : 0
    totalWeightedLength += segmentLength * weight
  }
  
  const rating = totalWeightedLength >= 1000 ? 'very_twisty' 
    : totalWeightedLength >= 600 ? 'twisty'
    : totalWeightedLength >= 300 ? 'moderate'
    : totalWeightedLength >= 100 ? 'mild' : 'straight'
  
  return { score: Math.round(totalWeightedLength), rating, kmCornering: totalWeightedLength / 1000 }
}
```

### Anti-pattern (DO NOT)
Do NOT use a simple start-to-end distance ratio as a curvature proxy — this was tried by roadcurvature.com and fails for circular roads and broad directional changes. The circumcircle-radius method is the correct approach.

## CODING STANDARDS

- **`convex/_generated/ai/guidelines.md`**: Convex patterns
- **`brain/docs/TDD-METHODOLOGY.md`**: RED-GREEN-REFACTOR

## DEPENDENCIES

- Depends on: US-062 (lookupRoad provides OSM geometry that getCurvature can consume)
- Blocks: US-069 (wiring to agent)

## REQUIRED READING

1. `convex/actions/agent/tools/findScenicWaypoints.ts`
   - Focus: Overpass response parsing, geometry extraction

2. https://roadcurvature.com/how-it-works
   - Focus: Circumcircle radius algorithm, weight buckets, thresholds

## NOTES

- The circumcircle radius formula uses three points to find the radius of the circle passing through all three. This is a standard geometry operation — no external library needed.
- For unit tests, create fixture geometry arrays: a known-twisty road (synthetic zigzag with tight radii), a straight road (linear points), and a mixed road.
- The Haversine formula converts lat/lng distances to meters — needed for segment length calculation.
