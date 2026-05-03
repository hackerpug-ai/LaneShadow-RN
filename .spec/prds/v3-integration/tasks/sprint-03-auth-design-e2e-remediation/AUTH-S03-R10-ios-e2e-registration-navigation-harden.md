# AUTH-S03-R10: Fix iOS E2E registration flow — verify sign-up entry navigation after redesign

**Sprint:** [Sprint 03 Remediation](./SPRINT.md)
**Agent:** swift-implementer
**Estimate:** 60 min
**Type:** INFRA
**Status:** Completed
**Priority:** P0

## Completion Evidence

- Commit: `b9d07f40aca68a246dd666d2f23689f0ec595368`
- Merge: `f3003444`
- Reviewer: `swift-reviewer`
- Verification: `xcodebuild build-for-testing -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` exited 0 in the isolated worktree; grep checks confirmed the email-field wait before `auth.signUp.entry` and exactly one ordering-dependency comment.

## Background

The iOS E2E registration test (`AuthRegistrationE2ETests.swift`) navigates: Entry → tap "Continue with Email" → tap "Create Account" (`auth.signUp.entry`) → sign-up screen. The "Create Account" link only renders when `viewModel.mode != .entry` (it appears on the EmailEntry step, NOT the Entry step). This ordering dependency is correct but fragile — if the "Continue with Email" tap fails silently, the sign-up link won't exist and the test hangs with "flashing" behavior.

The email/password test (`AuthEmailPasswordE2ETests.swift`) already has an explicit wait for the email field (lines 32-33). The registration test should have the same defensive pattern.

## Critical Constraints

- **MUST** add explicit wait for `auth.signIn.email` to appear after tapping `auth.signIn.continueWithEmail` BEFORE attempting to tap `auth.signUp.entry`
- **MUST** add a comment noting the ordering dependency: "Create Account link only appears in EmailEntry mode, not Entry mode"
- **MUST** verify `AuthEmailPasswordE2ETests.swift` already has the email field wait (lines 32-33)
- **NEVER** change any accessibility identifiers on production screens
- **NEVER** modify production AuthScreen.swift or ViewModels

## Specification

**Objective:** Verify and harden the iOS E2E registration flow against silent navigation failures by adding an explicit defensive wait.

**Success State:** iOS E2E registration tests complete sign-up flow without hanging or flashing. The test explicitly waits for the email field to appear before attempting to tap the "Create Account" link.

## Acceptance Criteria

### AC-1: Registration flow waits for email entry state before accessing sign-up link
**GIVEN** AuthRegistrationE2ETests.swift is running the registration test
**WHEN** the test taps "Continue with Email"
**THEN** the test explicitly waits for `auth.signIn.email` to appear before attempting to tap `auth.signUp.entry`
**VERIFY:** `grep -B2 -A2 'auth.signUp.entry' ios/LaneShadowUITests/AuthRegistrationE2ETests.swift` shows wait for email field before tapping sign-up entry

### AC-2: Ordering dependency is documented
**GIVEN** the registration flow depends on state transitions
**WHEN** reading the test code
**THEN** a comment explains "Create Account link only appears in EmailEntry mode, not Entry mode"
**VERIFY:** `grep -c 'Create Account link only appears' ios/LaneShadowUITests/AuthRegistrationE2ETests.swift` returns 1

### AC-3: Email password test already has defensive wait
**GIVEN** AuthEmailPasswordE2ETests.swift tests email/password auth
**WHEN** reviewing the test code
**THEN** the test already waits for the email field at lines 32-33
**VERIFY:** `sed -n '32,33p' ios/LaneShadowUITests/AuthEmailPasswordE2ETests.swift` shows `waitForExistence` for email field

## Test Criteria

| ID | Statement | Maps To | Verify |
|----|-----------|---------|--------|
| TC-1 | Registration test waits for email field before sign-up link | AC-1 | `grep -B2 -A2 'auth.signUp.entry'` shows explicit wait |
| TC-2 | Ordering dependency is documented in test code | AC-2 | `grep -c 'Create Account link only appears'` returns 1 |
| TC-3 | E2E tests compile successfully | AC-1 | `xcodebuild build-for-testing` exits 0 |

## Reading List

| Path | Lines | Focus |
|------|-------|-------|
| `ios/LaneShadowUITests/AuthRegistrationE2ETests.swift` | 27-46 | Find the tap sequence: `auth.signIn.continueWithEmail` → `auth.signUp.entry`. Identify where implicit wait happens |
| `ios/LaneShadowUITests/AuthEmailPasswordE2ETests.swift` | 28-42 | Verify lines 32-33 already have the email field wait pattern |
| `ios/LaneShadow/Features/Auth/AuthScreen.swift` | 404-416 | Confirm `auth.signUp.entry` only renders when `viewModel.mode != .entry` |
| `ios/LaneShadow/Features/Auth/SignInScreen.swift` | 26-39 | Verify `showsSignUpEntry: true` and the navigation to SignUpScreen |

## Guardrails

**WRITE-ALLOWED:**
- `ios/LaneShadowUITests/AuthRegistrationE2ETests.swift` (MODIFY)

**WRITE-PROHIBITED:**
- `ios/LaneShadow/Features/Auth/AuthScreen.swift` — production code
- `ios/LaneShadow/Features/Auth/SignInScreen.swift` — production code
- `ios/LaneShadow/Features/Auth/SignUpScreen.swift` — production code
- Any file under `ios/LaneShadow/` outside of test directories

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| iOS E2E tests compile | `cd ios && xcodebuild build-for-testing -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet 2>&1 \| tail -5` | BUILD SUCCEEDED, exit 0 |
| Registration test has defensive wait | `grep -B2 'auth.signUp.entry' ios/LaneShadowUITests/AuthRegistrationE2ETests.swift` | Shows email field wait before sign-up entry tap |

## Agent Assignment

**swift-implementer** — owns iOS E2E test code; can read production screens for identifier verification

## Dependencies

- **Depends on:** none
- **Blocks:** Sprint 04

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Registration flow waits for email entry state before accessing sign-up link", "verify": "grep shows wait for auth.signIn.email before auth.signUp.entry tap" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Ordering dependency is documented in test code", "verify": "grep returns comment explaining Create Account link dependency" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Email password test already has defensive wait", "verify": "lines 32-33 of AuthEmailPasswordE2ETests.swift show email field wait" },
    { "id": "TC-1", "type": "test_criterion", "description": "Registration test waits for email field before sign-up link", "maps_to_ac": "AC-1", "verify": "grep -B2 -A2 auth.signUp.entry shows explicit wait" },
    { "id": "TC-2", "type": "test_criterion", "description": "Ordering dependency is documented", "maps_to_ac": "AC-2", "verify": "grep -c 'Create Account link only appears' returns 1" },
    { "id": "TC-3", "type": "test_criterion", "description": "E2E tests compile successfully", "maps_to_ac": "AC-1", "verify": "xcodebuild build-for-testing exits 0" }
  ]
}
-->
