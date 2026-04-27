# REM-03: Document Mapbox snapshot determinism strategy

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** general-purpose
**Estimate:** 30 min
**Type:** DOCS
**Status:** Backlog
**Priority:** P1
**Effort:** S
**Source:** Red-hat review finding #6 (iOS + cross-cutting reviewers)

---

## Background

Screens include Mapbox maps which load external tiles. The snapshot determinism harness disables animations and freezes Date, but cannot fully address tile loading variance. Snapshot tests may produce false-positive diffs from tile rendering differences. This needs to be documented so developers understand what diffs are actionable vs. noise.

## Critical Constraints

**MUST:**
- Add a `## Snapshot Determinism` section to `.spec/prds/v2/11-technical-requirements.md`
- Document the known non-determinism source (Mapbox tile loading)
- Define what diffs are acceptable vs. unacceptable
- Include fallback strategy if Mapbox diffs become noisy

**NEVER:**
- Change snapshot harness code behavior — documentation only
- Disable Mapbox in snapshots — that would defeat the purpose

**STRICTLY:**
- Add a doc comment to `SnapshotPreviewHarness.swift` referencing the section

## Specification

**Objective:** Document the snapshot determinism contract so developers can distinguish real diffs from Mapbox noise.

**Success State:** Technical requirements doc has a determinism section; snapshot harness code references it.

## Acceptance Criteria

### AC-1 — Determinism section in technical requirements
- **GIVEN** `.spec/prds/v2/11-technical-requirements.md`
- **WHEN** a developer searches for `Snapshot Determinism`
- **THEN** they find a section documenting: Mapbox as non-determinism source, mitigation (static camera, tile wait), acceptable variance (< 1% pixel diff in map regions), unacceptable variance (any diff in chrome/overlays), fallback (mock tile source or solid-color style)
- **Verify:** `grep -c "Snapshot Determinism" .spec/prds/v2/11-technical-requirements.md` >= 1
- **TDD State:** N/A

### AC-2 — Harness doc comment references section
- **GIVEN** `ios/LaneShadowTests/Sandbox/SnapshotPreviewHarness.swift`
- **WHEN** a developer reads the file header
- **THEN** they find a comment referencing the determinism section in technical requirements
- **Verify:** `grep -c "Snapshot Determinism\|determinism" ios/LaneShadowTests/Sandbox/SnapshotPreviewHarness.swift` >= 1
- **TDD State:** N/A

## Guardrails

**WRITE-ALLOWED:**
- `.spec/prds/v2/11-technical-requirements.md`
- `ios/LaneShadowTests/Sandbox/SnapshotPreviewHarness.swift` (doc comments only)

**WRITE-PROHIBITED:**
- All Swift/Kotlin source logic
- All snapshot test logic

## Dependencies

**Depends On:** _(none)_

**Blocks:** _(none)_

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Determinism section in technical requirements","verify":"grep"},
{"id":"AC-2","type":"acceptance_criterion","description":"Harness doc comment references section","verify":"grep"}
]}
-->
