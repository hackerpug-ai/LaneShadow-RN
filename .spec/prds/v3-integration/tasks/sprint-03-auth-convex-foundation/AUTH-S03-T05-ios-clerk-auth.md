================================================================================
TASK: AUTH-S03-T05 - iOS ClerkAuth
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: 0/7 AC · not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Create iOS Clerk auth service with email/password, Apple Sign-In, and Google OAuth flows using clerk-ios SDK.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use clerk-ios SDK via SPM
- MUST implement @Observable wrapper over Clerk SDK
- MUST expose signIn/signUp/signInWithApple/signInWithGoogle/signOut/getJWT methods
- MUST implement ClerkAuthProvider conforming to ConvexMobile AuthProvider protocol
- MUST add laneshadow URL scheme to Info.plist for OAuth callbacks

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] ClerkAuth.swift @Observable service created
- [ ] ClerkAuthProvider.swift conforms to ConvexMobile AuthProvider
- [ ] Email/password auth flow implemented
- [ ] Apple Sign-In OAuth flow implemented
- [ ] Google OAuth flow implemented
- [ ] Info.plist includes laneshadow URL scheme
- [ ] iOS build passes
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: clerk-ios SPM package integrated
  GIVEN: iOS project uses Xcode project.yml configuration
  WHEN:  Developer adds clerk-ios package dependency
  THEN:  SPM package resolves and links successfully

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/ClerkAuthTests.swift
  TEST_FUNCTION: testClerkIOSPackageIntegrated

AC-2: ClerkAuth @Observable wrapper created [PRIMARY]
  GIVEN: clerk-ios SDK is available
  WHEN:  Developer creates ClerkAuth.swift service
  THEN:  @Observable wrapper exposes Clerk SDK methods

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/ClerkAuthTests.swift
  TEST_FUNCTION: testClerkAuthObservableWrapperCreated

AC-3: Email/password auth flow implemented [PRIMARY]
  GIVEN: ClerkAuth service exists
  WHEN:  Developer calls signIn(email:password:) or signUp(email:password:name:)
  THEN:  Auth flow completes and currentUser updates

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/ClerkAuthTests.swift
  TEST_FUNCTION: testEmailPasswordAuthFlowImplemented

AC-4: Apple Sign-In OAuth flow implemented [PRIMARY]
  GIVEN: ClerkAuth service exists
  WHEN:  Developer calls signInWithApple()
  THEN:  OAuth flow completes via Apple and currentUser updates

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/ClerkAuthTests.swift
  TEST_FUNCTION: testAppleSignInOAuthFlowImplemented

AC-5: Google OAuth flow implemented [PRIMARY]
  GIVEN: ClerkAuth service exists
  WHEN:  Developer calls signInWithGoogle()
  THEN:  OAuth flow completes via Google and currentUser updates

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/ClerkAuthTests.swift
  TEST_FUNCTION: testGoogleOAuthFlowImplemented

AC-6: ClerkAuthProvider conforms to ConvexMobile AuthProvider [PRIMARY]
  GIVEN: ConvexMobile SDK requires AuthProvider protocol
  WHEN:  Developer creates ClerkAuthProvider.swift
  THEN:  ClerkAuthProvider implements required protocol methods

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/ClerkAuthTests.swift
  TEST_FUNCTION: testClerkAuthProviderConformsToConvexMobile

AC-7: Info.plist includes laneshadow URL scheme
  GIVEN: OAuth callbacks require deep link handling
  WHEN:  Developer updates Info.plist
  THEN:  CFBundleURLSchemes includes laneshadow

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/ClerkAuthTests.swift
  TEST_FUNCTION: testInfoPlistIncludesLaneshadowURLScheme

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/project.yml (MODIFY — add clerk-ios SPM dependency)
- ios/LaneShadow/Services/ClerkAuth.swift (CREATE)
- ios/LaneShadow/Services/ClerkAuthProvider.swift (CREATE)
- ios/LaneShadow/Info.plist (MODIFY — add laneshadow URL scheme)
- ios/LaneShadowTests/Integration/ClerkAuthTests.swift (CREATE)

writeProhibited:
- ios/LaneShadow/Keychain/ — Clerk SDK handles Keychain storage automatically

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Read ios-architecture.md § 2 (Auth Stack) before implementing
- Use Clerk SDK's built-in Keychain storage (no custom wrapper needed)
- Run iOS build after changes to verify compilation

⚠️ Ask First:
- If clerk-ios SPM package version conflicts with existing dependencies
- If OAuth provider setup requires additional Info.plist entries

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/project.yml (MODIFY): Add clerk-ios SPM dependency
- ios/LaneShadow/Services/ClerkAuth.swift (CREATE): @Observable Clerk wrapper
- ios/LaneShadow/Services/ClerkAuthProvider.swift (CREATE): ConvexMobile AuthProvider conformance
- ios/LaneShadow/Info.plist (MODIFY): Add laneshadow URL scheme
- ios/LaneShadowTests/Integration/ClerkAuthTests.swift (CREATE): Integration tests

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

Follow standard RED/GREEN/REFACTOR cycle per AC. See AUTH-S03-T03 for full TDD template.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/ios-architecture.md [PRIMARY PATTERN]
   - Section: § 2 (Auth Stack)
   - Focus: ClerkAuth @Observable design, ClerkAuthProvider protocol, token storage

2. .spec/prds/v3-integration/04-uc-auth.md
   - Sections: UC-AUTH-01 (7 ACs), UC-AUTH-02 (5 ACs), UC-AUTH-04 (5 ACs)

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
Gate 2: Each AC has a test
Gate 3: iOS build passes
  Command: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet build
  Expected: Exit 0.
Gate 4: Scope compliance
  Command: git diff --name-only

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: AUTH-S03-T03
Blocks: AUTH-S03-T07

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "AUTH-S03-T05",
  "requirements": [
    {"id": "AC-1", "type": "acceptance", "description": "SPM package resolves and links successfully", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance", "description": "@Observable wrapper exposes Clerk SDK methods", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance", "description": "Auth flow completes and currentUser updates", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance", "description": "OAuth flow completes via Apple and currentUser updates", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance", "description": "OAuth flow completes via Google and currentUser updates", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance", "description": "ClerkAuthProvider implements required protocol methods", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-7", "type": "acceptance", "description": "CFBundleURLSchemes includes laneshadow", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test", "description": "clerk-ios SPM package resolves successfully in Xcode", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test", "description": "ClerkAuth.swift file exists at Services/ClerkAuth.swift", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test", "description": "ClerkAuth exposes signIn(email:password:) method", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test", "description": "ClerkAuth exposes signInWithApple() method", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test", "description": "ClerkAuth exposes signInWithGoogle() method", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test", "description": "ClerkAuthProvider.swift conforms to ConvexMobile AuthProvider protocol", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-7", "type": "test", "description": "Info.plist contains laneshadow URL scheme", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
