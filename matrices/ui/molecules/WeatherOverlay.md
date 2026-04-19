# WeatherOverlay

## Component Classification
**Type:** Molecule
**Domain:** Map
**Source:** `components/map/weather-overlay.tsx`

## Purpose
Weather overlay toggle and display on map. Shows weather conditions across route.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Weather toggle icon
- `WeatherPillsRow` (molecule) - Weather indicators

### Layout Structure
```
┌─────────────────────────────────┐
│  🌤️                            │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ 72°F │ │ 10mph│ │Light │   │
│  └──────┘ └──────┘ └──────┘   │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/map/weather-overlay.tsx`

**Key Implementation:**
- Toggle button with weather icon
- Expanded row of weather pills
- Fade transition on toggle
- Positioned on map (top-right or top-left)
- Collapsed by default

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/WeatherOverlay.kt`

**Implementation Notes:**
- Use `Column` with toggle button and `AnimatedVisibility`
- Compose `WeatherPillsRow`
- `Crossfade` or `AnimatedVisibility` for transition
- `IconButton` for toggle
- `Box` for positioning on map

**Expected API:**
```kotlin
@Composable
fun WeatherOverlay(
  visible: Boolean,
  windLevel: WindLevel,
  rainLevel: RainLevel,
  temperature: Int,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/WeatherOverlay.swift`

**Implementation Notes:**
- Use `VStack` with toggle button and conditional view
- Compose `WeatherPillsRow`
- `.transition()` for fade
- `Button` for toggle
- `.frame()` alignment for positioning

**Expected API:**
```swift
struct WeatherOverlay: View {
  var visible: Bool
  var windLevel: WindLevel
  var rainLevel: RainLevel
  var temperature: Int

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Toggle Button Size | 40dp | 40.dp | 40 | `size.iconButton.md` |
| Toggle Button Color | Glass | surface.copy(alpha=0.8) | Color.ultraThinMaterial | `color.glassOverlay` |
| Toggle Icon Size | 20dp | 20.dp | 20 | `iconSize.sm` |
| Toggle Icon Name | weather-cloudy | cloud | cloud.sun.fill | `icon.weather` |
| Toggle Icon Color | Primary copper | colorPrimary | Color.primary | `color.primary` |
| Corner Radius | 20dp | 20.dp | 20 | `borderRadius.full` |
| Elevation | 2 | 2.dp | 2 | `elevation.overlay` |
| Padding | 8dp | 8.dp | 8 | `spacing.sm` |
| Gap (toggle-pills) | 8dp | 8.dp | 8 | `spacing.sm` |
| Transition Duration | 200ms | 200ms | 0.2s | `animation.duration.short` |
| Transition Curve | Ease-out | EaseOut | .easeOut | `animation.curve.easeOut` |

## NOTES

### Toggle Behavior
- Tap to expand/collapse
- Auto-collapse on map tap
- Persist state during session
- Reset on route change

### Positioning
- Default: Top-right corner
- Alternative: Top-left corner
- Offset: 16dp from edges
- Above map controls

### Weather Pills
- Temperature: Current at route
- Wind: Max wind level
- Rain: Rain intensity
- Compact: Icon + value

### Accessibility
- `accessibilityLabel`: "Weather overlay"
- `accessibilityHint`: "Shows weather conditions along route"
- `accessibilityRole`: "button"
- Pills: "Temperature {temp}, wind {wind}, rain {rain}"

### Platform Differences
- **Android:** `AnimatedVisibility` with enter/exit transitions
- **iOS:** `.transition(.opacity)` with `ZStack`

### Dependencies
- `IconSymbol` atom
- `WeatherPillsRow` molecule
- Weather data
- Map SDK (for positioning)
