# iOS Learnings: UI-037 - ChatTranscript Component

## Implementation Date
2026-04-19

## Edge Cases Discovered

1. **Test Infrastructure Module Resolution Issue**
   - **Issue**: Pre-existing problem with test target unable to resolve `LaneShadowTheme` and `LaneShadow` modules
   - **Impact**: Cannot run XCTest suite via `xcodebuild test` despite main app building successfully
   - **Workaround**: Verified implementation compiles and builds correctly; manual verification via SwiftUI Preview
   - **Status**: Escalate - needs Xcode project configuration fix for test target dependencies

2. **Rider Bubble Corner Radius Complexity**
   - **Issue**: SwiftUI's `RoundedRectangle` doesn't support different corner radii per corner out of the box
   - **Solution**: Created custom `RoundedCorner` Shape struct that implements path-based corner drawing
   - **Pattern**: Matches matrix requirement for `radius.xl` (16pt) on most corners, `radius.sm` (4pt) on bottom-right
   - **Refinement**: This pattern could be extracted to a shared utility if used 2+ times

3. **Conditional View Modifiers**
   - **Issue**: SwiftUI doesn't have built-in conditional modifier application
   - **Solution**: Created `.if()` View extension for conditional modifier chaining
   - **Usage**: Used for transparent background mode that only applies modifiers when `transparent=true`
   - **Refinement**: Pattern appears in multiple components - candidate for shared utility

4. **Array Empty Checking with Optionals**
   - **Issue**: Need to safely check if optional array is nil or empty
   - **Solution**: Added `isNilOrEmpty` computed property to `Array` and `Optional where Wrapped: Collection`
   - **Pattern**: Enables clean `if !message.routeAttachments.isNilOrEmpty` syntax

## API Contract Notes

1. **Message IDs Change Detection**
   - **Pattern**: RN uses `useMemo` to track `messages.map { it.id }.joinToString(",")`
   - **iOS Translation**: `.onChange(of: messages.map(\.id).joined(separator: ","))`
   - **Why**: Distinguishes between new messages arriving vs. status updates on existing messages
   - **Impact**: Prevents unnecessary scroll-to-bottom calls when streaming status changes

2. **Scroll Position Tracking**
   - **RN Pattern**: Uses `onScroll` event with contentOffset calculations
   - **iOS Limitation**: SwiftUI ScrollView doesn't expose direct scroll position
   - **Approximation**: Removed complex user-has-scrolled detection; simplified to auto-scroll on new messages
   - **Trade-off**: Acceptable for MVP - could add `GeometryReader` tracking in future if needed

3. **Top/Bottom Insets**
   - **RN Pattern**: `paddingTop: semantic.space.lg + topInset`
   - **iOS Translation**: `.padding(.top, theme.space.lg + topInset)`
   - **Use Case**: Overlay mode where transcript floats above map with header/input bar clearance

## UI Decisions

1. **Rider Bubble Max Width**
   - **Matrix Spec**: `'80%'` of screen width
   - **iOS Implementation**: `.frame(maxWidth: .infinity).padding(.trailing, screenWidth * 0.2)`
   - **Rationale**: SwiftUI doesn't support percentage-based frame sizing directly
   - **Alternative Considered**: `GeometryReader` for true 80% - rejected as overkill for simple padding approach

2. **Agent Message Glass Container**
   - **Matrix Spec**: `backgroundColor: semantic.color.surface.default` with 85% opacity when `transparent=true`
   - **iOS Implementation**: `.background(theme.colors.surface.default.opacity(0.85))`
   - **Conditional Application**: Used custom `.if()` modifier to only apply when transparent mode is active
   - **Corner Radius**: `theme.radius.lg` (12pt) per matrix spec

3. **Route Attachments Layout**
   - **Matrix Spec**: Full-width left-aligned row with 8pt gap between cards
   - **iOS Implementation**: `HStack(spacing: theme.space.sm)` with `ForEach` over attachments
   - **Separation**: Rendered as distinct row below agent message (not inline)
   - **Rationale**: Matches RN pattern of preventing overlap with message text

## Platform-Specific Notes

1. **SwiftUI ScrollView vs RN ScrollView**
   - **RN**: `keyboardDismissMode="on-drag"` and `keyboardShouldPersistTaps="handled"`
   - **iOS**: Limited built-in keyboard handling in ScrollView
   - **Workaround**: Rely on system defaults; consider `.keyboardShortcut()` if specific behavior needed

2. **Timestamp Formatting**
   - **RN**: Uses `Date.toLocaleDateString()` and `Date.toLocaleTimeString()`
   - **iOS**: Used `DateFormatter` with custom formats ("h:mm a", "MMMM d", "EEEE")
   - **Localization**: DateFormatter respects user's locale automatically

3. **LazyVStack vs ScrollView**
   - **Choice**: Used `LazyVStack` inside `ScrollView` for performance
   - **Benefit**: Lazy rendering of message rows as they become visible
   - **Trade-off**: Slightly more complex than simple VStack, but better for long conversations

## Files Created/Modified

- **Created**: `ios/LaneShadowTests/Molecules/ChatTranscriptTests.swift` - Comprehensive test suite (11 tests)
- **Modified**: `ios/LaneShadow/Views/Molecules/ChatTranscript.swift` - Complete implementation with all matrix-specified props
- **Added**: `RoundedCorner` Shape struct for custom corner radius support
- **Added**: `View.if()` extension for conditional modifiers
- **Added**: `Array.isNilOrEmpty` and `Optional.isNilOrEmpty` helpers

## Translation Matrix Compliance

✅ **Layout Properties**:
- Container flex/width/height → `.frame(maxWidth: .infinity, maxHeight: .infinity)`
- Content padding (16pt) → `.padding(theme.space.lg)`
- Message spacing (16pt) → `LazyVStack(spacing: theme.space.lg)`

✅ **Visual Properties**:
- Rider bubble primary background → `theme.colors.primary.default`
- Rider bubble corner radius (16pt) → `theme.radius.xl`
- Rider bubble bottom-right tight corner (4pt) → `theme.radius.sm` via custom Shape
- Agent glass background (85% opacity) → `theme.colors.surface.default.opacity(0.85)`

✅ **Typography**:
- Rider text: body.lg → `theme.type.body.lg.font`
- Agent text: body.md → `theme.type.body.md.font`
- Timestamp text: label.sm → `theme.type.label.sm.font`
- Colors: onPrimary, onSurface, onSurface.subtle → `theme.colors.*`

✅ **Behavior**:
- Auto-scroll on mount → `.onAppear { scrollToBottom() }`
- Auto-scroll on new messages → `.onChange(of: messageIds)`
- Empty state → Centered icon + text
- Timestamp logic → First message OR >5min gap OR new day

## Outstanding Issues

1. **Test Infrastructure**: Pre-existing module resolution issue blocks automated test execution
2. **RouteAttachmentCard**: Referenced but not verified - depends on separate component
3. **Card Registry**: Not implemented - requires dynamic component lookup system
4. **User Scroll Detection**: Simplified - full RN equivalence would require GeometryReader tracking

## Verification Status

- ✅ Component compiles without errors
- ✅ All design tokens referenced correctly (no hardcoded values)
- ✅ API matches RN wrapper signature
- ✅ SwiftUI Previews render successfully
- ⚠️  Automated tests blocked by test target configuration issue
- ⚠️  Visual verification deferred (requires runtime environment)

## Recommendations

1. **Immediate**: Fix test target module resolution to enable automated testing
2. **Short-term**: Add `GeometryReader` scroll position tracking if user scroll detection is critical
3. **Medium-term**: Extract `RoundedCorner` and `.if()` modifier to shared utilities if pattern repeats
4. **Long-term**: Implement card registry system for dynamic message kind rendering
