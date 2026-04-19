# WhereToBar

## Component Classification
**Type:** Molecule
**Domain:** Map
**Source:** `components/map/where-to-bar.tsx`

## Purpose
Floating search bar for "Where to?" route planning. Primary entry point for planning.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Search and action icons
- `Input` (atom) - Search text input

### Layout Structure
```
┌─────────────────────────────────┐
│  [🔍] Where to?          [→]    │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/map/where-to-bar.tsx`

**Key Implementation:**
- Floating bar on map
- Search input with placeholder
- Submit button on right
- Glass background
- Tap to expand/fullscreen

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/WhereToBar.kt`

**Implementation Notes:**
- Use `Surface` or `Card` with elevation
- `TextField` with `leadingIcon` and `trailingIcon`
- Glass effect with `alpha`
- `clickable` for expand
- `Modifier` for positioning on map

**Expected API:**
```kotlin
@Composable
fun WhereToBar(
  placeholder: String = "Where to?",
  value: String,
  onChangeText: (String) -> Unit,
  onSubmit: () -> Unit,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/WhereToBar.swift`

**Implementation Notes:**
- Use `RoundedRectangle` background with `.ultraThinMaterial`
- `HStack` with `TextField` and buttons
- `.onTapGesture` for expand
- SF Symbol for icons
- `.frame()` for positioning

**Expected API:**
```swift
struct WhereToBar: View {
  var placeholder: String = "Where to?"
  var value: String
  var onChangeText: (String) -> Void
  var onSubmit: () -> Void

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Height | 48dp | 48.dp | 48 | `size.input.default` |
| Corner Radius | 24dp | 24.dp | 24 | `borderRadius.full` |
| Background Color | Glass 90% | surface.copy(alpha=0.9) | Color.ultraThinMaterial | `color.glassOverlay` |
| Border Color | Outline | outline | Color.gray.opacity(0.3) | `color.outline` |
| Border Width | 1dp | 1.dp | 1 | `borderWidth.thin` |
| Elevation | 4 | 4.dp | 4 | `elevation.fab` |
| Padding Horizontal | 16dp | 16.dp | 16 | `spacing.lg` |
| Placeholder Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Text Color | Text primary | onSurface | Color.primary | `color.textPrimary` |
| Search Icon | search | search | magnifyingglass | `icon.search` |
| Search Icon Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Search Icon Size | 20dp | 20.dp | 20 | `iconSize.sm` |
| Submit Icon | arrow-forward | arrow_forward | arrow.forward | `icon.submit` |
| Submit Icon Color | Primary copper | colorPrimary | Color.primary | `color.primary` |
| Submit Icon Size | 20dp | 20.dp | 20 | `iconSize.sm` |

## NOTES

### Positioning
- Default: Top-center, below status bar
- Offset: 16dp from top
- Centered horizontally
- Above map controls

### Interaction
- Tap bar: Expand to full search
- Type: Filter suggestions
- Tap submit: Initiate route planning
- Swipe down: Dismiss

### Visual States
- **Default:** Glass background, subtle border
- **Focused:** Elevated, primary border
- **Editing:** Show clear button
- **Submitting:** Show loading

### Expand Behavior
- Compact: Bar on map (default)
- Expanded: Full screen search
- Transition: Animate height and position

### Accessibility
- `accessibilityLabel`: "Where to? Search for destinations"
- `accessibilityHint`: "Tap to search for a destination"
- `accessibilityRole`: "search"
- Input labeled properly
- Submit button: "Plan route"

### Platform Differences
- **Android:** Material3 `OutlinedTextField` with rounded shape
- **iOS:** Custom `HStack` with `.ultraThinMaterial`

### Dependencies
- `Input` atom
- `IconSymbol` atom
- Glass effect system
- Search state
- Positioning on map
