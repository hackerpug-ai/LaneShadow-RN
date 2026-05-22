# iOS Learnings: DesignReview planning-screen capture tests

## Implementation Date
2026-05-22

## Edge Cases Discovered
1. The task spec still references legacy `.spec/design/system/refs/planning-screen/*.png`, but the active design-review pipeline resolves planning references from `.spec/design/system/views/mapapp/planning/<state>/<state>.<theme>.png`. The test inventory was aligned to the canonical `views/` tree, which currently contains 7 planning reference PNGs.
2. In sandbox-driven XCUITests, `planningscreen` is the only consistently discoverable planning sentinel. Child ids like `planningscreen-map` and `planningscreen-chat-input` are not reliably surfaced in the accessibility tree for these stories, so the capture helper waits on the root container only.
3. `xcodebuild -only-testing` requires the XCTest identifier form `LaneShadowUITests/DesignReviewCaptureTests/test_*`; the older selector shape with `/DesignReview/DesignReviewCaptureTests/` silently executes zero tests.

## API Contract Notes
- `AppLauncher.launchApp(app, sandbox: true, sandboxStoryId: ...)` is the correct path for design-review planning captures; no auth bypass or fake planning injection is needed.
- `DesignReviewHelpers.setupDeterminismEnvironment(app:colorScheme:)` can be safely called immediately before every sandbox launch; dark variants must pass `colorScheme: "dark"` explicitly.

## UI Decisions
- Planning capture attachments use `planning-screen.{variant}.{theme}` to match the canonical `(screen, state, theme)` manifest shape consumed by the design-review pipeline.
- The capture set mirrors the current reference inventory exactly: `scouting.light`, `drawing.light`, `weather.light`, `scoring.dark`, `slow-planning.light`, `cancel-prompt.light`, and `single-candidate.light`.

## Platform-Specific Notes
- Simulator UI-test batching can hit transient `SBMainWorkspace Busy` / early runner exit failures if launches overlap; rerunning serially succeeds without code changes.
- Repo-level JS checks in this worktree currently fail because `node_modules` tools are unavailable (`tsgo`, `tsx`, `vitest`) and `biome` scans generated DerivedData artifacts when run repo-wide.

## Files Created/Modified
- `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` — added planning-screen capture inventory and sandbox launch helper.
- `ios/LaneShadowUITests/DesignReview/DesignReviewHelpers.swift` — added planning-screen capture helper with root sentinel wait and `.keepAlways` attachment capture.
- `ai-specs/PLAN-S08-IOS-T05/ios-learnings.md` — recorded task-specific learnings and verification caveats.
