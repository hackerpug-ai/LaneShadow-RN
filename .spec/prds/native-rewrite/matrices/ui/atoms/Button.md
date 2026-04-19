# Button - STYLE PROPERTIES MATRIX

**Component:** Button
**RN Source:** `react-native/components/ui/button.tsx`
**Framework Primitives:** `node_modules/react-native-paper/src/components/Typography/Text.tsx` (Paper Text), `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/button.tsx` | Public API, variants, sizes, states, visual decisions |
| Paper Text | `node_modules/react-native-paper/src/components/Typography/v2/*.tsx` | Typography metrics (labelLarge) |
| Pressable | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Press feedback, hit behavior |

---

## STYLE PROPERTIES MATRIX

### Layout — Heights (by size)

| Size | Source | Height value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| sm | RN-wrapper | `space.xl + space.md` = 36 | `Modifier.height(36.dp)` | `.frame(height: 36)` | `space.xl + space.md` (composed) |
| default | RN-wrapper | `space.2xl + space.sm` = 40 | `Modifier.height(40.dp)` | `.frame(height: 40)` | `space.2xl + space.sm` |
| lg | RN-wrapper | `space.2xl + space.md` = 44 | `Modifier.height(44.dp)` | `.frame(height: 44)` | `space.2xl + space.md` |
| xl | RN-wrapper | `space.3xl` = 48 | `Modifier.height(48.dp)` | `.frame(height: 48)` | `space.3xl` |
| 2xl | RN-wrapper | `space.4xl - space.sm` = 56 | `Modifier.height(56.dp)` | `.frame(height: 56)` | `space.4xl - space.sm` (composed) |
| icon | RN-wrapper | `space.2xl + space.sm` = 40, width=40 | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | `space.2xl + space.sm` |

### Layout — Padding Horizontal (by size)

| Size | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| sm | RN-wrapper | `space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| default | RN-wrapper | `space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| lg | RN-wrapper | `space.2xl` = 32 | `Modifier.padding(horizontal = 32.dp)` | `.padding(.horizontal, 32)` | `space.2xl` |
| xl / 2xl | RN-wrapper | `space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| icon | RN-wrapper | 0 | none | none | n/a |

### Layout — Border Radius (by size)

| Size | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| icon | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| 2xl | RN-wrapper | `radius.xl` = 24 | `RoundedCornerShape(24.dp)` | `RoundedRectangle(cornerRadius: 24)` | `radius.xl` |
| xl | RN-wrapper | `radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| sm/default/lg | RN-wrapper | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |

### Layout — Flex/Alignment

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `horizontalArrangement = Arrangement.Center` | n/a | n/a |
| iconSpacing | RN-wrapper | `space.sm` = 8 | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |

### Visual — Background Color (by variant × state)

| Variant | State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| default | default | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| default | pressed | RN-wrapper | `color.primary.pressed` | (pressed branch) | (pressed branch) | `color.primary.pressed` |
| default | disabled | RN-wrapper | `color.primary.disabled` | `alpha(0.5f)` on container | `.opacity(0.5)` | `color.primary.disabled` + `opacity.disabled` |
| secondary | default | RN-wrapper | `color.secondary.default` | `LaneShadowTheme.colors.secondary` | `theme.colors.secondary` | `color.secondary.default` |
| secondary | pressed | RN-wrapper | `color.secondary.pressed` | (pressed branch) | (pressed branch) | `color.secondary.pressed` |
| secondary | disabled | RN-wrapper | `color.secondary.disabled` | (disabled branch) | (disabled branch) | `color.secondary.disabled` |
| destructive | default | RN-wrapper | `color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| destructive | pressed | RN-wrapper | `color.danger.pressed` | (pressed branch) | (pressed branch) | `color.danger.pressed` |
| destructive | disabled | RN-wrapper | `color.danger.disabled` | (disabled branch) | (disabled branch) | `color.danger.disabled` |
| outline | default | RN-wrapper | `color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| outline | pressed | RN-wrapper | `color.muted.pressed` | `LaneShadowTheme.colors.mutedPressed` | `theme.colors.mutedPressed` | `color.muted.pressed` |
| ghost | any | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| link | any | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| glass | default | RN-wrapper | `color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| glass | pressed | RN-wrapper | `color.surfaceVariant.pressed` | (pressed branch) | (pressed branch) | `color.surfaceVariant.pressed` |
| glass | disabled | RN-wrapper | `color.surfaceVariant.disabled` | (disabled branch) | (disabled branch) | `color.surfaceVariant.disabled` |

### Visual — Text Color (by variant × state)

| Variant | State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| default / destructive / glass | any | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| secondary | any | RN-wrapper | `color.onSecondary.default` | `LaneShadowTheme.colors.onSecondary` | `theme.colors.onSecondary` | `color.onSecondary.default` |
| outline / ghost | idle | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| outline / ghost | pressed | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| link | any | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| any | disabled | RN-wrapper | `color.onSurface.disabled` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |

### Visual — Border (outline/glass variant)

| Variant | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| outline | borderWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| outline | borderColor | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| glass | borderWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | same | `borderWidth.thin` |
| glass | borderColor | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Visual — Opacity

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| loading or disabled | RN-wrapper | `opacity: 0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | `opacity.disabled` |

### Typography (Paper labelLarge)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontFamily | Paper | `sans-serif-medium` | `MaterialTheme.typography.labelMedium.fontFamily` → map to LaneShadow font | `.font(.system(size: 12, weight: .medium))` | `type.label.sm.fontWeight` |
| fontSize | Paper | 12 | `12.sp` | `12` | `type.label.sm.fontSize` |
| fontWeight | Paper | `'500'` (medium) | `FontWeight.Medium` | `.medium` | `type.label.sm.fontWeight` |
| lineHeight | Paper | 18 | `LineHeightStyle` or `lineHeight = 18.sp` | `.lineSpacing(18 - 12)` = 6 | `type.label.sm.lineHeight` |
| textDecorationLine | RN-wrapper | `'underline'` when `variant='link'` | `TextDecoration.Underline` | `.underline()` | n/a |

### State — Press Feedback

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| pressColor | Pressable | `rgba(0,0,0,0.1)` (iOS) / `rgba(0,0,0,0.2)` (Android) | `PressableInteractionSource` + `indication = ripple(...)` | `.buttonStyle(.plain)` press effect | `opacity.actionPressed` |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| accessibilityState.disabled | RN-wrapper | `disabled \|\| loading` | `Modifier.semantics { disabled() }` | `.accessibilityAddTraits(.notEnabled)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

---

## NOTES

- **Icon positioning**: Left (default) or right via `iconPosition` prop
- **Loading state**: Shows ActivityIndicator overlay, disables press
- **Link variant**: Uses underline text decoration, transparent background
- **Glass variant**: Uses surfaceVariant background with border, for glass-morphic effect
- **Border token**: `borderWidth.thin = 1` exists in tokens
- **Opacity token**: `opacity.disabled = 0.5` exists in tokens
- **Typography**: Uses `type.label.sm` (12sp / 18lh / 500w) for button text
