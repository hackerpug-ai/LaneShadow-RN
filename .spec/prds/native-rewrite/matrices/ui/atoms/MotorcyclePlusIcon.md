# MotorcyclePlusIcon - STYLE PROPERTIES MATRIX

**Component:** MotorcyclePlusIcon
**RN Source:** `react-native/components/ui/motorcycle-plus-icon.tsx`
**Framework Primitives:** `View`, `MaterialCommunityIcons`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/motorcycle-plus-icon.tsx` | Public API, composite icon rendering |
| MaterialCommunityIcons | `@expo/vector-icons/MaterialCommunityIcons` | Motorbike and plus-circle glyphs |

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `size` prop (default: 22) | `Modifier.width(size.dp)` | `.frame(width: size)` | varies (prop) |
| height | RN-wrapper | `size` prop (default: 22) | `Modifier.height(size.dp)` | `.frame(height: size)` | varies (prop) |

### Layout — Base Icon (Motorbike)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| name | RN-wrapper | `'motorbike'` | `Icons.Outlined.Motorbike` | `UIImage(systemName: "motorbike")` (if available) | n/a (icon name) |
| size | RN-wrapper | `size` prop (default: 22) | `size.dp` | `size` | varies (prop) |
| color | RN-wrapper | `baseColor` (prop or onSurface.default) | `Color(baseColor)` or `LaneShadowTheme.colors.onSurface` | `Color(baseColor)` or `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Overlay Icon (Plus-Circle)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| name | RN-wrapper | `'plus-circle'` | `Icons.Filled.AddCircle` | `UIImage(systemName: "plus.circle.fill")` | n/a (icon name) |
| size | RN-wrapper | `overlaySize = size * 0.55` | `(size * 0.55).dp` | `size * 0.55` | n/a (calculation) |
| position | RN-wrapper | `'absolute'` | `Modifier.offset(...)` | `.overlay(...)` | n/a (layout) |
| bottom offset | RN-wrapper | `-overlaySize * 0.2` | `offset(y = -(overlaySize * 0.2).dp)` | `.offset(y: -overlaySize * 0.2)` | n/a (calculation) |
| right offset | RN-wrapper | `-overlaySize * 0.2` | `offset(x = -(overlaySize * 0.2).dp)` | `.offset(x: -overlaySize * 0.2)` | n/a (calculation) |

### Visual — Colors

| Element | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| base icon | RN-wrapper | `baseColor` (prop or onSurface.default) | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| overlay icon | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Visual — Calculated Values

| Property | Source | Calculation | Android | iOS | Token |
|---|---|---|---|---|---|
| overlaySize | RN-wrapper | `round(size * 0.55)` | `(size * 0.55).roundToInt()` | `(size * 0.55).rounded()` | n/a (calculation) |
| bottomOffset | RN-wrapper | `-round(overlaySize * 0.2)` | `-(overlaySize * 0.2).roundToInt().dp` | `-overlaySize * 0.2` | n/a (calculation) |
| rightOffset | RN-wrapper | `-round(overlaySize * 0.2)` | `-(overlaySize * 0.2).roundToInt().dp` | `-overlaySize * 0.2` | n/a (calculation) |

### Layout — Flex/Alignment

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` (overlay) | `wrapContentWidth().align(Alignment.CenterHorizontally)` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` (overlay) | `wrapContentHeight().align(Alignment.CenterVertically)` | n/a | n/a |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'image'` | `Modifier.semantics { role = Role.Image }` | `.accessibilityElement` | n/a |
| accessibilityLabel | RN-wrapper | passed via prop | `contentDescription = label` | `.accessibilityLabel(label)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

---

## NOTES

- **Purpose**: Composite icon showing motorbike with plus-circle badge
- **Composition**: Motorbike icon (base) + plus-circle icon (overlay in bottom-right)
- **Overlay sizing**: 55% of base size, positioned 20% outside bottom-right corner
- **Colors**: Base icon uses onSurface or prop, overlay always uses primary color
- **Default size**: 22×22px
- **Usage**: Branding icon for motorcycle-related actions/features
- **Platform**: Uses MaterialCommunityIcons on all platforms for consistency
- **Layout**: Absolute positioning for overlay relative to base icon container
