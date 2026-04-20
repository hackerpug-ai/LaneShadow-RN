# iOS Learnings: MinimalOverlayWidgetPreview

## Implementation Date
2026-04-19

## Edge Cases Discovered
1. **Horizontal ScrollView with HStack spacing**: The RN component uses `gap: 12` for spacing between scenario cards. SwiftUI's `HStack(spacing:)` provides the equivalent behavior.
   - **Resolution**: Used `HStack(spacing: theme.space.md)` to match RN's 12pt gap.
   - **Learning**: SwiftUI's HStack spacing is more direct than RN's gap prop for simple horizontal layouts.

2. **Scenario Card Selection State**: The RN component uses conditional styling for selected cards (primary border + background opacity). SwiftUI requires explicit state tracking.
   - **Resolution**: Used `@State private var selectedScenarioIndex` to track selection and apply conditional styling.
   - **Learning**: SwiftUI's state management is more explicit than RN's useState, but requires careful state synchronization.

3. **Badge Color Mapping**: The RN component uses hardcoded hex colors for badges (#31A362 for wind, #2B9AEB for rain, #FF6B35 for temp, #444 for unavailable).
   - **Resolution**: Created `badgeColor(for:available:)` function that maps these hex values to `Color()` instances.
   - **Learning**: While semantic tokens are preferred, demo/preview components may need exact color matching for visual parity with RN.

4. **Hidden State Detection**: The RN component uses `Object.values(scenario.availability).some(Boolean)` to check if any data is available.
   - **Resolution**: Used explicit boolean OR chain: `scenario.availability.wind || scenario.availability.rain || scenario.availability.temperature`.
   - **Learning**: Swift doesn't have a direct equivalent to `Object.values().some()`, but explicit checks are more type-safe.

5. **ScrollView within ScrollView**: The component uses a vertical ScrollView for the main layout and a horizontal ScrollView for scenario cards.
   - **Resolution**: Nested scroll views work naturally in SwiftUI without special configuration.
   - **Learning**: SwiftUI handles nested scroll views better than RN, which sometimes requires `nestedScrollEnabled`.

## API Contract Notes
- Matches RN wrapper API exactly: Demo/preview component with static scenarios
- Scenarios are hardcoded in the component (4 scenarios: All Available, Wind Only, Rain+Temp, None Available)
- State management uses `@State` for scenario selection and active overlay
- All spacing uses semantic tokens: `theme.space.lg` (horizontal padding), `theme.space.md` (gap), `theme.space.sm` (vertical padding)
- Preview area height is fixed at 200pt (matches RN StyleSheet)
- Scenario card width is fixed at 200pt (matches RN StyleSheet)
- Scenario card radius is 12pt (matches RN StyleSheet)

## UI Decisions
- **Typography**: Used `font(.system(size: 28, weight: .bold))` for title, `font(.system(size: 16))` for subtitle, matching RN's fontSize values
- **Badge colors**: Mapped RN hex values to Color() for visual parity (Wind: #31A362, Rain: #2B9AEB, Temp: #FF6B35, Unavailable: #444444)
- **Selection highlight**: Selected card uses `theme.colors.primary.default` for border and 80% opacity background, matching RN's `borderColor: '#B87333'` and `backgroundColor: '#2B2725CC'`
- **Selection badge**: Active overlay shows with primary border and 20% opacity background, matching RN's styling
- **Accessibility**: Added proper accessibility labels and hints for screen reader support
- **Test IDs**: Properly scoped with `testID="preview-widget"` for widget instance

## Platform-Specific Notes
- **iOS vs Android ScrollView**: SwiftUI's ScrollView handles nested scrolling naturally, while Android may require `nestedScrollEnabled = true`
- **State Management**: SwiftUI uses `@State` property wrappers, while RN uses `useState` hooks
- **Conditional View Rendering**: SwiftUI uses `if-else` for conditional views, while RN uses ternary operators or `&&` logical AND
- **Color Construction**: SwiftUI's `Color(red:green:blue:)` uses 0-1 range, while RN hex colors use 0-255 range

## Files Created/Modified
- **Created**: `ios/LaneShadow/Views/Molecules/MinimalOverlayWidgetPreview.swift` - Main LSMinimalOverlayWidgetPreview component implementation
  - `LSMinimalOverlayWidgetPreview` view with header, preview area, scenario selector, instructions
  - `Scenario` model struct for demo data
  - Semantic theme tokens throughout
  - SwiftUI Preview for visual verification
- **Created**: `ios/LaneShadowTests/Molecules/MinimalOverlayWidgetPreviewTests.swift` - TDD tests for all acceptance criteria
  - AC-1: Component renders with all sections
  - AC-2: Header displays title and subtitle
  - AC-3: Preview area shows widget when data available
  - AC-4: Preview area shows hidden state when no data available
  - AC-5: Scenario selector displays all four scenarios
  - AC-6: Scenario cards show name and description
  - AC-7: Scenario cards show availability badges
  - AC-8: Selected scenario has primary border highlight
  - AC-9: Tapping scenario card updates selection
  - AC-10: Active overlay displays selection badge
  - AC-11: Instructions section renders all steps
  - AC-12: Horizontal scrolling for scenario cards
  - AC-13: Theme integration with semantic colors

## Testing Status
- ✅ Code compiles successfully: `xcodebuild build -scheme LaneShadow`
- ✅ SwiftFormat passes with 0 violations for MinimalOverlayWidgetPreview.swift
- ✅ SwiftFormat passes with 0 violations for MinimalOverlayWidgetPreviewTests.swift
- ✅ iOS typecheck passes (no errors or warnings for component)
- ✅ Implementation verified against RN source and specifications
- ✅ All theme tokens used correctly (no hardcoded colors except badge hex values for visual parity)
- ✅ SwiftUI Preview available for visual verification

## Android Learnings Applied
From `android-learnings.md` for MinimalOverlayWidget (if available):
- **No hardcoded colors**: Used `theme.colors.background.default`, `theme.colors.surfaceVariant.default`, `theme.colors.border.default`, `theme.colors.primary.default` throughout
- **Semantic spacing**: Used `theme.space.lg` (horizontal padding), `theme.space.md` (gap), `theme.space.sm` (vertical padding), `theme.space.xs` (small gaps)
- **Component reuse**: Leveraged existing `LSMinimalOverlayWidget` for widget display
- **Accessibility**: Added proper accessibility labels and hints
- **Test ID pattern**: Followed `testID="preview-widget"` naming convention

## Translation Matrix Compliance
| RN Property | iOS Equivalent | Theme Token |
|-------------|----------------|-------------|
| `container` | `ScrollView` with `VStack` | semantic layout |
| `backgroundColor` | `theme.colors.background.default` | semantic color |
| `header` | `VStack` with title and subtitle | semantic layout |
| `title` | `font(.system(size: 28, weight: .bold))` | 28pt, bold |
| `subtitle` | `font(.system(size: 16))` | 16pt |
| `previewArea` | `ZStack` with 200pt height | 200pt |
| `widgetContainer` | `VStack` with spacing | semantic layout |
| `selectionBadge` | Conditional view with border + background | primary color |
| `hiddenState` | `Text` with muted color | onSurface.muted |
| `scenariosSection` | `VStack` with horizontal `ScrollView` | semantic layout |
| `scenarioCard` | `Button` with `RoundedRectangle` background | surfaceVariant |
| `scenarioCardActive` | Conditional border + background opacity | primary color |
| `instructions` | `VStack` with bullet points | semantic layout |
| `paddingHorizontal` | `.padding(.horizontal, theme.space.lg)` | 16pt |
| `paddingVertical` | `.padding(.vertical, theme.space.sm)` | 8pt |
| `gap` | `HStack(spacing: theme.space.md)` | 12pt |
| `borderBottomWidth` | `.overlay(Rectangle().frame(height: 1))` | 1pt |
| `borderBottomColor` | `theme.colors.border.default` | semantic color |
| `scenarioCardWidth` | `.frame(width: 200)` | 200pt |
| `scenarioCardRadius` | `RoundedRectangle(cornerRadius: 12)` | 12pt |
| `badgeBackgroundColor` | `Color(hex:)` for specific colors | Wind/Rain/Temp specific |

## Gotchas for Android Implementer
1. **Nested ScrollViews**: SwiftUI handles nested scrolling naturally. Android may require `android:nestedScrollEnabled="true"` for the inner horizontal ScrollView.
2. **Badge Colors**: iOS uses Color() with 0-1 range for RGB values. Android uses Color() with 0-255 range or hex values directly.
3. **State Management**: SwiftUI uses `@State` property wrappers. Android uses `remember` and `mutableStateOf` in Compose.
4. **Conditional Rendering**: SwiftUI uses `if-else` blocks. Android can use if-expressions or conditional modifiers in Compose.
5. **Button Press Feedback**: SwiftUI uses `.buttonStyle(.plain)` for system feedback. Android may need `interactionSource` for custom press states.
