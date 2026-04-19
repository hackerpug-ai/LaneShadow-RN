# RouteMiniMap - STYLE PROPERTIES MATRIX

**Component:** RouteMiniMap
**RN Source:** `react-native/components/chat/cards/route-mini-map.tsx`
**Framework Primitives:** `@rnmapbox/maps/MapView`, `@rnmapbox/maps/Camera`, `@rnmapbox/maps/ShapeSource`, `@rnmapbox/maps/LineLayer`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/chat/cards/route-mini-map.tsx` | Public API, map configuration, polyline rendering |
| MapboxMapView | `@rnmapbox/maps/MapView` | Non-interactive map view |
| Camera | `@rnmapbox/maps/Camera` | Camera position (center, zoom) |
| ShapeSource | `@rnmapbox/maps/ShapeSource` | GeoJSON FeatureCollection for route |
| LineLayer | `@rnmapbox/maps/LineLayer` | Polyline styling (color, width, opacity) |

---

## COMPOSITION

**Child atoms:**
- None (direct Mapbox components)

**Composition pattern:** Non-interactive Mapbox map view with single route polyline. Camera positioned to fit bounds with calculated zoom level. All interaction disabled (scroll, zoom, rotate, pitch). pointerEvents="none" on container passes touches through.

**Layout:** Fixed height (120px), full width of parent. Absolute positioning for map to fill container.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| height | RN-wrapper | `120` | `Modifier.height(120.dp)` | `.frame(height: 120)` | ESCALATE — propose `size.miniMapHeight = 120` |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| borderRadius | RN-wrapper | `8` | `Modifier.clip(RoundedCornerShape(8.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 8))` | `radius.md` |
| overflow | RN-wrapper | `'hidden'` | `Modifier.clipToBounds()` | `.clipped()` | n/a |
| pointerEvents | RN-wrapper | `'none'` | `Modifier.pointerInteropFilter { false }` | `.allowsHitTesting(false)` | n/a |

### Layout — MapView

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| style (absoluteFill) | RN-wrapper | `{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }` | `Modifier.matchParentSize()` or `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity).position(x: 0, y: 0)` | n/a |
| styleURL | RN-wrapper | `MAP_STYLES[dark ? 'dark' : 'light']` | Mapbox style URL for dark/light theme | Mapbox style URL for dark/light theme | n/a |

### Map Configuration — Interaction (Disabled)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| scrollEnabled | RN-wrapper | `false` | `MapboxMapOptions(scrollGesturesEnabled = false)` | `MapView(scope: .mapbox).gesture(.ignore(...))` | n/a |
| zoomEnabled | RN-wrapper | `false` | `MapboxMapOptions(zoomGesturesEnabled = false)` | n/a | n/a |
| rotateEnabled | RN-wrapper | `false` | `MapboxMapOptions(rotateGesturesEnabled = false)` | n/a | n/a |
| pitchEnabled | RN-wrapper | `false` | `MapboxMapOptions(pitchGesturesEnabled = false)` | n/a | n/a |
| logoEnabled | RN-wrapper | `false` | `MapboxMapOptions(logoEnabled = false)` | n/a | n/a |
| attributionEnabled | RN-wrapper | `false` | `MapboxMapOptions(attributionEnabled = false)` | n/a | n/a |
| scaleBarEnabled | RN-wrapper | `false` | `MapboxMapOptions(scaleBarEnabled = false)` | n/a | n/a |

### Camera — Position

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| centerCoordinate | RN-wrapper | `[(sw.lng + ne.lng) / 2, (sw.lat + ne.lat) / 2]` | `CameraPosition(center = Point(...))` | `MapCamera(center: CLLocationCoordinate2D(...))` | n/a |
| zoomLevel | RN-wrapper | `log2(360 / latSpan) - 0.5` | `CameraPosition(zoom = ...)` | `MapCamera(zoom: ...)` | n/a |

**Zoom calculation:** `Math.log2(360 / Math.abs(ne.lat - sw.lat)) - 0.5`

The -0.5 offset provides visual padding (equivalent to 1.3x multiplier).

### Visual — LineLayer (Polyline)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| lineColor | RN-wrapper | `semantic.color.primary.default` | `Color(...)` in LineLayer style | `StrokeStyle(color: ...)` | `color.primary.default` |
| lineWidth | RN-wrapper | `3` | `LineWidth(3.dp)` | `StrokeStyle(lineWidth: 3)` | ESCALATE — propose `lineWidth.miniMap = 3` |
| lineOpacity | RN-wrapper | `1.0` | `Opacity(1.0f)` | `StrokeStyle(opacity: 1.0)` | n/a |

### Visual — Web Fallback

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `MaterialTheme.colorScheme.surface` | `Color(.systemBackground)` | `color.surface.default` |
| borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `Modifier.clip(RoundedCornerShape(8.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 8))` | `radius.md` |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | n/a | n/a |

### Data — GeoJSON

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| type | RN-wrapper | `'FeatureCollection'` | GeoJSON FeatureCollection | GeoJSON FeatureCollection | n/a |
| features | RN-wrapper | `[{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [...] } }]` | Single LineString feature | Single LineString feature | n/a |
| coordinates | RN-wrapper | Mapbox format `[lng, lat]` | Converted from Google `[lat, lng]` | Converted from Google `[lat, lng]` | n/a |

### Empty State

| Condition | Source | Behavior | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| coordinates.length === 0 | RN-wrapper | `return null` | EmptyContent or null return | EmptyView or null return | n/a |
| Platform.OS === 'web' | RN-wrapper | Render web fallback View | Render fallback View | Render fallback View | n/a |

---

## NOTES

- **Non-interactive:** All map gestures disabled. pointerEvents="none" on container passes touches through to parent.
- **Fixed height:** 120px fixed height, 100% width of parent.
- **Camera positioning:** Center calculated as midpoint of bounds. Zoom calculated from latitude span with -0.5 offset for padding.
- **Polyline:** Single LineString feature with 3px width, primary color, full opacity.
- **Coordinate conversion:** Google polyline format `[lat, lng]` converted to Mapbox `[lng, lat]`.
- **Theme-aware:** Uses MAP_STYLES for dark/light mode map styles.
- **Web fallback:** Renders placeholder View on web platform (Mapbox is native-only).
- **Empty state:** Returns null if overviewGeometry is empty or fails to decode.
- **Logo/attribution:** Disabled to minimize visual clutter in thumbnail.
- **Decode memoization:** useMemo for decodePolylineGeometry (O(n) operation).
- **Bounds fitting:** Camera zoom level calculated to fit route bounds with padding.
- **ShapeSource ID:** "mini-map-route" (must be unique)
- **LineLayer ID:** "mini-map-route-layer" (must be unique)
