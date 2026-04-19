# LaneShadowLogo - STYLE PROPERTIES MATRIX

**Component:** LaneShadowLogo
**RN Source:** `react-native/components/auth/lane-shadow-logo.tsx`
**Framework Primitives:** `Svg`, `Circle`, `Path` (react-native-svg)

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/auth/lane-shadow-logo.tsx` | Public API, logo rendering, size scaling |
| react-native-svg | `react-native-svg` | SVG rendering on all platforms |

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `size` prop | `Modifier.width(size.dp)` | `.frame(width: size)` | varies (prop) |
| height | RN-wrapper | `size` prop | `Modifier.height(size.dp)` | `.frame(height: size)` | varies (prop) |
| viewBox | RN-wrapper | `"0 0 24 24"` | `viewportWidth = 24.f, viewportHeight = 24.f` | `Svg viewBox: "0 0 24 24"` | n/a (SVG) |

### Layout — Logo Elements

| Element | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| Circle (top) | cx | RN-wrapper | `8` | `8.f` | `8` | n/a (SVG coordinate) |
| Circle (top) | cy | RN-wrapper | `6` | `6.f` | `6` | n/a (SVG coordinate) |
| Circle (top) | r | RN-wrapper | `dotRadius` (calc) | `semantic.space.xs / 1.5` ≈ `3.f` | `3` | n/a (calculation) |
| Circle (top) | fill | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Circle (bottom) | cx | RN-wrapper | `16` | `16.f` | `16` | n/a (SVG coordinate) |
| Circle (bottom) | cy | RN-wrapper | `18` | `18.f` | `18` | n/a (SVG coordinate) |
| Circle (bottom) | r | RN-wrapper | `dotRadius` (calc) | `semantic.space.xs / 1.5` ≈ `3.f` | `3` | n/a (calculation) |
| Circle (bottom) | fill | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Path (route) | d | RN-wrapper | `"M8 6 V12 C8 15 12 15 12 12 V10 C12 7 16 7 16 10 V18"` | same path data | same path data | n/a (SVG path) |
| Path (route) | stroke | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Path (route) | strokeWidth | RN-wrapper | `strokeWidth` (calc) | `max(2, round(semantic.space.sm / 3))` ≈ `3.f` | `3` | n/a (calculation) |
| Path (route) | strokeLinecap | RN-wrapper | `'round'` | `StrokeCap.Round` | `.lineCap(.round)` | n/a (SVG) |
| Path (route) | strokeLinejoin | RN-wrapper | `'round'` | `StrokeJoin.Round` | `.lineJoin(.round)` | n/a (SVG) |
| Path (route) | fill | RN-wrapper | `'none'` | `none` | `.clear` | n/a (SVG) |

### Visual — Calculated Values

| Property | Source | Calculation | Android | iOS | Token |
|---|---|---|---|---|---|---|
| strokeWidth | RN-wrapper | `max(2, round(semantic.space.sm / 3))` | `max(2, (8 / 3).roundToInt()) = 3` | `max(2, (8 / 3).rounded()) = 3` | `space.sm / 3` (clamped) |
| dotRadius | RN-wrapper | `max(2, round(semantic.space.xs / 1.5))` | `max(2, (4 / 1.5).roundToInt()) = 3` | `max(2, (4 / 1.5).rounded()) = 3` | `space.xs / 1.5` (clamped) |

### Visual — Colors

| Element | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| circles & path | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

### Layout — Size Scaling

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `size` prop (required) | `Modifier.size(size.dp)` | `.frame(width: size, height: size)` | varies (usage) |
| viewBox | RN-wrapper | `fixed 0 0 24 24` | `Image(painter = painterResource(...), viewportSize = ViewportSize(24.f, 24.f))` | `Svg viewBox: "0 0 24 24"` | n/a (SVG) |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `none` | `Modifier.semantics { role = Role.Image }` | `.accessibilityElement` | n/a |
| accessibilityLabel | RN-wrapper | passed via prop | `contentDescription = label` | `.accessibilityLabel(label)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### Platform — SVG Rendering

| Platform | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| All | RN-wrapper | `react-native-svg` | `compose-svg` + `Painter` | `SwiftUI` + `Svg` | n/a (cross-platform) |

---

## NOTES

- **Design**: Thick S-curve "route" glyph with two filled endpoints
- **SVG structure**: 2 circles (endpoints) + 1 path (S-curve route)
- **Responsive**: Stroke width and dot radius scale with semantic tokens
- **Colors**: Uses onPrimary color (white) for contrast with primary background
- **Path**: S-curve from (8,6) to (16,18) with inflection at (12,12)
- **Stroke cap/join**: Round for smooth, modern appearance
- **Size**: Scalable via size prop, maintains 24×24 viewBox aspect ratio
- **Usage**: Typically rendered on primary color background (copper)
- **Branding**: LaneShadow logo mark for auth screens, onboarding, etc.
