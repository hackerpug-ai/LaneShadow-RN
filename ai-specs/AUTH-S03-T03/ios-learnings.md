# iOS Learnings: AUTH-S03-T03 Convex Client Wrapper

## Implementation Date
2026-04-29

## Edge Cases Discovered
1. Swift 6 strict concurrency flags `@MainActor` wrappers around non-Sendable SDK clients; avoiding actor isolation on the wrapper reduced data race diagnostics.
2. `Session` from sandbox domain is not `Decodable`; a dedicated decodable DTO adapter is needed before exposing `AsyncStream<[Session]>`.

## API Contract Notes
- Convex Swift SDK `AuthProvider` uses callback-driven token updates (`onIdToken`) rather than a pull-only token API.
- `ConvexClient` APIs are string endpoint based; typed enums prevent route typos in call sites.

## UI Decisions
- No UI surface changes were introduced in this task.

## Platform-Specific Notes
- XcodeGen source folder paths must exist before generation (`LaneShadow/Services` needed creation first).
- Full `xcodebuild test` currently includes unrelated failing suites in this branch; focused integration tests for this task pass.

## Files Created/Modified
- `ios/project.yml` — added synced folders for `LaneShadow/Services` and `LaneShadowTests/Integration`.
- `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` — typed Convex wrapper, auth bridge, session subscription adapter.
- `ios/LaneShadowTests/Integration/ConvexClientTests.swift` — AC coverage tests for package usage, wrapper API, auth callback, stream type, typed endpoints.
