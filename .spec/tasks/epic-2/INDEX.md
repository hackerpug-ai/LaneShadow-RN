# Task Index: Epic 2 - Browse & View Saved Routes

> Generated: 2026-03-26
> PRD: .spec/prd/ROADMAP.md
> PRD Version: 1.0.0
> Total Epics: 1
> Total Tasks: 8 (US-011 merged into US-010)
> Estimate: 345 minutes (~5.75 hours)

## Epic Structure

### Epic 2: Browse & View Saved Routes

**Folder:** `epic-2/`

**Human Test:**
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

**Tasks:**

| ID | File | Title | Type | Priority | Deps | Est |
|----|------|-------|------|----------|------|-----|
| US-010 | [US-010](US-010.md) | Replace stub saved-routes.tsx with FlatList and hook wiring | FEATURE | P1 | none | 45m |
| US-011 | - | MERGED INTO US-010 | - | - | - | - |
| US-012 | [US-012](US-012.md) | Add static map thumbnail preview to SavedRouteCard | FEATURE | P2 | none | 40m |
| US-013 | [US-013](US-013.md) | Show route metadata (name, date, locations, distance) on card | FEATURE | P2 | none | 30m |
| US-014 | [US-014](US-014.md) | Build empty state component with planning CTA | FEATURE | P2 | US-010 | 30m |
| US-015 | [US-015](US-015.md) | Build route detail screen with full map view | FEATURE | P1 | US-010 | 90m |
| US-016 | [US-016](US-016.md) | Add overlay toggle to route detail map | FEATURE | P2 | US-015 | 35m |
| US-017 | [US-017](US-017.md) | Build route leg timeline with per-leg weather badges | FEATURE | P2 | US-015 | 50m |
| US-018 | [US-018](US-018.md) | Preserve list scroll position on navigation | FEATURE | P3 | US-010, US-015 | 25m |

## Dependency Graph

```
Group A (no deps - can parallelize):
  US-010 ─── FlatList + hook wiring
  US-012 ─── Thumbnail enhancement
  US-013 ─── Card metadata

Group B (after US-010):
  US-014 ─── Empty state component

Group C (after US-010 → US-015):
  US-015 ─── Route detail screen (largest task)

Group D (after US-015):
  US-016 ─── Overlay toggle on detail
  US-017 ─── Leg timeline with weather

Group E (after US-010 + US-015):
  US-018 ─── Scroll position preservation
```

## Usage

These task files are designed for execution orchestration. Each task file contains:

- Complete task specification following TASK-TEMPLATE.md v5.0
- GIVEN-WHEN-THEN acceptance criteria with verify commands
- WRITE-ALLOWED / WRITE-PROHIBITED guardrails
- Design references and code patterns (all in DESIGN section)
- Agent assignment with rationale

To execute:
```bash
# Run all tasks in dependency order
/kb-run-epic epic-2

# Or manually read tasks
cat .spec/tasks/epic-2/US-010.md
```

## PRD Coverage

100% of PRD acceptance criteria covered (UC-SR-01 + UC-SR-03).

## Design Decisions

1. **Route detail = full-screen push** (`app/(app)/saved-route/[id].tsx`), not bottom sheet
2. **New RouteLegTimeline component** - existing RouteTimeline API is for planning, not detail display
3. **Generic EmptyState component** - reusable across app, not saved-routes-specific
4. **RouteThumbnail gradient fix** - CSS linear-gradient is invalid in RN, replaced with expo-linear-gradient
5. **Annotations as "Highlights"** - scenic rationale text not persisted; use routeSnapshot.annotations for MVP
