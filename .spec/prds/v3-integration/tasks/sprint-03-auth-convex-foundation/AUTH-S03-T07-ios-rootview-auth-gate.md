================================================================================
TASK: AUTH-S03-T07 - iOS RootView auth gate
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     L
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: 7/7 AC · completed

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Create iOS RootView with auth gate switching between unauthenticated flow (sign-in/sign-up) and authenticated app flow.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST replace ContentView as app entry point
- MUST create AppState @Observable model tracking auth state
- MUST implement auth gate switch based on ClerkAuth.currentUser
- MUST create AuthFlow NavigationStack for unauthenticated users
- MUST create AppFlow NavigationStack for authenticated users
- MUST implement AppEnvironment dependency injection container
- MUST handle deep links via onOpenURL pattern

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] RootView.swift created and replaces ContentView as app entry (evidence: ios/LaneShadow/App.swift:27)
- [x] AppState @Observable model tracks auth state (evidence: ios/LaneShadow/Models/AppState.swift:5)
- [x] Auth gate switches between AuthFlow and AppFlow (evidence: ios/LaneShadow/RootView.swift:10)
- [x] AuthFlow NavigationStack displays sign-in/sign-up screens (evidence: ios/LaneShadow/Views/AuthFlow/AuthFlowView.swift:5)
- [x] AppFlow NavigationStack displays authenticated app screens (evidence: ios/LaneShadow/Views/AppFlow/AppFlowView.swift:5)
- [x] AppEnvironment DI container injects ClerkAuth and ConvexClient (evidence: ios/LaneShadow/Environment/AppEnvironment.swift:4)
- [x] Deep link handling implemented via onOpenURL (evidence: ios/LaneShadow/RootView.swift:29, ios/LaneShadowTests/Integration/RootViewTests.swift:66)
- [x] iOS build passes (evidence: `xcodebuild build` EXIT_CODE:0 on 2026-04-29)
- [x] Scope compliance for remediation branch (evidence: `git diff --name-only HEAD` includes only remediation-scoped files)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: RootView replaces ContentView as app entry point [PRIMARY]
  GIVEN: iOS app currently uses ContentView as root
  WHEN:  Developer creates RootView and updates App.swift
  THEN:  RootView becomes app entry point and ContentView is removed

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/RootViewTests.swift
  TEST_FUNCTION: testRootViewReplacesContentViewAsAppEntry

AC-2: AppState @Observable model created [PRIMARY]
  GIVEN: Auth state needs to be tracked across the app
  WHEN:  Developer creates AppState.swift
  THEN:  @Observable model exposes isAuthenticated property

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/RootViewTests.swift
  TEST_FUNCTION: testAppStateObservableModelCreated

AC-3: Auth gate switch implemented [PRIMARY]
  GIVEN: RootView and AppState exist
  WHEN:  Developer implements auth gate logic
  THEN:  RootView switches between AuthFlow and AppFlow based on AppState.isAuthenticated

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/RootViewTests.swift
  TEST_FUNCTION: testAuthGateSwitchImplemented

AC-4: AuthFlow NavigationStack created [PRIMARY]
  GIVEN: User is not authenticated
  WHEN:  Auth gate shows AuthFlow
  THEN:  NavigationStack displays sign-in and sign-up screens

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/RootViewTests.swift
  TEST_FUNCTION: testAuthFlowNavigationStackCreated

AC-5: AppFlow NavigationStack created [PRIMARY]
  GIVEN: User is authenticated
  WHEN:  Auth gate shows AppFlow
  THEN:  NavigationStack displays authenticated app screens

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/RootViewTests.swift
  TEST_FUNCTION: testAppFlowNavigationStackCreated

AC-6: AppEnvironment DI container implemented [PRIMARY]
  GIVEN: Services need to be injected into views
  WHEN:  Developer creates AppEnvironment.swift
  THEN:  Environment values provide ClerkAuth and ConvexClient instances

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/RootViewTests.swift
  TEST_FUNCTION: testAppEnvironmentDIContainerImplemented

AC-7: Deep link handling implemented [PRIMARY]
  GIVEN: App receives deep links via laneshadow URL scheme
  WHEN:  Developer implements onOpenURL in RootView
  THEN:  Deep links route to appropriate screens based on auth state

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/RootViewTests.swift
  TEST_FUNCTION: testDeepLinkHandlingImplemented

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/App.swift (MODIFY — replace ContentView with RootView)
- ios/LaneShadow/RootView.swift (CREATE)
- ios/LaneShadow/Models/AppState.swift (CREATE)
- ios/LaneShadow/Views/AuthFlow/ (CREATE — sign-in/sign-up screens)
- ios/LaneShadow/Views/AppFlow/ (CREATE — authenticated app screens)
- ios/LaneShadow/Environment/AppEnvironment.swift (CREATE)
- ios/LaneShadowTests/Integration/RootViewTests.swift (CREATE)

writeProhibited:
- ios/LaneShadow/ContentView.swift — DELETE (replaced by RootView)

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Read ios-architecture.md § 1 (App Structure) before implementing
- Read .spec/prds/v3-integration/04-uc-app-02 (auth-gate routing) for routing requirements
- Use existing App.swift as reference for app entry point pattern
- Run iOS build after changes to verify compilation

⚠️ Ask First:
- If ContentView cannot be safely removed (check for dependencies)
- If AuthFlow/AppFlow screen navigation requires custom routing logic

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/App.swift (MODIFY): Replace ContentView with RootView
- ios/LaneShadow/RootView.swift (CREATE): Auth gate switching between flows
- ios/LaneShadow/Models/AppState.swift (CREATE): @Observable auth state model
- ios/LaneShadow/Views/AuthFlow/ (CREATE): Sign-in/sign-up screens
- ios/LaneShadow/Views/AppFlow/ (CREATE): Authenticated app screens
- ios/LaneShadow/Environment/AppEnvironment.swift (CREATE): DI container
- ios/LaneShadowTests/Integration/RootViewTests.swift (CREATE): Integration tests

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ: Current AC definition, existing tests, code patterns
  WRITE: ONE test that exercises GIVEN-WHEN-THEN
  RUN: cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  VERIFY: Test FAILS (not errors — fails)
  Never: Write ANY implementation code in RED phase.

### GREEN PHASE
  READ: Failing test, AC definition, code patterns
  WRITE: MINIMAL code to make test pass
  RUN: cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  VERIFY: Test PASSES
  Never: Add features beyond the current AC.

### REFACTOR PHASE
  READ: Implementation just written
  WRITE: Improved code (if needed)
  RUN: cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  VERIFY: Tests still pass
  Never: Introduce new behavior in REFACTOR.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/ios-architecture.md [PRIMARY PATTERN]
   - Section: § 1 (App Structure)
   - Focus: RootView design, AppState model, AuthFlow/AppFlow structure

2. .spec/prds/v3-integration/04-uc-app-02.md
   - Section: Auth-gate routing
   - Focus: Routing requirements for authenticated/unauthenticated flows

3. ios/LaneShadow/App.swift
   - Focus: Current app entry point implementation

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: Each AC has a test
  Verify: Test file contains one test per AC.

Gate 3: iOS build passes
  Command: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet build
  Expected: Exit 0.

Gate 4: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: AUTH-S03-T05
Blocks: AUTH-S03-T09

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "AUTH-S03-T07",
  "requirements": [
    {"id": "AC-1", "type": "acceptance", "description": "RootView becomes app entry point and ContentView is removed", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance", "description": "@Observable model exposes isAuthenticated property", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance", "description": "RootView switches between AuthFlow and AppFlow based on AppState.isAuthenticated", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance", "description": "NavigationStack displays sign-in and sign-up screens", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance", "description": "NavigationStack displays authenticated app screens", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance", "description": "Environment values provide ClerkAuth and ConvexClient instances", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-7", "type": "acceptance", "description": "Deep links route to appropriate screens based on auth state", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test", "description": "RootView.swift file exists at ios/LaneShadow/RootView.swift", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test", "description": "AppState.swift file exists at ios/LaneShadow/Models/AppState.swift", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test", "description": "AppState exposes isAuthenticated: Bool property", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test", "description": "RootView switches between AuthFlow and AppFlow based on auth state", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test", "description": "AuthFlow directory contains sign-in and sign-up screen files", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test", "description": "AppFlow directory contains authenticated app screen files", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-7", "type": "test", "description": "AppEnvironment.swift provides environment values for ClerkAuth and ConvexClient", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-8", "type": "test", "description": "RootView implements onOpenURL handler for deep links", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-9", "type": "test", "description": "iOS project compiles without errors", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
