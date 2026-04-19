# MinimalOverlayWidgetPreview

## Component Classification
**Type:** Molecule
**Domain:** Map
**Source:** `components/map/minimal-overlay-widget-preview.tsx`

## Purpose
Preview container for multiple minimal overlay widgets on map. Shows widget group in discovery.

## COMPOSITION

### Child Components
- `MinimalOverlayWidget` (molecule) - Individual widgets

### Layout Structure
```
┌─────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐    │
│  │  🌡️ 72°F │  │  💨 10mph│   │
│  └──────────┘  └──────────┘    │
│                                 │
│  ┌──────────┐                   │
│  │  🌧️ Light│                   │
│  └──────────┘                   │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/map/minimal-overlay-widget-preview.tsx`

**Key Implementation:**
- Array of widget props
- Vertical or horizontal flow
- Gap between widgets
- Glass overlay background
- Positioning on map

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/MinimalOverlayWidgetPreview.kt`

**Implementation Notes:**
- Use `Column` (vertical) or `Row` (horizontal) with `Arrangement.spacedBy`
- `Surface` with glass effect for background
- Compose `MinimalOverlayWidget` instances
- `Modifier.align()` for positioning

**Expected API:**
```kotlin
@Composable
fun MinimalOverlayWidgetPreview(
  widgets: List<WidgetData>,
  layout: WidgetLayout = WidgetLayout.Vertical,
  modifier: Modifier = Modifier
)

data class WidgetData(
  val icon: String,
  val label: String,
  val value: String,
  val onPress: () -> Unit
)

enum class WidgetLayout { Vertical, Horizontal }
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/MinimalOverlayWidgetPreview.swift`

**Implementation Notes:**
- Use `VStack` (vertical) or `HStack` (horizontal) with spacing
- `RoundedRectangle` with `.ultraThinMaterial` for glass
- ForEach over widget data
- `.frame()` alignment for positioning

**Expected API:**
```swift
struct MinimalOverlayWidgetPreview: View {
  var widgets: [WidgetData]
  var layout: WidgetLayout = .vertical

  struct WidgetData {
    var icon: String
    var label: String
    var value: String
    var onPress: () -> Void
  }

  enum WidgetLayout { case vertical, horizontal }

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Background Color | Glass 90% alpha | surface.copy(alpha=0.9) | Color.ultraThinMaterial | `color.glassOverlay` |
| Corner Radius | 12dp | 12.dp | 12 | `borderRadius.lg` |
| Padding | 12dp | 12.dp | 12 | `spacing.md` |
| Gap Between Widgets | 8dp | 8.dp | 8 | `spacing.sm` |
| Elevation | 3 | 3.dp | 3 | `elevation.overlay` |
| Max Width | 200dp | 200.dp | 200 | `size.overlay.maxWidth` |

## NOTES

### Layout Behavior
- **Vertical:** Stack widgets top-to-bottom
- **Horizontal:** Stack widgets left-to-right
- Max widgets: 4 before scroll
- Auto-wrap on overflow

### Widget Composition
- Weather widgets: temperature, wind, rain
- Route stats: distance, duration
- Elevation: gain/loss
- Custom: any stat widget

### Positioning on Map
- Default: Top-left corner
- Draggable: User can reposition
- Collapsible: Minimize to icon
- Persistent: Remains during pan/zoom

### Accessibility
- `accessibilityLabel`: "Route widgets"
- `accessibilityRole`: "group"
- Each widget independently accessible

### Platform Differences
- **Android:** `Column` with `Arrangement.spacedBy`
- **iOS:** `VStack` with `spacing()`

### Dependencies
- `MinimalOverlayWidget` molecule
- Glass effect system
- Spacing tokens
