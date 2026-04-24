# iOS Learnings: UC-MOL-01 Card + ListRow Molecules

## Implementation Date
April 24, 2026

## Edge Cases Discovered
1. `LSContentCard` overloaded closure initializers became ambiguous in story usage; resolved by keeping a single trailing-actions initializer and using explicit `AnyView` for optional header/actions slots when both are present.
2. `LSListRow` interactive behavior can accidentally double-fire when combining multiple tap handlers; resolved by routing interaction through one `Button(action:)` path and testing `handleTap()` once-only behavior.

## API Contract Notes
- `LSContentCard` supports optional `subtitle`, `metadata`, `chips`, optional `header` slot, and optional footer actions with divider separation.
- `LSListRow` supports typed leading/trailing slots (`icon`/`avatar` and `icon`/`chevron`/`toggle`/`button`/`none`) with optional `onTap` interaction.

## UI Decisions
- Footer spacing in `LSContentCard` was tokenized with explicit zero-gap behavior when footer is absent to satisfy the "no extra gap" acceptance requirement.
- `LSListRow` minimum touch target uses `theme.touchTarget.minTouchTarget`, with row gap/padding mapped to `theme.space.sm` and `theme.space.xs` to align with spacing token requirements.

## Platform-Specific Notes
- Xcode project membership remains generated via `ios/project.yml` + `scripts/ios/generate-project.sh`; new molecule/test/story files were added through XcodeGen and verified in `project.pbxproj`.
- Simulator visual verification captured at `.artifacts/uc-mol-01-ios.png` after build/install/launch cycle.

## Files Created/Modified
- ios/LaneShadow/Views/Molecules/LSContentCard.swift
- ios/LaneShadow/Views/Molecules/LSListRow.swift
- ios/LaneShadowTests/Molecules/LSContentCardTests.swift
- ios/LaneShadowTests/Molecules/LSListRowTests.swift
- ios/LaneShadow/Sandbox/Stories/Molecules/LSContentCardStory.swift
- ios/LaneShadow/Sandbox/Stories/Molecules/LSListRowStory.swift
- ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift
- ios/project.yml
