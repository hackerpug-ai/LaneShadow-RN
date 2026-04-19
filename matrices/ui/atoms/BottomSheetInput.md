# BottomSheetInput - STYLE PROPERTIES MATRIX

**Component:** BottomSheetInput
**RN Source:** `react-native/components/ui/bottom-sheet-input.tsx`
**Framework Primitives:** `BottomSheetTextInput` (Gorhom), `View`, `Text`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/bottom-sheet-input.tsx` | Public API, Gorhom keyboard integration |
| BottomSheetTextInput | `@gorhom/bottom-sheet` | Text input with proper keyboard handling in bottom sheets |
| View | `react-native/Libraries/Components/View/View.js` | Container rendering |
| Paper Text | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Label rendering |

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| height | RN-wrapper | `48` | `Modifier.height(48.dp)` | `.frame(height: 48)` | `size.inputHeight` |
| borderRadius | RN-wrapper | `semantic.radius.xl` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.xl` |
| borderWidth | RN-wrapper | `1` (when focused/error) | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |

### Layout — Internal Spacing

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingHorizontal (icon containers) | RN-wrapper | `16` (left), `16` (right) | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingVertical (text input) | RN-wrapper | `12` | `Modifier.padding(vertical = 12.dp)` | `.padding(.vertical, 12)` | `space.md` |
| paddingHorizontal (text input) | RN-wrapper | `8` | `Modifier.padding(horizontal = 8.dp)` | `.padding(.horizontal, 8)` | `space.sm` |
| icon spacing | RN-wrapper | `8` (between icon and text) | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |

### Layout — Label

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | Paper | `12` | `12.sp` | `12` | `type.label.sm.fontSize` |
| fontWeight | Paper | `500` | `FontWeight.Medium` | `.medium` | `type.label.sm.fontWeight` |
| textTransform | RN-wrapper | `uppercase` | `textTransform = androidx.compose.ui.text.style.TextAlign` | `.textCase(.uppercase)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `MaterialTheme.colors.onSurface.copy(alpha = 0.6f)` | `Color(UIColor.secondaryLabel)` | `color.onSurface.subtle` |
| paddingLeft | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` |
| bottom margin | RN-wrapper | `4` (gap) | `Arrangement.spacedBy(4.dp)` | `.spacing(4)` | `space.xs` |

### Visual — Container Background

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| disabled | RN-wrapper | `opacity: 0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | `opacity.disabled` |

### Visual — Border Color (by state)

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `transparent` | `Color.Transparent` | `.clear` | n/a |
| focused | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| error | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |

### Visual — Text Color (by state)

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| placeholder | RN-wrapper | `semantic.color.onSurface.subtle` | `MaterialTheme.colors.onSurface.copy(alpha = 0.6f)` | `Color(UIColor.placeholderText)` | `color.onSurface.subtle` |

### Visual — Icon Color (by state)

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colors.onSurface.copy(alpha = 0.7f)` | `Color(UIColor.tertiaryLabel)` | `color.onSurface.muted` |
| focused | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| error | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| disabled | RN-wrapper | `semantic.color.onSurface.disabled` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |

### Typography — Input Text

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontFamily | RN-wrapper | `system default` | `MaterialTheme.typography.bodyMedium.fontFamily` | `.font(.system)` | `type.body.md.fontFamily` |
| fontSize | RN-wrapper | `16` | `16.sp` | `16` | `type.body.md.fontSize` |
| fontWeight | RN-wrapper | `'400'` (normal) | `FontWeight.Normal` | `.regular` | `type.body.md.fontWeight` |
| lineHeight | RN-wrapper | `24` (implicit) | `LineHeightStyle` or `lineHeight = 24.sp` | `.lineSpacing(24 - 16)` = 8 | `type.body.md.lineHeight` |

### Layout — Icon Containers

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| leftIcon padding | RN-wrapper | `pl-16, pr-8` | `Modifier.padding(start = 16.dp, end = 8.dp)` | `.padding(.leading, 16).padding(.trailing, 8)` | `space.lg / space.sm` |
| rightIcon padding | RN-wrapper | `pl-8, pr-16` | `Modifier.padding(start = 8.dp, end = 16.dp)` | `.padding(.leading, 8).padding(.trailing, 16)` | `space.sm / space.lg` |
| icon size | RN-wrapper | `20` | `20.dp` | `20` | `iconSize.md` |

### Layout — Flex/Alignment

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| flex | RN-wrapper | `1` (text input) | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a (layout) |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `none` | `Modifier.semantics { role = Role.None }` | n/a | n/a |
| accessibilityState | RN-wrapper | `disabled` state | `Modifier.semantics { disabled() }` | `.accessibilityAddTraits(.notEnabled)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### Gorhom Integration

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| TextInput type | RN-wrapper | `BottomSheetTextInput` | `TextField` (native keyboard handling) | `TextField` (native keyboard handling) | n/a (Gorhom-specific) |
| hasTextInput | BottomSheetWrapper | `true` (parent prop) | `keyboardBehavior = "interactive"` | `keyboardBehavior = .interactive` | n/a (Gorhem API) |

---

## NOTES

- **CRITICAL**: Must use BottomSheetInput instead of Input for Gorhom bottom sheets
- **Keyboard handling**: BottomSheetTextInput integrates with Gorhom's keyboard behavior
- **Layout**: Identical to Input component (48px height, 16px border radius)
- **Icons**: Left and right icon support with proper spacing
- **Label**: Optional uppercase label rendered above input
- **Focus ring**: Applied to container, not individual border color changes
- **Parent integration**: Requires `hasTextInput={true}` on BottomSheetWrapper
- **Issue**: Reference gorhom/bottom-sheet#1891 for rationale
