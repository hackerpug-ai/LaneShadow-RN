---
stability: CONSTITUTION
last_validated: 2026-04-10
prd_version: 1.3.0
---

# Progressive Route Enrichment Architecture

> **v1.3 rewrite.** This document previously described a "hybrid" architecture that combined on-device Qwen3.5 0.8B leg-label generation with server-side Haiku creative enrichment. v1.3 removes the on-device LLM entirely (see README rollback section and `.spec/research/local-models/ENVIRONMENT_BIAS_FINDING_2026-04-10.md`). The architecture is now **server-side only progressive enrichment**: routing is one step, loading ends when the route is ready, and all enrichment (weather, creative text, future phases) trickles in asynchronously as background jobs complete. This file is the canonical spec for that pattern.

## Executive Principle

**Routing is one step in a pipeline. Loading ends when the route is ready — not when enrichment is done.** After the route commits, background jobs continue enriching the route document silently. The UI subscribes to the route's `route_enrichments` document and updates reactively as each phase lands. The user sees their route fast; the details trickle in.

This is both a UX win (sub-10s time-to-first-response vs ~90s blocking) and an architectural simplification (each enrichment phase is an independent, retriable, cancellable job).

## What Progressive Enrichment Means

### The old (blocking) model we are replacing

```
User taps "Plan Ride"
   │
   ▼
Orchestrator runs:
  ├─ Street routing           (5–10s)
  ├─ Weather fetch             (15s)   ← BLOCKING
  └─ Creative AI enrichment    (4s)    ← BLOCKING
   │
   ▼
Loading spinner stops
User sees the fully-enriched route
Total: ~90s to first byte
```

**Problems:**
- User stares at a spinner for over a minute before seeing any route at all.
- If weather fails, the whole request fails or degrades awkwardly.
- If creative enrichment is slow, the user can't even start looking at their route.
- Loading state conflates "route exists" with "everything about the route is finalized."

### The new (progressive, trickle-in) model

```
User taps "Plan Ride"
   │
   ▼
Orchestrator runs:
  └─ Street routing            (5–10s)   ← ONLY THIS STEP BLOCKS
   │
   ▼
Route committed to Convex
Loading spinner stops
User sees the route immediately, with:
  • Geometry (Mapbox)
  • Deterministic leg labels (pure code, <10ms)
  • Skeleton badges for weather + creative enrichment
   │
   ▼
Background jobs scheduled via ctx.scheduler.runAfter(0, ...):
  ├─ runWeatherEnrichmentJob   (~15s)   ← trickles in
  └─ runCreativeEnrichmentJob  (~4s)    ← trickles in
   │
   ▼
Each job calls mergeEnrichment() on completion.
Frontend subscribes via useQuery(routeEnrichments.getByRouteId).
UI fades in each field reactively as it arrives.
```

**Key properties:**
- Time to first response is bounded by routing only (~5–10s)
- Enrichment phases run in parallel, not sequentially
- Each phase can fail independently without killing the route
- The loading state ends once — when the route exists — and never re-enters
- Enrichment updates never cause a "loading" state in the UI; they fade in over skeleton placeholders

## Enrichment Phases (v1.3)

| Phase | Trigger | Source | Duration | Merges into |
|---|---|---|---|---|
| **geometry** | synchronous during `planRide` | Mapbox SDK (offline-capable via downloaded regions) | 5–10s | `routes.geometry` |
| **legLabels** | synchronous during `planRide`, after geometry | Deterministic `legLabelDeriver()` from waypoint names (pure code) | <10ms | `routes.legLabels` |
| **weather** | scheduled post-commit | Open-Meteo (Convex action) | ~15s | `route_enrichments.weather` |
| **creative** | scheduled post-commit | Claude Haiku @ temp=0 via pi-ai (Convex action) | ~4s | `route_enrichments.creative` |

**Note on phases that run synchronously:** `geometry` and `legLabels` happen inside the original `planRide` action, so the user experiences them as "loading." Everything else runs as a scheduled background job after `planRide` returns.

**No on-device inference anywhere in this table.** Leg labels are deterministic; creative enrichment is server-side Haiku. See the P0 principle in the curation PRD for the full rationale — this document adopts it by reference.

## Invalidation Guards (Critical)

**The problem:** a user plans a route ("A → B"), enrichment jobs start, then the user changes their mind ("actually, A → C"). The first route's enrichment is still running in the background. If it lands after the second route commits, it could:
1. Overwrite the second route's enrichment (bad)
2. Appear in the UI as trickled data for a route the user no longer wants (confusing)
3. Waste Haiku tokens on a route the user will never see (cost)

**The guard:** every enrichment job must check that the route it is enriching is still the "current" route for its `planningSessionId` before merging results. If a newer route exists in the same session, the job aborts and does not touch `route_enrichments`.

This pattern is already implemented in `convex/db/routeEnrichments.ts` as:

```typescript
// convex/db/routeEnrichments.ts
export const invalidateStaleEnrichments = internalMutation({
  args: {
    planningSessionId: v.id('planning_sessions'),
    newRoutePlanId: v.id('route_plans'),   // the "current" route — exclude from invalidation
  },
  // Handler marks all enrichments for the session EXCEPT newRoutePlanId as `status: 'cancelled'`
})
```

### The invalidation protocol

1. **On new route commit:** `planRide` calls `invalidateStaleEnrichments({ planningSessionId, newRoutePlanId })` immediately after committing the route document, before scheduling any enrichment jobs. This marks any in-flight enrichments for the same session as stale.

2. **Before every `mergeEnrichment` call:** the background job reads the current enrichment record and checks `status`. If `status === 'cancelled'`, the job exits without touching any document. No merge, no retry, no error log beyond a counter. The scheduled job run is a no-op.

3. **On route mutation (waypoint added, reordered, renamed):** the mutation triggers a fresh enrichment cycle. The old enrichment jobs are invalidated by the same protocol before new ones are scheduled.

4. **Frontend subscription handling:** the UI subscribes to `route_enrichments` by `routePlanId`, not by `planningSessionId`. When the active `routePlanId` changes (user picks a new route), the subscription retargets. In-flight updates for the old `routePlanId` are simply ignored by the UI because the subscription is no longer listening to that document.

### What this guarantees

- **No stale writes.** A cancelled enrichment can never land on the wrong route, because the job itself refuses to write.
- **No ghost updates.** The UI only ever sees enrichment for the route it's currently showing, because the subscription is keyed to `routePlanId`.
- **Bounded waste.** At most one full Haiku call + one weather probe are "wasted" per rapid re-plan. The soft-fail pattern treats this as normal operation, not an error.
- **No race between routing and enrichment.** `invalidateStaleEnrichments` runs inside the same mutation that commits the new route, so there is no window where both old and new enrichments are considered "live."

## Explicitly Out of Scope (v1.3)

To keep scope tight, the following are **not in scope** for this initiative. Any of them would require its own PRD and research cycle:

- **Enrichment caching.** Enrichment is computed per-route, per-plan, every time. No hashing of route geometry, no reuse of prior creative text across similar routes, no `contentFingerprint`-based dedup in the hot path. (The existing `contentFingerprint` column can remain in the schema — it's not harmful — but nothing consults it as a cache key in v1.3.)
- **Route caching.** Routes are not cached. Every `planRide` request runs Mapbox routing fresh. If two users plan the same route, they run it twice. This is acceptable because Mapbox cost is ~$0.0003 per direction and the complexity of a correct cache (keyed on waypoints + provider version + Mapbox data version) is larger than the savings.
- **Time-based cache invalidation.** No TTL, no 5-minute weather-bucket fingerprints, no "refresh after N minutes" behavior. Enrichment is stale if and only if the route changes; otherwise it is valid indefinitely.
- **Proactive re-enrichment.** If weather data changes three hours after a route was enriched, the route's weather badges will still show the original data. Users who want fresh weather re-plan the route. (This may be revisited later, but not in v1.3.)
- **Cross-route enrichment dedup.** Two identical routes get two separate Haiku calls.

Putting all four of these out of scope is a deliberate simplification. It means: `planRide → invalidate-stale → commit route → schedule-jobs → each job runs exactly once → each job either merges or aborts → done.` No cache layer, no TTL layer, no dedup layer. The whole flow is ~100 lines of new Convex code on top of what already exists.

## Data Model

### `route_plans` status transitions

```
pending  →  running  →  routing-complete  →  (terminal: the loading state ends here)
                              │
                              ├─ (background) enriching-weather → weather merged
                              └─ (background) enriching-creative → creative merged
                                     │
                                     ▼
                              (terminal: complete)
```

Key point: `routing-complete` is the state that ends the UI loading state. Background jobs continue after this point, but they do not re-enter loading. The UI distinguishes "route exists" from "every enrichment field is populated" via the skeleton/fade-in pattern in `route_enrichments`, not via `route_plans.status`.

### `route_enrichments` schema (v1.3)

```typescript
{
  routePlanId: Id<'route_plans'>,
  planningSessionId: Id<'planning_sessions'>,   // used by invalidateStaleEnrichments
  clerkUserId: string,

  // Per-phase status — each phase is independent
  weather: {
    status: 'pending' | 'running' | 'complete' | 'failed' | 'cancelled',
    data?: WeatherSummary,
    scheduledAt: number,
    completedAt?: number,
    error?: string,
  },

  creative: {
    status: 'pending' | 'running' | 'complete' | 'failed' | 'cancelled',
    data?: {
      label: string,
      rationale: string,
      highlights: string[],
    },
    scheduledAt: number,
    completedAt?: number,
    error?: string,
    model: 'haiku',       // locked — no 'qwen3.5-0.8b' ever
  },

  createdAt: number,
  updatedAt: number,
}
```

**Per-phase status** (instead of a single top-level status) is what lets phases succeed, fail, and land independently. A failed weather phase does not block a successful creative phase.

**`cancelled` is the terminal state that the invalidation guard uses.** When a background job finds its phase in `cancelled`, it exits without writing. When the orchestrator calls `invalidateStaleEnrichments`, it patches all stale phases to `cancelled`.

## API / Convex Surface

### Action: `planRide` (existing, modified)

```typescript
// convex/actions/agent/planRide.ts
export const planRide = action({
  args: { ... },
  handler: async (ctx, args) => {
    // 1. Route the ride (geometry)
    const route = await runStreetRouting(ctx, args)

    // 2. Derive deterministic leg labels (pure code, sync)
    const legLabels = deriveLegLabels(route.waypoints)

    // 3. Commit route to Convex (this is the "loading ends" moment)
    const routePlanId = await ctx.runMutation(
      internal.db.routePlans.commit,
      { ...route, legLabels, status: 'routing-complete' }
    )

    // 4. Invalidate any stale enrichments for the same planning session
    await ctx.runMutation(
      internal.db.routeEnrichments.invalidateStaleEnrichments,
      { planningSessionId: args.planningSessionId, newRoutePlanId: routePlanId }
    )

    // 5. Create per-phase enrichment records (status: pending)
    const enrichmentId = await ctx.runMutation(
      internal.db.routeEnrichments.create,
      { routePlanId, planningSessionId: args.planningSessionId, userId: args.userId }
    )

    // 6. Schedule background jobs (non-blocking)
    await ctx.scheduler.runAfter(0, internal.actions.agent.enrichment.runWeatherEnrichmentJob, { enrichmentId })
    await ctx.scheduler.runAfter(0, internal.actions.agent.enrichment.runCreativeEnrichmentJob, { enrichmentId })

    // 7. Return the route immediately — loading UI exits here
    return { routePlanId, route, legLabels }
  },
})
```

### InternalAction: `runWeatherEnrichmentJob`

```typescript
export const runWeatherEnrichmentJob = internalAction({
  args: { enrichmentId: v.id('route_enrichments') },
  handler: async (ctx, { enrichmentId }) => {
    // GUARD: check if this phase was cancelled before we started
    const enrichment = await ctx.runQuery(internal.db.routeEnrichments.getById, { enrichmentId })
    if (enrichment.weather.status === 'cancelled') return  // no-op

    // Mark as running
    await ctx.runMutation(internal.db.routeEnrichments.patchPhase, {
      enrichmentId, phase: 'weather', patch: { status: 'running' }
    })

    try {
      const data = await probeConditions(enrichment.routePlanId)

      // GUARD: re-check cancellation right before merging (race protection)
      const current = await ctx.runQuery(internal.db.routeEnrichments.getById, { enrichmentId })
      if (current.weather.status === 'cancelled') return  // no-op; another plan took over

      await ctx.runMutation(internal.db.routeEnrichments.patchPhase, {
        enrichmentId, phase: 'weather',
        patch: { status: 'complete', data, completedAt: Date.now() }
      })
    } catch (error) {
      await ctx.runMutation(internal.db.routeEnrichments.patchPhase, {
        enrichmentId, phase: 'weather',
        patch: { status: 'failed', error: String(error) }
      })
    }
  },
})
```

`runCreativeEnrichmentJob` follows the same shape, calling Haiku instead of Open-Meteo. The **double-cancellation-check** (once before starting work, once right before merging) closes the race window between "job starts" and "another plan gets committed."

### InternalMutation: `invalidateStaleEnrichments` (existing)

Already implemented in `convex/db/routeEnrichments.ts` (handler `invalidateStaleEnrichmentsHandler` at line 229, mutation wrapper at line 415). The v1.3 behavior required:

- Query all `route_enrichments` rows with `planningSessionId === args.planningSessionId` AND `routePlanId !== args.newRoutePlanId`
- For each stale row, patch every phase currently in `pending` or `running` to `status: 'cancelled'`
- Do NOT touch phases already in `complete` or `failed` — those are immutable results.

### Frontend subscription

```typescript
// Frontend hook
const enrichment = useQuery(api.db.routeEnrichments.getByRoutePlanId, { routePlanId })

// Renders:
//   enrichment.weather.status === 'pending' | 'running' → WeatherBadgeSkeleton
//   enrichment.weather.status === 'complete'            → fade-in with enrichment.weather.data
//   enrichment.weather.status === 'failed'              → hide the badge (soft-fail)
//   enrichment.weather.status === 'cancelled'           → never reached — subscription retargets
```

The `cancelled` status is never rendered because the frontend subscription keys on `routePlanId`, not `planningSessionId`. When the user picks a new route, the subscription retargets to the new `routePlanId` and the old `cancelled` enrichment is no longer in view.

## Error Handling (Soft-Fail Default)

Every enrichment phase follows the same error discipline:

| Error | Recovery | User Impact |
|-------|----------|-------------|
| Weather API unreachable | Mark phase `failed`, hide badge | None — route still works with geometry + leg labels |
| Haiku API rate limit | Mark phase `failed`, hide creative section | Route label falls back to `"Route #{id}"`, no rationale/highlights |
| Haiku returns malformed JSON (Instructor retry fails) | Mark phase `failed`, hide creative section | Same as above |
| Network disappears mid-job | Mark phase `failed`, hide badge | Route still works; next plan retries |
| Job scheduled for a cancelled enrichment | No-op exit | None — by design |

No enrichment failure ever affects the route itself. Routes without enrichment are still fully usable — geometry renders, deterministic leg labels show, the user can start riding.

## Performance Targets

| Metric | Target | Notes |
|---|---|---|
| Time to "loading ends" (route visible) | <10s | Dominated by Mapbox routing |
| Time to deterministic leg labels | <10ms after route commit | Pure code, synchronous |
| Time to weather fade-in | <20s after loading ends | Open-Meteo background job |
| Time to creative fade-in | <5s after loading ends | Haiku background job, target 3.9s |
| Invalidation latency (stale job detection) | <200ms | Guarded by Convex mutation atomicity |
| Wasted Haiku calls per rapid re-plan | ≤1 | Bounded by `invalidateStaleEnrichments` window |
| Progressive UI update latency | <100ms | Convex reactive query update |

## Existing Work in Flight (Epic 6)

The UI layer for progressive trickle-in is already partially scoped under **Epic 6** in `tasks/`. The v1.3 rewrite does not throw this work away — it retargets it. The current status:

| Task | Epic | Status | v1.3 disposition |
|---|---|---|---|
| **CLR-015: Skeleton Loading Components** | 6a — Progressive Skeleton | Pending | **Keep as-is.** Skeleton components (`LabelSkeleton`, `WeatherBadgeSkeleton`, shimmer patterns, fade-in transitions) are exactly what the trickle-in model needs. The design is already agnostic about what fills the skeleton; it just needs to be wired to per-phase enrichment status instead of a single "partial/complete" flag. |
| **CLR-016: Dual-Model Orchestration** | 6b — Progressive Partial | **DEPRECATED / CANCELED** (already marked by the user in `epic-6b-progressive-partial/EPIC.md`) | **Remains canceled.** This task described the Qwen3.5-local + Haiku-remote dual-model orchestrator. v1.3 rollback confirms it should not ship. The replacement for its backend scope is the two independent jobs (`runWeatherEnrichmentJob` + `runCreativeEnrichmentJob`) described in this doc, which are Convex-action-only and have no on-device component. |
| **CLR-017: Progressive Enhancement UI** | 6c — Progressive Complete | Pending | **Retarget.** Replace "creative label fade-in + toast on completion" with "per-phase fade-in." Each phase (weather, creative) has its own fade-in when its `status` flips to `complete`. Badge state goes `pending → running → complete/failed/cancelled` per phase, not as a single value. Remove the toast on overall completion — there is no single "done" moment anymore; each phase lands independently. |
| **CLR-018: Enrichment Status Hooks** | 6c — Progressive Complete | Pending | **Retarget.** `useEnrichmentStatus(routePlanId)` now returns a per-phase status object: `{ weather: PhaseState, creative: PhaseState }`. Subscribes to `route_enrichments` keyed by `routePlanId` (not `planningSessionId`). Automatically "forgets" the previous route when the active `routePlanId` changes, so cancelled enrichment for a stale route never appears in the UI. Remove the "trigger toast on completion" behavior — individual phase completions are shown via fade-in, not toast. |

**Critical nuance for CLR-017 and CLR-018:** The old design assumed a single `EnrichmentStatus` enum (`draft | partial | complete`) with one transition path. v1.3 replaces that with per-phase state, because weather and creative complete independently (and either can fail without affecting the other). The hook and components must model this accurately — don't try to collapse per-phase state into a single value for UI simplicity, because doing so reintroduces the "single complete moment" that trickle-in is explicitly trying to eliminate.

## Implementation Checklist

### Remove (local LLM rollback)
- [ ] Remove `convex/actions/agent/enrichment/runHybridEnrichmentJob.ts` (old hybrid orchestrator with Qwen paths)
- [ ] Remove `lib/ai/local-enrichment.ts` and any Qwen3.5 invocation paths
- [ ] Remove `lib/ai/hybrid-enrichment.ts` (old dual-path orchestrator)
- [ ] Remove all tests and test fixtures referencing Qwen3.5, `mlx-local`, or local model inference
- [ ] Confirm Epic 6b (CLR-016) stays cancelled and no code is merged that implements dual-model orchestration

### Backend (progressive enrichment + invalidation)
- [ ] Implement `lib/routing/leg-labels.ts` — pure `deriveLegLabels(waypoints)` function, synchronous, offline-capable, used by `planRide` before committing the route
- [ ] Update `convex/actions/agent/planRide.ts` to the flow shown above (route → commit → invalidate → schedule → return) — the "loading ends" moment is `planRide`'s return, not job completion
- [ ] Implement `convex/actions/agent/enrichment/runWeatherEnrichmentJob.ts` with double-cancellation-check (before starting, before merging)
- [ ] Implement `convex/actions/agent/enrichment/runCreativeEnrichmentJob.ts` with double-cancellation-check (before starting, before merging)
- [ ] Update `models/route-enrichments.ts` to the per-phase schema with `cancelled` status on each phase
- [ ] Update `convex/db/routeEnrichments.ts` `invalidateStaleEnrichmentsHandler` to patch per-phase status to `cancelled` (only for phases currently in `pending` or `running`; leave `complete` and `failed` alone)
- [ ] Migrate existing `route_enrichments` rows to drop any `partial.model === 'qwen3.5-0.8b'` data and re-derive leg labels deterministically onto the route document

### Frontend (trickle-in UI — reuses epic 6a + retargeted 6c)
- [ ] Ship CLR-015 (skeleton components) as designed
- [ ] Retarget CLR-017 to render per-phase fade-in (one fade per phase completion), drop the single "complete" toast
- [ ] Retarget CLR-018 to return per-phase state object from `useEnrichmentStatus(routePlanId)`, keyed by `routePlanId` so stale enrichments disappear on route change
- [ ] Wire weather badges and creative label section to their respective phase status (`pending/running → skeleton`, `complete → fade-in content`, `failed → hide`, `cancelled → never reached in UI`)

### Tests (invalidation guard is the highest-risk change)
- [ ] **Rapid re-plan test (critical):** plan route A, plan route B for the same planning session before A's enrichment completes, assert that A's enrichment never lands on either route document. No writes to A, no writes to B from A's jobs.
- [ ] **Double-cancellation-check race test:** cancel an enrichment between "job starts" and "job merges"; assert the merge is a no-op.
- [ ] **Phase independence test:** weather fails, creative succeeds — assert creative still lands and UI shows it.
- [ ] **Phase independence test (reverse):** creative fails, weather succeeds — assert weather still lands and UI shows it.
- [ ] **Both-fail test:** both phases fail; assert the route remains fully usable with geometry + deterministic leg labels and no broken UI state.
- [ ] **Frontend subscription test:** user navigates from route A to route B; assert the hook retargets and never displays A's enrichment data.

## References

- **Progressive Route Loading artifact:** `.spec/artifacts/prd/progressive-route-loading/README.md` (source of the trickle-in + invalidation requirements)
- **Environment bias finding (Qwen rollback rationale):** `.spec/research/local-models/ENVIRONMENT_BIAS_FINDING_2026-04-10.md`
- **Existing invalidation code:** `convex/db/routeEnrichments.ts` lines 229, 415 (`invalidateStaleEnrichmentsHandler`, `invalidateStaleEnrichments`)
- **Technical requirements:** `08-technical-requirements.md`
- **Frontend enrichment hooks:** `hooks/use-enrichment-status.ts`
