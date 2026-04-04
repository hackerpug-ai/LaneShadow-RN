# Epic 4: Save & Reuse Favorite Roads - Updated Task Inventory

**Epic Sequence**: 4
**Theme**: Users can save road segments as favorites and have them influence route planning
**Status**: Ready for Development
**Total Tasks**: 15 (10 Implementation + 5 Design)
**Total Estimated Effort**: 9XL (approximately 9-12 days) + 5 Design Tasks

---

## 🔄 UPDATE: Design Tasks Added

Based on UI Designer assessment, **5 [DESIGN] tasks** have been added to specify interaction patterns and visual designs before implementation begins.

**Design Phase**: Must complete before implementation of dependent features
**Design Effort**: ~2-3 days (can run parallel with initial backend work)

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

## Task Inventory (Updated)

### Phase 0: Design Foundation ⚠️ NEW

| Task ID | Title | Type | Effort | Dependencies | Status |
|---------|-------|------|--------|--------------|--------|
| **US-042-D** | Design Long-Press Interaction Pattern | DESIGN | M | None | Backlog |
| **US-043-D** | Design Save Favorite Action Sheet | DESIGN | S | US-042-D | Backlog |
| **US-044-D** | Design Favorite Road Card | DESIGN | M | None | Backlog |
| **US-045-D** | Design Settings Section Layout | DESIGN | S | US-044-D | Backlog |
| **US-048-D** | Design Favorite Inclusion Indicator | DESIGN | S | None | Backlog |

**Phase 0 Notes**: Design tasks specify visual and interaction patterns. Can run in parallel with Phase 1 (backend). All design specs must be approved before dependent implementation tasks begin.

---

### Phase 1: Foundation (Backend)

| Task ID | Title | Type | Effort | Dependencies | Status |
|---------|-------|------|--------|--------------|--------|
| **US-040** | Add favorite_roads table to Convex schema | INFRA | S | None | Backlog |
| **US-041** | Create favoriteRoads.ts with insert/list/delete | FEATURE | M | US-040 | Backlog |

**Phase 1 Notes**: Establishes data layer. US-040 creates schema, US-041 provides API. Both can start immediately and can run parallel with Phase 0 (design).

---

### Phase 2: User Interface (Save Flow)

| Task ID | Title | Type | Effort | Dependencies | Status |
|---------|-------|------|--------|--------------|--------|
| **US-042** | Add long-press handler to route polyline for segment selection | FEATURE | L | US-042-D | Backlog |
| **US-043** | Build "Save as Favorite" action sheet | FEATURE | M | US-041, US-042, US-043-D | Backlog |

**Phase 2 Notes**: US-042 enables segment selection (requires US-042-D design), US-043 provides save UI (requires US-043-D design).

---

### Phase 3: User Interface (View & Manage)

| Task ID | Title | Type | Effort | Dependencies | Status |
|---------|-------|------|--------|--------------|--------|
| **US-044** | Build favorite-road-card.tsx with mini map | FEATURE | M | US-044-D | Backlog |
| **US-045** | Build Favorite Roads settings section | FEATURE | M | US-041, US-044, US-045-D | Backlog |

**Phase 3 Notes**: US-044 creates card component (requires US-044-D design), US-045 builds list view (requires US-045-D design).

---

### Phase 4: Route Planning Integration

| Task ID | Title | Type | Effort | Dependencies | Status |
|---------|-------|------|--------|--------------|--------|
| **US-046** | Add "Include favorite roads" toggle to plan-ride-sheet | FEATURE | S | None | Backlog |
| **US-047** | Pass favorites to planning graph as preferred segments | FEATURE | XL | US-041, US-046 | Backlog |

**Phase 4 Notes**: US-046 adds toggle, US-047 integrates with routing. US-046 can run parallel with Phase 0-3.

---

### Phase 5: Visual Feedback

| Task ID | Title | Type | Effort | Dependencies | Status |
|---------|-------|------|--------|--------------|--------|
| **US-048** | Show favorite inclusion indicator on generated routes | FEATURE | M | US-047, US-048-D | Backlog |
| **US-049** | Show "couldn't include" message when favorite too far | FEATURE | S | US-047 | Backlog |

**Phase 5 Notes**: US-048 shows included favorites (requires US-048-D design), US-049 shows excluded favorites. Both depend on US-047.

---

## Updated Dependency Graph

```
Phase 0: Design (2-3 days, parallel with backend)
┌───────────────┐     ┌───────────────┐
│ US-042-D      │     │ US-044-D      │
│ (Long-press)  │     │ (Card)        │
└───────┬───────┘     └───────┬───────┘
        │                     │
        ↓                     ↓
┌───────────────┐             │
│ US-043-D      │             │
│ (Save sheet)  │             │
└───────┬───────┘             │
        │                     │
        ↓             ┌───────┴───────┐
        │             │ US-045-D      │
        │             │ (Settings)    │
        │             └───────┬───────┘
        │                     │
┌───────┴───────┐             │
│ US-048-D      │             │
│ (Badge)       │             │
└───────────────┘             │
                              ↓

Phase 1: Backend (1-2 days, parallel with design)
┌───────────────┐
│ US-040        │
│ (Schema)      │
└───────┬───────┘
        ↓
┌───────────────┐
│ US-041        │
│ (API)         │
└───────┬───────┘
        ↓
        └───────────────────┐
                            ↓

Phase 2: Save Flow (1 day, after design + backend)
┌───────────────┐     ┌───────────────┐
│ US-042        │←────┤ US-042-D     │
│ (Long-press)  │     │ (Design)      │
└───────┬───────┘     └───────────────┘
        ↓
┌───────────────┐     ┌───────────────┐
│ US-043        │←────┤ US-043-D     │
│ (Save sheet)  │     │ (Design)      │
└───────────────┘     └───────────────┘

Phase 3: View & Manage (1 day, after design + backend)
┌───────────────┐     ┌───────────────┐
│ US-044        │←────┤ US-044-D     │
│ (Card)        │     │ (Design)      │
└───────┬───────┘     └───────────────┘
        ↓
┌───────────────┐     ┌───────────────┐
│ US-045        │←────┤ US-045-D     │
│ (Settings)    │     │ (Design)      │
└───────────────┘     └───────────────┘

Phase 4: Planning Integration (2-3 days, after backend)
┌───────────────┐
│ US-046        │
│ (Toggle)      │
└───────┬───────┘
        ↓
┌───────────────┐
│ US-047        │
│ (Planning)    │
└───────┬───────┘
        ↓
        ┌───────────────────┐
        ↓                   ↓

Phase 5: Feedback (1 day, after planning + design)
┌───────────────┐     ┌───────────────┐
│ US-048        │←────┤ US-048-D     │
│ (Indicator)   │     │ (Design)      │
└───────────────┘     └───────────────┘

┌───────────────┐
│ US-049        │
│ (Message)     │
└───────────────┘
```

---

## Parallel Execution Opportunities (Updated)

**Wave 1: Foundation (Day 1-2)**
- **Design**: US-042-D, US-044-D, US-048-D (3 designers can work in parallel)
- **Backend**: US-040 (schema)
- **UI**: US-046 (toggle - no design dependency)

**Wave 2: Design Continuation (Day 2-3)**
- **Design**: US-043-D (after US-042-D), US-045-D (after US-044-D)
- **Backend**: US-041 (after US-040)

**Wave 3: Implementation - Save Flow (Day 3-4)**
- **UI**: US-042 (after US-042-D), US-044 (after US-044-D)
- **UI**: US-043 (after US-041 + US-042 + US-043-D)

**Wave 4: Implementation - View Flow (Day 4-5)**
- **UI**: US-045 (after US-041 + US-044 + US-045-D)

**Wave 5: Planning Integration (Day 5-7)**
- **Backend**: US-047 (after US-041 + US-046)

**Wave 6: Feedback (Day 7-8)**
- **UI**: US-048 (after US-047 + US-048-D), US-049 (after US-047)

**Total Timeline**: 7-9 days with optimal parallelization (vs. 9-12 days sequentially)

---

## Design Task Deliverables

Each [DESIGN] task produces:

1. **Specification Document** (`.spec/designs/{feature}.spec.md`)
   - All states, colors, typography, dimensions
   - Interaction patterns and timings
   - Accessibility requirements

2. **HTML Mockup** (`.spec/designs/{feature}.design.html`)
   - Interactive demo of all states
   - Browser-based visualization
   - Can be tested without React Native

3. **State Diagram** (`.spec/designs/{feature}.states.md`)
   - All states with transitions
   - Conditions and triggers
   - Edge cases

4. **Component Specification** (`.spec/designs/{feature}.component.md`)
   - Props, callbacks, events
   - Integration points
   - Validation rules

---

## Risk Assessment (Updated)

### Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Route planning latency with favorites | Medium | Filter favorites locally, limit to 50 |
| Polyline segment detection accuracy | Medium | Use distance threshold, not exact coordinate |
| Convex schema migration issues | Low | New table only, no existing tables modified |

### UX Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Users don't understand long-press | Medium | **Design**: Add hint text, specify alternative trigger |
| Favorites cause bad routes | Medium | Favorites are "preferred" not "required" |
| Too many favorites clutter UI | Low | Limit to 50, show newest first |

### Design Risks ⚠️ NEW

| Risk | Severity | Mitigation |
|------|----------|------------|
| Design specs don't match implementation | Medium | **Design**: HTML mockups validate before coding |
| Design tasks delay implementation | Low | **Design**: Run parallel with backend work |
| Accessibility not considered | Medium | **Design**: Include a11y in all design specs |

---

## Quality Gates (Updated)

### Per-Task Gates

All tasks must pass:
1. ✅ Type check: `pnpm tsc --noEmit`
2. ✅ Lint: `pnpm lint`
3. ✅ Tests: `pnpm test` (one test per AC minimum)
4. ✅ RED phase evidence in Linear comments

### Design Task Gates

All [DESIGN] tasks must pass:
1. ✅ Specification document complete
2. ✅ HTML mockup interactive and working
3. ✅ State diagram covers all states
4. ✅ Accessibility requirements specified
5. ✅ Design review approved

### Epic Completion Gates

1. ✅ All 15 tasks complete (10 implementation + 5 design)
2. ✅ Human test goal achievable (end-to-end flow works)
3. ✅ All 5 epic acceptance criteria met
4. ✅ No regression in existing functionality
5. ✅ Code review approved for all tasks
6. ✅ Design review approved for all design specs

---

## Updated Rollout Strategy

### Phase A: Foundation & Design (Days 1-3)
- **Design (parallel)**:
  - US-042-D: Long-press pattern (Day 1-2)
  - US-044-D: Card design (Day 1-2)
  - US-048-D: Badge design (Day 1)
  - US-043-D: Save sheet (Day 2, after US-042-D)
  - US-045-D: Settings layout (Day 2, after US-044-D)
- **Backend (parallel)**:
  - US-040: Schema (Day 1)
  - US-041: API (Day 2, after US-040)
- **UI (parallel)**:
  - US-046: Toggle (Day 1, no design dependency)

### Phase B: Implementation - Save Flow (Days 3-4)
- US-042: Long-press handler (after US-042-D)
- US-044: Card component (after US-044-D)
- US-043: Save action sheet (after US-041 + US-042 + US-043-D)

### Phase C: Implementation - View Flow (Days 4-5)
- US-045: Settings section (after US-041 + US-044 + US-045-D)

### Phase D: Planning Integration (Days 5-7)
- US-047: Planning graph integration (after US-041 + US-046)

### Phase E: Feedback & Polish (Days 7-9)
- US-048: Inclusion indicator (after US-047 + US-048-D)
- US-049: Exclusion message (after US-047)
- Buffer, testing, refinement

**Total**: 7-9 days with optimal parallelization

---

## Success Metrics (Updated)

### Functional Metrics
- ✅ Users can save road segments as favorites
- ✅ Favorites influence route planning (observable in generated routes)
- ✅ Users can view and manage favorites in Settings
- ✅ Clear feedback when favorites can't be included

### Quality Metrics
- ✅ Zero regression in existing route planning
- ✅ < 500ms added latency for favorites-enabled planning
- ✅ 100% test coverage for new features (TDD)
- ✅ All design specs reviewed and approved

### UX Metrics
- ✅ Long-press discoverability > 80% (in user testing)
- ✅ Favorites inclusion visible in all routes
- ✅ Clear feedback for excluded favorites
- ✅ Design mockups validate before implementation

### Design Metrics ⚠️ NEW
- ✅ All 5 design tasks completed before dependent implementation
- ✅ HTML mockups reviewed and approved
- ✅ Accessibility validated in design phase
- ✅ Design tokens defined for all new patterns

---

## References

- **PRD**: `/Users/justinrich/Projects/LaneShadow/.spec/prd/ROADMAP.md` (Epic 4 section)
- **Task Template**: `/Users/justinrich/Projects/brain/docs/kanban/TASK-TEMPLATE.md` (v4.0)
- **Task Standards**: `/Users/justinrich/Projects/brain/docs/kanban/task-standards.md`
- **TDD Guide**: `/Users/justinrich/Projects/brain/docs/kanban/task-creation-guide.md`

---

**Generated**: 2026-03-28
**Updated**: 2026-03-28 (Added design tasks based on UI Designer assessment)
**Product Manager**: product-manager
**Epic Owner**: product-manager
**Status**: ✅ Ready for development execution (pending design task completion)

