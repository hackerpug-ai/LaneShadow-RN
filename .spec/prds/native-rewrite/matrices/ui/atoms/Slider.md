# Slider - STYLE PROPERTIES MATRIX

**Component:** Slider
**RN Source:** `react-native/components/ui/slider.tsx`
**Framework Primitives:** `View`, `PanResponder`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/slider.tsx` | Public API, thumb dragging, visual decisions |
| PanResponder | `react-native/Libraries/Interaction/PanResponder.js` | Drag gesture handling |
| View | `react-native/Libraries/Components/View/View.js` | Track, range, and thumb rendering |

---

## STYLE PROPERTIES MATRIX

### Layout — Track Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a (layout) |
| height | RN-wrapper | `20` | `Modifier.height(20.dp)` | `.frame(height: 20)` | n/a (component-specific) |

### Layout — Track

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| height | RN-wrapper | `8` | `8.dp` | `8` | `control.sliderTrackHeight` |
| borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Capsule()` | `radius.full` |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a (layout) |

### Layout — Thumb

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `20` | `20.dp` | `20` | `control.sliderThumbSize` |
| height | RN-wrapper | `20` | `20.dp` | `20` | `control.sliderThumbSize` |
| borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| borderWidth | RN-wrapper | `2` | `Modifier.border(2.dp, ...)` | `.overlay(Circle().stroke(..., lineWidth: 2))` | `borderWidth.thumb` |
| top offset | RN-wrapper | `-6` (centered on track) | `offset(y = -6.dp)` | `.offset(y: -6)` | n/a (calculation: (20-8)/2 * -1) |
| left offset | RN-wrapper | `-10` (half thumb width) | `offset(x = -10.dp)` | `.offset(x: -10)` | n/a (calculation: 20/2 * -1) |

### Visual — Track Background Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.secondary.default` | `LaneShadowTheme.colors.secondary` | `theme.colors.secondary` | `color.secondary.default` |
| disabled | RN-wrapper | `opacity: 0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | `opacity.disabled` |

### Visual — Range Fill Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Visual — Thumb Background Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Visual — Thumb Border Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Visual — Thumb Elevation

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.elevation[2]` | `Modifier.shadow(elevation = 2.dp, ...)` | `.shadow(color: ..., radius: 4, y: 2)` | `elevation.light.2` |

### State — Thumb Position

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| calculation | RN-wrapper | `((value - min) / (max - min)) * 100` | `percentage = (value - min) / (max - min)` | same calculation | n/a (component logic) |
| output | RN-wrapper | `left: "${thumbPosition}%"` | `offset(x = (trackWidth * percentage) - thumbRadius)` | `.offset(x: ...)` | n/a (component logic) |

### State — Disabled

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| opacity | RN-wrapper | `0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | `opacity.disabled` |
| interaction | RN-wrapper | `PanResponder disabled` | `enabled = false` | `.disabled(true)` | n/a (behavior) |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'adjustable'` | `Modifier.semantics { role = Role.Adjustable }` | `.accessibilityAdjustableAction(...)` | n/a |
| accessibilityValue | RN-wrapper | `{ min, max, now: value }` | `Modifier.semantics { rangeInfo = RangeInfo(...) }` | `.accessibilityValue(...)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### Gesture — Drag

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| onStartShouldSetPanResponder | RN-wrapper | `!disabled` | `detectTapGestures` + enabled check | `DragGesture()` + enabled check | n/a (behavior) |
| onMoveShouldSetPanResponder | RN-wrapper | `!disabled` | same | same | n/a (behavior) |
| onPanResponderGrant | RN-wrapper | `getValueFromPosition` | `onDragStarted` | `onChanged` | n/a (callback) |
| onPanResponderMove | RN-wrapper | `getValueFromPosition` | `onDrag` | `onChanged` | n/a (callback) |

---

## NOTES

- **Track height**: 8px as per Material Design 3 specs
- **Thumb size**: 20×20px with 2px border, centered on track
- **Elevation**: Thumb uses elevation[2] for subtle depth
- **Range fill**: Width calculated as percentage of value between min/max
- **Stepping**: Value snaps to step increment (default: 1)
- **Disabled**: Reduces opacity to 50% and disables drag gesture
- **Accessibility**: Properly labeled as adjustable with range info
- **Positioning**: Thumb centered on track using negative offsets
