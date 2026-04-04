# Epic 6: Save Routes & Core Library

> Epic Sequence: 6
> PRD: .spec/prds/v1/06-uc-sr.md
> PRD Version: 1.0.0
> Appetite: 6 weeks
> Tasks: 4 (US-030 through US-033)

## Overview

Complete the save-route lifecycle: save from chat, browse, search, filter, rename, delete. Connects to the new chat-based planning flow so riders can persist and manage their favorite routes.

## Human Test Steps

When this epic is complete, users should be able to:

1. Generate routes — tap Save on route card — verify toast
2. Try saving same route again — verify blocked
3. Navigate to Saved Routes tab — verify saved route at top
4. Search by name — verify real-time filtering
5. Apply date filter — verify list filters
6. Clear filters — verify full list
7. Tap route — open detail — tap Rename — change name — verify
8. Tap Delete — confirm — verify removed

## Acceptance Criteria (from PRD)

- Rider can save a route from the chat route card
- Duplicate save is prevented with clear feedback
- Saved routes list shows newest first with pagination
- Rider can search saved routes by name in real time
- Rider can filter saved routes by date range
- Rider can clear all filters to see full list
- Rider can rename a saved route inline
- Rider can delete a saved route with confirmation dialog
- Deleted routes are soft-deleted (recoverable)
- Rename updates are reflected across list and detail views

## PRD Sections Covered

- UC-SR-01: Save Route
- UC-SR-02: Browse Saved Routes
- UC-SR-03: Search & Filter
- UC-SR-04: Rename & Delete

## Dependencies

This epic depends on:
- Epic 1: Phase 0 Remediation (complete)
- Epic 2: Chat Infrastructure (complete)

This epic blocks:
- Epic 7
- Epic 8

## Task List

| Task ID | Title | Type | Priority | Assignee |
|---------|-------|------|----------|----------|
| US-030 | Implement savedRoutes Convex endpoints | FEATURE | P0 | convex-implementer |
| US-031 | Add Save Route action to RouteAttachmentCard | FEATURE | P0 | ui-developer |
| US-032 | Connect saved routes list to new backend | FEATURE | P0 | ui-developer |
| US-033 | Wire rename and delete in route detail view | FEATURE | P0 | ui-developer |

## Dependency Graph

```
US-030 (endpoints) ──┬──► US-031 (save action)
                     ├──► US-032 (list wiring)
                     └──► US-033 (rename/delete)
```

## Parallel Groups

- **Group A** (no deps): US-030
- **Group B** (after US-030): US-031, US-032, US-033 (all parallel)

## Design Notes

- Save captures a snapshot of the route at save time, including weather data
- Soft delete uses deletedAt timestamp — queries exclude deleted routes by default
- Duplicate prevention checks by routePlanId + optionIndex
- Search is client-side text matching on route name (not full-text search)
- Pagination uses Convex cursor-based pagination
