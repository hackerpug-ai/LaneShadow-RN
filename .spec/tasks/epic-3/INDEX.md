# Task Index: Epic 3 - Search, Filter & Organize Routes

> Generated: 2026-03-26
> PRD: .spec/prd/ROADMAP.md
> PRD Version: 1.0.0
> Total Epics: 1
> Total Tasks: 22 (US-019 through US-040, incl. 11 remediation)
> Estimate: 785 minutes (~13.1 hours)

## Epic Structure

### Epic 3: Search, Filter & Organize Routes

**Folder:** `epic-3/`

**Human Test:**
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

**Tasks:**

| ID | File | Title | Type | Priority | Assignee | Deps | Est |
|----|------|-------|------|----------|----------|------|-----|
| US-019 | [US-019](US-019.md) | Add search query to Convex backend with name filtering | FEATURE | P1 | convex-implementer | none | 45m |
| US-020 | [US-020](US-020.md) | Add date range filtering to search query | FEATURE | P1 | convex-implementer | US-019 | 45m |
| US-021 | [US-021](US-021.md) | Add soft-delete mutation with scheduledDelete pattern | FEATURE | P1 | convex-implementer | none | 60m |
| US-022 | [US-022](US-022.md) | Add rename mutation validation (trim, length limits) | FEATURE | P2 | convex-implementer | none | 30m |
| US-023 | [US-023](US-023.md) | Create route-search-bar.tsx with debounced input | FEATURE | P1 | frontend-designer | none | 45m |
| US-024 | [US-024](US-024.md) | Create date-range-picker.tsx (presets + clear) | FEATURE | P1 | frontend-designer | none | 50m |
| US-025 | [US-025](US-025.md) | Build delete confirmation dialog component | FEATURE | P2 | frontend-designer | none | 35m |
| US-026 | [US-026](US-026.md) | Build rename dialog component | FEATURE | P2 | frontend-designer | none | 40m |
| US-027 | [US-027](US-027.md) | Wire search + date filter into saved-routes screen | FEATURE | P1 | ui-developer | US-019, US-020, US-023, US-024 | 60m |
| US-028 | [US-028](US-028.md) | Wire rename and delete flows into route detail screen with undo toast | FEATURE | P1 | ui-developer | US-021, US-022, US-025, US-026 | 75m |
| US-029 | [US-029](US-029.md) | Add swipe-to-delete gesture on route cards | FEATURE | P2 | ui-developer | US-028 | 50m |

### Remediation Tasks (Red-Hat Review 2026-03-27)

| ID | File | Title | Type | Priority | Assignee | Deps | Est |
|----|------|-------|------|----------|----------|------|-----|
| US-030 | [US-030](US-030.md) | Fix SavedRouteCard to be fully tappable | FEATURE | P0 | frontend-designer | none | 30m |
| US-031 | [US-031](US-031.md) | Add soft-delete race condition guards | FEATURE | P0 | convex-implementer | none | 30m |
| US-032 | [US-032](US-032.md) | Remove/internalize deleteRoute hard-delete mutation | FEATURE | P0 | convex-implementer | US-031 | 30m |
| US-033 | [US-033](US-033.md) | Add keyboardShouldPersistTaps to FlatList | FEATURE | P1 | ui-developer | none | 15m |
| US-034 | [US-034](US-034.md) | Fix Error vs ConvexError inconsistency | FEATURE | P1 | convex-implementer | none | 20m |
| US-035 | [US-035](US-035.md) | Add name validation to saveRoute/insert | FEATURE | P1 | convex-implementer | US-034 | 20m |
| US-036 | [US-036](US-036.md) | Wire start/end locations into card | FEATURE | P1 | ui-developer | none | 45m |
| US-037 | [US-037](US-037.md) | Migrate SavedRouteCard styles to semantic tokens | FEATURE | P2 | frontend-designer | US-030 | 30m |
| US-038 | [US-038](US-038.md) | Replace onTouchEnd with Pressable in OverlayToggle | FEATURE | P2 | frontend-designer | none | 30m |
| US-039 | [US-039](US-039.md) | Memoize renderRightActions in SwipeableRouteCard | FEATURE | P2 | ui-developer | none | 15m |
| US-040 | [US-040](US-040.md) | Guard RenameRouteDialog against sync reset | FEATURE | P2 | frontend-designer | none | 20m |

## Dependency Graph

```
Group A (no deps - backend, can parallelize):
  US-019 ─── Search query with name filtering
  US-021 ─── Soft-delete mutation
  US-022 ─── Rename validation

Group A' (after US-019):
  US-020 ─── Date range filtering (extends US-019)

Group B (no deps - UI components, can parallelize):
  US-023 ─── Search bar component
  US-024 ─── Date range picker component
  US-025 ─── Delete confirmation dialog
  US-026 ─── Rename dialog

Group C (after US-019 + US-020 + US-023 + US-024):
  US-027 ─── Wire search/filter into saved-routes screen

Group D (after US-021 + US-022 + US-025 + US-026):
  US-028 ─── Wire rename/delete into detail screen

Group E (after US-028):
  US-029 ─── Swipe-to-delete gesture
```

## Agent Assignments

| Agent | Tasks | Rationale |
|-------|-------|-----------|
| convex-implementer | US-019, US-020, US-021, US-022, US-031, US-032, US-034, US-035 | Backend query extensions, mutation patterns, and remediation |
| frontend-designer | US-023, US-024, US-025, US-026, US-030, US-037, US-038, US-040 | UI components, accessibility, and theme compliance |
| ui-developer | US-027, US-028, US-029, US-033, US-036, US-039 | Screen integration, wiring, and UX fixes |

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
/kb-run-epic epic-3

# Or manually read tasks
cat .spec/tasks/epic-3/US-019.md
```

## PRD Coverage

~95% of PRD acceptance criteria covered:
- UC-SR-02 (Route Search & Filter): US-019, US-020, US-023, US-024, US-027
- UC-SR-04 (Route Management): US-021, US-022, US-025, US-026, US-028, US-029
- **GAP**: UC-SR-02 "filter by start or end location" -- NOT implemented (red-hat H5, needs PRD decision)

## Human Test Step Coverage

| Test Step | Covering Tasks |
|-----------|---------------|
| 1. Go to Saved Routes tab | Existing (Epic 2) |
| 2. Type in search bar | US-023, US-027 |
| 3. Tap date filter - "Last week" | US-024, US-020, US-027 |
| 4. Tap date filter - "Last month" | US-024, US-020, US-027 |
| 5. Tap clear filters | US-027 |
| 6. Open a route detail view | Existing (Epic 2) |
| 7. Tap rename | US-022, US-026, US-028 |
| 8. Tap delete - see confirmation | US-025, US-028 |
| 9. Confirm delete - undo toast | US-021, US-028 |
| 10. Tap undo - route reappears | US-021, US-028 |
| 11. Delete + let undo expire | US-021, US-028 |
| 12. Swipe-to-delete | US-029 |
