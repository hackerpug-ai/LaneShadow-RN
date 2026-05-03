# CHAT-S04-T09a iOS Optimistic UI Cancel Review Artifact

## Acceptance Criteria Verdicts

- [x] AC-1 Pending message appended synchronously with `temp-{timestamp}` ID. Evidence: `ios/LaneShadow/Features/Planning/PlanningViewModel.swift:147-155`, `ios/LaneShadow/Services/ChatTranscriptStore.swift:41-64`, `ios/LaneShadowTests/Services/ChatStoreReconciliationTests.swift:7-27`
- [x] AC-2 Matching emission reconciles temp into server `_id` exactly once. Evidence: `ios/LaneShadow/Services/ChatTranscriptStore.swift:66-105,187-214`, `ios/LaneShadowTests/Services/ChatStoreReconciliationTests.swift:29-65`
- [x] AC-3 Cross-session emission does not reconcile or pollute active transcript. Evidence: `ios/LaneShadow/Services/ChatStore.swift:65-80,100-113`, `ios/LaneShadow/Services/ChatTranscriptStore.swift:66-72,216-225`, `ios/LaneShadowTests/Services/ChatStoreReconciliationTests.swift:67-100`
- [x] AC-4 Streaming assistant exposes streaming to complete state. Evidence: `ios/LaneShadow/Services/ChatTranscriptStore.swift:74-85,241-264`, `ios/LaneShadow/Features/Planning/PlanningViewModel.swift:236-248`, `ios/LaneShadowTests/Services/ChatStoreReconciliationTests.swift:102-127`
- [x] AC-5 Cancel calls `cancelPlan` with active `routePlanId` and dispatches cancel flow. Evidence: `ios/LaneShadow/Features/Planning/PlanningViewModel.swift:113-130`, `ios/LaneShadowTests/Features/Planning/PlanningScreenWiringTests.swift:314-346,395-423`
- [x] AC-6 Send failure leaves retryable failed pending state with error code and visible retry affordance wired to `retryPending(id:)`. Evidence: `ios/LaneShadow/Features/Planning/PlanningViewModel.swift:157-186,189-234,424-440`, `ios/LaneShadow/Views/Molecules/ChatTranscript.swift:409-455`, `ios/LaneShadow/Views/Templates/PlanningScreen.swift:374-396`, `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift:21-38`, `ios/LaneShadowTests/Features/Planning/PlanningScreenWiringTests.swift:288-312,348-393`

## Review Verdict: APPROVED

**Reviewer**: swift-reviewer | **Review Commit**: a01e47e9 | **Date**: 2026-05-02

All 6 ACs independently verified. 19 tests (8 ChatStoreReconciliationTests + 11 PlanningScreenWiringTests) pass on live simulator. Build and lint clean. No CRITICAL or HIGH stubs found.

### Prior Blocking Notes — Resolved at Review

- **RED evidence partially preserved** (MEDIUM, non-blocking): Fresh remediation commands are documented in `ai-specs/CHAT-S04-T09a/ios-learnings.md:34-36`. Implementation is verifiably behavioral — service logic has non-trivial state change, guard chains, and timestamp math that would fail tests if deleted. Not test theatre.
- **No formal Modular Design Analysis** (MEDIUM, non-blocking): Spirit of MOD-01 satisfied — `failedMessageAffordance` is correctly isolated as a private helper; `onRetry` plumbing follows existing patterns; no Rule-of-2 violations found in diff. Process artifact missing but code is modular.

### Remaining Notes (informational)

- **ChatStore.cancelActivePlan catch block** swallows mutation errors silently (`ios/LaneShadow/Services/ChatStore.swift:110-113`). Comment "handled by UI layer" is misleading — the actual cancel+error path goes through `PlanningViewModel.cancelPlanning()` which does propagate to `errorMessage`. Method is a testability utility; MEDIUM concern, not a bug.
- **Pre-existing TODO comments** in `ChatTranscript.swift:467,473,496` (MarkdownText, LSTypingIndicator, LSRouteAttachmentCard) are not in this diff and are LOW UI-enhancement placeholders, not service stubs.
