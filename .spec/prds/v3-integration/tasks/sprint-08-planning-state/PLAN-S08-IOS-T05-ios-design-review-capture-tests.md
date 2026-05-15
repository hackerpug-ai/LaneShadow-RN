# PLAN-S08-IOS-T05 — iOS DesignReview capture tests for planning-screen variants

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-07T19:10:00.000Z

> **Task ID:** PLAN-S08-IOS-T05
> **Sprint:** [Sprint 08 — Map View · Planning State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 180 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** M
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-FID-01 (planning-screen variants — full coverage), Sprint 08 — Map View Planning State (Map View Redesign 2026-05-06), `RULES.md` §"Design Review Pipeline — View Snapshot Testing"

## Background

The Sprint 06 design-review pipeline (`pnpm design:review`) extends to `planning-screen` in Sprint 08. The pipeline runs `xcodebuild test` against `LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift`, which launches each sandbox story in turn, captures a screenshot via `XCTAttachment`, and exports the named PNGs to disk for vision-LLM diff against the design-system reference set. Sprint 08 adds the `planning-screen` variant family — covering all `(planning-screen, state, theme)` tuples per the regenerated reference set from PLAN-S08-DR-T01.

Per the Sprint 08 SPRINT.md and the design-system README, the planning-screen variants are: **S01 Scouting (Light), S02 Drawing (Light), S03 Weather (Light), S04 Scoring (Dark), V01 Slow Planning, V02 Cancel Prompt, V03 Single Candidate**. Each variant maps to a sandbox story id (`templates.planning-screen.{state}-{theme}`) registered by PLAN-S08-IOS-T02. This task adds `test_planningScreen_*` methods to the DesignReviewCaptureTests file — one per variant — driving xcodebuild test to capture live screenshots that the design-review pipeline diffs against the regenerated reference PNGs in `.spec/design/system/refs/planning-screen/`.

Variant naming MUST reconcile against the canonical naming from PLAN-S08-DR-T01 (which is the authority for both the `planning-screen.html` design + the regenerated reference PNGs). Until PLAN-S08-DR-T01 lands the regenerated set, this task is sequenced AFTER it — capture tests align to the regenerated references, never the stale current set.

## Critical Constraints

**MUST:**
- Add `test_planningScreen_*` test methods to `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` — one per variant per theme, mirroring the existing `test_idleScreen_*` pattern (e.g., `test_planningScreen_scouting_light`, `test_planningScreen_drawing_light`, `test_planningScreen_weather_light`, `test_planningScreen_scoring_dark`, `test_planningScreen_slowPlanning_light`, `test_planningScreen_cancelPrompt_light`, `test_planningScreen_singleCandidate_light` — exact set determined by the regenerated reference inventory from PLAN-S08-DR-T01)
- Each test method calls `launchSandboxStory("templates.planning-screen.{state}-{theme}")` (the canonical id from PLAN-S08-IOS-T02) THEN `capturePlanningScreen(state:theme:)` THEN `add(attachment)` AND asserts `attachment.name == "planning-screen.{state}.{theme}"` per the `{screen}.{state}.{theme}` naming convention
- Add a `capturePlanningScreen(state:theme:)` helper to `DesignReviewHelpers.swift` (or inline in the test file if a single-use pattern) mirroring the existing `captureIdleScreen` helper — wait for the planning state to fully render (sketch animation paused via determinism setup), then capture
- Ensure `DesignReviewHelpers.setupDeterminismEnvironment(app:colorScheme:)` is called for every test BEFORE story launch, with `colorScheme: "dark"` for the dark variants — this disables animations (sketch polyline, breathing dot, phase-indicator pulse) so screenshots are deterministic
- Modify `ios/LaneShadow/Sandbox/Stories/Templates/PlanningScreenStory.swift` ONLY if any required variant story is missing from PLAN-S08-IOS-T02's sandbox registration (coordinate; ideally PLAN-S08-IOS-T02 already provides all 7 stories with canonical ids)
- ALL tests run via `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests` and produce one named `.png` attachment per test
- Verify the design-review pipeline post-run: `pnpm design:review --screens planning-screen` produces a `report.json` with **zero `high`-severity issues** across all planning-screen variants (this is the gate criterion from PLAN-S08-T11; verifying here de-risks the gate)

**NEVER:**
- NEVER run with the simulator's animations enabled — `setupDeterminismEnvironment` MUST run first to disable Core Animation, sketch polyline, breathing dot, phase pulse, AND any `Animation.repeatForever` in the test target
- NEVER pin tests to the stale pre-Sprint-07 reference set — references live at `.spec/design/system/refs/planning-screen/*.png` and MUST be the regenerated PLAN-S08-DR-T01 output
- NEVER skip the dark-theme variant for any state where the design-system README requires both themes (currently S04 Scoring is dark — confirm via the regenerated set)
- NEVER hardcode variant labels that differ from the design-system README — the canonical naming from PLAN-S08-DR-T01 (after reconciliation) wins
- NEVER mock or stub the planning state inside the UI test — launch the sandbox story which renders the real `PlanningScreen` composition with the deterministic mock provider
- NEVER bypass the launch-arg auth flow — `setupDeterminismEnvironment` already injects the deterministic launch env; tests use that env, not auth bypass flags

**STRICTLY:**
- STRICTLY follow the existing `test_idleScreen_*` pattern in `DesignReviewCaptureTests.swift` (lines 33-82) — same setUp/tearDown shape, same `XCTAttachment` lifetime (`.keepAlways`), same `{screen}.{state}.{theme}` attachment naming
- STRICTLY align all sandbox story ids to the canonical lowercase dot-separated kebab-case spec from `RULES.md` §"Cross-Platform Component Parity" — Android twin (PLAN-S08-AND-T05) MUST share these IDs
- STRICTLY confirm the regenerated reference inventory from PLAN-S08-DR-T01 BEFORE adding tests — if PLAN-S08-DR-T01 produces fewer/more variants than this task assumes, align test count to the actual regenerated set

## Specification

**Objective:** Extend `DesignReviewCaptureTests.swift` with `test_planningScreen_*` methods covering every `(planning-screen, state, theme)` tuple from the regenerated reference set delivered by PLAN-S08-DR-T01, so `pnpm design:review --screens planning-screen` produces a complete `report.json` with zero high-severity issues across all variants.

**Success State:** `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` exits 0 with one named PNG attachment per planning-screen variant; `pnpm design:review --screens planning-screen` produces `report.json` with zero `high`-severity issues; the variants captured match 1:1 the regenerated reference inventory in `.spec/design/system/refs/planning-screen/*.png`.

## Acceptance Criteria

### AC-1 — Test method exists for every planning-screen variant in the regenerated reference set

**GIVEN** the regenerated reference inventory at `.spec/design/system/refs/planning-screen/*.png` (delivered by PLAN-S08-DR-T01)
**WHEN** the count of `test_planningScreen_*` methods in `DesignReviewCaptureTests.swift` is compared against the count of reference PNGs
**THEN** they match exactly — one test per `(state, theme)` tuple per the regenerated set (expected: scouting-light, drawing-light, weather-light, scoring-dark, slow-planning-light, cancel-prompt-light, single-candidate-light per the design-system README, subject to PLAN-S08-DR-T01 reconciliation)
**Verify:** `grep -c 'func test_planningScreen_' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift && ls .spec/design/system/refs/planning-screen/*.png | wc -l`

### AC-2 — Each test launches the canonical sandbox story id

**GIVEN** any `test_planningScreen_{variant}` method
**WHEN** the test body is read
**THEN** it calls `launchSandboxStory("templates.planning-screen.{variant-kebab}-{theme}")` exactly — the id matches the cross-platform parity convention (lowercase dot-separated kebab-case)
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_scouting_light`

### AC-3 — Determinism environment configured before each test

**GIVEN** any `test_planningScreen_*` method
**WHEN** the test body is read
**THEN** `DesignReviewHelpers.setupDeterminismEnvironment(app:)` is called before `launchSandboxStory(...)` AND for dark variants `setupDeterminismEnvironment(app:, colorScheme: "dark")` is called
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_scoring_dark`

### AC-4 — Each test produces a named XCTAttachment

**GIVEN** any `test_planningScreen_{variant}_{theme}` method runs successfully
**WHEN** test execution completes
**THEN** the test produces exactly one `XCTAttachment` with `name == "planning-screen.{variant}.{theme}"` (per existing `{screen}.{state}.{theme}` convention) and `lifetime == .keepAlways`
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_drawing_light`

### AC-5 — Light + dark themes both covered for required variants

**GIVEN** the regenerated reference set requires both light + dark for any base variant (currently S04 Scoring per existing inventory; potentially others post-reconciliation)
**WHEN** the test inventory is checked
**THEN** every required (variant, theme) tuple has a corresponding test method
**Verify:** `grep 'test_planningScreen_.*_(light|dark)' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift`

### AC-6 — Capture helper waits for sketch animation to settle (determinism)

**GIVEN** the `capturePlanningScreen(state:theme:)` helper (or inline equivalent)
**WHEN** capture is invoked after `launchSandboxStory(...)`
**THEN** the helper waits for the planning UI to fully render (sketch polyline at static dashPhase per determinism setup, phase-indicator at static state, no animation in flight) BEFORE calling `app.screenshot()` — uses `XCUIElement.waitForExistence` on `planningscreen` accessibility id with reasonable timeout
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_scouting_light`

### AC-7 — design:review --screens planning-screen produces zero high-severity issues

**GIVEN** all `test_planningScreen_*` methods pass and emit attachments
**WHEN** `pnpm design:review --screens planning-screen` runs against the build
**THEN** `report.json` contains zero entries with `severity === "high"` across every captured planning-screen variant
**Verify:** `pnpm design:review --screens planning-screen && jq '[.results[] | select(.severity == "high")] | length' .spec/design/reports/latest/report.json`

### AC-8 — Test inventory aligned with PLAN-S08-DR-T01 regenerated set (no stale variant labels)

**GIVEN** the canonical variant naming from PLAN-S08-DR-T01 reconciliation (design-system README naming wins)
**WHEN** test method names are inspected
**THEN** zero tests reference legacy ROADMAP variant labels (e.g., "S02 cancel-confirm" if README is "S02 Drawing Light"); naming matches the regenerated `.spec/design/system/refs/planning-screen/*.png` filename stems
**Verify:** `! grep -E 'cancel-confirm-light\|s02-typing\|s03-weather-old' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Count of test_planningScreen_* methods matches count of regenerated reference PNGs exactly | AC-1 | `grep -c 'func test_planningScreen_' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` | edge |
| TC-2 | Each test launches `templates.planning-screen.{variant}-{theme}` canonical id | AC-2 | `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_scouting_light` | happy_path |
| TC-3 | Determinism env configured before story launch (light + dark variants) | AC-3 | `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_scoring_dark` | edge |
| TC-4 | Each test emits one `.keepAlways` XCTAttachment named `planning-screen.{variant}.{theme}` | AC-4 | `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_drawing_light` | happy_path |
| TC-5 | Both light + dark themes covered for required variants | AC-5 | `grep 'test_planningScreen_.*_\(light\|dark\)' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` | edge |
| TC-6 | Capture helper waits for planning UI to render before screenshot | AC-6 | `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_scouting_light` | edge |
| TC-7 | design:review --screens planning-screen produces zero `high` severity entries in report.json | AC-7 | `pnpm design:review --screens planning-screen && jq '[.results[] \| select(.severity == "high")] \| length' .spec/design/reports/latest/report.json` | happy_path |
| TC-8 | Test inventory uses canonical variant naming from PLAN-S08-DR-T01 reconciliation | AC-8 | `! grep -E 'cancel-confirm-light\|s02-typing\|s03-weather-old' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` | edge |
| TC-9 | Build + lint pass cleanly | AC-1, AC-4 | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` | 1-200 | Existing pattern source — `test_idleScreen_*` methods (lines 33-82), `setUpWithError`/`tearDownWithError`, `launchSandboxStory(...)`, `captureIdleScreen(state:theme:)` helper invocation, attachment naming convention |
| `ios/LaneShadowUITests/DesignReview/DesignReviewHelpers.swift` | all | Helper module — `setupDeterminismEnvironment(app:colorScheme:)`, `launchSandboxStory(...)`, capture helpers; extension point for `capturePlanningScreen(...)` |
| `ios/LaneShadow/Sandbox/Stories/Templates/PlanningScreenStory.swift` | all | Sandbox stories — verify all required variant ids from PLAN-S08-IOS-T02 are present; if any are missing, register them here |
| `.spec/design/system/refs/planning-screen/*.png` | inventory | Regenerated reference inventory (post-PLAN-S08-DR-T01) — drives the test count exactly |
| `.spec/design/system/views/mapapp/planning/README.md` | all | Variant matrix — S01 Scouting Light, S02 Drawing Light, S03 Weather Light, S04 Scoring Dark, V01 Slow Planning, V02 Cancel Prompt, V03 Single Candidate |
| `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/` (idle T04 task) | all | Sprint 06 design-review pattern reference — Sprint 08 mirrors Sprint 06's IdleScreen capture approach |
| `RULES.md` §"Design Review Pipeline" | all | Pipeline contract — naming, attachment lifetime, severity gate |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` (MODIFY — add `test_planningScreen_*` methods + optional `capturePlanningScreen(state:theme:)` helper)
- `ios/LaneShadowUITests/DesignReview/DesignReviewHelpers.swift` (MODIFY ONLY if `capturePlanningScreen` lives here as a shared helper)
- `ios/LaneShadow/Sandbox/Stories/Templates/PlanningScreenStory.swift` (MODIFY ONLY if a required variant story is missing from PLAN-S08-IOS-T02 — coordinate to avoid double-touch)
- `ios/project.yml` (MODIFY only if file additions require regeneration)

**Write-Prohibited:**
- `.spec/design/system/refs/planning-screen/**` — references are owned by PLAN-S08-DR-T01; do NOT regenerate or modify in this task
- `.spec/design/system/views/mapapp/planning/planning-screen.html` — owned by PLAN-S08-DR-T01
- `ios/LaneShadow/Views/Templates/PlanningScreen.swift` — owned by PLAN-S08-IOS-T02
- `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` — owned by PLAN-S08-IOS-T02 / PLAN-S08-IOS-T04
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` — owned by PLAN-S08-IOS-T01
- `ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift` — owned by PLAN-S08-IOS-T03
- `android/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope
- `ios/LaneShadow.xcodeproj/**` — generated

## Design

**References:**
- `.spec/design/system/refs/planning-screen/*.png` (regenerated by PLAN-S08-DR-T01)
- `.spec/design/system/views/mapapp/planning/README.md`
- `RULES.md` §"Design Review Pipeline — View Snapshot Testing"

**Interaction Notes:** UI-test only — no production code changes. Tests run in headless XCUITest; screenshots are written via `XCTAttachment` and exported by the design-review pipeline shell into the project's `.spec/design/reports/latest/captures/` directory. The vision-LLM diff against the reference set is downstream of this task.

**Pattern:** `test_idleScreen_default_light` (lines 33-40), `test_idleScreen_default_dark` (lines 43-51), `test_idleScreen_typingSend_light` (lines 54-61) in `DesignReviewCaptureTests.swift` — each is a 4-line method: setup determinism env, launch story, capture, add attachment, assert name.

**Pattern Source:** Sprint 06 IDLE-S06-IOS-T04 capture tests for `idle-screen` variants — same architecture, same attachment-naming convention, same determinism guard.

**Anti-Pattern:** Hardcoding variant labels that don't match `.spec/design/system/refs/planning-screen/*.png` filenames; skipping `setupDeterminismEnvironment`; capturing while sketch animation is still in flight (non-deterministic screenshots); skipping the dark variant when the design system requires it.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `grep -c 'func test_planningScreen_' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` (count must match `ls .spec/design/system/refs/planning-screen/*.png \| wc -l`) |
| AC-2 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_scouting_light` |
| AC-3 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_scoring_dark` |
| AC-4 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_drawing_light` |
| AC-5 | `grep 'test_planningScreen_.*_\(light\|dark\)' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` |
| AC-6 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_scouting_light` |
| AC-7 | `pnpm design:review --screens planning-screen && jq '[.results[] \| select(.severity == "high")] \| length' .spec/design/reports/latest/report.json` |
| AC-8 | `! grep -E 'cancel-confirm-light\|s02-typing\|s03-weather-old' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| lint | `swiftlint lint ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift ios/LaneShadowUITests/DesignReview/DesignReviewHelpers.swift` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** XCUITest authoring task in `LaneShadowUITests/DesignReview/` mirroring the established `test_idleScreen_*` pattern. Matches swift-implementer's mandate (XCUITest, `XCTAttachment`, sandbox story launch via launch arguments). No production code changes; pure UI-test extension to drive the design-review pipeline.

## Coding Standards

- `RULES.md` §"Design Review Pipeline — View Snapshot Testing" (planner contract for view coverage)
- `RULES.md` §"Cross-Platform Component Parity" (canonical sandbox story id naming)
- `brain/docs/mobile-architecture/testing-strategy.md` (XCUITest determinism, attachment lifetime, capture timing)
- Existing `DesignReviewCaptureTests.swift` pattern (lines 1-200) — authoritative pattern source

## Dependencies

**Depends on:**
- PLAN-S08-IOS-T02 (planning state composition + sandbox story registrations exist with canonical ids)
- PLAN-S08-IOS-T03 (sketch animation layer present so determinism setup can pause it for stable screenshots)
- PLAN-S08-IOS-T04 (cancel-confirm sheet rendered in V02 variant story — required for cancel-prompt capture)
- PLAN-S08-DR-T01 (regenerated `.spec/design/system/refs/planning-screen/*.png` reference set + variant naming reconciliation — drives test inventory)

**Blocks:**
- PLAN-S08-T11 (Sprint 08 gate — `pnpm design:review --screens planning-screen` zero-high-severity is gate criterion; this task delivers the capture half of that pipeline)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"Count of test_planningScreen_* methods matches count of regenerated .spec/design/system/refs/planning-screen/*.png exactly","verify":"grep -c 'func test_planningScreen_' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"Each test launches canonical sandbox story id templates.planning-screen.{variant}-{theme}","verify":"xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_scouting_light","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Determinism env configured before story launch; dark variants pass colorScheme: \"dark\"","verify":"xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_scoring_dark","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"Each test emits one .keepAlways XCTAttachment named planning-screen.{variant}.{theme}","verify":"xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_drawing_light","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Both light + dark themes covered for required variants","verify":"grep 'test_planningScreen_.*_\\(light\\|dark\\)' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"Capture helper waits for planning UI render (planningscreen accessibility id) before screenshot — animations paused via determinism","verify":"xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_scouting_light","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"pnpm design:review --screens planning-screen produces zero high-severity entries in report.json","verify":"pnpm design:review --screens planning-screen && jq '[.results[] | select(.severity == \"high\")] | length' .spec/design/reports/latest/report.json","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-8","type":"acceptance_criterion","description":"Test inventory uses canonical variant names from PLAN-S08-DR-T01 reconciliation; zero stale ROADMAP labels","verify":"! grep -E 'cancel-confirm-light|s02-typing|s03-weather-old' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Count of test methods matches count of reference PNGs","verify":"grep -c 'func test_planningScreen_' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Each test launches canonical story id","verify":"xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_scouting_light","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Determinism env setup before story launch","verify":"xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_scoring_dark","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Each test emits named .keepAlways attachment","verify":"xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_drawing_light","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Light + dark coverage for required variants","verify":"grep 'test_planningScreen_.*_\\(light\\|dark\\)' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Capture helper waits for planning UI before screenshot","verify":"xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_scouting_light","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"design:review pipeline returns zero high-severity entries for planning-screen","verify":"pnpm design:review --screens planning-screen && jq '[.results[] | select(.severity == \"high\")] | length' .spec/design/reports/latest/report.json","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"},
    {"id":"TC-8","type":"test_criterion","description":"Test inventory naming aligned to PLAN-S08-DR-T01 canonical naming","verify":"! grep -E 'cancel-confirm-light|s02-typing|s03-weather-old' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-8"},
    {"id":"TC-9","type":"test_criterion","description":"Build + swiftlint clean across modified UI test files","verify":"xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift ios/LaneShadowUITests/DesignReview/DesignReviewHelpers.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"}
  ]
}
-->
