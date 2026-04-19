# WeatherPillsRow

## Component Classification
**Type:** Molecule
**Domain:** Map
**Source:** `components/map/weather-pills-row.tsx`

## Purpose
Horizontal row of weather indicator pills. Shows temperature, wind, and rain.

## COMPOSITION

### Child Components
- `TemperatureBadge` (molecule) - Temperature pill
- `WindBadge` (molecule) - Wind pill
- `RainBadge` (molecule) - Rain pill

### Layout Structure
```
┌─────────────────────────────────┐
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ 72°F │ │ 10mph│ │Light │   │
│  └──────┘ └──────┘ └──────┘   │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/map/weather-pills-row.tsx`

**Key Implementation:**
- Horizontal row of badges
- Gap between pills
- Optional labels
- Wrap on overflow

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/WeatherPillsRow.kt`

**Implementation Notes:**
- Use `Row` with `Arrangement.spacedBy`
- Compose `TemperatureBadge`, `WindBadge`, `RainBadge`
- `FlowRow` for wrap behavior
- `HorizontalScroll` if needed

**Expected API:**
```kotlin
@Composable
fun WeatherPillsRow(
  temperature: Int,
  windLevel: WindLevel,
  rainLevel: RainLevel,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/WeatherPillsRow.swift`

**Implementation Notes:**
- Use `HStack` with spacing
- Compose `TemperatureBadge`, `WindBadge`, `RainBadge`
- Custom flow layout for wrap
- `ScrollView` if needed

**Expected API:**
```swift
struct WeatherPillsRow: View {
  var temperature: Int
  var windLevel: WindLevel
  var rainLevel: RainLevel

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Gap Between Pills | 8dp | 8.dp | 8 | `spacing.sm` |
| Wrap Behavior | Wrap | FlowRow | Custom flow | - |
| Max Pills Per Row | 3 | 3 | 3 | - |
| Scroll on Overflow | No | Optional | Optional | - |
| Background Color | Transparent | - | - | - |
| Padding | 0 | 0.dp | 0 | - |

## NOTES

### Pill Order
1. Temperature (left)
2. Wind (middle)
3. Rain (right)

### Overflow Handling
- **Default:** Wrap to next line
- **Alternative:** Horizontal scroll
- **Compact:** Hide less important

### Optional Pills
- Humidity (optional 4th)
- Visibility (optional 5th)
- Max 5 pills before scroll

### Use Cases
- Map overlay
- Weather strip
- Route card
- Planning status

### Accessibility
- `accessibilityLabel`: "Weather: {temp}, {wind}, {rain}"
- `accessibilityRole`: "group"
- Each pill individually accessible

### Platform Differences
- **Android:** `Row` with `Arrangement.spacedBy`
- **iOS:** `HStack` with `spacing()`

### Dependencies
- `TemperatureBadge` molecule
- `WindBadge` molecule
- `RainBadge` molecule
- Weather data
