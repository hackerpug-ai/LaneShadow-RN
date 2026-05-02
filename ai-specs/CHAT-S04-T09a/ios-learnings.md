# iOS Learnings: CHAT-S04-T09a

## Implementation Date
2026-05-02

## Edge Cases Discovered
1. The optimistic transcript needs a deterministic temp-ID format (`temp-{timestamp}`) so reconciliation can replace pending rows without producing duplicates.
2. Server reconciliation must match on session, content, user, and a tight timestamp window. A 5 second tolerance was required to merge optimistic rows with streamed server messages reliably.
3. Failed sends should stay in the transcript as retryable rows instead of disappearing. That keeps the UI state stable and lets `retryPending(id:)` re-use the failed item.
4. Cancel has to clear optimistic transcript rows and also cancel the active route plan. Otherwise the UI can look cancelled while the underlying plan is still running.
5. The new service type could not live in a file named `ChatTranscript.swift` because the project already has a view file with that basename. Renaming the service file to `ChatTranscriptStore.swift` avoided the filename collision.

## API Contract Notes
- `sendPlanningMessage` failures should map to a failed transcript state that remains retryable.
- Reconciliation has to be idempotent. Replaying the same server payload should not create extra rows.
- The transcript clock needs to be injectable for tests so optimistic timestamps can be aligned with fixed server timestamps.

## UI Decisions
- Pending and streaming rows are treated as active typing state in the planning transcript.
- Failed rows remain visible with retry affordance instead of collapsing back into the empty state.
- Cancel clears transient UI state immediately so the transcript does not linger in a half-sent state.

## Platform-Specific Notes
- The iOS project uses file-system synchronized groups in the Xcode project, so new Swift files can be picked up without manually editing `project.pbxproj`.
- Simulator verification showed the app still boots to the sign-in screen cleanly after the transcript changes.

## Files Created/Modified
- `ios/LaneShadow/Services/ChatStore.swift` - transcript wiring, send/cancel/retry helpers
- `ios/LaneShadow/Services/ChatTranscriptStore.swift` - optimistic transcript model and reconciliation logic
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` - optimistic send, retry, and cancel wiring
- `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` - live state plumbing
- `ios/LaneShadow/Views/Templates/PlanningScreen.swift` - transcript typing-state wiring
- `ios/LaneShadowTests/Services/ChatTranscriptTests.swift` - transcript reconciliation coverage
- `ios/LaneShadowTests/Services/ChatStoreReconciliationTests.swift` - store-level reconciliation coverage
- `ios/LaneShadowTests/Features/Planning/PlanningScreenWiringTests.swift` - planning screen send/cancel/retry coverage
