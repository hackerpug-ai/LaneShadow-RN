# SearchResultMarker

## Component Classification
**Type:** Molecule
**Domain:** Map
**Source:** `components/map/search-result-marker.tsx`

## Purpose
Map marker for location search results. Shows POI/address on map.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Location icon

### Layout Structure
```
        ┌─────┐
        │  📍  │
        └──┬──┘
           │
           │
           ┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/map/search-result-marker.tsx`

**Key Implementation:**
- Map marker icon
- Tap to select location
- Optional label/title
- Selected state styling

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/SearchResultMarker.kt`

**Implementation Notes:**
- Use `Marker` from Google Maps Compose
- Custom icon with `BitmapDescriptor`
- Tap listener for selection
- Info window for title

**Expected API:**
```kotlin
@Composable
fun SearchResultMarker(
  result: SearchResult,
  selected: Boolean,
  onPress: () -> Unit,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/SearchResultMarker.swift`

**Implementation Notes:**
- Use MapKit `MKAnnotationView` or SwiftUI Map annotation
- Custom annotation view
- Tap gesture for selection
- Callout for title

**Expected API:**
```swift
struct SearchResultMarker: View {
  var result: SearchResult
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
| Pin Color | Info blue | colorInfo | Color.blue | `color.info` |
| Selected Scale | 1.2x | scale(1.2f) | .scaleEffect(1.2) | - |
| Selected Shadow | Elevated | shadowElevation | .shadow(radius: 8) | `elevation.selected` |
| Unselected Opacity | 0.9 | alpha(0.9f) | .opacity(0.9) | - |
| Selected Opacity | 1.0 | alpha(1.0f) | .opacity(1.0) | - |
| Icon Name | map-marker | map-marker | mappin.circle.fill | `icon.location` |
| Icon Size | 18dp | 18.dp | 18 | `iconSize.sm` |
| Icon Color | On info | onInfo | Color.white | `color.onInfo` |
| Anchor Point | Bottom center | 0.5, 1.0 | bottomCenter | - |
| Tap Animation | Scale/bounce | animateScaleAsState | .scaleEffect | - |
| Label Font | Body small | Typography.bodySmall | Font.caption | `typography.bodySmall` |
| Label Color | Text primary | onSurface | Color.primary | `color.textPrimary` |

## NOTES

### Visual States
- **Default:** Blue pin, location icon
- **Selected:** Larger scale, elevated shadow
- **Hovered:** Info window shows (desktop)

### Map Integration
- Added as map marker/annotation
- Position from geocoded coordinates
- Z-index above routes
- Remove on new search

### Interaction
- Tap to select location
- Info window shows title
- Long-press for add to waypoints

### Marker Types
- **Address:** House icon
- **POI:** Star icon
- **City:** Building icon
- **Coordinate:** Pin icon

### Accessibility
- `accessibilityLabel`: "{result.title}"
- `accessibilityHint`: "Tap to select location"
- `accessibilityRole`: "button"
- Selected state announced

### Platform Differences
- **Android:** Google Maps `Marker` with `title`
- **iOS:** MapKit `MKPointAnnotation` with custom view

### Dependencies
- `IconSymbol` atom
- Map SDK (Google Maps / MapKit)
- Search result data
- Selection state
