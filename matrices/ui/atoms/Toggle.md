# Toggle - STYLE PROPERTIES MATRIX

**Component:** Toggle
**RN Source:** `react-native/components/ui/toggle.tsx`
**Framework Primitives:** `Pressable`, `Text`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/toggle.tsx` | Public API, variants, sizes, states, visual decisions |
| Pressable | `react-native/Libraries/Components/Pressable/Pressable.js` | Press feedback, hit behavior |
| Paper Text | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography metrics (labelMedium) |

---

## STYLE PROPERTIES MATRIX

### Layout — Heights (by size)

| Size | Source | Height value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| sm | RN-wrapper | `36` | `Modifier.height(36.dp)` | `.frame(height: 36)` | n/a (component-specific) |
| default | RN-wrapper | `40` | `Modifier.height(40.dp)` | `.frame(height: 40)` | n/a (component-specific) |
| lg | RN-wrapper | `44` | `Modifier.height(44.dp)` | `.frame(height: 44)` | n/a (component-specific) |

### Layout — Padding

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |

### Layout — Border Radius

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |

### Layout — Flex/Alignment

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `horizontalArrangement = Arrangement.Center` | n/a | n/a |
| iconSpacing | RN-wrapper | `semantic.space.sm` = 8 | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |

### Visual — Background Color (by variant × state)

| Variant | State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| default | pressed (off) | RN-wrapper | `semantic.color.muted.pressed` | `LaneShadowTheme.colors.mutedPressed` | `theme.colors.mutedPressed` | `color.muted.pressed` |
| default | pressed (on) | RN-wrapper | `semantic.color.accent.default` | `LaneShadowTheme.colors.accent` | `theme.colors.accent` | `color.accent.default` |
| default | idle (off) | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| outline | pressed (off) | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| outline | pressed (on) | RN-wrapper | `semantic.color.accent.default` | `LaneShadowTheme.colors.accent` | `theme.colors.accent` | `color.accent.default` |
| outline | idle (off) | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| any | disabled | RN-wrapper | `opacity: 0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | `opacity.disabled` |

### Visual — Border (outline variant)

| Variant | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| outline | borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| outline | borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Visual — Text Color (by state)

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| pressed (on) | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| pressed (off) | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| idle (off) | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colors.onSurface.copy(alpha = 0.7f)` | `Color(UIColor.tertiaryLabel)` | `color.onSurface.muted` |
| disabled | RN-wrapper | `semantic.color.onSurface.disabled` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |

### Typography (Paper labelMedium)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontFamily | Paper | `sans-serif-medium` | `MaterialTheme.typography.labelMedium.fontFamily` → map to LaneShadow font | `.font(.system(size: 14, weight: .medium))` | `type.label.md.fontWeight` |
| fontSize | Paper | `14` | `14.sp` | `14` | `type.label.md.fontSize` |
| fontWeight | Paper | `'500'` (medium) | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` |
| lineHeight | Paper | `20` | `LineHeightStyle` or `lineHeight = 20.sp` | `.lineSpacing(20 - 14)` = 6 | `type.label.md.lineHeight` |

### State — Press Feedback

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| pressColor | Pressable | `semantic.color.muted.pressed` (when off) | `PressableInteractionSource` + `indication = ripple(...)` | `.buttonStyle(.plain)` press effect | `opacity.actionPressed` |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| accessibilityState.selected | RN-wrapper | `pressed` prop | `Modifier.semantics { selected = pressed }` | `.accessibilityValue(pressed ? "1" : "0")` | n/a |
| accessibilityState.disabled | RN-wrapper | `disabled` prop | `Modifier.semantics { disabled() }` | `.accessibilityAddTraits(.notEnabled)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

---

## NOTES

- **Icon positioning**: Left side with 8px spacing from text
- **Variants**: `default` (filled) and `outline` (bordered)
- **Active state**: Uses accent color (#88C7A6 - teal) when pressed/on
- **Disabled state**: Reduces opacity to 50%
- **Border**: Only outline variant has visible border
- **Typography**: Uses label.md scale (14sp / 20lh / 500w)
