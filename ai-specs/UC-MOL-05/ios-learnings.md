# iOS Learnings: UC-MOL-05 Pill Semantics Family

## Implementation Date
April 24, 2026

## Edge Cases Discovered
1. Story registration assertions that rely on source scanning need explicit literal story IDs in source; dynamically interpolated IDs are harder to validate and caused false negatives in AC-8 tests.
2. Running multiple `xcodebuild test` commands in parallel against the same simulator destination can cause intermittent XCTest bootstrap crashes (signal kill) even when code is correct.

## API Contract Notes
- `WeatherCondition` was defined as a public enum in molecule scope with six required cases (`sun`, `rain`, `wind`, `storm`, `hot`, `cold`) so downstream molecules can import and reuse it.
- Both `.hot` and `.cold` conditions map to `.therm` icon while preserving distinct weather token families.

## UI Decisions
- `LSTagPill`, `LSFilterChip`, `LSSuggestionChip`, and `LSWeatherBadge` all compose from `LSPill` and route content through atom layer (`LSIcon`/`LSText`) to preserve tokenized sizing/typography behavior.
- Suggestion chip height is resolved through `LSPill(size: .md)` instead of hardcoded frame values.

## Platform-Specific Notes
- Swift 6 strict concurrency surfaced sendability warnings in tests that touched view initializers from non-main contexts; annotating interaction tests with `@MainActor` avoided data-race diagnostics.
- For callback-once verification, deterministic static dispatch helpers avoid brittle UIKit-control introspection against SwiftUI button internals.

## Files Created/Modified
- ios/LaneShadow/Views/Molecules/LSTagPill.swift
- ios/LaneShadow/Views/Molecules/LSFilterChip.swift
- ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift
- ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift
- ios/LaneShadowTests/Molecules/LSTagPillTests.swift
- ios/LaneShadowTests/Molecules/LSFilterChipTests.swift
- ios/LaneShadowTests/Molecules/LSSuggestionChipTests.swift
- ios/LaneShadowTests/Molecules/LSWeatherBadgeTests.swift
- ios/LaneShadow/Sandbox/Stories/Molecules/LSPillSemanticsStory.swift
- ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift
- ios/LaneShadow/Sandbox/LaneShadowStories.swift
- ios/project.yml
