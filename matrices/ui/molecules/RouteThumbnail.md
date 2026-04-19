# RouteThumbnail - STYLE PROPERTIES MATRIX

**Component:** RouteThumbnail
**RN Source:** `react-native/components/ui/route-thumbnail.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `expo-linear-gradient`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/route-thumbnail.tsx` | Public API, bounds calculation, rotation |
| LinearGradient | `expo-linear-gradient` | Gradient background |
| View | `node_modules/react-native/Libraries/Components/View/View.js` | Container, route line |

---

## COMPOSITION

**Child atoms:** None (uses framework primitives directly)

**Composition pattern:** Container with gradient background, absolute-positioned route line (L-shape) with rotation transform.

**Layout:** Fixed size container (default 96×96), gradient fills container, route line positioned absolutely.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `96` (default) | `Modifier.width(96.dp)` | `.frame(width: 96)` | ESCALATE — propose `size.thumbnail = 96` |
| height | RN-wrapper | `96` (default) | `Modifier.height(96.dp)` | `.frame(height: 96)` | `size.thumbnail` |
| borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| overflow | RN-wrapper | `'hidden'` | `Modifier.clip(shape = RoundedCornerShape(16.dp))` | `.clipped()` | n/a |

### Visual — Gradient Background

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| colors (start) | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| colors (end) | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| start | RN-wrapper | `{ x: 0, y: 0 }` | `0.dp to 0.dp` | `.leading, .top` | n/a |
| end | RN-wrapper | `{ x: 1, y: 1 }` | `1.dp to 1.dp` | `.trailing, .bottom` | n/a |

### Layout — Route Line (Absolute)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | n/a (use Box with offset) | `.position(...)` | n/a |
| top | RN-wrapper | Calculated from bounds or prop (default 20) | `Modifier.offset(y = 20.dp)` | `.offset(y: 20)` | ESCALATE — propose `space.lg + space.xs = 20` |
| left | RN-wrapper | Calculated from bounds or prop (default 15) | `Modifier.offset(x = 15.dp)` | `.offset(x: 15)` | ESCALATE — propose `space.lg + 3 = 15` |
| width | RN-wrapper | Calculated from bounds or prop (default 60) | `Modifier.width(60.dp)` | `.frame(width: 60)` | ESCALATE — route dimension calculation |
| height | RN-wrapper | Calculated from bounds or prop (default 50) | `Modifier.height(50.dp)` | `.frame(height: 50)` | ESCALATE — route dimension calculation |

### Visual — Route Line

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| borderWidth | RN-wrapper | `2` | `Modifier.border(2.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 2))` | `borderWidth.thick` |
| borderColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| borderRightWidth | RN-wrapper | `0` | n/a | n/a | n/a |
| borderBottomWidth | RN-wrapper | `0` | n/a | n/a | n/a |

### Transform — Rotation

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| rotate | RN-wrapper | Calculated from bounds or prop (default -10) | `Modifier.graphicsLayer { rotationZ = -10f }` | `.rotationEffect(.degrees(-10))` | n/a (dynamic calculation) |

### Constants

| Constant | Source | Value | Purpose |
|---|---|---|---|
| MIN_ROUTE_DIMENSION | RN-wrapper | `20` | Minimum route line size |
| ROUTE_PADDING | RN-wrapper | `16` | Padding around route line within thumbnail |
| DEFAULT_ROTATION | RN-wrapper | `-10` | Default rotation angle when no bounds |

---

## NOTES

- **Gradient:** Linear gradient from background to surface color (diagonal: top-left to bottom-right)
- **Route line:** L-shape created by setting borderRightWidth and borderBottomWidth to 0
- **Bounds calculation:** When bounds provided, rotation and dimensions calculated from route geometry
- **Rotation formula:** `atan2(latSpan, lngSpan) * (180 / PI)` for diagonal SW to NE angle
- **Dimension calculation:** Fits route within thumbnail while maintaining aspect ratio, minimum 20px
- **Default dimensions:** 96×96 thumbnail, 60×50 route line at (15, 20) position
- **Primary color:** Route line uses primary copper color (#B87333)
- **Rounded corners:** Container 16px radius, route line 8px radius
- **Border:** 2px thick border for route line
- **Overflow hidden:** Clips route line to container bounds
- **Dynamic positioning:** Supports manual positioning via props or automatic calculation from bounds
