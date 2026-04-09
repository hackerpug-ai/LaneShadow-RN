---
stability: CONSTITUTION
last_validated: 2026-04-09
prd_version: 1.0.0
---

# Technical Requirements

## System Components

| Component | Role | Files |
|-----------|------|-------|
| **Route Orchestrator** | Generates route variants via Google Routes API | `convex/actions/agent/lib/planRideOrchestrator.ts` |
| **Weather Enrichment Job** | Fetches weather data asynchronously | `convex/actions/agent/enrichment/runWeatherEnrichmentJob.ts` (NEW) |
| **Route Plan Manager** | Tracks status and manages enrichment lifecycle | `convex/db/routePlans.ts` |
| **Enrichment Scheduler** | Schedules background jobs with retry logic | `convex/db/routeEnrichments.ts` |
| **Progressive UI Components** | Displays routes with progressive loading states | `components/chat/route-attachment-card.tsx` |

## Data Schema

### route_plans Table

```typescript
{
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  phase?: 'reading' | 'finding' | 'weather' | 'building'
  enrichmentStatus?: 'pending' | 'running' | 'completed' | 'failed'
  enrichmentPhase?: 'weather' | 'ai'
  result?: PlannedRouteOptionsView  // Includes overlaysPreview
}
```

### route_enrichments Table

```typescript
{
  routePlanId: Id<'route_plans'>
  planningSessionId: Id<'planning_sessions'>
  contentFingerprint: string  // MD5 hash for cache invalidation
  phase: 'fast' | 'extended' | 'weather'  // NEW: 'weather' phase
  status: 'pending' | 'running' | 'completed' | 'cancelled' | 'failed'
  scheduledJobId?: Id<'_scheduled_functions'>
  enrichments?: [{
    routeOptionId: string
    label: string
    rationale: string
    highlights: string[]
    weather?: {  // NEW: weather enrichment data
      windSummary: 'calm' | 'moderate' | 'high'
      rainSummary: 'none' | 'light' | 'moderate' | 'heavy'
      temperatureSummary: 'cold' | 'mild' | 'hot'
      conditionsStatus: 'ok' | 'unavailable'
    }
  }]
}
```

## API Design

### Mutations

#### `db.routePlans.updatePlanStatus`
Updates route plan status and enrichment progress.

**Request:**
```typescript
{
  routePlanId: Id<'route_plans'>
  status: 'completed' | 'running'
  enrichmentStatus?: 'pending' | 'running' | 'completed' | 'failed'
  enrichmentPhase?: 'weather' | 'ai'
  statusMessage?: string
}
```

#### `db.routeEnrichments.createEnrichment`
Creates enrichment record and schedules background job.

**Request:**
```typescript
{
  routePlanId: Id<'route_plans'>
  planningSessionId: Id<'planning_sessions'>
  clerkUserId: string
  contentFingerprint: string
  phase: 'weather'  // NEW phase
}
```

**Response:**
```typescript
{
  enrichmentId: Id<'route_enrichments'>
}
```

### Queries

#### `db.routePlans.getPlanById`
Fetches route plan with current enrichment status (reactive).

**Request:**
```typescript
{
  routePlanId: Id<'route_plans'>
}
```

**Response:**
```typescript
{
  _id: Id<'route_plans'>
  status: 'completed'
  enrichmentStatus: 'running'
  enrichmentPhase: 'weather'
  result: PlannedRouteOptionsView  // Updates reactively
}
```

#### `db.routeEnrichments.getByRoutePlanId`
Fetches enrichment status for a route plan.

**Request:**
```typescript
{
  routePlanId: Id<'route_plans'>
}
```

**Response:**
```typescript
{
  _id: Id<'route_enrichments'>
  status: 'running'
  phase: 'weather'
  enrichments?: [...]
}
```

### Actions

#### `actions.agent.planRide`
Main entry point for route planning. Returns immediately after street routing.

**Request:**
```typescript
{
  planInput: PlanInput
}
```

**Response:**
```typescript
{
  planId: string
  options: [{
    routeOptionId: string
    label: string
    stats: { distanceMeters, durationSeconds, legsCount }
    map: { bounds, overviewGeometry, legs }
    overlaysPreview: {
      windSummary: 'unavailable'  // Initially unavailable
      rainSummary: 'unavailable'
      temperatureSummary: 'unavailable'
      conditionsStatus: 'unavailable'
    }
  }]
}
```

#### `actions.agent.enrichment.runWeatherEnrichmentJob`
Background job that fetches weather data and merges into route_plans.

**Request:**
```typescript
{
  enrichmentId: Id<'route_enrichments'>
  phase: 'weather'
}
```

**Response:** `null` (results merged into route_plans reactively)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │RoutingCard   │  │RouteAttach  │  │EnrichmentStatus  │  │
│  │              │  │mentCard     │  │Indicator         │  │
│  │(phase pills) │  │(progressive │  │(progress bar)    │  │
│  └──────┬───────┘  │loading)     │  └────────┬─────────┘  │
│         │          └──────┬──────┘           │             │
│         │                 │                   │             │
│         └─────────────────┴───────────────────┘             │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │ useQuery (reactive)
┌───────────────────────────┼─────────────────────────────────┐
│                   Convex Backend                            │
│                           │                                 │
│         ┌─────────────────▼──────────────────┐              │
│         │      api.db.routePlans            │              │
│         │      (getPlanById)                │              │
│         └─────────────────┬──────────────────┘              │
│                           │                                 │
│         ┌─────────────────▼──────────────────┐              │
│         │   actions.agent.planRide          │              │
│         │   (returns ~5-10s)                 │              │
│         └─────────────────┬──────────────────┘              │
│                           │                                 │
│         ┌─────────────────▼──────────────────┐              │
│         │  planRideOrchestrator              │              │
│         │  (NO weather probe)               │              │
│         └─────────────────┬──────────────────┘              │
│                           │                                 │
│         ┌─────────────────▼──────────────────┐              │
│         │  Google Routes API                 │              │
│         └────────────────────────────────────┘              │
│                           │                                 │
│                           │ schedule(100ms)                  │
│         ┌─────────────────▼──────────────────┐              │
│         │  runWeatherEnrichmentJob           │              │
│         │  (background, ~20s)                │              │
│         └─────────────────┬──────────────────┘              │
│                           │                                 │
│         ┌─────────────────▼──────────────────┐              │
│         │  Open-Meteo API                    │              │
│         │  (8 concurrent, 25 points)          │              │
│         └─────────────────┬──────────────────┘              │
│                           │                                 │
│         ┌─────────────────▼──────────────────┐              │
│         │  mergeEnrichment → route_plans     │              │
│         │  (reactive update)                 │              │
│         └────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────▼───────────────────┐
         │   External Dependencies              │
         │  • Google Routes API                 │
         │  • Open-Meteo API                   │
         │  • Convex Scheduler                 │
         └──────────────────────────────────────┘
```

## External Dependencies

| Dependency | Purpose | Documentation |
|------------|---------|---------------|
| **Google Routes API** | Street routing and geometry | https://developers.google.com/maps/routes |
| **Open-Meteo API** | Weather data (wind, rain, temperature) | https://open-meteo.com/en/docs |
| **Convex Scheduler** | Background job scheduling | https://docs.convex.dev/functions/scheduled-functions |

## UI Infrastructure

### Design Libraries
- React Native Reanimated 3+ (animations)
- Convex React Client (reactive queries)

### Style Tokens
```typescript
// Loading states
semantic.color.primary.default        // Copper pulse
semantic.color.enrichmentFast         // #2C9F9B (fast phase)
semantic.color.enrichmentExtended    // #8B5CF6 (extended phase)
semantic.color.surfaceVariant.default // Skeleton background

// Animations
FadeIn.duration(200)  // Weather badges
FadeIn.duration(300)  // Route labels
FadeIn.duration(400)  // Highlights
```

### Component Reuse

**Reuse Existing:**
- `EnrichmentStatusIndicator` - Progress indicator
- `Skeleton` - Loading placeholder pattern
- `RouteAttachmentCard` - Extend with progressive rendering
- `WeatherPill`, `RainBadge`, `TemperatureBadge` - Weather display

**New Components:**
- `WeatherBadgeSkeleton` - Weather badge loading state
- `useEnrichmentStatus` - Hook for enrichment subscription

## Performance Requirements

- **Time to first response:** <10 seconds (street routing only)
- **Weather enrichment:** <20 seconds (background)
- **Animation frame rate:** 60fps
- **Convex query latency:** <100ms (reactive updates)
- **Bundle size impact:** <5KB (progressive UI additions)

## Security Considerations

- No new authentication requirements (uses existing session)
- Weather data is public (no PII)
- Content fingerprint uses MD5 (cache key, not security)
- Background jobs run in system context (no user permissions)

## Testing Strategy

### Unit Tests
- `planRideOrchestrator` - Verify weather probe removed
- `buildOptionsFromResults` - Verify weather data returned
- `WeatherBadgeSkeleton` - Verify dimensions match badges
- Progressive rendering logic - Conditional rendering tests

### Integration Tests
- Full flow: planRide → enrichment → UI update
- Cache hit/miss scenarios
- Error handling (API failures)
- Concurrent enrichment jobs

### E2E Tests
- User creates route → sees routes in <10s
- Weather badges appear after ~20s
- Error states display correctly
- Reduced motion respected
