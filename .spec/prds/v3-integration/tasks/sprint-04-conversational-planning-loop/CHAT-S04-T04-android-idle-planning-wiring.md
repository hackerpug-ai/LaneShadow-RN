================================================================================
TASK: CHAT-S04-T04 - Android Idle + Planning real-data wiring
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Completed
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 6/6 AC · done

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

IdleScreen and PlanningScreen render real Convex data — greeting from db.users.getCurrentUser, suggestion-chip submit creates a real planning_sessions row, phase indicator pulses from real db.sessionMessages.list status updates.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST replace IdleMockProvider/PlanningMockProvider usage in production (non-sandbox) IdleRoute/PlanningRoute composables with real ChatViewModel-backed state
- MUST subscribe to db.users.getCurrentUser, db.planningSessions.listSessions, db.sessionMessages.list, db.routePlans.getActiveRoutePlansForSession via Repository interfaces (no direct ConvexClient.subscribe in ViewModels)
- MUST dispatch db.planningSessions.createSession mutation followed by actions.agent.sendMessage.sendMessage on send
- MUST derive currentPhase string from latest agent message status (parsing -> searching -> drafting -> enriching -> finalizing) and forward to LSPhaseIndicator header
- MUST keep v2 mock-driven sandbox stories (IdleScreenStory, PlanningScreenStory) untouched — those are golden snapshots
- MUST use collectAsStateWithLifecycle (not collectAsState) for every flow consumed in Compose
- NEVER call ConvexClient directly from a Composable
- NEVER subscribe to messages on a null sessionId (use flatMapLatest with flowOf(emptyList()) on null)
- NEVER copy mock fixtures into ViewModels — adapt domain types via toMockState() extension only at the Route boundary
- NEVER block the main thread on a mutation — wrap createSession in viewModelScope.launch
- NEVER create a new sessionId for refinement (handled by ChatViewModel from T02; refinement reuses state.sessionId)
- STRICTLY follow architecture §6.1 IdleRoute and §6.2 PlanningRoute composition; ViewModel naming and state-flow shape

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] IdleViewModel surfaces greeting from db.users.getCurrentUser (AC-1 PRIMARY)
- [x] Suggestion chip tap creates session + sends message (AC-2)
- [x] PlanningViewModel maps message status to currentPhase header (AC-3)
- [x] Plan completion emits Success transition (AC-4)
- [x] createSession failure surfaces inline error toast (AC-5)
- [x] Cancel button calls cancelPlan for active planId (AC-6)
- [x] gradlew :app:compileDebugKotlin clean
- [x] Sandbox stories untouched (no diff under android/app/src/debug/)
- [ ] gradlew test clean (blocked by baseline failures outside this task)
- [ ] gradlew detekt clean (blocked by existing lint baseline issue)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: IdleViewModel surfaces greeting from db.users.getCurrentUser [PRIMARY]
  GIVEN: An authenticated user with displayName="Avery" returned from a fake UserRepository.subscribeToCurrentUser() Flow
  WHEN:  IdleViewModel.state is collected
  THEN:  First non-loading emission has greeting containing "Avery" matching the time-of-day rule (Good morning/afternoon/evening, Avery)

  TDD_STATE:     RED replayed in `/tmp/CHAT-S04-T04-red/android` from base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308`; the targeted test command failed at compile time before the implementation existed because the new idle/planning test sources could not resolve the repositories and ViewModel types. GREEN: the current targeted test command passes in the main worktree.
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/idle/IdleViewModelTest.kt
  TEST_FUNCTION: state_emitsGreetingWithDisplayNameFromCurrentUser

AC-2: Suggestion chip tap creates session + sends message
  GIVEN: An IdleViewModel with a fake SessionRepository that returns Result.success("sess-42") from createSession and a fake ChatRepository capturing sendMessage args
  WHEN:  viewModel.onSuggestionTap(SuggestionChip(text="Plan a scenic 2-hour ride")) is invoked
  THEN:  Fake SessionRepository.createSession was called once, fake ChatRepository.sendMessage was called with sessionId="sess-42" and content="Plan a scenic 2-hour ride", and state.navigateTo == IdleNavTarget.Planning("sess-42")

  TDD_STATE:     RED replayed in `/tmp/CHAT-S04-T04-red/android` from base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308`; the targeted test command failed at compile time before the implementation existed because the new idle/planning test sources could not resolve the repositories and ViewModel types. GREEN: the current targeted test command passes in the main worktree.
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/idle/IdleViewModelTest.kt
  TEST_FUNCTION: onSuggestionTap_createsSessionThenSendsMessageAndSetsNavigateTo

AC-3: PlanningViewModel maps message status to currentPhase header
  GIVEN: A PlanningViewModel constructed with sessionId="sess-1" and a fake ChatRepository.subscribeToMessages emitting [SessionMessage(role="agent", status="drafting")]
  WHEN:  viewModel.state is collected
  THEN:  The latest emission has currentPhase="drafting" and headerLabel mapped from the phase ordinal in LSPhaseIndicator

  TDD_STATE:     RED replayed in `/tmp/CHAT-S04-T04-red/android` from base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308`; the targeted test command failed at compile time before the implementation existed because the new idle/planning test sources could not resolve the repositories and ViewModel types. GREEN: the current targeted test command passes in the main worktree.
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/planning/PlanningViewModelTest.kt
  TEST_FUNCTION: state_mapsLatestAgentMessageStatusToCurrentPhase

AC-4: Plan completion emits Success transition
  GIVEN: A PlanningViewModel subscribed to a fake RouteRepository.subscribeToActiveRoutePlans that emits [RoutePlan(status="completed", options=[opt1, opt2, opt3])]
  WHEN:  viewModel.state is collected
  THEN:  An emission with transition == PlanningTransition.Success(routeOptions) is produced exactly once for that completed plan

  TDD_STATE:     RED replayed in `/tmp/CHAT-S04-T04-red/android` from base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308`; the targeted test command failed at compile time before the implementation existed because the new idle/planning test sources could not resolve the repositories and ViewModel types. GREEN: the current targeted test command passes in the main worktree.
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/planning/PlanningViewModelTest.kt
  TEST_FUNCTION: state_emitsSuccessTransitionWhenActivePlanCompletes

AC-5: createSession mutation failure surfaces inline error toast
  GIVEN: An IdleViewModel with a fake SessionRepository.createSession returning Result.failure(IOException("offline"))
  WHEN:  viewModel.onSend("plan a ride") is invoked
  THEN:  state.errorToast is non-null with message containing "offline" and state.navigateTo remains null

  TDD_STATE:     RED replayed in `/tmp/CHAT-S04-T04-red/android` from base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308`; the targeted test command failed at compile time before the implementation existed because the new idle/planning test sources could not resolve the repositories and ViewModel types. GREEN: the current targeted test command passes in the main worktree.
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/idle/IdleViewModelTest.kt
  TEST_FUNCTION: onSend_createSessionFailure_surfacesErrorToastAndStaysOnIdle

AC-6: Cancel button calls cancelPlan for active planId
  GIVEN: A PlanningViewModel where the active plan has planId="plan-7" and a fake RouteRepository capturing cancelPlan calls
  WHEN:  viewModel.cancel() is invoked
  THEN:  Fake RouteRepository.cancelPlan was called exactly once with routePlanId="plan-7"

  TDD_STATE:     RED replayed in `/tmp/CHAT-S04-T04-red/android` from base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308`; the targeted test command failed at compile time before the implementation existed because the new idle/planning test sources could not resolve the repositories and ViewModel types. GREEN: the current targeted test command passes in the main worktree.
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/planning/PlanningViewModelTest.kt
  TEST_FUNCTION: cancel_invokesCancelPlanWithActivePlanId

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/idle/IdleUiState.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/planning/PlanningRoute.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/planning/PlanningUiState.kt (NEW)
- android/app/src/main/java/com/laneshadow/data/chat/ChatRepository.kt (NEW — interface + Impl)
- android/app/src/main/java/com/laneshadow/data/session/SessionRepository.kt (NEW — interface + Impl)
- android/app/src/main/java/com/laneshadow/data/route/RouteRepository.kt (NEW — interface + Impl, scoped to active plans only for this task)
- android/app/src/main/java/com/laneshadow/data/user/UserRepository.kt (NEW — interface + Impl, getCurrentUser)
- android/app/src/main/java/com/laneshadow/data/dto/SessionMessageDto.kt (NEW)
- android/app/src/main/java/com/laneshadow/data/dto/PlanningSessionDto.kt (NEW)
- android/app/src/main/java/com/laneshadow/data/dto/RoutePlanDto.kt (NEW)
- android/app/src/main/java/com/laneshadow/di/RepositoryModule.kt (NEW)
- android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt (MODIFY — replace IdleScreen mock-call with IdleRoute, PlanningScreen mock-call with PlanningRoute)
- android/app/src/test/java/com/laneshadow/ui/idle/IdleViewModelTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/planning/PlanningViewModelTest.kt (NEW)

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt — v2 template untouched
- android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt — v2 template untouched
- android/app/src/debug/java/com/laneshadow/sandbox/** — sandbox stories and mock providers stay golden
- android/app/src/main/java/com/laneshadow/services/RideFlowState.kt — owned by T02
- Any iOS file under ios/**

Scope exceptions reviewed for remediation:
- `android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt` was updated outside `writeAllowed` to add the provider/gateway surface the reviewer required so repository traffic no longer exposes raw `ConvexClient` access from DI.
- `android/app/src/test/java/com/laneshadow/navigation/AuthRootNavigationContractTest.kt` was updated outside `writeAllowed` to lock the reviewer-requested `Route.Home -> IdleRoute` contract and prevent regression back to the mock-driven `IdleScreen` path.
- `android/app/src/test/java/com/laneshadow/di/RepositoryModuleContractTest.kt` was added outside `writeAllowed` as a verification-only regression guard for the raw `ConvexClient` binding removal.

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use hiltViewModel<T, T.Factory>() for sessionId-parameterized ViewModels (AssistedInject)
- Use flatMapLatest({ sessionId -> ... }) when re-subscribing on session change
- Map domain types to the existing MockState.value types via toMockState() extension at the Route boundary only
- Use kotlinx.serialization Json for ConvexClient subscribe/mutation/action arg encoding
- Use viewModelScope.launch for all suspend mutations; never GlobalScope

⚠️ Ask First:
- Adding hilt-navigation-compose dependency if not already present
- Modifying MainNavGraph route signatures (e.g., adding sessionId arg to Route.Planning) — coordinate with T08/T09
- Diverging from existing toMockState adapter pattern when domain shape differs significantly

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- IdleRoute.kt + IdleViewModel.kt + IdleUiState.kt + PlanningRoute.kt + PlanningViewModel.kt + PlanningUiState.kt
- ChatRepository / SessionRepository / RouteRepository / UserRepository (interfaces + Impls)
- DTOs for SessionMessage / PlanningSession / RoutePlan
- RepositoryModule.kt (Hilt bindings)
- MainNavGraph.kt updates wiring Routes
- ViewModel tests for AC-1..AC-6

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

[Standard RED -> GREEN -> REFACTOR per AC.]

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/android-architecture.md [PRIMARY PATTERN]
   - Lines: 744-820
   - Focus: IdleRoute and PlanningRoute composition with hiltViewModel + collectAsStateWithLifecycle + LaunchedEffect-driven navigation

2. .spec/prds/v3-integration/architecture/android-architecture.md
   - Lines: 627-740
   - Focus: Convex Client Wrapper, Repository interfaces, DTO ↔ Domain mapping

3. .spec/prds/v3-integration/05-uc-chat.md
   - Lines: 21-58
   - Focus: UC-CHAT-01 + UC-CHAT-02 acceptance criteria

4. android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt
   - Lines: 1-200
   - Focus: Existing IdleScreen signature and MockState contract this Route must adapt

5. android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt
   - Lines: 1-200
   - Focus: ConvexClient + setAuth integration from Sprint 03

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE history per AC
Gate 2: All tests pass — cd android && ./gradlew test (Exit 0)
Gate 3: Type check — cd android && ./gradlew :app:compileDebugKotlin (Exit 0)
Gate 4: Static analysis — cd android && ./gradlew detekt (Exit 0 if enabled)
Gate 5: Token compliance — scripts/tokens/enforce-native-compliance.sh (Exit 0)
Gate 6: Sandbox stories untouched — git diff --name-only android/app/src/debug/ (no diff)
Gate 7: Scope compliance — git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-T02 (RideFlowState/Action/ChatViewModel), AUTH-S03-T04 (ConvexClientProvider), Sprint 03 backend queries
Blocks: CHAT-S04-T06, CHAT-S04-T08, CHAT-S04-T09b

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-T04",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN current user emission WHEN IdleViewModel.state collected THEN greeting contains displayName", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.idle.IdleViewModelTest.state_emitsGreetingWithDisplayNameFromCurrentUser", "satisfied": true, "evidence": "RED replay in `/tmp/CHAT-S04-T04-red/android` against base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308` failed at compile time in the new idle/planning test sources; GREEN: the current targeted test command passes in the main worktree.", "remediation": "Implemented real-data repositories/ViewModels and the Route.Home -> IdleRoute wiring."},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN a suggestion chip WHEN tapped THEN SessionRepository.createSession + ChatRepository.sendMessage are invoked and navigateTo is set", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.idle.IdleViewModelTest.onSuggestionTap_createsSessionThenSendsMessageAndSetsNavigateTo", "satisfied": true, "evidence": "RED replay in `/tmp/CHAT-S04-T04-red/android` against base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308` failed at compile time in the new idle/planning test sources; GREEN: the current targeted test command passes in the main worktree.", "remediation": "Implemented real-data repositories/ViewModels and the Route.Home -> IdleRoute wiring."},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN agent message status WHEN PlanningViewModel renders THEN currentPhase reflects latest status", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.planning.PlanningViewModelTest.state_mapsLatestAgentMessageStatusToCurrentPhase", "satisfied": true, "evidence": "RED replay in `/tmp/CHAT-S04-T04-red/android` against base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308` failed at compile time in the new idle/planning test sources; GREEN: the current targeted test command passes in the main worktree.", "remediation": "Implemented real-data repositories/ViewModels and the Route.Home -> IdleRoute wiring."},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN active plan completes WHEN PlanningViewModel.state emits THEN transition=Success", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.planning.PlanningViewModelTest.state_emitsSuccessTransitionWhenActivePlanCompletes", "satisfied": true, "evidence": "RED replay in `/tmp/CHAT-S04-T04-red/android` against base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308` failed at compile time in the new idle/planning test sources; GREEN: the current targeted test command passes in the main worktree.", "remediation": "Implemented real-data repositories/ViewModels and the Route.Home -> IdleRoute wiring."},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN createSession failure WHEN onSend invoked THEN errorToast is set and navigateTo stays null", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.idle.IdleViewModelTest.onSend_createSessionFailure_surfacesErrorToastAndStaysOnIdle", "satisfied": true, "evidence": "RED replay in `/tmp/CHAT-S04-T04-red/android` against base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308` failed at compile time in the new idle/planning test sources; GREEN: the current targeted test command passes in the main worktree.", "remediation": "Implemented real-data repositories/ViewModels and the Route.Home -> IdleRoute wiring."},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN active planId WHEN cancel() invoked THEN RouteRepository.cancelPlan called with that id", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.planning.PlanningViewModelTest.cancel_invokesCancelPlanWithActivePlanId", "satisfied": true, "evidence": "RED replay in `/tmp/CHAT-S04-T04-red/android` against base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308` failed at compile time in the new idle/planning test sources; GREEN: the current targeted test command passes in the main worktree.", "remediation": "Implemented real-data repositories/ViewModels and the Route.Home -> IdleRoute wiring."},
    {"id": "TC-1", "type": "test_criterion", "description": "Greeting interpolates displayName", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.idle.IdleViewModelTest.state_emitsGreetingWithDisplayNameFromCurrentUser", "satisfied": true, "evidence": "RED replay in `/tmp/CHAT-S04-T04-red/android` against base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308` failed at compile time in the new idle/planning test sources; GREEN: the current targeted test command passes in the main worktree.", "remediation": "Implemented real-data repositories/ViewModels and the Route.Home -> IdleRoute wiring."},
    {"id": "TC-2", "type": "test_criterion", "description": "Suggestion-chip tap drives createSession + sendMessage", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.idle.IdleViewModelTest.onSuggestionTap_createsSessionThenSendsMessageAndSetsNavigateTo", "satisfied": true, "evidence": "RED replay in `/tmp/CHAT-S04-T04-red/android` against base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308` failed at compile time in the new idle/planning test sources; GREEN: the current targeted test command passes in the main worktree.", "remediation": "Implemented real-data repositories/ViewModels and the Route.Home -> IdleRoute wiring."},
    {"id": "TC-3", "type": "test_criterion", "description": "Phase indicator follows agent message status", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.planning.PlanningViewModelTest.state_mapsLatestAgentMessageStatusToCurrentPhase", "satisfied": true, "evidence": "RED replay in `/tmp/CHAT-S04-T04-red/android` against base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308` failed at compile time in the new idle/planning test sources; GREEN: the current targeted test command passes in the main worktree.", "remediation": "Implemented real-data repositories/ViewModels and the Route.Home -> IdleRoute wiring."},
    {"id": "TC-4", "type": "test_criterion", "description": "Completed plan triggers Success transition", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.planning.PlanningViewModelTest.state_emitsSuccessTransitionWhenActivePlanCompletes", "satisfied": true, "evidence": "RED replay in `/tmp/CHAT-S04-T04-red/android` against base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308` failed at compile time in the new idle/planning test sources; GREEN: the current targeted test command passes in the main worktree.", "remediation": "Implemented real-data repositories/ViewModels and the Route.Home -> IdleRoute wiring."},
    {"id": "TC-5", "type": "test_criterion", "description": "createSession failure path surfaces toast", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.idle.IdleViewModelTest.onSend_createSessionFailure_surfacesErrorToastAndStaysOnIdle", "satisfied": true, "evidence": "RED replay in `/tmp/CHAT-S04-T04-red/android` against base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308` failed at compile time in the new idle/planning test sources; GREEN: the current targeted test command passes in the main worktree.", "remediation": "Implemented real-data repositories/ViewModels and the Route.Home -> IdleRoute wiring."},
    {"id": "TC-6", "type": "test_criterion", "description": "Cancel mutation called with active planId", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.planning.PlanningViewModelTest.cancel_invokesCancelPlanWithActivePlanId", "satisfied": true, "evidence": "RED replay in `/tmp/CHAT-S04-T04-red/android` against base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308` failed at compile time in the new idle/planning test sources; GREEN: the current targeted test command passes in the main worktree.", "remediation": "Implemented real-data repositories/ViewModels and the Route.Home -> IdleRoute wiring."}
  ]
}
-->
================================================================================

## Completion Evidence

- Implementation commit: current remediation commit on `task/CHAT-S04-T04`
- AC coverage: `IdleViewModelTest.kt` and `PlanningViewModelTest.kt` pass for AC-1 through AC-6; `AuthRootNavigationContractTest.kt` and `RepositoryModuleContractTest.kt` were added as scoped verification guards for the navigation and repository-contract review findings
- Base replay RED evidence: `/tmp/CHAT-S04-T04-red/android` run against base commit `28f4eee2f3c08fefde144513d5d5deb19c5ea308` failed at `:app:compileDebugUnitTestKotlin` because the new idle/planning test sources could not resolve the implementation types yet
- Cycle 2 remediation: `MainNavGraph` now starts at `Route.Home` instead of the raw idle route workaround; `IdleRoute` and `PlanningRoute` no longer use anonymous `{}` callbacks for visible controls; `ConvexClientProvider.sendMessage` now targets `actions/agent/sendMessage:sendMessage`; `AuthRootNavigationContractTest.kt` and `RepositoryModuleContractTest.kt` verify those contracts
- `./gradlew :app:compileDebugKotlin`: `PASS`
- `./gradlew :app:testDebugUnitTest --tests com.laneshadow.navigation.AuthRootNavigationContractTest --tests com.laneshadow.ui.idle.IdleViewModelTest --tests com.laneshadow.ui.planning.PlanningViewModelTest --tests com.laneshadow.di.RepositoryModuleContractTest`: `PASS`
- `./gradlew assembleDebug`: `PASS`
- `./gradlew test`: `BLOCKED` by existing repository baseline failures, including `SessionsDrawerTests`, `MockProviderVariantTest`, `AuthScreenViewModelTest`, `AuthScreensSourceStructureTest`, `LSPhaseIndicatorTest`, `LSRouteAttachmentCardTest`, and `PlanningScreenTest`
- Emulator smoke check: `PASS` at `/tmp/laneshadow-cycle2.png` after installing `android/app/build/outputs/apk/debug/app-debug.apk` and launching `com.laneshadow.app/com.laneshadow.MainActivity`
- `./gradlew detekt`: `BLOCKED` by existing lint baseline issue at `android/app/src/androidTest/java/com/laneshadow/ui/LoginSmokeTest.kt:28`
