# Badge - STYLE PROPERTIES MATRIX

**Component:** Badge
**RN Source:** `react-native/components/ui/badge.tsx`
**Framework Primitives:** `node_modules/react-native-paper/src/components/Typography/Text.tsx` (Paper Text)

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/badge.tsx` | Public API, variants, opacity support |
| Paper Text | `node_modules/react-native-paper/src/components/Typography/v2/*.tsx` | Typography metrics (labelSmall) |

---

## STYLE PROPERTIES MATRIX

### Layout — Dimensions

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper | 10 | `Modifier.padding(horizontal = 10.dp)` | `.padding(.horizontal, 10)` | n/a (10px = between sm(8) and md(12)) |
| paddingVertical | RN-wrapper | 2 | `Modifier.padding(vertical = 2.dp)` | `.padding(.vertical, 2)` | n/a (2px = half of xs(4)) |
| borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |

### Visual — Background Color (by variant)

| Variant | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| default | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| secondary | RN-wrapper | `color.secondary.default` | `LaneShadowTheme.colors.secondary` | `theme.colors.secondary` | `color.secondary.default` |
| destructive | RN-wrapper | `color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| success | RN-wrapper | `color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| warning | RN-wrapper | `color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| info | RN-wrapper | `color.info.default` | `LaneShadowTheme.colors.info` | `theme.colors.info` | `color.info.default` |
| outline | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |

### Visual — Text Color (by variant)

| Variant | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| default/destructive/success/warning/info | RN-wrapper | `color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| secondary | RN-wrapper | `color.onSecondary.default` | `LaneShadowTheme.colors.onSecondary` | `theme.colors.onSecondary` | `color.onSecondary.default` |
| outline | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Visual — Border (outline variant)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| borderWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(cornerRadius:9999).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| borderColor | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Typography (Paper labelSmall)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | 12 | `12.sp` | `12` | `type.label.sm.fontSize` |
| fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` | `.semibold` | `fontWeight.semibold` |
| lineHeight | Paper labelSmall | 18 | `18.sp` | `.lineSpacing(6)` | `type.label.sm.lineHeight` |
| color | (by variant) | (see above) | (see above) | (see above) | (by variant) |

### Layout — Flex/Alignment

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.align(Alignment.Start)` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |
| iconSpacing | RN-wrapper | `space.xs` = 4 | `Spacer(Modifier.width(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |

### Visual — Opacity

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| opacity | RN-wrapper | prop `opacity` default=1 | `Modifier.alpha(opacity)` | `.opacity(opacity)` | n/a (prop-controlled) |

---

## NOTES

- **Opacity support**: Badge supports dynamic opacity via prop for semi-transparent backgrounds
- **Pill shape**: Always uses `radius.full` for pill/rounded appearance
- **Icon integration**: Supports optional icon with natural spacing via `space.xs`
- **Typography**: Uses `type.label.sm` (12sp / 18lh / 600w) for compact text
- **Padding values**: 10px horizontal, 2px vertical (custom values between tokens)
