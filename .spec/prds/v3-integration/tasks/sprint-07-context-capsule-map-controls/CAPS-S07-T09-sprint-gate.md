# CAPS-S07-T09 — Strict Sprint 07 design-review gate — skill plan + zero high-severity, close IDLE-S06-T11

> **Task ID:** CAPS-S07-T09 · **Sprint:** [Sprint 07](./SPRINT.md) · **Agent:** qa-engineer · **Estimate:** 150 min · **Type:** INFRA · **Status:** Backlog · **Priority:** P0 · **Effort:** M
> **PRD Refs:** UC-FID-01, UC-MAP-01, UC-CHAT-01

## Background

Cross-platform strict design-review gate. Orchestrates the project `design-review` skill, `pnpm design:references`, iOS XCUITest captures (via `xcodebuild`), `pnpm design:review`, evidence archival, and SPRINT.md status flips. Subsumes Sprint 06's IDLE-S06-T11 gate (its evidence requirement is now rolled forward into this task against the post-redesign idle-screen). This task must pass before carried-forward autocomplete gate CAPS-S07-T13 can be treated as testable.

## Critical Constraints

**MUST:**
- Re-render the 2026-05-06 references: `pnpm design:references --screens idle-screen` regenerates every variant PNG in `.spec/design/system/refs/idle-screen/` from updated HTML before any capture/review runs
- Run the project `design-review` skill against `.spec/design/system/views/idle-screen/idle-screen.html` and the iOS/Android idle implementation scope; archive the resulting plan to `gate-evidence/design-review-skill-report.md`
- Drive every P0/P1 finding from the `design-review` skill to fixed or explicitly documented in `gate-evidence/decisions.md`; unresolved P0/P1 findings block the gate even if the automated pipeline exits 0
- Run iOS XCUITest captures against retrofitted Simulator build: `xcodebuild test -only-testing:LaneShadowUITests/DesignReviewCaptureTests` exit 0 with ≥14 idle-screen attachments named `idle-screen.<state>.<theme>`
- Run `pnpm design:review --screens idle-screen` end-to-end and verify high-severity count is 0
- Capture annotated side-by-side comparison PNG (reference vs capture per variant, 7 variants) as gate evidence under `.spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/`
- Update SPRINT.md (Sprint 07) with absolute paths to `gate-evidence/report.json`, `gate-evidence/report.html`, `gate-evidence/comparison.png`, and the iOS xcresult bundle; flip Sprint 07 SPRINT.md `status` to `Done` only after AC-1..3 pass
- Close `IDLE-S06-T11` (Sprint 06 gate task) by updating its status header to `Done` and citing this evidence

**NEVER:**
- Soften the gate by lowering severity thresholds or marking issues `won't fix` without documented entries in `gate-evidence/decisions.md`
- Treat `pnpm design:review` as sufficient if the `design-review` skill report still has open P0/P1 items
- Flip Sprint 07 status to Done while any high-severity issue remains; remediation dispatches back to swift-implementer / kotlin-implementer
- Hand-edit `.design-review/report.json` or `.spec/design/system/refs/idle-screen/*.png` — both are generated artifacts
- Bypass real Clerk auth in the capture run; per RULES.md §Real Device E2E Testing the capture suite is real-auth or it is not evidence
- Write production code from this task; if remediation needed, dispatch the relevant implementer task

**STRICTLY:**
- Follow Sprint 06 IDLE-S06-T11 precedent — archive evidence with timestamps and reviewer initials, re-run pipeline after every remediation cycle, document any `won't fix` calls in `decisions.md`
- Use canonical `idle-screen.<state>.<theme>` attachment naming
- Verify cross-platform parity — if Android twin (CAPS-S07-T08) is incomplete, document BLOCKED for Android per Real Device E2E rules

## Specification

**Objective:** Close Sprint 07 by running the project `design-review` skill as a strict file-level review, re-rendering the 2026-05-06 idle-screen references, running iOS XCUITest captures against the retrofitted build, executing `pnpm design:review --screens idle-screen` to zero high-severity issues, archiving evidence in `gate-evidence/`, and rolling Sprint 06 IDLE-S06-T11 forward to Done.

**Success State:** `gate-evidence/` contains `design-review-skill-report.md`, report.json (zero high), report.html, side-by-side comparison.png, ios-real-device/*.xcresult or simulator capture xcresult, decisions.md (if any), and a manual run-book; SPRINT.md (Sprint 07) status flipped to Done with evidence references; IDLE-S06-T11 closed citing this gate.

## Acceptance Criteria

### AC-1 — design-review skill report has no unresolved P0/P1 findings

**GIVEN** the redesigned idle-screen reference and current iOS/Android implementation scope
**WHEN** the project `design-review` skill runs
**THEN** `.spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/design-review-skill-report.md` exists, lists all P0/P1 findings, and either has no unresolved P0/P1 findings or links each explicit deferral to `gate-evidence/decisions.md`
**Verify:** `test -f .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/design-review-skill-report.md && ! rg -n "unresolved.*P[01]|P[01].*unresolved" .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/design-review-skill-report.md`

### AC-2 — design:review report.json shows zero high-severity

**GIVEN** references regenerated via `pnpm design:references --screens idle-screen` AND captures landed in .xcresult from the retrofitted iOS Simulator build
**WHEN** `pnpm design:review --screens idle-screen` runs end-to-end
**THEN** `.design-review/report.json` parses cleanly; `jq '[.issues[] | select(.screen=="idle-screen" and .severity=="high")] | length' .design-review/report.json` returns `0` across all 7 idle variants
**Verify:** `pnpm design:references --screens idle-screen && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReviewCaptureTests && pnpm design:review --screens idle-screen && jq '[.issues[] | select(.screen=="idle-screen" and .severity=="high")] | length' .design-review/report.json`

### AC-3 — Evidence artifact present in gate-evidence/

**GIVEN** the gate run completed and produced report outputs
**WHEN** the orchestrator copies/archives outputs
**THEN** `.spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/` exists and contains: `design-review-skill-report.md`, `report.json`, `report.html`, `comparison.png` (annotated side-by-side, ≥1 file), `ios-simulator/` (or `ios-real-device/`) folder with ≥1 xcresult bundle, `manual-run.md` with timestamped pass/fail per Sprint 07 Human Test Step
**Verify:** `ls .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/design-review-skill-report.md && ls .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/report.json && ls .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/report.html && ls .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/comparison.png && ls .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/ios-*/*.xcresult && ls .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/manual-run.md`

### AC-4 — SPRINT.md cites evidence and flips status to Done

**GIVEN** AC-1 through AC-3 satisfied
**WHEN** SPRINT.md is updated
**THEN** `.spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/SPRINT.md` includes absolute-path links to `gate-evidence/report.json`, `gate-evidence/report.html`, and `gate-evidence/comparison.png`; the SPRINT.md `Status:` line reads `Done`
**Verify:** `grep -E 'gate-evidence/(report\.json|report\.html|comparison\.png)' .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/SPRINT.md && grep -E '^\*\*Status:\*\* Done|^Status: Done' .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/SPRINT.md`

### AC-5 — IDLE-S06-T11 closed referencing this gate

**GIVEN** AC-1..4 satisfied
**WHEN** the orchestrator updates the Sprint 06 gate task header
**THEN** `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-T11-sprint-gate.md` `Status:` line reads `Done` and the body references `tasks/sprint-07-context-capsule-map-controls/gate-evidence/` as the rolled-forward gate; Sprint 06 SPRINT.md notes a closure pointer to Sprint 07
**Verify:** `grep -E '^> Status: (🟢 )?Done|^Status: Done|^STATUS:.*Done' .spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-T11-sprint-gate.md && grep -E 'sprint-07-context-capsule-map-controls/gate-evidence' .spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-T11-sprint-gate.md`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | design-review skill report exists and has no unresolved P0/P1 findings | AC-1 | strict_review |
| TC-2 | design:references regenerates idle-screen PNGs; xcodebuild capture run exits 0; design:review returns 0 high-severity | AC-2 | happy_path |
| TC-3 | gate-evidence/ folder contains design-review-skill-report.md, report.json, report.html, comparison.png, ios-* xcresult, manual-run.md | AC-3 | happy_path |
| TC-4 | Sprint 07 SPRINT.md cites evidence paths and Status flipped to Done | AC-4 | happy_path |
| TC-5 | IDLE-S06-T11 status updated to Done; references Sprint 07 evidence | AC-5 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `.spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/SPRINT.md` | all | Human Testing Gate steps 1-11 — strict design review plus autocomplete carry-forward |
| `/Users/justinrich/.agents/skills/design-review/SKILL.md` | all | Strict skill workflow required before automated gate signoff |
| `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-T11-sprint-gate.md` | all | Predecessor gate task — same agent, same evidence pattern, same SPRINT/ROADMAP update flow |
| `scripts/design-review/prompts/visual-eval.md` | all | Updated 2026-05-06 — defines what counts as `high` severity for the redesigned idle-screen |
| `.spec/prds/v3-integration/ROADMAP.md` | Sprint 07 section | Sprint 07 row may need a status update if ROADMAP tracking is enabled |
| `.spec/design/system/views/idle-screen/idle-screen.html` | all | The HTML the references regenerate from — confirms what captures must match |

## Guardrails

**Write-Allowed:**
- `.spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/**` (NEW — folder + artifacts)
- `.spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/SPRINT.md` (MODIFY — evidence refs + Status: Done)
- `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-T11-sprint-gate.md` (MODIFY — Status: Done + cross-reference)
- `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md` (MODIFY — closure pointer to Sprint 07 if needed)
- `.spec/prds/v3-integration/ROADMAP.md` (MODIFY — Sprint 07 row status update)
- `.spec/design/system/refs/idle-screen/*.png` (REGENERATE via pnpm design:references)

**Write-Prohibited:**
- `ios/**`, `android/**`, `server/**`, `react-native/**`, `tokens/**` — gate task does not write production code
- `.design-review/report.json` — generated artifact, treat as read-only inside this task
- Any other sprint folder (sprint-01..05, sprint-08..11)

## Design

**Interaction Notes:** Gate is a sequence of review and pipeline runs, NOT a UI-interaction task. Sequence: (1) run the project `design-review` skill and archive the file-level plan; (2) fix or explicitly decide all P0/P1 findings; (3) `pnpm design:references --screens idle-screen` regenerates PNGs; (4) `xcodebuild test -only-testing:LaneShadowUITests/DesignReviewCaptureTests` produces .xcresult attachments; (5) `pnpm design:review --screens idle-screen` consumes attachments + references and emits report; (6) jq verifies high-severity == 0; (7) archive outputs to `gate-evidence/`; (8) update SPRINT.md + IDLE-S06-T11 + ROADMAP.md. Each pipeline run is idempotent — re-running on remediation is the expected path.

**Pattern:** `IDLE-S06-T11-sprint-gate.md` — same gate orchestration pattern; this task is the post-redesign successor

**Anti-Pattern:** Hand-editing report.json or PNGs to dodge a high-severity issue; flipping Status: Done while remediation is open; re-implementing capture or molecule logic from this task instead of dispatching back to swift-implementer/kotlin-implementer; deduplicating high-severity entries by hand

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `test -f .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/design-review-skill-report.md && ! rg -n "unresolved.*P[01]\|P[01].*unresolved" .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/design-review-skill-report.md` |
| AC-2 | `pnpm design:references --screens idle-screen && xcodebuild test -only-testing:LaneShadowUITests/DesignReviewCaptureTests && pnpm design:review --screens idle-screen && jq '[.issues[] \| select(.screen=="idle-screen" and .severity=="high")] \| length' .design-review/report.json` |
| AC-3 | `ls .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/design-review-skill-report.md && ls .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/report.json && ls gate-evidence/comparison.png && ls gate-evidence/manual-run.md` |
| AC-4 | `grep -cE 'gate-evidence/(report\.json\|report\.html\|comparison\.png)' .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/SPRINT.md && grep -E '^\*\*Status:\*\* Done\|^Status: Done' SPRINT.md` |
| AC-5 | `grep -cE 'sprint-07-context-capsule-map-controls/gate-evidence' .spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-T11-sprint-gate.md && grep -E '^> Status: (🟢 )?Done\|^Status: Done\|^STATUS:.*Done' IDLE-S06-T11-sprint-gate.md` |

## Agent Assignment

**Agent:** qa-engineer
**Rationale:** Cross-platform strict design-review gate — orchestrates the project `design-review` skill, `pnpm design:references`, iOS XCUITest captures (via `xcodebuild`), `pnpm design:review`, evidence archival, and SPRINT.md status flips. No production code changes; pure orchestration + verification. qa-engineer is the canonical owner per Sprint 06 IDLE-S06-T11 precedent.

## Coding Standards

- `RULES.md` (LaneShadow §Real Device E2E Testing, §Verification Standards, §.spec directory structure)
- `brain/docs/mobile-architecture/testing-strategy.md`
- `brain/docs/REQUIREMENT-TRACKING.md` (gate evidence + status invariants)

## Dependencies

**Depends on:** CAPS-S07-T01, CAPS-S07-T02, CAPS-S07-T03, CAPS-S07-T04, CAPS-S07-T05, CAPS-S07-T06, CAPS-S07-T07, CAPS-S07-T08
**Blocks:** CAPS-S07-T13 and Sprint 08 (per-state map view sprints inherit closed gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN redesigned idle-screen reference and iOS/Android implementation scope WHEN project design-review skill runs THEN skill report exists with no unresolved P0/P1 findings",
      "verify": "test -f .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/design-review-skill-report.md && ! rg -n \"unresolved.*P[01]|P[01].*unresolved\" .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/design-review-skill-report.md",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN regenerated refs + retrofitted captures WHEN design:review runs THEN report.json idle-screen high-severity count == 0",
      "verify": "pnpm design:references --screens idle-screen && xcodebuild test -only-testing:LaneShadowUITests/DesignReviewCaptureTests && pnpm design:review --screens idle-screen && jq '[.issues[] | select(.screen==\"idle-screen\" and .severity==\"high\")] | length' .design-review/report.json",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN gate run complete WHEN evidence archived THEN gate-evidence/ contains design-review-skill-report.md, report.json, report.html, comparison.png, ios-* xcresult, manual-run.md",
      "verify": "ls .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/design-review-skill-report.md && ls .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/report.json && ls .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/comparison.png",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": null
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN AC-1..AC-3 WHEN SPRINT.md updated THEN evidence paths cited and Status: Done set",
      "verify": "grep -E 'gate-evidence/(report\\.json|report\\.html|comparison\\.png)' .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/SPRINT.md",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": null
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN AC-1..AC-4 WHEN IDLE-S06-T11 updated THEN Status: Done and references sprint-07 gate-evidence",
      "verify": "grep -E 'sprint-07-context-capsule-map-controls/gate-evidence' .spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-T11-sprint-gate.md",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "design-review skill report exists and has no unresolved P0/P1 findings",
      "maps_to_ac": "AC-1",
      "verify": "test -f .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/design-review-skill-report.md && ! rg -n \"unresolved.*P[01]|P[01].*unresolved\" .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/design-review-skill-report.md",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "End-to-end pipeline returns 0 high-severity for idle-screen",
      "maps_to_ac": "AC-2",
      "verify": "pnpm design:review --screens idle-screen && jq '[.issues[] | select(.screen==\"idle-screen\" and .severity==\"high\")] | length' .design-review/report.json",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Evidence artifacts archived in canonical paths including design-review skill report",
      "maps_to_ac": "AC-3",
      "verify": "ls .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/design-review-skill-report.md && ls .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/report.json && ls .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/comparison.png",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Sprint 07 SPRINT.md cites evidence + status Done",
      "maps_to_ac": "AC-4",
      "verify": "grep -cE 'gate-evidence/(report\\.json|report\\.html|comparison\\.png)' .spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/SPRINT.md",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "IDLE-S06-T11 closed citing Sprint 07 evidence",
      "maps_to_ac": "AC-5",
      "verify": "grep -cE 'sprint-07-context-capsule-map-controls/gate-evidence' .spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-T11-sprint-gate.md",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    }
  ]
}
-->
