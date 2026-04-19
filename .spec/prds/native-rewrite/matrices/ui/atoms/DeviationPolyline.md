# DeviationPolyline - STYLE PROPERTIES MATRIX

**Component:** DeviationPolyline
**RN Source:** `react-native/components/map/deviation-polyline.tsx`
**Framework Primitives:** Map SDK polyline components (react-native-maps)

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/map/deviation-polyline.tsx` | Public API, deviation route rendering |
| react-native-maps | `react-native-maps` | Polyline rendering on maps |

---

## STYLE PROPERTIES MATRIX

### Visual — Original Route Polyline

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| strokeColor | RN-wrapper | `semantic.color.deviationOriginalRoute.default` | `LaneShadowTheme.colors.deviationOriginalRoute` | `theme.colors.deviationOriginalRoute` | `color.deviationOriginalRoute.default` |
| strokeWidth | RN-wrapper | `6` | `6.dp` | `6` | n/a (component-specific) |

### Visual — Detour Path Polyline

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| strokeColor | RN-wrapper | `semantic.color.deviationDetourPath.default` | `LaneShadowTheme.colors.deviationDetourPath` | `theme.colors.deviationDetourPath` | `color.deviationDetourPath.default` |
| strokeWidth | RN-wrapper | `6` | `6.dp` | `6` | n/a (component-specific) |

### Visual — Reconnect Point Marker

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| pinColor | RN-wrapper | `semantic.color.deviationReconnectPoint.default` | `LaneShadowTheme.colors.deviationReconnectPoint` | `theme.colors.deviationReconnectPoint` | `color.deviationReconnectPoint.default` |
| marker size | RN-wrapper | `default map marker` | `Marker` with default size | `MKMarkerAnnotationView` | n/a (map SDK) |

### Layout — Polyline Structure

| Element | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| originalRoute | RN-wrapper | `originalRoute` prop | decoded coordinates | decoded coordinates | n/a (data structure) |
| detourPath | RN-wrapper | `detourPath` prop | decoded coordinates | decoded coordinates | n/a (data structure) |
| reconnectPoint | RN-wrapper | `reconnectPoint` prop | coordinate `{ latitude, longitude }` | coordinate `{ latitude, longitude }` | n/a (data structure) |

### Visual — Color Values (Light Mode)

| Element | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| originalRoute | tokens | `#9CA3AF` (gray) | `Color(0xFF9CA3AF)` | `UIColor(hex: "9CA3AF")` | `color.deviationOriginalRoute.default` |
| detourPath | tokens | `#FF6B35` (orange) | `Color(0xFFFF6B35)` | `UIColor(hex: "FF6B35")` | `color.deviationDetourPath.default` |
| reconnectPoint | tokens | `#31A362` (green) | `Color(0xFF31A362)` | `UIColor(hex: "31A362")` | `color.deviationReconnectPoint.default` |

### Visual — Color Values (Dark Mode)

| Element | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| originalRoute | tokens | `#6B7280` (darker gray) | `Color(0xFF6B7280)` | `UIColor(hex: "6B7280")` | `color.deviationOriginalRoute.default` |
| detourPath | tokens | `#FF6B35` (orange, same) | `Color(0xFFFF6B35)` | `UIColor(hex: "FF6B35")` | `color.deviationDetourPath.default` |
| reconnectPoint | tokens | `#31A362` (green, same) | `Color(0xFF31A362)` | `UIColor(hex: "31A362")` | `color.deviationReconnectPoint.default` |

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

### Layout — Map Rendering

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| z-index | RN-wrapper | `implicit (map layer)` | `zIndex` | `level` | n/a (map SDK) |
| transparency | RN-wrapper | `opaque` | `alpha = 1.0f` | `.opacity(1.0)` | n/a (default) |

---

## NOTES

- **Purpose**: Visualizes route deviations with original route (gray), detour path (orange), and reconnect point (green)
- **Original route**: Gray polyline showing the planned route
- **Detour path**: Orange polyline showing the actual deviation taken
- **Reconnect point**: Green marker where detour rejoins original route
- **Stroke width**: 6px for all polylines
- **Color semantics**: Gray = past/invalid, Orange = active detour, Green = reconnection/success
- **Platform**: Uses react-native-maps wrapper, native SDKs underneath
- **Accessibility**: Optional press handling for deviation details
