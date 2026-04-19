# RoutePolylineComponent - STYLE PROPERTIES MATRIX

**Component:** RoutePolylineComponent
**RN Source:** `react-native/components/map/route-polyline-component.tsx`
**Framework Primitives:** Map SDK polyline components (react-native-maps)

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/map/route-polyline-component.tsx` | Public API, route-based polyline rendering |
| buildRoutePolylines | `react-native/components/map/route-polyline.tsx` | Polyline construction logic |

---

## STYLE PROPERTIES MATRIX

### Visual — Stroke Color (by state)

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| selected | RN-wrapper | `semantic.color.routeSelected.default` | `LaneShadowTheme.colors.routeSelected` | `theme.colors.routeSelected` | `color.routeSelected.default` |
| unselected | RN-wrapper | `semantic.color.routeAlternate.default` | `LaneShadowTheme.colors.routeAlternate` | `theme.colors.routeAlternate` | `color.routeAlternate.default` |

### Visual — Stroke Width

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| overview | RN-wrapper | `6` | `6.dp` | `6` | n/a (component-specific) |
| legs | RN-wrapper | `4` | `4.dp` | `4` | n/a (component-specific) |
| overlays | RN-wrapper | `6` | `6.dp` | `6` | n/a (component-specific) |

### Layout — Structure

| Element | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| overview polyline | RN-wrapper | `route.overviewGeometry` | decoded coordinates | decoded coordinates | n/a (data) |
| leg polylines | RN-wrapper | `route.legs[].geometry` | decoded coordinates | decoded coordinates | n/a (data) |
| weather overlays | RN-wrapper | `route.overlays.*` | overlay segments | overlay segments | n/a (data) |

### State — Selection

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| isSelected | RN-wrapper | `isSelected` prop | determines color | determines color | n/a (state) |
| default | RN-wrapper | `false` | alternate color | alternate color | `color.routeAlternate.default` |
| selected | RN-wrapper | `true` | selected color | selected color | `color.routeSelected.default` |

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

---

## NOTES

- **Purpose**: Simplified route polyline component wrapping buildRoutePolylines
- **Props**: Takes route object, isSelected boolean, optional onPress
- **Colors**: Selected (copper), Unselected (muted/gray with opacity)
- **Structure**: Renders overview, legs, and weather overlays via buildRoutePolylines
- **Delegation**: Most logic delegated to buildRoutePolylines function
- **Usage**: Convenient wrapper for common route display use cases
