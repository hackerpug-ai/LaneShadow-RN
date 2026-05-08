# iOS Learnings: IdleScreen callback wiring

## Implementation Date
2026-05-08

## Edge Cases Discovered
1. `xcodebuild` `-only-testing` selectors from the task spec used path-like identifiers that matched zero tests; valid selectors must use `Target/Class` or `Target/Class/method`.
2. Parallel `xcodebuild` test runs against the same DerivedData location can fail with a locked `build.db`; serial reruns were required for reliable verification.

## API Contract Notes
- `IdleScreen` is a reusable template, not the live `LSMap` host, so its default map-control handlers must be explicit non-empty stubs rather than camera mutations.
- `IdleScreenContainer` remains the live host path and now routes zoom/recenter through named `LSMapCameraController` methods.

## UI Decisions
- Template-level map control defaults log explicit sprint-scoped stub messages so the UI never ships bare empty closures.
- Deferred `layers` and `toggle view` actions stay non-crashing and documented through logs instead of silent no-ops.

## Platform-Specific Notes
- `swiftlint lint ios/LaneShadow ios/LaneShadowTests ios/LaneShadowUITests` reports many repo-wide violations in generated and unrelated files; this task did not introduce new lint findings in touched files.
- `xcodebuild test -quiet` keeps output minimal; verification depends on exit code plus captured logs rather than verbose XCTest summaries.

## Files Created/Modified
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` — added callback injection and explicit default handlers
- `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` — routed live callbacks through controller methods and explicit log stubs
- `ios/LaneShadow/Views/Atoms/LSMapCameraController.swift` — added named zoom/recenter methods
- `ios/LaneShadowTests/Features/Idle/IdleScreenRetrofitTests.swift` — added recenter callback wiring test
