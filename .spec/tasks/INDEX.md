# Task Index: LaneShadow

> Deprecated: `.spec/tasks/` is legacy storage only. Active task execution now lives in each PRD folder at `.spec/prd/{feature-name}/tasks/`.

> Generated: 2026-04-02
> PRD: .spec/prd/ROADMAP.md
> Total Epics: 3 active (Epic 4 complete, Epics 5-6 ready)
> Total Tasks: 22

## Epic Status

| Epic | Title | Status | Tasks |
|------|-------|--------|-------|
| Epic 1 | Complete Weather Planning Experience | ✅ Complete | 9 |
| Epic 2 | Browse & View Saved Routes | ✅ Complete | 9 |
| Epic 3 | Search, Filter & Organize Routes | ✅ Complete | 22 |
| Epic 4 | Save & Reuse Favorite Roads | ✅ Complete | 10 |
| **Epic 5** | **Scenic Routing Rearchitecture** | **🚀 Ready** | **5** |
| **Epic 6** | **Agent Thinking Transparency** | **🚀 Ready** | **7** |
| Epic 7 | Mark Areas to Avoid | 📋 Planned | 9 |
| Epic 8 | Elevation Profile Visualization | 📋 Planned | 8 |
| Epic 9 | Rate Routes & Add Notes | 📋 Planned | 10 |
| Epic 10 | Track Ride History | 📋 Planned | 8 |

---

## Epic 4: Save & Reuse Favorite Roads

**Status**: ✅ Complete
**Folder:** `epic-4-save-reuse-favorite-roads/`

- [US-040](epic-4-save-reuse-favorite-roads/US-040.md): Add favorite_roads table to Convex schema ✅
- [US-041](epic-4-save-reuse-favorite-roads/US-041.md): Create favoriteRoads.ts with insert/list/delete ✅
- [US-042](epic-4-save-reuse-favorite-roads/US-042.md): Add long-press handler to route polyline ✅
- [US-043](epic-4-save-reuse-favorite-roads/US-043.md): Build "Save as Favorite" action sheet ✅
- [US-044](epic-4-save-reuse-favorite-roads/US-044.md): Build favorite-road-card.tsx with mini map ✅
- [US-045](epic-4-save-reuse-favorite-roads/US-045.md): Build Favorite Roads settings section ✅
- [US-046](epic-4-save-reuse-favorite-roads/US-046.md): Add "Include favorite roads" toggle ✅
- [US-047](epic-4-save-reuse-favorite-roads/US-047.md): Pass favorites to planning graph ✅
- [US-048](epic-4-save-reuse-favorite-roads/US-048.md): Show favorite inclusion indicator ✅
- [US-049](epic-4-save-reuse-favorite-roads/US-049.md): Show "couldn't include" message ✅

---

## Epic 5: Scenic Routing Rearchitecture

**Status**: 🚀 Ready to Execute
**Folder:** `epic-5/`

**Human Test:**
1. Plan a route — generation completes in under 15 seconds
2. Route labels and rationale reference real named landmarks (not invented road names)
3. 2–3 distinct route options are shown with different scenic waypoints
4. `pnpm test` passes with no agent session mocks

**Tasks:**
- [US-050](epic-5/US-050.md): Add Overpass API scenic waypoint discovery tool
- [US-051](epic-5/US-051.md): Refactor planRide to deterministic orchestrator
- [US-052](epic-5/US-052.md): Add lightweight route enrichment LLM call
- [US-053](epic-5/US-053.md): Enhance routing provider with motorcycle options
- [US-054](epic-5/US-054.md): Update test suite for deterministic pipeline

**Dependency order:**
```
US-050, US-053 (parallel, no deps)
  └── US-051
        └── US-052
        └── US-054
```

---

## Epic 6: Agent Thinking Transparency

**Status**: 🚀 Ready to Execute
**Folder:** `epic-6-thinking-transparency/`

- [US-055](epic-6-thinking-transparency/US-055.md): Add thinking_card kind + thinkingSteps validators — `convex-implementer`
- [US-056](epic-6-thinking-transparency/US-056.md): Add thinking card lifecycle mutations — `convex-implementer`
- [US-057](epic-6-thinking-transparency/US-057.md): Wire tool transparency into agent callbacks — `pi-implementer`
- [US-058](epic-6-thinking-transparency/US-058.md): Build ThinkingCard component (chip + bottom sheet) — `frontend-designer`
- [US-059](epic-6-thinking-transparency/US-059.md): Register thinking_card + chat screen passthrough — `frontend-designer`
- [US-060](epic-6-thinking-transparency/US-060.md): Build RouteMiniMap component — `frontend-designer`
- [US-061](epic-6-thinking-transparency/US-061.md): Integrate mini-map into route attachment cards — `frontend-designer`

**Dependency order:**
```
US-055 (data model) ──┬── US-056 ── US-057
                      └── US-058 ── US-059

US-060 (independent) ── US-061
```

---

## Usage

To execute Epic 5:
```bash
/kb-run-epic epic-5
```

Tasks dispatch to `backend-engineer` agent in dependency order.
Each task verified by `convex-reviewer` before marking done.
