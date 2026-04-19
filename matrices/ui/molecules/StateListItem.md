# StateListItem

## Component Classification
**Type:** Molecule
**Domain:** Discovery
**Source:** `components/discovery/state-list-item.tsx`

## Purpose
List item for state/region filter in discovery. Shows checkbox, state name, and route count.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Checkbox icon
- `Checkbox` (atom) - Selection indicator

### Layout Structure
```
┌─────────────────────────────────┐
│  ☑️  California        (42)     │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/discovery/state-list-item.tsx`

**Key Implementation:**
- Checkbox for selection
- State name text
- Route count badge
- Tap to toggle selection
- Ripple/feedback on tap

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/StateListItem.kt`

**Implementation Notes:**
- Use `Row` with `Checkbox` and `Text`
- `clickable` modifier for tap
- `Ripple` indication
- `Spacer` for layout
- Optional trailing count

**Expected API:**
```kotlin
@Composable
fun StateListItem(
  state: StateFilter,
  selected: Boolean,
  onPress: () -> Unit,
  modifier: Modifier = Modifier
)

data class StateFilter(
  val code: String, // "CA", "OR", etc.
  val name: String, // "California", "Oregon", etc.
  val routeCount: Int
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/StateListItem.swift`

**Implementation Notes:**
- Use `HStack` with `Toggle` or custom check
- `onTapGesture` for selection
- `Spacer` for layout
- Trailing count badge

**Expected API:**
```swift
struct StateListItem: View {
  var state: StateFilter
  var selected: Bool
  var onPress: () -> Void

  struct StateFilter {
    var code: String // "CA", "OR", etc.
    var name: String // "California", "Oregon", etc.
    var routeCount: Int
  }

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Item Height | 56dp | 56.dp | 56 | `size.listItem.default` |
| Background Color | Surface (hover on press) | surface | Color(.systemBackground) | `color.surface` |
| Ripple Color | Primary ripple | ripple | Color.primary.opacity(0.1) | `color.ripple` |
| Checkbox Size | 24dp | 24.dp | 24 | `size.checkbox.default` |
| Checkbox Color | Primary copper | colorPrimary | Color.primary | `color.primary` |
| State Name Font | Body large | Typography.bodyLarge | Font.body | `typography.body` |
| State Name Color | Text primary | onSurface | Color.primary | `color.textPrimary` |
| Count Font | Label medium | Typography.labelMedium | Font.subheadline | `typography.label` |
| Count Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Gap (checkbox-name) | 16dp | 16.dp | 16 | `spacing.lg` |
| Divider | Bottom (not last) | Divider() | Divider | `separator.default` |
| Padding Horizontal | 16dp | 16.dp | 16 | `spacing.lg` |

## NOTES

### Interaction
- Tap anywhere to toggle selection
- Ripple/scale feedback
- Checkbox animates
- Optional long-press for quick actions

### Visual States
- **Default:** Unchecked, normal opacity
- **Selected:** Checked, primary color
- **Pressed:** Ripple/scale feedback
- **Disabled:** Grayed out, no interaction

### Layout
- Checkbox: Left-aligned
- State name: Left of spacer
- Route count: Right-aligned
- Full-width tap target

### Accessibility
- `accessibilityLabel`: "{state.name}, {routeCount} routes"
- `accessibilityHint`: selected ? "Selected, tap to deselect" : "Tap to select"
- `accessibilityRole`: "checkbox"
- Checkbox state announced

### Platform Differences
- **Android:** Material3 `ListItem` or custom `Row` with `clickable`
- **iOS:** Custom `HStack` with `onTapGesture`

### Dependencies
- `Checkbox` atom (optional, can use icon)
- `IconSymbol` atom
- Ripple/feedback system
- State filter data
