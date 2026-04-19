# Textarea - STYLE PROPERTIES MATRIX

**Component:** Textarea
**RN Source:** `react-native/components/ui/textarea.tsx`
**Framework Primitives:** `TextInput`, `View`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/textarea.tsx` | Public API, focus states, error handling |
| TextInput | `react-native/Libraries/Components/TextInput/TextInput.js` | Multi-line text input behavior |

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a (layout) |
| minHeight | RN-wrapper | `80` | `Modifier.heightIn(min = 80.dp)` | `.frame(minHeight: 80)` | n/a (component-specific) |
| borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| borderWidth | RN-wrapper | `1` (default), `2` (focused) | `Modifier.border(1.dp, ...)` or `2.dp` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` / `borderWidth.thick` |

### Layout — Internal Padding

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| paddingVertical | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |

### Visual — Background Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.input.default` | `LaneShadowTheme.colors.inputBackground` | `theme.colors.inputBackground` | `color.input.default` |
| disabled | RN-wrapper | `opacity: 0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | `opacity.disabled` |

### Visual — Border Color (by state)

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| focused | RN-wrapper | `semantic.color.ring.default` | `LaneShadowTheme.colors.ring` | `theme.colors.ring` | `color.ring.default` |
| error | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |

### Visual — Text Color (by state)

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| placeholder | RN-wrapper | `semantic.color.onSurface.subtle` | `MaterialTheme.colors.onSurface.copy(alpha = 0.6f)` | `Color(UIColor.placeholderText)` | `color.onSurface.subtle` |

### Typography — Input Text

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontFamily | RN-wrapper | `system default` | `MaterialTheme.typography.bodySmall.fontFamily` | `.font(.system)` | `type.body.sm.fontFamily` |
| fontSize | RN-wrapper | `14` | `14.sp` | `14` | `type.body.sm.fontSize` |
| fontWeight | RN-wrapper | `'400'` (normal) | `FontWeight.Normal` | `.regular` | `type.body.sm.fontWeight` |
| lineHeight | RN-wrapper | `21` (implicit) | `LineHeightStyle` or `lineHeight = 21.sp` | `.lineSpacing(21 - 14)` = 7 | `type.body.sm.lineHeight` |

### State — Focus Ring

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| focused | RN-wrapper | `borderWidth: 2, borderColor: ring` | `Modifier.border(2.dp, Ring)` | `.overlay(border: 2, ring)` | `borderWidth.thick + color.ring.default` |
| error | RN-wrapper | `borderWidth: 1, borderColor: danger` | `Modifier.border(1.dp, Danger)` | `.overlay(border: 1, danger)` | `borderWidth.thin + color.danger.default` |

### Layout — Text Alignment

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| textAlignVertical | RN-wrapper | `'top'` | `Modifier.padding(top = ...)` (top-aligned via padding) | `.multilineTextAlignment(.leading)` + `frame` | n/a (behavior) |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| multiline | RN-wrapper | `true` (fixed) | `TextField(value = ..., maxLines = Int.MAX_VALUE)` | `TextEditor(...)` | n/a (fixed) |
| accessibilityRole | RN-wrapper | `none` | `Modifier.semantics { role = Role.None }` | n/a | n/a |
| accessibilityState | RN-wrapper | `disabled` state | `Modifier.semantics { disabled() }` | `.accessibilityAddTraits(.notEnabled)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

---

## NOTES

- **Multi-line**: Fixed to multiline mode for longer text input
- **Min height**: 80px minimum height, can grow with content
- **Focus ring**: Border width increases from 1 to 2px when focused
- **Error state**: Red border replaces ring color
- **Text alignment**: Top-aligned within container
- **Keyboard handling**: Use BottomSheetInput for Gorhom bottom sheets
- **Placeholder**: Uses onSurface.subtle color
- **Border radius**: Uses radius.md (8px) for standard rounded corners
