# Collapsible - STYLE PROPERTIES MATRIX

**Component:** Collapsible
**RN Source:** `react-native/components/ui/collapsible.tsx`
**Framework Primitives:** `TouchableOpacity`, `ThemedView`, `ThemedText`, `IconSymbol`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/collapsible.tsx` | Public API, open/close state, rotation animation |
| TouchableOpacity | `react-native/Libraries/Components/Touchable/TouchableOpacity.js` | Press feedback |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Chevron icon |

---

## STYLE PROPERTIES MATRIX

### Layout — Header

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `.spacing(8)` | `space.sm` |

### Layout — Icon

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `18` | `18.dp` | `18` | `iconSize.md` |
| rotation (closed) | RN-wrapper | `0deg` | `Modifier.rotate(0.dp)` | `.rotationEffect(.degrees(0))` | n/a (animation) |
| rotation (open) | RN-wrapper | `90deg` | `Modifier.rotate(90.dp)` | `.rotationEffect(.degrees(90))` | n/a (animation) |

### Layout — Content

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| marginTop | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |
| marginLeft | RN-wrapper | `semantic.space.xl` = 24 | `Modifier.padding(start = 24.dp)` | `.padding(.leading, 24)` | `space.xl` |

### Visual — Icon Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colors.onSurface.copy(alpha = 0.7f)` | `Color(UIColor.tertiaryLabel)` | `color.onSurface.muted` |

### Typography — Title

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | ThemedText | `defaultSemiBold` | `MaterialTheme.typography.titleSmall` | `.font(.system(size: 14, weight: .semibold))` | n/a (component-specific) |
| color | ThemedText | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### State — Open/Close

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| isOpen | RN-wrapper | `useState(false)` | `mutableStateOf(false)` | `@State var isOpen = false` | n/a (state) |
| children render | RN-wrapper | `isOpen && children` | `if (isOpen) { children }` | `if isOpen { children }` | n/a (conditional) |

### Animation — Icon Rotation

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| property | RN-wrapper | `transform: [{ rotate }]` | `Modifier.rotate(...)` | `.rotationEffect(.degrees(...))` | n/a (transform) |
| value (closed) | RN-wrapper | `'0deg'` | `0.dp` | `.degrees(0)` | n/a (static) |
| value (open) | RN-wrapper | `'90deg'` | `90.dp` | `.degrees(90)` | n/a (static) |
| duration | RN-wrapper | `implicit (no anim)` | `animateFloatAsState(...)` | `.animation(.easeInOut(duration: 0.2))` | `motion.duration.normal` (if animated) |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| onPress | RN-wrapper | `setIsOpen(!isOpen)` | `onClick = { isOpen = !isOpen }` | `onTap { isOpen.toggle() }` | n/a (callback) |
| activeOpacity | RN-wrapper | `0.8` | `interactionSource = ...` | `.buttonStyle(.plain)` | n/a (feedback) |
| accessibilityRole | RN-wrapper | `none` | `Modifier.semantics { role = Role.None }` | n/a | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### Visual — Background

| Component | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| ThemedView | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| ThemedText | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

---

## NOTES

- **Icon**: Chevron-right (→) that rotates 90deg when open (pointing down ↓)
- **Content indentation**: 24px left margin to create hierarchy under header
- **Spacing**: 8px gap between icon and title, 8px top margin for content
- **Animation**: Icon rotation is instantaneous in RN, could be animated in native
- **Conditional rendering**: Content only renders when isOpen is true
- **Themed components**: Uses ThemedView and ThemedText for theme consistency
- **Press feedback**: TouchableOpacity with 0.8 activeOpacity
