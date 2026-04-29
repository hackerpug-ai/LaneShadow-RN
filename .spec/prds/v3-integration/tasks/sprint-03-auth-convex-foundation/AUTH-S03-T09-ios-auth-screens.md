================================================================================
TASK: AUTH-S03-T09 - iOS SignInScreen + SignUpScreen + OAuthCallbackScreen
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15'
  typecheck: cd ios && xcodebuild -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15' build
  lint:      cd ios && swiftlint lint --path LaneShadow

PROGRESS: 0/7 AC · not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Create iOS auth screens composed from V2 atoms + new LSAuthProviderButton molecule, implementing multi-step email-then-password flow.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST reuse V2 atoms (LSTextField, LSButton, LSText, LSSpinner)
- MUST create LSAuthProviderButton molecule for OAuth buttons
- MUST implement multi-step flow: email → password → submit
- MUST match iOS visual design system (spacing, colors, typography)
- MUST handle loading states during async auth operations
- MUST display errors via LSText with danger color
- MUST include background image matching design spec
- MUST compile successfully with xcodebuild build

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] SignInScreen.swift exists with multi-step flow (evidence: ios/LaneShadow/Features/Auth/SignInScreen.swift:20)
- [x] Email step shows email LSTextField with validation (evidence: ios/LaneShadow/Features/Auth/SignInScreen.swift:21; ios/LaneShadow/Features/Auth/ViewModels/SignInViewModel.swift:19)
- [ ] Password step shows password LSTextField with visibility toggle ← FAIL: no visibility toggle implemented (evidence: ios/LaneShadow/Features/Auth/SignInScreen.swift:28)
- [x] Submitting state shows LSSpainer during auth (evidence: ios/LaneShadow/Features/Auth/SignInScreen.swift:36)
- [x] LSAuthProviderButton molecule exists for Google/Apple (evidence: ios/LaneShadow/DesignSystem/Molecules/LSAuthProviderButton.swift:27)
- [x] SignUpScreen variant exists with name + confirm password (evidence: ios/LaneShadow/Features/Auth/SignUpScreen.swift:16)
- [ ] OAuthCallbackScreen exists for deep-link handling ← FAIL: does not complete auth or route; AuthFlow passes `callbackURL: nil` so it can never succeed (evidence: ios/LaneShadow/Features/Auth/OAuthCallbackScreen.swift:31; ios/LaneShadow/Views/AuthFlow/AuthFlowView.swift:15)
- [ ] Background image applied per design spec ← PARTIAL: falls back to SF Symbol (`mountain.2.fill`) when asset missing (evidence: ios/LaneShadow/Features/Auth/SignInScreen.swift:88)
- [x] Errors display via LSText danger color (evidence: ios/LaneShadow/Features/Auth/SignInScreen.swift:41)
- [x] All V2 atoms reused (no custom UI components) (evidence: ios/LaneShadow/Features/Auth/SignInScreen.swift:21)
- [x] xcodebuild build succeeds (evidence: `cd ios && xcodebuild ... build` exit 0 on 2026-04-29)
- [ ] Only SCOPE.writeAllowed files modified ← FAIL: modified out-of-scope files `ai-specs/AUTH-S03-T09/ios-learnings.md`, `ios/LaneShadow/Views/AuthFlow/*`, `ios/LaneShadowTests/Integration/AuthScreensTests.swift` (evidence: git diff --name-only 7d2d1b10^..7d2d1b10)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: SignInScreen implements 4-step flow [PRIMARY]
  GIVEN: User opens sign-in screen
  WHEN:  User progresses through sign-in
  THEN:  Flow is: email entry → password entry → submitting → signed in

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Features/Auth/SignInScreen.swift
  TEST_FUNCTION: struct SignInScreen: View with step state machine

AC-2: V2 atoms composition
  GIVEN: SignInScreen needs UI components
  WHEN:  Screen renders text fields and buttons
  THEN:  All elements use V2 atoms (LSTextField, LSButton, LSText, LSSpinner)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Features/Auth/SignInScreen.swift
  TEST_FUNCTION: V2 atoms used for all UI elements

AC-3: LSAuthProviderButton molecule created [PRIMARY]
  GIVEN: OAuth buttons needed for Google/Apple sign-in
  WHEN:  Developer creates LSAuthProviderButton
  THEN:  Molecule composes V2 atoms with provider icon and label

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/DesignSystem/Molecules/LSAuthProviderButton.swift
  TEST_FUNCTION: struct LSAuthProviderButton: View with provider parameter

AC-4: SignUpScreen variant
  GIVEN: User selects sign-up option
  WHEN:  SignUpScreen renders
  THEN:  Screen includes name field, email, password, confirm password

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Features/Auth/SignUpScreen.swift
  TEST_FUNCTION: struct SignUpScreen: View with additional fields

AC-5: OAuthCallbackScreen handles deep-links
  GIVEN: OAuth provider redirects back to app
  WHEN:  OAuthCallbackScreen receives callback URL
  THEN:  Screen parses token, completes auth, routes to main app

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Features/Auth/OAuthCallbackScreen.swift
  TEST_FUNCTION: struct OAuthCallbackScreen: View with URL parsing

AC-6: Background image applied
  GIVEN: Design spec requires background image
  WHEN:  Auth screens render
  THEN:  Background image displays behind all UI elements

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Features/Auth/SignInScreen.swift
  TEST_FUNCTION: background modifier with Image asset

AC-7: Error display via LSText danger color
  GIVEN: Auth operation fails with error message
  WHEN:  Error state occurs
  THEN:  LSText displays error message with .danger color

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Features/Auth/SignInScreen.swift
  TEST_FUNCTION: LSText(errorMessage, color: .danger)

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Features/Auth/SignInScreen.swift (CREATE)
- ios/LaneShadow/Features/Auth/SignUpScreen.swift (CREATE)
- ios/LaneShadow/Features/Auth/OAuthCallbackScreen.swift (CREATE)
- ios/LaneShadow/DesignSystem/Molecules/LSAuthProviderButton.swift (CREATE)
- ios/LaneShadow/Features/Auth/Models/SignInStep.swift (CREATE — step enum)
- ios/LaneShadow/Features/Auth/Models/SignUpField.swift (CREATE — field state)
- ios/LaneShadow/Features/Auth/ViewModels/SignInViewModel.swift (CREATE or MODIFY)

writeProhibited:
- Do not create custom UI components that duplicate V2 atoms
- Do not modify V2 atoms to accommodate auth screens
- Do not bypass multi-step flow for single-form approach

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Reuse V2 atoms for all UI elements
- Implement multi-step flow (email → password → submit)
- Use LSAuthProviderButton for OAuth buttons
- Display errors via LSText with danger color
- Apply background image per design spec

⚠️ Ask First:
- If V2 atoms lack required functionality (discuss with design)
- If OAuth flow requires special handling beyond callback screen
- If background image asset location differs from expectations

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Features/Auth/SignInScreen.swift (CREATE): Multi-step sign-in
- ios/LaneShadow/Features/Auth/SignUpScreen.swift (CREATE): Sign-up variant
- ios/LaneShadow/Features/Auth/OAuthCallbackScreen.swift (CREATE): OAuth handling
- ios/LaneShadow/DesignSystem/Molecules/LSAuthProviderButton.swift (CREATE): OAuth button
- ios/LaneShadow/Features/Auth/Models/SignInStep.swift (CREATE): Step enum
- ios/LaneShadow/Features/Auth/Models/SignUpField.swift (CREATE): Field state
- ios/LaneShadow/Features/Auth/ViewModels/SignInViewModel.swift (CREATE or MODIFY): Logic

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

Follow standard RED/GREEN/REFACTOR cycle per AC.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/ios-architecture.md [PRIMARY PATTERN]
   - Sections: § 4 (Auth Screens), § 5 (V2 Atoms)
   - Focus: Screen composition, atom reuse, multi-step patterns

2. ios/LaneShadow/DesignSystem/Atoms/ (V2 atom implementations)
   - Focus: LSTextField, LSButton, LSText, LSSpinner APIs

3. ios/LaneShadow/Features/Auth/ (existing auth structure)
   - Focus: AuthViewModel, existing navigation patterns

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
Gate 2: Each AC has a test
Gate 3: Swift compilation
  Command: cd ios && xcodebuild -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15' build
  Expected: Exit 0.
Gate 4: Scope compliance
  Command: git diff --name-only

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: AUTH-S03-T07
Blocks: none

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "AUTH-S03-T09",
  "requirements": [
    {"id": "AC-1", "type": "acceptance", "description": "Flow is: email entry → password entry → submitting → signed in", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance", "description": "All elements use V2 atoms (LSTextField, LSButton, LSText, LSSpinner)", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance", "description": "Molecule composes V2 atoms with provider icon and label", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance", "description": "Screen includes name field, email, password, confirm password", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance", "description": "Screen parses token, completes auth, routes to main app", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance", "description": "Background image displays behind all UI elements", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-7", "type": "acceptance", "description": "LSText displays error message with .danger color", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test", "description": "SignInScreen.swift exists with step state machine", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test", "description": "V2 atoms used for all UI elements", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test", "description": "LSAuthProviderButton.swift molecule exists", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test", "description": "SignUpScreen.swift exists with additional fields", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test", "description": "OAuthCallbackScreen.swift handles deep-links", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test", "description": "Background image applied", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-7", "type": "test", "description": "Error display uses LSText danger color", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-8", "type": "test", "description": "Code compiles without errors", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
