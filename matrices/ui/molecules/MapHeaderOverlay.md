# MapHeaderOverlay Component Matrix

**Component Path:** `react-native/components/map/map-header-overlay.tsx`
**Atomic Level:** Molecule
**Domain:** Map
**Last Updated:** 2025-01-18

---

## COMPOSITION

**React Native Source:**
```tsx
import { LinearGradient } from 'expo-linear-gradient'
import { Button } from '../ui/button'
import { IconSymbol } from '../ui/icon-symbol'
```

**Child Dependencies:**
- `Button` (atom) - icon buttons for left/right actions
- `IconSymbol` (atom) - icon glyphs for actions
- `LinearGradient` (expo-linear-gradient) - glass-morphic fade effect

**Layout Structure:**
```
MapHeaderOverlay (glass gradient)
├── Left Section (Button or placeholder)
├── Center Title (Text)
└── Right Section (Button or placeholder)
```

---

## TRANSLATION SOURCES

### Kotlin/Compose

**Dependencies:**
- `androidx.compose.foundation.layout.Row`
- `androidx.compose.foundation.layout.Box`
- `androidx.compose.material.icons.Icons`
- `androidx.compose.ui.graphics.LinearGradient` (via Brush.verticalGradient)
- `Button` atom (from `ui/atoms/Button.kt`)
- `IconSymbol` atom (from `ui/atoms/IconSymbol.kt`)

**Platform Equivalents:**
- `LinearGradient` → `Brush.verticalGradient()` with `alpha` composable
- `useSafeAreaInsets()` → `WindowInsets.statusBars.asPaddingValues()`
- `StyleSheet` → `Modifier` chain

### Swift/SwiftUI

**Dependencies:**
- `SwiftUI.LinearGradient`
- `Button` atom (from `UI/Atoms/Button.swift`)
- `IconSymbol` atom (from `UI/Atoms/IconSymbol.swift`)

**Platform Equivalents:**
- `LinearGradient` → `LinearGradient` (native)
- `useSafeAreaInsets()` → GeometryReader + safeAreaInset
- `StyleSheet` → View modifier chain

---

## STYLE PROPERTIES MATRIX

| Element | Property | Token Path (Light) | Token Path (Dark) | Platform Mapping |
|---------|----------|-------------------|------------------|------------------|
| **Gradient Start** | Background color | `semantic.color.surface.default` + 95% opacity | `semantic.color.surface.default` + 95% opacity | `withAlpha(color, 0.95)` |
| **Gradient Middle** | Background color | `semantic.color.surface.default` + 50% opacity | `semantic.color.surface.default` + 50% opacity | `withAlpha(color, 0.50)` |
| **Gradient End** | Background color | `transparent` | `transparent` | `Color.transparent` |
| **Title Text** | Font | `semantic.type.heading.md` (600 weight, 18pt) | `semantic.type.heading.md` (600 weight, 18pt) | `Typography.h6` / `Font.headline` |
| **Title Color** | Text color | `semantic.color.onSurface.default` | `semantic.color.onSurface.default` | `MaterialTheme.colors.onSurface` |
| **Icon Buttons** | Size | `semantic.space['3xl']` (48pt) | `semantic.space['3xl']` (48pt) | `48.dp` / `CGSize(width: 48, height: 48)` |
| **Icon Button** | Icon color | `semantic.color.onSurface.default` | `semantic.color.onSurface.default` | `MaterialTheme.colors.onSurface` |
| **Icon Button** | Variant | `"glass"` (transparent surface) | `"glass"` (transparent surface) | Custom variant |
| **Horizontal Padding** | Spacing | `semantic.space.lg` (16pt) | `semantic.space.lg` (16pt) | `16.dp` / `padding(.horizontal, 16)` |
| **Bottom Padding** | Spacing | `semantic.space['2xl']` (32pt) | `semantic.space['2xl']` (32pt) | `32.dp` / `padding(.bottom, 32)` |
| **Top Padding** | Safe area | `insets.top` | `insets.top` | `WindowInsets.statusBars` / `safeAreaInset` |

---

## IMPLEMENTATION NOTES

### Gradient Implementation

**React Native:**
```tsx
// Alpha blending helper
const withAlpha = (color: string, alpha: number) => {
  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0')
  return `${color}${alphaHex}`
}

<LinearGradient
  colors={[
    withAlpha(semantic.color.surface.default, 0.95),
    withAlpha(semantic.color.surface.default, 0.5),
    'transparent'
  ]}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
/>
```

**Kotlin/Compose:**
```kotlin
// Alpha blending via copy()
val gradientStart = semantic.color.surface.default.copy(alpha = 0.95f)
val gradientMiddle = semantic.color.surface.default.copy(alpha = 0.50f)
val gradientEnd = Color.Transparent

Box(
  modifier = Modifier
    .background(
      Brush.verticalGradient(
        colors = listOf(gradientStart, gradientMiddle, gradientEnd)
      )
    )
    .padding(top = WindowInsets.statusBars.asPaddingValues().calculateTopPadding())
)
```

**Swift/SwiftUI:**
```swift
// Alpha blending via .opacity()
struct MapHeaderOverlay: View {
  @Environment(\.semanticTheme) var semantic

  var body: some View {
    VStack {
      LinearGradient(
        colors: [
          semantic.color.surface.default.opacity(0.95),
          semantic.color.surface.default.opacity(0.50),
          Color.clear
        ],
        startPoint: .top,
        endPoint: .bottom
      )
      .edgesIgnoringSafeArea(.top)
    }
  }
}
```

### Action Button Pattern

**Placeholder Pattern:**
When `leftAction` or `rightAction` is `undefined`, render a placeholder View with the same dimensions as the icon button to maintain center alignment of the title.

**Custom Icon Rendering:**
The `renderIcon` prop allows custom React nodes (e.g., animated icons) to override the default `IconSymbol` glyph.

### Glass Morphic Effect

The "glass" variant on Button uses:
- Background: `semantic.color.surface.default` with 10-20% opacity
- Border: `semantic.color.border.default` with hairline width
- Backdrop filter: Platform blur (if available)

### Safe Area Handling

**CRITICAL:** Do NOT wrap MapHeaderOverlay in `SafeAreaView`. The component handles its own safe area padding via `useSafeAreaInsets()` to ensure the gradient extends seamlessly behind the status bar.

### Test ID Propagation

Test IDs follow the pattern:
- Container: `{testID}` or `"map-header-overlay"`
- Left button: `{testID}-left-button` or `"map-header-left-button"`
- Title: `{testID}-title` or `"map-header-title"`
- Right button: `{testID}-right-button` or `"map-header-right-button"`

---

## PLATFORM-SPECIFIC CONSIDERATIONS

### Android (Kotlin/Compose)

**Gradient Performance:**
- Use `Brush.verticalGradient` for hardware-accelerated rendering
- Consider caching gradient colors in `remember` to avoid recomposition

**Elevation:**
- Map header overlays typically use `elevation = 3.dp` for subtle depth
- Avoid shadows on the gradient itself (visual clutter on map)

**Status Bar Scrim:**
- Android requires `statusBarsPadding()` to push content below the status bar
- The gradient should extend into the status bar area (no scrim)

### iOS (Swift/SwiftUI)

**Gradient Performance:**
- Use `LinearGradient` with `.drawingGroup()` for complex animations
- Static gradients are performant without optimization

**Blur Effect:**
- iOS can use `.blur(radius: 10)` on the gradient for enhanced glass effect
- Use sparingly — performance impact on map rendering

**Safe Area:**
- Use `.edgesIgnoringSafeArea(.top)` to extend gradient behind status bar
- Apply `.padding(.top, safeArea.top)` to inner content

---

## ESCALATE

None. All required tokens and platform equivalents are available.
