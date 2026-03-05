---
stability: FEATURE_SPEC
last_validated: 2026-03-04
prd_version: 1.0.0
appetite_weeks: 6
---

# Scope

## Appetite

**6 weeks** - Full feature implementation including Phase 1 gap closure, saved routes UI, personalization, and post-ride experience.

## In Scope

### Phase 1 Gap Closure
- Rain forecast overlay integration into route cards and map
- Temperature overlay integration into route cards and map
- Multi-overlay comparison view (wind + rain + temp)
- Enhanced rationale display with weather context

### Saved Routes Management
- Saved routes list screen with chronological display
- Route search by name/location
- Route filtering by date range
- Route detail view with full map rendering
- Delete saved routes
- Rename saved routes

### Personalization
- Favorite roads library (save road segments)
- Favorite roads browser with map preview
- Include favorite roads preference in route planning
- Avoid areas/roads preference
- Elevation profile visualization on routes

### Post-Ride Experience
- Route rating system (1-5 stars)
- Ride notes/comments on saved routes
- Ride history browser (completed rides)
- Mark route as "ridden" vs "planned"

## Out of Scope

- Live ride tracking or turn-by-turn navigation [DEFERRED: v2]
- Push notifications [DEFERRED: user engagement feature]
- Route dragging or waypoint editing [DEFERRED: complexity]
- Road surface quality scoring [DEFERRED: no data source]
- Social features (sharing, following, public routes) [DEFERRED: v2]
- Multiple vehicle profiles [DEFERRED: single vehicle v1]
- Offline mode [DEFERRED: complexity]
- Personal analytics dashboard [DEFERRED: requires usage data]
- Time-of-day departure optimization [DEFERRED: appetite]
