# RegionBoundsPreview — STYLE PROPERTIES MATRIX

**Component:** RegionBoundsPreview
**Level:** Molecule (Delta)
**Source:** UC-OFFL-01 (NEW for Sprint 2)
**Platform Mapping:** Android `Box` with map snapshot, iOS `View` with map snapshot

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Visual | NEW component (no RN source) | Map snapshot APIs | Android: `app/src/main/java/com/laneshadow/ui/molecules/RegionBoundsPreview.kt`<br>iOS: `app/ui/molecules/RegionBoundsPreview.swift` | 1 fixed layout |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property for this net-new component.

### Layout — Preview Container

**Source files read:**
- Specification: UC-OFFL-01 (offline region preview use case)
- Design: Static region thumbnail (map-bounds snapshot)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width | UC spec | `100%` of parent | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | height | UC spec | `120` | `Modifier.height(120.dp)` | `.frame(height: 120)` | ESCALATE — propose `size.previewHeight = 120` |
| Visual | backgroundColor | UC spec | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | borderRadius | UC spec | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Visual | borderWidth | UC spec | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — `borderWidth.thin = 1` |
| Visual | borderColor | UC spec | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Layout — Map Snapshot

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | position | UC spec | Fill container | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Visual | clip | UC spec | `true` | `Modifier.clip(shape)` | `.clipped()` | n/a |
| Visual | opacity | UC spec | `0.8` | `Modifier.alpha(0.8f)` | `.opacity(0.8)` | ESCALATE — `opacity.previewOverlay = 0.8` |

### Layout — Region Bounds

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | position | UC spec | Overlaid on snapshot | `Modifier.align(Alignment.Center)` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Visual | strokeColor | UC spec | `primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | strokeWidth | UC spec | `2` | `strokeWidth = 2.dp` | `.stroke(lineWidth: 2)` | ESCALATE — `borderWidth.thick = 2` |
| Visual | fillColor | UC spec | `primary.default` with 15% alpha | `LaneShadowTheme.colors.primary.copy(alpha = 0.15f)` | `theme.colors.primary.opacity(0.15)` | `color.primary.default` + alpha |

### Typography — Region Label

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | position | UC spec | Bottom left | `Modifier.align(Alignment.BottomStart)` | `.frame(maxWidth: .infinity, maxHeight: .infinity).position(.bottomLeading)` | n/a |
| Layout | padding | UC spec | `8` | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` |
| Typography | fontSize | UC spec | `12` | `12.sp` | `font(.system(size: 12))` | `type.label.sm.fontSize` |
| Typography | fontWeight | UC spec | `'600'` | `FontWeight.SemiBold` | `.semibold` | `type.label.sm.fontWeight` |
| Typography | color | UC spec | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Visual | backgroundColor | UC spec | `surface.default` with 90% alpha | `LaneShadowTheme.colors.surface.copy(alpha = 0.9f)` | `theme.colors.surface.opacity(0.9)` | ESCALATE — `opacity.labelBg = 0.9` |
| Visual | borderRadius | UC spec | `4` | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |

---

## DESIGN NOTES

- **Net-new component** for Sprint 2 delta
- Static thumbnail showing region bounds on map
- Different from `RouteThumbnail` (shows rectangular region, not route path)
- Used in offline region list
- Map snapshot with bounds overlay
- Region name label in corner

---

## VERIFICATION GATES

- Snapshot renders
- Bounds box visible
- Label readable
- Aspect ratio correct
- Border visible

---

## DEPENDENCIES

- UI-001 (core theme contract)
- Map snapshot system (Android `GoogleMap.snapshot`, iOS `MKMapSnapshotter`)

---

## COMPOSITION

- RegionBoundsPreview = Box + [mapSnapshot, boundsOverlay, label]
- Used by: RegionListItem (offline region list)
