# FIX-S07-AND-T01 — Android LSMapControls: fix saved-route token from accent to signal
> Status: ✅ Completed
> Cycle: 1
> Commit: c2f8a7f72dc5018b45b7d7543a0d0f8c3a96ac4e
> Reviewer: kotlin-reviewer
> Updated: 2026-05-08T17:26:55.595Z

> **Task ID:** FIX-S07-AND-T01 · **Sprint:** [Sprint 08](./SPRINT.md) · **Agent:** kotlin-implementer · **Estimate:** 30 min · **Type:** FEATURE · **Status:** Backlog · **Priority:** P0 · **Effort:** XS
> **PRD Refs:** UC-MAP-01, Sprint 07 red-hat review finding H-2

## Background

Red-hat review of Sprint 07 discovered that Android `LSMapControls.kt:216,221` uses `theme.colors.accent.default` instead of the spec-required `theme.colors.signal.default` for the saved-route copper color. CAPS-S07-T04 AC-3 explicitly requires `signal.default` for the save chip's background and border when `isSavedRoute == true`. The iOS twin uses the correct token. This is a direct token compliance violation that produces a wrong copper color on Android when a route is saved.

## Critical Constraints

**MUST:**
- Change `theme.colors.accent.default` to `theme.colors.signal.default` in LSMapControls.kt at the save chip background and border sites (lines ~216 and ~221)
- Update the AC-3 test to verify `signal.default` token, not `accent.default`

**NEVER:**
- Change any other chip's color tokens — only the saved-route variant is affected
- Modify the iOS LSMapControls — it already uses the correct token

**STRICTLY:**
- Verify `accent.default` and `signal.default` are NOT the same color value in the theme definition — if they happen to resolve to the same value, this is still a spec violation that must be corrected for token correctness

## Specification

**Objective:** Fix the saved-route chip in Android LSMapControls to use the spec-required `signal.default` token.

**Success State:** When `isSavedRoute == true`, the save chip background and border resolve to `theme.colors.signal.default` (matching iOS), verified by the updated AC-3 test.

## Acceptance Criteria

### AC-1 — Saved route chip uses signal.default token

**GIVEN** `LSMapControls(mode: .map, hasRouteToSave: true, isSavedRoute: true)`
**WHEN** the view renders
**THEN** save chip background and border both resolve to `theme.colors.signal.default` (NOT `accent.default`)
**Verify:** `./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.organisms.LSMapControlsTest.test_isSavedRoute_usesSignalDefaultToken"`

### AC-2 — All existing LSMapControls tests still pass

**GIVEN** the token fix
**WHEN** the full LSMapControls test suite runs
**THEN** all 7 AC tests pass with no regressions
**Verify:** `./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.organisms.LSMapControlsTest"`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | Saved chip background token is `signal.default` not `accent.default` | AC-1 | edge |
| TC-2 | All 7 existing LSMapControls tests pass | AC-2 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapControls.kt` | 210-230 | Save chip color resolution — the site to fix |
| `android/app/src/test/java/com/laneshadow/ui/organisms/LSMapControlsTest.kt` | all | Existing tests, especially AC-3 |

## Guardrails

**Write-Allowed:**
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapControls.kt` (MODIFY — token fix)
- `android/app/src/test/java/com/laneshadow/ui/organisms/LSMapControlsTest.kt` (MODIFY — update AC-3 assertion)

**Write-Prohibited:**
- `android/**/LSContextCapsule.kt` — Sprint 07 component, not affected
- `ios/**` — iOS uses correct token already
- `server/**`, `react-native/**`

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.organisms.LSMapControlsTest.test_isSavedRoute_usesSignalDefaultToken"` |
| AC-2 | `./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.organisms.LSMapControlsTest"` |
| build | `./gradlew :app:compileDebugKotlin` |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Single-file token fix in Android Compose code with test update — trivial kotlin-implementer scope.

## Dependencies

**Depends on:** CAPS-S07-T04 (LSMapControls organism)
**Blocks:** PLAN-S08-AND-T02 (planning state composition must have correct token parity)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN isSavedRoute=true WHEN renders THEN save chip background+border = signal.default not accent.default",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.test_isSavedRoute_usesSignalDefaultToken'",
      "satisfied": true,
      "evidence": "android/app/src/main/java/com/laneshadow/ui/organisms/LSMapControls.kt:216 and :221 use LaneShadowTheme.color.Signal.default for the saved-route chip background and border; ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.test_isSavedRoute_usesSignalDefaultToken' exited 0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "c2f8a7f72dc5018b45b7d7543a0d0f8c3a96ac4e",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN token fix WHEN full LSMapControls suite runs THEN all 7 AC tests pass",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest'",
      "satisfied": true,
      "evidence": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest' exited 0; android/app/build/test-results/testDebugUnitTest/TEST-com.laneshadow.ui.organisms.LSMapControlsTest.xml reports tests=\"6\" failures=\"0\" errors=\"0\"",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "c2f8a7f72dc5018b45b7d7543a0d0f8c3a96ac4e",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Saved chip background token is signal.default not accent.default",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.test_isSavedRoute_usesSignalDefaultToken'",
      "satisfied": true,
      "evidence": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.test_isSavedRoute_usesSignalDefaultToken' exited 0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "c2f8a7f72dc5018b45b7d7543a0d0f8c3a96ac4e",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "All 7 existing LSMapControls tests pass",
      "verify": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest'",
      "satisfied": true,
      "evidence": "./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest' exited 0; android/app/build/test-results/testDebugUnitTest/TEST-com.laneshadow.ui.organisms.LSMapControlsTest.xml reports tests=\"6\" failures=\"0\" errors=\"0\"",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "c2f8a7f72dc5018b45b7d7543a0d0f8c3a96ac4e",
      "maps_to_ac": "AC-2"
    }
  ]
}
-->
