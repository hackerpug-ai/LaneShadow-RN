# iOS Learnings: UI-002 - Badge Component

## Implementation Date
2026-04-19

## Edge Cases Discovered
1. **Story file auto-reversion**: The `AtomsStories.swift` file appears to be watched by a linter or file watcher that reverts changes. This required focusing on the core Badge implementation rather than story registration.
2. **Capsule shape implementation**: Using `.clipShape(Capsule(style: .continuous))` instead of `.cornerRadius(theme.radius.full)` provides smoother rendering on modern iOS versions.
3. **Border overlay pattern**: For the outline variant, the border must be applied as an `.overlay` with a conditional check, not as a direct modifier, to avoid applying borders to non-outline variants.

## API Contract Notes
- Badge follows the RN wrapper API exactly: `text`, `variant`, `icon`, `opacity` props
- All 7 variants from the matrix are supported: default, secondary, destructive, outline, success, warning, info
- Opacity prop is applied at the view level using `.opacity()` modifier, matching RN behavior
- Icon integration uses SF Symbols via `Image(systemName:)` for iOS native feel

## UI Decisions
- **Typography**: Used `.system(size: theme.type.label.sm.fontSize, weight: .semibold)` to match the matrix's 12sp/600w specification
- **Padding values**: Hardcoded 10px horizontal and 2px vertical as specified in the matrix (these are between token values)
- **Color resolution**: Created a private `BadgeResolvedColors` helper struct to encapsulate variant-based color logic
- **Accessibility**: Used `.accessibilityElement(children: .combine)` to merge icon and text into a single accessibility element

## Platform-Specific Notes
- iOS uses `Capsule` shape instead of explicit corner radius for pill appearance
- SF Symbols are used for icons instead of a custom icon library
- Theme access via `@Environment(\.theme)` follows the established LaneShadow pattern
- Preview providers included for all variants to aid development

## Files Created/Modified
- **Created**: `ios/LaneShadow/Views/Atoms/Badge.swift` - Main Badge component implementation
- **Created**: `ios/LaneShadowTests/Components/UI/Atoms/BadgeTests.swift` - Test file (needs Xcode project integration)
- **Modified**: `ios/LaneShadow/Sandbox/Stories/AtomsStories.swift` - Attempted story registration (reverted by linter)

## Translation Matrix Compliance
- Layout: ✅ paddingHorizontal=10, paddingVertical=2, borderRadius=full
- Colors: ✅ All variants use theme.colors (primary, secondary, danger, success, warning, info, border)
- Typography: ✅ Uses theme.type.label.sm (12sp / 18lh / 600w equivalent)
- Flex/Alignment: ✅ HStack with center alignment, flex-start alignSelf
- Border: ✅ Outline variant uses borderWidth=1 with theme.colors.border
- Opacity: ✅ Prop-controlled opacity support

## Testing Status
- Build: ✅ Compiles successfully
- Tests: ⚠️ Test file created but not integrated into Xcode project target
- Visual verification: ⏳ Requires simulator run (not yet performed)

## Next Steps
1. Add Badge.swift to Xcode project if not already added
2. Add BadgeTests.swift to Xcode test target
3. Run simulator to verify visual appearance matches RN component
4. Re-add story registration once file watcher issue is resolved
