================================================================================
TASK: AUTH-S03-T03 - iOS ConvexMobile Swift SDK integration
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

PROGRESS: 0/5 AC · not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Integrate ConvexMobile Swift SDK via SPM and create typed wrapper exposing queries, mutations, and Clerk auth bridge.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use convex-swift SPM package version 0.7.0+
- MUST create ConvexClient+LaneShadow.swift typed wrapper extension
- MUST expose setAuth callback accepting Clerk JWT token closure
- MUST implement subscribeToSessions() -> AsyncStream<[Session]>
- STRICTLY update ios/project.yml to add SPM dependency

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] convex-swift SPM dependency added to project
- [ ] ConvexClient+LaneShadow.swift wrapper created with typed API
- [ ] setAuth callback bridged to Clerk JWT provider
- [ ] subscribeToSessions() -> AsyncStream<[Session]> implemented
- [ ] iOS build passes
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: convex-swift SPM package integrated
  GIVEN: iOS project uses Xcode project.yml configuration
  WHEN:  Developer adds convex-swift package dependency
  THEN:  SPM package resolves and links successfully

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/ConvexClientTests.swift
  TEST_FUNCTION: testConvexSwiftPackageIntegrated

AC-2: ConvexClient+LaneShadow typed wrapper created [PRIMARY]
  GIVEN: convex-swift SDK is available
  WHEN:  Developer creates ConvexClient+LaneShadow.swift extension
  THEN:  Typed wrapper exposes enum-based API for queries/mutations

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/ConvexClientTests.swift
  TEST_FUNCTION: testConvexClientLaneShadowWrapperCreated

AC-3: setAuth callback bridges Clerk JWT [PRIMARY]
  GIVEN: ConvexClient+LaneShadow wrapper exists
  WHEN:  Developer calls setAuth with token closure
  THEN:  Convex client receives JWT token from Clerk provider

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/ConvexClientTests.swift
  TEST_FUNCTION: testSetAuthBridgesClerkJWT

AC-4: subscribeToSessions returns AsyncStream [PRIMARY]
  GIVEN: ConvexClient is initialized and authenticated
  WHEN:  Developer calls subscribeToSessions()
  THEN:  AsyncStream<[Session]> emits session array updates

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/ConvexClientTests.swift
  TEST_FUNCTION: testSubscribeToSessionsEmitsAsyncStream

AC-5: Typed query/mutation methods exposed
  GIVEN: ConvexClient+LaneShadow wrapper exists
  WHEN:  Developer inspects wrapper API
  THEN:  Query and mutation methods are typed and callable

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Integration/ConvexClientTests.swift
  TEST_FUNCTION: testTypedQueryMutationMethodsExposed

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/project.yml (MODIFY — add convex-swift SPM dependency)
- ios/LaneShadow/Services/ConvexClient+LaneShadow.swift (CREATE)
- ios/LaneShadowTests/Integration/ConvexClientTests.swift (CREATE)

writeProhibited:
- ios/LaneShadow/Generated/ — generated files, run codegen instead

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Read ios-architecture.md § 4 (Convex Client Wrapper) before implementing
- Use existing SPM packages in project.yml as reference
- Run iOS build after changes to verify compilation

⚠️ Ask First:
- If convex-swift SPM package version conflicts with existing dependencies
- If AsyncStream pattern needs special handling for Convex queries

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/project.yml (MODIFY): Add convex-swift SPM dependency
- ios/LaneShadow/Services/ConvexClient+LaneShadow.swift (CREATE): Typed Convex client wrapper
- ios/LaneShadowTests/Integration/ConvexClientTests.swift (CREATE): Integration tests

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
   - Section: § 4 (Convex Client Wrapper)
   - Focus: ConvexClient+LaneShadow design, setAuth bridge, AsyncStream pattern

2. ios/project.yml
   - Focus: Existing SPM dependencies

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

Depends on: AUTH-S03-T02
Blocks: AUTH-S03-T05, AUTH-S03-T07

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "AUTH-S03-T03",
  "requirements": [
    {"id": "AC-1", "type": "acceptance", "description": "SPM package resolves and links successfully", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance", "description": "Typed wrapper exposes enum-based API for queries/mutations", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance", "description": "Convex client receives JWT token from Clerk provider", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance", "description": "AsyncStream<[Session]> emits session array updates", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance", "description": "Query and mutation methods are typed and callable", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test", "description": "convex-swift SPM package resolves successfully in Xcode", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test", "description": "ConvexClient+LaneShadow.swift file exists at Services/ConvexClient+LaneShadow.swift", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test", "description": "setAuth method signature accepts async token closure", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test", "description": "subscribeToSessions method returns AsyncStream<[Session]>", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test", "description": "iOS project compiles without errors", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
