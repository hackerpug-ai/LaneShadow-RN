# Android Learnings: CHAT-S04-T09b

## Implementation Date
2026-05-02

## Edge Cases Discovered
1. `ChatViewModel` needs an injected timestamp supplier so optimistic temp IDs stay deterministic in unit tests while production still uses `System.currentTimeMillis()`.
2. Reconciliation must treat both `rider` and `user` as user-originated roles on Android because the server and task text are not fully aligned on the role label.
3. Pending optimistic messages should live only in `MutableStateFlow`; confirmed Convex emissions remain the source of truth after process death.

## API Contract Notes
- `ChatRepository` in the services-local layer now exposes `subscribeToMessages(sessionId)` and `cancelPlan(routePlanId)` so `ChatViewModel` can merge confirmed messages and cancel active plans without touching the data-layer repository contract.
- `MessageReconciler.reconcile(pending, confirmed)` stays pure and uses timestamp data passed in by the ViewModel.
- A lightweight Hilt module provides `CoroutineDispatcher` and `clock` bindings for the ViewModel constructor.

## UI Decisions
- Optimistic pending messages render through a sealed `DisplayMessage` model with `Pending`, `Streaming`, and `Complete` variants.
- Agent messages with non-terminal statuses render as `Streaming`; user-originated confirmed messages reconcile against pending entries instead of duplicating.
- Turbine was not needed here; plain coroutine test utilities were enough for the StateFlow assertions.

## Gotchas for iOS Implementer
- The reconciliation tolerance is 5000 ms and matching is based on session ID, content, timestamp window, and user-originated role.
- Cancel planning is a side effect on the ViewModel path, not a reducer change.
- If you add optimistic UI, keep pending state out of persistent storage and derive display rows from confirmed + pending sources.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/services/ChatViewModel.kt` - optimistic pending state, display message flow, cancel-plan wiring.
- `android/app/src/main/java/com/laneshadow/services/PendingMessage.kt` - optimistic message model.
- `android/app/src/main/java/com/laneshadow/services/DisplayMessage.kt` - sealed display model.
- `android/app/src/main/java/com/laneshadow/services/MessageReconciler.kt` - pure reconciliation logic.
- `android/app/src/main/java/com/laneshadow/di/ChatModule.kt` - injected IO dispatcher and clock providers.
- `android/app/src/test/java/com/laneshadow/services/ChatViewModelOptimisticTest.kt` - AC-1 through AC-5 coverage.
- `android/app/src/test/java/com/laneshadow/services/MessageReconcilerTest.kt` - pure reconciliation coverage.
