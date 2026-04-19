# MapboxMapView - Organism Matrix

**Component Source:** `react-native/components/map/mapbox-map-view.tsx`

**Atomic Level:** Organism

**Domain:** Map / Core Platform

---

## COMPOSITION ANALYSIS

### Child Components
- **External Dependencies:**
  - `@rnmapbox/maps` (MapView, Camera, MarkerView, ShapeSource, LineLayer, UserLocation)
  - `expo-file-system` (for coordinate conversion utilities)
- **Composition Pattern:**
  - Platform-specific map SDK wrapper
  - Camera control with imperative handle
  - Marker/polyline rendering
  - User location tracking
  - Gesture handling (press, camera move)

### Layout Structure
```
MapboxMapView
├── MapView (platform-specific)
│   ├── Camera (ref control)
│   ├── UserLocation (optional)
│   ├── MarkerView[] (per marker)
│   │   └── View (marker UI)
│   ├── ShapeSource (per polyline)
│   │   └── LineLayer
│   └── children (overlays)
└── Web Fallback (conditional)
    └── View + Text
```

---

## STATE & BEHAVIOR

### State Management
- **Refs:**
  - `cameraRef` - Camera imperative control
  - `mapViewRef` - MapView reference
  - `lastUserLocationRef` - User location tracking
- **Local State:**
  - `lastCameraState` - Camera position tracking
  - `hasUserLocation` - Whether user location is available
- **Imperative Handle (MapboxMapViewHandle):**
  - `setCamera` - Set camera position
  - `zoomIn/zoomOut` - Zoom controls
  - `fitToCoordinates` - Fit bounds
  - `setCameraPosition` - Google Maps parity
  - `zoomBy` - Zoom by delta
  - `recenterToUser` - Center on user
  - `animateToRegion` - Region animation

### User Interactions
- **Map Press:**
  - `onPress` - Mapbox-native callback
  - `onMapClick` - Google Maps parity callback
- **Camera Move:**
  - `onCameraChange` - Mapbox-native callback
  - `onCameraMove` - Google Maps parity callback
- **User Location:**
  - Auto-center on first location fix
  - Track location for `recenterToUser()`

### Coordinate Conversion
- **Google Maps → Mapbox:**
  - Input: `{latitude, longitude}` (Google Maps)
  - Output: `[longitude, latitude]` (Mapbox/GeoJSON)
- **Utilities:**
  - `latLngToMapbox()` - Convert single coordinate
  - `mapboxToLatLng()` - Convert back
  - `convertCoordinateArray()` - Convert arrays

---

## TRANSLATION SOURCES

### React Native → Kotlin/Compose

**Map SDK:**
- RN: `@rnmapbox/maps` (Mapbox GL)
- Kotlin: Google Maps SDK for Android **OR** Mapbox Maps SDK for Android

**Camera Control:**
- RN: `Camera` ref with imperative methods
- Kotlin: `GoogleMap.cameraPosition` state or `MapboxMap.cameraPosition`

**Markers:**
- RN: `MarkerView` with custom child
- Kotlin: `Marker` + `MarkerOptions` (Google) or `PointAnnotation` (Mapbox)

**Polylines:**
- RN: `ShapeSource` + `LineLayer`
- Kotlin: `Polyline` + `PolylineOptions` (Google) or `LineLayer` (Mapbox)

**User Location:**
- RN: `UserLocation` component
- Kotlin: `MyLocationLayer` (Google) or custom location circle

### React Native → Swift/SwiftUI

**Map SDK:**
- RN: `@rnmapbox/maps` (Mapbox GL)
- Swift: MapKit **OR** Mapbox Maps SDK for iOS

**Camera Control:**
- RN: `Camera` ref with imperative methods
- Swift: `MapCamera` state (MapKit) or `MapboxMap.camera`

**Markers:**
- RN: `MarkerView` with custom child
- Swift: `MapMarker` (MapKit) or `PointAnnotation` (Mapbox)

**Polylines:**
- RN: `ShapeSource` + `LineLayer`
- Swift: `MapPolyline` (MapKit) or `LineLayer` (Mapbox)

**User Location:**
- RN: `UserLocation` component
- Swift: `.mapScope.userLocation` (MapKit) or custom

---

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin Token | Swift Token | Platform Fallback |
|----------|----------|--------------|-------------|-------------------|
| **Map Background** | Style URL (theme-based) | `MapStyleOptions` | `.mapStyle` | Theme-based |
| **Marker Color** | #B87333 | `BitmapDescriptorFactory.defaultMarker()` | `.tint(.primary)` | Copper color |
| **Marker Border** | #FFFFFF (2pt) | Stroke 2dp | `.stroke(2)` | White |
| **Marker Size** | 24x24pt | `24.dp` | `24` | 24pt |
| **Marker Border Radius** | 12pt | `12.dp` | `12` | 12pt |
| **Polyline Stroke Color** | `strokeColor` prop | `PolylineOptions.color()` | `.stroke()` | #B87333 |
| **Polyline Stroke Width** | `strokeWidth` prop | `PolylineOptions.width()` | `.lineWidth()` | 4pt |
| **Map Fill** | Flex: 1 | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | 100% |
| **User Location Visible** | `showsUserLocation` prop | `MyLocationLayer.isEnabled` | `.userLocation(.enabled)` | Boolean |

### Platform-Specific Adjustments

**Android:**
- Use Google Maps SDK for Android (more native integration)
- Or Mapbox Maps SDK for Android (parity with RN)
- Camera: `CameraUpdateFactory.newLatLngZoom()`
- Markers: `map.addMarker(MarkerOptions())`
- Polylines: `map.addPolyline(PolylineOptions())`

**iOS:**
- Use MapKit (native, no third-party dependency)
- Or Mapbox Maps SDK for iOS (parity with RN)
- Camera: `MapCamera(centerCoordinate:, span:)`
- Markers: `MapMarker(coordinate:)`
- Polylines: `MapPolyline(coordinates:)`

---

## NOTES

### Zero ESCALATE Tokens
- ⚠️ **Platform SDK Choice Required:** Must choose between Google Maps SDK and Mapbox SDK
- ⚠️ **Coordinate Format Difference:** Mapbox uses `[lng, lat]`, Google Maps uses `{lat, lng}`
- ✅ Both platform SDKs have equivalent capabilities
- ✅ No exotic APIs requiring escalation

### Implementation Considerations

**Map SDK Decision:**
- **Google Maps SDK:**
  - Pros: Native, no extra dependency, better integration
  - Cons: Coordinate conversion needed (already exists in RN code)
- **Mapbox SDK:**
  - Pros: Direct parity with RN, no coordinate conversion
  - Cons: Extra dependency, different from platform convention

**Recommendation:** Use Google Maps SDK for native platforms (more idiomatic)

**Kotlin (Google Maps SDK):**
```kotlin
@Composable
fun MapViewWrapper(
  cameraPosition: CameraPosition,
  markers: List<Marker>,
  polylines: List<Polyline>,
  onMapClick: (LatLng) -> Unit
) {
  val cameraState = rememberCameraPositionState()
  val mapProperties = MapProperties(
    isMyLocationEnabled = true,
    mapStyle = MapStyleOptions.loadRawResourceStyle(R.raw.map_style_dark)
  )

  GoogleMap(
    cameraPositionState = cameraState,
    properties = mapProperties,
    onMapClick = { onMapClick(it.latLng) },
    modifier = Modifier.fillMaxSize()
  ) {
    markers.forEach { marker ->
      Marker(
        state = MarkerState(position = LatLng(marker.lat, marker.lng)),
        title = marker.title
      )
    }

    polylines.forEach { polyline ->
      Polyline(
        points = polyline.coordinates.map { LatLng(it.lat, it.lng) },
        color = polyline.strokeColor,
        width = polyline.strokeWidth
      )
    }
  }
}
```

**Swift (MapKit):**
```swift
struct MapViewWrapper: View {
  @State private var region = MapCameraRegion()

  var body: some View {
    Map(position: .camera(region)) {
      ForEach(markers) { marker in
        Marker(item: marker)
      }

      ForEach(polylines) { polyline in
        MapPolyline(coordinates: polyline.coordinates)
          .stroke(polyline.strokeColor, lineWidth: polyline.strokeWidth)
      }

      UserLocationLayer()
    }
    .onTapGesture { coordinate in
      onMapClick(coordinate)
    }
  }
}
```

### Testing Notes
- Test marker rendering at various zoom levels
- Test polyline rendering with many coordinates
- Test camera animations (zoom, pan)
- Test user location tracking
- Test coordinate conversion accuracy
- Test map style switching (dark/light)
- Test gesture handling (press, drag)

### Dependencies
- **Required:** Google Maps SDK for Android **OR** Mapbox Maps SDK for Android
- **Required:** MapKit **OR** Mapbox Maps SDK for iOS
- **Required:** Coordinate conversion utilities (if using Google Maps SDK)
- **Required:** Location permissions
- **Optional:** Custom map styles (JSON)

### Coordinate Conversion
- **Critical:** Maintain Google Maps coordinate format `{latitude, longitude}` in public API
- **Internal:** Convert to platform-specific format (Mapbox: `[lng, lat]`, Google: `LatLng`)
- **Utilities:** Reuse existing `latLngToMapbox()` and `mapboxToLatLng()` functions
