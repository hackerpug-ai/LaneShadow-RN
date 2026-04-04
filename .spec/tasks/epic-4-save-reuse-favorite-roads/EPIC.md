# Epic 4: Save & Reuse Favorite Roads

> Epic Sequence: 4
> PRD: .spec/prd/ROADMAP.md
> Tasks: 10

## Overview

Users can save road segments as favorites and have them influence route planning. This epic enables long-press gesture to save route segments, a settings section to manage favorites, and integration with the planning engine to prefer favorite roads when generating routes.

## Human Test Steps

When this epic is complete, users should be able to:

1. Long-press a route segment on the map and save it as a favorite with a custom name
2. View saved favorites in Settings with mini map previews showing the road location
3. Enable "Include favorite roads" toggle when planning a new route
4. See visual indicators showing which favorites influenced the generated route
5. Receive feedback when a favorite is too far from the planned route to be included
6. Remove favorites from the settings section

## Acceptance Criteria (from PRD)

- Long-press to save segment as favorite
- View favorites in Settings with mini map
- Toggle to include favorites in route planning
- See which favorites were included in generated routes
- Get feedback when favorite can't be included

## PRD Sections Covered

- UC-PERS-01
- UC-PERS-02

## Dependencies

This epic blocks the following epics:
- None

This epic depends on:
- Epic 2: Browse & View Saved Routes (for saved routes viewing patterns)

## Task List

| Task ID | Title | Type | Priority | Blocked By |
|---------|-------|------|----------|------------|
| US-040 | Add favorite_roads table to Convex schema | INFRA | P0 | - |
| US-041 | Create favoriteRoads.ts with insert/list/delete | FEATURE | P0 | US-040 |
| US-042 | Add long-press handler to route polyline for segment selection | FEATURE | P1 | US-040 |
| US-043 | Build "Save as Favorite" action sheet | FEATURE | P1 | US-042 |
| US-044 | Build favorite-road-card.tsx with mini map | DESIGN | P1 | US-041 |
| US-045 | Build Favorite Roads settings section | FEATURE | P1 | US-044 |
| US-046 | Add "Include favorite roads" toggle to plan-ride-sheet | FEATURE | P1 | US-045 |
| US-047 | Pass favorites to planning graph as preferred segments | FEATURE | P2 | US-041 |
| US-048 | Show favorite inclusion indicator on generated routes | FEATURE | P2 | US-047 |
| US-049 | Show "couldn't include" message when favorite too far | FEATURE | P2 | US-047 |
