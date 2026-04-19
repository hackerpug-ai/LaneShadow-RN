# BoundingBoxOverlay - STYLE PROPERTIES MATRIX

**Component:** BoundingBoxOverlay (DELTA)
**Level:** Molecule
**RN Source:** **NEW COMPONENT — NO RN BASELINE**
**Framework Primitives:** Map SDK drawing APIs

---

## DELTA CONTEXT

**Source UC:** UC-OFFL-02 — Interactive region selection for offline map download

**Rationale:** Net-new component for interactive region-selection polygon on map. Different from route polylines (requires editable polygon, drag handles, area calculation).

**Migration path:** Native-only map SDK integration:
- Android: Google Maps `Polygon` + `Marker` for drag handles
- iOS: MapKit `MKPolygon` + `MKAnnotationView` for drag handles

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| UC Spec | `.spec/prds/native-rewrite/11-uc-offline.md` | UC-OFFL-02 requirements |

---

## STYLE PROPERTIES MATRIX

### Layout — Polygon Overlay (map-specific)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| strokeColor | Task spec | `color.primary.default` | `strokeColor = ContextCompat.getColor(..., R.color.primary)` | `strokeColor = UIColor.primary` | `color.primary.default` |
| strokeWidth | Task spec | `2` | `strokeWidth = 2f` | `lineWidth = 2` | ESCALATE — propose `size.polylineStroke = 2` |
| fillColor | Task spec | `color.primary.default` with 0.1 alpha | `fillColor = Color.argb(0.1, ...)` | `fillColor = UIColor.primary.withAlphaComponent(0.1)` | ESCALATE — propose `opacity.polygonFill = 0.1` |
| geodesic | Task spec | `true` | `geodesic = true` | n/a (iOS automatic) | n/a |

### Layout — Drag Handles (Markers)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | Task spec | Polygon vertices | `Marker(position = vertex)` | `MKAnnotationView(at: vertex)` | n/a (map SDK) |
| icon | Task spec | Custom drag handle | `BitmapDescriptorFactory.fromResource(...)` | Custom MKAnnotationView | n/a |
| anchor | Task spec | `(0.5, 0.5)` | `anchor(0.5f, 0.5f)` | `centerOffset = CGPoint(x: 0, y: 0)` | n/a (map SDK) |
| draggable | Task spec | `true` | `draggable(true)` | `isDraggable = true` | n/a (map SDK) |

### Visual — Drag Handle Icon

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | Task spec | `32` | `32.dp` | `32` | ESCALATE — propose `size.dragHandle = 32` |
| backgroundColor | Task spec | `color.surface.default` | Surface | Surface | `color.surface.default` |
| borderColor | Task spec | `color.primary.default` | Primary | Primary | `color.primary.default` |
| borderWidth | Task spec | `3` | `3.dp` | `3` | ESCALATE — propose `borderWidth.dragHandle = 3` |
| shadow | Task spec | `elevation[3]` | `elevation = 3` | `.shadow(...)` | `elevation[3]` |

### Visual — Area Label (optional)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | Task spec | Polygon centroid | Calculated from vertices | Calculated from vertices | n/a (dynamic) |
| backgroundColor | Task spec | `color.surface.default` | Surface | Surface | `color.surface.default` |
| borderRadius | Task spec | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| padding | Task spec | `space.sm` = 8 | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` |

### Typography — Area Text (Text variant=labelMedium)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | Task spec | `labelMedium` | `MaterialTheme.typography.labelMedium` | Verify against Paper | n/a |
| text | Task spec | `'~245 MB'` | `Text("~245 MB")` | `Text("~245 MB")` | n/a (dynamic) |
| color | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### State — Props

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|
| bounds | Task spec | `LatLngBounds` | `val bounds: LatLngBounds` | `var bounds: GMSCoordinateBounds` | n/a (map SDK) |
| onBoundsChange | Task spec | `(LatLngBounds) -> Unit` | `onBoundsChange: (LatLngBounds) -> Unit` | `onBoundsChange: (GMSCoordinateBounds) -> Void` | n/a |
| areaInMB | Task spec | `Int?` (calculated) | `val areaInMB: Int?` | `var areaInMB: Int?` | n/a (calculated) |

---

## NOTES

- **NEW component:** No RN baseline exists
- **Map SDK integration:** Uses native map polygon/marker APIs
- **Polygon:** Primary color stroke, 10% opacity fill, geodesic
- **Drag handles:** 32px circular markers at each vertex, draggable
- **Handle style:** Surface background, primary border, elevation[3]
- **Area label:** Optional, shows estimated download size at centroid
- **Interaction:** User drags handles to adjust region, polygon updates in real-time
- **Area calculation:** Computes polygon area and converts to download size
- **Map SDK specifics:** Google Maps (Android), MapKit (iOS)
- **Accessibility:** `accessibilityLabel` = "Region selection area, approximately {size}"
