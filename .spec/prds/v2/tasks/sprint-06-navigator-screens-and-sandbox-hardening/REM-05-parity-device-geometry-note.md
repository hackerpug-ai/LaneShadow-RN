# REM-05: Add device geometry note to parity documentation

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** general-purpose
**Estimate:** 15 min
**Type:** DOCS
**Status:** Backlog
**Priority:** P2
**Effort:** XS
**Source:** Red-hat review finding #7 (iOS + cross-cutting reviewers)

---

## Background

iOS snapshots use iPhone 16 (375x667), Android uses Pixel 5 (393x851) — different aspect ratios and resolutions. The cross-platform parity report compares screenshots from these different device geometries, producing geometric diffs that aren't real platform divergences. Consumers of the parity report need to understand this is expected.

## Critical Constraints

**MUST:**
- Create or update `tokens/sandbox/README.md` with a parity device geometry note
- Explain that device geometry is intentionally different (per-platform standard)
- Define what diffs are actionable (structural: missing elements, wrong order, wrong colors) vs. noise (geometric: spacing/sizing from aspect ratio differences)

**NEVER:**
- Change device profiles — they are correct per-platform
- Change the parity report tooling — this is documentation only

**STRICTLY:**
- Keep it short — a single paragraph or bullet list

## Specification

**Objective:** Parity report consumers understand that device geometry differences are expected and which diffs are actionable.

**Success State:** `tokens/sandbox/README.md` contains a device geometry section explaining the intentional difference and actionable vs. noise diff categories.

## Acceptance Criteria

### AC-1 — README exists with device geometry note
- **GIVEN** `tokens/sandbox/`
- **WHEN** a developer opens `README.md`
- **THEN** they find a section explaining that iOS (iPhone 16) and Android (Pixel 5) have different geometries, geometric diffs are expected noise, and only structural diffs (missing elements, wrong order, wrong colors) are actionable
- **Verify:** `grep -c "device geometry\|Device Geometry\|Pixel 5" tokens/sandbox/README.md` >= 1
- **TDD State:** N/A

## Guardrails

**WRITE-ALLOWED:**
- `tokens/sandbox/README.md` (NEW or EDIT)

**WRITE-PROHIBITED:**
- All Swift/Kotlin source files
- `tokens/sandbox/stories.parity.json`
- `tokens/sandbox/snapshots.parity.json`
- Snapshot tooling scripts

## Dependencies

**Depends On:** _(none)_

**Blocks:** _(none)_

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"README exists with device geometry note","verify":"grep"}
]}
-->
