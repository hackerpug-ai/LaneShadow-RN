# Progressive Route Loading - Technical Architecture Analysis

**Version**: 1.0
**Status**: Draft
**Date**: 2026-04-09
**Specialist**: Engineering Manager (Convex Backend Architecture)

## Executive Summary

This document provides technical architecture guidance for the Progressive Route Loading feature, analyzing the existing Convex backend and proposing specific implementation patterns. The goal is to reduce route generation time from ~90 seconds to ~5-10 seconds by returning results immediately after street routing, with weather and AI enrichment flowing in asynchronously.

## Current Architecture Analysis

### 1. Route Generation Pipeline

**File**: `convex/actions/agent/planRide.ts`

**Current Flow**:
```
planRide (action) [55s timeout]
  └─> planRideOrchestrator
       ├─> findScenicWaypoints (deterministic, fast)
       ├─> compileSketch + normalizeRoute (Google Routes API, ~5-10s)
       └─> probeConditions (Open-Meteo API, ~15s) ← BLOCKING
```

**Key Observations**:
- `planRide` is a **public action** (has JWT context) called directly from frontend
- Uses 55-second timeout guard
- Returns `PlannedRouteOptionsView` synchronously
- Weather data (`probeConditions`) is fetched but results are **hardcoded to 'unavailable'** in `buildOptionsFromResults` (line 146-149)

**File**: `convex/actions/agent/lib/planRideOrchestrator.ts`

**Current Flow** (lines 89-119):
```typescript
// Step 3: Probe weather conditions — parallel, best-effort
const weatherProvider = createWeatherProvider()
const withConditions = await Promise.all(
  successful.map(async ({ routeSnapshot, sketch }) => {
    try {
      const routeIndex = await computeRouteIndex(routeSnapshot)
      const probed = await probeConditions({ routeIndex, departureTimeMs, weatherProvider })
      const windOverlay = await mapConditions({ routeSnapshot, routeIndex, probed })
      // ... merge overlay
    } catch {
      // Soft fail - continues without weather
      return { routeSnapshot, sketch }
    }
  })
)
```

**Problem**: Weather fetching happens in the orchestrator **before** results are returned, adding ~15 seconds even though the data is discarded.

### 2. Background Enrichment System

**File**: `convex/actions/agent/enrichment/runEnrichmentJob.ts`

**Existing Infrastructure**:
- `route_enrichments` table tracks background jobs
- Two phases: `fast` (AI labels) vs `extended` (deep analysis)
- Uses `ctx.scheduler.runAfter()` for delayed execution
- Cache support via `contentFingerprint` (MD5 hash of plan input)

**Current Enrichment Flow** (from `planRide.ts` lines 356-425):
```typescript
// After route completes, schedule background enrichment
const fingerprint = generateContentFingerprint(plan.planInput)
const cached = await ctx.runQuery(
  internal.db.routeEnrichments.findByContentFingerprint,
  { contentFingerprint: fingerprint, phase: 'fast' }
)

if (!cached) {
  const { enrichmentId } = await ctx.runMutation(
    internal.db.routeEnrichments.createEnrichment,
    { routePlanId, planningSessionId, clerkUserId, contentFingerprint: fingerprint, phase: 'fast' }
  )

  const scheduledJobId = await ctx.scheduler.runAfter(
    100,
    internal.actions.agent.enrichment.runEnrichmentJob,
    { enrichmentId, phase: 'fast' }
  )
}
```

**Key Insight**: The enrichment system **already exists** and supports:
- Background job scheduling via `ctx.scheduler`
- Cache invalidation via `contentFingerprint`
- Status tracking (pending/running/completed/failed)
- Reactive updates to frontend via `mergeEnrichment` mutation

### 3. Data Models

**File**: `models/route-plans.ts`

**Schema**:
```typescript
export const routePlanValidator = v.object({
  clerkUserId: v.string(),
  planningSessionId: v.optional(v.id('planning_sessions')),
  planInput: planInputValidator,
  startLabel: v.optional(v.string()),
  endLabel: v.optional(v.string()),
  status: routePlanStatusValidator, // pending|running|completed|failed|cancelled
  statusMessage: v.optional(v.string()),
  phase: v.optional(routePlanPhaseValidator), // reading|finding|weather|building
  result: v.optional(v.any()),
  errorCode: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
  scheduledActionId: v.optional(v.id('_scheduled_functions')),
  createdAt: v.number(),
  updatedAt: v.number(),
  completedAt: v.optional(v.number()),
  acknowledged: v.optional(v.boolean()),
})
```

**Phase Tracking**: Currently has `ROUTE_PLAN_PHASE` (reading/finding/weather/building) but this is **not used** in the current orchestrator flow.

**File**: `models/route-enrichments.ts`

**Schema**:
```typescript
export const routeEnrichmentValidator = v.object({
  routePlanId: v.id('route_plans'),
  planningSessionId: v.id('planning_sessions'),
  clerkUserId: v.string(),
  contentFingerprint: v.string(),
  phase: routeEnrichmentPhaseValidator, // fast|extended
  status: routeEnrichmentStatusValidator, // pending|running|completed|cancelled|failed
  scheduledJobId: v.optional(v.id('_scheduled_functions')),
  enrichments: v.optional(v.array(v.object({
    routeOptionId: v.string(),
    label: v.string(),
    rationale: v.string(),
    highlights: v.array(v.string()),
    elevation: v.optional(v.any()),
    weather: v.optional(v.any()), // ← Weather enrichment already supported!
  }))),
  error: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  completedAt: v.optional(v.number()),
})
```

**Critical Discovery**: The `enrichments` schema **already includes `weather` field** (line 54). The infrastructure for weather enrichment exists but is not being used!

### 4. Database Indices

**File**: `convex/schema.ts`

**Relevant Indices**:
```typescript
route_plans: defineTable(routePlanValidator)
  .index('by_clerkUserId_and_status', ['clerkUserId', 'status'])
  .index('by_planningSessionId_and_status', ['planningSessionId', 'status'])

route_enrichments: defineTable(routeEnrichmentValidator)
  .index('by_routePlanId', ['routePlanId'])
  .index('by_contentFingerprint_and_phase', ['contentFingerprint', 'phase'])
  .index('by_planningSessionId_and_status', ['planningSessionId', 'status'])
```

**Query Optimization**: The existing indices support:
- Finding active route plans by user
- Cache lookups by content fingerprint
- Session-scoped enrichment invalidation

## Proposed Solution Architecture

### Phase 1: Remove Blocking Weather from Orchestrator

**Changes to `convex/actions/agent/lib/planRideOrchestrator.ts`**:

```typescript
// BEFORE (lines 89-119):
// Step 3: Probe weather conditions — BLOCKING
const withConditions = await Promise.all(
  successful.map(async ({ routeSnapshot, sketch }) => {
    // ... fetch weather
  })
)

// AFTER:
// Step 3: Skip weather probing in orchestrator
// Weather will be fetched asynchronously in enrichment job
const withConditions = successful // No weather fetching
```

**Impact**:
- Reduces orchestrator runtime from ~90s to ~5-10s
- Weather data is currently discarded anyway (hardcoded to 'unavailable')
- No functional change to output

### Phase 2: Move Weather to Enrichment Pipeline

**New Enrichment Phase**: Add `weather` phase to existing enrichment system

**File**: `models/route-enrichments.ts`

```typescript
// BEFORE:
export const ROUTE_ENRICHMENT_PHASE = {
  FAST: 'fast',
  EXTENDED: 'extended',
} as const

// AFTER:
export const ROUTE_ENRICHMENT_PHASE = {
  FAST: 'fast',        // AI labels (existing)
  WEATHER: 'weather',  // Weather data (NEW)
  EXTENDED: 'extended', // Deep analysis (existing)
} as const
```

**File**: `convex/actions/agent/enrichment/runWeatherEnrichmentJob.ts` (NEW)

```typescript
'use node'

import { v } from 'convex/values'
import { internalAction } from '../../../_generated/server'
import { internal } from '../../../_generated/api'
import type { Id } from '../../../_generated/dataModel'
import { probeConditions } from '../tools/probeConditions'
import { computeRouteIndex } from '../tools/computeRouteIndex'
import { mapConditions } from '../tools/mapConditions'
import { createWeatherProvider } from '../providers/weatherProvider'

/**
 * Background weather enrichment job
 *
 * Fetches weather data asynchronously and merges into route plan results.
 */
export const runWeatherEnrichmentJob = internalAction({
  args: {
    enrichmentId: v.id('route_enrichments'),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const enrichment = await ctx.runQuery(
      internal.db.routeEnrichments.getById,
      { enrichmentId: args.enrichmentId }
    )

    if (!enrichment || enrichment.status === 'cancelled') {
      return null
    }

    await ctx.runMutation(
      internal.db.routeEnrichments.updateStatus,
      { enrichmentId: args.enrichmentId, status: 'running' }
    )

    try {
      const routePlan = await ctx.runQuery(
        internal.db.routePlans.getPlanByIdInternal,
        { routePlanId: enrichment.routePlanId }
      )

      if (!routePlan?.result) {
        throw new Error('Route plan not found or has no result')
      }

      const result = routePlan.result as { options: any[] }
      const weatherProvider = createWeatherProvider()

      // Fetch weather for each route option
      const enrichedOptions = await Promise.all(
        result.options.map(async (option) => {
          try {
            const routeSnapshot = option.map
            const routeIndex = await computeRouteIndex(routeSnapshot)
            const probed = await probeConditions({
              routeIndex,
              departureTimeMs: routePlan.planInput.departureTime,
              weatherProvider
            })
            const windOverlay = await mapConditions({
              routeSnapshot,
              routeIndex,
              probed
            })

            return {
              ...option,
              overlays: {
                ...option.overlays,
                wind: windOverlay
              }
            }
          } catch (error) {
            console.warn(`Weather enrichment failed for option ${option.routeOptionId}:`, error)
            return option // Return original option on failure
          }
        })
      )

      // Save weather enrichments
      await ctx.runMutation(
        internal.db.routeEnrichments.completeEnrichment,
        {
          enrichmentId: args.enrichmentId,
          enrichments: enrichedOptions.map((option) => ({
            routeOptionId: option.routeOptionId,
            weather: option.overlays?.wind
          }))
        }
      )

      // Merge into route plan for reactive UI updates
      await ctx.runMutation(
        internal.db.routePlans.mergeEnrichment,
        {
          routePlanId: enrichment.routePlanId,
          enrichments: enrichedOptions.map((option) => ({
            routeOptionId: option.routeOptionId,
            weather: option.overlays?.wind
          }))
        }
      )

    } catch (error) {
      await ctx.runMutation(
        internal.db.routeEnrichments.failEnrichment,
        {
          enrichmentId: args.enrichmentId,
          error: error instanceof Error ? error.message : String(error)
        }
      )
    }

    return null
  }
})
```

### Phase 3: Schedule Weather Enrichment After Route Completion

**File**: `convex/actions/agent/planRide.ts`

**Modify `executePlanHandler`** (around line 426):

```typescript
// BEFORE: Only schedule 'fast' enrichment
const { enrichmentId } = await ctx.runMutation(
  internal.db.routeEnrichments.createEnrichment,
  {
    routePlanId,
    planningSessionId: plan.planningSessionId,
    clerkUserId: plan.clerkUserId,
    contentFingerprint: fingerprint,
    phase: 'fast',
  }
)

// AFTER: Schedule both 'fast' and 'weather' enrichments
const fastEnrichment = await ctx.runMutation(
  internal.db.routeEnrichments.createEnrichment,
  {
    routePlanId,
    planningSessionId: plan.planningSessionId,
    clerkUserId: plan.clerkUserId,
    contentFingerprint: fingerprint,
    phase: 'fast',
  }
)

const weatherEnrichment = await ctx.runMutation(
  internal.db.routeEnrichments.createEnrichment,
  {
    routePlanId,
    planningSessionId: plan.planningSessionId,
    clerkUserId: plan.clerkUserId,
    contentFingerprint: fingerprint,
    phase: 'weather',
  }
)

// Schedule both jobs
const fastJobId = await ctx.scheduler.runAfter(
  100,
  internal.actions.agent.enrichment.runEnrichmentJob,
  { enrichmentId: fastEnrichment.enrichmentId, phase: 'fast' }
)

const weatherJobId = await ctx.scheduler.runAfter(
  100, // Same delay - both start after route completes
  internal.actions.agent.enrichment.runWeatherEnrichmentJob,
  { enrichmentId: weatherEnrichment.enrichmentId }
)
```

### Phase 4: Update Route Plan Status Transitions

**File**: `convex/actions/agent/planRide.ts`

**Modify `executePlanHandler`** status updates:

```typescript
// BEFORE: Single status transition to 'completed'
await ctx.runMutation(
  internal.db.routePlans.updatePlanStatus,
  {
    routePlanId,
    status: ROUTE_PLAN_STATUS.COMPLETED,
    result,
    statusMessage: 'Route ready!',
  }
)

// AFTER: Transition to 'enriching' status first
await ctx.runMutation(
  internal.db.routePlans.updatePlanStatus,
  {
    routePlanId,
    status: ROUTE_PLAN_STATUS.ENRICHING, // NEW status
    result,
    statusMessage: 'Route ready! Enriching with weather data...',
  }
)

// Later, when weather enrichment completes, transition to 'completed'
// This happens in runWeatherEnrichmentJob after merging results
```

**File**: `models/route-plans.ts`

```typescript
// Add new status
export const ROUTE_PLAN_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  ENRICHING: 'enriching', // NEW: Routes are ready, waiting for enrichment
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const
```

### Phase 5: Frontend Reactive Updates

**File**: `convex/db/routePlans.ts`

**Existing query for frontend** (already exists):
```typescript
export const getPlanById = query({
  args: { routePlanId: v.id('route_plans') },
  returns: v.any(),
  handler: async (ctx, args): Promise<RoutePlanDoc> => {
    const { clerkUserId } = await requireIdentity(ctx)
    return getPlanByIdHandler(ctx as any, args, clerkUserId)
  },
})
```

**Frontend Integration**:
```typescript
// Frontend subscribes to route plan changes
const routePlan = useQuery(api.db.routePlans.getPlanById, { routePlanId })

// Reactive updates happen automatically:
// 1. Initial: status='enriching', overlaysPreview={windSummary: 'unavailable'}
// 2. Weather completes: mergeEnrichment mutation updates result
// 3. Convex pushes update to frontend
// 4. UI re-renders with weather data
```

## Implementation Tasks

### Task 1: Remove Blocking Weather from Orchestrator
**File**: `convex/actions/agent/lib/planRideOrchestrator.ts`
- Remove lines 89-119 (weather probing loop)
- Return `successful` directly instead of `withConditions`
- Update console.info logs

### Task 2: Add Weather Enrichment Phase
**Files**:
- `models/route-enrichments.ts` - Add 'weather' to ROUTE_ENRICHMENT_PHASE
- `convex/schema.ts` - No changes needed (validator is union)

### Task 3: Create Weather Enrichment Job
**File**: `convex/actions/agent/enrichment/runWeatherEnrichmentJob.ts` (NEW)
- Implement `runWeatherEnrichmentJob` action
- Reuse existing `probeConditions`, `computeRouteIndex`, `mapConditions` tools
- Call `mergeEnrichment` to push updates to frontend

### Task 4: Update Route Plan Status
**Files**:
- `models/route-plans.ts` - Add 'enriching' to ROUTE_PLAN_STATUS
- `convex/actions/agent/planRide.ts` - Update executePlanHandler to use new status

### Task 5: Schedule Weather Enrichment
**File**: `convex/actions/agent/planRide.ts`
- Modify executePlanHandler to create 'weather' enrichment record
- Schedule runWeatherEnrichmentJob via ctx.scheduler.runAfter

### Task 6: Cache Invalidation
**File**: `convex/actions/agent/lib/enrichmentCache.ts`
- No changes needed - existing fingerprint logic works for weather
- Weather is deterministic based on (location + time bucket)

## Convex-Specific Patterns

### Action vs Mutation vs Query

| Type | Use Case | Can Call External APIs | Has JWT Context |
|------|----------|----------------------|-----------------|
| **action** | External API calls, long-running work | ✅ Yes | ✅ Yes |
| **internalAction** | Same as action, but no JWT | ✅ Yes | ❌ No |
| **mutation** | Database writes only | ❌ No | ✅ Yes |
| **internalMutation** | Database writes, no JWT | ❌ No | ❌ No |
| **query** | Database reads only | ❌ No | ✅ Yes |

**Current Usage**:
- `planRide` → **action** (calls Google Routes API, has JWT)
- `executePlan` → **internalAction** (scheduled job, no JWT)
- `runEnrichmentJob` → **internalAction** (scheduled job, no JWT)
- `runWeatherEnrichmentJob` → **internalAction** (NEW, scheduled job, no JWT)

### Scheduler Usage

```typescript
// Schedule job with delay
const scheduledJobId = await ctx.scheduler.runAfter(
  delayMs,
  internal.actions.agent.enrichment.runWeatherEnrichmentJob,
  { enrichmentId }
)

// Cancel scheduled job
await ctx.scheduler.cancel(scheduledJobId)
```

**Best Practices**:
- Store `scheduledJobId` in document for cancellation
- Use short delays (100ms) to avoid race conditions
- Always handle cancellation in job handler

### Reactive Updates

**Pattern**: Mutation updates document → Convex pushes to subscribed clients

```typescript
// 1. Mutation updates route_plans.result
await ctx.runMutation(
  internal.db.routePlans.mergeEnrichment,
  { routePlanId, enrichments }
)

// 2. Frontend automatically receives update
const routePlan = useQuery(api.db.routePlans.getPlanById, { routePlanId })
// When mergeEnrichment runs, this query re-runs and component re-renders
```

**Key Insight**: No need for WebSocket or polling - Convex handles reactivity automatically.

### Index Strategy

**Rule**: "One index per query"

**Good**:
```typescript
// Query: Find active plans for user
db.query('route_plans')
  .withIndex('by_clerkUserId_and_status', q =>
    q.eq('clerkUserId', userId).eq('status', 'running')
  )
```

**Bad** (N+1 pattern):
```typescript
// Query: Find enrichments for session, then filter by status
const enrichments = await db.query('route_enrichments')
  .withIndex('by_planningSessionId', q => q.eq('planningSessionId', sessionId))
  .collect()

const active = enrichments.filter(e => e.status === 'running')
// This reads all enrichments for session, then filters in memory
```

**Better** (composite index):
```typescript
// Schema: .index('by_planningSessionId_and_status', ['planningSessionId', 'status'])
const enrichments = await db.query('route_enrichments')
  .withIndex('by_planningSessionId_and_status', q =>
    q.eq('planningSessionId', sessionId)
  )
  .filter(q => q.or(
    q.eq(q.field('status'), 'pending'),
    q.eq(q.field('status'), 'running')
  ))
  .collect()
```

## Risk Mitigation

### Risk 1: Weather Enrichment Fails
**Mitigation**: Soft-fail pattern (already used in orchestrator)
```typescript
try {
  const weatherData = await fetchWeather()
} catch {
  // Log warning, continue without weather
  console.warn('Weather enrichment failed, continuing without weather data')
  return option // Return original option
}
```

### Risk 2: Cache Staleness
**Mitigation**: Content fingerprint includes time bucket
```typescript
// 5-minute time buckets ensure weather cache expires
departureTime: Math.floor(planInput.departureTime / 300000)
```

### Risk 3: Concurrent Route Plans
**Mitigation**: Existing invalidation logic
```typescript
// When new route plan created, cancel stale enrichments
await invalidateStaleEnrichmentsHandler(ctx, {
  planningSessionId,
  newRoutePlanId
})
```

### Risk 4: Frontend Race Conditions
**Mitigation**: Status transitions prevent UI confusion
```typescript
// 1. Route ready: status='enriching'
// 2. Weather completes: status='completed'
// Frontend shows "Enriching..." state during gap
```

## Performance Impact

### Before
```
User request → planRide action
  ├─ findScenicWaypoints (~1s)
  ├─ compileSketch + normalizeRoute (~5-10s)
  └─ probeConditions (~15s) ← BLOCKING
Total: ~20-25s (best case), ~90s (worst case)
```

### After
```
User request → planRide action
  ├─ findScenicWaypoints (~1s)
  └─ compileSketch + normalizeRoute (~5-10s)
Return to frontend immediately

Background:
  ├─ fast enrichment (AI labels, ~5s)
  └─ weather enrichment (~15s)
Total: ~5-10s (routes ready), +20s (weather flows in)
```

**Improvement**: 75-85% reduction in time-to-first-response

## Testing Strategy

### Unit Tests
- `planRideOrchestrator` - Verify no weather calls
- `runWeatherEnrichmentJob` - Mock weather API, verify merge logic
- `generateContentFingerprint` - Verify time bucketing

### Integration Tests
- End-to-end: Create plan → verify immediate response
- Enrichment flow: Verify weather data appears after delay
- Cache hit: Verify cache skips weather API call

### Load Tests
- Concurrent route plans
- Cache hit rates
- Scheduler throughput

## Rollout Plan

### Phase 1: Backend Changes (No User Impact)
1. Add 'weather' enrichment phase
2. Create `runWeatherEnrichmentJob`
3. Update scheduler logic
4. Deploy to staging

### Phase 2: Remove Blocking Weather (User Impact)
1. Modify `planRideOrchestrator` to skip weather
2. Deploy to production
3. Monitor: Route generation time should drop to ~5-10s

### Phase 3: Add Weather Enrichment (Feature Complete)
1. Enable weather enrichment scheduling
2. Add 'enriching' status
3. Deploy to production
4. Monitor: Weather data should appear within ~20s

### Phase 4: Cache Optimization
1. Monitor cache hit rates
2. Adjust time bucket size if needed
3. Add cache warming for common routes

## Monitoring

### Key Metrics
- Route generation time (p50, p95, p99)
- Weather enrichment success rate
- Cache hit rate
- Time-to-first-byte
- Time-to-enrichment-complete

### Alerts
- Route generation time > 30s
- Weather enrichment failure rate > 10%
- Cache hit rate < 50%

### Dashboards
- Route planning latency heatmap
- Enrichment job queue depth
- Weather API error rate
- Cache effectiveness by time bucket

## Future Considerations

### Extended Enrichment
- Elevation profiles
- Traffic predictions
- Points of interest
- Fuel/charging stations

### Multi-Phase Enrichment
- Fast: AI labels (~5s)
- Weather: Weather data (~15s)
- Extended: Deep analysis (~60s)

### Predictive Preloading
- Pre-fetch weather for likely routes
- Cache warming during low-traffic periods
- Machine learning for route prediction

## Appendix: File Reference

### Core Files
- `convex/actions/agent/planRide.ts` - Main entry point
- `convex/actions/agent/lib/planRideOrchestrator.ts` - Route generation logic
- `convex/actions/agent/enrichment/runEnrichmentJob.ts` - AI enrichment
- `convex/actions/agent/tools/probeConditions.ts` - Weather fetching
- `convex/actions/agent/providers/weatherProvider.ts` - Open-Meteo client

### Database Files
- `models/route-plans.ts` - Route plan schema
- `models/route-enrichments.ts` - Enrichment schema
- `convex/db/routePlans.ts` - Route plan queries/mutations
- `convex/db/routeEnrichments.ts` - Enrichment queries/mutations
- `convex/schema.ts` - Database indices

### Utility Files
- `convex/actions/agent/lib/enrichmentCache.ts` - Content fingerprinting
- `convex/actions/agent/tools/computeRouteIndex.ts` - Route indexing
- `convex/actions/agent/tools/mapConditions.ts` - Weather overlay mapping

## Conclusion

The Progressive Route Loading feature can be implemented by:

1. **Removing blocking weather fetch** from orchestrator (~15s savings)
2. **Moving weather to enrichment pipeline** (already exists)
3. **Adding 'weather' enrichment phase** (schema change only)
4. **Scheduling background weather job** (reuses existing scheduler)
5. **Leveraging reactive updates** (Convex handles automatically)

**Key Insight**: Most of the infrastructure already exists. The changes are primarily:
- Removing code from orchestrator
- Adding new enrichment job type
- Updating status transitions

**Estimated Effort**: 2-3 days for backend changes, 1 day for testing and monitoring.
