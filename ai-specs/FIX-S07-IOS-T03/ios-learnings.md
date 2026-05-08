# iOS Learnings: Mode Toggle Logging Stub

## Implementation Date
2026-05-08

## Edge Cases Discovered
1. The task contract's `grep -A1` verification is line-sensitive, so the `Logger` call must remain on the `onToggleView` line or the immediately following line.
2. The task's `xcodebuild test -only-testing:LaneShadowTests/Features/Idle` selector succeeds in this project but resolves to zero executed tests, so exact command evidence should be preserved verbatim rather than inferred.

## API Contract Notes
- `LSMapControls.onToggleView` can remain a no-op behaviorally as long as the closure is not empty and emits the documented stub log.

## UI Decisions
- Kept the mode toggle as logging-only to preserve Sprint 08 ownership of real chat-mode wiring.

## Platform-Specific Notes
- `Logger` from `OSLog` already exists elsewhere in the iOS codebase and fits the local pattern better than introducing `os_log`.
- No new Swift files were created, so Xcode project registration changes were not required.

## Files Created/Modified
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` — replaced the empty mode-toggle stub with a logging closure.
- `ai-specs/FIX-S07-IOS-T03/ios-learnings.md` — captured iOS-specific implementation notes.
