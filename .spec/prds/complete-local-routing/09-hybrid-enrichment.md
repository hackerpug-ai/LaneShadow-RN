---
stability: CONSTITUTION
last_validated: 2026-04-09
prd_version: 1.0.0
---

# Hybrid Enrichment Architecture

## Overview

LaneShadow uses a hybrid enrichment strategy that combines fast local model inference (Qwen3.5 0.8B) with high-quality cloud enrichment (Haiku). This provides immediate user feedback while maintaining superior creative output for route descriptions.

**Research Basis:** Swarm micro-task validation (`.spec/research/SWARM_RESEARCH_SUMMARY.md`) confirmed that Qwen3.5 can ONLY reliably handle leg labels (100% validity, 2.16x faster), while Haiku is required for labels, rationales, and highlights.

**Progressive Loading:** Weather data and AI enrichment load asynchronously after local routing completes, providing immediate UX (<10s) with background enhancement (20-40s total).

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Native                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Qwen3.5    │  │   Mapbox     │  │   Draft      │  │
│  │  (Local LLM) │  │   (Routing)  │  │   (AsyncStore)│  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│  ┌──────▼──────────────────▼──────────────────▼───────┐  │
│  │          Immediate UX (Offline-Capable)            │  │
│  │    Leg Labels (0.35s) + Geometry (Mapbox)          │  │
│  └──────┬──────────────────────────────────────────────┘  │
└─────────┼──────────────────────────────────────────────────┘
          │ (When Online)
┌─────────▼──────────────────────────────────────────────────┐
│                    Convex Backend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Haiku      │  │  Weather     │  │   Route      │  │
│  │ (Enrichment) │  │  (Open-Meteo)│  │   Storage    │  │
│  └──────────────┘  └──────┬───────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Sync       │  │  Enrichment  │  │   Queue      │  │
│  │   Queue      │  │  Scheduler   │  │   Processor  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────┼──────────────────────────────────┘
                          │
                  ┌────────▼─────────┐
                  │  Progressive     │
                  │  Enhancement     │
                  │  (UI Updates)    │
                  └──────────────────┘
```

## Enrichment Flow

### 1. Route Creation (0-0.5s)

**User Action:** Plan route from A to B

**Local Processing:**
- Qwen3.5 generates leg labels: `["SF → Daly City", "Daly City → Santa Cruz"]`
- Mapbox SDK calculates route geometry (offline if maps downloaded)
- Draft route created in AsyncStorage with `syncStatus: 'draft'`

**UI Result:** Route displays immediately with leg labels

### 2. Immediate Display (0.5s-3.9s)

**User Experience:** Route visible with basic information

**Enrichment Status:** `partial` (leg labels only)

**UI State:**
- Route geometry rendered on map
- Leg labels displayed: "SF → Daly City", "Daly City → Santa Cruz"
- "Enhancing..." indicator shown
- Weather badges show skeleton loading state

### 3. Weather Enrichment (1-20s)

**Trigger:** Background job scheduled immediately after routing

**Cloud Processing:**
- Open-Meteo API fetches weather data for route points
- Wind, rain, and temperature data extracted
- Weather summaries calculated: windSummary, rainSummary, temperatureSummary
- Results merged into enrichment document

**UI Updates:** Weather badges fade in progressively
- Wind badge appears first
- Rain badge appears second
- Temperature badge appears third

### 4. AI Enrichment (3.9s avg)

**Trigger:** Device comes online or existing connection detected

**Cloud Processing:**
- Haiku generates full enrichment:
  - `label`: "Coastal Curve Chronicles"
  - `rationale`: "This scenic route follows Highway 1 along the Pacific coastline..."
  - `highlights`: ["Ocean views", "Coastal mountains", "Redwood forests"]
- Results merged into route document

### 5. Progressive Enhancement (20-40s total)

**UI Updates:** Incremental as data arrives

**Enhancement Stages:**
1. ✓ Leg labels ready (0.35s)
2. Weather badges fade in (1-20s)
3. Creative route name appears (3.9s)
4. Scenic rationale with waypoint references (3.9s)
5. Highlight tags for key features (3.9s)
6. Weather overlay polylines (1-20s)
7. Elevation graph (1-2s)
8. **Complete** - All enrichment data available

**Final UI State:**
- Creative route name: "Coastal Curve Chronicles"
- Scenic rationale with waypoint references
- Highlight tags for key features
- Weather overlay polylines
- Elevation graph

## State Machine

```
                    ┌─────────────┐
                    │    draft    │ ◄─────┐
                    └──────┬──────┘      │
                           │             │ Create route
              Qwen3.5      │             │ (offline/online)
            succeeds       │
                           ▼
                    ┌─────────────┐
                    │   partial   │ ─────┐
                    └──────┬──────┘     │
                           │            │ Queue for
                    Weather │            │ background
                  completes │            │ processing
                           ▼            │
                    ┌─────────────┐     │
                    │  complete   │ ◄───┘
                    └─────────────┘

                    ┌─────────────┐
                    │   failed    │ ◄─────┐
                    └──────┬──────┘      │
                           │             │ Qwen3.5 fails
                     Retry │             │ or unavailable
                      logic│             │
                           ▼             │
                    ┌─────────────┐     │
              Generic│   partial   │ ◄───┘
              labels│ (fallback)  │
                    └─────────────┘
```

## Error Handling

### Local Model Errors

| Error | Recovery | User Impact |
|-------|----------|-------------|
| Model not downloaded | Block app, show "Download Your Shadow" setup | One-time setup |
| Model load failed | Retry once, then fallback to generic labels | Degraded UX |
| Inference timeout (>2s) | Abort, use generic labels | Fast fallback |
| Invalid output format | Retry once, then fallback | Minimal delay |

**Generic Labels Fallback:**
```typescript
// Use waypoint names to derive leg labels
// Format: "Start → End" for each leg
['San Francisco → Daly City', 'Daly City → Santa Cruz', ...]

// If waypoint names unavailable, use coordinates as fallback
['(37.7749, -122.4194) → (37.6879, -122.4702)', ...]
```

### Remote Model Errors

| Error | Recovery | User Impact |
|-------|----------|-------------|
| Offline | Queue for later, preserve partial enrichment | No impact (partial available) |
| API rate limit | Exponential backoff, retry | Delayed full enrichment |
| API error (5xx) | Retry with backoff, preserve partial | Delayed full enrichment |
| Invalid response | Log error, keep partial enrichment | Partial enrichment only |

**Preservation Strategy:**
```typescript
// Always keep partial enrichment
{
  partial: {
    legLabels: ['SF → Daly City', 'Daly City → Santa Cruz'],
    generatedAt: Date.now(),
    model: 'qwen3.5-0.8b'
  },
  complete: undefined // Haiku failed, partial remains
}
```

## Schema Design

### Enrichment Document

```typescript
// In Convex route_enrichments table
{
  routePlanId: string,
  planningSessionId: string,
  clerkUserId: string,
  contentFingerprint: string,

  // Phase: fast (local) or extended (cloud)
  phase: 'fast' | 'extended',

  // Partial enrichment (Qwen3.5 local + weather)
  partial?: {
    legLabels: string[],
    weather?: {
      windSummary: 'calm' | 'moderate' | 'high'
      rainSummary: 'none' | 'light' | 'moderate' | 'heavy'
      temperatureSummary: 'cold' | 'mild' | 'hot'
      conditionsStatus: 'ok' | 'unavailable'
    }
    generatedAt: number,
    model: 'qwen3.5-0.8b',
  },

  // Complete enrichment (Haiku cloud)
  complete?: {
    label: string,
    rationale: string,
    highlights: string[],
    legLabels: string[],
    generatedAt: number,
    model: 'haiku',
  },

  // Error tracking
  error?: string,
  retryCount: number,
  lastRetryAt?: number,

  createdAt: number,
  updatedAt: number,
}
```

### Status Transitions

```typescript
type EnrichmentStatus =
  | 'pending'    // Not started
  | 'partial'    // Qwen3.5 complete, Haiku pending
  | 'complete'   // Both complete
  | 'failed'     // Qwen3.5 failed, using generic labels
```

## API Design

### Local Enrichment (Qwen3.5)

**File:** `lib/ai/local-enrichment.ts`

```typescript
export const enrichLegsLocal = async (params: {
  routes: Array<{
    legContext: Array<{
      index: number
      fromName?: string
      toName?: string
      roadName?: string
      distanceMeters: number
    }>
  }>
}): Promise<{
  legLabels: string[]
  generatedAt: number
  model: 'qwen3.5-0.8b'
}> => {
  // Load Qwen3.5 model (cached in memory)
  const model = await getLocalModel()

  // Build optimized prompt for leg labels
  const prompt = buildLegLabelPrompt(params.routes)

  // Execute local inference
  const result = await model.generate(prompt)

  // Validate output format
  const legLabels = validateLegLabels(result)

  return {
    legLabels,
    generatedAt: Date.now(),
    model: 'qwen3.5-0.8b',
  }
}
```

### Remote Enrichment (Haiku)

**File:** `lib/ai/remote-enrichment.ts`

```typescript
export const enrichRouteRemote = async (params: {
  routePlanId: string
  segments: Array<{
    fromName: string
    toName: string
    roadName?: string
  }>
}): Promise<{
  label: string
  rationale: string
  highlights: string[]
  legLabels: string[]
  generatedAt: number
  model: 'haiku'
}> => {
  // Check connectivity
  if (!isOnline()) {
    throw new Error('OFFLINE')
  }

  // Call Haiku via pi-ai
  const result = await enrichRouteWithHaiku(params.segments)

  return {
    ...result,
    generatedAt: Date.now(),
    model: 'haiku',
  }
}
```

### Hybrid Orchestrator

**File:** `lib/ai/hybrid-enrichment.ts`

```typescript
export const enrichRouteHybrid = async (params: {
  routePlanId: string
  routes: RouteInput[]
}): Promise<EnrichmentResult> => {
  // Phase 1: Local enrichment (immediate)
  const partial = await enrichLegsLocal({ routes: params.routes })

  // Update enrichment document with partial results
  await updateEnrichment(params.routePlanId, {
    phase: 'fast',
    partial,
    status: 'partial',
  })

  // Trigger UI update with partial results
  emit('enrichment_partial', { routePlanId: params.routePlanId })

  // Phase 2: Queue remote enrichment (background)
  if (isOnline()) {
    await enqueueEnrichmentJob({
      routePlanId: params.routePlanId,
      priority: 'immediate',
    })
  }

  return partial
}
```

## Sync Queue Processing

**File:** `convex/actions/sync/enrichment-queue.ts`

```typescript
export const processEnrichmentQueue = action({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    // Get pending enrichment jobs
    const jobs = await ctx.runQuery(api.enrichment.getPending, {
      limit: args.limit,
    })

    const results = await Promise.allSettled(
      jobs.map(async (job) => {
        try {
          // Load route plan data
          const routePlan = await ctx.runQuery(api.routes.get, {
            id: job.routePlanId,
          })

          // Call Haiku for full enrichment
          const complete = await enrichRouteRemote({
            routePlanId: job.routePlanId,
            segments: routePlan.segments,
          })

          // Update enrichment document
          await ctx.runMutation(api.enrichment.update, {
            id: job.enrichmentId,
            complete,
            phase: 'extended',
            status: 'complete',
          })

          // Emit event for UI update
          emit('enrichment_complete', { routePlanId: job.routePlanId })

          return { success: true }
        } catch (error) {
          // Handle retry logic
          await ctx.runMutation(api.enrichment.incrementRetry, {
            id: job.enrichmentId,
            error: error.message,
          })

          return { success: false, error: error.message }
        }
      })
    )

    const processed = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return { processed, failed }
  },
})
```

## Performance Targets

| Metric | Target | Measured |
|--------|--------|----------|
| Time to first response | <10s | TBD |
| Weather enrichment | <20s | TBD |
| Local leg label generation | <0.5s | 0.35s ✓ |
| Remote full enrichment | <5s | 3.9s ✓ |
| Progressive UI update | <100ms | TBD |
| Queue drain rate | >10 jobs/min | TBD |
| Memory usage (Qwen3.5) | <1.5GB | 1.15GB ✓ |
| Battery impact (local) | <2% per 10 routes | TBD |

## UI Components

### Enrichment Status Indicator

**Location:** Route card header

**States:**
- `loading` (spinner): Local enrichment in progress
- `partial` (checkmark): Leg labels ready, full enrichment queued
- `complete` (star): Full enrichment available
- `offline` (cloud icon): Offline, showing partial enrichment only

### Progressive Enhancement Toast

**Location:** Floating above map (non-blocking)

**Display:**
```
┌────────────────────────────────────────┐
│ [✓] Leg labels ready     [Dismiss]    │
│ Fetching weather data... ████░░░░ 45%  │
└────────────────────────────────────────┘
```

**Stages:**
1. ✓ Leg labels ready (0.35s)
2. Fetching weather data... (1-20s)
3. Calculating elevation (1-2s)
4. Analyzing scenic roads (0.5-1s)
5. ✓ Complete

## Implementation Checklist

- [ ] Install Qwen3.5 0.8B runtime (MLX)
- [ ] Create local model executor
- [ ] Implement leg label generation workflow
- [ ] Create weather enrichment job scheduler
- [ ] Implement Open-Meteo API integration
- [ ] Create enrichment document schema
- [ ] Implement hybrid orchestrator with weather phase
- [ ] Create sync queue processor
- [ ] Add enrichment status UI components
- [ ] Implement progressive enhancement toasts
- [ ] Create WeatherBadgeSkeleton component
- [ ] Add connectivity detection
- [ ] Test offline→online sync flow
- [ ] Test progressive weather loading
- [ ] Performance testing (memory, battery)
- [ ] Error handling edge cases

## References

- **Swarm Research:** `.spec/research/SWARM_RESEARCH_SUMMARY.md`
- **Pi Agent Plan:** `convex/actions/agent/agents/enrichmentAgent.ts`
- **Technical Requirements:** `08-technical-requirements.md`
- **Frontend Components:** `components/routing/sync-status-indicator.tsx`
