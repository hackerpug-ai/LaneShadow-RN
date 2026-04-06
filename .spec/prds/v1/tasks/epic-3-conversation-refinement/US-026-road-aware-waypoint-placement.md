# US-026: Road-Aware Waypoint Placement via viaNames

> Task ID: US-026
> Type: FEATURE
> Priority: P1
> Estimate: 60 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- When compiling a segment, use `viaNames` from the segment to place intermediate waypoints that pin Google Maps to the intended road
- Resolve viaNames to coordinates by matching against the sketch's anchorPoints (by name)
- Pass resolved viaNames as `intermediates` in the Google Maps API call for that segment

### NEVER
- Geocode viaNames via external API calls — they must resolve from the sketch's anchorPoints (the LLM provides coordinates)
- Add more than 3 intermediate waypoints per segment (Google Maps API limit for free tier is ~25 total waypoints; with 10 segments we need headroom)
- Fail silently if a viaName can't be resolved — log a warning and skip that waypoint

### STRICTLY
- viaNames are optional on segments — if absent or empty, compile with just origin → destination (existing behavior)
- Waypoint resolution is case-insensitive, whitespace-trimmed name matching against anchorPoints
- Order of intermediates must match the order of viaNames in the segment (preserves road traversal sequence)

## SPECIFICATION

**Objective:** Force Google Maps to route through specific roads by placing intermediate waypoints along them, using the LLM's knowledge of landmarks as the pinning mechanism.

**Success looks like:** When the LLM says "Skyline Blvd from Junction 92 to Alice's Restaurant via Skeggs Point," the compiled segment includes Skeggs Point as an intermediate waypoint, forcing Google through Skyline Blvd instead of a potentially faster alternative.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Segment with viaNames: ["Skeggs Point"] and matching anchorPoint with lat/lng | `compileSingleSegment()` is called | Google Maps request includes Skeggs Point as intermediate waypoint between origin and destination | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts` |
| 2 | Segment with viaNames: ["Point A", "Point B"] (two viaNames) | `compileSingleSegment()` is called | Intermediates are ordered [Point A, Point B] matching viaNames order | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts` |
| 3 | Segment with viaNames: ["Unknown Point"] (no matching anchorPoint) | `compileSingleSegment()` is called | Warning logged, Unknown Point skipped, segment compiles with just origin → destination | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts` |
| 4 | Segment with no viaNames (undefined or empty array) | `compileSingleSegment()` is called | Compiles with just origin → destination, no intermediates (existing behavior preserved) | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts` |
| 5 | Segment with 5 viaNames (exceeds 3 cap) | `compileSingleSegment()` is called | Only first 3 viaNames used as intermediates, rest skipped with warning | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts` |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | compileSingleSegment includes viaName-resolved coordinates as intermediates in Google Maps request when viaNames match anchorPoints | AC-1 | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts -t "viaName intermediate"` | [ ] TRUE [ ] FALSE |
| 2 | Intermediates order matches viaNames order when multiple viaNames are present | AC-2 | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts -t "viaName order"` | [ ] TRUE [ ] FALSE |
| 3 | Unresolvable viaNames are skipped with warning when no matching anchorPoint exists | AC-3 | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts -t "viaName unresolved"` | [ ] TRUE [ ] FALSE |
| 4 | Segment compiles without intermediates when viaNames is absent or empty | AC-4 | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts -t "no viaNames"` | [ ] TRUE [ ] FALSE |
| 5 | Only first 3 viaNames are used when segment has more than 3 viaNames | AC-5 | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts -t "viaName cap"` | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/tools/compileSketch.ts` (MODIFY) — update `compileSingleSegment()` to resolve viaNames and pass as intermediates
- `convex/actions/agent/tools/compileSketch.test.ts` (MODIFY) — add viaName resolution tests

### WRITE-PROHIBITED
- `convex/actions/agent/providers/routingProvider.ts` — `buildGoogleRequestBody()` already supports intermediates (lines 136-141)
- `models/route-sketch.ts` — viaNames already defined on RouteSketchSegment (line 10)
- `convex/actions/agent/lib/piTools.ts` — createRouteSketch schema already includes viaNames

## DESIGN

### References
- PRD: `.spec/prds/v1/tasks/epic-3-conversation-refinement/llm-first-routing-architecture.md` §4 (Road-Aware Waypoint Placement)
- Existing: `models/route-sketch.ts:10` — `viaNames?: string[]` already on RouteSketchSegment
- Existing: `convex/actions/agent/providers/routingProvider.ts:136-141` — intermediates handling in buildGoogleRequestBody

### Interaction Notes
- The LLM includes viaNames when it wants to pin a road: "Skyline Blvd via Skeggs Point, Kings Mountain"
- The LLM must also include corresponding anchorPoints with coordinates for each viaName
- The system prompt (US-024) guides the LLM to include intermediate landmarks in viaNames
- If the LLM forgets to add anchorPoints for viaNames, they silently degrade (skip) — not an error

### Code Pattern
Source: `convex/actions/agent/tools/compileSketch.ts` (compileSingleSegment, to be added in US-021)

```typescript
function resolveViaWaypoints(
  segment: RouteSketchSegment,
  anchorPoints: RouteSketchAnchorPoint[]
): Array<{ lat: number; lng: number }> {
  if (!segment.viaNames?.length) return []
  
  const MAX_VIA = 3
  const resolved: Array<{ lat: number; lng: number }> = []
  
  for (const viaName of segment.viaNames.slice(0, MAX_VIA)) {
    const anchor = anchorPoints.find(
      ap => ap.name.trim().toLowerCase() === viaName.trim().toLowerCase()
        && ap.lat != null && ap.lng != null
    )
    if (anchor) {
      resolved.push({ lat: anchor.lat!, lng: anchor.lng! })
    } else {
      console.warn(`viaName "${viaName}" has no matching anchorPoint with coordinates — skipping`)
    }
  }
  
  if (segment.viaNames.length > MAX_VIA) {
    console.warn(`Segment "${segment.roadName}" has ${segment.viaNames.length} viaNames, capped at ${MAX_VIA}`)
  }
  
  return resolved
}
```

### Anti-pattern (DO NOT)
Do NOT geocode viaNames via Google Geocoding API. The LLM provides coordinates in anchorPoints — geocoding would add latency, cost, and a failure mode. If the LLM didn't provide coordinates, gracefully degrade.

## CODING STANDARDS

- **`convex/_generated/ai/guidelines.md`**: Convex patterns
- **`brain/docs/TDD-METHODOLOGY.md`**: RED-GREEN-REFACTOR cycle

## DEPENDENCIES

Depends On:
- US-021 — `compileSingleSegment()` function where viaName resolution is integrated

Blocks:
- None — this enhances route accuracy but isn't gating other tasks

## REQUIRED READING

1. `models/route-sketch.ts`
   - Lines: 6-11 (RouteSketchSegment)
   - Focus: `viaNames?: string[]` field definition

2. `convex/actions/agent/providers/routingProvider.ts`
   - Lines: 136-141 (intermediates in buildGoogleRequestBody)
   - Focus: How intermediates are already passed to Google Maps API

3. `convex/actions/agent/tools/compileSketch.ts`
   - Lines: 20-34 (current waypoint building)
   - Focus: How anchorPoints are currently filtered for coordinates

## NOTES

- viaNames is the key mechanism for road specificity. Without intermediate waypoints, Google Maps freely chooses the "best" route between two points, which may not be the rider's intended road.
- The 3-waypoint-per-segment cap is conservative. Google Maps supports up to 25 intermediates per request, but with up to 10 segments we need to budget carefully. If needed, this cap can be raised later.
- This task integrates into `compileSingleSegment()` from US-021. If US-021 implements it differently than expected, adapt the viaName resolution to fit the actual function signature.
