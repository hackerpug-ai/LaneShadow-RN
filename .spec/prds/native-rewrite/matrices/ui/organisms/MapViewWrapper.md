# MapViewWrapper - STYLE PROPERTIES MATRIX

**Component:** MapViewWrapper
**RN Source:** `react-native/components/map/map-view.tsx`
**Framework Primitives:** `react-native-maps` (Google Maps SDK), `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/map/map-view.tsx` | Public API, map rendering, camera controls |
| Google Maps SDK | `react-native-maps` | Map rendering platform |
| StyleSheet (RN) | `node_modules/react-native/Libraries/StyleSheet/StyleSheet.js` | Style definitions |
| Theme hook | `react-native/hooks/use-semantic-theme.ts` | Theme-aware styling |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- None (platform map component is atomic)

**Composition pattern:**
- Full-bleed map container with flex: 1
- Google Maps provider with custom map style
- Camera positioning with imperative handle methods
- Marker rendering (optional array of marker objects)
- Polyline rendering (optional array of polyline objects)
- User location indicator (default enabled)
- Web fallback view for unsupported platforms

**Layout:** Full-screen flex container with absolute positioning for overlays

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|
| lastCamera | object | useState | `remember { mutableStateOf(...) }` / `@State var lastCamera: CameraState` |
| lastRegion | object | useState | `remember { mutableStateOf(...) }` / `@State var lastRegion: Region` |
| lastUserLocation | object | useState | `remember { mutableStateOf(...) }` / `@State var lastUserLocation: Coordinates?` |
| didCenterOnUser | boolean | useState | `remember { mutableStateOf(false) }` / `@State var didCenterOnUser: Bool = false` |

**Side effects:**
- Camera initialization: `useEffect` with map ready callback → `LaunchedEffect(Unit) { ... }` / `.onAppear { ... }`
- User location tracking: `onUserLocationChange` prop callback → `onUserLocationChange` callback listener

**Callback signatures:**
- `onMapClick?: (event: { coordinates?: { latitude: number; longitude: number } }) => void` → `(event: MapClickEvent?) -> Unit` / `(MapClickEvent?) -> Void`
- `onCameraMove?: (event: { coordinates: { latitude: number; longitude: number }, zoom: number }) => void` → `(event: CameraMoveEvent) -> Unit` / `(CameraMoveEvent) -> Void`

**Imperative handle methods:**
- `setCameraPosition: (input: { coordinates?, zoom?, duration? }) => void` → `(input: CameraInput) -> Unit` / `(CameraInput) -> Void`
- `zoomBy: (delta: number) => void` → `(delta: Float) -> Unit` / `(Float) -> Void`
- `recenterToUser: () => void` → `() -> Unit` / `() -> Void`
- `animateToRegion: (region, duration?) => void` → `(region: MapRegion, duration: Int) -> Unit` / `(MapRegion, Int) -> Void`
- `fitToCoordinates: (coordinates, options?) => void` → `(coordinates: List<LatLng>, options: FitOptions?) -> Unit` / `([LatLng], FitOptions?) -> Void`

---

## STYLE PROPERTIES MATRIX

### Layout — Map Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | StyleSheet | `1` | `Modifier.fillMaxSize()` / `Modifier.fillMaxHeight().fillMaxWidth()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| width | StyleSheet | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| height | StyleSheet | `'100%'` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |

### Visual — Web Fallback (unsupported platforms)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignItems | StyleSheet | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` + vertical | `.frame(maxWidth: .infinity, maxHeight: .infinity).overlay(..., alignment: .center)` | n/a |
| justifyContent | StyleSheet | `'center'` | `Modifier.wrapContentSize(Alignment.CenterVertically)` | Same as above | n/a |
| backgroundColor | semantic | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| padding | semantic | `semantic.space.lg` (= 16) | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |

### Typography — Web Fallback Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | react-native-paper | `bodyMedium` | `LaneShadowTheme.typography.bodyMedium` | `theme.typography.bodyMedium` | `type.body.md` |
| color | semantic | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Map Style — Custom Map Style

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| customMapStyle | buildMapStyleFromTheme | Dynamic from semantic tokens | `GoogleMapOptions(...style = buildMapStyle(semantic))` | `MKMapView(...mapType = .standard)` with custom style URL | Dynamic from theme |

---

## NOTES

- **Full-bleed map:** Flex: 1 fills entire parent container
- **Platform provider:** Uses `PROVIDER_GOOGLE` for react-native-maps
- **Custom map style:** Generated from semantic theme tokens via `buildMapStyleFromTheme`
- **Camera controls:** Imperative handle via ref with methods for pan, zoom, fit bounds
- **User location:** Shows user location indicator by default
- **Web fallback:** Shows styled message when map unavailable (web platform)
- **Camera state:** Tracks both camera object (for zoom) and region object (for fit bounds calculations)
- **Auto-center:** Centers on user location on first fix if no initial camera position provided
- **Map ready:** Initializes camera state from map's current camera when map loads
- **Polylines:** Stroke width defaults to 4pt if not specified
- **Markers:** Uses react-native-maps Marker component with title display
- **Animation:** Camera movements use animateCamera/animateToRegion with configurable duration (default 500ms)
