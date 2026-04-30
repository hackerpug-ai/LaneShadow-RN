# iOS Learnings: AUTH-S03-R02

## Implementation Date
2026-04-29

## Edge Cases Discovered
1. `LSIconSymbolIOS` previews and tests must use `Theme.shared` (not `LaneShadowTheme.shared`) to stay compatible with the generated theme API.
2. SnapshotTesting first-run behavior records missing baselines and fails the first assertion run; a second run is required to verify new baselines.

## API Contract Notes
- `LSFormField` now supports auth-specific SF symbol names through additive `leadingSymbolName` / `trailingSymbolName` while preserving existing `IconName` API.
- `LSAuthProviderButton` state rendering uses token surfaces plus `colorScheme` inversion for Apple (dark mode inverts to light surface/ink text).

## UI Decisions
- Apple provider button now inverts surface/label between light and dark themes to match the social-button spec.
- Google provider mark uses brand-accurate four-color rendering only inside the mark view; surrounding layout uses semantic tokens.

## Platform-Specific Notes
- `theme.colors.surfaceVariant.pressed` is optional, so button pressed-state logic must provide semantic fallbacks.
- Main-actor isolation is required for symbol-rendering tests that instantiate `@MainActor` views.

## Files Created/Modified
- ios/LaneShadow/Views/Atoms/IconSymbolIOS.swift
- ios/LaneShadow/Views/Molecules/LSFormField.swift
- ios/LaneShadow/DesignSystem/Molecules/LSAuthProviderButton.swift
- ios/LaneShadow/Sandbox/Stories/Molecules/LSFormFieldStories.swift
- ios/LaneShadowTests/Atoms/LSIconTypeSafetyTests.swift
- ios/LaneShadowTests/Atoms/LSTextFieldTests.swift
- ios/LaneShadowTests/Atoms/__Snapshots__/LSTextFieldTests/test_formfield_auth_symbols_and_states_render.1.png
- ios/LaneShadowTests/Atoms/__Snapshots__/LSTextFieldTests/test_secure_entry_with_icons_and_helper_renders.1.png
- ios/LaneShadowTests/Sandbox/StoryCoverageTests.swift
- ios/LaneShadowTests/LaneShadowTests.swift
