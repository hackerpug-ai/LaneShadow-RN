================================================================================
TASK: CHAT-S04-T01 - iOS RideFlow reducer + ChatStore + SessionStore
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test:      xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test
  typecheck: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --lint ios/

PROGRESS: 0/7 AC · pending

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

RideFlow reducer ports use-ride-flow.ts 1:1 onto Swift @Observable; ChatStore + SessionStore expose state and dispatch.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST port react-native/hooks/use-ride-flow.ts 1:1 — same 7 phases, same actions, same guards
- MUST keep reduce(state, action) -> state pure (no side effects, no I/O, no Date.now() outside guarded factories)
- MUST use @Observable macro from Observation framework (not ObservableObject / @Published)
- MUST mark @Observable stores @MainActor
- MUST expose initialState and reduce as testable free functions independent of the @Observable wrapper
- NEVER touch UI screens, MockProviders, or Convex subscriptions in this task
- NEVER mix async work into reduce() — async orchestration belongs to a later task
- NEVER edit ios/LaneShadow.xcodeproj/** directly — regenerate via scripts/ios/generate-project.sh
- NEVER use ObservableObject or Combine @Published
- STRICTLY mirror RN phase names verbatim: IDLE, PLANNING, ROUTE_RESULTS, ROUTE_DETAILS, SESSION_HISTORY, ERROR, NAVIGATION_EXPORT
- STRICTLY keep this task UI-free; sandbox screens stay on MockProviders until CHAT-S04-T03

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] reduce() correctly transitions IDLE -> PLANNING on .sendMessage with new sessionId (AC-1 PRIMARY)
- [x] Empty content guard returns unchanged state (AC-2)
- [x] PLANNING -> ROUTE_RESULTS preserves sessionId on .planningSuccess (AC-3)
- [x] PLANNING -> ERROR preserves sessionId + sets errorTimestamp (AC-4)
- [x] ROUTE_RESULTS .sendMessage refinement reuses sessionId (AC-5)
- [x] PLANNING .cancelPlanning branches on existing options (AC-6)
- [x] ChatStore @Observable wrapper dispatches and exposes flowState (AC-7)
- [ ] All Swift Testing tests pass + xcodebuild build clean ← PARTIAL: targeted RideFlow/ChatStore/SessionStore suite passes and build is clean, but full repo `xcodebuild test` is still blocked by pre-existing sandbox failures/crash loop outside this diff (evidence: /tmp/baseline-test-output-CHAT-S04-T01.txt)
- [x] Only SCOPE.writeAllowed files modified (git diff --name-only)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Idle->Planning on SEND_MESSAGE [PRIMARY]
  GIVEN: RideFlow reducer in IDLE state with no session
  WHEN:  reduce(state, .sendMessage("Plan a scenic ride")) is called
  THEN:  Returned state is .planning with a freshly generated sessionId, currentPhase == "analyzing", routeOptions == nil

  TDD_STATE:     RED proof unavailable in preserved artifact; GREEN verified by focused service-suite pass
  TEST_FILE:     ios/LaneShadowTests/Services/RideFlowTests.swift
  TEST_FUNCTION: test_reduce_idle_sendMessage_transitionsToPlanning

AC-2: Empty content guard rejects send
  GIVEN: RideFlow reducer in IDLE state
  WHEN:  reduce(state, .sendMessage("   ")) is called with whitespace-only content
  THEN:  Returned state is unchanged (still .idle); no session generated

  TDD_STATE:     RED proof unavailable in preserved artifact; GREEN verified by focused service-suite pass
  TEST_FILE:     ios/LaneShadowTests/Services/RideFlowTests.swift
  TEST_FUNCTION: test_reduce_idle_sendMessage_emptyContent_isNoOp

AC-3: Planning->RouteResults on success preserves session
  GIVEN: RideFlow reducer in PLANNING state with sessionId X
  WHEN:  reduce(state, .planningSuccess(options)) is called with non-empty options.options
  THEN:  Returned state is .routeResults with same sessionId X, options assigned, selectedRouteId defaulting to first option's routeOptionId

  TDD_STATE:     RED proof unavailable in preserved artifact; GREEN verified by focused service-suite pass
  TEST_FILE:     ios/LaneShadowTests/Services/RideFlowTests.swift
  TEST_FUNCTION: test_reduce_planning_planningSuccess_transitionsToRouteResults_preservesSession

AC-4: Planning->Error on planningError
  GIVEN: RideFlow reducer in PLANNING state with sessionId X
  WHEN:  reduce(state, .planningError("AGENT_TIMEOUT")) is called
  THEN:  Returned state is .error with errorMessage == "AGENT_TIMEOUT", sessionId preserved, errorTimestamp populated

  TDD_STATE:     RED proof unavailable in preserved artifact; GREEN verified by focused service-suite pass
  TEST_FILE:     ios/LaneShadowTests/Services/RideFlowTests.swift
  TEST_FUNCTION: test_reduce_planning_planningError_transitionsToError_preservesSession

AC-5: Refinement reuses sessionId from RouteResults
  GIVEN: RideFlow reducer in ROUTE_RESULTS state with sessionId X and existing options
  WHEN:  reduce(state, .sendMessage("make it shorter")) is called
  THEN:  Returned state is .planning with same sessionId X, existing routeOptions/selectedRouteId carried forward (not reset)

  TDD_STATE:     RED proof unavailable in preserved artifact; GREEN verified by focused service-suite pass
  TEST_FILE:     ios/LaneShadowTests/Services/RideFlowTests.swift
  TEST_FUNCTION: test_reduce_routeResults_sendMessage_reusesSession_carriesForwardOptions

AC-6: Cancel mid-plan returns to RouteResults if options exist, else IDLE
  GIVEN: RideFlow reducer in PLANNING state
  WHEN:  reduce is called with .cancelPlanning — once with carry-over routeOptions present and once with routeOptions nil
  THEN:  First call returns .routeResults with the carried options; second call returns .idle (initialState)

  TDD_STATE:     RED proof unavailable in preserved artifact; GREEN verified by focused service-suite pass
  TEST_FILE:     ios/LaneShadowTests/Services/RideFlowTests.swift
  TEST_FUNCTION: test_reduce_planning_cancelPlanning_branchesOnExistingOptions

AC-7: ChatStore @Observable wrapper dispatches and exposes flowState
  GIVEN: A ChatStore initialized with initialState
  WHEN:  store.dispatch(.sendMessage("plan a ride")) is called
  THEN:  store.flowState transitions from .idle to .planning, observable change is emitted, and SessionStore.activeSessionId reflects the new sessionId

  TDD_STATE:     RED proof unavailable in preserved artifact; GREEN verified by focused service-suite pass
  TEST_FILE:     ios/LaneShadowTests/Services/ChatStoreTests.swift
  TEST_FUNCTION: test_chatStore_dispatch_updatesFlowState_andSessionStore

--------------------------------------------------------------------------------
TDD EVIDENCE
--------------------------------------------------------------------------------

Focused green verification was preserved for the service-layer suites. The original RED run logs were not preserved in the task artifact, so the RED side is explicitly marked unavailable rather than reconstructed.

| AC | Red Command | Red Evidence | Green Command | Green Evidence |
|---|---|---|---|---|
| AC-1 | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,id=13A9B997-C6B8-4546-96A9-4E15B90A65BB' test -only-testing:LaneShadowTests/RideFlowTests` | unavailable in preserved logs | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,id=13A9B997-C6B8-4546-96A9-4E15B90A65BB' test -only-testing:LaneShadowTests/RideFlowTests -only-testing:LaneShadowTests/ChatStoreTests -only-testing:LaneShadowTests/SessionStoreTests` | `Test run with 8 tests in 3 suites passed` / `** TEST SUCCEEDED **` |
| AC-2 | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,id=13A9B997-C6B8-4546-96A9-4E15B90A65BB' test -only-testing:LaneShadowTests/RideFlowTests` | unavailable in preserved logs | same as AC-1 green command | `✔ Test "test_reduce_idle_sendMessage_emptyContent_isNoOp" passed` |
| AC-3 | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,id=13A9B997-C6B8-4546-96A9-4E15B90A65BB' test -only-testing:LaneShadowTests/RideFlowTests` | unavailable in preserved logs | same as AC-1 green command | `✔ Test "test_reduce_planning_planningSuccess_transitionsToRouteResults_preservesSession" passed` |
| AC-4 | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,id=13A9B997-C6B8-4546-96A9-4E15B90A65BB' test -only-testing:LaneShadowTests/RideFlowTests` | unavailable in preserved logs | same as AC-1 green command | `✔ Test "test_reduce_planning_planningError_transitionsToError_preservesSession" passed` |
| AC-5 | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,id=13A9B997-C6B8-4546-96A9-4E15B90A65BB' test -only-testing:LaneShadowTests/RideFlowTests` | unavailable in preserved logs | same as AC-1 green command | `✔ Test "test_reduce_routeResults_sendMessage_reusesSession_carriesForwardOptions" passed` |
| AC-6 | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,id=13A9B997-C6B8-4546-96A9-4E15B90A65BB' test -only-testing:LaneShadowTests/RideFlowTests` | unavailable in preserved logs | same as AC-1 green command | `✔ Test "test_reduce_planning_cancelPlanning_branchesOnExistingOptions" passed` |
| AC-7 | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,id=13A9B997-C6B8-4546-96A9-4E15B90A65BB' test -only-testing:LaneShadowTests/ChatStoreTests` | unavailable in preserved logs | same as AC-1 green command | `✔ Test "test_chatStore_dispatch_updatesFlowState_andSessionStore" passed` |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Services/RideFlow.swift (NEW)
- ios/LaneShadow/Services/ChatStore.swift (NEW)
- ios/LaneShadow/Services/SessionStore.swift (NEW)
- ios/LaneShadowTests/Services/RideFlowTests.swift (NEW)
- ios/LaneShadowTests/Services/ChatStoreTests.swift (NEW)
- ios/LaneShadowTests/Services/SessionStoreTests.swift (NEW)
- ios/project.yml (MODIFY — only if new test target sources need glob updates)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated; edit ios/project.yml + run scripts/ios/generate-project.sh
- ios/LaneShadow/Generated/** — generated by server/scripts/generate-mobile-types.ts
- ios/LaneShadow/Views/Templates/** — UI wiring belongs to T03/T05/T07
- ios/LaneShadow/Sandbox/MockProviders/** — providers stay until wiring tasks replace them
- ios/LaneShadow/Services/ConvexClient+LaneShadow.swift — owned by AUTH-S03-T03
- ios/LaneShadow/Models/AppState.swift — owned by AUTH-S03-T07
- Any file outside scope.write_allowed

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use @Observable macro (not ObservableObject)
- Mark store classes @MainActor
- Keep reduce(_:_:) pure — no async, no Date, no UUID outside an injected factory
- Mirror RN action and phase names verbatim
- Inject session-id and timestamp factories so tests are deterministic

⚠️ Ask First:
- Adding any new SPM dependencies
- Diverging from RN reducer semantics in any non-cosmetic way
- Adding NAVIGATION_EXPORT transitions beyond what RN already supports

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Services/RideFlow.swift (NEW): RideFlowPhase enum + actions + pure reduce(_:_:) + initialState
- ios/LaneShadow/Services/ChatStore.swift (NEW): @MainActor @Observable wrapper holding flowState, pending+confirmed messages, dispatch(action) entry point
- ios/LaneShadow/Services/SessionStore.swift (NEW): @MainActor @Observable holder for activeSessionId + lifecycle hooks (newSession, loadSession)
- ios/LaneShadowTests/Services/RideFlowTests.swift (NEW): Swift Testing coverage of every phase x action transition (mirrors RN test surface)
- ios/LaneShadowTests/Services/ChatStoreTests.swift (NEW): integration of reducer through @Observable surface
- ios/LaneShadowTests/Services/SessionStoreTests.swift (NEW): activeSessionId lifecycle

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ:   Current AC definition, existing tests, code patterns
  WRITE:  ONE test that exercises GIVEN-WHEN-THEN
  RUN:    xcodebuild ... test -only-testing:LaneShadowTests/{TestFile}/{test_function}
  VERIFY: Test FAILS (not errors — fails)
  Never:  Write ANY implementation code in RED phase.

### GREEN PHASE
  READ:   Failing test, AC definition, code patterns
  WRITE:  MINIMAL code to make test pass
  RUN:    xcodebuild ... test -only-testing:...
  VERIFY: Test PASSES
  Never:  Add features beyond the current AC.

### REFACTOR PHASE
  READ:   Implementation just written
  WRITE:  Improved code (if needed)
  RUN:    xcodebuild ... test (full suite)
  VERIFY: Tests still pass
  Never:  Introduce new behavior in REFACTOR.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. react-native/hooks/use-ride-flow.ts [PRIMARY PATTERN]
   - Lines: 1-580
   - Focus: Reducer, actions, guards, exhaustive switch — port 1:1

2. .spec/prds/v3-integration/architecture/ios-architecture.md
   - Lines: 234-450
   - Focus: Section 3.4 ChatStore decisions, AppState idiom

3. .spec/prds/v3-integration/11-technical-requirements.md
   - Lines: 350-400
   - Focus: Reactivity Patterns + Server-vs-client state machine bridging

4. ios/LaneShadow/Models/AppState.swift
   - Lines: 1-200
   - Focus: Existing @MainActor @Observable pattern to match

5. ios/LaneShadow/Services/ConvexClient+LaneShadow.swift
   - Lines: 1-100
   - Focus: Generated type imports available to RideFlow

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: Each AC has a test
  Verify: Test file contains one test per AC.

Gate 3: All tests pass
  Command: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test
  Expected: Exit 0.

Gate 4: Build (typecheck)
  Command: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  Expected: Exit 0.

Gate 5: Lint
  Command: swiftformat --lint ios/
  Expected: Exit 0.

Gate 6: Token compliance
  Command: scripts/tokens/enforce-native-compliance.sh
  Expected: Exit 0.

Gate 7: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: AUTH-S03-T02 (type generation pipeline), AUTH-S03-T03 (ConvexClient wrapper — types referenced), AUTH-S03-T07 (AppState shape stable)
Blocks: CHAT-S04-T03, CHAT-S04-T05, CHAT-S04-T07, CHAT-S04-T09a

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-T01",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN .idle state WHEN reduce(.sendMessage(non-empty)) THEN .planning with new sessionId, currentPhase=analyzing", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RideFlowTests/test_reduce_idle_sendMessage_transitionsToPlanning", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN .idle WHEN reduce(.sendMessage(whitespace)) THEN unchanged state", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RideFlowTests/test_reduce_idle_sendMessage_emptyContent_isNoOp", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN .planning(X) WHEN reduce(.planningSuccess(options)) THEN .routeResults(X) with options + first selectedRouteId", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RideFlowTests/test_reduce_planning_planningSuccess_transitionsToRouteResults_preservesSession", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN .planning(X) WHEN reduce(.planningError(code)) THEN .error(message=code, sessionId=X, errorTimestamp set)", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RideFlowTests/test_reduce_planning_planningError_transitionsToError_preservesSession", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN .routeResults(X, options) WHEN reduce(.sendMessage(non-empty)) THEN .planning(X) with carried options", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RideFlowTests/test_reduce_routeResults_sendMessage_reusesSession_carriesForwardOptions", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN .planning WHEN reduce(.cancelPlanning) THEN .routeResults if options existed else .idle", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RideFlowTests/test_reduce_planning_cancelPlanning_branchesOnExistingOptions", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN ChatStore WHEN dispatch(.sendMessage) THEN flowState becomes .planning and SessionStore.activeSessionId matches", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/ChatStoreTests/test_chatStore_dispatch_updatesFlowState_andSessionStore", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Idle + non-empty sendMessage yields .planning with non-nil sessionId.", "maps_to_ac": "AC-1", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RideFlowTests/test_reduce_idle_sendMessage_transitionsToPlanning", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Idle + whitespace sendMessage is a no-op (deep-equal).", "maps_to_ac": "AC-2", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RideFlowTests/test_reduce_idle_sendMessage_emptyContent_isNoOp", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Planning + planningSuccess preserves sessionId; selectedRouteId defaults to first option.", "maps_to_ac": "AC-3", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RideFlowTests/test_reduce_planning_planningSuccess_transitionsToRouteResults_preservesSession", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Planning + planningError yields .error with the same code string.", "maps_to_ac": "AC-4", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RideFlowTests/test_reduce_planning_planningError_transitionsToError_preservesSession", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "RouteResults + sendMessage reuses same sessionId and carries options forward.", "maps_to_ac": "AC-5", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RideFlowTests/test_reduce_routeResults_sendMessage_reusesSession_carriesForwardOptions", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "Cancel branches correctly on presence of carry-over options.", "maps_to_ac": "AC-6", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RideFlowTests/test_reduce_planning_cancelPlanning_branchesOnExistingOptions", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-7", "type": "test_criterion", "description": "ChatStore dispatch propagates state and updates SessionStore.activeSessionId.", "maps_to_ac": "AC-7", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/ChatStoreTests/test_chatStore_dispatch_updatesFlowState_andSessionStore", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
