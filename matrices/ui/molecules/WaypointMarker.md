# WaypointMarker

## Component Classification
**Type:** Molecule
**Domain:** Map
**Source:** `components/map/waypoint-marker.tsx`

## Purpose
Map marker for route waypoints. Shows start, via, and end points on map.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Waypoint type icon

### Layout Structure
```
        ┌─────┐
        │  🏁  │
        └──┬──┘
           │
           │
           ┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/map/waypoint-marker.tsx`

**Key Implementation:**
- Map marker icon
- Type-based styling (start, via, end)
- Tap to select
- Optional label/title
- Selected state

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/WaypointMarker.kt`

**Implementation Notes:**
- Use `Marker` from Google Maps Compose
- Custom icon with `BitmapDescriptor`
- Tap listener for selection
- Info window for label
- Type-based color

**Expected API:**
```kotlin
@Composable
fun WaypointMarker(
  waypoint: Waypoint,
  selected: Boolean,
  onPress: () -> Unit,
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
**File:** `ios/LaneShadow/UI/Molecules/WaypointMarker.swift`

**Implementation Notes:**
- Use MapKit `MKAnnotationView` or SwiftUI Map annotation
- Custom annotation view
- Tap gesture for selection
- Callout for label
- Type-based color

**Expected API:**
```swift
struct WaypointMarker: View {
  var waypoint: Waypoint
  var selected: Bool
  var onPress: () -> Void

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
| Pin Height | 40dp | 40.dp | 40 | `size.marker.default` |
| Pin Width | 32dp | 32.dp | 32 | `size.marker.default` |
| Anchor Point | Bottom center | 0.5, 1.0 | bottomCenter | - |
| Tap Animation | Scale/bounce | animateScaleAsState | .scaleEffect | - |
| | | | | |
| **Start Waypoint** | | | | |
| Pin Color | Success green | colorSuccess | Color.green | `color.success` |
| Icon Name | flag | flag | flag.fill | `icon.start` |
| Icon Size | 18dp | 18.dp | 18 | `iconSize.sm` |
| Icon Color | On success | onSuccess | Color.white | `color.onSuccess` |
| | | | | |
| **Via Waypoint** | | | | |
| Pin Color | Primary copper | colorPrimary | Color.primary | `color.primary` |
| Icon Name | waypoint | waypoint | mappin.circle.fill | `icon.waypoint` |
| Icon Size | 18dp | 18.dp | 18 | `iconSize.sm` |
| Icon Color | On primary | onPrimary | Color.white | `color.onPrimary` |
| | | | | |
| **End Waypoint** | | | | |
| Pin Color | Danger red | colorError | Color.red | `color.danger` |
| Icon Name | flag-checkered | flag | flag.checkered | `icon.end` |
| Icon Size | 18dp | 18.dp | 18 | `iconSize.sm` |
| Icon Color | On error | onError | Color.white | `color.onError` |
| | | | | |
| **Selected** | | | | |
| Scale | 1.2x | scale(1.2f) | .scaleEffect(1.2) | - |
| Shadow | Elevated | shadowElevation | .shadow(radius: 8) | `elevation.selected` |
| Z-Index | Above routes | z-index | z-index | - |

## NOTES

### Visual States
- **Default:** Type color, normal size
- **Selected:** Larger scale, elevated shadow
- **Draggable:** Pulse animation (if dragging)

### Marker Types
- **Start:** Green flag
- **Via:** Copper pin
- **End:** Red checkered flag

### Map Integration
- Added as map marker/annotation
- Position from waypoint coordinates
- Z-index above route polylines
- Draggable for editing

### Interaction
- Tap to select waypoint
- Long-press drag to reposition
- Info window shows name
- Double-tap for quick edit

### Accessibility
- `accessibilityLabel`: "{waypoint.type}: {waypoint.name}"
- `accessibilityHint`: "Tap to select, long-press to drag"
- `accessibilityRole`: "button"
- Selected state announced

### Platform Differences
- **Android:** Google Maps `Marker` with custom icon
- **iOS:** MapKit `MKMarkerAnnotationView` or custom view

### Dependencies
- `IconSymbol` atom
- Map SDK (Google Maps / MapKit)
- Waypoint data
- Selection state
