# MapPlanningIndicator Component Matrix

**Component Path:** `react-native/components/map/map-planning-indicator.tsx`
**Atomic Level:** Molecule
**Domain:** Map
**Last Updated:** 2025-01-18

---

## COMPOSITION

**React Native Source:**
```tsx
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { TypingIndicator } from '../chat/typing-indicator'
```

**Child Dependencies:**
- `TypingIndicator` (atom) - animated typing dots
- `Text` (react-native-paper) - status message
- `Animated.View` (react-native-reanimated) - fade transitions

**Layout Structure:**
```
MapPlanningIndicator (animated wrapper)
└── Pill (glass-morphic container)
    ├── "Planning route" Text
    └── TypingIndicator (animated dots)
```

---

## TRANSLATION SOURCES

### Kotlin/Compose

**Dependencies:**
- `androidx.compose.animation.AnimatedVisibility`
- `androidx.compose.animation.fadeIn`
- `androidx.compose.animation.fadeOut`
- `androidx.compose.foundation.layout.Row`
- `androidx.compose.material3.Surface`
- `TypingIndicator` atom (from `ui/atoms/TypingIndicator.kt`)

**Platform Equivalents:**
- `Animated.View` → `AnimatedVisibility`
- `FadeIn/FadeOut` → `fadeIn()/fadeOut()`
- `StyleSheet` → `Modifier` chain

### Swift/SwiftUI

**Dependencies:**
- `SwiftUI.withAnimation`
- `SwiftUI.transition`
- `SwiftUI.HStack`
- `SwiftUI.VStack`
- `TypingIndicator` atom (from `UI/Atoms/TypingIndicator.swift`)

**Platform Equivalents:**
- `Animated.View` → `withAnimation { opacity }` or `.transition(.opacity)`
- `FadeIn/FadeOut` → `.transition(.opacity)`
- `StyleSheet` → View modifier chain

---

## STYLE PROPERTIES MATRIX

| Element | Property | Token Path (Light) | Token Path (Dark) | Platform Mapping |
|---------|----------|-------------------|------------------|------------------|
| **Pill Background** | Color | `semantic.color.surface.default` | `semantic.color.surface.default` | `MaterialTheme.colorScheme.surface` |
| **Pill Border** | Color | `semantic.color.border.default` | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` |
| **Pill Border** | Width | `StyleSheet.hairlineWidth` (0.5pt) | `StyleSheet.hairlineWidth` (0.5pt) | `0.5.dp` / `strokeWidth: 0.5` |
| **Pill Radius** | Corner radius | `20` (20pt) | `20` (20pt) | `20.dp` / `cornerRadius: 20` |
| **Pill Shadow Color** | Shadow | `#000000` (black) | `#000000` (black) | `Color.Black` |
| **Pill Shadow Offset** | Offset | `{ width: 0, height: 2 }` | `{ width: 0, height: 2 }` | `Offset(0, 2)` / `shadowOffset: {width: 0, height: 2}` |
| **Pill Shadow Opacity** | Alpha | `0.15` (15%) | `0.15` (15%) | `alpha = 0.15f` / `opacity: 0.15` |
| **Pill Shadow Radius** | Blur | `8` (8pt) | `8` (8pt) | `8.dp` / `shadowRadius: 8` |
| **Pill Elevation** | Shadow | `4` (Android) | N/A | `shadowElevation = 4.dp` |
| **Text Font** | Typography | `variant="bodySmall"` | `variant="bodySmall"` | `Typography.labelSmall` / `Font.caption2` |
| **Text Color** | Color | `semantic.color.onSurface.muted` | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` |
| **Item Gap** | Spacing | `8` (8pt) | `8` (8pt) | `8.dp` / `spacing: 8` |
| **Horizontal Padding** | Spacing | `16` (16pt) | `16` (16pt) | `16.dp` / `padding(.horizontal, 16)` |
| **Vertical Padding** | Spacing | `10` (10pt) | `10` (10pt) | `10.dp` / `padding(.vertical, 10)` |
| **Fade Duration** | Animation | `200` (200ms) | `200` (200ms) | `200.ms` / `0.2 seconds` |
| **Wrapper Z-Index** | Elevation | `25` | `25` | `zIndex = 25f` / `.zIndex(25)` |

---

## IMPLEMENTATION NOTES

### Positioning Calculation

**Bottom Offset Logic:**
```tsx
const calculatedBottom = (bottomOffset ?? 100) + extraInputOffset
```

**Default Values:**
- `bottomOffset`: `100pt` (default distance from screen bottom)
- `extraInputOffset`: `0pt` (additional offset for ChatInput keyboard avoidance)

**Use Cases:**
- Planning indicator must sit above ChatInput
- When ChatInput expands for keyboard, `extraInputOffset` increases
- Indicator positions dynamically to avoid overlap

### Animation Timing

**Enter Animation:**
- Duration: 200ms
- Easing: default (ease-in-out)
- Effect: Fade in from 0% to 100% opacity

**Exit Animation:**
- Duration: 200ms
- Easing: default (ease-in-out)
- Effect: Fade out from 100% to 0% opacity

### Glass Morphic Effect

**Shadow Configuration:**
```tsx
shadowColor: '#000'
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.15
shadowRadius: 8
elevation: 4
```

This creates a subtle drop shadow that:
- Is centered horizontally (width: 0)
- Extends downward 2pt (height: 2)
- Has soft edges (8pt blur radius)
- Is semi-transparent (15% opacity)

### Conditional Rendering

**Early Return Pattern:**
```tsx
if (!visible) return null
```

The component returns `null` when `visible = false` to avoid rendering unnecessary views.

### Layout Behavior

**Wrapper:**
- `position: 'absolute'` - overlays map content
- `left: 0, right: 0` - spans full width
- `alignItems: 'center'` - horizontally centers pill
- `zIndex: 25` - above map elements, below toasts/modals

**Pill:**
- `flexDirection: 'row'` - horizontal layout
- `alignItems: 'center'` - vertical center alignment
- `gap: 8` - spacing between text and typing indicator

---

## PLATFORM-SPECIFIC CONSIDERATIONS

### Android (Kotlin/Compose)

**AnimatedVisibility:**
```kotlin
AnimatedVisibility(
  visible = visible,
  enter = fadeIn(animationSpec = tween(durationMillis = 200)),
  exit = fadeOut(animationSpec = tween(durationMillis = 200)),
) {
  // Pill content
}
```

**Elevation:**
- Use `Modifier.shadow(elevation = 4.dp, shape = RoundedCornerShape(20.dp))`
- Or use `Surface(elevation = 4.dp, shape = RoundedCornerShape(20.dp))`

**Typography:**
- Use `MaterialTheme.typography.labelSmall` for "bodySmall" equivalent
- Text color: `MaterialTheme.colorScheme.onSurfaceVariant`

**Positioning:**
- Use `Modifier.offset(y = calculatedBottom.dp)`
- Use `Box` with `Modifier.fillMaxWidth()` for full-width wrapper
- Use `Modifier.align(Alignment.CenterHorizontally)` for centering

### iOS (Swift/SwiftUI)

**Animation:**
```swift
@State var isVisible: Bool = false

var body: some View {
  VStack {
    if isVisible {
      PillView()
        .transition(.opacity)
    }
  }
  .animation(.easeInOut(duration: 0.2), value: isVisible)
}
```

**Shadow:**
```swift
.shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 2)
```

**Typography:**
- Use `.font(.caption2)` for "bodySmall" equivalent
- Text color: `semantic.color.onSurface.muted`

**Positioning:**
- Use `.offset(y: calculatedBottom)` for bottom positioning
- Use `.frame(maxWidth: .infinity)` for full-width wrapper
- Use `VStack { Spacer(); PillView() }` for bottom alignment

---

## USAGE EXAMPLES

### Basic Usage

```tsx
<MapPlanningIndicator
  visible={isPlanning}
  bottomOffset={100}
  testID="map-planning-indicator"
/>
```

### With Keyboard Avoidance

```tsx
<MapPlanningIndicator
  visible={isPlanning}
  bottomOffset={100}
  extraInputOffset={keyboardHeight}
  testID="map-planning-indicator"
/>
```

---

## ACCESSIBILITY

**Accessibility Label:**
- The "Planning route" text provides context for screen readers
- The typing indicator conveys ongoing activity

**Screen Reader Behavior:**
- Text: "Planning route"
- Typing indicator: (conveys animation, no specific label)

**Accessibility Hint:**
Consider adding `accessibilityLabel="Planning route, please wait"` for better screen reader support.

---

## ESCALATE

None. All required tokens and platform equivalents are available.

**Note:** The `TypingIndicator` atom must be implemented before this molecule. Reference the `TypingIndicator.md` matrix for implementation details.
