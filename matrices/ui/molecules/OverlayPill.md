# OverlayPill - STYLE PROPERTIES MATRIX

**Component:** OverlayPill
**RN Source:** `react-native/components/ui/overlay-pill.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/overlay-pill.tsx` | Public API, toggle state styling |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Weather overlay icons (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Label typography |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Weather overlay icon (wind, rain, temperature) (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Horizontal row with icon + label. Active state changes background color and border opacity.

**Layout:** Horizontal row (`flexDirection: 'row'`), center alignment, pill shape with full border radius.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `6` | `Modifier.padding(end = 6.dp)` between children | `Spacer(minLength: 6)` | ESCALATE — propose `space.xs + 2` |
| paddingVertical | RN-wrapper | `6` | `Modifier.padding(vertical = 6.dp)` | `.padding(.vertical, 6)` | ESCALATE — propose `space.xs + 2` |
| paddingHorizontal | RN-wrapper | `12` | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| borderRadius | RN-wrapper | `20` | `RoundedCornerShape(20.dp)` | `RoundedRectangle(cornerRadius: 20)` | ESCALATE — propose `radius.pill = 20` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |

### Visual — Background (by state)

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| active | RN-wrapper | `${color.primary.default}33` (20% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.2f)` | `theme.colors.primary.opacity(0.2)` | `color.primary.default` + `opacity.border = 0.2` |
| inactive | RN-wrapper | `color.divider.default` | `LaneShadowTheme.colors.divider` | `theme.colors.divider` | `color.divider.default` |

### Visual — Border (by state)

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| active | RN-wrapper | `${color.primary.default}4D` (30% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.3f)` | `theme.colors.primary.opacity(0.3)` | `color.primary.default` + `opacity.pressed = 0.3` |
| inactive | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |

### Visual — Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `16` (default) | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | `iconSize.sm` |
| color (active) | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| color (inactive) | RN-wrapper | `color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Typography — Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `13` | `13.sp` | `13` | ESCALATE — propose `type.label.xs.fontSize = 13` |
| fontWeight | RN-wrapper | `'500'` (medium) | `FontWeight.Medium` | `.medium` | ESCALATE — propose `type.label.xs.fontWeight = 500` |
| color (active) | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| color (inactive) | RN-wrapper | `color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Interaction

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| onPress | RN-wrapper | callback prop | `Modifier.clickable { onPress() }` | `.onTapGesture { onPress() }` | n/a |
| accessibilityRole | RN-wrapper | none (not a button) | n/a | n/a | n/a |

---

## NOTES

- **Toggle state:** Active state uses 20% opacity primary background with 30% opacity primary border
- **Inactive state:** Uses divider color for background, transparent border
- **Icon sizing:** Default 16px, customizable via `iconSize` prop
- **Label typography:** 13sp medium weight (between label.sm and label.md)
- **Pill shape:** 20px border radius for full pill appearance
- **Gap:** 6px between icon and label
- **Padding:** 6px vertical, 12px horizontal
- **Border:** 1px border width, only visible when active
