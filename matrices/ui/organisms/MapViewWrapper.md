# MapViewWrapper - STYLE PROPERTIES MATRIX

**Component:** MapViewWrapper
**RN Source:** `react-native/components/map/map-view.tsx`
**Framework Primitives:** `react-native-maps` (MapView, Marker, Polyline), `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/map/map-view.tsx` | Public API, map camera, markers, polylines |
| MapView (react-native-maps) | `node_modules/react-native-maps/lib/components/MapView.js` | Map rendering |
| Marker (react-native-maps) | `node_modules/react-native-maps/lib/components/MapMarker.js` | Point markers |
| Polyline (react-native-maps) | `node_modules/react-native-maps/lib/components/MapPolyline.js` | Route polylines |
| mapStyle helper | `react-native/components/map/map-style.ts` | Theme-based map styling |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- None (platform map SDK handles all rendering)

**Composition pattern:**
- Full-bleed map container (flex: 1)
- Google Maps on Android/iOS with custom map style
- Web fallback shows "Maps unavailable" message
- Markers rendered from `markers` prop array
- Polylines rendered from `polylines` prop array
- Camera controlled via imperative handle (ref)
- User location shown by default
- Auto-centers on user location on first load

**Layout:** Fill parent container with width/height 100%

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|
| mapRef | Ref<any> | useRef | `GoogleMap(...).rememberCameraPosition()` / `MapView.coordinateRegion(...)` |
| lastCamera | {center?, zoom?} | useState | `rememberSaveable { mutableStateOf(...) }` / `@State var lastCamera: CameraPosition?` |
| lastRegion | {center?, latitudeDelta?, longitudeDelta?} | useState | `rememberSaveable { mutableStateOf(...) }` / `@State var lastRegion: MapCameraRegion?` |
| lastUserLocation | {latitude, longitude} | useState | `rememberSaveable { mutableStateOf(...) }` / `@State var lastUserLocation: CLLocationCoordinate2D?` |
| didCenterOnUser | boolean | useState | `rememberSaveable { mutableStateOf(false) }` / `@State var didCenterOnUser = false` |
| mapStyle | CustomMapStyle[] | useMemo | Derived from theme + dark mode |
| initialCamera | Camera | useMemo | `CameraPositionState(...)` / `MapCameraPosition` |

**Imperative handle methods:**
- `setCameraPosition({coordinates, zoom, duration})` → `mapController.cameraPosition = ...` / `.setRegion(..., animated: true)`
- `zoomBy(delta)` → Manual zoom calculation with `animateToRegion` / `.setRegion(..., animated: true)`
- `recenterToUser()` → `mapController.moveCamera(...)` / `.setCenterCoordinate(..., animated: true)`
- `animateToRegion(region, duration)` → `mapController.animateCamera(...)` / `.setRegion(..., animated: true)`
- `fitToCoordinates(coordinates, options)` → `mapController.moveCamera(...)` with bounds calculation / `.setVisibleCoordinates(..., animated: true)`

**Side effects:**
- On map ready: Fetch initial camera position → `LaunchedEffect(Unit) { ... }` / `.onAppear { ... }`
- On user location change: Auto-center on first load → `LaunchedEffect(userLocation) { if (!didCenterOnUser) ... }` / `.onChange(of: userLocation) { ... }`

**Callback signatures:**
- `onMapClick?: ({coordinates?}) => void` → `(coordinates?: LatLng) -> Unit` / `((LatLng?) -> Void)?`
- `onCameraMove?: ({coordinates, zoom}) => void` → `(coordinates: LatLng, zoom: Float) -> Unit` / `((LatLng, Double) -> Void)?`

---

## STYLE PROPERTIES MATRIX

### Layout — Map Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| height | RN-wrapper | `'100%'` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |

### Visual — Map Style (via buildMapStyleFromTheme)

| Element | Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Background | backgroundColor | map-style helper | `semantic.color.background.default` | Map style JSON `style: [{ elementType: "geometry", stylers: [{ color: "#<background-hex>" }] }]` | Custom map style overlay | `color.background.default` |
| Water | color | map-style helper | `semantic.color.map.water` | Map style JSON | Custom map style overlay | `color.map.water` |
| Roads | color | map-style helper | `semantic.color.map.roads` | Map style JSON | Custom map style overlay | `color.map.roads` |
| Labels | color | map-style helper | `semantic.color.onSurface.subtle` | Map style JSON | Custom map style overlay | `color.onSurface.subtle` |
| POI | color | map-style helper | `semantic.color.primary.default` | Map style JSON | Custom map style overlay | `color.primary.default` |

### Visual — Web Fallback

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| padding | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` + vertical | `.frame(maxWidth: .infinity).overlay(..., alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentHeight(Alignment.CenterVertically)` | `.frame(maxHeight: .infinity).overlay(..., alignment: .center)` | n/a |

### Typography — Web Fallback Message

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `bodyMedium` | `LaneShadowTheme.typography.bodyMedium` | `theme.typography.bodyMedium` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Map Marker Properties

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| coordinate | markers prop | `{latitude, longitude}` | `Marker(...position = LatLng(...))` | `Annotation(.coordinate)` | n/a |
| title | markers prop | `string?` | `Marker(...title = ...)` | `Annotation(...title: ...)` | n/a |

### Map Polyline Properties

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| coordinates | polylines prop | `[{latitude, longitude}[]]` | `Polyline(...points = ...)` | `Polyline(...coordinates: ...)` | n/a |
| strokeColor | polylines prop | `string?` | `Polyline(...color = Color(...))` | `Polyline(...strokeColor: ...)` | n/a (dynamic) |
| strokeWidth | polylines prop | `4` (default) | `Polyline(...width = 4.dp)` | `Polyline(...lineWidth: 4)` | ESCALATE — propose `borderWidth.polyline = 4` |

### Map Camera Properties

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| initialCamera.center | cameraPosition prop | `{latitude, longitude}?` | `CameraPositionState(...position = ...)` | `MapCameraPosition(center: ...)` | n/a |
| initialCamera.zoom | cameraPosition prop | `12` (default) | `CameraPositionState(...zoom = 12f)` | `MapCameraPosition(zoom: 12)` | ESCALATE — propose `map.defaultZoom = 12` |
| moveOnMarkerPress | RN-wrapper | `false` | `Marker(...onClick = { ... })` (no auto-move) | `.onTapGesture { ... }` | n/a |
| showsUserLocation | RN-wrapper | `true` | `MapEffect(...isMyLocationEnabled = true)` | `.showsUserLocation = true` | n/a |

---

## NOTES

- **Platform SDK:** Uses react-native-maps which wraps Google Maps SDK on both Android and iOS
- **Map style:** Custom JSON generated from semantic tokens via `buildMapStyleFromTheme`
- **Web fallback:** Shows "Maps unavailable in this build" message on web platform
- **Camera control:** Imperative handle with `setCameraPosition`, `zoomBy`, `recenterToUser`, `animateToRegion`, `fitToCoordinates`
- **Auto-center:** Centers on user location on first load (when `didCenterOnUser === false`)
- **User location:** `showsUserLocation={true}` enables native blue dot
- **Zoom calculation:** `Math.log2(360 / latitudeDelta)` for region-to-zoom conversion
- **Fit to coordinates:** Default edge padding `{top: 80, right: 40, bottom: 80, left: 40}`
- **Camera duration:** Default 300ms for programmatic moves, 500ms for `setCameraPosition`
- **State tracking:** Maintains `lastCamera`, `lastRegion`, `lastUserLocation` for programmatic control
- **Markers:** Array of `{id?, title?, coordinates: {latitude, longitude}}`
- **Polylines:** Array of `{id?, coordinates[], strokeColor?, strokeWidth?}`
- **Children:** Renders child components (overlays, etc.) within map container
