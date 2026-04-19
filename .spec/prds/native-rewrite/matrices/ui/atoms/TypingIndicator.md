# TypingIndicator - STYLE PROPERTIES MATRIX

**Component:** TypingIndicator
**RN Source:** `react-native/components/chat/typing-indicator.tsx`
**Framework Primitives:** `View`, `Animated.View` (Reanimated)

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/chat/typing-indicator.tsx` | Public API, dot animation, accessibility |
| Animated.View | `react-native-reanimated` | Smooth scale animations |
| AccessibilityInfo | `react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo.js` | Reduce motion detection |

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `3` (sm), `4` (md) | `Arrangement.spacedBy(3.dp / 4.dp)` | `.spacing(3 / 4)` | n/a (component-specific) |

### Layout — Dots

| Size | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| sm | diameter | RN-wrapper | `4` | `4.dp` | `4` | n/a (component-specific) |
| sm | gap | RN-wrapper | `3` | `3.dp` | `3` | n/a (component-specific) |
| md | diameter | RN-wrapper | `6` | `6.dp` | `6` | n/a (component-specific) |
| md | gap | RN-wrapper | `4` | `4.dp` | `4` | n/a (component-specific) |

### Layout — Individual Dot

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `diameter` (4 or 6) | `Modifier.width(diameter.dp)` | `.frame(width: diameter)` | n/a (prop) |
| height | RN-wrapper | `diameter` (4 or 6) | `Modifier.height(diameter.dp)` | `.frame(height: diameter)` | n/a (prop) |
| borderRadius | RN-wrapper | `diameter / 2` | `CircleShape` | `Circle()` | n/a (calculation) |

### Visual — Dot Color

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.onSurface.subtle` | `MaterialTheme.colors.onSurface.copy(alpha = 0.6f)` | `Color(UIColor.tertiaryLabel)` | `color.onSurface.subtle` |
| override | RN-wrapper | `color` prop | `Color(color)` | `Color(hex)` | varies |

### Animation — Scale

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| property | RN-wrapper | `transform: [{ scale }]` | `Modifier.scale(...)` | `.scaleEffect(...)` | n/a (transform) |
| min scale | RN-wrapper | `0.6` | `0.6f` | `0.6` | n/a (component-specific) |
| max scale | RN-wrapper | `1.0` | `1.0f` | `1.0` | n/a (component-specific) |
| half-period | RN-wrapper | `300` | `animationSpec = tween(300)` | `.animation(.easeInOut(duration: 0.3))` | `motion.duration.fast` |
| loop delay | RN-wrapper | `300` | `delayMillis = 300` | `.delay(0.3)` | `motion.duration.fast` |
| full cycle | RN-wrapper | `~900` per dot | `300 + 300 + 300 = 900` | `0.3 + 0.3 + 0.3 = 0.9` | n/a (calculation) |

### Animation — Stagger

| Dot | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| dot 0 | RN-wrapper | `delayMs = 0` | `startDelay = 0` | `.delay(0)` | n/a |
| dot 1 | RN-wrapper | `delayMs = 150` | `startDelay = 150` | `.delay(0.15)` | `motion.delay.stagger` |
| dot 2 | RN-wrapper | `delayMs = 300` | `startDelay = 300` | `.delay(0.3)` | `motion.delay.stagger * 2` |

### Animation — Sequence

| Step | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| 1 | RN-wrapper | `scale: 1.0 → 0.6` | `animateTo(0.6f, ...)` | `.scaleEffect(0.6)` | n/a |
| 2 | RN-wrapper | `scale: 0.6 → 1.0` | `animateTo(1.0f, ...)` | `.scaleEffect(1.0)` | n/a |
| 3 | RN-wrapper | `scale: 1.0 (pause)` | `delayAnim(300)` | `.delay(0.3)` | `motion.duration.fast` |
| repeat | RN-wrapper | `-1` (infinite) | `repeatable(-1)` | `.repeatForever(autoreverses: false)` | n/a (behavior) |

### State — Reduce Motion

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| enabled | RN-wrapper | `AccessibilityInfo.isReduceMotionEnabled()` | `isReduceMotionEnabled()` | `accessibilityReducedMotion` | n/a (system) |
| behavior | RN-wrapper | `static dots at scale 1.0` | `no animation` | `.animation(nil)` | n/a (override) |
| update | RN-wrapper | `async useEffect` | `LaunchedEffect` + `async` | `.onAppear { check() }` | n/a (lifecycle) |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'progressbar'` | `Modifier.semantics { role = Role.ProgressBar }` | `.accessibilityRole(.progressBar)` | n/a |
| accessibilityLabel | RN-wrapper | `"Assistant is typing"` | `contentDescription = "Assistant is typing"` | `.accessibilityLabel("Assistant is typing")` | n/a (copy) |
| testID | RN-wrapper | `"typing-indicator"` + dot indices | `Modifier.testTag("typing-indicator-dot-0")` | `.accessibilityIdentifier("typing-indicator-dot-0")` | n/a |

### Animation — Native Driver

| Platform | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| RN | RN-wrapper | `useNativeDriver: true` | `Native` (native in Compose) | n/a (SwiftUI native) | n/a (platform) |

---

## NOTES

- **Purpose**: Three animated dots shown inline in chat transcript during streaming
- **Sizes**: sm (4px diameter, 3px gap) for inline, md (6px, 4px) for larger contexts
- **Animation**: Each dot scales 0.6 → 1.0 → 1.0 (pause) → repeat, 900ms cycle
- **Stagger**: Dots start 150ms apart for wave effect
- **Reduce motion**: Respects system setting, shows static dots at scale 1.0
- **Accessibility**: Labeled as progressbar with "Assistant is typing" label
- **Color**: Uses onSurface.subtle (60% opacity) by default, override via color prop
- **Inline**: Designed to fit inline with body text (sm variant)
