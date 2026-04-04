# Epic 2: Browse & View Saved Routes

> Epic Sequence: 2
> PRD: .spec/prd/ROADMAP.md
> PRD Version: 1.0.0
> Appetite: 6 weeks
> Tasks: 8 (US-011 merged into US-010)

## Overview

Replace the stub Saved Routes tab with a functional browsing experience. Users can view a scrollable list of saved routes, tap to see full detail with map and overlays, and navigate back without losing scroll position.

## Human Test Steps

When this epic is complete, users should be able to:

1. Navigate to Saved Routes tab
2. See a scrollable list of saved routes (newest first)
3. On each card, see: route name, date saved, start/end locations, distance
4. See route thumbnail (mini map preview) on each card
5. If no routes saved, see empty state with "Plan your first route" CTA
6. Tap a route card
7. See full detail view with route on map
8. Toggle between wind/rain/temp overlays on the detail map
9. Scroll down to see route timeline with leg-by-leg breakdown
10. See the original scenic rationale and weather conditions
11. Press back - return to list without losing scroll position

## Acceptance Criteria (from PRD)

- Rider can view a scrollable list of all saved routes on the Saved Routes tab
- Rider can see route name, date saved, start/end locations, and distance on each card
- Rider can see a route thumbnail preview (mini map) on each card
- System displays routes in reverse chronological order (newest first)
- Rider can see empty state with call-to-action when no routes saved
- Rider can tap a saved route card to open full detail view
- Rider can see the route rendered on a full map with all overlays available
- Rider can view route timeline with leg-by-leg breakdown
- Rider can see the original scenic rationale and weather conditions
- Rider can toggle between wind/rain/temp overlays on the detail map
- Rider can navigate back to list without losing scroll position

## PRD Sections Covered

- UC-SR-01: Saved Routes List
- UC-SR-03: Route Detail View

## Dependencies

This epic depends on:
- Epic 1: Complete Weather Planning Experience (complete)

This epic blocks:
- Epic 3: Search, Filter & Organize Routes

## Task List

| Task ID | Title | Type | Priority | Assignee |
|---------|-------|------|----------|----------|
| US-010 | Replace stub saved-routes.tsx with FlatList and hook wiring | FEATURE | P1 | tdd-ui-implementer |
| US-011 | MERGED INTO US-010 | - | - | - |
| US-012 | Add static map thumbnail preview to SavedRouteCard | FEATURE | P2 | tdd-ui-implementer |
| US-013 | Show route metadata (name, date, locations, distance) on card | FEATURE | P2 | tdd-ui-implementer |
| US-014 | Build empty state component with planning CTA | FEATURE | P2 | tdd-ui-implementer |
| US-015 | Build route detail screen with full map view | FEATURE | P1 | tdd-ui-implementer |
| US-016 | Add overlay toggle to route detail map | FEATURE | P2 | tdd-ui-implementer |
| US-017 | Build route leg timeline with per-leg weather badges | FEATURE | P2 | tdd-ui-implementer |
| US-018 | Preserve list scroll position on navigation | FEATURE | P3 | tdd-ui-implementer |

## Dependency Graph

```
US-010 (list+hook) ──┬──► US-014 (empty state)
                     └──► US-015 (detail screen) ──┬──► US-016 (overlays)
                                                    ├──► US-017 (timeline)
                                                    └──► US-018 (scroll)
US-012 (thumbnail) ── no deps (parallel)
US-013 (metadata)  ── no deps (parallel)
```

## Parallel Groups

- **Group A** (no deps): US-010, US-012, US-013
- **Group B** (after US-010): US-014
- **Group C** (after US-015): US-016, US-017
- **Group D** (after US-010 + US-015): US-018

## Design Notes

- Route detail screen uses full-screen push (`app/(app)/saved-route/[id].tsx`), not bottom sheet
- RouteThumbnail has a CSS linear-gradient bug to fix (invalid in React Native)
- Existing RouteTimeline cannot be reused for leg detail - new RouteLegTimeline component needed
- Scenic rationale text not persisted in SavedRoute - use routeSnapshot.annotations as "Highlights" for MVP
- EmptyState should be a generic reusable component at components/ui/empty-state.tsx
