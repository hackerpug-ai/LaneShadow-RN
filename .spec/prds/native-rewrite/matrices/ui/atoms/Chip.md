# Chip - STYLE PROPERTIES MATRIX

**Component:** Chip
**RN Source:** `react-native/components/ui/chip.tsx`
**Framework Primitives:** `node_modules/react-native-paper/src/components/Typography/Text.tsx` (Paper Text), `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/chip.tsx` | Public API, selected state, press feedback |
| Paper Text | `node_modules/react-native-paper/src/components/Typography/v2/*.tsx` | Typography metrics (labelSmall) |
| Pressable | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Press feedback, hit behavior |

---

## STYLE PROPERTIES MATRIX

### Layout — Dimensions

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper | `space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| paddingVertical | RN-wrapper | 6 | `Modifier.padding(vertical = 6.dp)` | `.padding(.vertical, 6)` | n/a (6px = half of md(12)) |
| borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |

### Visual — Background Color (by state)

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| selected | RN-wrapper | `${color.primary.default}20` (12% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.12f)` | `theme.colors.primary.opacity(0.12)` | `color.primary.default` + composed opacity |
| selected + pressed | RN-wrapper | (same as selected) | (same) | (same) | (same) |
| unselected + pressed | RN-wrapper | `color.muted.pressed` | `LaneShadowTheme.colors.mutedPressed` | `theme.colors.mutedPressed` | `color.muted.pressed` |
| unselected | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |

### Visual — Border Color (by state)

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| selected | RN-wrapper | `${color.primary.default}60` (40% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.4f)` | `theme.colors.primary.opacity(0.4)` | `color.primary.default` + composed opacity |
| unselected | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Visual — Border Width

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| borderWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | `.overlay(Circle().stroke(..., lineWidth: 1))` | `borderWidth.thin` |

### Typography

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | 13 | `13.sp` | `13` | n/a (between label.sm 12 and body.sm 14) |
| fontWeight | Paper | `'500'` (medium) | `FontWeight.Medium` | `.medium` | `type.label.sm.fontWeight` |
| lineHeight | Paper labelSmall | 18 | `18.sp` | `.lineSpacing(5)` | `type.label.sm.lineHeight` |
| color (selected) | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| color (unselected) | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Icon

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | 16 | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | `iconSize.md` |
| color (selected) | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| color (unselected) | RN-wrapper | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| spacing | RN-wrapper | `gap: 4` | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs` |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| onPress | RN-wrapper | Pressable wrapper | `Modifier.clickable(onClick = onPress)` | `.onTapGesture { onPress() }` | n/a |
| accessibilityRole | RN-wrapper | (not set, implied by Pressable) | `Modifier.semantics { role = Role.Checkbox }` | `.accessibilityAddTraits(.isButton)` | n/a |
| accessibilityState.selected | RN-wrapper | `selected` prop | `Modifier.semantics { selected = selected }` | `.accessibilityAddTraits(selected ? .isSelected : [])` | n/a |

---

## NOTES

- **Selection feedback**: Selected state uses primary color at 40% opacity border, 12% background
- **Press feedback**: Unselected chips show muted background on press
- **Icon sizing**: Fixed 16px icon size
- **Typography**: Uses `type.label.sm` with custom 13sp font size
- **Opacity values**: Composed hex values (20 = 12%, 60 = 40%) for transparency effects
