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

PROGRESS: 0/13 AC · not started

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
- [ ] Visual parity verified with iOS screenshots ← BLOCKED: emulator screenshot capture unavailable in this remediation cycle; build/compile/test evidence provided
- [x] All V2 atoms reused (no custom UI components); `VerifyRoute` uses `LSTextField`, `LSButton`, `LSText`, and `LSInlineErrorCallout`
- [x] ./gradlew :app:compileDebugKotlin succeeds
- [x] Only SCOPE.writeAllowed production files modified; task file updates are orchestration metadata remediation requested in reviewer blockers

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
Gate 2: Each AC has a test
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
    {"id": "AC-1", "type": "acceptance", "description": "Screen displays multi-step form with email/password inputs", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance", "description": "State tracks step, email, password, loading, error fields", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance", "description": "LSTextField validates email format and updates state", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance", "description": "LSTextField with password transformation and visibility toggle", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance", "description": "LSSpinner displays and submit button disabled", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance", "description": "LSInlineErrorCallout displays error message", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-7", "type": "acceptance", "description": "Molecule composes V2 atoms with provider icon and label", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-8", "type": "acceptance", "description": "AuthViewModel.signInWithGoogle() called", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-9", "type": "acceptance", "description": "AuthViewModel.signInWithApple() called", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-10", "type": "acceptance", "description": "Screen includes name, email, password, confirm password fields", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-11", "type": "acceptance", "description": "Screen parses token, completes auth, routes to main app", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-12", "type": "acceptance", "description": "Layout, spacing, colors, typography match iOS design", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-13", "type": "acceptance", "description": "All UI elements use V2 atoms (LSTextField, LSButton, LSText, LSSpinner)", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test", "description": "SignInScreen.kt exists with multi-step flow", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test", "description": "SignInUiState tracks all required fields", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test", "description": "Email input uses LSTextField with validation", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test", "description": "Password input uses LSTextField with toggle", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test", "description": "Submitting state shows LSSpinner", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test", "description": "Error state shows LSInlineErrorCallout", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-7", "type": "test", "description": "LSAuthProviderButton.kt molecule exists", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-8", "type": "test", "description": "Code compiles without errors", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-9", "type": "test", "description": "SignUp submit disables and shows spinner while async sign-up is in progress", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-10", "type": "test", "description": "OAuth callback remains reachable during OAuthPending (no DeepLinkBus deadlock)", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-11", "type": "test", "description": "Verify route uses V2 atoms (LSTextField/LSButton/LSText) instead of Material3 auth controls", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
