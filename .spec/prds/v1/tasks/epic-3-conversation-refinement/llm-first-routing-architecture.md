# US-020: LLM-First Routing Architecture ("The Californians Pattern")

> Task ID: US-020
> Epic: 3 — Conversation Refinement
> Type: FEATURE
> Priority: P0
> Estimate: 4-6 hours
> Blocked By: Epic 2
> Status: DRAFT

## Problem Statement

The current route sketch system uses the LLM as a dictation interface — the rider names specific roads and the LLM transcribes them into a sketch. This misses the core value proposition: **the LLM should be an opinionated navigator that draws on its knowledge of road networks to author creative routes**, not just repeat what the rider said.

Three architectural gaps prevent this:

1. **Segments are decorative** — `buildGoogleRequestBody` only sends `anchorPoints` as lat/lng intermediates. The road names in `segments` are metadata only. Google routes through waypoints however it wants, ignoring the LLM's road choices.

2. **All-or-nothing compilation** — `compileSketch` sends the entire route in one Google Maps call. If one segment fails, the error is "ROUTING_COMPILE_FAILED" with no indication of which leg broke or why. The LLM can't surgically revise.

3. **LLM only used for constraints, not creativity** — The system prompt routes generic requests ("SF to LA, scenic") through the deterministic Overpass/clustering path. The LLM's road knowledge is never tapped for the creative part — picking the roads.

## Design: The Californians Pattern

Named after the SNL sketch ("take the 5 to the 405 to the 101..."), this pattern makes the LLM the primary route navigator:

```
┌─────────────────────────────────────────────────────┐
│  1. LLM AUTHORS ROUTE                              │
│     "Take the 280 south to 92, hop on Skyline Blvd │
│      down to Alice's Restaurant, then drop to HMB" │
│                                                     │
│  Input: rider request (even generic "scenic ride")  │
│  Output: RouteSketch with segments + anchorPoints   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  2. GOOGLE MAPS VALIDATES PER-SEGMENT               │
│     Segment 1: 280 → Junction 92     ✅ OK         │
│     Segment 2: Skyline Blvd → Alice's ✅ OK        │
│     Segment 3: Alice's → HMB          ✅ OK        │
│                                                     │
│  Each segment compiled independently               │
│  Failed segments return specific error context      │
└──────────────────────┬──────────────────────────────┘
                       │
              ┌────────┴────────┐
              │ All pass?       │
              ▼                 ▼
         ┌────────┐      ┌──────────────────────────┐
         │  YES   │      │  NO — Feedback to LLM    │
         │ Stitch │      │  "Segment 3 failed:      │
         │ legs   │      │   Skyline doesn't reach   │
         │ into   │      │   HMB directly. Google    │
         │ route  │      │   suggests via Hwy 84."   │
         └────────┘      └────────────┬─────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │ LLM REVISES   │
                              │ only failed   │
                              │ segments      │
                              └───────┬───────┘
                                      │
                                      ▼
                              (back to step 2,
                               max 3 retries)
```

## Architecture Changes

### 1. LLM-First System Prompt

**File:** `convex/actions/agent/ridePlanningAgent.ts` — `buildSystemPrompt()`

The LLM should ALWAYS sketch a route, even for generic requests. The deterministic orchestrator becomes a fallback for when the LLM can't produce a sketch (e.g., unknown areas).

```
Current behavior:
  Generic request → deterministic orchestrator (planRoute)
  Constraint request → LLM sketch (createRouteSketch + compileSketch)

Target behavior:
  ALL requests → LLM sketch first
  LLM uncertain about roads → falls back to planRoute
```

**Prompt direction:**
- "You are an expert motorcycle navigator who knows road networks. For ANY route request, author a high-level itinerary using roads you know."
- "Even for 'scenic ride to Santa Cruz,' pick specific roads: 'Take 280 south to 92, then Skyline Blvd to Alice's, drop down 84 to 1 for the last stretch.'"
- "When the rider says 'avoid Market Street,' you don't need an avoidRoads API — just route around it in your sketch."
- "If you're unsure about roads in an area, say so and fall back to planRoute."

### 2. Per-Segment Compilation

**File:** `convex/actions/agent/tools/compileSketch.ts`

Instead of one Google Maps call with all anchors, compile each segment independently:

```typescript
// New: compileSegments — validates each segment independently
type SegmentResult = {
  segmentIndex: number
  roadName: string
  status: 'ok' | 'failed'
  route?: ProviderRouteResponse  // if ok
  error?: string                  // if failed
  suggestion?: string             // Google's alternative interpretation
}

async function compileSegments(
  segments: RouteSketch['segments'],
  anchorPoints: RouteSketch['anchorPoints'],
  preferences: PlanInput['preferences']
): Promise<SegmentResult[]>
```

**How it works:**
- For each segment, find the from/to anchorPoints by name matching
- Make a separate Google Maps call per segment (start → end of that leg)
- Collect results: which segments routed, which failed
- On success: stitch leg polylines into a single route
- On failure: return rich per-segment errors

### 3. Rich Retry Feedback

**File:** `convex/actions/agent/ridePlanningAgent.ts` — error handling in `runCompileSketch`

When segments fail, return structured feedback the LLM can act on:

```typescript
// Instead of generic "ROUTING_COMPILE_FAILED":
{
  type: 'partial_route',
  succeeded: [
    { segmentIndex: 0, roadName: 'Highway 280', status: 'ok' },
    { segmentIndex: 1, roadName: 'Skyline Blvd', status: 'ok' },
  ],
  failed: [
    {
      segmentIndex: 2,
      roadName: 'Old La Honda Road',
      fromName: "Alice's Restaurant",
      toName: 'Half Moon Bay',
      error: 'No route found between these points on this road',
      suggestion: 'Highway 84 connects these points (12 min, 8 miles)',
    },
  ],
  retryGuidance: 'revise_failed_segments',
  hint: 'Revise only the failed segments. Keep segments 0-1 unchanged.',
}
```

### 4. Road-Aware Waypoint Placement

**File:** `convex/actions/agent/tools/compileSketch.ts` — `buildWaypoints()`

To force Google through a specific road, place multiple waypoints along it — not just at endpoints. The LLM should include `viaNames` with intermediate points that pin the route.

**Example:** To force "Skyline Blvd" between two junctions:
- AnchorPoint: "Junction 92" (start of segment)
- AnchorPoint: "Skeggs Point on Skyline" (mid-road pin)
- AnchorPoint: "Alice's Restaurant" (end of segment)

The LLM's knowledge of landmarks along roads becomes the mechanism for road specificity.

### 5. Post-Route Validation (Optional, Phase 2)

After Google returns a route, validate that it actually uses the named roads. Google's step-level response includes road names — compare against the sketch's segment road names. If Google silently rerouted away from the requested road, flag it back.

This requires requesting additional fields in the Google Routes API field mask:
```
routes.legs.steps.navigationInstruction.roadName
```

## Files to Modify

| File | Change |
|------|--------|
| `convex/actions/agent/ridePlanningAgent.ts` | System prompt: LLM-first routing. Error handling: structured per-segment feedback. |
| `convex/actions/agent/tools/compileSketch.ts` | Per-segment compilation. Segment stitching. Rich error context. |
| `convex/actions/agent/providers/routingProvider.ts` | New `routeSegment()` method for single-segment routing. Optionally add step-level field mask for road name validation. |
| `convex/actions/agent/lib/piTools.ts` | Update `compileSketch` schema to support partial results in response. |
| `models/route-sketch.ts` | No schema changes needed — segments + anchorPoints already support this pattern. |

## Acceptance Criteria

- [ ] **AC1:** Generic request ("scenic ride to Santa Cruz") produces an LLM-authored sketch with named roads, not just the deterministic orchestrator output
- [ ] **AC2:** Each segment is validated independently by Google Maps — a single failed segment does not block the entire route
- [ ] **AC3:** When a segment fails, the LLM receives structured feedback identifying WHICH segment failed and WHY, and retries with revised segments (max 3 attempts)
- [ ] **AC4:** "Avoid X" constraints work by the LLM routing around X in its sketch — no Google Maps `avoidRoads` API needed
- [ ] **AC5:** If the LLM hallucinates a road that doesn't exist, Google Maps catches it and the LLM recovers with an alternative
- [ ] **AC6:** Deterministic orchestrator (`planRoute`) remains available as fallback when the LLM is uncertain about road networks in an area

## Considerations

### LLM Road Knowledge Accuracy

LLMs have decent but imperfect knowledge of major road networks. This architecture embraces that imperfection — Google Maps is the ground truth, and the retry loop handles hallucinations. The LLM doesn't need to be perfect, just good enough to propose plausible routes that Google can validate or correct.

### API Cost

Per-segment compilation means more Google Maps API calls per route (one per segment vs one per route). A 5-segment route = 5 API calls. Mitigations:
- Cap segments at 10 (already limited to 20 in schema, tighten for this flow)
- Cache segment results for common corridors
- The retry loop adds calls only for failed segments, not the whole route

### Latency

Sequential per-segment compilation would be slow. Compile all segments in parallel (`Promise.allSettled`) since they're independent. The stitching step is O(n) and negligible.

### The SNL Reference

"The Californians" sketch works because the characters have encyclopedic knowledge of LA freeways and strong opinions about which routes to take. That's exactly the role the LLM should play — opinionated, knowledgeable, and willing to argue about the best way to get there.
