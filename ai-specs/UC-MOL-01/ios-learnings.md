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

## Remediation Iteration 002 (April 24, 2026)

### Reviewer-driven fixes
1. Added exact contract XCTest selectors so all documented `-only-testing` commands are valid:
   - `test_default_render_uses_surface_card_tokens`
   - `test_action_footer_slot_renders_below_metadata`
   - `test_layout_tokens_and_minimum_touch_target`
   - `test_ontap_fires_once_and_no_highlight_without_handler`
   - `test_all_ten_stories_registered`
2. Replaced source-string-only checks with behavior/token contract checks and runtime story rendering checks for both light and dark schemes.
3. Adjusted `LSContentCard.footerTopPadding` from `theme.space.sm` to `theme.space.xs` to align with spacing.2 vertical-gap intent.
4. Upgraded `LSListRow` trailing `.toggle` from static icon to semantic `LSSwitch` atom rendering for better switch semantics/accessibility alignment.

### Validation notes
- `xcodebuild test` (full LaneShadow scheme) succeeded after remediation.
- `xcodebuild build` (LaneShadow scheme) succeeded.
- Contract selector verify commands all emitted `** TEST SUCCEEDED **`.
- Visual verification screenshot captured at `.artifacts/uc-mol-01-ios-remediation-iteration-002.png`.
