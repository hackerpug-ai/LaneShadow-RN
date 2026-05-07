# iOS Learnings: Sprint 07 Context Capsule Map Controls

## Implementation Date
2026-05-07

## Edge Cases Discovered
1. The warning treatment is additive on `.idle` instead of a separate state; the headline emphasis remains copper while only the meta row flips to `status.warning.default`.
2. The saved treatment is additive on `.route` only; the overlay shares the same `radius.lg` shape so the highlight does not drift from the glass border.

## API Contract Notes
- `LSContextCapsule` takes presentation-only state: `.idle`, `.planning`, and `.route`.
- Emphasis is derived from `AttributedString.inlinePresentationIntent == .emphasized`, which keeps the molecule decoupled from idle-screen wiring.

## UI Decisions
- Extracted a shared meta-row subview so idle and route variants reuse one dot-separated layout.
- Kept planning pulse-dot isolated in its own view to contain animation and reduce-motion behavior without bloating the main body.

## Platform-Specific Notes
- Sandbox story registration uses dedicated light/dark story IDs via `.preferredColorScheme(...)` because the iOS sandbox wrapper itself is theme-aware.
- `LSContextCapsule.swift` and its tests were not target members until `scripts/ios/generate-project.sh` regenerated `LaneShadow.xcodeproj` from `ios/project.yml`.
- When `xcodebuild test` targeted `platform=iOS Simulator,name=iPhone 16`, the default simulator pool could pick a busy device; shutting down all simulators and booting a clean iPhone 16 instance stabilized the verification runs.

## Files Created/Modified
- ios/LaneShadow/Views/Molecules/LSContextCapsule.swift — new token-driven molecule implementation
- ios/LaneShadow/Sandbox/Stories/Molecules/LSContextCapsuleStories.swift — 10 sandbox stories
- ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift — story aggregation update
- ios/LaneShadowTests/Molecules/LSContextCapsuleTests.swift — molecule contract tests
- ios/project.yml — source and test registration
