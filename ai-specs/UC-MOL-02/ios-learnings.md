# iOS Learnings: UC-MOL-02 Toolbar + NavHeader

## Implementation Date
April 24, 2026

## Edge Cases Discovered
1. `xcodebuild` invocations cannot run in parallel against the same DerivedData path; serial test execution avoids build database lock errors.
2. Swift 6 concurrency checks require static extension helpers used as global values to be `Sendable`.

## API Contract Notes
- `IconName.ellipsis` is not present in the current token catalog; `IconName.menu` was used for action-story parity.
- The current iOS typography helper did not expose `.ui` / `.opinion`; a local typed extension maps `.ui.title.md` and `.opinion.lg` to existing theme-backed variants.

## UI Decisions
- `LSToolbar` applies safe-area handling with `safeAreaInset(edge: .top)` directly in the molecule to satisfy this task’s AC gate and avoid host hardcoded status-bar offsets.
- `LSNavHeader` large-title rendering uses a dedicated lower row with `.opinion.lg`; default uses inline `.ui.title.md` only.

## Platform-Specific Notes
- XcodeGen spec (`ios/project.yml`) is source-of-truth for new files; generated project updates were produced via `bash scripts/ios/generate-project.sh`.
- Simulator screenshot evidence captured at `.artifacts/evidence/uc-mol-02-ios-simulator.png` after launch.

## Files Created/Modified
- ios/LaneShadow/Views/Molecules/LSToolbar.swift
- ios/LaneShadow/Views/Molecules/LSNavHeader.swift
- ios/LaneShadowTests/Molecules/LSToolbarTests.swift
- ios/LaneShadowTests/Molecules/LSNavHeaderTests.swift
- ios/LaneShadow/Sandbox/Stories/Molecules/LSToolbarStory.swift
- ios/LaneShadow/Sandbox/Stories/Molecules/LSNavHeaderStory.swift
- ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift
- ios/project.yml
