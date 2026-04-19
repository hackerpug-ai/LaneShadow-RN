# RoutePin

## Component Classification
**Type:** Molecule
**Domain:** Discovery
**Source:** `components/discovery/route-pin.tsx`

## Purpose
Map marker pin for discovered routes. Shows route preview on map during discovery.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Route icon or badge

### Layout Structure
```
        ┌─────┐
        │  🏞️  │
        └──┬──┘
           │
           │
           ┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/discovery/route-pin.tsx`

**Key Implementation:**
- Map marker icon
- Tap to select route
- Optional badge/indicator
- Selected state styling

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/RoutePin.kt`

**Implementation Notes:**
- Use `Marker` from Google Maps Compose
- Custom icon with `BitmapDescriptor`
- Tap listener for selection
- Selected state with scale/opacity

**Expected API:**
```kotlin
@Composable
fun RoutePin(
  route: RoutePreview,
  selected: Boolean,
  onPress: () -> Unit,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/RoutePin.swift`

**Implementation Notes:**
- Use MapKit `MKAnnotationView` or SwiftUI Map annotation
- Custom annotation view
- Tap gesture for selection
- Selected state with transform

**Expected API:**
```swift
struct RoutePin: View {
  var route: RoutePreview
  var selected: Bool
  var onPress: () -> Void

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
| Pin Color | Primary copper | colorPrimary | Color.primary | `color.primary` |
| Selected Scale | 1.2x | scale(1.2f) | .scaleEffect(1.2) | - |
| Selected Shadow | Elevated | shadowElevation | .shadow(radius: 8) | `elevation.selected` |
| Unselected Opacity | 0.8 | alpha(0.8f) | .opacity(0.8) | - |
| Selected Opacity | 1.0 | alpha(1.0f) | .opacity(1.0) | - |
| Icon Name | route | route | signpost.turnright.fill | `icon.route` |
| Icon Size | 18dp | 18.dp | 18 | `iconSize.sm` |
| Icon Color | On primary | onPrimary | Color.white | `color.onPrimary` |
| Anchor Point | Bottom center | 0.5, 1.0 | bottomCenter | - |
| Tap Animation | Scale/bounce | animateScaleAsState | .scaleEffect | - |

## NOTES

### Visual States
- **Default:** Copper pin, route icon
- **Selected:** Larger scale, elevated shadow
- **Visited:** Grayed out (optional)
- **Highlighted:** Pulse animation

### Map Integration
- Added as map marker/annotation
- Position from route start point
- Clustered if too many (optional)
- Z-index above routes

### Interaction
- Tap to select route
- Long-press for quick actions (optional)
- Drag to reposition (not supported)

### Accessibility
- `accessibilityLabel`: "{route.name}, route pin"
- `accessibilityHint`: "Tap to view route details"
- `accessibilityRole`: "button"
- Selected state announced

### Platform Differences
- **Android:** Google Maps `Marker` with custom icon
- **iOS:** MapKit `MKMarkerAnnotationView` or custom view

### Dependencies
- `IconSymbol` atom
- Map SDK (Google Maps / MapKit)
- Route preview data
- Selection state
