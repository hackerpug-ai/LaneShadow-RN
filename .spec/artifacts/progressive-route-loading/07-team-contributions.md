# Team Contributions

## Phase 1: User Personas & UX Requirements

**Contributors:** Frontend Designer, Product Manager

**Findings:**
- **Primary Persona:** Rider planning motorcycle trips
  - Needs route options quickly to make decisions
  - Values time-to-first-response over perfect completeness
  - Accepts progressive enhancement as long as core functionality works

- **UX Requirements:**
  - Routes must appear within 5-10 seconds
  - Progressive data arrival should be smooth, not jarring
  - Clear indication of what's loading vs what's complete
  - Graceful degradation if enrichment fails

## Phase 2: Technical Architecture

**Contributors:** Engineering Manager (Convex Specialist), Product Manager

**Findings:**
- **Critical Discovery:** Enrichment infrastructure already exists
  - `route_enrichments` table with job scheduling
  - Background job via `ctx.scheduler`
  - Cache invalidation via `contentFingerprint`
  - Reactive updates via `mergeEnrichment` mutation

- **Current Problem:**
  - Weather data fetched in orchestrator (~15s) but hardcoded to 'unavailable'
  - Blocking probe in `planRideOrchestrator.ts` lines 89-119
  - Wasted effort that delays response

- **Solution Scope:**
  - Remove blocking weather probe (deletion, not new code)
  - Add 'weather' phase to enrichment enum
  - Create `runWeatherEnrichmentJob.ts` (reuse existing tools)
  - Update `buildOptionsFromResults()` to return real data

## Phase 3: UI Infrastructure

**Contributors:** Frontend Designer, Engineering Manager

**Findings:**
- **Existing Components:**
  - `EnrichmentStatusIndicator` - already supports fast/extended phases
  - `RouteAttachmentCard` - has weather badge slots
  - `Skeleton` component - can be extended for weather badges
  - Semantic theme tokens for all states

- **New Components Needed:**
  - `WeatherBadgeSkeleton` - loading placeholder
  - Progressive rendering logic in `RouteAttachmentCard`
  - Enrichment status subscription hook

- **Animation Requirements:**
  - FadeIn animations (200-400ms staggered)
  - Respect reduced motion preference
  - Reserve layout space to prevent shifts

## Phase 4: Architecture Assessment

**Contributors:** Product Manager

**Findings:**
- This is primarily a **removal and wiring task**, not new infrastructure
- Most complexity is in existing enrichment system
- Changes are localized to 5 files
- Low risk: leverages well-tested patterns

**Key Files:**
- `convex/actions/agent/lib/planRideOrchestrator.ts` - Remove lines 89-119
- `convex/actions/agent/enrichment/runWeatherEnrichmentJob.ts` - NEW
- `convex/actions/agent/planRide.ts` - Update buildOptionsFromResults
- `components/chat/route-attachment-card.tsx` - Add progressive rendering
- `components/weather/weather-badge-skeleton.tsx` - NEW

**Performance Impact:**
- Before: ~90s (75s routing + 15s weather blocking)
- After: ~5-10s (routes ready), +20s (weather flows in)
- Improvement: 75-85% reduction in time-to-first-response
