# Epic 4: Discovery UI & Data Flywheel

**Sequence**: 4
**Status**: Backlog

## Overview
Compose all design components and data hooks into the full discovery experience: map-based route browsing, archetype/state filters, route details, "show on map" route geometry, intent search UI, and feedback actions (save/hide/rate).

## Human Test Steps
1. Open discovery screen, see route pins on map centered on location
2. Filter by archetype "twisties" — only twisties routes show
3. Filter by state "Colorado" — map centers on CO, shows CO routes
4. Tap a route pin — bottom sheet shows name, score, highlights, attributes
5. Tap "Show on map" — copper polyline renders on map
6. Tap "Save route" — bookmark fills, toast confirms
7. Tap "Hide route" — confirmation appears, pin removed on confirm
8. Open intent search, type "twisty mountain roads" — results render with summary
9. Turn off network, search uncached intent — "Connect to search" with recent chips
10. Catalog browse (filters, sort) still works fully offline

## PRD Sections Covered
- S2.4 (Phase 4: Discovery UI)
- S2.5 (Phase 5: Data Flywheel Foundation)
- S3-DISC (Route Discovery — all 7 use cases)
- S3-FLY (Data Flywheel — UC-FLY-01)
- S4-UC-DISC-01 through UC-DISC-06
- S5-UC-FLY-01
- S8 (UI Infrastructure)

## Dependencies
- **Depends on**: Epic 1, Epic 2, Epic 3

## Task List

| ID | Title | Agent | Priority | Effort | Est (min) | Depends On |
|----|-------|-------|----------|--------|-----------|------------|
| CUR-012 | Discovery UI: RouteDiscoveryScreen with map, filters, route cards | react-native-ui-implementer | P0 | M | 180 | CUR-009, CUR-010, DESIGN-001 |
| DESIGN-003 | CuratedRouteDetailsSheet bottom sheet | frontend-designer | P0 | M | 120 | DESIGN-001 |
| DESIGN-004 | ArchetypeFilter horizontal scrollable chips | frontend-designer | P1 | S | 60 | DESIGN-001 |
| DESIGN-006 | StateFilter state/region selector | frontend-designer | P1 | M | 90 | DESIGN-001 |
| DESIGN-007 | Discovery empty/loading state overlays | frontend-designer | P1 | S | 60 | DESIGN-001 |
| CUR-013 | Discovery UI: intent search bar + offline empty state | react-native-ui-implementer | P1 | S | 120 | CUR-010, CUR-012 |
| CUR-014 | Discovery UI: show route on map + save/hide feedback | react-native-ui-implementer | P1 | S | 90 | CONVEX-005, CUR-012 |
| DESIGN-008 | Route feedback actions: save, hide, rate patterns | frontend-designer | P2 | S | 60 | DESIGN-003 |

## Wall-clock Estimate
~3-4 days (many tasks can run in parallel)

## Definition of Done
- [ ] RouteDiscoveryScreen renders with map and pins
- [ ] Archetype filter chips update visible routes
- [ ] State filter centers map and filters routes
- [ ] Route details sheet shows all lean fields
- [ ] "Show on map" renders copper polyline
- [ ] Save/hide actions record feedback to Convex
- [ ] Intent search returns results with summary
- [ ] Offline intent search shows "Connect to search" with chips
- [ ] Catalog browse works fully offline
- [ ] All component tests pass
