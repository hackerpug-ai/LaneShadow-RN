# Epic 4: Save & Reuse Favorite Roads

> Epic Sequence: 4
> PRD: .spec/prd/ROADMAP.md
> Tasks: 6 remaining (4 complete, 5 design tasks removed)
> Status: REFINED (2026-04-06) — completed tasks marked, design tasks removed, wiring tasks reduced

## Overview

Users can save road segments as favorites and have them influence route planning. Backend CRUD, UI components, and settings section are **complete**. Remaining work: wire the save flow into the home map, add planning integration toggle, integrate with routing engine, and show visual feedback.

## What's Already Built

| Component | Status | Location |
|-----------|--------|----------|
| Schema (favorite_roads table) | COMPLETE | `convex/schema.ts` |
| CRUD (insert/list/delete) | COMPLETE | `convex/db/favoriteRoads.ts` |
| Long-press gesture handler | COMPLETE (not wired) | `components/map/route-polyline-component.tsx` |
| Save sheet | COMPLETE (not rendered) | `components/ui/save-favorite-sheet.tsx` |
| Card with mini map | COMPLETE | `components/ui/favorite-road-card.tsx` |
| Settings section | COMPLETE | `components/settings/favorite-roads-section.tsx` |

## Human Test Steps

When this epic is complete, users should be able to:

1. Long-press a route segment on the map → save sheet appears
2. Name the favorite and save → appears in Settings
3. View favorites in Settings with mini map previews
4. Enable "Include favorite roads" toggle when planning
5. See indicators showing which favorites influenced the route
6. See feedback when a favorite can't be included

## Task List

| Task ID | Title | Type | Priority | Estimate | Status |
|---------|-------|------|----------|----------|--------|
| US-040 | Add favorite_roads table to Convex schema | INFRA | P0 | - | COMPLETE |
| US-041 | Create favoriteRoads.ts with insert/list/delete | FEATURE | P0 | - | COMPLETE |
| US-042 | ~~Add long-press handler~~ → Wire long-press to home map | FEATURE | P1 | 15 min | **REDUCED** |
| US-043 | ~~Build save sheet~~ → Render SaveFavoriteSheet on home map | FEATURE | P1 | 15 min | **REDUCED** |
| US-044 | Build favorite-road-card.tsx with mini map | DESIGN | P1 | - | COMPLETE |
| US-045 | Build Favorite Roads settings section | FEATURE | P1 | - | COMPLETE |
| US-046 | Add "Include favorite roads" toggle to plan-ride-sheet | FEATURE | P1 | 60 min | TODO |
| US-047 | Pass favorites to planning graph as preferred segments | FEATURE | P2 | 120 min | TODO |
| US-048 | Show favorite inclusion indicator on generated routes | FEATURE | P2 | 90 min | TODO |
| US-049 | Show "couldn't include" message when favorite too far | FEATURE | P2 | 75 min | TODO |

## Removed Tasks

All 5 design tasks (US-042-D, US-043-D, US-044-D, US-045-D, US-048-D) — the components they were meant to spec are already built.

## Dependencies

- **Depends on**: Epic 2 (for saved routes viewing patterns)
- **Blocks**: None

## Execution Order

1. **Wave 1** (30 min): US-042 + US-043 wiring (parallel, independent)
2. **Wave 2** (60 min): US-046 toggle in plan-ride-sheet
3. **Wave 3** (120 min): US-047 planning engine integration
4. **Wave 4** (165 min): US-048 + US-049 visual feedback (parallel after US-047)

**Total remaining**: ~6.5 hours
