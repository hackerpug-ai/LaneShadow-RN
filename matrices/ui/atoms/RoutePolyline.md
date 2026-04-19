# RoutePolyline - STYLE PROPERTIES MATRIX

**Component:** RoutePolyline
**RN Source:** `react-native/components/map/route-polyline.tsx`
**Framework Primitives:** Map SDK polyline components (react-native-maps)

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/map/route-polyline.tsx` | Public API, polyline building, overlay colors |
| react-native-maps | `react-native-maps` | Polyline rendering on maps |
| Map SDK | Google Maps SDK (Android), MapKit (iOS) | Native map polyline rendering |

---

## STYLE PROPERTIES MATRIX

### Visual — Overview Polyline

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| strokeColor (selected) | RN-wrapper | `semantic.color.routeSelected.default` | `LaneShadowTheme.colors.routeSelected` | `theme.colors.routeSelected` | `color.routeSelected.default` |
| strokeColor (alternate) | RN-wrapper | `semantic.color.routeAlternate.default` | `LaneShadowTheme.colors.routeAlternate` | `theme.colors.routeAlternate` | `color.routeAlternate.default` |
| strokeWidth | RN-wrapper | `6` | `6.dp` | `6` | n/a (component-specific) |

### Visual — Leg Polylines

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| strokeColor (selected) | RN-wrapper | `semantic.color.routeSelected.default` | `LaneShadowTheme.colors.routeSelected` | `theme.colors.routeSelected` | `color.routeSelected.default` |
| strokeColor (alternate) | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colors.onSurface.copy(alpha = 0.7f)` | `Color(UIColor.tertiaryLabel)` | `color.onSurface.muted` |
| strokeWidth | RN-wrapper | `4` | `4.dp` | `4` | n/a (component-specific) |

### Visual — Weather Overlay Polylines

| Overlay Type | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| Wind | strokeColor | getWindColor() | varies by level | varies by level | varies by level | `semantic.color.*` (mapped) |
| Wind | strokeWidth | RN-wrapper | `6` | `6.dp` | `6` | n/a (component-specific) |
| Rain | strokeColor | getRainColor() | varies by level | varies by level | varies by level | `semantic.color.*` (mapped) |
| Rain | strokeWidth | RN-wrapper | `6` | `6.dp` | `6` | n/a (component-specific) |
| Temperature | strokeColor | getTemperatureColor() | varies by level | varies by level | varies by level | `semantic.color.*` (mapped) |
| Temperature | strokeWidth | RN-wrapper | `6` | `6.dp` | `6` | n/a (component-specific) |

### Layout — Polyline Structure

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| coordinates | RN-wrapper | `[{ latitude, longitude }]` | `List<LatLng>` | `[CLLocationCoordinate2D]` | n/a (data structure) |
| id | RN-wrapper | `routeId + prefix + index` | unique identifier | unique identifier | n/a (identification) |

### State — Variant

| Variant | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| selected | RN-wrapper | `variant = 'selected'` | routeSelected color | routeSelected color | `color.routeSelected.default` |
| alternate | RN-wrapper | `variant = 'alternate'` | routeAlternate color | routeAlternate color | `color.routeAlternate.default` |

### Weather Overlay Levels

| Type | Level | Source | Token mapping | Value (light) | Value (dark) |
|---|---|---|---|---|---|
| Wind | low | getWindColor() | `color.success.default` | `#31A362` | `#31A362` |
| Wind | moderate | getWindColor() | `color.warning.default` | `#D98E04` | `#D98E04` |
| Wind | high | getWindColor() | `color.danger.default` | `#E35D6A` | `#E35D6A` |
| Rain | light | getRainColor() | `color.tertiary.default` | `#2B9AEB` | `#2B9AEB` |
| Rain | moderate | getRainColor() | `color.tertiary.default` (darker) | `#2B9AEB` | `#2B9AEB` |
| Rain | heavy | getRainColor() | `color.tertiary.default` (darkest) | `#2B9AEB` | `#2B9AEB` |
| Temperature | cold | getTemperatureColor() | `color.info.default` | `#2B9AEB` | `#2B9AEB` |
| Temperature | mild | getTemperatureColor() | `color.success.default` | `#31A362` | `#31A362` |
| Temperature | warm | getTemperatureColor() | `color.warning.default` | `#D98E04` | `#D98E04` |
| Temperature | hot | getTemperatureColor() | `color.danger.default` | `#E35D6A` | `#E35D6A` |

### Platform — Native Rendering

| Platform | Source | Implementation | Android | iOS | Token |
|---|---|---|---|---|---|
| Android | RN-wrapper | `react-native-maps` → Google Maps SDK | `Polyline` class | n/a | n/a |
| iOS | RN-wrapper | `react-native-maps` → MapKit | n/a | `MKPolyline` class | n/a |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| onPress | RN-wrapper | `onPress` prop (optional) | `setOnPolylineClickListener` | `delegate` + `mapView(_:didSelect:)` | n/a (callback) |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### State — Visibility

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| showLegs | RN-wrapper | `showLegs = true` (default) | render leg polylines | render leg polylines | n/a (behavior) |
| showWindOverlay | RN-wrapper | `showWindOverlay = true` (default) | render wind overlays | render wind overlays | n/a (behavior) |
| showRainOverlay | RN-wrapper | `showRainOverlay = true` (default) | render rain overlays | render rain overlays | n/a (behavior) |
| showTemperatureOverlay | RN-wrapper | `showTemperatureOverlay = true` (default) | render temp overlays | render temp overlays | n/a (behavior) |

---

## NOTES

- **Purpose**: Renders route polylines with weather overlays on map
- **Structure**: Overview polyline + optional leg polylines + optional weather overlays
- **Colors**: Selected routes use copper (#B87333), alternates use muted/gray
- **Weather overlays**: Color-coded polylines showing wind/rain/temperature levels
- **Stroke width**: Overview 6px, legs 4px, weather overlays 6px
- **Coordinates**: Decoded from polyline geometry format
- **Platform**: Uses react-native-maps wrapper, native SDKs underneath
- **Overlays**: Can show wind, rain, and temperature as separate colored polylines
- **Accessibility**: Optional press handling for route selection
