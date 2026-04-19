# WeatherStrip

## Component Classification
**Type:** Molecule
**Domain:** Planning
**Source:** `components/planning/weather-strip.tsx`

## Purpose
Horizontal weather condition strip for route planning. Shows weather along route timeline.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Weather condition icons
- `TemperatureBadge` (molecule) - Temperature indicators

### Layout Structure
```
┌─────────────────────────────────┐
│  🌤️ 68°F → ⛅️ 72°F → 🌧️ 65°F  │
│   10:00     11:00     12:00     │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/planning/weather-strip.tsx`

**Key Implementation:**
- Horizontal timeline
- Weather icon + temp per segment
- Time labels
- Scrollable if long
- Tap segment for details

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/WeatherStrip.kt`

**Implementation Notes:**
- Use `Row` with `HorizontalScroll`
- `Column` per segment (icon, temp, time)
- `LazyRow` for performance
- Divider between segments

**Expected API:**
```kotlin
@Composable
fun WeatherStrip(
  conditions: List<WeatherCondition>,
  modifier: Modifier = Modifier
)

data class WeatherCondition(
  val time: Instant,
  val temperature: Int,
  val icon: WeatherIcon,
  val rain: RainLevel?,
  val wind: WindLevel?
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/WeatherStrip.swift`

**Implementation Notes:**
- Use `HStack` with `ScrollView`
- `VStack` per segment (icon, temp, time)
- Divider between segments
- `LazyHStack` for performance

**Expected API:**
```swift
struct WeatherStrip: View {
  var conditions: [WeatherCondition]

  struct WeatherCondition {
    var time: Date
    var temperature: Int
    var icon: WeatherIcon
    var rain: RainLevel?
    var wind: WindLevel?
  }

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Background Color | Surface variant | surfaceVariant | Color.secondary.opacity(0.1) | `color.surfaceVariant` |
| Height | 60dp | 60.dp | 60 | `size.weatherStrip.height` |
| Segment Width | Min 80dp | 80.dp | 80 | `size.weatherStrip.segment` |
| Gap Between Segments | 0 | 0.dp | 0 | - |
| Divider | Vertical | VerticalDivider | Divider() | `separator.vertical` |
| Padding Horizontal | 16dp | 16.dp | 16 | `spacing.lg` |
| Padding Vertical | 8dp | 8.dp | 8 | `spacing.sm` |
| Icon Size | 20dp | 20.dp | 20 | `iconSize.sm` |
| Icon Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Temperature Font | Label medium | Typography.labelMedium | Font.caption | `typography.label` |
| Temperature Color | Text primary | onSurface | Color.primary | `color.textPrimary` |
| Time Font | Label small | Typography.labelSmall | Font.caption2 | `typography.fontSize.xs` |
| Time Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Corner Radius | 8dp | 8.dp | 8 | `borderRadius.md` |

## NOTES

### Segment Layout
- Icon: Top
- Temperature: Middle
- Time: Bottom
- Divider: Right edge (not last)

### Weather Icons
- Sunny: `sun`
- Partly cloudy: `cloud-sun`
- Cloudy: `cloud`
- Rain: `cloud-rain`
- Storm: `cloud-lightning`

### Time Format
- Relative: "Now", "10:00 AM", "11:00 AM"
- Absolute: "10:00", "11:00"
- Short: "10a", "11a" (compact)

### Interaction
- Tap segment: Show details modal
- Scroll horizontally: If many segments
- Drag scrubber: Preview weather at time

### Accessibility
- `accessibilityLabel`: "Weather at {time}, {temp}, {condition}"
- `accessibilityRole`: "group"
- Each segment accessible

### Platform Differences
- **Android:** `LazyRow` for performance
- **iOS:** `ScrollView` with `HStack`

### Dependencies
- `IconSymbol` atom
- `TemperatureBadge` molecule (optional)
- Weather condition data
- Time formatting utility
