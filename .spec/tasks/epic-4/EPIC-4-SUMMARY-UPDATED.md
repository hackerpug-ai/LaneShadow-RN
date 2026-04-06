# Epic 4: Save & Reuse Favorite Roads - Refined Task Inventory

**Epic Sequence**: 4
**Theme**: Users can save road segments as favorites and have them influence route planning
**Status**: In Progress (Phase 1-3 complete)
**Remaining Tasks**: 6 (4 complete, 6 remaining)
**Remaining Effort**: ~6.5 hours
**Refined**: 2026-04-06

---

## Completed Work

| Task ID | Title | Commit | Status |
|---------|-------|--------|--------|
| US-040 | Add favorite_roads table to schema | `917bdc35` | COMPLETE |
| US-041 | Create favoriteRoads CRUD | `e708918f` | COMPLETE |
| US-042 | Long-press gesture handler | `d8781dbe` | COMPLETE (component only) |
| US-043 | Save-as-favorite sheet | Built, no commit marker | COMPLETE (component only) |
| US-044 | Favorite road card with mini map | Built | COMPLETE |
| US-045 | Favorite Roads settings section | Built, integrated | COMPLETE |

## Remaining Work

| Task ID | Title | Type | Effort | Dependencies | Status |
|---------|-------|------|--------|--------------|--------|
| US-042 | Wire long-press to home map | WIRING | 15 min | None | TODO |
| US-043 | Render SaveFavoriteSheet on map | WIRING | 15 min | US-042 | TODO |
| US-046 | "Include favorite roads" toggle | FEATURE | 60 min | None | TODO |
| US-047 | Pass favorites to planning graph | FEATURE | 120 min | US-046 | TODO |
| US-048 | Favorite inclusion indicator | FEATURE | 90 min | US-047 | TODO |
| US-049 | "Couldn't include" info message | FEATURE | 75 min | US-047 | TODO |

## Removed Tasks

| Task ID | Title | Reason |
|---------|-------|--------|
| US-042-D | Design long-press interaction | Component already built |
| US-043-D | Design save favorite sheet | Component already built |
| US-044-D | Design favorite road card | Component already built |
| US-045-D | Design settings section layout | Component already built |
| US-048-D | Design favorite inclusion indicator | Unnecessary for simple badge |

## Execution Order

```
Wave 1 (30 min, parallel):
  US-042 (wire long-press) + US-043 (render sheet) + US-046 (toggle)

Wave 2 (120 min):
  US-047 (planning engine integration)

Wave 3 (165 min, parallel):
  US-048 (inclusion badge) + US-049 (exclusion info)
```

**Total remaining**: ~6.5 hours with optimal parallelization
