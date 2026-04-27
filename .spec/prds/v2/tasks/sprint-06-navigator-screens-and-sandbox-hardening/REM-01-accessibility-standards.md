# REM-01: Add accessibility requirements to RULES.md

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** general-purpose
**Estimate:** 30 min
**Type:** DOCS
**Status:** Backlog
**Priority:** P0
**Effort:** S
**Source:** Red-hat review finding #3 (all 3 reviewers agreed)

---

## Background

Red-hat review flagged that no formal accessibility requirements exist in RULES.md. Accessibility patterns are present organically (iOS: `accessibilityLabel`/`accessibilityHint` in 20+ files; Android: `contentDescription` in 10+ files) but are not standardized or enforced. Screen templates and sandbox stories have zero accessibility ACs.

## Critical Constraints

**MUST:**
- Add an `## Accessibility Standards` section to `RULES.md`
- Cover both iOS and Android requirements
- Reference existing code patterns as canonical examples
- Include WCAG AA contrast requirements and Dynamic Type / font scaling support

**NEVER:**
- Add accessibility retrofits to existing screen code — this is documentation only
- Create new enforcement tooling — that's REM-02

**STRICTLY:**
- Reference real file paths for canonical patterns (e.g., `ios/LaneShadow/Views/Organisms/AppHeader.swift` for `accessibilityLabel`, `android/app/src/main/java/com/laneshadow/ui/atoms/LSSuggestionChip.kt` for `contentDescription`)

## Specification

**Objective:** Document accessibility requirements so future sprints and reviewers can verify compliance.

**Success State:** RULES.md contains an Accessibility Standards section that both-platform developers can follow; canonical examples are cited with file paths.

## Acceptance Criteria

### AC-1 — Accessibility section added to RULES.md
- **GIVEN** a developer opens `RULES.md`
- **WHEN** they scroll to the Accessibility Standards section
- **THEN** they find requirements for: iOS (`accessibilityLabel`, `accessibilityHint`, accessibility identifiers), Android (`contentDescription`, semantics modifiers, 48dp touch targets), both platforms (WCAG AA contrast, Dynamic Type / font scaling)
- **Verify:** `grep -c "Accessibility Standards" RULES.md` returns >= 1
- **TDD State:** N/A (documentation)

### AC-2 — Canonical examples referenced with file paths
- **GIVEN** the Accessibility Standards section
- **WHEN** a developer reads the iOS subsection
- **THEN** they see references to real files (e.g., `AppHeader.swift` for labels, `LSChatInput.swift` for hints)
- **Verify:** Section contains at least 2 iOS and 2 Android file path references
- **TDD State:** N/A

## Guardrails

**WRITE-ALLOWED:**
- `RULES.md`

**WRITE-PROHIBITED:**
- All Swift/Kotlin source files
- All task spec files

## Dependencies

**Depends On:** _(none)_

**Blocks:** REM-02 (token enforcement), REM-04 (error-state specs)

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Accessibility section added to RULES.md","verify":"grep"},
{"id":"AC-2","type":"acceptance_criterion","description":"Canonical examples referenced with file paths","verify":"manual"}
]}
-->
