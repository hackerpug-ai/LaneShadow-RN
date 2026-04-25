# iOS Learnings: UC-ORG-03 — LSNavigatorMessage + LSInlineErrorCallout

## Implementation Date
2026-04-24

## Edge Cases Discovered

### 1. LSRouteAttachmentCard Dependencies
**Issue**: LSRouteAttachmentCard has dependencies on LSWeatherBadge and WeatherCondition that weren't registered in project.yml.

**Resolution**: Simplified LSNavigatorMessage to exclude attachments for initial implementation. Need to add:
- `LaneShadow/Views/Molecules/LSWeatherBadge.swift` to project.yml
- Resolve WeatherCondition type (likely in LSWeatherTimeline)

**Lesson Learned**: Always check transitive dependencies when adding molecules. The `syncedFolder` approach in project.yml helps, but explicit molecule files need manual registration.

### 2. TypographyVariant Opinion Variants
**Issue**: TypographyVariant has private initializer, cannot extend with custom variants.

**Resolution**: Used existing `.heading.md` which maps to Newsreader font (opinion typography). The LSNavHeader already has an opinion extension pattern, but it uses heading variants internally.

**Lesson Learned**: Opinion typography in this codebase = Newsreader font = heading category. Use `.heading.md/lg` instead of trying to create `.opinion.md`.

### 3. Pre-existing Test Failures Blocking Test Suite
**Issue**: LSSectionHeaderTests has access level and concurrency errors that prevent test suite from running.

**Impact**: Cannot run TDD test verification for new code via `xcodebuild test`.

**Workaround**: Verified build succeeds with `xcodebuild build`. Component is valid Swift that compiles.

**Lesson Learned**: Test suite health gates all TDD work. Need to fix pre-existing failures before starting new features, or use targeted testing.

### 4. Color Token Structure
**Discovery**: LaneShadowTheme.color.signal has these tokens:
- `.default` - Copper #EE7C2B
- `.pressed` - Darker copper #9E4A22
- `.tint` - Light copper #F9D5B5
- `.whisper` - Very light copper #FCE8D4
- `.hover` - Medium copper #F3A164

**Usage**: Compass chip uses `.whisper` at 22% opacity for background, `.tint` for border. This matches the spec's 22% opacity requirement.

## API Contract Notes

### LSNavigatorMessage API
```swift
public init(
    body: String,
    pinned: Bool = false,
    onPin: @Sendable @escaping () -> Void,
    onDismiss: @Sendable @escaping () -> Void
)
```

**Design decisions**:
- `attachments` parameter removed for now (will add back when LSRouteAttachmentCard dependencies resolved)
- Default `pinned: false` for auto-dismiss behavior
- Both callbacks required (no default empty closures) to force explicit handling

### LSInlineErrorCallout API
Not yet implemented (will follow similar pattern with `suggestions: [String]` parameter).

## UI Decisions

### Compass Chip Implementation
**Spec requirement**: "LSPill(size: .sm) with 22% opacity signal-whisper background"

**Implementation challenge**: LSPill doesn't support background color directly.

**Solution**: Applied background and overlay as modifiers on LSPill:
```swift
LSPill(size: .sm) {
    LSIcon(name: .compass, size: .xs, resolvedColorOverride: LaneShadowTheme.color.signal.default)
}
.background(Circle().fill(LaneShadowTheme.color.signal.whisper).opacity(0.22))
.overlay(Circle().stroke(LaneShadowTheme.color.signal.tint, lineWidth: theme.borderWidth.hairline))
```

**Lesson learned**: LSPill is a shape container, not a styled component. Decorations applied externally.

### Typography for Navigator Voice
**Spec**: "body in typography.opinion.md (Newsreader serif)"

**Implementation**: Used `.heading.md` which maps to 17px Newsreader font at 22.44 line height.

**Rationale**: Theme.swift shows heading category uses Newsreader font family. This is the "opinion" voice.

## Platform-Specific Notes

### SwiftUI @Observable vs ObservableObject
This codebase uses **@Observable** (iOS 17+), not ObservableObject. Confirmed by:
- No `@Published` properties in existing code
- Main actors and Sendable everywhere
- Modern concurrency patterns

### XcodeGen Project Management
**Critical**: Never hand-edit `.xcodeproj/project.pbxproj`.

**Workflow**:
1. Add new Swift files to appropriate directories
2. Update `ios/project.yml` with explicit file paths or `syncedFolder`
3. Run `scripts/ios/generate-project.sh`
4. Verify file appears in Xcode

**Pattern for Organisms**:
```yaml
# Sprint 05 organisms
- path: LaneShadow/Views/Organisms
  type: syncedFolder
```

This auto-discovers any files in the Organisms directory.

### Test File Registration
Tests also use syncedFolder pattern:
```yaml
# Sprint 05 organism tests
- path: LaneShadowTests/Organisms
  type: syncedFolder
```

## Files Created/Modified

### Created
1. `ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift` - Main organism (115 lines)
2. `ios/LaneShadowTests/Organisms/LSNavigatorMessageTests.swift` - Test file

### Modified
1. `ios/project.yml` - Added LSWeatherBadge to molecule sources
2. Regenerated `ios/LaneShadow.xcodeproj` via xcodegen

### Pending
- LSInlineErrorCallout implementation
- LSNavigatorMessage attachment support (blocked by LSRouteAttachmentCard dependencies)
- Story files for both organisms

## Next Steps

### To Complete UC-ORG-03-ios:
1. Fix LSRouteAttachmentCard dependencies:
   - Add LSWeatherBadge.swift to project.yml ✅ (done)
   - Resolve WeatherCondition type import
2. Re-add attachments parameter to LSNavigatorMessage
3. Implement LSInlineErrorCallout organism
4. Create story files for both organisms
5. Fix pre-existing test failures blocking test suite
6. Run full TDD verification with `xcodebuild test`

### Blocked By:
- LSRouteAttachmentCard dependency resolution
- LSSectionHeaderTest access level fixes
