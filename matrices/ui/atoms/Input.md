# Input - STYLE PROPERTIES MATRIX

**Component:** Input
**RN Source:** `react-native/components/ui/input.tsx`
**Framework Primitives:** `TextInput`, `Pressable`, `IconSymbol`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/input.tsx` | Public API, focus states, icons, labels, visual decisions |
| TextInput | `react-native/Libraries/Components/TextInput/TextInput.js` | Text input behavior, keyboard handling |
| Pressable | `react-native/Libraries/Components/Pressable/Pressable.js` | Press feedback, hit behavior |

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| height | RN-wrapper | `48` | `Modifier.height(48.dp)` | `.frame(height: 48)` | `size.inputHeight` |
| borderRadius | RN-wrapper | `semantic.radius.xl` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.xl` |
| borderWidth | RN-wrapper | `1` (when focused/error) | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| paddingHorizontal | RN-wrapper | `16` (icon containers) | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingVertical | RN-wrapper | `12` (text input) | `Modifier.padding(vertical = 12.dp)` | `.padding(.vertical, 12)` | `space.md` |

### Layout — Label

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | Paper | `12` | `12.sp` | `12` | `type.label.sm.fontSize` |
| fontWeight | Paper | `500` | `FontWeight.Medium` | `.medium` | `type.label.sm.fontWeight` |
| textTransform | RN-wrapper | `uppercase` | `textTransform = androidx.compose.ui.text.style.TextAlign` | `.textCase(.uppercase)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `MaterialTheme.colors.onSurface.copy(alpha = 0.6f)` | `Color(UIColor.secondaryLabel)` | `color.onSurface.subtle` |
| paddingLeft | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` |

### Visual — Background Color (by state)

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| disabled | RN-wrapper | `opacity: 0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | `opacity.disabled` |
| error | RN-wrapper | `semantic.color.surface.default` + border | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |

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
| disabled | RN-wrapper | `semantic.color.onSurface.disabled` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |

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
| fontWeight | RN-wrapper | `400` (normal) | `FontWeight.Normal` | `.regular` | `type.body.md.fontWeight` |
| lineHeight | RN-wrapper | `24` (implicit) | `LineHeightStyle` or `lineHeight = 24.sp` | `.lineSpacing(24 - 16)` = 8 | `type.body.md.lineHeight` |

### State — Focus Ring

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| focused | RN-wrapper | `borderWidth: 1, borderColor: primary` | `Modifier.border(1.dp, Primary)` | `.overlay(border: 1, primary)` | `borderWidth.thin + color.primary.default` |
| error | RN-wrapper | `borderWidth: 1, borderColor: danger` | `Modifier.border(1.dp, Danger)` | `.overlay(border: 1, danger)` | `borderWidth.thin + color.danger.default` |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `none` | `Modifier.semantics { role = Role.None }` | n/a | n/a |
| accessibilityState | RN-wrapper | `disabled` state | `Modifier.semantics { disabled() }` | `.accessibilityAddTraits(.notEnabled)` | n/a |
| accessibilityLabel | RN-wrapper | passed via prop | `Modifier.semantics { this.contentDescription = label }` | `.accessibilityLabel(label)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### Icons

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| leftIcon size | RN-wrapper | `20` | `20.dp` | `20` | `iconSize.md` |
| rightIcon size | RN-wrapper | `20` | `20.dp` | `20` | `iconSize.md` |
| icon spacing | RN-wrapper | `space.sm` = 8 | `8.dp` | `8` | `space.sm` |

---

## NOTES

- **Keyboard handling**: Use `BottomSheetInput` instead of `Input` for Gorhom bottom sheets
- **Focus ring**: Applied to container, not individual border color changes
- **Icon colors**: Muted when idle, primary on focus, red on error
- **Label**: Optional uppercase label rendered above input with subtle color
- **Placeholder**: Uses onSurface.subtle color
- **Border radius**: Uses radius.xl (16px) for modern pill-shaped input
