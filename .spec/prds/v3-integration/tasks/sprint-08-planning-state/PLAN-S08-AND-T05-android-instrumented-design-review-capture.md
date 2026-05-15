# PLAN-S08-AND-T05 — Android instrumented DesignReviewCaptureTest planning-screen variants

> Status: 🟡 In Progress
> Cycle: 1
> Updated: 2026-05-07T19:05:00.000Z

> **Task ID:** PLAN-S08-AND-T05
> **Sprint:** [Sprint 08 — Map View · Planning State](./SPRINT.md)
> **Agent:** kotlin-implementer
> **Estimate:** 180 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** M
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-FID-01, Sprint 08 Map View — Planning State (Map View Redesign 2026-05-06)

## Background

Sprint 08 expands the design-review pipeline to cover the planning state of the canonical map view. The Android twin of PLAN-S08-IOS-T05 must add `planningScreen_*` instrumented test methods to the Android Espresso/Compose-test capture pipeline so each `(planning-screen, state, theme)` tuple captured on a real Android device/emulator can be compared against the regenerated reference set from PLAN-S08-DR-T01.

Current Android infrastructure already includes `AuthScreenSnapshotTest.kt` at `android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/` as the snapshot-test pattern for sandbox stories — this task either evolves that pattern or follows the iOS twin's `DesignReviewCaptureTests` lineage by creating an equivalent Android instrumented capture suite. Story IDs MUST match the iOS twin's IDs (canonical lowercase dot-separated parity per `RULES.md §Cross-Platform Component Parity`) — e.g., `templates.planning-screen.scouting.light`, `templates.planning-screen.drawing.light`, etc., aligned to the canonical naming reconciled by PLAN-S08-DR-T01.

## Critical Constraints

**MUST:**
- Add `planningScreen_*` test methods to a new or evolving instrumented capture test class at `android/app/src/androidTest/java/com/laneshadow/designreview/DesignReviewCaptureTest.kt` (NEW location matching the iOS twin's `LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift`); if the codebase already concentrates capture tests at `android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/PlanningScreenSnapshotTest.kt`, prefer that location and align names to the iOS twin
- Cover every `(planning-screen, state, theme)` tuple from the regenerated reference set (PLAN-S08-DR-T01 outputs); per current naming candidates: scouting / drawing / weather / scoring / slow-planning / cancel-prompt / single-candidate × {light, dark} (canonical naming determined by PLAN-S08-DR-T01)
- Each test drives Espresso/Compose-test rule to mount the corresponding sandbox story, captures a screenshot via the existing `SandboxSnapshotTestBase` (or equivalent capture utility), and writes the file to `android/app/src/androidTest/screenshots/PlanningScreenSnapshotTest/templates.planning-screen.<state>.<theme>.png`
- Story IDs in the sandbox catalog (`Sprint04PlanningStories.kt` evolves or new `Sprint08PlanningStories.kt` added) MUST match the iOS twin's IDs (canonical lowercase dot-separated kebab-case per `RULES.md §Cross-Platform Component Parity`) — e.g., `templates.planning-screen.scouting.light`, `templates.planning-screen.drawing.light`, etc.
- Each captured PNG MUST exist at the canonical path `android/app/src/androidTest/screenshots/PlanningScreenSnapshotTest/templates.planning-screen.<state>.<theme>.png` after `connectedAndroidTest` runs
- Fail-fast: if a story id is missing from the sandbox registry, the test fails with a clear "missing story id" message rather than producing a blank capture

**NEVER:**
- NEVER hand-edit captured PNGs — captures are produced by Espresso/Compose-test rule + `SandboxSnapshotTestBase` only
- NEVER diverge story IDs from the iOS twin — parity is verified by inspection during the gate (PLAN-S08-T11)
- NEVER skip dark-theme captures — the planning-state design has both light and dark variants (e.g., `S04 · Scoring · Dark`)
- NEVER bind the capture suite to live Convex sessionMessages — sandbox stories use `PlanningMockProvider` data so captures are deterministic
- NEVER add test logic that modifies production code or design references — this task is read-only with respect to the production code surface

**STRICTLY:**
- STRICTLY align to the regenerated reference set from PLAN-S08-DR-T01 — story IDs, variant names, theme strings, and PNG filename stems all derive from that task's canonical naming
- STRICTLY reuse the `SandboxSnapshotTestBase` capture utility rather than re-rolling capture infrastructure
- STRICTLY pass `cd android && ./gradlew connectedAndroidTest --tests '*PlanningScreenSnapshotTest*'` exit 0 on a connected emulator before this task is considered done

## Specification

**Objective:** Add instrumented capture tests covering every `(planning-screen, state, theme)` tuple aligned to the regenerated post-PLAN-S08-DR-T01 reference set, with story IDs matching the iOS twin's IDs (canonical lowercase dot-separated parity per `RULES.md §Cross-Platform Component Parity`). Each test mounts the corresponding sandbox story, captures via Espresso/Compose-test rule, and writes a deterministic PNG to the canonical capture directory for downstream reference comparison.

**Success State:** `cd android && ./gradlew connectedAndroidTest --tests '*PlanningScreenSnapshotTest*'` exits 0 on a connected emulator; `android/app/src/androidTest/screenshots/PlanningScreenSnapshotTest/` contains one PNG per variant (≥7 variants × 2 themes ≥ 14 total — final count per PLAN-S08-DR-T01); story IDs match iOS twin parity; all captures align to the regenerated reference set.

## Acceptance Criteria

### AC-1 — All planning-screen capture tests exist with iOS-twin-parity story IDs

**GIVEN** the sandbox registry for planning-screen variants
**WHEN** `cd android && ./gradlew :app:assembleDebugAndroidTest` builds the test APK and the test class is reflected
**THEN** the test class contains `planningScreen_*` test methods (one per variant per theme) whose story-id strings match the iOS twin's IDs exactly per `RULES.md §Cross-Platform Component Parity`; each id follows `templates.planning-screen.<state>.<theme>` lowercase dot-separated kebab-case
**Verify:** `cd android && ./gradlew :app:assembleDebugAndroidTest && grep -E 'templates\.planning-screen\.[a-z\-]+\.(light|dark)' android/app/src/androidTest/java/com/laneshadow/designreview/DesignReviewCaptureTest.kt | wc -l`

### AC-2 — connectedAndroidTest run produces one PNG per variant

**GIVEN** an Android emulator is connected and the sandbox registry exposes all planning-screen stories
**WHEN** `cd android && ./gradlew connectedAndroidTest --tests '*PlanningScreenSnapshotTest*'` runs
**THEN** `android/app/src/androidTest/screenshots/PlanningScreenSnapshotTest/` contains one PNG per `(state, theme)` tuple matching `templates.planning-screen.<state>.<theme>.png`; total file count matches the regenerated reference count from PLAN-S08-DR-T01
**Verify:** `cd android && ./gradlew connectedAndroidTest --tests '*PlanningScreenSnapshotTest*' && ls android/app/src/androidTest/screenshots/PlanningScreenSnapshotTest/templates.planning-screen.*.png | wc -l`

### AC-3 — Each capture renders the canonical post-Sprint-07 composed layout

**GIVEN** a captured PNG for any (state, theme) tuple
**WHEN** the file is inspected visually against the regenerated reference
**THEN** the capture shows `LSContextCapsule(--planning)` above + `LSPhaseIndicator` below in the top-overlay slot of the persistent `LSMapHost`; sketch polyline + breathing head dot present for animation variants; locked `LSChatInput` at bottom; `LSMapControls` workbar at right-edge midline (no legacy floating LSPhaseIndicator-only layout)
**Verify:** `cd android && ./gradlew connectedAndroidTest --tests '*PlanningScreenSnapshotTest*' && ls android/app/src/androidTest/screenshots/PlanningScreenSnapshotTest/templates.planning-screen.scouting.light.png`

### AC-4 — Missing story id fails fast with clear error

**GIVEN** the test attempts to capture a story id that is NOT in the sandbox registry (negative test)
**WHEN** the test runs
**THEN** the test fails with a message containing the missing story id and the registered ids list; capture file is NOT created
**Verify:** `cd android && ./gradlew :app:connectedAndroidTest --tests 'com.laneshadow.designreview.DesignReviewCaptureTest.planningScreen_missing_story_id_fails_fast'`

### AC-5 — Cross-platform parity check: story IDs match iOS twin

**GIVEN** the iOS twin's `LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` `planningScreen_*` capture set
**WHEN** the Android story IDs are extracted from the new test file
**THEN** the set of Android `templates.planning-screen.<state>.<theme>` ids equals the iOS twin's set (intersection/union diff is empty); validates `RULES.md §Cross-Platform Component Parity`
**Verify:** `diff <(grep -oE 'templates\.planning-screen\.[a-z\-]+\.(light|dark)' android/app/src/androidTest/java/com/laneshadow/designreview/DesignReviewCaptureTest.kt | sort -u) <(grep -oE 'templates\.planning-screen\.[a-z\-]+\.(light|dark)' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift | sort -u)`

### AC-6 — Build + lint gates pass on touched files

**GIVEN** the new/modified test file + any sandbox-stories file modifications
**WHEN** `cd android && ./gradlew :app:assembleDebugAndroidTest ktlintCheck` runs
**THEN** both gates exit 0 with no findings on the touched files
**Verify:** `cd android && ./gradlew :app:assembleDebugAndroidTest ktlintCheck`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Test class contains planningScreen_* methods with iOS-twin-parity ids matching `templates.planning-screen.<state>.<theme>` lowercase dot-kebab | AC-1 | `grep -cE 'templates\.planning-screen\.[a-z\-]+\.(light\|dark)' android/app/src/androidTest/java/com/laneshadow/designreview/DesignReviewCaptureTest.kt` | happy_path |
| TC-2 | connectedAndroidTest produces one PNG per variant in canonical capture directory | AC-2 | `cd android && ./gradlew connectedAndroidTest --tests '*PlanningScreenSnapshotTest*'` | happy_path |
| TC-3 | Each capture renders the post-Sprint-07 composed layout (capsule above + indicator below + sketch polyline + locked chat input + map controls workbar) | AC-3 | `ls android/app/src/androidTest/screenshots/PlanningScreenSnapshotTest/templates.planning-screen.scouting.light.png` | happy_path |
| TC-4 | Missing story id fails fast with clear error and no capture file | AC-4 | `cd android && ./gradlew :app:connectedAndroidTest --tests 'com.laneshadow.designreview.DesignReviewCaptureTest.planningScreen_missing_story_id_fails_fast'` | error |
| TC-5 | Cross-platform parity diff: Android ids set equals iOS ids set | AC-5 | `diff <(grep -oE 'templates\.planning-screen\.[a-z\-]+\.(light\|dark)' android/...DesignReviewCaptureTest.kt \| sort -u) <(grep -oE 'templates\.planning-screen\.[a-z\-]+\.(light\|dark)' ios/...DesignReviewCaptureTests.swift \| sort -u)` | edge |
| TC-6 | assembleDebugAndroidTest + ktlintCheck both exit 0 on touched files | AC-6 | `cd android && ./gradlew :app:assembleDebugAndroidTest ktlintCheck` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/AuthScreenSnapshotTest.kt` | all | Reference pattern — instrumented snapshot capture test using `SandboxSnapshotTestBase`; this task evolves the same pattern for planning-screen |
| `android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/SandboxSnapshotTestBase.kt` | all | Base class API: capture rule, screenshot writer, theme switching, story-id resolution |
| `android/app/src/main/java/com/laneshadow/ui/sandbox/stories/Sprint04PlanningStories.kt` | all | Existing planning-screen sandbox stories — assess whether this task evolves them or adds Sprint08PlanningStories.kt |
| `.spec/design/system/refs/planning-screen/` | all (regenerated by PLAN-S08-DR-T01) | Reference set Android captures must align to; canonical variant filenames + naming |
| `.spec/design/system/views/mapapp/planning/README.md` | all | Variant matrix + composes table after PLAN-S08-DR-T01 reconciliation |
| `RULES.md` | §Cross-Platform Component Parity | Canonical id naming spec: lowercase, dot-separated, kebab-case; iOS + Android twin id equality requirement |
| `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-AND-T04-android-design-review-capture.md` | all | Predecessor task for idle-screen Android capture — same pattern, same naming convention |

## Guardrails

**Write-Allowed:**
- `android/app/src/androidTest/java/com/laneshadow/designreview/DesignReviewCaptureTest.kt` (NEW — instrumented capture test class with `planningScreen_*` methods)
- `android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/PlanningScreenSnapshotTest.kt` (NEW — alternate location if codebase prefers sandbox-snapshots concentration; exactly ONE of these two locations is used)
- `android/app/src/main/java/com/laneshadow/ui/sandbox/stories/Sprint04PlanningStories.kt` (MODIFY — add/update planning-screen stories aligned to regenerated reference set with iOS-twin-parity ids)
- `android/app/src/main/java/com/laneshadow/ui/sandbox/stories/Sprint08PlanningStories.kt` (NEW — alternative location for new Sprint 08 planning stories)

**Write-Prohibited:**
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` / `LSMapHost*.kt` — Sprint 06 host, never modify
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSContextCapsule.kt`, `LSPhaseIndicator.kt`, `LSChatInput.kt`, `LSMapControls.kt` — consumed components, never modify
- `android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt` — modified by PLAN-S08-AND-T02; this task only mounts it via sandbox stories
- `android/app/src/main/java/com/laneshadow/ui/planning/**` — owned by PLAN-S08-AND-T01/T02/T04; capture test reads only
- `.spec/design/system/refs/planning-screen/*.png` — owned by PLAN-S08-DR-T01 (regenerated via `pnpm design:references`)
- `ios/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope

## Design

**References:**
- `.spec/design/system/refs/planning-screen/` (regenerated by PLAN-S08-DR-T01)
- `.spec/design/system/views/mapapp/planning/README.md` (variant matrix + canonical naming after PLAN-S08-DR-T01)
- `RULES.md §Cross-Platform Component Parity` (id naming + parity contract)

**Interaction Notes:** Capture tests are non-interactive — each test mounts a sandbox story (deterministic mock data via `PlanningMockProvider`), waits for animations to settle (or captures at a deterministic frame for animated variants), and writes a screenshot. The capture output is read-only evidence consumed by the gate task (PLAN-S08-T11) which feeds it into `pnpm design:review` for comparison against the regenerated reference set. Story IDs are the parity contract — Android and iOS twins MUST share identical id strings so the gate can correlate captures across platforms.

**Pattern:** `android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/AuthScreenSnapshotTest.kt` — instrumented capture test using `SandboxSnapshotTestBase` + theme switching + canonical `templates.<screen>.<state>.<theme>.png` naming.

**Pattern Source:** Sprint 06 IDLE-S06-AND-T04 Android idle capture test + Sprint 07 idle-screen capture refresh. This task is the planning-screen twin of those predecessors.

**Anti-Pattern:** Hand-editing captured PNGs to make them match references; diverging story ids from the iOS twin; skipping dark-theme captures; capturing animated variants at non-deterministic frames; binding to live Convex data instead of `PlanningMockProvider`; capturing without first regenerating the reference set (must wait for PLAN-S08-DR-T01 closure).

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `cd android && ./gradlew :app:assembleDebugAndroidTest && grep -cE 'templates\.planning-screen\.[a-z\-]+\.(light\|dark)' android/app/src/androidTest/java/com/laneshadow/designreview/DesignReviewCaptureTest.kt` |
| AC-2 | `cd android && ./gradlew connectedAndroidTest --tests '*PlanningScreenSnapshotTest*' && ls android/app/src/androidTest/screenshots/PlanningScreenSnapshotTest/templates.planning-screen.*.png \| wc -l` |
| AC-3 | `ls android/app/src/androidTest/screenshots/PlanningScreenSnapshotTest/templates.planning-screen.scouting.light.png` |
| AC-4 | `cd android && ./gradlew :app:connectedAndroidTest --tests 'com.laneshadow.designreview.DesignReviewCaptureTest.planningScreen_missing_story_id_fails_fast'` |
| AC-5 | `diff <(grep -oE 'templates\.planning-screen\.[a-z\-]+\.(light\|dark)' android/app/src/androidTest/java/com/laneshadow/designreview/DesignReviewCaptureTest.kt \| sort -u) <(grep -oE 'templates\.planning-screen\.[a-z\-]+\.(light\|dark)' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift \| sort -u)` |
| AC-6 | `cd android && ./gradlew :app:assembleDebugAndroidTest ktlintCheck` |
| build | `cd android && ./gradlew assembleDebug :app:assembleDebugAndroidTest` |
| lint | `cd android && ./gradlew ktlintCheck` |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Android instrumented test (`androidTest` source set) using `SandboxSnapshotTestBase` + Compose-test rule + theme switching + sandbox-story registration. Pure Android/Kotlin/Espresso-Compose territory matching kotlin-implementer's mandate per `brain/docs/mobile-architecture/android-principles.md` and `testing-strategy.md`. No SwiftUI, no Convex backend.

## Coding Standards

- `brain/docs/mobile-architecture/android-principles.md`
- `brain/docs/mobile-architecture/testing-strategy.md`
- `RULES.md` (LaneShadow §Cross-Platform Component Parity, §Design Review Pipeline — View Snapshot Testing, §Real Device E2E Testing)

## Dependencies

**Depends on:** PLAN-S08-AND-T02 (PlanningScreen composed layout to capture), PLAN-S08-AND-T03 (sketch animation present in animated variants), PLAN-S08-AND-T04 (locked chat input + cancel-confirm in V02 variant), PLAN-S08-DR-T01 (regenerated reference set + canonical variant naming)
**Blocks:**
- PLAN-S08-T11 (sprint gate consumes Android captures + cross-platform parity check)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN test APK builds WHEN test class reflected THEN planningScreen_* methods present with iOS-twin-parity ids matching templates.planning-screen.<state>.<theme> lowercase dot-kebab","verify":"cd android && ./gradlew :app:assembleDebugAndroidTest && grep -E 'templates\\.planning-screen\\.[a-z\\-]+\\.(light|dark)' android/app/src/androidTest/java/com/laneshadow/designreview/DesignReviewCaptureTest.kt | wc -l","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN connected emulator WHEN connectedAndroidTest runs THEN one PNG per (state,theme) tuple in canonical capture directory","verify":"cd android && ./gradlew connectedAndroidTest --tests '*PlanningScreenSnapshotTest*' && ls android/app/src/androidTest/screenshots/PlanningScreenSnapshotTest/templates.planning-screen.*.png | wc -l","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN captured PNG WHEN compared to regenerated reference THEN shows post-Sprint-07 composed layout (capsule above + indicator below + sketch + locked input + workbar)","verify":"ls android/app/src/androidTest/screenshots/PlanningScreenSnapshotTest/templates.planning-screen.scouting.light.png","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN missing story id WHEN capture test runs THEN fails fast with clear error and no capture file written","verify":"cd android && ./gradlew :app:connectedAndroidTest --tests 'com.laneshadow.designreview.DesignReviewCaptureTest.planningScreen_missing_story_id_fails_fast'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN iOS twin capture set WHEN Android ids extracted THEN sets are equal (parity diff empty)","verify":"diff <(grep -oE 'templates\\.planning-screen\\.[a-z\\-]+\\.(light|dark)' android/app/src/androidTest/java/com/laneshadow/designreview/DesignReviewCaptureTest.kt | sort -u) <(grep -oE 'templates\\.planning-screen\\.[a-z\\-]+\\.(light|dark)' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift | sort -u)","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN modified files WHEN assembleDebugAndroidTest + ktlintCheck run THEN both exit 0","verify":"cd android && ./gradlew :app:assembleDebugAndroidTest ktlintCheck","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"planningScreen_* test methods present with iOS-twin parity ids","verify":"grep -cE 'templates\\.planning-screen\\.[a-z\\-]+\\.(light|dark)' android/app/src/androidTest/java/com/laneshadow/designreview/DesignReviewCaptureTest.kt","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"connectedAndroidTest produces one PNG per variant","verify":"cd android && ./gradlew connectedAndroidTest --tests '*PlanningScreenSnapshotTest*'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Captures render post-Sprint-07 composed layout","verify":"ls android/app/src/androidTest/screenshots/PlanningScreenSnapshotTest/templates.planning-screen.scouting.light.png","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Missing story id fails fast with clear error","verify":"cd android && ./gradlew :app:connectedAndroidTest --tests 'com.laneshadow.designreview.DesignReviewCaptureTest.planningScreen_missing_story_id_fails_fast'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Android ids equal iOS ids (parity diff empty)","verify":"diff <(grep -oE 'templates\\.planning-screen\\.[a-z\\-]+\\.(light|dark)' android/app/src/androidTest/java/com/laneshadow/designreview/DesignReviewCaptureTest.kt | sort -u) <(grep -oE 'templates\\.planning-screen\\.[a-z\\-]+\\.(light|dark)' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift | sort -u)","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"assembleDebugAndroidTest + ktlintCheck exit 0","verify":"cd android && ./gradlew :app:assembleDebugAndroidTest ktlintCheck","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"}
  ]
}
-->
