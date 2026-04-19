# WaypointCard

## Component Classification
**Type:** Molecule
**Domain:** Waypoints
**Source:** `components/waypoints/waypoint-card.tsx`

## Purpose
Card display of a single waypoint. Shows location, type, and actions.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Waypoint type icon
- `Button` (atom) - Remove action

### Layout Structure
```
┌─────────────────────────────────┐
│  [📍]  San Francisco, CA   [×]  │
│        Start waypoint            │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/waypoints/waypoint-card.tsx`

**Key Implementation:**
- Card with waypoint info
- Type icon (start, via, end)
- Location name/address
- Remove button
- Reorder handle (in list)

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/WaypointCard.kt`

**Implementation Notes:**
- Use `Card` from Material3
- `Row` with `Icon`, `Text`, `IconButton`
- `Spacer` for layout
- `DraggableItem` for reorder

**Expected API:**
```kotlin
@Composable
fun WaypointCard(
  waypoint: Waypoint,
  onPress: () -> Unit,
  onRemove: () -> Unit,
  modifier: Modifier = Modifier
)

data class Waypoint(
  val id: String,
  val name: String,
  val type: WaypointType, // Start, Via, End
  val location: LatLng
)

enum class WaypointType { Start, Via, End }
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/WaypointCard.swift`

**Implementation Notes:**
- Use `RoundedRectangle` background or `ListRow`
- `HStack` with SF Symbol, Text, Button
- `Spacer` for layout
- `.onDrag()` for reorder

**Expected API:**
```swift
struct WaypointCard: View {
  var waypoint: Waypoint
  var onPress: () -> Void
  var onRemove: () -> Void

  struct Waypoint {
    var id: String
    var name: String
    var type: WaypointType
    var location: CLLocationCoordinate2D
  }

  enum WaypointType { case start, via, end }

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Background Color | Surface | surface | Color(.systemBackground) | `color.surface` |
| Corner Radius | 8dp | 8.dp | 8 | `borderRadius.md` |
| Elevation | 1 | CardDefaults.cardElevation | 1 | `elevation.card` |
| Padding | 12dp | 12.dp | 12 | `spacing.md` |
| Height | 56dp | 56.dp | 56 | `size.listItem.default` |
| | | | | |
| **Start Waypoint** | | | | |
| Icon | flag | flag | flag.fill | `icon.start` |
| Icon Color | Success green | colorSuccess | Color.green | `color.success` |
| | | | | |
| **Via Waypoint** | | | | |
| Icon | waypoint | waypoint | mappin | `icon.waypoint` |
| Icon Color | Primary copper | colorPrimary | Color.primary | `color.primary` |
| | | | | |
| **End Waypoint** | | | | |
| Icon | flag-checkered | flag | flag.checkered | `icon.end` |
| Icon Color | Danger red | colorError | Color.red | `color.danger` |
| | | | | |
| Name Font | Body large | Typography.bodyLarge | Font.body | `typography.body` |
| Name Color | Text primary | onSurface | Color.primary | `color.textPrimary` |
| Type Label Font | Label small | Typography.labelSmall | Font.caption2 | `typography.fontSize.xs` |
| Type Label Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Remove Icon | close | close | xmark | `icon.close` |
| Remove Icon Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Icon Size | 20dp | 20.dp | 20 | `iconSize.sm` |

## NOTES

### Visual States
- **Default:** Normal elevation
- **Pressed:** Elevated, darker background
- **Dragging:** Higher elevation, opacity 0.9

### Waypoint Types
- **Start:** Flag icon, green
- **Via:** Pin icon, primary
- **End:** Checkered flag, red

### Layout
- Icon: Left
- Name: Next to icon, vertical
- Type label: Below name
- Remove button: Right
- Drag handle: Far left (in list)

### Interaction
- Tap card: Edit waypoint
- Tap remove: Delete with confirmation
- Long-press drag: Reorder (via list)

### Accessibility
- `accessibilityLabel`: "{type}, {name}"
- `accessibilityHint`: "Double-tap to edit, swipe to delete"
- `accessibilityRole`: "button"
- Remove button: "Remove waypoint"

### Platform Differences
- **Android:** Material3 `Card` with `elevation`
- **iOS:** List row or custom `RoundedRectangle`

### Dependencies
- `IconSymbol` atom
- `Button` atom
- Drag handle (from list)
- Waypoint data
