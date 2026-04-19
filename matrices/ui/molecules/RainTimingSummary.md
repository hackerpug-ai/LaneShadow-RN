# RainTimingSummary

## Component Classification
**Type:** Molecule
**Domain:** Planning
**Source:** `components/planning/rain-timing-summary.tsx`

## Purpose
Summary display of rain timing during route planning. Shows when rain is expected.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Rain/cloud icon
- `RainBadge` (molecule) - Rain intensity indicator

### Layout Structure
```
┌─────────────────────────────────┐
│  🌧️ Rain starting 2:00 PM      │
│     for 45 minutes              │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/planning/rain-timing-summary.tsx`

**Key Implementation:**
- Rain icon with timing text
- Duration display
- Relative time ("in 2 hours")
- Conditional styling (warning colors)

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/RainTimingSummary.kt`

**Implementation Notes:**
- Use `Row` with `Icon` and `Text`
- `AnnotatedString` for emphasis
- `when` for intensity-based coloring
- Weather icon from vector assets

**Expected API:**
```kotlin
@Composable
fun RainTimingSummary(
  timing: RainTiming,
  modifier: Modifier = Modifier
)

data class RainTiming(
  val startTime: Instant,
  val duration: Duration,
  val intensity: RainIntensity
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/RainTimingSummary.swift`

**Implementation Notes:**
- Use `HStack` with SF Symbol and text
- `AttributedString` for emphasis
- Switch for intensity-based color
- SF Symbol for weather icon

**Expected API:**
```swift
struct RainTimingSummary: View {
  var timing: RainTiming

  struct RainTiming {
    var startTime: Date
    var duration: TimeInterval
    var intensity: RainIntensity
  }

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Icon Name | weather-rain | rainy | cloud.rain.fill | `icon.rain` |
| Icon Size | 20dp | 20.dp | 20 | `iconSize.sm` |
| Icon Color | Info blue | colorInfo | Color.blue | `color.info` |
| Text Color | Text primary | onSurface | Color.primary | `color.textPrimary` |
| Font Size | 14sp | 14.sp | 14 | `typography.fontSize.sm` |
| Font Weight | 400 (Regular) | FontWeight.Normal | .regular | `typography.weight.regular` |
| Gap (icon-text) | 8dp | 8.dp | 8 | `spacing.sm` |
| Background Color | Transparent | - | - | - |
| Padding | 0 | 0.dp | 0 | - |

## NOTES

### Text Format
- Start: "Rain starting {time}"
- Duration: "for {duration}"
- Combined: "Rain starting 2:00 PM for 45 minutes"

### Time Format
- Relative: "in 2 hours", "at 2:00 PM"
- Absolute: "2:00 PM - 2:45 PM"
- Short: "2 PM - 2:45 PM"

### Intensity Colors
- Light: Blue (info)
- Moderate: Amber (warning)
- Heavy: Red (danger)

### Use Cases
- Planning status tab
- Weather strip
- Route details sheet
- Planning error context

### Accessibility
- `accessibilityLabel`: "Rain starting at 2 PM for 45 minutes"
- `accessibilityRole`: "text"
- Icon decorative (hidden)

### Platform Differences
- **Android:** Material3 `Icon` + `Text`
- **iOS:** SF Symbol `cloud.rain.fill`

### Dependencies
- `IconSymbol` atom
- `RainBadge` molecule (optional)
- Weather data
- Date formatting utility
