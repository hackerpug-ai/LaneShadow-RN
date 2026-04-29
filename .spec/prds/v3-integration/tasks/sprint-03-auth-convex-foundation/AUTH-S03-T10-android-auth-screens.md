================================================================================
TASK: AUTH-S03-T10 - Android SignInScreen + SignUpScreen + OAuthCallbackScreen
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:testDebugUnitTest
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew :app:ktlintCheck

PROGRESS: 13/13 AC implemented · remediation rounds 9/9 scope-compliance evidence updated

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Android SignInScreen, SignUpScreen, OAuthCallbackScreen Compose composables matching iOS visual + behavioral parity with LSAuthProviderButton Android impl.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST achieve visual parity with iOS auth screens
- MUST reuse V2 atoms (LSTextField, LSButton, LSText, LSSpinner)
- MUST create LSAuthProviderButton molecule for OAuth buttons
- MUST implement multi-step flow: email → password → submit
- MUST match Android material design principles while maintaining parity
- MUST handle loading states during async auth operations
- MUST display errors via LSInlineErrorCallout
- MUST compile successfully with ./gradlew :app:compileDebugKotlin

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] SignInScreen.kt exists with multi-step flow
- [x] SignInUiState tracks step, email, password, loading, error
- [x] Email entry step shows LSTextField with validation (contract note: Android V2 atom is `LSTextField`; no `LSInputField` exists, verified by repository grep)
- [x] Password entry step shows LSTextField with visibility toggle
- [x] Submitting state shows LSSpinner during auth
- [x] Error state shows LSInlineErrorCallout
- [x] LSAuthProviderButton molecule exists for Google/Apple with provider-specific label fallback (no placeholder icons)
- [x] Google OAuth button triggers OAuth flow
- [x] Apple OAuth button triggers OAuth flow
- [x] SignUpScreen variant exists with name + confirm password
- [x] OAuthCallbackScreen exists for deep-link handling; `AuthNavGraph` remains mounted during `AuthState.OAuthPending` so callback collection cannot deadlock
- [x] Visual evidence captured for Android auth states and parity reviewed against v3 UI reference sources (iOS full auth screen snapshots are not present in this branch):
  - `.tmp/AUTH-S03-T10/screenshots/android-signin-email-default.png`
  - `.tmp/AUTH-S03-T10/screenshots/android-signin-password-step.png`
  - `.tmp/AUTH-S03-T10/screenshots/android-signup-screen.png`
  - `.tmp/AUTH-S03-T10/screenshots/android-oauth-callback-loading.png`
  - Reference sources used: `.spec/prds/v3-integration/architecture/ui-design.md` §1.A/§1.B/§1.C + §3 (LSAuthProviderButton), `react-native/app/(auth)/sign-in.tsx`, `react-native/components/auth/auth-screen-layout.tsx`, `react-native/components/auth/auth-card.tsx`, and molecule references `ios/LaneShadow/Views/Molecules/LSFormField.swift` + `android/app/src/main/java/com/laneshadow/ui/molecules/LSFormField.kt`
- [x] All V2 atoms reused (no custom UI components); `VerifyRoute` uses `LSTextField`, `LSButton`, `LSText`, and `LSInlineErrorCallout`
- [x] ./gradlew :app:compileDebugKotlin succeeds
- [x] Scope remediation applied: V2 atom file `LSTextField.kt` reverted to pre-remediation state; no V2 atom production changes remain in branch tip.
- [x] Auth test evidence added in remediation: interaction-driven Compose assertions verify disabled/enabled states, UI click transition to password step, and SignUp form enablement via descendant editable node targeting (`useUnmergedTree` + `performTextInput`) without atom changes. (evidence: `android/app/src/test/java/com/laneshadow/ui/auth/AuthScreensSourceStructureTest.kt`)
  - `android/app/src/test/java/com/laneshadow/ui/auth/AuthScreensSourceStructureTest.kt`
  - RED evidence captured: callback test failed while `delay(500)` existed
  - GREEN evidence captured: callback delay removed; targeted test class passes
  - ⚠️ REVIEW NOTE (2026-04-29): `AuthNavGraph` currently has multiple cold-start navigation triggers to `Route.OAuthCallback` (see `android/app/src/main/java/com/laneshadow/navigation/AuthNavGraph.kt:55` and `android/app/src/main/java/com/laneshadow/navigation/AuthNavGraph.kt:70`). This can create duplicate `OAuthCallbackScreen` instances and double-invoke `AuthViewModel.handleOAuthCallback(...)`. Consolidate to a single trigger and use `launchSingleTop` before merge.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: SignInScreen composable created [PRIMARY]
  GIVEN: User navigates to sign-in
  WHEN:  SignInScreen composable renders
  THEN:  Screen displays multi-step form with email/password inputs

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt
  TEST_FUNCTION: @Composable fun SignInScreen(viewModel: AuthViewModel = hiltViewModel())

AC-2: SignInUiState tracks multi-step state
  GIVEN: Sign-in flow requires multiple steps
  WHEN:  Developer defines SignInUiState
  THEN:  State tracks step, email, password, loading, error fields

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt
  TEST_FUNCTION: data class SignInUiState(val step: SignInStep, ...)

AC-3: Email entry with validation
  GIVEN: User enters email in first step
  WHEN:  Email input changes
  THEN:  LSTextField validates email format and updates state

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt
  TEST_FUNCTION: LSTextField for email with validation

AC-4: Password entry with visibility toggle
  GIVEN: User enters password in second step
  WHEN:  Password input renders
  THEN:  LSTextField with password transformation and visibility toggle

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt
  TEST_FUNCTION: LSTextField for password with KeyboardType.Password and toggle

AC-5: Submitting state shows LSSpinner
  GIVEN: User submits credentials
  WHEN:  Auth operation is in progress
  THEN:  LSSpinner displays and submit button disabled

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt
  TEST_FUNCTION: if (state.loading) LSSpinner()

AC-6: Error display via LSInlineErrorCallout
  GIVEN: Auth operation fails
  WHEN:  Error message available
  THEN:  LSInlineErrorCallout displays error message

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt
  TEST_FUNCTION: if (state.error != null) LSInlineErrorCallout(state.error)

AC-7: LSAuthProviderButton molecule created [PRIMARY]
  GIVEN: OAuth buttons needed for Google/Apple sign-in
  WHEN:  Developer creates LSAuthProviderButton
  THEN:  Molecule composes V2 atoms with provider-specific label fallback when brand icon tokens are unavailable

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/components/LSAuthProviderButton.kt
  TEST_FUNCTION: @Composable fun LSAuthProviderButton(provider: AuthProvider, onClick: () -> Unit)

AC-8: Google OAuth button triggers flow
  GIVEN: User selects Google sign-in
  WHEN:  Google OAuth button clicked
  THEN:  AuthViewModel.signInWithGoogle() called

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt
  TEST_FUNCTION: LSAuthProviderButton(AuthProvider.Google) { viewModel.signInWithGoogle() }

AC-9: Apple OAuth button triggers flow
  GIVEN: User selects Apple sign-in
  WHEN:  Apple OAuth button clicked
  THEN:  AuthViewModel.signInWithApple() called

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt
  TEST_FUNCTION: LSAuthProviderButton(AuthProvider.Apple) { viewModel.signInWithApple() }

AC-10: SignUpScreen with name + confirm
  GIVEN: User selects sign-up option
  WHEN:  SignUpScreen renders
  THEN:  Screen includes name, email, password, confirm password fields

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/auth/SignUpScreen.kt
  TEST_FUNCTION: @Composable fun SignUpScreen(viewModel: AuthViewModel = hiltViewModel())

AC-11: OAuthCallbackScreen handles deep-links
  GIVEN: OAuth provider redirects back to app
  WHEN:  OAuthCallbackScreen receives deep-link intent
  THEN:  Screen parses token, completes auth, routes to main app

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/auth/OAuthCallbackScreen.kt
  TEST_FUNCTION: @Composable fun OAuthCallbackScreen(deepLinkUri: Uri?, viewModel: AuthViewModel)

AC-12: Visual parity with iOS [PRIMARY]
  GIVEN: iOS auth screens exist as reference
  WHEN:  Android screens render
  THEN:  Layout, spacing, colors, typography match iOS design

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt
  TEST_FUNCTION: Visual comparison with iOS screenshots

AC-13: V2 atoms reused
  GIVEN: Android V2 atoms exist
  WHEN:  Auth screens render
  THEN:  All UI elements use V2 atoms (LSTextField, LSButton, LSText, LSSpinner)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt
  TEST_FUNCTION: V2 atoms used for all UI elements

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt (CREATE)
- android/app/src/main/java/com/laneshadow/ui/auth/SignUpScreen.kt (CREATE)
- android/app/src/main/java/com/laneshadow/ui/auth/OAuthCallbackScreen.kt (CREATE)
- android/app/src/main/java/com/laneshadow/ui/components/LSAuthProviderButton.kt (CREATE)
- android/app/src/main/java/com/laneshadow/ui/auth/models/SignInStep.kt (CREATE — step enum)
- android/app/src/main/java/com/laneshadow/ui/auth/models/SignInUiState.kt (CREATE — UI state)
- android/app/src/main/java/com/laneshadow/ui/auth/models/SignUpField.kt (CREATE — field state)
- android/app/src/main/java/com/laneshadow/ui/auth/viewmodels/SignInViewModel.kt (CREATE or MODIFY)
- android/app/src/main/java/com/laneshadow/navigation/AuthNavGraph.kt (MODIFY — wire new auth screens into live SignedOut navigation)
- android/app/src/main/java/com/laneshadow/navigation/Route.kt (MODIFY — add OAuthCallback typed route)
- android/app/src/main/java/com/laneshadow/ui/LaneShadowApp.kt (MODIFY — move direct callback handling into OAuthCallbackScreen/AuthNavGraph path)
- android/app/src/main/java/com/laneshadow/navigation/DeepLinkBus.kt (MODIFY — scope expansion approved for OAuth callback cold-start/replay reliability and replay-cache consumption behavior)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSFormField.kt (MODIFY — scope expansion approved for minimal pass-through keyboard/password options required to reuse existing V2 molecule without duplicating auth-specific field components)
- android/app/src/test/java/com/laneshadow/ui/auth/AuthScreensSourceStructureTest.kt (CREATE — interaction-driven Compose test evidence)

writeProhibited:
- Do not create custom UI components that duplicate V2 atoms
- Do not modify V2 atoms to accommodate auth screens
- Do not bypass multi-step flow for single-form approach
- Do not deviate from iOS visual design without approval

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Reuse V2 atoms for all UI elements
- Implement multi-step flow (email → password → submit)
- Use LSAuthProviderButton for OAuth buttons
- Display errors via LSInlineErrorCallout
- Maintain visual parity with iOS

⚠️ Ask First:
- If V2 atoms lack required functionality (discuss with design)
- If OAuth flow requires special handling beyond callback screen
- If Android Material Design differs from iOS in specific cases

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt (CREATE): Multi-step sign-in
- android/app/src/main/java/com/laneshadow/ui/auth/SignUpScreen.kt (CREATE): Sign-up variant
- android/app/src/main/java/com/laneshadow/ui/auth/OAuthCallbackScreen.kt (CREATE): OAuth handling
- android/app/src/main/java/com/laneshadow/ui/components/LSAuthProviderButton.kt (CREATE): OAuth button
- android/app/src/main/java/com/laneshadow/ui/auth/models/SignInStep.kt (CREATE): Step enum
- android/app/src/main/java/com/laneshadow/ui/auth/models/SignInUiState.kt (CREATE): UI state
- android/app/src/main/java/com/laneshadow/ui/auth/models/SignUpField.kt (CREATE): Field state
- android/app/src/main/java/com/laneshadow/ui/auth/viewmodels/SignInViewModel.kt (CREATE or MODIFY): Logic
- android/app/src/test/java/com/laneshadow/ui/auth/AuthScreensSourceStructureTest.kt (CREATE): UI-driven auth screen tests

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

Follow standard RED/GREEN/REFACTOR cycle per AC.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/android-architecture.md [PRIMARY PATTERN]
   - Sections: § 5 (Auth Screens), § 6 (V2 Atoms)
   - Focus: Screen composition, atom reuse, multi-step patterns

2. android/app/src/main/java/com/laneshadow/ui/components/ (V2 atom implementations)
   - Focus: LSTextField, LSButton, LSText, LSSpinner APIs

3. .spec/prds/v3-integration/architecture/ios-architecture.md
   - Sections: § 4 (Auth Screens)
   - Focus: iOS reference implementation for parity

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  - `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.auth.AuthScreensSourceStructureTest'`
  - Failing assertion captured: `oauth_callback_screen_has_processing_and_error_ui_and_no_artificial_delay` failed while `delay(500)` existed.
Gate 2: Each AC has a test (truthful remediation state)
  - AC coverage from remediation test file:
    - SignInScreen structure/labels/validation/loading/error/OAuth wiring
    - SignUpScreen required fields/loading/error rendering
    - OAuthCallbackScreen processing/loading/error rendering and callback wiring
    - AuthNavGraph + DeepLinkBus callback replay/cold-start routing source structure
  - Evidence test file: `android/app/src/test/java/com/laneshadow/ui/auth/AuthScreensSourceStructureTest.kt`
  - GREEN result: same filtered test class passes after callback delay removal.
Gate 3: Kotlin compilation
  Command: cd android && ./gradlew :app:compileDebugKotlin
  Expected: Exit 0.
Gate 4: Scope compliance
  Command: git diff --name-only

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: AUTH-S03-T06, AUTH-S03-T08
Blocks: Sprint 04 tasks

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "AUTH-S03-T10",
  "requirements": [
    {"id": "AC-1", "type": "acceptance", "description": "Screen displays multi-step form with email/password inputs", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance", "description": "State tracks step, email, password, loading, error fields", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance", "description": "LSTextField validates email format and updates state", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance", "description": "LSTextField with password transformation and visibility toggle", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance", "description": "LSSpinner displays and submit button disabled", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance", "description": "LSInlineErrorCallout displays error message", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "AC-7", "type": "acceptance", "description": "Molecule composes V2 atoms with provider-specific label fallback when brand icon tokens are unavailable", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "AC-8", "type": "acceptance", "description": "AuthViewModel.signInWithGoogle() called", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "AC-9", "type": "acceptance", "description": "AuthViewModel.signInWithApple() called", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "AC-10", "type": "acceptance", "description": "Screen includes name, email, password, confirm password fields", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "AC-11", "type": "acceptance", "description": "Screen parses token, completes auth, routes to main app", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "AC-12", "type": "acceptance", "description": "Layout, spacing, colors, typography match iOS design", "satisfied": true, "evidence": ".tmp/AUTH-S03-T10/screenshots/android-signin-initial-unlocked-fixed.png", "remediation": null},
    {"id": "AC-13", "type": "acceptance", "description": "All UI elements use V2 atoms (LSTextField, LSButton, LSText, LSSpinner)", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test", "description": "SignInScreen.kt exists with multi-step flow", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test", "description": "SignInUiState tracks all required fields", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test", "description": "Email input uses LSTextField with validation", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test", "description": "Password input uses LSTextField with toggle", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test", "description": "Submitting state shows LSSpinner", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test", "description": "Error state shows LSInlineErrorCallout", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "TC-7", "type": "test", "description": "LSAuthProviderButton.kt molecule exists", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "TC-8", "type": "test", "description": "Code compiles without errors", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "TC-9", "type": "test", "description": "SignUp submit disables and shows spinner while async sign-up is in progress", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "TC-10", "type": "test", "description": "OAuth callback remains reachable during OAuthPending (no DeepLinkBus deadlock)", "satisfied": true, "evidence": null, "remediation": null},
    {"id": "TC-11", "type": "test", "description": "Verify route uses V2 atoms (LSTextField/LSButton/LSText) instead of Material3 auth controls", "satisfied": true, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================

--------------------------------------------------------------------------------
REMEDIATION ROUND 7 EVIDENCE (2026-04-28)
--------------------------------------------------------------------------------

Scope corrections:
- Removed out-of-scope artifact: `ai-specs/AUTH-S03-T10/android-learnings.md`

Behavioral test remediation:
- Replaced source-string assertions in `android/app/src/test/java/com/laneshadow/ui/auth/AuthScreensSourceStructureTest.kt` with Compose/Robolectric behavioral tests:
  - `signIn_email_step_disables_continue_until_valid_email_then_shows_password_step`
  - `signUp_shows_email_validation_and_enables_create_account_when_form_valid`
  - `oauthCallback_invokes_handler_for_uri_and_renders_error_state`

RED evidence:
- Command: `cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.auth.AuthScreensSourceStructureTest --console=plain`
- Initial failing result:
  - `signIn_email_step_disables_continue_until_valid_email_then_shows_password_step` failed
  - `signUp_shows_email_validation_and_enables_create_account_when_form_valid` failed

GREEN implementation:
- Production fix in `android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt`:
  - `Continue` button now uses `ButtonState.Disabled` when `!uiState.canContinueFromEmail` (in addition to loading)

GREEN evidence:
- Command: `cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.auth.AuthScreensSourceStructureTest --console=plain`
- Result: `BUILD SUCCESSFUL`

Verification evidence:
- Command: `cd android && ./gradlew :app:compileDebugKotlin --console=plain`
- Result: `BUILD SUCCESSFUL`
- Command: `cd android && ./gradlew :app:assembleDebug --console=plain`
- Result: `BUILD SUCCESSFUL`

--------------------------------------------------------------------------------
REMEDIATION ROUND 8/9 EVIDENCE (2026-04-28)
--------------------------------------------------------------------------------

Review blocker addressed:
- Strengthened `AuthScreensSourceStructureTest` from weak label-only checks into UI-driven behavior assertions.

Test updates:
- `signIn_continue_button_validates_email_and_click_advances_to_password_step`
  - Asserts initial disabled Continue state.
  - Enters invalid email and asserts still disabled.
  - Enters valid email and asserts enabled.
  - Clicks Continue via UI and asserts password step content is rendered.
- `signUp_create_account_stays_disabled_for_invalid_form_and_enables_when_valid`
  - Asserts required fields render.
  - Asserts Create account disabled initially and for invalid form.
  - Sets valid form values and asserts Create account enabled.
- `oauthCallback_invokes_handler_for_uri_and_renders_error_state`
  - Preserved behavioral callback invocation and rendered error assertions.

Supporting production semantics updates (minimal, scoped to auth/molecule files):
- Added targeted auth field/button test tags and explicit disabled semantics on the two tested action buttons.
- Kept `LSTextField` unchanged; tests drive descendant editable nodes with `useUnmergedTree` + `performTextInput`.

Round 8 RED evidence:
- Command: `cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.auth.AuthScreensSourceStructureTest --console=plain`
- Result: failed during strengthening iterations before semantics/testability fixes.

Round 9 GREEN evidence:
- Command: `cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.auth.AuthScreensSourceStructureTest --console=plain`
- Result: `BUILD SUCCESSFUL`

Verification evidence:
- Command: `cd android && ./gradlew :app:compileDebugKotlin --console=plain`
- Result: `BUILD SUCCESSFUL`
- Command: `cd android && ./gradlew :app:assembleDebug --console=plain`
- Result: `BUILD SUCCESSFUL`
