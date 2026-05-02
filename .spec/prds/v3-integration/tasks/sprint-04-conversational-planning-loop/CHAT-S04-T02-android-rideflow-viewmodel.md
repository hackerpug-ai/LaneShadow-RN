================================================================================
TASK: CHAT-S04-T02 - Android RideFlowViewModel + ChatViewModel + AppStateRepository
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 6/6 AC · partial

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

RideFlow state machine + ChatViewModel + AppStateRepository ported 1:1 from RN reducer with pure reduce() unit-tested for every transition.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST keep reduce(state, action) a pure Kotlin function with no Convex, no coroutines, no Hilt — testable without Robolectric
- MUST use sealed interface RideFlowState and sealed interface RideFlowAction matching the RN discriminators 1:1 (IDLE, PLANNING, ERROR, ROUTE_RESULTS, ROUTE_DETAILS, SESSION_HISTORY, NAVIGATION_EXPORT)
- MUST mirror handleIdleState/handlePlanningState/handleRouteResultsState/handleRouteDetailsState/handleErrorState branch-for-branch from react-native/hooks/use-ride-flow.ts
- MUST preserve sessionId on REFINE (SendMessage from ROUTE_RESULTS or ROUTE_DETAILS keeps state.sessionId — not generateSessionId)
- MUST persist lastViewedSessionId and per-session CameraPosition via AndroidX DataStore Preferences (no SharedPreferences)
- MUST expose StateFlow<RideFlowState> from ChatViewModel (never MutableStateFlow public)
- NEVER mutate state inside reduce() — always return a new sealed-class instance
- NEVER inject @Composable types or Compose state into ViewModel/reducer
- NEVER call ConvexClient directly from the reducer — side effects belong in ChatViewModel.dispatch()
- NEVER skip the canSendMessage guard (empty/whitespace input must be a no-op transition)
- NEVER hold a non-cancellable Job in ChatViewModel — sendJob must be cancellable on CancelPlanning
- STRICTLY follow ViewModel patterns established in android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt and existing Hilt @Singleton modules under com/laneshadow/di/

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] Pure reduce IDLE -> PLANNING on SendMessage with fresh sessionId (AC-1 PRIMARY)
- [x] Empty SendMessage is no-op guard (AC-2)
- [x] Refine from ROUTE_RESULTS preserves sessionId (AC-3)
- [x] PlanningError transitions to ERROR with timestamp (AC-4)
- [x] ChatViewModel exposes StateFlow + dispatch wiring (AC-5)
- [x] AppStateRepository persists per-session camera via DataStore (AC-6)
- [ ] ./gradlew test passes + ./gradlew :app:compileDebugKotlin clean ← PARTIAL: `:app:compileDebugKotlin` passes, but `./gradlew test` still fails on unrelated baseline unit test assertions and `detekt` still fails on `LoginSmokeTest.kt:28`; see `.tmp/CHAT-S04-T02/pre-existing-issues.md` for the current baseline note set.
- [x] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Pure reduce IDLE -> PLANNING on SendMessage [PRIMARY]
  GIVEN: RideFlowState.Idle with sessionId=null and a non-empty SendMessage action
  WHEN:  reduce(state, RideFlowAction.SendMessage("plan a ride")) is called
  THEN:  Returns RideFlowState.Planning with a freshly generated sessionId, planId=null, currentPhase="analyzing", routeOptions=null, selectedRouteId=null

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/RideFlowReducerTest.kt
  TEST_FUNCTION: reduce_idle_sendMessage_transitionsToPlanning_withFreshSessionId

AC-2: Empty SendMessage is no-op (guard)
  GIVEN: RideFlowState.Idle and a SendMessage action with whitespace-only content
  WHEN:  reduce(state, RideFlowAction.SendMessage("   ")) is called
  THEN:  Returns the original Idle state unchanged (referential equality on state)

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/RideFlowReducerTest.kt
  TEST_FUNCTION: reduce_idle_sendMessageWithBlankContent_returnsSameState

AC-3: Refine from ROUTE_RESULTS preserves sessionId
  GIVEN: RideFlowState.RouteResults with sessionId="abc-123" and existing routeOptions
  WHEN:  reduce(state, RideFlowAction.SendMessage("shorter please")) is called
  THEN:  Returns RideFlowState.Planning where sessionId == "abc-123" (not regenerated) and routeOptions/selectedRouteId carried through

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/RideFlowReducerTest.kt
  TEST_FUNCTION: reduce_routeResults_sendMessage_preservesSessionId

AC-4: PlanningError transitions to ERROR with timestamp
  GIVEN: RideFlowState.Planning with sessionId="abc-123"
  WHEN:  reduce(state, RideFlowAction.PlanningError("AGENT_TIMEOUT")) is called
  THEN:  Returns RideFlowState.Error with message="AGENT_TIMEOUT", sessionId="abc-123", and a non-null timestamp

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/RideFlowReducerTest.kt
  TEST_FUNCTION: reduce_planning_planningError_transitionsToErrorWithTimestamp

AC-5: ChatViewModel exposes StateFlow + dispatch wiring
  GIVEN: ChatViewModel constructed with a fake ChatRepository and SessionRepository (Hilt-free)
  WHEN:  viewModel.dispatch(RideFlowAction.SendMessage("hi")) is called and flowState is collected
  THEN:  First emission is Idle, next emission is Planning, and sendJob is non-null

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/ChatViewModelTest.kt
  TEST_FUNCTION: dispatch_sendMessage_emitsPlanningAndStartsSendJob

AC-6: AppStateRepository persists per-session camera via DataStore
  GIVEN: An AppStateRepositoryImpl backed by an in-memory DataStore<Preferences>
  WHEN:  setSessionCamera("sess-1", CameraPosition(lat=37.7, lng=-122.4, zoom=12f)) is awaited then appState is collected
  THEN:  First emission contains sessionCameras["sess-1"] equal to that CameraPosition

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/AppStateRepositoryTest.kt
  TEST_FUNCTION: setSessionCamera_persistsAndEmitsViaAppStateFlow

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/services/RideFlowState.kt (NEW)
- android/app/src/main/java/com/laneshadow/services/RideFlowAction.kt (NEW)
- android/app/src/main/java/com/laneshadow/services/RideFlowReducer.kt (NEW)
- android/app/src/main/java/com/laneshadow/services/ChatViewModel.kt (NEW)
- android/app/src/main/java/com/laneshadow/services/AppStateRepository.kt (NEW — interface + Impl)
- android/app/src/main/java/com/laneshadow/di/AppStateModule.kt (NEW)
- android/app/src/test/java/com/laneshadow/services/RideFlowReducerTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/services/ChatViewModelTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/services/AppStateRepositoryTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/services/ConvexClientProviderAuthTest.kt (verification-support shim only; required to clear the task compile gate)
- android/app/src/test/java/com/laneshadow/ui/auth/AuthScreensSourceStructureTest.kt (verification-support shim only; required to clear the task compile gate)
- .spec/prds/v3-integration/tasks/sprint-04-conversational-planning-loop/CHAT-S04-T02-android-rideflow-viewmodel.md (task contract / evidence metadata)
- android/app/build.gradle.kts (MODIFY — only if androidx.datastore:datastore-preferences and lifecycle-runtime-compose are not yet present)

Verification-support edits are scoped only to compile/test gate clearing and do not expand production scope.

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/templates/** — templates remain mock-driven for now
- android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt — already shipped Sprint 03
- android/app/src/main/java/com/laneshadow/data/repository/** — auth repos are out of scope
- Any iOS path under ios/**
- react-native/** — RN reducer is reference only

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use @HiltViewModel + @Inject constructor for ChatViewModel
- Keep reduce() top-level internal fun in RideFlowReducer.kt — no class members
- Use kotlinx.coroutines.flow.StateFlow / MutableStateFlow (private) / asStateFlow() public
- Use SavedStateHandle for sessionId restoration after process death
- Use androidx.datastore.preferences.core.PreferencesKeys for AppStateRepository keys
- Reference RN test names from react-native/hooks/__tests__/use-ride-flow.test.ts when porting test cases

⚠️ Ask First:
- Adding any new gradle dependency beyond datastore-preferences and lifecycle-runtime-compose
- Renaming the existing services/ package or relocating ConvexClientProvider
- Introducing a new Hilt scope beyond @Singleton + @ViewModelScoped

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/services/RideFlowState.kt (NEW): sealed interface with seven state variants (Idle, Planning, Error, RouteResults, RouteDetails, SessionHistory, NavigationExport) + WithSession marker
- android/app/src/main/java/com/laneshadow/services/RideFlowAction.kt (NEW): sealed interface with all twelve action types from RN reducer
- android/app/src/main/java/com/laneshadow/services/RideFlowReducer.kt (NEW): pure internal fun reduce(state, action): RideFlowState mirroring use-ride-flow.ts branch-for-branch
- android/app/src/main/java/com/laneshadow/services/ChatViewModel.kt (NEW): @HiltViewModel exposing flowState: StateFlow<RideFlowState> + dispatch(action) + cancellable sendJob
- android/app/src/main/java/com/laneshadow/services/AppStateRepository.kt (NEW): interface + @Singleton Impl backed by DataStore<Preferences> with appState: Flow<AppPreferences>
- android/app/src/main/java/com/laneshadow/di/AppStateModule.kt (NEW): Hilt module binding AppStateRepositoryImpl into SingletonComponent and providing the DataStore<Preferences>
- Tests for AC-1..AC-6 with no Robolectric

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ:   AC, existing tests, code patterns
  WRITE:  ONE test exercising GIVEN-WHEN-THEN
  RUN:    cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.{Class}.{function}
  VERIFY: Test FAILS — capture output
  Never:  Write ANY implementation code in RED phase.

### GREEN PHASE
  READ:   Failing test, AC, code patterns
  WRITE:  MINIMAL Kotlin to make test pass
  RUN:    cd android && ./gradlew :app:testDebugUnitTest --tests ...
  VERIFY: Test PASSES
  Never:  Add behavior beyond the AC.

### REFACTOR PHASE
  READ:   Implementation
  WRITE:  Improvements
  RUN:    cd android && ./gradlew test
  VERIFY: All green
  Never:  Introduce new behavior.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. react-native/hooks/use-ride-flow.ts [PRIMARY PATTERN]
   - Lines: 1-580
   - Focus: Port reducer 1:1, including handleIdleState/handlePlanningState/handleRouteResultsState branches and the canSendMessage/canNavigateToExport/canViewHistory guards

2. react-native/hooks/__tests__/use-ride-flow.test.ts
   - Lines: 1-300
   - Focus: Test names and assertions to mirror in RideFlowReducerTest.kt

3. .spec/prds/v3-integration/architecture/android-architecture.md
   - Lines: 431-595
   - Focus: ChatViewModel + RideFlowState + RideFlowAction shape; Compose collection idiom

4. android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt
   - Lines: 1-200
   - Focus: Existing Hilt @Singleton + StateFlow pattern in this codebase

5. android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt
   - Lines: 1-200
   - Focus: Existing service-layer pattern (Sprint 03)

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE history (each AC moves from none -> RED replay -> GREEN evidence)

Gate 2: All tests pass
  Command: cd android && ./gradlew test
  Expected: Exit 0

Gate 3: Type check (compile)
  Command: cd android && ./gradlew :app:compileDebugKotlin
  Expected: Exit 0

Gate 4: Static analysis
  Command: cd android && ./gradlew detekt
  Expected: Exit 0 (skip if not yet enabled)

Gate 5: Token compliance
  Command: scripts/tokens/enforce-native-compliance.sh
  Expected: Exit 0

Gate 6: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: AUTH-S03-T04 (ConvexClientProvider), AUTH-S03-T08 (MainActivity shell), Sprint 03 ClerkAuthRepository
Blocks: CHAT-S04-T04, CHAT-S04-T06, CHAT-S04-T08, CHAT-S04-T09b

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-T02",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN Idle state WHEN SendMessage with non-empty content THEN returns Planning with fresh sessionId", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.RideFlowReducerTest.reduce_idle_sendMessage_transitionsToPlanning_withFreshSessionId", "satisfied": true, "evidence": ".tmp/CHAT-S04-T02/tdd-evidence.json#AC-1", "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN Idle state WHEN SendMessage with blank content THEN returns same Idle state unchanged", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.RideFlowReducerTest.reduce_idle_sendMessageWithBlankContent_returnsSameState", "satisfied": true, "evidence": ".tmp/CHAT-S04-T02/tdd-evidence.json#AC-2", "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN RouteResults state WHEN SendMessage (refine) THEN sessionId is preserved", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.RideFlowReducerTest.reduce_routeResults_sendMessage_preservesSessionId", "satisfied": true, "evidence": ".tmp/CHAT-S04-T02/tdd-evidence.json#AC-3", "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN Planning state WHEN PlanningError THEN transitions to Error with timestamp", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.RideFlowReducerTest.reduce_planning_planningError_transitionsToErrorWithTimestamp", "satisfied": true, "evidence": ".tmp/CHAT-S04-T02/tdd-evidence.json#AC-4", "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN ChatViewModel WHEN dispatch SendMessage THEN flowState transitions Idle -> Planning and sendJob is started", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.ChatViewModelTest.dispatch_sendMessage_emitsPlanningAndStartsSendJob", "satisfied": true, "evidence": ".tmp/CHAT-S04-T02/tdd-evidence.json#AC-5", "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN AppStateRepository WHEN setSessionCamera awaited THEN appState emits with camera persisted", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.AppStateRepositoryTest.setSessionCamera_persistsAndEmitsViaAppStateFlow", "satisfied": true, "evidence": ".tmp/CHAT-S04-T02/tdd-evidence.json#AC-6", "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Pure reducer IDLE -> PLANNING happy path", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.RideFlowReducerTest.reduce_idle_sendMessage_transitionsToPlanning_withFreshSessionId", "satisfied": true, "evidence": ".tmp/CHAT-S04-T02/tdd-evidence.json#AC-1", "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Pure reducer guard against empty content", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.RideFlowReducerTest.reduce_idle_sendMessageWithBlankContent_returnsSameState", "satisfied": true, "evidence": ".tmp/CHAT-S04-T02/tdd-evidence.json#AC-2", "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Refine preserves sessionId across ROUTE_RESULTS -> PLANNING", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.RideFlowReducerTest.reduce_routeResults_sendMessage_preservesSessionId", "satisfied": true, "evidence": ".tmp/CHAT-S04-T02/tdd-evidence.json#AC-3", "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "PLANNING -> ERROR transition carries error message and timestamp", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.RideFlowReducerTest.reduce_planning_planningError_transitionsToErrorWithTimestamp", "satisfied": true, "evidence": ".tmp/CHAT-S04-T02/tdd-evidence.json#AC-4", "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "ChatViewModel.flowState wiring + dispatch side effect", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.ChatViewModelTest.dispatch_sendMessage_emitsPlanningAndStartsSendJob", "satisfied": true, "evidence": ".tmp/CHAT-S04-T02/tdd-evidence.json#AC-5", "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "AppStateRepository DataStore persistence round-trip", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.AppStateRepositoryTest.setSessionCamera_persistsAndEmitsViaAppStateFlow", "satisfied": true, "evidence": ".tmp/CHAT-S04-T02/tdd-evidence.json#AC-6", "remediation": null}
  ]
}
-->
================================================================================
