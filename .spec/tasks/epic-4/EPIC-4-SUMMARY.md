# Epic 4: Save & Reuse Favorite Roads - Task Inventory

**Epic Sequence**: 4
**Theme**: Users can save road segments as favorites and have them influence route planning
**Status**: Ready for Development
**Total Tasks**: 10
**Total Estimated Effort**: 9XL (approximately 9-12 days)

---

## Human Test Goal

**Save a great road segment and have it influence your next route.**

### What You Can Test

1. Complete a route plan (or view a saved route)
2. Long-press on a road segment on the map
3. Tap **"Save as Favorite"** - enter a name
4. Go to **Settings > Favorite Roads**
5. See your favorite road with name, location, and **mini map preview**
6. Tap to remove - road is deleted from favorites
7. Start a new route plan
8. Enable **"Include favorite roads"** toggle in planning sheet
9. Generate routes
10. See indicator showing **which favorites were included**
11. See message if a favorite couldn't be included (too far from route)

---

## PRD Coverage

- **UC-PERS-01**: Save favorite road segments for reuse
- **UC-PERS-02**: Include favorite roads in route planning

---

## Epic Acceptance Criteria

1. ✅ User can long-press route segment to save as favorite
2. ✅ User can view saved favorites in Settings with mini map previews
3. ✅ User can enable "Include favorite roads" toggle when planning
4. ✅ Generated routes show which favorites influenced the route
5. ✅ User receives feedback when favorite is too far to include

---

## Task Inventory

### Phase 1: Foundation (Backend)

| Task ID | Title | Type | Effort | Dependencies | Status |
|---------|-------|------|--------|--------------|--------|
| **US-040** | Add favorite_roads table to Convex schema | INFRA | S | None | Backlog |
| **US-041** | Create favoriteRoads.ts with insert/list/delete | FEATURE | M | US-040 | Backlog |

**Phase 1 Notes**: Establishes data layer. US-040 creates schema, US-041 provides API. Both can start immediately.

---

### Phase 2: User Interface (Save Flow)

| Task ID | Title | Type | Effort | Dependencies | Status |
|---------|-------|------|--------|--------------|--------|
| **US-042** | Add long-press handler to route polyline for segment selection | FEATURE | L | None | Backlog |
| **US-043** | Build "Save as Favorite" action sheet | FEATURE | M | US-041, US-042 | Backlog |

**Phase 2 Notes**: US-042 enables segment selection, US-043 provides save UI. US-042 can run parallel with Phase 1.

---

### Phase 3: User Interface (View & Manage)

| Task ID | Title | Type | Effort | Dependencies | Status |
|---------|-------|------|--------|--------------|--------|
| **US-044** | Build favorite-road-card.tsx with mini map | FEATURE | M | None | Backlog |
| **US-045** | Build Favorite Roads settings section | FEATURE | M | US-041, US-044 | Backlog |

**Phase 3 Notes**: US-044 creates card component, US-045 builds list view. US-044 can run parallel with Phase 1-2.

---

### Phase 4: Route Planning Integration

| Task ID | Title | Type | Effort | Dependencies | Status |
|---------|-------|------|--------|--------------|--------|
| **US-046** | Add "Include favorite roads" toggle to plan-ride-sheet | FEATURE | S | None | Backlog |
| **US-047** | Pass favorites to planning graph as preferred segments | FEATURE | XL | US-041, US-046 | Backlog |

**Phase 4 Notes**: US-046 adds toggle, US-047 integrates with routing. US-046 can run parallel with Phases 1-3.

---

### Phase 5: Visual Feedback

| Task ID | Title | Type | Effort | Dependencies | Status |
|---------|-------|------|--------|--------------|--------|
| **US-048** | Show favorite inclusion indicator on generated routes | FEATURE | M | US-047 | Backlog |
| **US-049** | Show "couldn't include" message when favorite too far | FEATURE | S | US-047 | Backlog |

**Phase 5 Notes**: US-048 shows included favorites, US-049 shows excluded favorites. Both depend on US-047 but can run parallel.

---

## Dependency Graph

```
Phase 1 (Backend Foundation):
  US-040 (schema)
    ↓
  US-041 (API)
    ↓
  ┌──────────────┬──────────────┐
  ↓              ↓              ↓
Phase 2        Phase 3        Phase 4
(Save Flow)    (View)         (Planning)
US-042         US-044         US-046
  ↓              ↓              ↓
US-043         US-045         US-047
                                ↓
                            ┌───┴───┐
                            ↓       ↓
                          Phase 5 (Feedback)
                          US-048  US-049
```

**Parallel Execution Opportunities**:
- **Wave 1**: US-040, US-042, US-044, US-046 (all can start immediately)
- **Wave 2**: US-041 (after US-040), US-043 (after US-041 + US-042), US-045 (after US-041 + US-044)
- **Wave 3**: US-047 (after US-041 + US-046)
- **Wave 4**: US-048, US-049 (both after US-047, can run parallel)

---

## Technical Specifications

### Schema (US-040)

```typescript
// models/favorite-roads.ts
export const favoriteRoadValidator = v.object({
  ownerType: v.union(v.literal('user'), v.literal('group'), v.literal('org')),
  ownerId: v.string(),
  createdByUserId: v.string(),
  visibility: v.union(v.literal('private'), v.literal('shared'), v.literal('public')),
  name: v.string(),
  geometry: v.object({
    format: v.literal('polyline'),
    encoding: v.string(),
    precision: v.number(),
    value: v.string(),
  }),
  bounds: v.object({
    north: v.number(),
    south: v.number(),
    east: v.number(),
    west: v.number(),
  }),
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

### API (US-041)

- `insert(name, geometry, bounds)` → `{ favoriteRoadId }`
- `listByOwner(limit)` → `{ routes: [{ favoriteRoadId, name, geometry, bounds }] }`
- `deleteById(favoriteRoadId)` → `null`

### Planning Integration (US-047)

```typescript
// planRide action returns
{
  routes: RouteSnapshot[],
  includedFavorites: string[], // IDs of favorites in routes
  excludedFavorites: Array<{ id: string, reason: string }>, // Favorites too far
}
```

### Distance Threshold

- **50km**: Favorites beyond 50km from route corridor are excluded
- Prevents absurd detours while allowing reasonable influence

---

## Design Specifications

### Long-Press Interaction (US-042)

- **Duration**: 500ms (iOS long-press standard)
- **Feedback**: Visual highlight on segment
- **Callback**: Returns geometry, bounds, coordinate

### Save Action Sheet (US-043)

- **Snap point**: 40% height
- **Input**: Text field (name, max 100 chars)
- **Buttons**: Save (primary), Cancel (outline)
- **Validation**: Required, max length

### Favorite Road Card (US-044)

- **Mini map**: 80x80px RouteThumbnail with bounds
- **Content**: Name, delete button (icon)
- **Interaction**: Press for details (future), delete button for removal

### Settings Section (US-045)

- **List**: FlatList, newest first, limit 50
- **Empty state**: "No favorite roads yet", "Save a road segment to see it here"
- **Delete**: Confirmation dialog before removal

### Toggle (US-046)

- **Icon**: Heart (semantic for favorites)
- **Position**: After "Avoid tolls" toggle
- **Disabled state**: When no favorites exist, shows helper text

### Inclusion Indicator (US-048)

- **Badge**: "X favorites included" with heart icon
- **Color**: Primary when count > 0, muted when count = 0
- **Position**: Near existing badges (rain, wind, temp)

### Exclusion Message (US-049)

- **Banner**: "X favorites too far from route" with info icon
- **Variant**: Info (not warning - expected behavior)
- **Position**: Below route options list

---

## Risk Assessment

### Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Route planning latency with favorites | Medium | Filter favorites locally, limit to 50 |
| Polyline segment detection accuracy | Medium | Use distance threshold, not exact coordinate |
| Convex schema migration issues | Low | New table only, no existing tables modified |

### UX Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Users don't understand long-press | Low | Add hint text, consider alternative trigger |
| Favorites cause bad routes | Medium | Favorites are "preferred" not "required" |
| Too many favorites clutter UI | Low | Limit to 50, show newest first |

---

## Quality Gates

### Per-Task Gates

All tasks must pass:
1. ✅ Type check: `pnpm tsc --noEmit`
2. ✅ Lint: `pnpm lint`
3. ✅ Tests: `pnpm test` (one test per AC minimum)
4. ✅ RED phase evidence in Linear comments

### Epic Completion Gates

1. ✅ All 10 tasks complete
2. ✅ Human test goal achievable (end-to-end flow works)
3. ✅ All 5 epic acceptance criteria met
4. ✅ No regression in existing functionality
5. ✅ Code review approved for all tasks

---

## Rollout Strategy

### Phase A: Foundation (Days 1-2)
- US-040: Schema (0.5 day)
- US-041: API (1 day)
- US-042: Long-press (0.5 day) - parallel
- US-044: Card (0.5 day) - parallel
- US-046: Toggle (0.5 day) - parallel

### Phase B: Integration (Days 3-4)
- US-043: Save sheet (1 day)
- US-045: Settings (1 day)
- US-047: Planning integration (2 days)

### Phase C: Feedback (Days 5-6)
- US-048: Inclusion indicator (1 day)
- US-049: Exclusion message (0.5 day)
- Buffer, testing, refinement (0.5 day)

**Total**: 9-12 days depending on parallel execution

---

## Success Metrics

### Functional Metrics
- ✅ Users can save road segments as favorites
- ✅ Favorites influence route planning (observable in generated routes)
- ✅ Users can view and manage favorites in Settings
- ✅ Clear feedback when favorites can't be included

### Quality Metrics
- ✅ Zero regression in existing route planning
- ✅ < 500ms added latency for favorites-enabled planning
- ✅ 100% test coverage for new features (TDD)

### UX Metrics
- ✅ Long-press discoverability > 80% (in user testing)
- ✅ Favorites inclusion visible in all routes
- ✅ Clear feedback for excluded favorites

---

## Open Questions

1. **Long-press discoverability**: Should we add a hint or tooltip for long-press?
   - **Decision**: Add hint text in first-use experience, defer to Phase C

2. **Favorites limit**: Is 50 favorites sufficient?
   - **Decision**: Start with 50, monitor usage, increase if needed

3. **Distance threshold**: Is 50km the right cutoff?
   - **Decision**: Start with 50km, adjust based on user feedback

4. **Multiple favorites**: What if favorites conflict (different directions)?
   - **Decision**: Planning graph resolves conflicts (prioritizes route quality)

---

## Related Epics

- **Epic 2**: Browse & View Saved Routes (reuses patterns: RouteThumbnail, card lists)
- **Epic 3**: Search, Filter & Organize Routes (future: search/filter favorites)

---

## References

- **PRD**: `/Users/justinrich/Projects/LaneShadow/.spec/prd/ROADMAP.md` (Epic 4 section)
- **Task Template**: `/Users/justinrich/Projects/brain/docs/kanban/TASK-TEMPLATE.md` (v4.0)
- **Task Standards**: `/Users/justinrich/Projects/brain/docs/kanban/task-standards.md`
- **TDD Guide**: `/Users/justinrich/Projects/brain/docs/kanban/task-creation-guide.md`

---

**Generated**: 2026-03-28
**Product Manager**: product-manager
**Epic Owner**: product-manager
**Status**: ✅ Ready for development execution

