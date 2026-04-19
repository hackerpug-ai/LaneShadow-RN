# iOS Learnings: Avatar Component

## Implementation Date
2026-04-19

## Task
UI-001-ios-avatar: Implement Avatar component in SwiftUI

## Edge Cases Discovered

### 1. Reserved Keywords in Swift Enums
**Issue**: `default` is a reserved keyword in Swift and cannot be used as an enum case name.
**Solution**: Use backticks to escape the keyword: `case `default`` or rename to `defaultSize` for size variants.
**Learning**: Always check Swift reserved keywords when translating from React Native/JavaScript where `default` is not reserved.

### 2. Xcode Project File Management
**Issue**: Adding Swift files to Xcode projects programmatically is complex and error-prone. The project.pbxproj file uses cryptic 24-character hex IDs and complex cross-references.
**Solution**: Created Avatar.swift in the main app directory (`ios/LaneShadow/Avatar.swift`) where it can be manually added to the Xcode project target.
**Alternative**: Consider using a Makefile or Ruby script for Xcode project manipulation in future tasks.
**Learning**: For iOS components, create files in the standard Xcode project structure and document manual Xcode project addition steps.

### 3. Swift Linter Auto-Formatting
**Issue**: SwiftFormat (run via lefthook pre-commit hook) automatically reformatted code during commit.
**Changes Made**:
- Converted `switch` statements with closures to `switch` expressions
- Converted `if let` patterns to concise `if let` expressions
- Standardized spacing and formatting
**Learning**: Embrace SwiftFormat's auto-formatting - it produces more idiomatic Swift code. Don't fight the linter.

### 4. Test File Discovery
**Issue**: Test files in subdirectories (`ios/LaneShadowTests/Components/UI/Atoms/`) were not automatically discovered by Xcode.
**Solution**: Tests need to be added to the Xcode project target to run.
**Workaround**: Created the test file structure; Xcode project addition is manual.
**Learning**: iOS test organization follows Xcode project structure, not just file system layout.

## API Contract Notes

### Avatar Component Props
- `size: AvatarSize` - Enum with `.defaultSize`, `.lg`, `.xl` (not `.default` due to reserved keyword)
- `source: String?` - Image URL (optional, not implemented yet - uses initials fallback)
- `initials: String?` - Fallback text display
- `alt: String?` - Accessibility label
- `showBorder: Bool` - Shows border with `theme.colors.border.default`
- `showRing: Bool` - Shows ring with `theme.colors.primary.default`
- `badge: (() -> AnyView)?` - Optional badge component closure

### AvatarBadge Props
- `variant: AvatarBadgeVariant` - Enum with `` `default` ``, `.success`, `.warning`, `.danger`
- `content: (() -> AnyView)?` - Optional content closure

### Dimension Mapping (from Matrix)
| Size | Width × Height | Font Size |
|------|---------------|-----------|
| `.defaultSize` | 40 × 40 | 16 |
| `.lg` | 64 × 64 | 24 |
| `.xl` | 96 × 96 | 36 |

## UI Decisions

### Circle Clipping
**Decision**: Use `.clipShape(Circle())` for both Avatar and AvatarBadge.
**Rationale**: Matches RN `borderRadius: '9999px'` and Android `CircleShape`.

### Badge Positioning
**Decision**: Use `.offset(x: -4, y: -4)` on badge in `.topTrailing` aligned ZStack.
**Rationale**: Matches RN absolute positioning `top: -4, right: -4`.

### Theme Token Usage
**Decision**: All styling uses `Theme.shared` tokens, no hardcoded values.
**Examples**:
- Colors: `theme.colors.muted.default`, `theme.colors.border.default`
- No hardcoded `Color.blue` or `Color.gray`

## Platform-Specific Notes

### SwiftUI vs React Native
1. **View Composition**: SwiftUI uses `ZStack` for layering (badge over avatar) vs RN `View` with absolute positioning.
2. **Closures vs Props**: SwiftUI uses trailing closure syntax for `badge` prop vs RN object props.
3. **Type Safety**: Swift enums provide compile-time type safety vs RN string unions.

### Image Loading
**Status**: Not implemented in this pass.
**TODO**: Add AsyncImage support when image loading infrastructure is ready.
**Current**: Shows initials fallback even when `source` is provided.

## Files Created/Modified

### Created
- `ios/LaneShadow/Avatar.swift` - Main Avatar and AvatarBadge components (193 lines)
- `ios/LaneShadowTests/Components/UI/Atoms/AvatarTests.swift` - TDD tests (118 lines)

### Modified
- `ios/LaneShadow/Sandbox/Stories/AtomsStories.swift` - Prepared for Avatar stories (commented out pending Xcode project addition)

## Next Steps

1. **Manual Xcode Project Addition**: Add `Avatar.swift` to LaneShadow target in Xcode
2. **Add Avatar Stories**: Uncomment and verify Avatar stories in AtomsStories.swift once file is in Xcode project
3. **Image Loading**: Implement AsyncImage integration for `source` prop
4. **Visual Verification**: Run sandbox to verify Avatar renders correctly in all variants

## Translation Matrix Compliance

✅ All style properties from `matrices/ui/atoms/Avatar.md` implemented:
- Layout dimensions (size variants)
- Border radius (full circle)
- Visual properties (background, border, ring)
- Typography (initials font sizes)
- Badge positioning
- Badge color variants

## Android Learnings Applied

Reviewed Android implementation at `android/app/src/main/java/com/laneshadow/ui/components/atoms/Avatar.kt`:
- Used same enum pattern (renamed `Default` to `defaultSize` for Swift)
- Matched dimension logic (40/64/96)
- Matched badge positioning (-4, -4)
- Confirmed theme token usage patterns
