# CreativeLabelFadeIn

## Component Classification
**Type:** Molecule
**Domain:** Enrichment
**Source:** `components/enrichment/creative-label-fade-in.tsx`

## Purpose
Animated fade-in component for enriched route labels. Provides progressive disclosure of creative naming.

## COMPOSITION

### Child Components
- None (text-only with animation)

### Layout Structure
```
┌─────────────────────────────────┐
│                                 │
│  "Twisties & Tigers"            │
│  (opacity: 0 → 1)               │
│                                 │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/enrichment/creative-label-fade-in.tsx`

**Key Implementation:**
- `AnimatedOpacity` or `FadeIn` transition
- Staggered timing based on enrichment phase
- Label text display
- Conditional rendering (visible flag)

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/CreativeLabelFadeIn.kt`

**Implementation Notes:**
- Use `AnimatedVisibility` with `fadeIn()` animation
- `Crossfade` for smooth text transitions
- AnimationSpec for timing control
- LaunchedEffect trigger for stagger

**Expected API:**
```kotlin
@Composable
fun CreativeLabelFadeIn(
  label: String,
  visible: Boolean,
  modifier: Modifier = Modifier,
  animationDuration: Int = 300
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/CreativeLabelFadeIn.swift`

**Implementation Notes:**
- Use `.opacity()` with `Animation.easeInOut`
- Conditional view with transition modifier
- `withAnimation` block for programmatic control
- Stagger via `.delay()` on animation

**Expected API:**
```swift
struct CreativeLabelFadeIn: View {
  var label: String
  var visible: Bool
  var animationDuration: Double = 0.3

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Font Family | System default | Typography.bodyLarge | Font.body | `typography.body` |
| Font Size | 16sp | 16.sp | 16 | `typography.fontSize.md` |
| Font Weight | 600 (SemiBold) | FontWeight.SemiBold | .semibold | `typography.weight.semiBold` |
| Color | Primary copper | colorPrimary | Color.primary | `color.primary` |
| Text Align | Center | TextAlign.Center | .center | - |
| Animation Duration | 300ms | 300ms | 0.3s | `animation.duration.medium` |
| Animation Curve | Ease-out | EaseOutCubic | .easeOut | `animation.curve.easeOut` |
| Padding Horizontal | 16dp | 16.dp | 16 | `spacing.lg` |
| Padding Vertical | 8dp | 8.dp | 8 | `spacing.sm` |

## NOTES

### Animation Timing
- Fade-in duration: 300ms
- Delay based on enrichment phase (0ms for cached, 500ms for fast, 1000ms for extended)
- Stagger when multiple labels appear

### Accessibility
- `accessibilityLabel`: "Creative route name"
- `animated`: true (announce when complete)
- `accessibilityLiveRegion`: "polite"

### Enrichment Integration
- Triggered by `EnrichmentProgressProvider` phase completion
- Shows "creative" label from enrichment API
- Falls back to technical name if unavailable

### Platform Differences
- **Android:** Use `AnimatedVisibility` enter/exit transitions
- **iOS:** Use `.transition(.opacity)` with `ZStack` for smooth crossfade

### Dependencies
- Enrichment state from context/props
- Animation system
- Typography tokens
