# FloatingSearchInput - STYLE PROPERTIES MATRIX

**Component:** FloatingSearchInput
**RN Source:** `react-native/components/ui/floating-search-input.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/floating-search-input.tsx` | Public API, layout, loading states |
| Input | `react-native/components/ui/input.tsx` | Text input field (see `matrices/ui/atoms/Input.md`) |
| Icon (Paper) | `node_modules/react-native-paper/src/components/Icon.tsx` | Search, close, loading icons |
| Pressable | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Press feedback for container and clear button |

---

## COMPOSITION

**Child atoms:**
- `Input` - Text input field for search query (see `matrices/ui/atoms/Input.md`)
- `Icon` (Paper) - Search icon (left), close icon (right), loading indicator (right)

**Composition pattern:** Horizontal row with left icon, flexible input, and absolute-positioned right actions (loading/clear).

**Layout:** Pressable container (row), input flex: 1, right actions absolute positioned.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| flex | RN-wrapper | `1` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| minWidth | RN-wrapper | `0` | `Modifier.width(0.dp)` (with flex) | `.frame(minWidth: 0)` | n/a |
| position | RN-wrapper | `'relative'` | `Modifier.wrapContentSize(unbounded = false)` | n/a | n/a |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| paddingVertical | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| borderRadius | RN-wrapper | `semantic.radius.xl` = 24 | `RoundedCornerShape(24.dp)` | `RoundedRectangle(cornerRadius: 24)` | `radius.xl` |

### Visual — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Layout — Left Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `semantic.space.xl` = 24 | `Modifier.width(24.dp)` | `.frame(width: 24)` | `space.xl` |
| height | RN-wrapper | `semantic.space.xl` = 24 | `Modifier.height(24.dp)` | `.frame(height: 24)` | `space.xl` |
| marginRight | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(end = 8.dp)` | `.padding(.trailing, 8)` | `space.sm` |
| alignItems | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | n/a | n/a |

### Visual — Left Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `semantic.space.xl` = 24 | `24.dp` | `24` | `space.xl` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| source | RN-wrapper | `'magnify'` | `Icons.Outlined.Search` | SF Symbol: `magnifyingglass` | n/a |

### Layout — Input Wrapper

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| minWidth | RN-wrapper | `0` | `Modifier.width(0.dp)` (with flex) | `.frame(minWidth: 0)` | n/a |
| pointerEvents | RN-wrapper | `'auto'` or `'none'` | `Modifier.clickable(...)` or `Modifier.pointerEnter` | `.allowsHitTesting(...)` | n/a |

### Visual — Input (Override Styles)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| borderWidth | RN-wrapper | `0` | `0.dp` | `0` | n/a |
| paddingHorizontal | RN-wrapper | `0` | `0.dp` | `0` | n/a |
| paddingRight | RN-wrapper | `semantic.space.4xl` = 64 (loading) or `semantic.space.2xl` = 32 (default) | `32.dp` or `64.dp` | `32` or `64` | `space.2xl` or `space.4xl` |

### Layout — Right Actions (Absolute)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | n/a (use Box with offset) | `.position(...)` | n/a |
| top | RN-wrapper | `0` | `Modifier.offset(y = 0.dp)` | `.offset(y: 0)` | n/a |
| bottom | RN-wrapper | `0` | `Modifier.height(IntrinsicSize.Max)` | n/a | n/a |
| right | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.offset(x = (-8).dp)` | `.offset(x: -8)` | `space.sm` |
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

### Visual — Loading Indicator

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `semantic.space.md` = 12 | `12.dp` | `12` | `space.md` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Layout — Clear Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | n/a (use Box with offset) | `.position(...)` | n/a |
| top | RN-wrapper | `0` | `Modifier.offset(y = 0.dp)` | `.offset(y: 0)` | n/a |
| bottom | RN-wrapper | `0` | `Modifier.height(IntrinsicSize.Max)` | n/a | n/a |
| right | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.offset(x = (-8).dp)` | `.offset(x: -8)` | `space.sm` |
| paddingHorizontal | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(horizontal = 4.dp)` | `.padding(.horizontal, 4)` | `space.xs` |
| paddingVertical | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| opacity (pressed) | RN-wrapper | `0.8` | `Modifier.alpha(0.8f)` | `.opacity(0.8)` | `opacity.pressed = 0.8` |

### Visual — Clear Button Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `18` | `18.dp` | `18` | ESCALATE — propose `iconSize.clearButton = 18` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| source | RN-wrapper | `'close'` | `Icons.Outlined.Close` | SF Symbol: `xmark` | n/a |

### Interaction

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| onPress (container) | RN-wrapper | optional callback | `Modifier.clickable { onPress() }` | `.onTapGesture { onPress() }` | n/a |
| onPress (clear) | RN-wrapper | callback prop | `Modifier.clickable { onClear() }` | `.onTapGesture { onClear() }` | n/a |
| accessibilityRole (container) | RN-wrapper | `'button'` when onPress provided | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| accessibilityLabel (clear) | RN-wrapper | `'Clear search'` | `Modifier.semantics { contentDescription = "Clear search" }` | `.accessibilityLabel("Clear search")` | n/a |
| hitSlop | RN-wrapper | `semantic.space.xs` = 4 on all sides | `Modifier.padding(4.dp).clickable(...)` | `.contentShape(Rectangle()).padding(4)` | `space.xs` |

---

## NOTES

- **Loading state:** Shows ActivityIndicator in right position, disables clear button
- **Clear button:** Only visible when has text and not loading, absolute positioned
- **Cancel loading:** Optional cancel button appears next to loading indicator
- **Pressable mode:** Container can be pressable (for navigation to search screen) with disabled input
- **Input overrides:** Background transparent, no border, no horizontal padding, paddingRight reserves space for right actions
- **Icon sizes:** Search icon 24px, close icon 18px, loading indicator 12px
- **Right padding:** Input paddingRight = 64px when loading, 32px when not
- **Hit slop:** 4px on all sides for clear button touch target expansion
- **Border radius:** 24px (xl) for pill shape
- **Background:** surfaceVariant color with border
