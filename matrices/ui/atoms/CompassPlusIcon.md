# CompassPlusIcon - STYLE PROPERTIES MATRIX

**Component:** CompassPlusIcon
**RN Source:** `react-native/components/map/compass-plus-icon.tsx`
**Framework Primitives:** `Svg`, `Circle`, `G`, `Line`, `Path` (react-native-svg)

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/map/compass-plus-icon.tsx` | Public API, compass drawing, badge rendering |
| react-native-svg | `react-native-svg` | SVG rendering on all platforms |

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `size` prop (default: 28) | `Modifier.width(size.dp)` | `.frame(width: size)` | varies (prop) |
| height | RN-wrapper | `size` prop (default: 28) | `Modifier.height(size.dp)` | `.frame(height: size)` | varies (prop) |
| viewBox | RN-wrapper | `"0 0 size size"` | `viewportWidth = size.f, viewportHeight = size.f` | `Svg viewBox: "0 0 \(size) \(size)"` | n/a (SVG) |

### Visual — Calculated Values

| Property | Source | Calculation | Android | iOS | Token |
|---|---|---|---|---|---|
| strokeWidth | RN-wrapper | `max(1.5, semantic.space.xs / 3)` | `max(1.5f, (4 / 3).toFloat())` = 1.5 | `max(1.5, 4 / 3)` = 1.5 | `space.xs / 3` (clamped) |
| badgeRadius | RN-wrapper | `max(6, semantic.space.md) / 2` | `max(6, 12) / 2` = 6 | `max(6, 12) / 2` = 6 | `space.md / 2` (clamped) |
| center | RN-wrapper | `size / 2` | `size / 2.f` | `size / 2` | n/a (calculation) |
| radius | RN-wrapper | `(size - strokeWidth * 2) / 2` | `(size - strokeWidth * 2) / 2.f` | `(size - strokeWidth * 2) / 2` | n/a (calculation) |
| badgeCenterX | RN-wrapper | `center + radius * 0.5` | `center + radius * 0.5f` | `center + radius * 0.5` | n/a (calculation) |
| badgeCenterY | RN-wrapper | `center + radius * 0.5` | `center + radius * 0.5f` | `center + radius * 0.5` | n/a (calculation) |

### Visual — Compass Circle

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| stroke | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| fill | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| strokeLinecap | RN-wrapper | `'round'` | `StrokeCap.Round` | `.lineCap(.round)` | n/a (SVG) |
| strokeLinejoin | RN-wrapper | `'round'` | `StrokeJoin.Round` | `.lineJoin(.round)` | n/a (SVG) |

### Visual — Compass Needle

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| stroke | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| fill | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| path | RN-wrapper | diamond shape (calculated) | same path data | same path data | n/a (SVG path) |
| strokeLinecap | RN-wrapper | `'round'` | `StrokeCap.Round` | `.lineCap(.round)` | n/a (SVG) |
| strokeLinejoin | RN-wrapper | `'round'` | `StrokeJoin.Round` | `.lineJoin(.round)` | n/a (SVG) |

### Visual — Compass Marks (North/South)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| stroke | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| strokeWidth | RN-wrapper | `calculated (1.5)` | `strokeWidth` | `strokeWidth` | n/a (calculation) |
| strokeLinecap | RN-wrapper | `'round'` | `StrokeCap.Round` | `.lineCap(.round)` | n/a (SVG) |
| position | RN-wrapper | vertical lines (calculated) | same coordinates | same coordinates | n/a (calculation) |

### Visual — Plus Badge

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| circle fill | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| plus stroke | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| plus strokeWidth | RN-wrapper | `strokeWidth * 0.9` | `strokeWidth * 0.9f` | `strokeWidth * 0.9` | n/a (calculation) |
| strokeLinecap | RN-wrapper | `'round'` | `StrokeCap.Round` | `.lineCap(.round)` | n/a (SVG) |
| position | RN-wrapper | bottom-right quadrant (calculated) | same coordinates | same coordinates | n/a (calculation) |

### Layout — Badge Position

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| badgeCenterX | RN-wrapper | `center + radius * 0.5` | `(center + radius * 0.5f).dp` | `center + radius * 0.5` | n/a (calculation) |
| badgeCenterY | RN-wrapper | `center + radius * 0.5` | `(center + radius * 0.5f).dp` | `center + radius * 0.5` | n/a (calculation) |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'image'` | `Modifier.semantics { role = Role.Image }` | `.accessibilityElement` | n/a |
| accessibilityLabel | RN-wrapper | passed via prop | `contentDescription = label` | `.accessibilityLabel(label)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

---

## NOTES

- **Purpose**: Compass icon with plus badge for "add waypoint" or similar actions
- **Composition**: Compass circle (primary fill) + diamond needle + plus badge (overlay)
- **Sizes**: Stroke width ~1.5px, badge radius ~6px, default 28×28px
- **Colors**: Primary compass with onPrimary stroke, onSurface badge with surface plus
- **Needle**: Diamond shape pointing up (north indication)
- **Badge**: Positioned in bottom-right quadrant of compass
- **Calculations**: All positions and sizes calculated from base size prop
- **Responsive**: Stroke width and badge radius scale with semantic tokens
- **Platform**: Uses react-native-svg for cross-platform SVG rendering
- **Usage**: Map controls, waypoint actions, compass-related features
