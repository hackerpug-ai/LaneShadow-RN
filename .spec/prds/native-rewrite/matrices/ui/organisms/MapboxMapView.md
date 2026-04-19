# MapboxMapView - STYLE PROPERTIES MATRIX

**Component:** MapboxMapView
**RN Source:** `react-native/components/map/mapbox-map-view.tsx`
**Framework Primitives:** `@rnmapbox/maps` (Mapbox GL SDK), `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/map/mapbox-map-view.tsx` | Public API, map rendering, camera controls |
| Mapbox GL SDK | `@rnmapbox/maps` | Mapbox map rendering platform |
| Coordinate converter | `react-native/lib/mapbox/coordinate-converter.ts` | LatLng ↔ Mapbox coordinate conversion |
| Map styles | `react-native/lib/mapbox/styles.ts` | Theme-aware style URLs (dark/light) |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- Mapbox `Camera` - Camera positioning and animation
- Mapbox `UserLocation` - User location indicator
- Mapbox `MarkerView` - Custom marker rendering
- Mapbox `ShapeSource` + `LineLayer` - Polyline rendering

**Composition pattern:**
- Full-bleed map container with flex: 1
- Mapbox GL MapView as root with theme-based style URL
- Camera component for programmatic camera control
- User location indicator (optional, default true)
- Marker rendering with custom marker views (24dp circular, copper background)
- Polyline rendering with GeoJSON LineString features
- Coordinate conversion between Google Maps [lat, lng] and Mapbox [lng, lat] formats
- Imperative handle for camera control methods
- Web fallback view for unsupported platforms

**Layout:** Full-screen flex container with absolute positioning for overlays

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|
| lastCameraState | object | useState | `remember { mutableStateOf(...) }` / `@State var lastCameraState: CameraState` |
| hasUserLocation | boolean | useState | `remember { mutableStateOf(false) }` / `@State var hasUserLocation: Bool = false` |
| lastUserLocationRef | ref | useRef | `remember { mutableStateOf(...) }` / `@State var lastUserLocation: Coordinates?` |

**Side effects:**
- Mapbox access token initialization: Static `Mapbox.setAccessToken()` → Platform SDK initialization
- Style URL selection: `useMemo` based on theme → `derivedStateOf` / `@ObservedObject` theme observer

**Callback signatures:**
- `onPress?: (feature: GeoJSON.Feature) => void` → `(feature: GeoJSONFeature?) -> Unit` / `(GeoJSONFeature?) -> Void`
- `onMapClick?: (event: { coordinates? }) => void` → `(event: MapClickEvent?) -> Unit` / `(MapClickEvent?) -> Void`
- `onCameraChange?: (camera: MapboxCamera) => void` → `(camera: MapboxCamera) -> Unit` / `(MapboxCamera) -> Void`
- `onCameraMove?: (event: { coordinates, zoom }) => void` → `(event: CameraMoveEvent) -> Unit` / `(CameraMoveEvent) -> Void`

**Imperative handle methods:**
- `setCamera: (camera: MapboxCamera, duration?) => void` → `(camera: MapboxCamera, duration: Int) -> Unit` / `(MapboxCamera, Int) -> Void`
- `zoomIn: (delta?) => void` → `(delta: Float) -> Unit` / `(Float) -> Void`
- `zoomOut: (delta?) => void` → `(delta: Float) -> Unit` / `(Float) -> Void`
- `fitToCoordinates: (coordinates, padding?) => void` → `(coordinates: List<LatLng>, padding: Padding?) -> Unit` / `([LatLng], Padding?) -> Void`
- `setCameraPosition: (input: { coordinates?, zoom?, duration? }) => void` → `(input: CameraInput) -> Unit` / `(CameraInput) -> Void`
- `zoomBy: (delta: number) => void` → `(delta: Float) -> Unit` / `(Float) -> Void`
- `recenterToUser: () => void` → `() -> Unit` / `() -> Void`
- `animateToRegion: (region, duration?) => void` → `(region: MapRegion, duration: Int) -> Unit` / `(MapRegion, Int) -> Void`

---

## STYLE PROPERTIES MATRIX

### Layout — Map Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | StyleSheet | `1` | `Modifier.fillMaxSize()` / `Modifier.fillMaxHeight().fillMaxWidth()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| width | StyleSheet | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| height | StyleSheet | `'100%'` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |

### Visual — Map Marker

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | StyleSheet | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `iconSize.md = 24` |
| height | StyleSheet | `24` | Included above | Included above | ESCALATE — propose `iconSize.md = 24` |
| backgroundColor | StyleSheet | `'#B87333'` (hardcoded) | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| borderRadius | StyleSheet | `12` | `RoundedCornerShape(12.dp)` / `CircleShape` | `Circle()` | `radius.full` |
| borderWidth | StyleSheet | `2` | `Modifier.border(BorderStroke(2.dp, ...))` | `.overlay(Circle().stroke(..., lineWidth: 2))` | `borderWidth.thick` |
| borderColor | StyleSheet | `'#FFFFFF'` (hardcoded) | `Color.White` | `Color.white` | n/a (static white) |

### Typography — Marker Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | StyleSheet | `10` | `TextStyle(fontSize = 10.sp)` | `.font(.system(size: 10))` | ESCALATE — propose `type.marker.fontSize = 10` |
| color | StyleSheet | `'#FFFFFF'` (hardcoded) | `Color.White` | `Color.white` | n/a (static white) |
| textAlign | StyleSheet | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |

### Visual — Web Fallback

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignItems | StyleSheet | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` + vertical | `.frame(alignment: .center)` | n/a |
| justifyContent | StyleSheet | `'center'` | `Modifier.wrapContentSize(Alignment.CenterVertically)` | Same as above | n/a |

### Map Style — Theme-based Style URL

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| styleURL | MAP_STYLES | Dynamic from theme prop | `Mapbox.getStyleUrl(theme)` | `MapboxStyleURL(styleUrl: theme)` | Dynamic from theme |

### Polyline Style — LineLayer

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| lineColor | polyline prop | `'#B87333'` (default) | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| lineWidth | polyline prop | `4` (default) | `LineLayer(lineWidth = 4.dp)` | `LineLayer(lineWidth: 4)` | ESCALATE — propose `strokeWidth.medium = 4` |
| lineOpacity | hardcoded | `1.0` | `LineLayer(lineOpacity = 1.0f)` | `LineLayer(lineOpacity: 1.0)` | n/a |

---

## NOTES

- **Coordinate conversion:** Converts between Google Maps [lat, lng] and Mapbox [lng, lat] formats
- **Camera validation:** Validates center coordinates are finite numbers before passing to Mapbox (prevents crashes)
- **Initial camera:** Supports `initialCamera` for no-fly-in startup (applied once with no animation)
- **Live camera:** Supports `camera` prop for controlled camera updates (with animation)
- **Camera priority:** `camera` prop wins over `initialCamera` for updates after mount
- **Zoom tracking:** Tracks last camera state for zoomBy/zoomIn/zoomOut calculations
- **User location:** Auto-centers on first location fix if no camera position provided
- **Fit bounds:** Calculates proper bounding box (not just first/last coordinates)
- **Padding defaults:** Fit bounds uses `{top: 80, right: 40, bottom: 80, left: 40}` by default
- **Marker styling:** 24dp circular markers with copper background and white border
- **Polyline rendering:** Uses GeoJSON LineString features with ShapeSource + LineLayer
- **Web fallback:** Shows message for web builds (Mapbox doesn't support web)
- **Brand colors:** Primary copper color `#B87333` used for markers and polylines
- **Map attribution:** Logo, attribution, and scale bar disabled for cleaner UI
