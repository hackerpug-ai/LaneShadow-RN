# LaneShadow Feature Plan: Waypoints & Enrichment

**Status:** Planning
**Created:** 2025-04-07
**Context:** Add waypoint management with deviation handling and re-enable enrichment with staggered processing

---

## Context

This plan addresses two high-value features for LaneShadow's route planning experience:

1. **Waypoints with On/Off-Route & Deviation Handling**: Users need to add stops to their routes, with clear feedback when a stop requires deviation from the optimal path.

2. **Staggered Enrichment with Invalidation**: The enrichment system exists but isn't integrated. We need to return routes immediately and continue enrichment in the background, with smart invalidation when routes change.

**Why now?**
- Current `waypoints` array in `RouteSnapshot` is empty — infrastructure exists but unused
- `enrichRoute` tool exists but is commented out in orchestrator (line 119)
- User feedback indicates desire for more route customization and richer route information

---

## Feature 1: Waypoints with Deviation Handling

### Overview

Allow users to add waypoints to routes, classify them as on-route or off-route, and show deviation costs before applying.

### Data Model

**New Table: `waypoints`**

```typescript
// In models/waypoints.ts
export const waypointValidator = v.object({
  routePlanId: v.id('route_plans'),
  clerkUserId: v.string(),

  // Location data
  name: v.string(),
  lat: v.number(),
  lng: v.number(),
  kind: v.union(v.literal('on_route'), v.literal('off_route')),

  // Workflow status
  status: v.union(
    v.literal('pending'),
    v.literal('evaluating'),
    v.literal('ready'),
    v.literal('approved'),
    v.literal('rejected'),
    v.literal('applied')
  ),

  // Order in sequence (for on-route waypoints)
  order: v.optional(v.number()),

  // Deviation info (for off-route waypoints)
  detourInfo: v.optional(
    v.object({
      distanceAddedMeters: v.number(),
      timeAddedSeconds: v.number(),
      reconnectPoint: v.object({
        lat: v.number(),
        lng: v.number(),
      }),
      nearestPointOnRoute: v.object({
        lat: v.number(),
        lng: v.number(),
      }),
    })
  ),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})

// Add to schema.ts
waypoints: defineTable(waypointValidator)
  .index('by_routePlanId', ['routePlanId'])
  .index('by_routePlanId_and_status', ['routePlanId', 'status'])
```

### Architecture

**Deterministic Core (Keep Existing)**
- Route compilation via Google Routes API
- Weather/elevation probing
- All existing orchestrator logic

**Agentic Layer (Add)**
- Natural language waypoint requests ("add a gas stop halfway")
- Deviation calculation and presentation
- User approval workflow

### Key Components

**1. Deviation Calculation Service**

```typescript
// convex/services/waypointService.ts
export async function calculateDeviation(params: {
  waypoint: { lat: number; lng: number; name: string }
  routeGeometry: PolylineGeometry
}): Promise<{
  kind: 'on_route' | 'off_route'
  detourInfo?: DetourInfo
}> {
  // 1. Find nearest point on route polyline
  const nearest = findNearestPointOnPolyline(waypoint, routeGeometry)

  // 2. Classify: on-route if within 500m
  if (nearest.distanceMeters < 500) {
    return { kind: 'on_route' }
  }

  // 3. For off-route: calculate optimal reconnection
  const reconnectPoint = findOptimalReconnectionPoint(
    waypoint,
    routeGeometry,
    nearest.point
  )

  // 4. Calculate deviation costs via Google Routes API
  const detourRoute = await routingProvider.routeSegment({
    origin: nearest.point,
    destination: reconnectPoint,
    waypoint: waypoint,
  })

  return {
    kind: 'off_route',
    detourInfo: {
      distanceAddedMeters: detourRoute.distanceMeters,
      timeAddedSeconds: detourRoute.durationSeconds,
      reconnectPoint,
      nearestPointOnRoute: nearest.point,
    },
  }
}
```

**2. Agent Tools**

```typescript
// convex/actions/agent/tools/manageWaypoints.ts

export const addWaypointFromLocation = {
  name: 'add_waypoint_from_location',
  description: 'Add a waypoint from natural language or coordinates',
  parameters: Type.Object({
    location: Type.Union([
      Type.String(),  // Natural language "gas station in Santa Cruz"
      Type.Object({  // Coordinates
        lat: Type.Number(),
        lng: Type.Number(),
      })
    ]),
  }),
  handler: async (args) => {
    // 1. Geocode if needed
    // 2. Calculate deviation
    // 3. Store waypoint with status='evaluating'
    // 4. Return waypoint options for user approval
  }
}

export const presentWaypointOptions = {
  name: 'present_waypoint_options',
  description: 'Show deviation costs to user for approval',
  parameters: Type.Object({
    waypointId: Type.String(),
    showApprovalUI: Type.Boolean(),
  }),
}

export const applyWaypointDecisions = {
  name: 'apply_waypoint_decisions',
  description: 'Apply approved waypoints and regenerate route',
  parameters: Type.Object({
    approvedWaypointIds: Type.Array(Type.String()),
    rejectedWaypointIds: Type.Array(Type.String()),
  }),
  handler: async (args) => {
    // 1. Update waypoint statuses
    // 2. Rebuild route sketch with approved waypoints
    // 3. Call compileSketch with intermediates
    // 4. Return new route options
  }
}
```

**3. Frontend Components**

```typescript
// components/waypoints/waypoint-list.tsx
interface WaypointListProps {
  routePlanId: Id<'route_plans'>
  waypoints: Waypoint[]
  onApprove: (waypointId: string) => void
  onReject: (waypointId: string) => void
  onReorder: (waypointId: string, newOrder: number) => void
}

// components/waypoints/waypoint-card.tsx
interface WaypointCardProps {
  waypoint: Waypoint
  detourInfo?: DetourInfo
  onApprove: () => void
  onReject: () => void
}

// Renders:
// - Waypoint name and kind badge
// - For off-route: deviation cost (+15 min, +8.2 miles)
// - Approve/Reject buttons
// - Reorder handle (for on-route waypoints)
```

**4. Map Integration**

```typescript
// components/map/waypoint-marker.tsx
export const WaypointMarker: React.FC<WaypointMarkerProps> = ({
  waypoint,
  onPress,
}) => (
  <Marker
    coordinate={{ latitude: waypoint.lat, longitude: waypoint.lng }}
    onPress={onPress}
  >
    {/* Color-coded by kind */}
    <WaypointIcon kind={waypoint.kind} status={waypoint.status} />
  </Marker>
)

// components/map/route-with-deviation.tsx
// Shows:
// - Original route (gray, dashed)
// - Deviation path (blue, solid)
// - Reconnection point
```

### Implementation Sequence

**Phase 1: Data Model (Week 1)**
1. Create `models/waypoints.ts` with validators
2. Add `waypoints` table to `schema.ts`
3. Create CRUD operations in `convex/db/waypoints.ts`
4. Unit tests for validation

**Phase 2: Deviation Calculation (Week 1-2)**
1. Implement `waypointService.ts` with deviation logic
2. Add `findNearestPointOnPolyline` utility
3. Implement `findOptimalReconnectionPoint`
4. Integration with Google Routes API for detour costs
5. Tests for on/off classification accuracy

**Phase 3: Agent Integration (Week 2)**
1. Add waypoint tools to routing agent
2. Implement natural language geocoding fallback
3. Wire approval workflow
4. Handle Google API 3-intermediate limit
5. Error handling for geocoding failures

**Phase 4: Frontend Components (Week 2-3)**
1. Build `WaypointList` component
2. Build `WaypointCard` with approval actions
3. Build `WaypointMarker` for map
4. Add drag-reorder for on-route waypoints
5. Integrate with chat planning flow

**Phase 5: Edge Cases (Week 3)**
1. Waypoint reordering with recalculation
2. Route changes invalidating pending waypoints
3. Google API limit validation
4. Concurrent waypoint addition handling

### Critical Files

- `/models/waypoints.ts` (new) - Data model
- `/convex/schema.ts` (modify) - Add waypoints table
- `/convex/services/waypointService.ts` (new) - Deviation logic
- `/convex/actions/agent/tools/manageWaypoints.ts` (new) - Agent tools
- `/convex/actions/agent/agents/routingAgent.ts` (modify) - Wire tools
- `/components/waypoints/waypoint-list.tsx` (new) - UI

---

## Feature 2: Staggered Enrichment with Invalidation

### Overview

Return routes immediately with fallback labels, then continue enrichment in background. Cancel enrichment when user makes changes.

### Architecture

**Key Insight:** The orchestrator already returns routes with fallback labels (line 121-128). We inject enrichment as a post-processing step.

### Phased Execution

| Phase | When | Tools | Duration | Priority |
|-------|------|-------|----------|----------|
| Immediate | 0ms | None (fallback labels) | Instant | Critical |
| Fast | 100ms after route | `enrichRoute` | ~10s | High |
| Extended | 2-30s after route | `getElevation`, `getRouteWeather` | 15-30s | Medium |
| On-Demand | User requests | `searchAlongRoute`, `getUserFavorites` | 20-40s | Low |

### Data Model

**New Table: `route_enrichments`**

```typescript
// models/route-enrichments.ts
export const routeEnrichmentValidator = v.object({
  routePlanId: v.id('route_plans'),
  clerkUserId: v.string(),

  // Content fingerprint for cache invalidation
  contentFingerprint: v.string(),

  // Enrichment phase
  phase: v.union(v.literal('fast'), v.literal('extended')),

  // Status tracking
  status: v.union(
    v.literal('pending'),
    v.literal('running'),
    v.literal('completed'),
    v.literal('cancelled'),
    v.literal('failed')
  ),

  // Scheduled job ID for cancellation
  scheduledJobId: v.optional(v.id('_scheduled_functions')),

  // Results (merged into route options)
  enrichments: v.optional(v.array(
    v.object({
      routeOptionId: v.string(),
      label: v.string(),
      rationale: v.string(),
      highlights: v.array(v.string()),
      elevation: v.optional(v.any()),
      weather: v.optional(v.any()),
    })
  )),

  // Error tracking
  error: v.optional(v.string()),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  completedAt: v.optional(v.number()),
})

// Add to schema.ts
route_enrichments: defineTable(routeEnrichmentValidator)
  .index('by_routePlanId', ['routePlanId'])
  .index('by_contentFingerprint_and_phase', ['contentFingerprint', 'phase'])
```

### Content Fingerprinting

```typescript
// convex/actions/agent/lib/enrichmentCache.ts
export function generateContentFingerprint(planInput: PlanInput): string {
  const key = {
    start: { lat: planInput.start.lat, lng: planInput.start.lng },
    end: { lat: planInput.end.lat, lng: planInput.end.lng },
    departureTime: Math.floor(planInput.departureTime / 300000), // 5-min buckets
    preferences: planInput.preferences,
  }
  return crypto.createHash('md5').update(JSON.stringify(key)).digest('hex')
}
```

### Invalidation Mechanism

**Trigger:** When `routing_agent` creates a new `routePlan` in the same session

```typescript
// convex/db/routeEnrichments.ts
export const invalidateStaleEnrichments = mutation({
  args: {
    planningSessionId: v.id('planning_sessions'),
    newRoutePlanId: v.id('route_plans'),
  },
  handler: async (ctx, args) => {
    // 1. Find all pending/running enrichments for this session
    const staleEnrichments = await ctx.db
      .query('route_enrichments')
      .withIndex('by_planningSessionId_and_status', (q) =>
        q
          .eq('planningSessionId', args.planningSessionId)
          .eq('status', 'running')
      )
      .collect()

    // 2. Cancel scheduled jobs
    for (const enrichment of staleEnrichments) {
      if (enrichment.scheduledJobId) {
        await ctx.scheduler.cancel(enrichment.scheduledJobId)
      }

      // 3. Mark as cancelled
      await ctx.db.patch(enrichment._id, {
        status: 'cancelled',
        updatedAt: Date.now(),
      })
    }
  },
})
```

### Orchestrator Integration

**Modify `planRideOrchestrator` (line 119-128):**

```typescript
// 1. Build results with fallback labels (FAST PATH - unchanged)
const immediateResults = withConditions.map(({ routeSnapshot, sketch }, idx) => ({
  routeSnapshot,
  sketch: {
    ...sketch,
    label: sketch.label || `Route ${idx + 1}`,
    rationale: sketch.rationale ?? '',
  },
}))

// 2. Schedule background enrichment (NON-BLOCKING - new)
const fingerprint = generateContentFingerprint(planInput)

// Check cache first
const cached = await findCachedEnrichment(ctx, {
  clerkUserId,
  planInput,
  phase: 'fast',
})

if (!cached) {
  // Schedule background enrichment job
  const enrichmentId = await ctx.runMutation(
    internal.db.routeEnrichments.createEnrichment,
    {
      routePlanId: '<current-plan-id>',
      clerkUserId,
      contentFingerprint: fingerprint,
      phase: 'fast',
    }
  )

  // Schedule the job to run after 100ms
  const scheduledJobId = await ctx.scheduler.runAfter(
    100,
    internal.actions.agent.enrichment.runEnrichmentJob,
    { enrichmentId, phase: 'fast' }
  )

  // Update enrichment with job ID
  await ctx.runMutation(
    internal.db.routeEnrichments.updateEnrichment,
    { enrichmentId, scheduledJobId }
  )
}

// 3. Return immediately with fallback labels
return immediateResults
```

### Background Job Implementation

```typescript
// convex/actions/agent/enrichment/runEnrichmentJob.ts
export const runEnrichmentJob = internalAction({
  args: {
    enrichmentId: v.id('route_enrichments'),
    phase: v.union(v.literal('fast'), v.literal('extended')),
  },
  handler: async (ctx, args) => {
    const enrichment = await ctx.runQuery(
      internal.db.routeEnrichments.getById,
      { enrichmentId: args.enrichmentId }
    )

    // Early return if cancelled
    if (!enrichment || enrichment.status === 'cancelled') {
      return null
    }

    // Update status to running
    await ctx.runMutation(
      internal.db.routeEnrichments.updateStatus,
      { enrichmentId: args.enrichmentId, status: 'running' }
    )

    try {
      // Get route plan details
      const routePlan = await ctx.runQuery(
        internal.db.routePlans.getPlanByIdInternal,
        { routePlanId: enrichment.routePlanId }
      )

      // Run enrichment based on phase
      const results = await runEnrichmentPhase({
        phase: args.phase,
        routePlan: routePlan.result,
        planInput: routePlan.planInput,
      })

      // Check for cancellation again
      const current = await ctx.runQuery(
        internal.db.routeEnrichments.getById,
        { enrichmentId: args.enrichmentId }
      )

      if (current?.status === 'cancelled') {
        return null
      }

      // Save results
      await ctx.runMutation(
        internal.db.routeEnrichments.completeEnrichment,
        { enrichmentId: args.enrichmentId, enrichments: results }
      )

      // Trigger UI update via session message
      await ctx.runMutation(
        internal.db.sessionMessages.addSystemMessage,
        {
          sessionId: routePlan.planningSessionId!,
          content: '',
          attachments: [{
            type: 'route_options',
            routePlanId: enrichment.routePlanId,
            enrichment: { phase: args.phase, data: results },
          }],
        }
      )
    } catch (error) {
      await ctx.runMutation(
        internal.db.routeEnrichments.failEnrichment,
        {
          enrichmentId: args.enrichmentId,
          error: error instanceof Error ? error.message : String(error),
        }
      )
    }

    return null
  },
})
```

### Implementation Sequence

**Phase 1: Foundation (Week 1)**
1. Create `route_enrichments` table and schema
2. Implement content fingerprinting
3. Create CRUD operations for enrichments
4. Add cancellation logic
5. Unit tests for cache key generation

**Phase 2: Fast Enrichment (Week 2)**
1. Integrate `enrichRoute` into orchestrator return path
2. Schedule background jobs for fast enrichment
3. Implement cache lookup
4. Add session message for UI updates
5. Test end-to-end: route → background job → UI update

**Phase 3: Invalidation (Week 2-3)**
1. Hook into routing agent's route creation
2. Invalidate stale enrichments on new route
3. Cancel scheduled jobs
4. Test multi-route scenarios
5. Verify no wasted API calls

**Phase 4: Extended Enrichment (Week 3-4)**
1. Implement elevation enrichment phase
2. Implement weather enrichment phase
3. Add retry logic
4. Progressive UI enhancement
5. Performance testing

### Critical Files

- `/convex/schema.ts` (modify) - Add route_enrichments table
- `/convex/actions/agent/lib/planRideOrchestrator.ts` (modify) - Hook point (line 119)
- `/convex/actions/agent/agents/routingAgent.ts` (modify) - Invalidation trigger
- `/convex/actions/agent/enrichment/runEnrichmentJob.ts` (new) - Background job
- `/convex/actions/agent/lib/enrichmentCache.ts` (new) - Caching logic
- `/convex/db/routeEnrichments.ts` (new) - CRUD operations

---

## Pi-Agent Integration Strategy

### Decision: Hybrid Approach

**Keep Deterministic:**
- Core route compilation (existing orchestrator)
- Weather/elevation data fetching
- Waypoint discovery (Overpass API)
- Deviation calculation math
- All batch operations

**Add Agentic:**
- Interactive waypoint operations (NLU for "add a gas stop")
- Enrichment orchestration (prioritization, invalidation)
- Error recovery (when deterministic fails)

### Why This Split?

| Aspect | Deterministic | Agentic |
|--------|---------------|---------|
| **Speed** | Fast (no LLM) | Slower (LLM overhead) |
| **Reliability** | Always succeeds | May fail/hallucinate |
| **Debugging** | Easy (predictable) | Hard (non-deterministic) |
| **Best For** | Computation, APIs | Natural language, judgment |

### New Pi-Agent Tools

**Waypoint Management:**
```typescript
// convex/actions/agent/lib/piTools.ts
export const waypointTools = [
  {
    name: 'add_waypoint',
    description: 'Add a waypoint from natural language',
    parameters: Type.Object({
      location: Type.String(),
      onRoute: Type.Optional(Type.Boolean()),
    }),
  },
  {
    name: 'calculate_deviation',
    description: 'Calculate deviation cost for off-route waypoint',
    parameters: Type.Object({
      waypointId: Type.String(),
    }),
  },
  {
    name: 'present_deviation_options',
    description: 'Show user deviation costs and request approval',
    parameters: Type.Object({
      waypointId: Type.String(),
      detourInfo: DetourInfoSchema,
    }),
  },
  {
    name: 'apply_approved_waypoints',
    description: 'Apply user-approved waypoints to route',
    parameters: Type.Object({
      approvedWaypointIds: Type.Array(Type.String()),
    }),
  },
  {
    name: 'optimize_waypoint_order',
    description: 'Reorder waypoints for optimal route',
    parameters: Type.Object({
      waypointIds: Type.Array(Type.String()),
    }),
  },
]
```

**Enrichment Orchestration:**
```typescript
export const enrichmentOrchestrationTools = [
  {
    name: 'schedule_enrichment_phase',
    description: 'Schedule a background enrichment job',
    parameters: Type.Object({
      phase: Type.Union([Type.Literal('fast'), Type.Literal('extended')]),
      priority: Type.Number(),
    }),
  },
  {
    name: 'cancel_enrichment',
    description: 'Cancel pending enrichment jobs',
    parameters: Type.Object({
      routePlanId: Type.Id('route_plans'),
    }),
  },
  {
    name: 'check_enrichment_cache',
    description: 'Check for cached enrichment results',
    parameters: Type.Object({
      contentFingerprint: Type.String(),
      phase: Type.String(),
    }),
  },
]
```

### Performance Impact

| Operation | Current | With Agents | Delta |
|-----------|---------|-------------|-------|
| Route generation | ~15s | ~15s | 0s |
| Waypoint add | N/A | +1-2s | New feature |
| Fast enrichment | N/A | +0.5s (async) | User doesn't wait |
| Error recovery | Crash | +3-5s (rare) | Better UX |

### Cost Impact

- **Current:** ~$0.00025 per route (enrichment only, not running)
- **With agents:** ~$0.00035 per route (~40% increase)
- **Most routes:** Remain pure deterministic (no agent overhead)

---

## Consolidated Implementation Plan

### Priority Order

1. **Feature 2 (Enrichment) First** - Lower risk, infrastructure exists
2. **Feature 1 (Waypoints) Second** - More fundamental changes to data model
3. **Parallel Work** - Frontend can be built while backend is in progress

### Milestones

**Week 1-2: Enrichment Foundation**
- Create `route_enrichments` table
- Implement content fingerprinting
- Wire `enrichRoute` into orchestrator
- Schedule background jobs
- Cache lookup

**Week 2-3: Enrichment Invalidation**
- Hook into routing agent
- Cancel stale jobs
- Test multi-route scenarios
- UI updates via session messages

**Week 3-4: Waypoints Data Model**
- Create `waypoints` table
- Implement deviation calculation
- Add waypoint CRUD operations
- Unit tests

**Week 4-5: Waypoints Agent Integration**
- Add waypoint tools to routing agent
- Natural language geocoding
- Approval workflow
- Error handling

**Week 5-6: Waypoints Frontend**
- Build `WaypointList` component
- Build `WaypointCard` with approval
- Map markers for waypoints
- Drag-reorder support

**Week 6-7: Integration & Testing**
- End-to-end testing
- Performance testing
- Error scenario testing
- Documentation

### Verification

**Feature 1 Verification:**
1. User adds waypoint → system calculates deviation
2. Off-route waypoint shows cost → user approves → route regenerates
3. On-route waypoint → no approval needed → applied directly
4. Waypoint reorder → route recalculates
5. Multiple waypoints → respects Google 3-intermediate limit

**Feature 2 Verification:**
1. User requests route → sees results immediately (<200ms)
2. Background enrichment completes → UI updates with labels
3. User changes route → old enrichment cancelled
4. Identical route request → uses cached enrichment
5. Enrichment failure → routes still display with fallback labels

---

## Critical Files Summary

### Waypoints Feature
| File | Change |
|------|--------|
| `/models/waypoints.ts` | New - data model |
| `/convex/schema.ts` | Add waypoints table |
| `/convex/services/waypointService.ts` | New - deviation logic |
| `/convex/actions/agent/tools/manageWaypoints.ts` | New - agent tools |
| `/convex/actions/agent/agents/routingAgent.ts` | Wire tools |
| `/components/waypoints/waypoint-list.tsx` | New - UI |

### Enrichment Feature
| File | Change |
|------|--------|
| `/convex/schema.ts` | Add route_enrichments table |
| `/convex/actions/agent/lib/planRideOrchestrator.ts` | Hook at line 119 |
| `/convex/actions/agent/agents/routingAgent.ts` | Invalidation trigger |
| `/convex/actions/agent/enrichment/runEnrichmentJob.ts` | New - background job |
| `/convex/actions/agent/lib/enrichmentCache.ts` | New - caching |
| `/convex/db/routeEnrichments.ts` | New - CRUD |

---

## References

- `/convex/actions/agent/lib/planRideOrchestrator.ts` - Core orchestrator with enrichment placeholder
- `/convex/actions/agent/tools/enrichRoute.ts` - Existing enrichment tool (not called)
- `/convex/actions/agent/providers/routingProvider.ts` - Google Routes API wrapper
- `/hooks/use-chat-planning.ts` - Chat planning flow
- `/components/map/route-polyline-component.tsx` - Route visualization
