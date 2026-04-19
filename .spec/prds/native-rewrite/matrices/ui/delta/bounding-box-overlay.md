# BoundingBoxOverlay — STYLE PROPERTIES MATRIX

**Component:** BoundingBoxOverlay
**Level:** Molecule (Delta)
**Source:** UC-OFFL-02 (NEW for Sprint 2)
**Platform Mapping:** Android `Canvas` polygon, iOS `MapKit` overlay

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Visual | NEW component (no RN source) | Map overlay APIs | Android: `app/src/main/java/com/laneshadow/ui/molecules/BoundingBoxOverlay.kt`<br>iOS: `app/ui/molecules/BoundingBoxOverlay.swift` | 2 states: selecting, selected |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property for this net-new component.

### Layout — Polygon Overlay

**Source files read:**
- Specification: UC-OFFL-02 (offline region selection use case)
- Design: Interactive region-selection polygon on map

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | position | UC spec | Overlaid on map | `GoogleMap(polygon = ...)` | `MapOverlay` | n/a |
| Visual | fillColor | UC spec | `primary.default` with 10% alpha | `LaneShadowTheme.colors.primary.copy(alpha = 0.1f)` | `theme.colors.primary.opacity(0.1)` | `color.primary.default` + alpha |
| Visual | strokeColor | UC spec | `primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | strokeWidth | UC spec | `2` | `strokeWidth = 2.dp` | `.stroke(lineWidth: 2)` | ESCALATE — `borderWidth.thick = 2` |
| Visual | strokePattern | UC spec | Solid | `solid` | `.stroke` with no dash | n/a |
| Layout | cornerHandles | UC spec | `8` handles at corners | `draw 8 circles` | `8 circle markers` | n/a |
| Layout | handleSize | UC spec | `16 × 16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | ESCALATE — `size.mapHandle = 16` |
| Visual | handleColor | UC spec | `primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | handleBorderWidth | UC spec | `2` (white) | `stroke(2.dp, Color.White)` | `.strokeBorder(Color.white, lineWidth: 2)` | ESCALATE — `borderWidth.thick = 2` |

### Interaction — Drag Handles

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Interaction | draggable | UC spec | `true` (corner handles) | `Modifier.draggable(state = ...)` | `.gesture(DragGesture())` | n/a |
| Interaction | hitTest | UC spec | `44` min touch target | `Modifier.size(min = 44.dp)` | `.frame(minWidth: 44, minHeight: 44)` | `touchTarget.min` |

### Visual — Selection State

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Visual | fillColor (selected) | UC spec | `success.default` with 20% alpha | `LaneShadowTheme.colors.success.copy(alpha = 0.2f)` | `theme.colors.success.opacity(0.2)` | `color.success.default` + alpha |
| Visual | strokeColor (selected) | UC spec | `success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| Visual | handleColor (selected) | UC spec | `success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |

---

## DESIGN NOTES

- **Net-new component** for Sprint 2 delta
- Interactive polygon for offline region selection
- 8 corner handles for resizing
- Different from route polylines (rectangular bounding box)
- Drag handles expand to 44pt touch target
- Visual feedback on selection (green)
- Overlaid on map

---

## VERIFICATION GATES

- Polygon renders on map
- Handles draggable
- Touch targets meet minimum
- Selection state visible
- Handles positioned correctly

---

## DEPENDENCIES

- UI-001 (core theme contract)
- Map system (Android `GoogleMap`, iOS `MapKit`)
- Gesture system (Android `Modifier.draggable`, iOS `.gesture`)

---

## COMPOSITION

- BoundingBoxOverlay = Map overlay + [polygon, 8 drag handles]
- Used by: OfflineRegionSelector (region download screen)
