# Epic 3: Search, Filter & Organize Routes

> Epic Sequence: 3
> PRD: .spec/prd/ROADMAP.md
> PRD Version: 1.0.0
> Appetite: 6 weeks
> Tasks: 22 (US-019 through US-040, including 11 remediation tasks from red-hat review)

## Overview

Enable riders to find specific routes quickly and organize their library. Adds search-by-name, date range filtering, route rename, delete with undo, and swipe-to-delete gestures.

## Human Test Steps

When this epic is complete, users should be able to:

1. Go to Saved Routes tab
2. Type in search bar - see routes filtered by name in real-time
3. Tap date filter - select "Last week" - see only recent routes
4. Tap date filter - select "Last month" - see more routes
5. Tap clear filters - see all routes again
6. Open a route detail view
7. Tap rename - enter new name - see updated name on card
8. Tap delete - see confirmation dialog
9. Confirm delete - see undo toast appear
10. Tap undo within 5 seconds - route reappears
11. Delete again and let undo expire - route permanently removed
12. Try swipe-to-delete on a route card from the list

## Acceptance Criteria (from PRD)

- Rider can search routes by name using a search input
- Rider can filter routes by date range (last week, last month, custom)
- Rider can filter routes by start or end location
- System displays filtered results in real-time as filters change
- Rider can clear all filters with a single action
- Rider can rename a saved route from the detail view
- Rider can delete a saved route with confirmation dialog
- System removes deleted routes immediately from the list
- Rider can undo delete within 5 seconds (soft delete)
- Rider can swipe-to-delete from the list view (optional shortcut)

## PRD Sections Covered

- UC-SR-02: Route Search & Filter
- UC-SR-04: Route Management

## Dependencies

This epic depends on:
- Epic 2: Browse & View Saved Routes (complete)

This epic blocks:
- Epic 4, 5, 6, 7, 8

## Task List

| Task ID | Title | Type | Priority | Assignee |
|---------|-------|------|----------|----------|
| US-019 | Add search query to Convex backend with name filtering | FEATURE | P1 | convex-implementer |
| US-020 | Add date range filtering to search query | FEATURE | P1 | convex-implementer |
| US-021 | Add soft-delete mutation with scheduledDelete pattern | FEATURE | P1 | convex-implementer |
| US-022 | Add rename mutation validation (trim, length limits) | FEATURE | P2 | convex-implementer |
| US-023 | Create route-search-bar.tsx with debounced input | FEATURE | P1 | frontend-designer |
| US-024 | Create date-range-picker.tsx (presets + clear) | FEATURE | P1 | frontend-designer |
| US-025 | Build delete confirmation dialog component | FEATURE | P2 | frontend-designer |
| US-026 | Build rename dialog component | FEATURE | P2 | frontend-designer |
| US-027 | Wire search + date filter into saved-routes screen | FEATURE | P1 | ui-developer |
| US-028 | Wire rename and delete flows into route detail screen with undo toast | FEATURE | P1 | ui-developer |
| US-029 | Add swipe-to-delete gesture on route cards | FEATURE | P2 | ui-developer |

### Remediation Tasks (Red-Hat Review 2026-03-27)

| Task ID | Title | Type | Priority | Assignee | Source |
|---------|-------|------|----------|----------|--------|
| US-030 | Fix SavedRouteCard to be fully tappable (not just chevron) | FEATURE | P0 | frontend-designer | H1: PM + RN |
| US-031 | Add soft-delete race condition guards | FEATURE | P0 | convex-implementer | H3: PM + Convex |
| US-032 | Remove/internalize deleteRoute hard-delete mutation | FEATURE | P0 | convex-implementer | H4: PM + Convex |
| US-033 | Add keyboardShouldPersistTaps to saved routes FlatList | FEATURE | P1 | ui-developer | M4: RN |
| US-034 | Fix Error vs ConvexError inconsistency | FEATURE | P1 | convex-implementer | M2: Convex |
| US-035 | Add name validation to saveRoute/insert | FEATURE | P1 | convex-implementer | M8: Convex |
| US-036 | Wire start/end locations into saved route card | FEATURE | P1 | ui-developer | H6: PM |
| US-037 | Migrate SavedRouteCard styles to semantic tokens | FEATURE | P2 | frontend-designer | M5: RN |
| US-038 | Replace onTouchEnd with Pressable in OverlayToggle | FEATURE | P2 | frontend-designer | M3: RN |
| US-039 | Memoize renderRightActions in SwipeableRouteCard | FEATURE | P2 | ui-developer | M11: RN |
| US-040 | Guard RenameRouteDialog against real-time sync reset | FEATURE | P2 | frontend-designer | M10: RN |

## Dependency Graph

```
US-019 (search query) ──────┐
US-020 (date filter query) ──┤
US-023 (search bar UI) ──────┼──► US-027 (wire search+filter into screen)
US-024 (date picker UI) ─────┘

US-021 (soft-delete mutation) ──┐
US-022 (rename validation) ─────┤
US-025 (delete dialog UI) ──────┼──► US-028 (wire rename+delete into detail)
US-026 (rename dialog UI) ──────┘

US-028 (delete wired) ──────────┐
                                └──► US-029 (swipe-to-delete gesture)
```

## Parallel Groups

- **Group A** (no deps - backend): US-019, US-020, US-021, US-022
- **Group B** (no deps - UI components): US-023, US-024, US-025, US-026
- **Group C** (after Group A + B): US-027 (search/filter wiring)
- **Group D** (after US-021, US-022, US-025, US-026): US-028 (rename/delete wiring)
- **Group E** (after US-028): US-029 (swipe gesture)

## Remediation Dependency Graph

```
US-030 (card pressable) ─────────────┐
                                     └──► US-037 (card semantic tokens, after US-030)

US-031 (soft-delete guards) ─────────┐
                                     └──► US-032 (remove hard-delete, after US-031)

US-034 (ConvexError consistency) ────┐
                                     └──► US-035 (saveRoute validation, after US-034)

US-033 (keyboardShouldPersistTaps) ──── no deps
US-036 (wire start/end locations) ───── no deps
US-038 (Pressable in OverlayToggle) ── no deps
US-039 (memoize renderRightActions) ── no deps
US-040 (rename dialog sync guard) ──── no deps
```

## Remediation Parallel Groups

- **Group F** (no deps - P0 immediate): US-030, US-031, US-033, US-036, US-038, US-039, US-040
- **Group G** (after US-031): US-032
- **Group H** (after US-030): US-037
- **Group I** (after US-034): US-035
- **Group J** (no deps - P1): US-034

## Design Notes

- Search is client-side filtering of the existing list query (no new Convex search index needed for MVP)
- Date range filtering adds optional `afterDate`/`beforeDate` args to existing `listByOwner`
- Soft delete uses Convex `ctx.scheduler.runAfter` for delayed permanent deletion
- Undo toast uses `react-native-notifier` (already installed) with 5-second window
- Swipe-to-delete uses `Swipeable` from `react-native-gesture-handler` (already installed)
- Rename/delete dialogs use `react-native-paper` Portal + Dialog (already available)
