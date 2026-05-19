# iOS Learnings: Sprint 08 Planning State

## Implementation Date
2026-05-08

## Edge Cases Discovered
1. `LaneShadowSessionMessage.phase` must remain a fallback only. Structured `thinkingSteps` and planning-event JSON stay authoritative, and persisted `phase` fills the gap only when those newer signals are absent.
2. Name-based `xcodebuild test` destinations were unstable because the machine had many duplicate `iPhone 16` simulators. Using the unique iOS 26.4 simulator UDID produced a real planning-suite run and screenshot.

## API Contract Notes
- Backend phase derivation order is `thinkingSteps -> planning-event JSON -> persisted message.phase -> parsing/default`.
- `phase` uses the same lowercase literals as `PlanningPhase` and decodes directly into the Swift enum.

## UI Decisions
- No UI rendering changed in this remediation. The fix preserves the existing `capsuleHeadline` and `phaseSteps` outputs while correcting the underlying phase source.

## Platform-Specific Notes
- Swift `Decodable` ignores unknown JSON keys, so a regression test can safely model future server payloads before the client starts decoding the new field.
- Swift Testing selectors behave differently from XCTest `-only-testing` filters; class-level verification on a clean simulator is more reliable for actual execution evidence.

## Files Created/Modified
- `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` — decode persisted `phase` on session messages and preserve call-site compatibility with a custom initializer
- `ios/LaneShadow/Features/Planning/PlanningPhase.swift` — add persisted-phase fallback in the backend-aligned derivation order
- `ios/LaneShadowTests/Features/Planning/PlanningViewModelTests.swift` — add regression coverage for a phase-only planning message
- `ai-specs/sprint-08-planning-state/ios-learnings.md` — remediation notes and verification learnings

## FIX-S08-IOS-T02 Current Location Wiring

## Implementation Date
2026-05-19

## Edge Cases Discovered
1. `currentLocation` must be omitted entirely when nil. Sending `null` would not match the task contract and is unnecessary because the backend already handles the absent-key case.
2. Convex Swift nested objects must be encoded as `[String: ConvexEncodable?]` so the SDK can serialize the object shape accepted by `sendMessage`.

## API Contract Notes
- `server/convex/actions/agent/sendMessage.ts` accepts `currentLocation: { lat: number, lng: number }`.
- Android already sends `currentLocation` only when present, using the same `lat`/`lng` shape; iOS now matches that behavior.

## UI Decisions
- No UI rendering changed. The fix is limited to Convex action argument construction.

## Platform-Specific Notes
- Focused simulator-backed `xcodebuild test` coverage passed for non-nil and nil `currentLocation` argument construction.
- Live AC-4 requires a running Convex planning session with device location; no product code was changed outside the iOS Convex client.

## Files Created/Modified
- `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` — include non-nil `currentLocation` in `sendMessage` action args and remove the swallow.
- `ios/LaneShadowTests/Services/ConvexClientLaneShadowTests.swift` — add coverage for non-nil and nil `currentLocation` argument behavior.
- `ai-specs/sprint-08-planning-state/ios-learnings.md` — captured implementation notes and environment blockers.
