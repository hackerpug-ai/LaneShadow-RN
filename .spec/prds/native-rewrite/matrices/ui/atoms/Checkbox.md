# Checkbox - STYLE PROPERTIES MATRIX

**Component:** Checkbox
**RN Source:** `react-native/components/ui/checkbox.tsx`
**Framework Primitives:** `Pressable`, `View`, `Text`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/checkbox.tsx` | Public API, checkmark rendering, visual decisions |
| Pressable | `react-native/Libraries/Components/Pressable/Pressable.js` | Press feedback, hit behavior |
| Text | `react-native-paper/src/components/Typography/Text.tsx` | Checkmark symbol rendering |

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `16` | `Modifier.width(16.dp)` | `.frame(width: 16)` | n/a (component-specific) |
| height | RN-wrapper | `16` | `Modifier.height(16.dp)` | `.frame(height: 16)` | n/a (component-specific) |
| borderRadius | RN-wrapper | `semantic.radius.sm` = 4 | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |

### Visual — Background Color (by state)

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| unchecked | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| checked | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| checked + pressed | RN-wrapper | `semantic.color.primary.pressed` | `LaneShadowTheme.colors.primaryPressed` | `theme.colors.primaryPressed` | `color.primary.pressed` |
| indeterminate | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| disabled | RN-wrapper | `opacity: 0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | `opacity.disabled` |

### Visual — Border Color (by state)

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| any | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Visual — Checkmark Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| checked | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

### Visual — Indeterminate Bar Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| indeterminate | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

### Typography — Checkmark Symbol

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontFamily | RN-wrapper | `system default` | `MaterialTheme.typography.bodyMedium.fontFamily` | `.font(.system)` | n/a (system default) |
| fontSize | RN-wrapper | `12` | `12.sp` | `12` | n/a (component-specific) |
| fontWeight | RN-wrapper | `'700'` (bold) | `FontWeight.Bold` | `.bold` | `fontWeight.bold` |
| lineHeight | RN-wrapper | `14` | `14.sp` | `14` | n/a (component-specific) |

### Layout — Indeterminate Bar

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `8` | `8.dp` | `8` | n/a (component-specific) |
| height | RN-wrapper | `2` | `2.dp` | `2` | n/a (component-specific) |
| borderRadius | RN-wrapper | `1` | `RoundedCornerShape(1.dp)` | `RoundedRectangle(cornerRadius: 1)` | n/a (component-specific) |

### Layout — Flex/Alignment

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `horizontalArrangement = Arrangement.Center` | n/a | n/a |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'checkbox'` | `Modifier.semantics { role = Role.Checkbox }` | `.accessibilityAddTraits(.isButton)` | n/a |
| accessibilityState.checked | RN-wrapper | `checked` prop (or 'mixed' for indeterminate) | `Modifier.semantics { checked = ... }` | `.accessibilityValue(checked ? "1" : "0")` | n/a |
| accessibilityState.disabled | RN-wrapper | `disabled` prop | `Modifier.semantics { disabled() }` | `.accessibilityAddTraits(.notEnabled)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### Hit Slop

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| minimum | RN-wrapper | `44` (implicit via Pressable) | `Modifier.sizeIn(minWidth = 44.dp, minHeight = 44.dp)` | `.contentShape(.rect)` + `44pt` min | `touchTarget.min` |

---

## NOTES

- **Checkmark**: Rendered as text character "✓" with bold weight
- **Indeterminate**: Shows horizontal bar (8×2px) instead of checkmark
- **Border**: Always shows primary color border regardless of checked state
- **Disabled**: Reduces opacity to 50% but maintains layout
- **Accessibility**: Properly labeled as checkbox with checked/mixed/unchecked states
- **Pressed state**: Darkens background color when checked and pressed
