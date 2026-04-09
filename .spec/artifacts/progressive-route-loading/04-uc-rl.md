---
stability: FEATURE_SPEC
last_validated: 2026-04-09
prd_version: 1.0.0
functional_group: RL
---

# Use Cases: Route Loading (RL)

## UC-RL-01: Return Routes Immediately After Street Routing

**Description:**
The route orchestrator returns route options immediately after Google Routes API completes, without waiting for weather data. Routes include geometry, bounds, legs, and basic stats but have placeholder weather data.

**Acceptance Criteria:**
- ☐ System can return route options within 5-10 seconds after planRide action is called
- ☐ Route options include geometry (overviewPolyline), bounds, legs, distance, duration
- ☐ Route options have `overlaysPreview` set to 'unavailable' for all weather fields
- ☐ Route plan status transitions from 'running' to 'completed' when street routing finishes
- ☐ Frontend receives and displays route options immediately after completion
- ☐ Weather probe code is removed from `planRideOrchestrator.ts` lines 89-119

## UC-RL-02: Schedule Weather Enrichment as Background Job

**Description:**
After route plan completes, the system generates a content fingerprint and checks the enrichment cache. If cache miss, it creates a route_enrichments record and schedules a background weather enrichment job with 100ms delay.

**Acceptance Criteria:**
- ☐ System generates content fingerprint from plan input (start, end, departure time, preferences)
- ☐ System checks route_enrichments table for existing enrichment with matching fingerprint
- ☐ If cache miss, system creates route_enrichments record with status 'pending'
- ☐ System schedules background job via `ctx.scheduler.runAfter(100, runWeatherEnrichmentJob)`
- ☐ Scheduled job ID is stored in route_enrichments.scheduledJobId
- ☐ Background job is configured to run after 100ms delay
- ☐ Cache hit skips job scheduling and logs cache hit details

## UC-RL-03: Track Enrichment Status in Route Plans Table

**Description:**
The route_plans table tracks the enrichment phase so the frontend can display progress indicators. Status updates are reactive and trigger UI updates via Convex subscriptions.

**Acceptance Criteria:**
- ☐ route_plans schema includes enrichmentStatus field ('pending' | 'running' | 'completed' | 'failed')
- ☐ route_plans schema includes enrichmentPhase field ('weather' | 'ai')
- ☐ Frontend subscribes to route_plans changes via useQuery(api.db.routePlans.getPlanById)
- ☐ Enrichment status updates trigger reactive UI updates without refresh
- ☐ Status transitions: pending → running → completed/failed
- ☐ Failed status includes error message for display in UI
