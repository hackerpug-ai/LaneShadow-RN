# iOS Learnings: CHAT-S04-T09a

## Implementation Date
2026-05-02

## Edge Cases Discovered
1. The optimistic transcript needs a deterministic temp-ID format (`temp-{timestamp}`) so reconciliation can replace pending rows without producing duplicates.
2. Server reconciliation must match on session, content, user, and a tight timestamp window. A 5 second tolerance was required to merge optimistic rows with streamed server messages reliably.
3. Reconciliation must reject mismatched `sessionId` values before append/reconcile. Wrong-session server emissions are now ignored instead of polluting the active transcript.
4. Failed sends should stay in the transcript as retryable rows instead of disappearing. The failed UI model now carries `errorCode` and `retryable`, which keeps the retry affordance visible.
5. The planning view model must preserve existing `LaneShadowError` cases when the stub already throws one. Re-normalizing a `LaneShadowError.server(...)` as a generic error erases the retry metadata.
6. Cancel has to clear optimistic transcript rows and also cancel the active route plan. Otherwise the UI can look cancelled while the underlying plan is still running.
7. The new service type could not live in a file named `ChatTranscript.swift` because the project already has a view file with that basename. Renaming the service file to `ChatTranscriptStore.swift` avoided the filename collision.

## API Contract Notes
- `sendPlanningMessage` failures should map to a failed transcript state that remains retryable, and the UI model must carry the same `errorCode`/`retryable` metadata.
- Reconciliation has to be idempotent. Replaying the same server payload should not create extra rows.
- The transcript clock needs to be injectable for tests so optimistic timestamps can be aligned with fixed server timestamps.
- The planning view model now normalizes errors locally so `LaneShadowError` instances keep their original case and do not lose their retryability classification.

## UI Decisions
- Pending and streaming rows are treated as active typing state in the planning transcript.
- Failed rows remain visible with retry affordance instead of collapsing back into the empty state.
- Cancel clears transient UI state immediately so the transcript does not linger in a half-sent state.

## Platform-Specific Notes
- The iOS project uses file-system synchronized groups in the Xcode project, so new Swift files can be picked up without manually editing `project.pbxproj`.
- Simulator verification showed the app still boots to the sign-in screen cleanly after the transcript changes.
- The retry-path regression only reproduced once the full PlanningScreen wiring suite was exercised against the simulator; the isolated store tests were not enough to expose the UI metadata loss.

## Remediation Evidence
- Earlier RED logs from the original review-fix pass were not preserved in the workspace.
- Fresh remediation RED/GREEN evidence:
  - `xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/ChatStoreReconciliationTests -only-testing:LaneShadowTests/PlanningScreenWiringTests -only-testing:LaneShadowTests/ChatTranscriptTests`
  - After fixing the session filter and error normalization, the same focused suite passed.
- Verification gates that passed after the remediation:
  - `xcodebuild build -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
  - `bash scripts/tokens/enforce-native-compliance.sh`

## Files Created/Modified
- `ios/LaneShadow/Services/ChatStore.swift` - transcript wiring, send/cancel/retry helpers
- `ios/LaneShadow/Services/ChatTranscriptStore.swift` - optimistic transcript model and reconciliation logic
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` - optimistic send, retry, and cancel wiring
- `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` - live state plumbing
- `ios/LaneShadow/Views/Templates/PlanningScreen.swift` - transcript typing-state wiring
- `ios/LaneShadow/Views/Molecules/ChatTranscript.swift` - failed-state retry affordance and metadata passthrough
- `ios/LaneShadowTests/Services/ChatTranscriptTests.swift` - transcript reconciliation coverage
- `ios/LaneShadowTests/Services/ChatStoreReconciliationTests.swift` - store-level reconciliation coverage
- `ios/LaneShadowTests/Features/Planning/PlanningScreenWiringTests.swift` - planning screen send/cancel/retry coverage
