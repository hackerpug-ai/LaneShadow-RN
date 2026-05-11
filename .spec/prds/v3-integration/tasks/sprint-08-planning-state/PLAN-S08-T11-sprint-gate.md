# PLAN-S08-T11 — Sprint 08 strict gate (design:review zero high + real-iPhone XCUITest evidence + cancel-confirm walks + design-review skill pass)

> Status: 🟡 In Progress
> Cycle: 1
> Updated: 2026-05-07T19:05:00.000Z

> **Task ID:** PLAN-S08-T11
> **Sprint:** [Sprint 08 — Map View · Planning State](./SPRINT.md)
> **Agent:** qa-engineer
> **Estimate:** 180 min
> **Type:** GATE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** M
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-CHAT-01, UC-CHAT-02, UC-CHAT-04, UC-FID-01, Sprint 08 Map View — Planning State (Map View Redesign 2026-05-06)

## Background

Sprint 08 closes when the planning state of the canonical map view is verified end-to-end on iOS Simulator + Android Emulator + real iPhone, with zero high-severity design-review issues, all cancel-confirm walks recorded, and the project `design-review` skill producing a strict file-level plan with no unresolved P0/P1 findings. This gate orchestrates the full evidence pipeline: re-runs `pnpm design:references --screens planning-screen` (output of PLAN-S08-DR-T01), runs iOS XCUITest captures (output of PLAN-S08-IOS-T05), runs Android instrumented captures (output of PLAN-S08-AND-T05), runs `pnpm design:review --screens planning-screen` end-to-end, runs the project `design-review` skill against the planning-screen scope, captures real-iPhone hardware motion evidence, walks cancel-confirm on both platforms with `routePlans.cancelPlan` mutation logged + return-to-idle observed, and archives every artifact under `gate-evidence/`.

This is the canonical gate for Sprint 08; per `SPRINT.md`, it cannot pass until every Sprint 08 implementer task is closed AND the design-review pipeline returns zero high-severity issues AND the `design-review` skill plan has no unresolved P0/P1 items.

## Critical Constraints

**MUST:**
- Run the project `design-review` skill against `.spec/design/system/views/planning-screen/planning-screen.html` and the iOS/Android planning-state implementation scope; archive the plan to `.spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/design-review-skill-report.md`
- Drive every P0/P1 finding from the `design-review` skill to fixed (dispatch back to implementer) or explicitly documented in `gate-evidence/decisions.md`; unresolved P0/P1 findings BLOCK the gate even if the automated pipeline exits 0
- Re-run `pnpm design:references --screens planning-screen` (idempotent; assumes PLAN-S08-DR-T01 already produced canonical PNGs) and verify the timestamp is fresh; persist as evidence under `gate-evidence/`
- Run iOS XCUITest captures: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_*` exit 0 with one .xcresult attachment per `(state, theme)` tuple; archive `.xcresult` bundle under `gate-evidence/ios-simulator/`
- Run real-iPhone XCUITest captures on a physical device per `docs/REAL_DEVICE_E2E.md` to record motion timing on hardware (sketch loop is 1400ms ± frame, head-dot breathing is 1400ms ease-in-out, phase-step pulse cadence matches sessionMessages updates, cancel-confirm slide-up timing matches design); archive `.xcresult` bundle under `gate-evidence/ios-real-device/`
- Run Android instrumented captures: `cd android && ./gradlew connectedAndroidTest --tests '*PlanningScreenSnapshotTest*'` exit 0; archive captures + parity-diff log under `gate-evidence/android-emulator/`
- Run `pnpm design:review --screens planning-screen` end-to-end and verify `jq '[.issues[] | select(.screen=="planning-screen" and .severity=="high")] | length' .design-review/report.json` returns `0`; archive `report.json` + `report.html` + annotated `comparison.png` under `gate-evidence/`
- Walk cancel-confirm on both platforms: tap suggestion chip → planning state mounts → tap back → V02 cancel-confirm sheet opens → tap Cancel ride → observe `routePlans.cancelPlan` mutation in Convex dashboard or server log → confirm map view returns to idle on the SAME `LSMapHost` instance (no remount); record screen recording or transcript per platform under `gate-evidence/cancel-walk-{ios,android}.{md,mov}`
- Update `.spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md` with absolute paths to `gate-evidence/report.json`, `gate-evidence/report.html`, `gate-evidence/comparison.png`, and the iOS xcresult bundles; flip Sprint 08 SPRINT.md `Status:` to `Done` only after AC-1..AC-6 pass

**NEVER:**
- NEVER soften the gate by lowering severity thresholds or marking high-severity issues `won't fix` without documented entries in `gate-evidence/decisions.md`
- NEVER treat `pnpm design:review` exit 0 as sufficient if the `design-review` skill plan still has open P0/P1 items — the skill is the strict review, the pipeline is the automated check
- NEVER flip Sprint 08 status to Done while any high-severity issue remains; remediation dispatches back to swift-implementer / kotlin-implementer / frontend-designer
- NEVER hand-edit `.design-review/report.json` or `.spec/design/system/refs/planning-screen/*.png` — both are generated artifacts
- NEVER skip the real-iPhone hardware motion capture — per `RULES.md §Real Device E2E Testing` it is the gate evidence for motion behavior; if blocked (no device available), record MANUAL/BLOCKED honestly in `gate-evidence/decisions.md` rather than fabricating
- NEVER write production code from this task; if remediation is needed, dispatch the relevant implementer task and re-run the gate after closure
- NEVER bypass real Convex auth for the cancel-walk evidence — observed `routePlans.cancelPlan` MUST come from a real session, not a mocked one

**STRICTLY:**
- STRICTLY follow the Sprint 06 IDLE-S06-T11 + Sprint 07 CAPS-S07-T09 precedent — archive evidence with timestamps and reviewer initials, re-run pipeline after every remediation cycle, document any `won't fix` calls in `decisions.md`
- STRICTLY use canonical attachment naming `templates.planning-screen.<state>.<theme>` for both iOS and Android captures
- STRICTLY verify cross-platform parity — Android twin (PLAN-S08-AND-T05) ids MUST equal iOS twin (PLAN-S08-IOS-T05) ids (parity diff empty); if Android instrumented capture is BLOCKED, document honestly per `RULES.md §Real Device E2E Testing`
- STRICTLY honor the gate iron rule from global CLAUDE.md — fix errors before declaring done; never leave WIP behind a "pre-existing" rationalization

## Specification

**Objective:** Close Sprint 08 by running the project `design-review` skill as a strict file-level review against the planning-screen scope, re-running the regenerated `planning-screen` references, running iOS Simulator + real-iPhone XCUITest captures + Android instrumented captures, executing `pnpm design:review --screens planning-screen` to zero high-severity, walking cancel-confirm on both platforms with real `routePlans.cancelPlan` mutation logged, archiving every artifact under `gate-evidence/`, and flipping Sprint 08 SPRINT.md `Status:` to `Done`.

**Success State:** `gate-evidence/` contains `design-review-skill-report.md` (no unresolved P0/P1), `report.json` (zero high-severity), `report.html`, side-by-side `comparison.png`, `ios-simulator/*.xcresult`, `ios-real-device/*.xcresult` (or honestly-recorded BLOCKED notice in `decisions.md`), `android-emulator/` captures + parity-diff log, `cancel-walk-ios.md` + `cancel-walk-android.md` + optional `.mov` recordings, `decisions.md` (if any deferrals), `manual-run.md` per Sprint 08 Test Steps; SPRINT.md (Sprint 08) Status flipped to Done with evidence references.

## Acceptance Criteria

### AC-1 — design-review skill report has no unresolved P0/P1 findings

**GIVEN** the redesigned `.spec/design/system/views/planning-screen/planning-screen.html` reference and current iOS/Android planning-state implementation scope
**WHEN** the project `design-review` skill runs
**THEN** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/design-review-skill-report.md` exists, lists all P0/P1 findings, and either has no unresolved P0/P1 findings OR links each explicit deferral to `gate-evidence/decisions.md`
**Verify:** `test -f .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/design-review-skill-report.md && ! rg -n "unresolved.*P[01]|P[01].*unresolved" .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/design-review-skill-report.md`

### AC-2 — design:review report.json shows zero high-severity for planning-screen

**GIVEN** references regenerated via `pnpm design:references --screens planning-screen` AND iOS Simulator captures landed in .xcresult AND Android instrumented captures landed
**WHEN** `pnpm design:review --screens planning-screen` runs end-to-end
**THEN** `.design-review/report.json` parses cleanly; `jq '[.issues[] | select(.screen=="planning-screen" and .severity=="high")] | length' .design-review/report.json` returns `0` across all canonical planning-screen variants
**Verify:** `pnpm design:references --screens planning-screen && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests && pnpm design:review --screens planning-screen && jq '[.issues[] | select(.screen=="planning-screen" and .severity=="high")] | length' .design-review/report.json`

### AC-3 — Real-iPhone XCUITest hardware motion evidence archived (or BLOCKED honestly)

**GIVEN** access to a physical iPhone running the build per `docs/REAL_DEVICE_E2E.md`
**WHEN** the real-device XCUITest capture suite runs
**THEN** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/ios-real-device/` contains ≥1 `.xcresult` bundle showing motion-timing measurements (sketch loop ≈1400ms, head-dot breathing ≈1400ms ease-in-out, phase-step pulse cadence matches sessionMessages updates, cancel-confirm slide-up timing matches design); OR `gate-evidence/decisions.md` records "BLOCKED: no physical device" with timestamp + reviewer initials per `RULES.md §Real Device E2E Testing`
**Verify:** `(ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/ios-real-device/*.xcresult 2>/dev/null) || grep -E 'BLOCKED.*real.?device' .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/decisions.md`

### AC-4 — Android instrumented capture parity passes

**GIVEN** an Android emulator connected and Android instrumented capture suite ready
**WHEN** `cd android && ./gradlew connectedAndroidTest --tests '*PlanningScreenSnapshotTest*'` runs AND parity diff against iOS twin executes
**THEN** Android tests exit 0; captures present under `gate-evidence/android-emulator/`; parity diff (Android ids set vs iOS ids set) is empty per `RULES.md §Cross-Platform Component Parity`; OR `gate-evidence/decisions.md` records BLOCKED honestly
**Verify:** `cd android && ./gradlew connectedAndroidTest --tests '*PlanningScreenSnapshotTest*' && diff <(grep -oE 'templates\.planning-screen\.[a-z\-]+\.(light|dark)' android/app/src/androidTest/java/com/laneshadow/designreview/DesignReviewCaptureTest.kt | sort -u) <(grep -oE 'templates\.planning-screen\.[a-z\-]+\.(light|dark)' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift | sort -u)`

### AC-5 — Cancel-confirm walks recorded on both platforms with routePlans.cancelPlan firing + return-to-idle on same LSMapHost

**GIVEN** the planning composition is live on both iOS Simulator and Android Emulator with real Convex auth
**WHEN** the reviewer taps a suggestion chip → planning mounts → taps back → V02 cancel-confirm sheet opens → taps "Cancel ride"
**THEN** `gate-evidence/cancel-walk-ios.md` and `gate-evidence/cancel-walk-android.md` each record: timestamps, observed `routePlans.cancelPlan` mutation in Convex dashboard or server log (planId logged), confirmation that the map view returned to idle on the SAME `LSMapHost` instance (no remount — verified via internal logging or Compose recomposition counter), session preserved as `archived` if applicable; optional `.mov` screen recordings supplement the transcripts
**Verify:** `test -f .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/cancel-walk-ios.md && test -f .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/cancel-walk-android.md && grep -E 'routePlans\.cancelPlan' .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/cancel-walk-ios.md`

### AC-6 — Evidence artifacts present in gate-evidence/

**GIVEN** the gate run completed and produced report outputs
**WHEN** the orchestrator copies/archives outputs
**THEN** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/` exists and contains: `design-review-skill-report.md`, `report.json`, `report.html`, `comparison.png` (annotated side-by-side, ≥1 file per variant), `ios-simulator/*.xcresult`, `android-emulator/` capture set, `cancel-walk-ios.md`, `cancel-walk-android.md`, `manual-run.md` with timestamped pass/fail per Sprint 08 Test Step
**Verify:** `ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/design-review-skill-report.md && ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/report.json && ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/report.html && ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/comparison.png && ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/ios-simulator/*.xcresult && ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/manual-run.md`

### AC-7 — SPRINT.md cites evidence and flips Status to Done

**GIVEN** AC-1 through AC-6 satisfied
**WHEN** SPRINT.md is updated
**THEN** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md` includes absolute-path links to `gate-evidence/report.json`, `gate-evidence/report.html`, and `gate-evidence/comparison.png`; the SPRINT.md `Status:` line reads `Done`
**Verify:** `grep -E 'gate-evidence/(report\.json|report\.html|comparison\.png)' .spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md && grep -E '^\*\*Status:\*\* Done|^Status: Done' .spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | design-review skill report exists and has no unresolved P0/P1 findings (or each is linked to decisions.md deferral) | AC-1 | `test -f .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/design-review-skill-report.md && ! rg -n "unresolved.*P[01]\|P[01].*unresolved" .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/design-review-skill-report.md` | strict_review |
| TC-2 | pnpm design:review --screens planning-screen produces report.json with high-severity count == 0 | AC-2 | `pnpm design:review --screens planning-screen && jq '[.issues[] \| select(.screen=="planning-screen" and .severity=="high")] \| length' .design-review/report.json` | happy_path |
| TC-3 | Real-iPhone XCUITest evidence archived (xcresult bundle) OR BLOCKED honestly recorded in decisions.md | AC-3 | `(ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/ios-real-device/*.xcresult) \|\| grep -E 'BLOCKED' .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/decisions.md` | edge |
| TC-4 | Android instrumented connectedAndroidTest exits 0 + parity diff vs iOS empty (or BLOCKED honestly recorded) | AC-4 | `cd android && ./gradlew connectedAndroidTest --tests '*PlanningScreenSnapshotTest*' && diff <(...android ids...) <(...ios ids...)` | edge |
| TC-5 | Cancel-confirm walks for iOS + Android transcripts present + routePlans.cancelPlan logged + return-to-idle on same LSMapHost confirmed | AC-5 | `test -f .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/cancel-walk-ios.md && grep -E 'routePlans\.cancelPlan' .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/cancel-walk-ios.md` | happy_path |
| TC-6 | gate-evidence/ contains all required artifacts (skill report, report.json/.html, comparison.png, xcresult, captures, walk transcripts, manual-run.md) | AC-6 | `ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/` | happy_path |
| TC-7 | SPRINT.md Status flipped to Done + evidence paths cited | AC-7 | `grep -E 'gate-evidence/(report\.json\|report\.html\|comparison\.png)' .spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md && grep -E '^\*\*Status:\*\* Done\|^Status: Done' .spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md` | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md` | all | Sprint 08 Human Testing Gate steps 1-10 — strict design review + cancel-confirm walk + real-device motion timing |
| `.spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/CAPS-S07-T09-sprint-gate.md` | all | Predecessor gate — same agent, same evidence pattern, same SPRINT/ROADMAP update flow; this Sprint 08 gate is the post-Sprint-07 successor |
| `/Users/justinrich/.agents/skills/design-review/SKILL.md` | all | Strict skill workflow required before automated gate signoff |
| `docs/REAL_DEVICE_E2E.md` | all | Real-iPhone hardware test harness contract; xcresult bundle conventions; per-platform BLOCKED documentation rules |
| `scripts/design-review/prompts/visual-eval.md` | all | Defines what counts as `high` severity for the planning-screen post-Sprint-07 layout |
| `RULES.md` | §Real Device E2E Testing, §Cross-Platform Component Parity, §Design Review Pipeline — View Snapshot Testing | Hard gating contracts the gate must enforce |
| `.spec/design/system/views/planning-screen/planning-screen.html` | all | The HTML the references regenerate from — confirms what captures must match |
| `.spec/design/system/refs/planning-screen/` | all (regenerated by PLAN-S08-DR-T01) | Reference set used by `pnpm design:review` |

## Guardrails

**Write-Allowed:**
- `.spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/**` (NEW — folder + artifacts: design-review-skill-report.md, report.json/.html, comparison.png, ios-simulator/*.xcresult, ios-real-device/*.xcresult, android-emulator/ captures, cancel-walk-{ios,android}.md, decisions.md, manual-run.md)
- `.spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md` (MODIFY — evidence path references + Status: Done line)
- `HANDOFF.md` (MODIFY — only if needed for Sprint 08 closure pointer; minimum diff)
- `.spec/prds/v3-integration/ROADMAP.md` (MODIFY — Sprint 08 row status update only; minimum diff)

**Write-Prohibited:**
- `ios/**`, `android/**`, `server/**`, `react-native/**`, `tokens/**` — gate task does NOT write production code; remediation dispatches back to implementers
- `.design-review/report.json` — generated artifact, treat as read-only inside this task
- `.spec/design/system/refs/planning-screen/*.png` — generated by `pnpm design:references` (PLAN-S08-DR-T01 ownership)
- Any other sprint folder (sprint-01..07, sprint-09..11) — out of scope
- Any `gate-evidence/` directory of another sprint — out of scope

## Design

**References:**
- `.spec/design/system/views/planning-screen/planning-screen.html` (regenerated by PLAN-S08-DR-T01)
- `.spec/design/system/views/planning-screen/README.md` (canonical variant naming)
- `.spec/design/system/refs/planning-screen/` (reference PNG set)

**Interaction Notes:** Gate is a sequence of review and pipeline runs, NOT a UI-interaction task. Sequence: (1) run the project `design-review` skill and archive the file-level plan; (2) fix or explicitly defer all P0/P1 findings; (3) `pnpm design:references --screens planning-screen` confirms canonical PNG set is fresh; (4) `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests` produces .xcresult attachments for iOS Simulator; (5) real-iPhone XCUITest hardware capture for motion timing; (6) `cd android && ./gradlew connectedAndroidTest` produces Android captures; (7) `pnpm design:review --screens planning-screen` consumes attachments + references and emits report; (8) `jq` verifies high-severity == 0; (9) cancel-confirm walks on both platforms recorded; (10) archive outputs to `gate-evidence/`; (11) update SPRINT.md + ROADMAP.md. Each pipeline run is idempotent — re-running on remediation is the expected path.

**Pattern:** `CAPS-S07-T09-sprint-gate.md` — same gate orchestration pattern; this Sprint 08 gate is the post-Sprint-07 planning-state successor.

**Pattern Source:** Sprint 06 IDLE-S06-T11 + Sprint 07 CAPS-S07-T09 — strict design-review gate orchestration with skill-first review, real-device hardware evidence, cross-platform parity check, and SPRINT.md status flip on evidence-backed pass.

**Anti-Pattern:** Hand-editing `report.json` or PNGs to dodge a high-severity issue; flipping Status: Done while remediation is open; re-implementing capture or molecule logic from this task instead of dispatching back to implementers; deduplicating high-severity entries by hand; treating `pnpm design:review` exit 0 as sufficient if the `design-review` skill plan still has open P0/P1; skipping real-device evidence without BLOCKED documentation; copying subagent rationalizations ("pre-existing", "not from this task") into the gate report — verify independently per global CLAUDE.md.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `test -f .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/design-review-skill-report.md && ! rg -n "unresolved.*P[01]\|P[01].*unresolved" .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/design-review-skill-report.md` |
| AC-2 | `pnpm design:references --screens planning-screen && xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests && pnpm design:review --screens planning-screen && jq '[.issues[] \| select(.screen=="planning-screen" and .severity=="high")] \| length' .design-review/report.json` |
| AC-3 | `(ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/ios-real-device/*.xcresult 2>/dev/null) \|\| grep -E 'BLOCKED.*real.?device' .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/decisions.md` |
| AC-4 | `cd android && ./gradlew connectedAndroidTest --tests '*PlanningScreenSnapshotTest*' && diff <(grep -oE 'templates\.planning-screen\.[a-z\-]+\.(light\|dark)' android/app/src/androidTest/java/com/laneshadow/designreview/DesignReviewCaptureTest.kt \| sort -u) <(grep -oE 'templates\.planning-screen\.[a-z\-]+\.(light\|dark)' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift \| sort -u)` |
| AC-5 | `test -f .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/cancel-walk-ios.md && test -f .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/cancel-walk-android.md && grep -E 'routePlans\.cancelPlan' .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/cancel-walk-ios.md` |
| AC-6 | `ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/design-review-skill-report.md && ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/report.json && ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/report.html && ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/comparison.png && ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/ios-simulator/*.xcresult && ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/manual-run.md` |
| AC-7 | `grep -E 'gate-evidence/(report\.json\|report\.html\|comparison\.png)' .spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md && grep -E '^\*\*Status:\*\* Done\|^Status: Done' .spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md` |
| build | (orchestration-only — no build) |
| lint | (orchestration-only — no lint) |

## Agent Assignment

**Agent:** qa-engineer
**Rationale:** Cross-platform strict design-review gate — orchestrates the project `design-review` skill, `pnpm design:references`, iOS XCUITest captures (via `xcodebuild`) on Simulator + real iPhone, Android instrumented captures (via `connectedAndroidTest`), `pnpm design:review`, cancel-confirm walks with real Convex auth, evidence archival, and SPRINT.md status flips. No production code changes; pure orchestration + verification + judgment. qa-engineer is the canonical owner per Sprint 06 IDLE-S06-T11 + Sprint 07 CAPS-S07-T09 precedent.

## Coding Standards

- `RULES.md` (LaneShadow §Real Device E2E Testing, §Verification Standards, §Cross-Platform Component Parity, §Design Review Pipeline — View Snapshot Testing, §.spec directory structure)
- `brain/docs/mobile-architecture/testing-strategy.md`
- `brain/docs/REQUIREMENT-TRACKING.md` (gate evidence + status invariants)
- `docs/REAL_DEVICE_E2E.md`

## Dependencies

**Depends on:** PLAN-S08-CVX-T01, PLAN-S08-IOS-T01, PLAN-S08-IOS-T02, PLAN-S08-IOS-T03, PLAN-S08-IOS-T04, PLAN-S08-IOS-T05, PLAN-S08-AND-T01, PLAN-S08-AND-T02, PLAN-S08-AND-T03, PLAN-S08-AND-T04, PLAN-S08-AND-T05, PLAN-S08-DR-T01
**Blocks:** Sprint 09 (route-results state inherits closed Sprint 08 gate; Sprint 09 cannot start until planning-state proves the per-state-overlay pattern works)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN redesigned planning-screen reference + iOS/Android implementation scope WHEN project design-review skill runs THEN skill report exists with no unresolved P0/P1 findings (or each linked to decisions.md deferral)","verify":"test -f .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/design-review-skill-report.md && ! rg -n \"unresolved.*P[01]|P[01].*unresolved\" .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/design-review-skill-report.md","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN regenerated refs + iOS Simulator + Android captures WHEN design:review --screens planning-screen runs THEN report.json planning-screen high-severity count == 0","verify":"pnpm design:references --screens planning-screen && xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests && pnpm design:review --screens planning-screen && jq '[.issues[] | select(.screen==\"planning-screen\" and .severity==\"high\")] | length' .design-review/report.json","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN access to physical iPhone WHEN real-device XCUITest runs THEN ios-real-device/*.xcresult archived with motion timing measurements OR decisions.md records BLOCKED honestly","verify":"(ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/ios-real-device/*.xcresult 2>/dev/null) || grep -E 'BLOCKED.*real.?device' .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/decisions.md","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN connected Android emulator WHEN connectedAndroidTest runs + parity diff vs iOS executes THEN exit 0 + parity diff empty (or BLOCKED documented)","verify":"cd android && ./gradlew connectedAndroidTest --tests '*PlanningScreenSnapshotTest*' && diff <(grep -oE 'templates\\.planning-screen\\.[a-z\\-]+\\.(light|dark)' android/app/src/androidTest/java/com/laneshadow/designreview/DesignReviewCaptureTest.kt | sort -u) <(grep -oE 'templates\\.planning-screen\\.[a-z\\-]+\\.(light|dark)' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift | sort -u)","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN real Convex auth on both platforms WHEN cancel-confirm walks performed THEN cancel-walk-{ios,android}.md present + routePlans.cancelPlan logged + return-to-idle on same LSMapHost confirmed","verify":"test -f .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/cancel-walk-ios.md && test -f .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/cancel-walk-android.md && grep -E 'routePlans\\.cancelPlan' .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/cancel-walk-ios.md","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN gate run complete WHEN evidence archived THEN gate-evidence/ contains skill report + report.json/.html + comparison.png + ios-simulator/*.xcresult + android-emulator/ + cancel walk transcripts + manual-run.md","verify":"ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/design-review-skill-report.md && ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/report.json && ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/report.html && ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/comparison.png && ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/ios-simulator/*.xcresult && ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/manual-run.md","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"GIVEN AC-1..AC-6 satisfied WHEN SPRINT.md updated THEN evidence paths cited and Status: Done set","verify":"grep -E 'gate-evidence/(report\\.json|report\\.html|comparison\\.png)' .spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md && grep -E '^\\*\\*Status:\\*\\* Done|^Status: Done' .spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"design-review skill report exists and has no unresolved P0/P1","verify":"test -f .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/design-review-skill-report.md && ! rg -n \"unresolved.*P[01]|P[01].*unresolved\" .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/design-review-skill-report.md","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"design:review --screens planning-screen produces report.json with zero high-severity","verify":"pnpm design:review --screens planning-screen && jq '[.issues[] | select(.screen==\"planning-screen\" and .severity==\"high\")] | length' .design-review/report.json","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Real-iPhone XCUITest evidence archived OR BLOCKED honestly","verify":"(ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/ios-real-device/*.xcresult 2>/dev/null) || grep -E 'BLOCKED' .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/decisions.md","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Android instrumented capture exits 0 + parity diff vs iOS empty","verify":"cd android && ./gradlew connectedAndroidTest --tests '*PlanningScreenSnapshotTest*'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Cancel-confirm walks recorded + cancelPlan mutation logged + return-to-idle confirmed","verify":"test -f .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/cancel-walk-ios.md && grep -E 'routePlans\\.cancelPlan' .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/cancel-walk-ios.md","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"gate-evidence/ contains all required artifacts","verify":"ls .spec/prds/v3-integration/tasks/sprint-08-planning-state/gate-evidence/","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"SPRINT.md cites evidence + Status flipped to Done","verify":"grep -E 'gate-evidence/(report\\.json|report\\.html|comparison\\.png)' .spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md && grep -E '^\\*\\*Status:\\*\\* Done|^Status: Done' .spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"}
  ]
}
-->
