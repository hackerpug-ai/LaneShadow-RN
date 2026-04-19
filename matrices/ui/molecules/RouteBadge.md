# RouteBadge - STYLE PROPERTIES MATRIX

**Component:** RouteBadge
**RN Source:** `react-native/components/ui/route-badge.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/route-badge.tsx` | Public API, variants, layout, styling |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Optional badge icon (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Badge text display |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Optional icon for badge (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Row container with optional icon and text. Self-sizing (flex-start). Two variants: primary (copper accent) and neutral (subtle).

**Layout:** Horizontal row (`flexDirection: 'row'`), center alignment, fixed icon-to-text gap.

---

## STYLE PROPERTIES MATRIX

### Layout — Badge

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.wrapContentWidth()` | n/a | n/a |
| gap | RN-wrapper | `4` | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs` |
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| paddingHorizontal | RN-wrapper | `8` | `Modifier.padding(horizontal = 8.dp)` | `.padding(.horizontal, 8)` | ESCALATE — between `space.sm` (8) and `space.md` (12); use `8.dp` literal |
| borderRadius | RN-wrapper | `6` | `RoundedCornerShape(6.dp)` | `RoundedRectangle(cornerRadius: 6)` | ESCALATE — between `radius.sm` (4) and `radius.md` (8); use `6.dp` literal |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |

### Layout — Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `iconSize` prop (default 14) | `Modifier.size(iconSize.dp)` | `.frame(width: iconSize, height: iconSize)` | ESCALATE — propose `iconSize.xs = 14` |
| marginRight | RN-wrapper | `-2` (negative) | `Modifier.offset(x = -2.dp)` or adjust gap | `.offset(x: -2)` | n/a (layout adjustment) |

### Visual — Background Color (by variant)

| Variant | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| primary | RN-wrapper | `${semantic.color.primary.default}33` (20% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.2f)` | `theme.colors.primary.opacity(0.2)` | `color.primary.default` + `opacity.subtle = 0.2` |
| neutral | RN-wrapper | `semantic.color.divider.default` | `LaneShadowTheme.colors.divider` | `theme.colors.divider` | `color.divider.default` |

### Visual — Border Color (by variant)

| Variant | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| primary | RN-wrapper | `${semantic.color.primary.default}4D` (30% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.3f)` | `theme.colors.primary.opacity(0.3)` | `color.primary.default` + `opacity.medium = 0.3` |
| neutral | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Visual — Text/Icon Color (by variant)

| Variant | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| primary | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| neutral | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Typography — Badge Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `12` | `12.sp` | `12` | `type.label.sm.fontSize` |
| fontWeight | RN-wrapper | `500` (medium) | `FontWeight.Medium` | `.medium` | `type.label.sm.fontWeight` |

---

## NOTES

- **Two variants:** Primary (copper accent for emphasis) and neutral (subtle for secondary info)
- **Optional icon:** Icon renders before text when provided
- **Negative margin:** Icon has -2px right margin to tighten spacing visually
- **Compact size:** Small padding (4×8) and 12px font for compact badges
- **Border radius:** 6px for rounded pill shape
- **Self-sizing:** Uses alignSelf: flex-start to size to content
- **Use cases:** Route attributes (scenic, distance, time), filters, tags
- **Opacity values:** Primary uses 20% opacity background, 30% opacity border
