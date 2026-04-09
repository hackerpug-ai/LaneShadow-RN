---
stability: FEATURE_SPEC
last_validated: 2026-04-09
prd_version: 1.0.0
appetite_weeks: 2
---

# Scope

**Appetite:** 2 weeks (core feature + key edge cases)

## In Scope

- Remove blocking weather probe from `planRideOrchestrator.ts` (lines 89-119)
- Create weather enrichment job in enrichment pipeline
- Update `buildOptionsFromResults()` to return actual weather data instead of 'unavailable'
- Add progressive loading states to `RouteAttachmentCard` component
- Create `WeatherBadgeSkeleton` component for loading state
- Integrate `EnrichmentStatusIndicator` into route cards
- Add "Enriching" phase to routing progress indicator
- Update route plan status transitions to include enrichment phase
- Error handling: graceful degradation if enrichment fails
- Testing: unit tests for progressive rendering logic

## Out of Scope

- Extended AI enrichment (deep analysis, POI recommendations) - deferred to future cycle
- Weather data caching beyond existing `contentFingerprint` mechanism
- User preferences for progressive loading (opt-in/out)
- Offline mode support for cached routes
- Multi-route comparison features
- Route favoriting during enrichment
- Push notifications when enrichment completes

## Deferred for Appetite

- **Staggered fade-in animations** - Phase 2 polish, can ship without
- **Accessibility enhancements** - screen reader announcements beyond basic live regions
- **Performance optimization** - 60fps validation, low-end device testing
- **Comprehensive error recovery** - retry mechanisms for transient failures
