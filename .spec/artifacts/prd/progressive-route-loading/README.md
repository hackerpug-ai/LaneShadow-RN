# Progressive Route Loading - Technical Summary

**Status**: Architecture Analysis Complete
**Next Step**: Review technical plan and create implementation tasks

## Key Findings

### 1. The Infrastructure Already Exists

The enrichment system (`route_enrichments` table) already supports:
- ✅ Background job scheduling via `ctx.scheduler`
- ✅ Cache invalidation via `contentFingerprint`
- ✅ Status tracking (pending/running/completed/failed)
- ✅ Reactive updates to frontend via `mergeEnrichment` mutation
- ✅ **Weather field in enrichment schema** (line 54 in `route-enrichments.ts`)

### 2. Weather Data Is Currently Wasted

The orchestrator fetches weather data (~15s) but the results are **hardcoded to 'unavailable'**:

```typescript
// convex/actions/agent/planRide.ts:146-149
overlaysPreview: {
  windSummary: 'unavailable',  // ← Hardcoded, despite fetching weather
  rainSummary: 'unavailable',
  temperatureSummary: 'unavailable',
  conditionsStatus: 'unavailable',
}
```

### 3. Simple Solution: Move Weather to Enrichment

**Current flow** (~90s):
```
planRide → orchestrator
  ├─ Street routing (5-10s)
  └─ Weather fetch (15s) ← BLOCKING
  └─ AI enrichment (background)
```

**Proposed flow** (~5-10s):
```
planRide → orchestrator
  └─ Street routing (5-10s) ← RETURN IMMEDIATELY

Background (parallel):
  ├─ AI enrichment (~5s)
  └─ Weather enrichment (~15s)
```

## Implementation Tasks

### Task 1: Remove Blocking Weather (1 hour)
**File**: `convex/actions/agent/lib/planRideOrchestrator.ts`
- Delete lines 89-119 (weather probing loop)
- Return `successful` directly

### Task 2: Add Weather Enrichment Phase (30 min)
**File**: `models/route-enrichments.ts`
- Add `'weather'` to `ROUTE_ENRICHMENT_PHASE`

### Task 3: Create Weather Enrichment Job (2 hours)
**File**: `convex/actions/agent/enrichment/runWeatherEnrichmentJob.ts` (NEW)
- Reuse existing `probeConditions` tool
- Call `mergeEnrichment` for reactive updates

### Task 4: Schedule Weather Enrichment (1 hour)
**File**: `convex/actions/agent/planRide.ts`
- Create 'weather' enrichment record after route completes
- Schedule `runWeatherEnrichmentJob` via `ctx.scheduler.runAfter`

### Task 5: Update Status Transitions (30 min)
**File**: `models/route-plans.ts`
- Add `'enriching'` status

## Convex Patterns to Follow

### Action vs InternalAction
- Use `internalAction` for scheduled background jobs (no JWT context)
- Use `action` for user-facing endpoints (has JWT context)

### Scheduler Usage
```typescript
const scheduledJobId = await ctx.scheduler.runAfter(
  100,  // 100ms delay
  internal.actions.agent.enrichment.runWeatherEnrichmentJob,
  { enrichmentId }
)
```

### Reactive Updates
```typescript
// Mutation updates document
await ctx.db.patch(routePlanId, { result: enrichedResult })

// Frontend automatically receives update (no WebSocket needed)
const routePlan = useQuery(api.db.routePlans.getPlanById, { routePlanId })
```

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Weather API fails | Soft-fail pattern (continue without weather) |
| Cache staleness | 5-minute time buckets in content fingerprint |
| Concurrent plans | Existing `invalidateStaleEnrichments` logic |
| Frontend race conditions | Status transitions prevent UI confusion |

## Performance Impact

- **Before**: ~90s (75s routing + 15s weather)
- **After**: ~5-10s (routes ready), +20s (weather flows in)
- **Improvement**: 75-85% reduction in time-to-first-response

## Next Steps

1. **Review** the technical architecture plan (linked below)
2. **Approve** the implementation approach
3. **Create** user stories for the implementation tasks
4. **Execute** using `/kb-run-epic` or convex-implementer agent

## Documents

- **Technical Architecture**: `.claude/plans/binary-sleeping-castle-agent-a6a2c795b75a491d6.md`
- **This Summary**: `.spec/prd/progressive-route-loading/README.md`

## Questions?

1. Should weather enrichment be cacheable? (Currently: yes, via content fingerprint)
2. What should happen if weather enrichment fails? (Currently: soft-fail, continue without weather)
3. Should we show "Enriching..." status in UI during weather fetch? (Recommended: yes)
