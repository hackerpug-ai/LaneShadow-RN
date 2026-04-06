# US-021: Per-Segment Compilation in Routing Provider

> Task ID: US-021
> Type: FEATURE
> Priority: P0
> Estimate: 90 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- Add `routeSegment()` method to routingProvider that routes a single segment (origin → destination with optional intermediates)
- Refactor `compileSketch()` to compile each segment independently via `Promise.allSettled()`
- Preserve existing `routeFromSketch()` as-is for backward compatibility with deterministic orchestrator

### NEVER
- Break the existing `planRideOrchestrator` pipeline — it uses `routeFromSketch()` which must continue working
- Make sequential per-segment calls — all segments MUST compile in parallel
- Allow more than 10 segments per sketch (tighten from current 20 limit for this flow)

### STRICTLY
- Each segment maps to exactly one Google Maps API call (origin → destination with viaNames as intermediates)
- Failed segments do not block successful ones — `Promise.allSettled()` collects all results
- Keep segment cap at 10 for per-segment flow (existing 20 limit stays for schema compatibility)

## SPECIFICATION

**Objective:** Enable independent per-segment validation by Google Maps so that a single failed road doesn't block the entire route.

**Success looks like:** `compileSegments()` takes a RouteSketch, makes one Google Maps call per segment in parallel, and returns an array of per-segment results (ok or failed) with timing under 3s for 5 segments.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | A RouteSketch with 3 valid segments and anchorPoints with lat/lng | `compileSegments()` is called | All 3 segments return `status: 'ok'` with valid ProviderRouteResponse per segment | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts` |
| 2 | A RouteSketch where segment 2 has an invalid road (no route between points) | `compileSegments()` is called | Segments 0 and 2 return `status: 'ok'`, segment 1 returns `status: 'failed'` with error details | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts` |
| 3 | A RouteSketch with 5 segments | `compileSegments()` is called | All 5 API calls execute in parallel (not sequentially) — total time < max(individual times) + 500ms | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts` |
| 4 | A RouteSketch with 12 segments (exceeds 10 cap) | `compileSegments()` is called | Returns error immediately without making any API calls | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts` |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | compileSegments returns ok status for all segments when all segments have valid roads | AC-1 | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts -t "all segments valid"` | [ ] TRUE [ ] FALSE |
| 2 | compileSegments returns failed status with error for invalid segment while other segments succeed | AC-2 | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts -t "partial failure"` | [ ] TRUE [ ] FALSE |
| 3 | compileSegments executes all segment API calls in parallel via Promise.allSettled | AC-3 | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts -t "parallel"` | [ ] TRUE [ ] FALSE |
| 4 | compileSegments rejects sketches with more than 10 segments before making API calls | AC-4 | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts -t "segment cap"` | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/tools/compileSketch.ts` (MODIFY) — add `compileSegments()` function
- `convex/actions/agent/tools/compileSketch.test.ts` (MODIFY) — add per-segment compilation tests
- `convex/actions/agent/providers/routingProvider.ts` (MODIFY) — add `routeSegment()` method
- `convex/actions/agent/providers/routingProvider.test.ts` (MODIFY) — add routeSegment tests

### WRITE-PROHIBITED
- `convex/actions/agent/lib/planRideOrchestrator.ts` — deterministic pipeline must not change
- `models/route-sketch.ts` — schema stays as-is
- `convex/actions/agent/ridePlanningAgent.ts` — wiring happens in US-023

## DESIGN

### References
- PRD: `.spec/prds/v1/tasks/epic-3-conversation-refinement/llm-first-routing-architecture.md` §2 (Per-Segment Compilation)
- Existing: `convex/actions/agent/providers/routingProvider.ts:118-147` — `buildGoogleRequestBody()` pattern
- Existing: `convex/actions/agent/tools/compileSketch.ts:40-66` — current single-shot compilation

### Interaction Notes
- `routeSegment()` reuses `buildGoogleRequestBody()` internally but scopes to segment's from/to anchorPoints
- AnchorPoint matching: each segment's `fromName`/`toName` matches anchorPoints by `name` field
- Intermediate waypoints from segment's `viaNames` map to anchorPoints with coordinates

### Code Pattern
Source: `convex/actions/agent/tools/compileSketch.ts:40-66`

```typescript
// New type for per-segment results
type SegmentResult = {
  segmentIndex: number
  roadName: string
  status: 'ok' | 'failed'
  route?: ProviderRouteResponse
  error?: string
  suggestion?: string
}

// New function alongside existing compileSketch
async function compileSegments(
  segments: RouteSketch['segments'],
  anchorPoints: RouteSketch['anchorPoints'],
  preferences: PlanInput['preferences']
): Promise<SegmentResult[]> {
  if (segments.length > 10) throw new Error('Segment cap exceeded (max 10)')
  
  const results = await Promise.allSettled(
    segments.map((seg, i) => compileSingleSegment(seg, anchorPoints, preferences, i))
  )
  // map settled results to SegmentResult[]
}
```

### Anti-pattern (DO NOT)
Do NOT modify the existing `compileSketch()` function signature or behavior. The new `compileSegments()` is a sibling function — the agent handler in US-023 decides which to call.

## CODING STANDARDS

- **`convex/_generated/ai/guidelines.md`**: Convex patterns
- **`brain/docs/TDD-METHODOLOGY.md`**: RED-GREEN-REFACTOR cycle

## DEPENDENCIES

No task dependencies. Can start immediately.

Blocks:
- US-022 (segment stitching)
- US-023 (error feedback)
- US-026 (road-aware waypoints)

## REQUIRED READING

1. `convex/actions/agent/providers/routingProvider.ts`
   - Lines: 118-147 (buildGoogleRequestBody), 60-116 (parseGoogleRoute)
   - Focus: How Google Routes API requests are built and responses parsed

2. `convex/actions/agent/tools/compileSketch.ts`
   - Lines: ALL
   - Focus: Current compilation flow, retry pattern, error handling

3. `models/route-sketch.ts`
   - Lines: ALL
   - Focus: RouteSketchSegment fields (roadName, fromName, toName, viaNames)

## NOTES

- The `routeSegment()` method on routingProvider is a thin wrapper around the existing Google Routes API call, scoped to a single segment's origin/destination/intermediates.
- AnchorPoint name matching should be case-insensitive and trim whitespace.
