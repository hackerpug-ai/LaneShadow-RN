# ErrorToast - STYLE PROPERTIES MATRIX

**Component:** ErrorToast
**RN Source:** `react-native/components/toasts/error-toast.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/toasts/error-toast.tsx` | Public API, toast layout, dismiss functionality |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Error icons (close-circle) (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Title and description typography |
| SafeAreaInsets | `node_modules/react-native-safe-area-context/` | Top inset for notch/status bar spacing |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Error icon (left), close button icon (right) (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Vertical toast card with danger color background. Header row has error icon + title (left, flex: 1) and close button (right, optional). Description text below header. Toast positioned at top with safe area inset. Uses shadow for elevation.

**Layout:** Vertical column with header row (horizontal) and description text below. Header has space-between alignment.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.danger.default` | `MaterialTheme.colorScheme.error` | `Color(.red)` | `color.danger.default` |
| borderRadius | RN-wrapper | `semantic.radius.lg` = 12 | `Modifier.clip(RoundedCornerShape(12.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 12))` | `radius.lg` |
| marginTop | RN-wrapper | `insets.top + semantic.space.sm` | `Modifier.padding(top = insets.top + 8.dp)` | `.padding(.top, insets.top + 8)` | `space.sm` + safe area |
| marginHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| gap | RN-wrapper | `semantic.space.xs` = 4 | `Arrangement.spacedBy(4.dp)` inside Column | `.spacing(4)` | `space.xs` |

### Layout — Header

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `.spacing(8)` | `space.sm` |

### Layout — Icon Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `.spacing(8)` | `space.sm` |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |

### Visual — Shadow

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| shadowColor | RN-wrapper | `'#000000'` | `Color.Black` | `Color.black` | n/a |
| shadowOffset | RN-wrapper | `{ width: 0, height: 4 }` | `offset = IntOffset(0, 4)` | `.shadow(color: .black, radius: 8, x: 0, y: 4)` | n/a |
| shadowOpacity | RN-wrapper | `0.15` | `ambientShadowAlpha = 0.15f` | `.opacity(0.15)` | ESCALATE — use `opacity.shadow = 0.15` |
| shadowRadius | RN-wrapper | `8` | `shadowRadius = 8.dp` | `.radius = 8` | ESCALATE — use `shadowRadius.lg = 8` |
| elevation | RN-wrapper | `4` | `Modifier.graphicsLayer { shadowElevation = 4f }` | n/a | `elevation[4]` |

### Typography — Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'titleSmall'` | `MaterialTheme.typography.titleSmall` | `.font(.system(size: 14, weight: .semibold))` | ESCALATE — map to `type.label.lg` |
| color | RN-wrapper | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onError` | `Color.white` (or contrast on red) | `color.onPrimary.default` |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |

### Typography — Description

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'bodySmall'` | `MaterialTheme.typography.bodySmall` | `.font(.system(size: 12))` | `type.body.sm` |
| color | RN-wrapper | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onError` | `Color.white` (or contrast on red) | `color.onPrimary.default` |

### Icon — Error Icons

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| name (both) | RN-wrapper | `'close-circle'` | `Icons.Outlined.Error` or `Icons.Outlined.Cancel` | SF Symbol: `xmark.circle` | n/a |
| size (both) | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | `iconSize.md` |
| color (both) | RN-wrapper | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onError` | `Color.white` (or contrast on red) | `color.onPrimary.default` |

### Close Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| onPress | RN-wrapper | `Notifier.hideNotification()` | `onDismissRequest = { ... }` | `.onTapGesture { ... }` | n/a |
| hitSlop | RN-wrapper | `{ top: 8, bottom: 8, left: 8, right: 8 }` | `Modifier.padding(8.dp).clickable(...)` (hitSlop in Compose) | `.padding(8)` | `space.sm` |
| condition | RN-wrapper | `showCloseButton = true` (default) | `if (showCloseButton) { ... }` | `if showCloseButton { ... }` | n/a |

---

## NOTES

- **Danger color scheme:** Uses danger color (red) for background, onPrimary for text/icons
- **Two icons:** close-circle for error indicator (left) and close button (right)
- **Header layout:** Error icon + title (flex: 1) on left, close button on right
- **Description:** Below header, bodySmall typography
- **Spacing:** 4px gap between header and description, 8px gap between header elements
- **Padding:** 12px padding inside toast
- **Margins:** 12px horizontal, top margin = safe area inset + 8px
- **Shadow:** Black shadow at 15% opacity, 8px radius, 4px offset (elevation 4)
- **Close button:** Optional (showCloseButton prop, default true), 8px hitSlop for easier tapping
- **Notifier:** Uses react-native-notifier library for hideNotification()
- **Typography:** titleSmall for title, bodySmall for description
- **Icon size:** 20px for both icons
- **Text colors:** onPrimary (white/contrast) for readability on red background
- **Border radius:** 12px for modern card appearance
- **Position:** Toast appears at top of screen with safe area inset
