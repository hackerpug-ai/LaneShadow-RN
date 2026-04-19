# WeatherBadgeSkeleton

## Component Classification
**Type:** Molecule
**Domain:** Loading
**Source:** `components/skeleton/weather-badge-skeleton.tsx`

## Purpose
Skeleton placeholder for weather badges during loading. Matches weather badge layout.

## COMPOSITION

### Child Components
- `Skeleton` (atom) - Base skeleton placeholder

### Layout Structure
```
┌─────────────────────────────────┐
│  ██  ████                        │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/skeleton/weather-badge-skeleton.tsx`

**Key Implementation:**
- Icon placeholder (circle/square)
- Text placeholder (rect)
- Shimmer animation
- Fixed width for badge

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/WeatherBadgeSkeleton.kt`

**Implementation Notes:**
- Use `Row` with `Box` for icon, `Box` for text
- `shimmer()` modifier or custom animation
- Match badge dimensions exactly
- `RoundedCornerShape` for badge

**Expected API:**
```kotlin
@Composable
fun WeatherBadgeSkeleton(
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/WeatherBadgeSkeleton.swift`

**Implementation Notes:**
- Use `HStack` with `RoundedRectangle` for icon/text
- `.redacted(reason: .placeholder)` for native blur
- Match badge dimensions exactly
- Capsule shape

**Expected API:**
```swift
struct WeatherBadgeSkeleton: View {
  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Badge Height | 24dp | 24.dp | 24 | `size.badge.sm` |
| Badge Width | ~80dp | 80.dp | 80 | `size.badge.width` |
| Corner Radius | 12dp | 12.dp | 12 | `borderRadius.pill` |
| Background Color | Surface variant | surfaceVariant | Color.secondary.opacity(0.1) | `color.surfaceVariant` |
| Shimmer Color | Pulse alpha | Animated alpha | Opacity animation | `color.shimmer` |
| Icon Placeholder Size | 16dp | 16.dp | 16 | `iconSize.xs` |
| Icon Placeholder Shape | Circle | CircleShape | Circle() | `shape.circle` |
| Text Placeholder Width | 48dp | 48.dp | 48 | `width.label` |
| Text Placeholder Height | 12dp | 12.dp | 12 | `typography.lineHeight.sm` |
| Gap (icon-text) | 6dp | 6.dp | 6 | `spacing.xs` |
| Animation Duration | 1500ms | 1500ms | 1.5s | `animation.duration.slow` |

## NOTES

### Layout Matching
- Match `TemperatureBadge` dimensions
- Match `RainBadge` dimensions
- Match `WindBadge` dimensions
- Prevent layout shift on load

### Use Cases
- Route card loading
- Weather strip loading
- Planning status loading
- Any weather badge placeholder

### Animation
- Shimmer pulse: 1500ms infinite
- Fade-in on load: 300ms
- No bounce (subtle)

### Accessibility
- `accessibilityLabel`: "Loading weather"
- `accessibilityRole`: "text"
- Hidden from accessibility when replaced

### Platform Differences
- **Android:** `Box` with `shimmer()` modifier
- **iOS:** `.redacted(reason: .placeholder)` for native blur

### Dependencies
- `Skeleton` atom
- Animation system
- Color tokens
- Weather badge dimensions
