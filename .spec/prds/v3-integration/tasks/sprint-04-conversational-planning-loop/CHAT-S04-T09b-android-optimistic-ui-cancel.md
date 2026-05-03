================================================================================
TASK: CHAT-S04-T09b - Android optimistic UI temp-ID reconciliation in ChatViewModel (PendingMessage + cancelPlan)
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Completed
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 5/5 AC · approved

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

ChatViewModel surfaces a merged StateFlow<List<DisplayMessage>> where user-sent messages appear instantly with a temp-{timestamp} ID and reconcile to the server _id when the matching reactive emission arrives within ~2s.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST append a PendingMessage with id="temp-${System.currentTimeMillis()}" to a pendingMessages: MutableStateFlow<List<PendingMessage>> immediately on send (synchronously, before the action call)
- MUST reconcile a pending message when the Convex subscription emits a confirmed message matching (sessionId equal, content equal, role=="user", timestampMs within 5000ms tolerance) — remove from pendingMessages when reconciled
- MUST expose displayMessages: StateFlow<List<DisplayMessage>> = combine(confirmed, pending) where each entry is sealed Pending(tempId, content, sentAt) | Streaming(serverId, content, status) | Complete(serverId, content)
- MUST wire the cancel button (already in PlanningScreen template) to call ChatRepository.cancelPlan(routePlanId) for the active plan
- MUST cancel any in-flight sendMessage Job when CancelPlanning action dispatches
- MUST keep reconciliation deterministic and unit-testable without Convex (pass a fake confirmed-messages Flow into the test)
- NEVER persist PendingMessage across process death (it lives only in MutableStateFlow — confirmed list is the source of truth on resume)
- NEVER show duplicates — if a temp message reconciles, it must be removed from pendingMessages atomically
- NEVER use System.currentTimeMillis inside reduce() or in a way that breaks pure-reduce testability
- NEVER block the UI thread on the action call — wrap in viewModelScope.launch with the IO dispatcher
- STRICTLY mirror the RN reconciliation predicate from react-native/hooks/use-chat-store.ts

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] Send appends PendingMessage with temp ID synchronously (AC-1 PRIMARY)
- [x] Reconcile on matching confirmed emission (AC-2)
- [x] No reconciliation when content does not match (AC-3)
- [x] Cancel dispatches cancelPlan and cancels send Job (AC-4)
- [x] Streaming state surfaces while server is processing (AC-5)
- [x] gradlew test + compileDebugKotlin clean

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Send appends PendingMessage with temp ID synchronously [PRIMARY]
  GIVEN: A ChatViewModel with sessionId="sess-1" and an empty pendingMessages StateFlow
  WHEN:  viewModel.dispatch(RideFlowAction.SendMessage("plan a ride")) is called
  THEN:  displayMessages immediately emits a list whose last entry is DisplayMessage.Pending(tempId starts with "temp-", content="plan a ride", sentAt non-null) — within the same coroutine turn before the action returns

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/ChatViewModelOptimisticTest.kt
  TEST_FUNCTION: dispatch_sendMessage_immediatelyAppendsPendingMessageWithTempId

AC-2: Reconcile on matching confirmed emission
  GIVEN: A ChatViewModel with one PendingMessage(tempId="temp-1000", sessionId="sess-1", content="plan a ride", sentAt=1000) and a fake confirmed-messages Flow
  WHEN:  the fake Flow emits [SessionMessage(_id="msg-99", sessionId="sess-1", role="user", content="plan a ride", createdAt=1200)]
  THEN:  displayMessages next emission contains DisplayMessage.Complete(serverId="msg-99") and pendingMessages.value is empty

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/ChatViewModelOptimisticTest.kt
  TEST_FUNCTION: reconcile_matchingConfirmedEmission_removesPendingAndKeepsServerEntry

AC-3: No reconciliation when content does not match
  GIVEN: A PendingMessage(content="plan a ride") and a confirmed emission with content="different message"
  WHEN:  displayMessages is collected after the emission
  THEN:  Both the Pending entry and the Complete entry coexist in displayMessages (no false reconciliation)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/ChatViewModelOptimisticTest.kt
  TEST_FUNCTION: reconcile_contentMismatch_keepsBothEntries

AC-4: Cancel dispatches cancelPlan and cancels send Job
  GIVEN: A ChatViewModel currently in Planning state with a non-null sendJob and activePlanId="plan-7"; fake ChatRepository spy
  WHEN:  viewModel.dispatch(RideFlowAction.CancelPlanning) is invoked
  THEN:  Fake ChatRepository.cancelPlan was called with routePlanId="plan-7" exactly once AND sendJob.isCancelled == true

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/ChatViewModelOptimisticTest.kt
  TEST_FUNCTION: dispatch_cancelPlanning_callsCancelPlanAndCancelsSendJob

AC-5: Streaming state surfaces while server is processing
  GIVEN: A confirmed agent message with role="agent" and status="drafting" emitted on the messages Flow
  WHEN:  displayMessages is collected
  THEN:  The corresponding entry is DisplayMessage.Streaming(serverId, content, status="drafting") — not Complete and not Pending

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/ChatViewModelOptimisticTest.kt
  TEST_FUNCTION: displayMessages_agentStreamingStatus_surfacesAsStreamingVariant

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/services/ChatViewModel.kt (MODIFY — add pendingMessages, displayMessages, reconcile() helper, cancel-plan side effect)
- android/app/src/main/java/com/laneshadow/services/PendingMessage.kt (NEW)
- android/app/src/main/java/com/laneshadow/services/DisplayMessage.kt (NEW — sealed Pending/Streaming/Complete)
- android/app/src/main/java/com/laneshadow/services/MessageReconciler.kt (NEW — pure reconcile fun)
- android/app/src/test/java/com/laneshadow/services/ChatViewModelOptimisticTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/services/MessageReconcilerTest.kt (NEW)

writeProhibited:
- android/app/src/main/java/com/laneshadow/services/RideFlowReducer.kt — pure reducer untouched
- android/app/src/main/java/com/laneshadow/data/chat/ChatRepository.kt — interface contract from T04
- android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt — v2 template untouched
- Any iOS file under ios/**

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Keep MessageReconciler.reconcile(pending, confirmed) a pure top-level fun for unit testability
- Use combine(pendingMessages, confirmedMessages) for displayMessages
- Use SystemClock injection (or Clock parameter) for timestamps to keep tests deterministic
- Use Turbine for collecting StateFlow emissions in tests

⚠️ Ask First:
- If the RN reconciliation tolerance differs from 5000ms — adopt RN's value verbatim
- Whether to emit Streaming for user messages (decision: NO — Streaming is agent-only)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- PendingMessage.kt (data class)
- DisplayMessage.kt (sealed interface Pending/Streaming/Complete)
- MessageReconciler.kt (pure reconcile fun)
- ChatViewModel.kt (MODIFY): add pendingMessages MutableStateFlow, displayMessages StateFlow via combine, reconcile-on-emit, cancel-plan side effect on CancelPlanning

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

[Standard RED -> GREEN -> REFACTOR per AC.]

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. react-native/hooks/use-ride-flow.ts [PRIMARY PATTERN]
   - Lines: 260-310
   - Focus: CANCEL_PLANNING transition behavior (preserve routeOptions on cancel)

2. react-native/hooks/
   - Lines: all use-chat-store* files
   - Focus: RN reconciliation predicate — match tolerance and sort order verbatim

3. .spec/prds/v3-integration/05-uc-chat.md
   - Lines: 40-60
   - Focus: UC-CHAT-02 AC#4 (optimistic temp ID + reconcile)

4. .spec/prds/v3-integration/architecture/android-architecture.md
   - Lines: 458-570
   - Focus: ChatViewModel shape with sendJob and dispatch side effects

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE history per AC
Gate 2: All tests pass — cd android && ./gradlew test (Exit 0)
Gate 3: Type check — cd android && ./gradlew :app:compileDebugKotlin (Exit 0)
Gate 4: Static analysis — cd android && ./gradlew detekt (skip if not enabled)
Gate 5: Token compliance — scripts/tokens/enforce-native-compliance.sh (Exit 0)
Gate 6: Scope compliance — git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-T02 (ChatViewModel scaffold), CHAT-S04-T04 (ChatRepository.cancelPlan + subscribeToMessages)
Blocks: CHAT-S04-T10b (Android half — ErrorScreen handling of cancellation-derived errors)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-T09b",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN ChatViewModel WHEN SendMessage dispatched THEN Pending entry appears immediately", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.ChatViewModelOptimisticTest.dispatch_sendMessage_immediatelyAppendsPendingMessageWithTempId", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN matching confirmed emission WHEN displayMessages collected THEN Pending replaced by Complete", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.ChatViewModelOptimisticTest.reconcile_matchingConfirmedEmission_removesPendingAndKeepsServerEntry", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN content mismatch WHEN emission arrives THEN both entries persist", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.ChatViewModelOptimisticTest.reconcile_contentMismatch_keepsBothEntries", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN active sendJob and planId WHEN CancelPlanning dispatched THEN cancelPlan called and sendJob cancelled", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.ChatViewModelOptimisticTest.dispatch_cancelPlanning_callsCancelPlanAndCancelsSendJob", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN agent message with drafting status WHEN displayMessages collected THEN Streaming variant surfaced", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.ChatViewModelOptimisticTest.displayMessages_agentStreamingStatus_surfacesAsStreamingVariant", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Pending appended synchronously", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.ChatViewModelOptimisticTest.dispatch_sendMessage_immediatelyAppendsPendingMessageWithTempId", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Reconciliation predicate matches", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.ChatViewModelOptimisticTest.reconcile_matchingConfirmedEmission_removesPendingAndKeepsServerEntry", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Reconciliation predicate rejects mismatches", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.ChatViewModelOptimisticTest.reconcile_contentMismatch_keepsBothEntries", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Cancel side effect", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.ChatViewModelOptimisticTest.dispatch_cancelPlanning_callsCancelPlanAndCancelsSendJob", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Streaming state surfacing", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.ChatViewModelOptimisticTest.displayMessages_agentStreamingStatus_surfacesAsStreamingVariant", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
