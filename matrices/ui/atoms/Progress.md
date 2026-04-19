# Progress - STYLE PROPERTIES MATRIX

**Component:** Progress
**RN Source:** `react-native/components/ui/progress.tsx`
**Framework Primitives:** `View`, `Animated.View`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/progress.tsx` | Public API, determinate/indeterminate states, animation |
| Animated.View | `react-native/Libraries/Animated/Animated.js` | Smooth width/transform animations |

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a (layout) |
| height | RN-wrapper | `16` | `Modifier.height(16.dp)` | `.frame(height: 16)` | n/a (component-specific) |
| borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Capsule()` | `radius.full` |
| overflow | RN-wrapper | `'hidden'` | `Modifier.clipScroll()` | `.clipped()` | n/a (behavior) |

### Layout — Indicator

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| height | RN-wrapper | `16` (matches container) | `16.dp` | `16` | n/a (component-specific) |
| borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Capsule()` | `radius.full` |
| position | RN-wrapper | `'absolute'` | `Modifier.offset(...)` | `.position(...)` | n/a (layout) |

### Visual — Container Background Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.secondary.default` | `LaneShadowTheme.colors.secondary` | `theme.colors.secondary` | `color.secondary.default` |

### Visual — Indicator Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| determinate | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| indeterminate | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Animation — Determinate

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| duration | RN-wrapper | `300` | `animationSpec = tween(300)` | `.animation(.easeInOut(duration: 0.3))` | `motion.duration.normal` |
| easing | RN-wrapper | `timing (default)` | `Easing.FastOutSlowIn` | `.easeInOut` | `motion.easing.standard` |
| property | RN-wrapper | `width` | `Modifier.fillMaxWidth(percentage / 100)` | `.frame(width: percentage * containerWidth)` | n/a (calculation) |
| useNativeDriver | RN-wrapper | `false` (width anim) | `Native` (native in Compose) | n/a (SwiftUI native) | n/a |

### Animation — Indeterminate

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `'30%'` | `Modifier.fillMaxWidth(0.3f)` | `.frame(width: containerWidth * 0.3)` | n/a (component-specific) |
| duration | RN-wrapper | `1500` (per cycle) | `animationSpec = infiniteRepeatable(tween(1500))` | `.animation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true))` | n/a (component-specific) |
| transform | RN-wrapper | `translateX: -100% → 100%` | `Modifier.offset(x = ...)` | `.offset(x: ...)` | n/a (component-specific) |
| useNativeDriver | RN-wrapper | `true` (transform) | `Native` (native in Compose) | n/a (SwiftUI native) | n/a |

### State — Determinate Calculation

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| percentage | RN-wrapper | `(value / max) * 100` | same calculation | same calculation | n/a (component logic) |
| clamping | RN-wrapper | `Math.max(0, Math.min(100, percentage))` | `coerceIn(0f, 1f)` | `min(1.0, max(0.0, ...))` | n/a (behavior) |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'progressbar'` | `Modifier.semantics { role = Role.ProgressBar }` | `.accessibilityElement(children: .ignore)` + `.accessibilityRole(.progressBar)` | n/a |
| accessibilityValue | RN-wrapper | `{ min: 0, max, now: value }` | `Modifier.semantics { rangeInfo = RangeInfo(...) }` | `.accessibilityValue(...)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

---

## NOTES

- **Height**: 16px container with matching indicator height
- **Shape**: Full rounded (capsule) for modern pill shape
- **Determinate**: Shows actual progress from 0-100% with 300ms smooth transition
- **Indeterminate**: 30% width bar animating left-to-right continuously (1500ms per cycle)
- **Color**: Primary color indicator on secondary color background
- **Accessibility**: Properly labeled as progressbar with range info
- **Clipping**: Container clips overflow to keep indicator within rounded bounds
