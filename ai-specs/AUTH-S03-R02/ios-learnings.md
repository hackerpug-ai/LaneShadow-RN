# iOS Learnings: AUTH-S03-R02

## Implementation Date
2026-04-29

## Edge Cases Discovered
1. Snapshot generation over the full story catalog can crash (Mapbox-heavy stories) before completing all baselines; for this task, auth primitive baselines were explicitly materialized for required IDs.
2. Auth glyph coverage is split between token-driven `LSIcon` and the SF Symbol adapter (`LSIconSymbolIOS`), so auth requirements using `mail/lock/eye/check` need adapter mapping updates.

## API Contract Notes
- `LSFormField` needed additive configuration parameters (`state`, `isSecureEntry`, `leadingIcon`, `trailingIcon`, `helperText`) to support auth scenarios without introducing feature-local controls.

## UI Decisions
- `LSAuthProviderButton` was implemented as a dedicated molecule with provider-specific surface/border treatment and explicit accessibility labels while keeping layout/spacing token-based.

## Platform-Specific Notes
- Existing `IconName` generated token enum does not currently contain `mail`, `lock`, `eye`, `check`; iOS adapter coverage is currently required for those names.
- Story parity enforcement is ID-based; auth molecules needed canonical IDs to appear in coverage/parity checks.

## Files Created/Modified
- ios/LaneShadow/Views/Atoms/IconSymbolIOS.swift
- ios/LaneShadow/Views/Molecules/LSFormField.swift
- ios/LaneShadow/DesignSystem/Molecules/LSAuthProviderButton.swift
- ios/LaneShadow/Sandbox/Stories/Molecules/LSFormFieldStories.swift
- ios/LaneShadowTests/Atoms/LSIconTypeSafetyTests.swift
- ios/LaneShadowTests/Atoms/LSTextFieldTests.swift
- ios/LaneShadowTests/Sandbox/StoryCoverageTests.swift
- ios/LaneShadowTests/LaneShadowTests.swift
- ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/*.png (auth primitive baselines)
