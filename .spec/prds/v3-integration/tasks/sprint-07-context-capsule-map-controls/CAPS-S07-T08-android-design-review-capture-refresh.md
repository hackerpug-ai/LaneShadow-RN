# CAPS-S07-T08 — Android instrumented design-review capture refresh — update IdleScreenInstrumentedTest for capsule + controls

> **Task ID:** CAPS-S07-T08 · **Sprint:** [Sprint 07](./SPRINT.md) · **Agent:** kotlin-implementer · **Estimate:** 120 min · **Type:** INFRA · **Status:** Backlog · **Priority:** P1 · **Effort:** M
> **PRD Refs:** UC-FID-01

## Background

After CAPS-S07-T06 retrofits IdleScreen, the existing `IdleScreenInstrumentedTest.kt` (from IDLE-S06-AND-T04) will FAIL because it asserts the legacy testTags `greeting-overlay`, `greeting-meta`, `greeting-headline`, `advisory-card`. This task refreshes the suite to target the new testTags and emits best-effort screenshot artifacts via `composeRule.onRoot().captureToImage()` for the 7 idle variants. **Note:** The v0 `pnpm design:review` pipeline is iOS-only per Sprint 05 FID-S05-T10; Android captures here are best-effort artifacts for manual inspection.

## Critical Constraints

**MUST:**
- Replace legacy testTag references (`greeting-overlay`, `greeting-meta`, `greeting-headline`, `advisory-card`) with new testTags (`idle-context-capsule`, `idle-map-controls`) — assertions must compile and run against the retrofitted IdleScreen from CAPS-S07-T06
- Capture screenshots for all 7 idle variants — variants beyond what IdleMockProvider exposes today MAY be marked TODO with tracking IDs and TODO comments, NOT silently dropped
- Run on a connected emulator/device — `./gradlew :app:connectedDebugAndroidTest` exit 0 with all updated tests passing; if no emulator connected, escalate per RULES.md §Real Device E2E Testing rather than stubbing
- Honestly note in test class KDoc that the v0 `pnpm design:review` pipeline is iOS-only per Sprint 05 (FID-S05-T10); Android instrumented captures emit screenshots to `app/build/outputs/connected_android_test_additional_output/.../*.png` for manual inspection until the Android pipeline ships

**NEVER:**
- Add suppressions or `Thread.sleep()` flakiness band-aids — fix assertions to match the new UI, not the other way around
- Use `@Ignore` or skip tests that fail due to retrofit changes
- Mock the Compose tree via Robolectric — instrumented = real device only
- Stub screenshot output (writing fake bitmaps) — captures must come from real `composeRule.onRoot().captureToImage()`
- Remove parity testTag assertions for `chat-input` / `ls-topbar` / `idlescreen-map`

## Specification

**Objective:** `IdleScreenInstrumentedTest.kt` compiles and runs against the retrofitted IdleScreen from CAPS-S07-T06: legacy testTag assertions replaced with `idle-context-capsule` / `idle-map-controls`; the idle variants exposed by `IdleMockProvider` emit screenshot artifacts via `composeRule.onRoot().captureToImage().toBitmap()` saved to test-additional-output; ≥8 `@Test` methods remain; `./gradlew :app:connectedDebugAndroidTest` exit 0; KDoc class header documents the iOS-only v0 design-review pipeline.

**Success State:** Tests compile and pass; ≥7 PNG files emitted; KDoc cites iOS-only v0 status.

## Acceptance Criteria

### AC-1 — Instrumented test compiles against retrofitted IdleScreen [PRIMARY]

**GIVEN** CAPS-S07-T06 retrofit landed
**WHEN** `./gradlew :app:compileDebugAndroidTestKotlin` runs
**THEN** Exit 0; no unresolved-reference errors against `idle-context-capsule` / `idle-map-controls` testTags; legacy testTag references all removed
**Verify:** `./gradlew :app:compileDebugAndroidTestKotlin`

### AC-2 — ≥7 idle variants emit screenshot artifacts

**GIVEN** Connected emulator with retrofitted IdleScreen + variant catalog from `IdleMockProvider`
**WHEN** `./gradlew :app:connectedDebugAndroidTest --tests '*IdleScreenInstrumentedTest*'` runs
**THEN** Exit 0; the test artifact directory contains ≥7 PNG files named `idle-{variantId}.png`; if any variant unavailable in IdleMockProvider, marked with TODO referencing the future task
**Verify:** `./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest'`

### AC-3 — No assertions on legacy greeting selectors

**GIVEN** Refactored `IdleScreenInstrumentedTest.kt`
**WHEN** Searched for legacy testTag references
**THEN** `grep -E 'onNodeWithTag\("(greeting-overlay|greeting-meta|greeting-headline|advisory-card)' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt | wc -l` returns 0
**Verify:** `test $(grep -E 'onNodeWithTag\("(greeting-overlay|greeting-meta|greeting-headline|advisory-card)' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt 2>/dev/null | wc -l) -eq 0`

### AC-4 — New testTags asserted; chat-input / ls-topbar / idlescreen-map preserved

**GIVEN** Refactored test file
**WHEN** Searched for new testTag references
**THEN** `grep -cE 'onNodeWithTag\("(idle-context-capsule|idle-map-controls)' IdleScreenInstrumentedTest.kt` ≥ 2; the parity tags `chat-input`, `ls-topbar`, `idlescreen-map` each appear at least once
**Verify:** `test $(grep -cE 'onNodeWithTag\("(idle-context-capsule|idle-map-controls)' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt) -ge 2 && test $(grep -cE 'onNodeWithTag\("(chat-input|ls-topbar|idlescreen-map)' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt) -ge 3`

### AC-5 — ≥8 @Test methods present (parity with IDLE-S06-AND-T04)

**GIVEN** Refactored test file
**WHEN** Counted
**THEN** `grep -c '^[[:space:]]*@Test' IdleScreenInstrumentedTest.kt` ≥ 8
**Verify:** `test $(grep -c '^[[:space:]]*@Test' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt) -ge 8`

### AC-6 — KDoc honestly notes iOS-only design-review pipeline

**GIVEN** Refactored test file
**WHEN** Class KDoc header inspected
**THEN** KDoc contains the literal strings 'pnpm design:review' AND 'iOS-only' AND 'Sprint 05'
**Verify:** `grep -q 'pnpm design:review' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt && grep -q 'iOS-only' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt && grep -q 'Sprint 05' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | compileDebugAndroidTestKotlin exit 0 against retrofitted IdleScreen | AC-1 | happy_path |
| TC-2 | connectedDebugAndroidTest emits ≥7 PNG artifacts via captureToImage() | AC-2 | happy_path |
| TC-3 | Zero legacy greeting testTag assertions remain | AC-3 | edge_case |
| TC-4 | New testTags + parity testTags asserted | AC-4 | happy_path |
| TC-5 | @Test count ≥ 8 | AC-5 | happy_path |
| TC-6 | KDoc cites iOS-only Sprint 05 pipeline | AC-6 | edge_case |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt` | 1-300 | **PRIMARY PATTERN** — existing instrumented test scaffolding; replace legacy tag references in place |
| `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-AND-T04-instrumented-test-real-data-wiring.md` | 1-260 | Predecessor task — instrumented testing baseline + parity tags + emulator gradle invocation pattern |
| `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/IdleMockProvider.kt` | 1-200 | Variant catalog — confirm what's available and what needs TODO markers |
| `.spec/prds/v3-integration/tasks/sprint-05-design-review-pipeline/SPRINT.md` | 1-100 | Confirm v0 design-review pipeline is iOS-only — cite explicitly in KDoc |
| `android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSScrimInstrumentationTest.kt` | 1-100 | Closest precedent — emits artifacts via captureToImage() |

## Guardrails

**Write-Allowed:**
- `android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt` (MODIFY — replace legacy testTag refs; add captureVariant helper + screenshot loop; update KDoc)

**Write-Prohibited:**
- `ios/**`, `server/**`, `react-native/**`, `tokens/**`
- `android/app/src/main/**` — production composables owned by T02 / T04 / T06 (this task is READ-only against production)
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/IdleMockProvider.kt` — variant catalog is owned by Sprint 06; if a variant is missing, mark TODO rather than mutate the provider

## Design

**Interaction Notes:** `captureToImage()` must run after `composeRule.waitForIdle()` to ensure all recompositions and animations have settled. For the Planning capsule pulse, gating `LocalAccessibilityManager` to disable animation in test runs avoids screenshot non-determinism.

**Pattern:** IDLE-S06-AND-T04's instrumented test shape (`createComposeRule` + `IdleMockProvider` + testTag assertions + KDoc-documented limitations); add `captureToImage()` loop for variant artifacts.

**Anti-Pattern:** `Thread.sleep()` flakiness band-aids; `@Ignore` or `.skip()` on tests that fail due to retrofit; mocking the Compose tree via Robolectric; stubbing screenshot output

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `./gradlew :app:compileDebugAndroidTestKotlin` |
| AC-2 | `./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest'` |
| AC-3 | `test $(grep -E 'onNodeWithTag\("(greeting-overlay\|greeting-meta\|greeting-headline\|advisory-card)' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt 2>/dev/null \| wc -l) -eq 0` |
| AC-4 | `test $(grep -cE 'onNodeWithTag\("(idle-context-capsule\|idle-map-controls)' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt) -ge 2` |
| AC-5 | `test $(grep -c '^[[:space:]]*@Test' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt) -ge 8` |
| AC-6 | `grep -q 'pnpm design:review' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt && grep -q 'iOS-only' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt && grep -q 'Sprint 05' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt` |
| build | `./gradlew :app:assembleDebug` |
| lint | `./gradlew detekt` |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Instrumented test refresh on existing `IdleScreenInstrumentedTest.kt` — testTag substitution, screenshot capture wiring via `composeRule.onRoot().captureToImage()`, and a real emulator gradle invocation. Matches kotlin-implementer's instrumented test remit (IDLE-S06-AND-T04 was the predecessor).

## Coding Standards

- `RULES.md` §Cross-Platform Component Parity — testTags `idle-context-capsule` / `idle-map-controls` must match iOS T07 exactly
- `RULES.md` §Real Device E2E Testing — instrumented tests run on real emulator; no Robolectric stubs
- `RULES.md` §Verification Standards
- `brain/docs/ANTI-STUB-REVIEW.md` — instrumented tests must drive real composables
- `brain/docs/mobile-architecture/testing-strategy.md` — Compose instrumented + captureToImage() is canonical Android visual capture recipe

## Dependencies

**Depends on:** CAPS-S07-T06 (Android idle retrofit)
**Blocks:** CAPS-S07-T09 (Sprint gate uses Android instrumented evidence as supporting artifact)
**Parallel:** CAPS-S07-T07 (iOS twin)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN retrofit landed WHEN compileDebugAndroidTestKotlin runs THEN Exit 0","verify":"./gradlew :app:compileDebugAndroidTestKotlin","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN connected emulator WHEN connectedDebugAndroidTest runs THEN ≥7 PNG artifacts emitted","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN refactored test WHEN grepped for legacy tags THEN zero matches","verify":"test $(grep -E 'onNodeWithTag\\(\"(greeting-overlay|greeting-meta|greeting-headline|advisory-card)' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt 2>/dev/null | wc -l) -eq 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN refactored test WHEN grepped for new tags THEN ≥2 capsule+controls + parity tags present","verify":"test $(grep -cE 'onNodeWithTag\\(\"(idle-context-capsule|idle-map-controls)' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt) -ge 2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"@Test count ≥ 8","verify":"test $(grep -c '^[[:space:]]*@Test' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt) -ge 8","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"KDoc contains 'pnpm design:review' + 'iOS-only' + 'Sprint 05'","verify":"grep -q 'pnpm design:review' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt && grep -q 'iOS-only' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt && grep -q 'Sprint 05' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"compileDebugAndroidTestKotlin exit 0","verify":"./gradlew :app:compileDebugAndroidTestKotlin","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"connectedDebugAndroidTest exit 0 + 7 PNGs","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Zero legacy testTag matches","verify":"test $(grep -E 'onNodeWithTag\\(\"(greeting-overlay|greeting-meta|greeting-headline|advisory-card)' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt 2>/dev/null | wc -l) -eq 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"≥2 new tags + 3 parity tags present","verify":"test $(grep -cE 'onNodeWithTag\\(\"(idle-context-capsule|idle-map-controls)' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt) -ge 2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"@Test ≥ 8","verify":"test $(grep -c '^[[:space:]]*@Test' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt) -ge 8","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"KDoc tokens present","verify":"grep -q 'pnpm design:review' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"}
  ]
}
-->
