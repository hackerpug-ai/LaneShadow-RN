# WindBadge - STYLE PROPERTIES MATRIX

**Component:** WindBadge
**RN Source:** `react-native/components/planning/wind-badge.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/planning/wind-badge.tsx` | Public API, wind level mapping |
| Badge | `react-native/components/ui/badge.tsx` | Badge component with variant styling (see `matrices/ui/atoms/Badge.md`) |

---

## COMPOSITION

**Child atoms:**
- `Badge` - Displays wind level label with color-coded variant (see `matrices/ui/atoms/Badge.md`)

**Composition pattern:** Single Badge child with variant determined by wind level.

**Layout:** Self-aligning flex-start (badge handles internal layout).

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.align(Alignment.Start)` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |

### Visual — Badge Variant (by wind level)

| Wind Level | Badge Variant | Source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| low | `success` | RN-wrapper mapping | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| moderate | `warning` | RN-wrapper mapping | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| high | `destructive` | RN-wrapper mapping | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| unavailable | `secondary` | RN-wrapper mapping | `LaneShadowTheme.colors.secondary` | `theme.colors.secondary` | `color.secondary.default` |

### Visual — Badge Styling

Badge component handles all internal styling. See `matrices/ui/atoms/Badge.md` for:
- Background colors by variant
- Text colors
- Border radius
- Padding
- Typography

### Typography — Labels

| Wind Level | Label | Source |
|---|---|---|
| low | `'Low'` | RN-wrapper constant |
| moderate | `'Moderate'` | RN-wrapper constant |
| high | `'High'` | RN-wrapper constant |
| unavailable | `'Unavailable'` | RN-wrapper constant |

**Fallback:** Unknown wind levels display CAPS_CASE label with underscores converted to spaces.

### Interaction

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| onPress | RN-wrapper | none (read-only) | n/a | n/a | n/a |

---

## NOTES

- **Wind levels:** Four known levels - low, moderate, high, unavailable
- **Color coding:** Success (green) for low, warning (amber) for moderate, destructive (red) for high
- **Extensibility:** Component accepts any string for forward compatibility with new backend wind levels
- **Graceful fallback:** Unknown levels display uppercase label with secondary variant
- **Icon mapping:** Icon exists in code but is not currently rendered (Badge component accepts icon prop)
- **Self-contained:** All styling delegated to Badge component, no custom styles in WindBadge
