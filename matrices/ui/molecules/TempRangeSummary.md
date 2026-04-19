# TempRangeSummary

## Component Classification
**Type:** Molecule
**Domain:** Planning
**Source:** `components/planning/temp-range-summary.tsx`

## Purpose
Summary display of temperature range during route planning. Shows min/max temps.

## COMPOSITION

### Child Components
- `TemperatureBadge` (molecule) - Temperature indicators
- `IconSymbol` (atom) - Thermometer/weather icon

### Layout Structure
```
┌─────────────────────────────────┐
│  🌡️ 58°F - 72°F                 │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/planning/temp-range-summary.tsx`

**Key Implementation:**
- Thermometer icon
- Min/max temperature display
- Color-coded by comfort
- Unit toggle (°F/°C)

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/TempRangeSummary.kt`

**Implementation Notes:**
- Use `Row` with `Icon` and `Text`
- `AnnotatedString` for range format
- Temperature color mapping
- Unit conversion utility

**Expected API:**
```kotlin
@Composable
fun TempRangeSummary(
  minTemp: Temperature,
  maxTemp: Temperature,
  modifier: Modifier = Modifier
)

data class Temperature(
  val value: Double,
  val unit: TemperatureUnit
)

enum class TemperatureUnit { Fahrenheit, Celsius }
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/TempRangeSummary.swift`

**Implementation Notes:**
- Use `HStack` with SF Symbol and text
- `AttributedString` for range format
- Temperature color mapping
- Unit conversion utility

**Expected API:**
```swift
struct TempRangeSummary: View {
  var minTemp: Temperature
  var maxTemp: Temperature

  struct Temperature {
    var value: Double
    var unit: TemperatureUnit
  }

  enum TemperatureUnit { case fahrenheit, celsius }

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Icon Name | thermometer | device_thermostat | thermometer | `icon.temperature` |
| Icon Size | 18dp | 18.dp | 18 | `iconSize.sm` |
| Icon Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Text Color | Text primary | onSurface | Color.primary | `color.textPrimary` |
| Font Size | 14sp | 14.sp | 14 | `typography.fontSize.sm` |
| Font Weight | 400 (Regular) | FontWeight.Normal | .regular | `typography.weight.regular` |
| Gap (icon-text) | 8dp | 8.dp | 8 | `spacing.sm` |
| Range Separator | " - " | " - " | " – " | - |
| | | | | |
| **Cold (<50°F)** | | | | |
| Color | Info blue | colorInfo | Color.blue | `color.info` |
| | | | | |
| **Mild (50-75°F)** | | | | |
| Color | Success green | colorSuccess | Color.green | `color.success` |
| | | | | |
| **Warm (75-85°F)** | | | | |
| Color | Warning amber | colorWarning | Color.orange | `color.warning` |
| | | | | |
| **Hot (>85°F)** | | | | |
| Color | Danger red | colorError | Color.red | `color.danger` |

## NOTES

### Temperature Display
- Fahrenheit: "58°F - 72°F"
- Celsius: "14°C - 22°C"
- Range: Min to max

### Color Logic
- Use max temp for color (worst case)
- Gradient option: Min to max color
- Neutral: Use primary if range spans all

### Use Cases
- Planning status tab
- Weather strip
- Route details sheet
- Planning error context

### Accessibility
- `accessibilityLabel`: "Temperature range, {min} to {max}"
- `accessibilityRole`: "text"
- Icon decorative (hidden)

### Platform Differences
- **Android:** Material3 `Icon` + `Text`
- **iOS:** SF Symbol `thermometer`

### Dependencies
- `TemperatureBadge` molecule (optional)
- `IconSymbol` atom
- Weather data
- Temperature formatting utility
