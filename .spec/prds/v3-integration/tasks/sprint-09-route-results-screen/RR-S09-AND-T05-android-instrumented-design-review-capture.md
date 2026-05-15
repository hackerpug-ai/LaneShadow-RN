# RR-S09-AND-T05 — Android instrumented design-review capture for MapApp route-results states

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z (retrofitted for MAPAPP-DOCTRINE 2026-05-14)

> **Task ID:** RR-S09-AND-T05
> **Sprint:** [Sprint 09 — MapApp · Route Results State](./SPRINT.md)
> **Agent:** kotlin-implementer
> **Estimate:** 180 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** M
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-FID-01, Sprint 09 — Design Review Gate

## Background

**Doctrine:** Per `RULES.md` § Design Rules › One View, Many States, Android capture tests drive `MapApp.kt` with sealed `MapAppState == RouteResults(...)` injected via sandbox stories, NOT a sibling `RouteResultsRoute` Composable. Capture filenames match the iOS canonical reference set (the design-system folder name `route-results-screen` is sunk-cost terminology kept for parity).

Android parity for RR-S09-IOS-T05. Add instrumented capture tests under `android/app/src/androidTest/.../sandbox/snapshots/` that drive `MapApp.kt` to each of the 7 canonical RouteResults variants from VARIANTS.md and write PNGs matching the iOS capture filenames. Each capture flows into the `pnpm design:review --screens route-results-screen` pipeline alongside iOS captures for parity verification.

## Critical Constraints

**MUST:**
- MUST add 7 instrumented test methods to `android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/MapAppRouteResultsCaptureTests.kt`: `mapApp_routeResults_default_best_pre_selected_light`, `mapApp_routeResults_alt1_tapped_sage_promoted_light`, `mapApp_routeResults_default_dark`, `mapApp_routeResults_refining_light`, `mapApp_routeResults_two_candidates_light`, `mapApp_routeResults_weather_divergent_light`, `mapApp_routeResults_message_dismissed_light`
- MUST drive each test by opening the canonical sandbox story `templates.map-app.route-results-{variant}-{theme}` from RR-S09-AND-T02
- MUST capture PNGs with filenames matching canonical stems (`default--best-pre-selected.light.png`, `alt1-tapped--sage-promoted.light.png`, `default--dark.dark.png`, `refining.light.png`, `two-candidates.light.png`, `weather-divergent.light.png`, `message-dismissed.light.png`)
- MUST write captures to `android/app/src/androidTest/screenshots/MapAppRouteResultsCaptureTests/` (per existing parity pattern from prior sprints) AND/OR export to the design-review pipeline expected directory
- MUST register captures in `.design-review/manifest.json` (or trigger the existing manifest generator)
- MUST verify `pnpm design:review --screens route-results-screen` runs end-to-end and produces a `report.json` entry per variant per platform

**NEVER:**
- NEVER hand-author PNGs; all captures are programmatic instrumented test output
- NEVER target `templates.route-results-screen.*` story IDs — those are pre-doctrine sibling-screen IDs that DO NOT exist post-retrofit; canonical IDs are `templates.map-app.route-results-*`
- NEVER skip the alt1-tapped variant's tap interaction; the test MUST drive `onClick` on `mapapp-routeresults-card-1` before capturing
- NEVER skip the refining variant's chat-input-focus interaction (`mapapp-routeresults-chat-input`)
- NEVER skip the message-dismissed variant's dismiss-chevron interaction (on `mapapp-routeresults-navigator-message`)

**STRICTLY:**
- STRICTLY align each test method's capture filename to the canonical stems
- STRICTLY use the existing capture utility (dropshots / paparazzi / equivalent) per the existing parity pattern from Sprint 05+
- STRICTLY follow `RULES.md` §"Design Review Pipeline — View Snapshot Testing"

## Specification

**Objective:** Add 7 instrumented capture test methods to `MapAppRouteResultsCaptureTests.kt` covering every canonical route-results variant of `MapApp`; each test drives the `templates.map-app.route-results-*` sandbox story to the appropriate state, captures a PNG, and writes it matching the canonical filenames.

**Success State:** `./gradlew :app:connectedAndroidTest --tests com.laneshadow.sandbox.snapshots.MapAppRouteResultsCaptureTests` produces 7 PNGs in the capture output directory matching canonical filenames; `pnpm design:review --screens route-results-screen` runs end-to-end against the combined iOS + Android captures and produces a `report.json` entry per variant per platform; zero `high`-severity issues across all 7 variants for Android.

## Acceptance Criteria

### AC-1 — Seven test methods exist with canonical names targeting MapApp routeResults stories

**GIVEN** RR-S09-DR-T01 has published VARIANTS.md
**WHEN** `MapAppRouteResultsCaptureTests.kt` is parsed
**THEN** the file contains all 7 test method declarations prefixed `mapApp_routeResults_`
**Verify:** `grep -c '@Test' android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/MapAppRouteResultsCaptureTests.kt` returns 7 AND `grep -c 'fun mapApp_routeResults_' android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/MapAppRouteResultsCaptureTests.kt` returns 7

### AC-2 — Each test produces a PNG matching the canonical filename

**GIVEN** the 7 test methods exist
**WHEN** `./gradlew :app:connectedAndroidTest --tests com.laneshadow.sandbox.snapshots.MapAppRouteResultsCaptureTests` runs
**THEN** 7 PNG files exist matching canonical stems
**Verify:** `ls android/app/src/androidTest/screenshots/MapAppRouteResultsCaptureTests/ | grep -c '\.png$'` returns 7

### AC-3 — Alt-tapped variant captures post-selection state

**GIVEN** the `mapApp_routeResults_alt1_tapped_sage_promoted_light` test
**WHEN** the test executes
**THEN** the test calls `onNodeWithTag("mapapp-routeresults-card-1").performClick()` BEFORE capturing; the resulting PNG shows alt1 polyline solid-bold sage on MapApp's LSMapHost with alt1 card sage-tinted
**Verify:** Diff `android/app/src/androidTest/screenshots/MapAppRouteResultsCaptureTests/alt1-tapped--sage-promoted.light.png` vs `.spec/design/system/views/mapapp/route-results/alt1-tapped--sage-promoted/alt1-tapped--sage-promoted.light.png` returns severity != "high" via design:review

### AC-4 — Refining variant captures unlocked chat input state

**GIVEN** the `mapApp_routeResults_refining_light` test
**WHEN** the test executes
**THEN** the test focuses `mapapp-routeresults-chat-input` + ensures refine primer chips are visible BEFORE capturing
**Verify:** Diff via design:review returns severity != "high"

### AC-5 — Message-dismissed variant captures Recall chip state

**GIVEN** the `mapApp_routeResults_message_dismissed_light` test
**WHEN** the test executes
**THEN** the test taps the dismiss chevron on `mapapp-routeresults-navigator-message` BEFORE capturing; PNG shows `mapapp-routeresults-recall-chip` bottom-anchored copper (rendered via MapApp's `bottomOverlays`)
**Verify:** Diff via design:review returns severity != "high"

### AC-6 — `pnpm design:review --screens route-results-screen` produces zero high-severity issues for Android

**GIVEN** all 7 Android captures are written and merged into the pipeline manifest
**WHEN** `pnpm design:review --screens route-results-screen` runs
**THEN** `report.json` has 7 Android variant entries (in addition to iOS) and zero entries have `severity == 'high'` for Android
**Verify:** `pnpm design:review --screens route-results-screen && jq '[.findings[] | select(.platform == "android" and .severity == "high")] | length' ios/build/design-review/route-results-screen/report.json` returns 0 (or equivalent Android-side path)

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Seven @Test methods with canonical `mapApp_routeResults_*` names | AC-1 | `grep -c '@Test'` returns 7 + `grep -c 'fun mapApp_routeResults_'` returns 7 | happy_path |
| TC-2 | Seven PNG captures present matching canonical stems | AC-2 | `ls android/app/src/androidTest/screenshots/MapAppRouteResultsCaptureTests/ \| grep -c '\.png$'` returns 7 | happy_path |
| TC-3 | Alt1-tapped variant diff severity != high | AC-3 | design:review jq filter | happy_path |
| TC-4 | Refining variant diff severity != high | AC-4 | design:review jq filter | happy_path |
| TC-5 | Message-dismissed diff severity != high | AC-5 | design:review jq filter | happy_path |
| TC-6 | Zero high-severity findings for Android in report.json | AC-6 | `jq '[.findings[] \| select(.platform == "android" and .severity == "high")] \| length'` returns 0 | edge |
| TC-7 | Compile + detekt clean across modified files | all | `./gradlew :app:compileDebugAndroidTestKotlin && ./gradlew :app:detekt` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/SandboxSnapshotTestBase.kt` | all | [PRIMARY PATTERN] Existing dropshots/capture base class from prior sprints |
| `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md` | all | Canonical variant matrix + `templates.map-app.route-results-*` story ID convention |
| `.spec/design/system/views/mapapp/route-results/` | all | Reference PNGs — capture filenames must match |
| `scripts/design-review/` | all | Pipeline scripts; manifest generator |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-AND-T05-android-instrumented-design-review-capture.md` | all | Sprint 08 sibling — same architecture; targets `templates.map-app.planning-*` stories per the doctrine |
| `android/app/src/debug/java/com/laneshadow/sandbox/stories/templates/MapAppRouteResultsStories.kt` | all (NEW from RR-S09-AND-T02) | Sandbox stories the capture tests drive |

## Guardrails

**Write-Allowed:**
- `android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/MapAppRouteResultsCaptureTests.kt` (NEW)
- `.design-review/manifest.json` (via manifest generator only)

**Write-Prohibited:**
- `.spec/design/system/views/mapapp/route-results/**` — RR-S09-DR-T01 ownership
- `scripts/design-review/**` — Sprint 05 ownership
- `android/app/src/main/**` — non-test code paths
- `ios/**`, `server/**` — out of scope

## Design

**References:**
- `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md`
- `.spec/design/system/views/mapapp/route-results/*/*.png`
- Sprint 08 PLAN-S08-AND-T05

**Interaction Notes:** Each variant requires specific instrumented test interactions to reach the captured state. Same interaction model as iOS T05 — semantics-based testTag clicks against accessibility identifiers established in RR-S09-AND-T02 / T04 under the `mapapp-routeresults-*` namespace.

**Pattern:** Sprint 08 PLAN-S08-AND-T05 — same architecture, swap story IDs from `templates.map-app.planning-*` to `templates.map-app.route-results-*` and update interactions.

**Pattern Source:** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-AND-T05-android-instrumented-design-review-capture.md`

**Anti-Pattern:** Hand-authoring PNGs; targeting pre-doctrine `templates.route-results-screen.*` story IDs (those do not exist post-retrofit); capturing pre-interaction state for S02/S04/V03; skipping manifest registration.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `grep -c '@Test' android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/MapAppRouteResultsCaptureTests.kt` returns 7 |
| AC-2 | `./gradlew :app:connectedAndroidTest --tests com.laneshadow.sandbox.snapshots.MapAppRouteResultsCaptureTests` + `ls .../MapAppRouteResultsCaptureTests/ \| grep -c '\.png$'` returns 7 |
| AC-3 | design:review jq filter for alt1 + android |
| AC-4 | design:review jq filter for refining + android |
| AC-5 | design:review jq filter for message-dismissed + android |
| AC-6 | `pnpm design:review --screens route-results-screen && jq '[.findings[] \| select(.platform == "android" and .severity == "high")] \| length'` returns 0 |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Instrumented test authoring under `androidTest/`. Matches kotlin-implementer mandate. Reviewer: `kotlin-reviewer`.

## Coding Standards

- `RULES.md` § Design Rules › One View, Many States, §"Design Review Pipeline — View Snapshot Testing"
- `brain/docs/mobile-architecture/testing-strategy.md`

## Dependencies

**Depends on:**
- RR-S09-DR-T01 (VARIANTS.md + `templates.map-app.route-results-*` story ID convention)
- RR-S09-AND-T02 (sandbox stories with canonical IDs + testTags under `mapapp-routeresults-*`)
- RR-S09-AND-T03 (polylines render in captures)
- RR-S09-AND-T04 (refine/dismiss/recall wired for S04, V03 captures)

**Blocks:**
- RR-S09-T11 (Sprint 09 gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"Seven @Test methods with canonical mapApp_routeResults_* names in MapAppRouteResultsCaptureTests.kt","verify":"grep -c '@Test' android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/MapAppRouteResultsCaptureTests.kt returns 7","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"Seven PNG captures present matching canonical stems","verify":"ls android/app/src/androidTest/screenshots/MapAppRouteResultsCaptureTests/ | grep -c '\\.png$' returns 7","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Alt-tapped variant capture reflects post-selection promotion (sage) on MapApp's LSMapHost","verify":"design:review jq filter for alt1 android severity != high","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"Refining variant capture reflects unlocked chat input","verify":"design:review jq filter for refining android severity != high","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Message-dismissed capture shows mapapp-routeresults-recall-chip via MapApp.bottomOverlays","verify":"design:review jq filter for message-dismissed android severity != high","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"Zero high-severity findings for Android across all 7 variants","verify":"jq '[.findings[] | select(.platform == \"android\" and .severity == \"high\")] | length' report.json returns 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Seven @Test grep","verify":"grep -c '@Test' android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/MapAppRouteResultsCaptureTests.kt","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Seven PNG count","verify":"ls android/app/src/androidTest/screenshots/MapAppRouteResultsCaptureTests/ | grep -c '\\.png$'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"alt1 variant diff","verify":"design:review jq filter","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"refining variant diff","verify":"design:review jq filter","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"message-dismissed variant diff","verify":"design:review jq filter","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Zero high-severity android findings","verify":"jq filter","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Compile + detekt clean","verify":"./gradlew :app:compileDebugAndroidTestKotlin && ./gradlew :app:detekt","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"}
  ]
}
-->
