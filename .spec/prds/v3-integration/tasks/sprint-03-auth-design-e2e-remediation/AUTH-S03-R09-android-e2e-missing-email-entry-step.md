# AUTH-S03-R09: Fix Android E2E login flow — add missing "Continue with Email" navigation step

**Sprint:** [Sprint 03 Remediation](./SPRINT.md)
**Agent:** kotlin-implementer
**Estimate:** 60 min
**Type:** INFRA
**Status:** Completed
**Priority:** P0

## Completion Evidence

- Commit: `2a61c0aaf24c76587551c195bc3a1a313c1ee5af`
- Merge: `a2643dd9`
- Reviewer: `kotlin-reviewer`
- Verification: `cd android && ./gradlew compileDebugAndroidTestKotlin` exited 0; grep checks confirmed both login and registration flows click `auth_continue_with_email` before waiting for `auth_email_field`.

## Background

After the auth screen redesign (tasks #1119-#1125), both platforms got a new 3-button entry view (Apple, Google, Email) that requires tapping "Continue with Email" before the email field appears. The Android `AuthLiveE2ETest.kt` test skips this step — it launches the app (which starts on `AuthScreenStep.Entry`), then immediately waits for `auth_email_field`. But that field only exists in `AuthScreenStep.EmailEntry`. The test spins for 30 seconds and fails, causing the "flashing" behavior the user observed.

Both `runLoginFlow()` and `runRegistrationFlow()` are affected.

## Critical Constraints

- **MUST** add `waitForTag("auth_continue_with_email")` + `clickTag("auth_continue_with_email")` before `waitForTag("auth_email_field")` in `runLoginFlow()`
- **MUST** add the same fix in `runRegistrationFlow()`
- **MUST** preserve all existing test assertions and screenshot captures
- **NEVER** change any test tag strings on production AuthScreen.kt
- **NEVER** add this step to AuthBypassE2ETest.kt (that test works correctly — it bypasses auth entirely)

## Specification

**Objective:** Fix broken Android E2E tests by adding the missing "Continue with Email" navigation step.

**Success State:** Android E2E tests complete login and registration flows without 30-second timeouts or flashing behavior.

## Acceptance Criteria

### AC-1: Login flow navigates through email entry step
**GIVEN** AuthLiveE2ETest.kt is running `runLoginFlow()`
**WHEN** the test executes the login flow
**THEN** the test clicks `auth_continue_with_email` before waiting for `auth_email_field`, preventing the 30-second timeout
**VERIFY:** `grep -A5 'fun runLoginFlow' android/app/src/androidTest/java/com/laneshadow/ui/auth/AuthLiveE2ETest.kt` shows the navigation step before `waitForTag("auth_email_field")`

### AC-2: Registration flow navigates through email entry step
**GIVEN** AuthLiveE2ETest.kt is running `runRegistrationFlow()`
**WHEN** the test executes the registration flow
**THEN** the test clicks `auth_continue_with_email` before waiting for `auth_email_field`, preventing the 30-second timeout
**VERIFY:** `grep -A5 'fun runRegistrationFlow' android/app/src/androidTest/java/com/laneshadow/ui/auth/AuthLiveE2ETest.kt` shows the navigation step before `waitForTag("auth_email_field")`

### AC-3: Bypass test remains unchanged
**GIVEN** AuthBypassE2ETest.kt exists and works correctly
**WHEN** the fix is applied to AuthLiveE2ETest.kt
**THEN** AuthBypassE2ETest.kt is not modified
**VERIFY:** `git diff --name-only` does not include `AuthBypassE2ETest.kt`

## Test Criteria

| ID | Statement | Maps To | Verify |
|----|-----------|---------|--------|
| TC-1 | `runLoginFlow()` clicks "Continue with Email" before accessing email field | AC-1 | `grep -A5 'runLoginFlow'` shows correct sequence |
| TC-2 | `runRegistrationFlow()` clicks "Continue with Email" before accessing email field | AC-2 | `grep -A5 'runRegistrationFlow'` shows correct sequence |
| TC-3 | E2E test compiles successfully | AC-1 | `./gradlew compileDebugAndroidTestKotlin` exits 0 |

## Reading List

| Path | Lines | Focus |
|------|-------|-------|
| `android/app/src/androidTest/java/com/laneshadow/ui/auth/AuthLiveE2ETest.kt` | 62-118 | `runLoginFlow()` and `runRegistrationFlow()` — find where `waitForTag("auth_email_field")` is called without prior navigation |
| `android/app/src/main/java/com/laneshadow/ui/auth/AuthScreen.kt` | 407-527 | Verify test tags: `auth_continue_with_email`, `auth_email_field`, and state flow from Entry → EmailEntry |
| `android/app/src/androidTest/java/com/laneshadow/ui/auth/AuthBypassE2ETest.kt` | 1-95 | Understand why bypass test works (doesn't go through email entry) |

## Guardrails

**WRITE-ALLOWED:**
- `android/app/src/androidTest/java/com/laneshadow/ui/auth/AuthLiveE2ETest.kt` (MODIFY)

**WRITE-PROHIBITED:**
- `android/app/src/main/java/com/laneshadow/ui/auth/AuthScreen.kt` — production code
- `android/app/src/androidTest/java/com/laneshadow/ui/auth/AuthBypassE2ETest.kt` — works correctly
- Any file under `android/app/src/main/` — no production changes

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| Android E2E test compiles | `cd android && ./gradlew compileDebugAndroidTestKotlin` | BUILD SUCCESSFUL, exit 0 |
| Test file has navigation step in login | `grep -c 'auth_continue_with_email' android/app/src/androidTest/java/com/laneshadow/ui/auth/AuthLiveE2ETest.kt` | count >= 2 (login + registration) |

## Agent Assignment

**kotlin-implementer** — owns Android E2E test code; can read production AuthScreen for test tag verification

## Dependencies

- **Depends on:** none
- **Blocks:** Sprint 04

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Login flow navigates through email entry step", "verify": "grep shows auth_continue_with_email click before auth_email_field wait in runLoginFlow" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Registration flow navigates through email entry step", "verify": "grep shows auth_continue_with_email click before auth_email_field wait in runRegistrationFlow" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Bypass test remains unchanged", "verify": "git diff --name-only does not include AuthBypassE2ETest.kt" },
    { "id": "TC-1", "type": "test_criterion", "description": "runLoginFlow() clicks Continue with Email before accessing email field", "maps_to_ac": "AC-1", "verify": "grep -A5 runLoginFlow shows correct sequence" },
    { "id": "TC-2", "type": "test_criterion", "description": "runRegistrationFlow() clicks Continue with Email before accessing email field", "maps_to_ac": "AC-2", "verify": "grep -A5 runRegistrationFlow shows correct sequence" },
    { "id": "TC-3", "type": "test_criterion", "description": "E2E test compiles successfully", "maps_to_ac": "AC-1", "verify": "./gradlew compileDebugAndroidTestKotlin exits 0" }
  ]
}
-->
