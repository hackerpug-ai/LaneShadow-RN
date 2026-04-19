# Switch - STYLE PROPERTIES MATRIX

**Component:** Switch
**RN Source:** `react-native/components/ui/switch.tsx`
**Framework Primitives:** `Pressable`, `Animated.View`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/switch.tsx` | Public API, thumb animation, visual decisions |
| Pressable | `react-native/Libraries/Components/Pressable/Pressable.js` | Press feedback, hit behavior |
| Animated.View | `react-native/Libraries/Animated/Animated.js` | Smooth thumb translation animation |

---

## STYLE PROPERTIES MATRIX

### Layout — Track

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `44` | `Modifier.width(44.dp)` | `.frame(width: 44)` | n/a (component-specific) |
| height | RN-wrapper | `24` | `Modifier.height(24.dp)` | `.frame(height: 24)` | n/a (component-specific) |
| borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Capsule()` | `radius.full` |
| borderWidth | RN-wrapper | `2` | `Modifier.border(2.dp, ...)` | `.overlay(Capsule().stroke(..., lineWidth: 2))` | `borderWidth.thick` |

### Layout — Thumb

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `20` | `20.dp` | `20` | n/a (component-specific) |
| height | RN-wrapper | `20` | `20.dp` | `20` | n/a (component-specific) |
| borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| translation | RN-wrapper | `2` (unchecked) → `22` (checked) | `offset.x = 2.dp / 22.dp` | `.offset(x: 2 / 22)` | n/a (animation calculation) |

### Visual — Track Background Color (by state)

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| unchecked | RN-wrapper | `semantic.color.input.default` | `LaneShadowTheme.colors.inputBackground` | `theme.colors.inputBackground` | `color.input.default` |
| checked | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| disabled | RN-wrapper | `opacity: 0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | `opacity.disabled` |

### Visual — Thumb Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| any | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |

### Visual — Thumb Elevation

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| any | RN-wrapper | `semantic.elevation[2]` | `Modifier.shadow(elevation = 2.dp, ...)` | `.shadow(color: ..., radius: 4, y: 2)` | `elevation.light.2` |

### Animation — Thumb Translation

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| duration | RN-wrapper | `200` | `animationSpec = tween(200)` | `.animation(.easeInOut(duration: 0.2))` | `motion.duration.normal` |
| easing | RN-wrapper | `timing (default)` | `Easing.FastOutSlowIn` | `.easeInOut` | `motion.easing.standard` |
| useNativeDriver | RN-wrapper | `true` | `Native` (native in Compose) | n/a (SwiftUI native) | n/a |

### State — Border Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| any | RN-wrapper | `transparent` | `Color.Transparent` | `.clear` | n/a |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'switch'` | `Modifier.semantics { role = Role.Switch }` | `.accessibilityAddTraits(.isButton)` | n/a |
| accessibilityState.checked | RN-wrapper | `value` prop | `Modifier.semantics { checked = value }` | `.accessibilityValue(value ? "1" : "0")` | n/a |
| accessibilityState.disabled | RN-wrapper | `disabled` prop | `Modifier.semantics { disabled() }` | `.accessibilityAddTraits(.notEnabled)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### Hit Slop

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| minimum | RN-wrapper | `44` (implicit via Pressable) | `Modifier.sizeIn(minWidth = 44.dp, minHeight = 44.dp)` | `.contentShape(.rect)` + `44pt` min | `touchTarget.min` |

---

## NOTES

- **Thumb animation**: Smooth translation from 2px to 22px over 200ms
- **Track border**: 2px transparent border creates spacing for thumb
- **Disabled state**: Reduces opacity to 50% but maintains layout
- **Accessibility**: Properly labeled as switch with checked/unchecked state
- **Shadow**: Thumb uses elevation[2] for subtle depth effect
- **Composition**: Use `onValueChange` callback for controlled component pattern
