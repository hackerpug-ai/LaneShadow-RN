# REM-04: Add error-state notes to screen task specs

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** general-purpose
**Estimate:** 30 min
**Type:** DOCS
**Status:** Backlog
**Priority:** P2
**Effort:** S
**Source:** Red-hat review finding #10 (kotlin-reviewer + cross-cutting reviewers)

---

## Background

Screen task specs have happy-path ACs only. No documentation for what happens on map init failure, malformed fixtures, or animation failure. This is a documentation gap for future implementation phases (V3 will add live data, networking, and real device location). Documenting these error states now prevents them from being forgotten.

## Critical Constraints

**MUST:**
- Add an `## Error States (V3 Deferred)` section to each screen task spec file
- Cover: map init failure, malformed fixture data, animation failure
- Note these are NOT implemented in Sprint 6 but documented for V3 planning

**NEVER:**
- Implement error handling — documentation only
- Change existing ACs or acceptance criteria

**STRICTLY:**
- Use consistent format across all 12 screen task files
- Reference the error pattern from UC-SCR-06 (`LSInlineErrorCallout`) as the canonical recovery UI

## Specification

**Objective:** Document error-state expectations for V3 planning.

**Success State:** Each screen task spec has an error-states section noting V3 deferral.

## Acceptance Criteria

### AC-1 — All 12 screen specs have error-state sections
- **GIVEN** the sprint task directory
- **WHEN** a developer runs `grep -l "V3 Deferred" UC-SCR-0*-*.md`
- **THEN** 12 files match (UC-SCR-01 through UC-SCR-06, both ios and android)
- **Verify:** `grep -rl "V3 Deferred" .spec/prds/v2/tasks/sprint-06-navigator-screens-and-sandbox-hardening/UC-SCR-*.md | wc -l` returns 12
- **TDD State:** N/A

### AC-2 — Error-state content is consistent
- **GIVEN** any screen task spec with the error-state section
- **WHEN** a developer reads it
- **THEN** it covers: map init failure (show `LSInlineErrorCallout`), malformed fixtures (sandbox: empty state + console warning), animation failure (graceful degradation to static render), with a note that these are V3 deferred
- **Verify:** Manual spot-check of 3 files
- **TDD State:** N/A

## Files to Modify

- `UC-SCR-01-ios-idle-screen.md`
- `UC-SCR-01-android-idle-screen.md`
- `UC-SCR-02-ios-planning-screen.md`
- `UC-SCR-02-android-planning-screen.md`
- `UC-SCR-03-ios-route-results-screen.md`
- `UC-SCR-03-android-route-results-screen.md`
- `UC-SCR-04-ios-route-details-screen.md`
- `UC-SCR-04-android-route-details-screen.md`
- `UC-SCR-05-ios-sessions-screen.md`
- `UC-SCR-05-android-sessions-screen.md`
- `UC-SCR-06-ios-error-screen.md`
- `UC-SCR-06-android-error-screen.md`

## Guardrails

**WRITE-ALLOWED:**
- All 12 screen task spec files listed above (append section only)

**WRITE-PROHIBITED:**
- All Swift/Kotlin source files
- SPRINT.md (separate update)
- Any non-screen task spec files

## Dependencies

**Depends On:** REM-01 (accessibility standards establishes pattern for adding spec sections)

**Blocks:** _(none)_

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"All 12 screen specs have error-state sections","verify":"grep count"},
{"id":"AC-2","type":"acceptance_criterion","description":"Error-state content is consistent","verify":"manual spot-check"}
]}
-->
