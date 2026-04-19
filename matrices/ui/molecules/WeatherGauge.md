# WeatherGauge Component Matrix

**Component Path:** `react-native/components/map/weather-gauge.tsx`
**Atomic Level:** Molecule
**Domain:** Map
**Last Updated:** 2025-01-18

---

## COMPOSITION

**React Native Source:**
```tsx
import { StyleSheet, Text, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
```

**Child Dependencies:**
- None (uses only React Native primitives)

**Layout Structure:**
```
WeatherGauge (absolute positioned)
└── Gauge Container (glass-morphic card)
    ├── Wind Metric (conditional)
    │   ├── Value Circle
    │   │   └── Wind Speed Text
    │   └── Unit Label ("MPH")
    ├── Rain Metric (conditional, with top border)
    │   ├── Value Circle (accented if intensity > 2mm/hr)
    │   │   └── Rain Intensity Text
    │   └── Unit Label ("MM/HR")
    └── Temperature Metric (conditional, with top border)
        ├── Value Circle
        │   └── Temperature Text
        └── Unit Label ("°F")
```

---

## TRANSLATION SOURCES

### Kotlin/Compose

**Dependencies:**
- `androidx.compose.foundation.layout.Column`
- `androidx.compose.foundation.layout.Row`
- `androidx.compose.material3.Surface`
- `androidx.compose.material3.Text`

**Platform Equivalents:**
- `View` → `Column` or `Row`
- `Text` → `Text`
- `StyleSheet` → `Modifier` chain

### Swift/SwiftUI

**Dependencies:**
- `SwiftUI.VStack`
- `SwiftUI.HStack`
- `SwiftUI.Text`

**Platform Equivalents:**
- `View` → `VStack` or `HStack`
- `Text` → `Text`
- `StyleSheet` → View modifier chain

---

## STYLE PROPERTIES MATRIX

| Element | Property | Token Path (Light) | Token Path (Dark) | Platform Mapping |
|---------|----------|-------------------|------------------|------------------|
| **Gauge Background** | Color | `semantic.color.surfaceVariant.default` | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` |
| **Gauge Radius** | Corner radius | `12` (12pt) | `12` (12pt) | `12.dp` / `cornerRadius: 12` |
| **Gauge Padding** | Spacing | `8` (8pt) | `8` (8pt) | `8.dp` / `padding: 8` |
| **Gauge Min Width** | Dimension | `56` (56pt) | `56` (56pt) | `56.dp` / `frame(minWidth: 56)` |
| **Metric Gap** | Spacing | `8` (8pt) | `8` (8pt) | `8.dp` / `spacing: 8` |
| **Metric Separator** | Border width | `1` (1pt) | `1` (1pt) | `1.dp` / `strokeWidth: 1` |
| **Metric Separator** | Border color | `rgba(255,255,255,0.1)` | `rgba(255,255,255,0.1)` | `Color.White.copy(alpha = 0.1f)` |
| **Metric Separator** | Border style | `dotted` | `dotted` | Custom (platform-specific) |
| **Metric Separator** | Top padding | `8` (8pt) | `8` (8pt) | `8.dp` / `padding(.top, 8)` |
| **Metric Separator** | Top margin | `8` (8pt) | `8` (8pt) | `8.dp` / `margin(.top, 8)` |
| **Value Circle Size** | Dimension | `44 × 44` (44pt) | `44 × 44` (44pt) | `44.dp` / `frame(width: 44, height: 44)` |
| **Value Circle Radius** | Corner radius | `22` (22pt, half of size) | `22` (22pt) | `22.dp` / `cornerRadius: 22` |
| **Value Circle Border** | Width | `1.5` (1.5pt) | `1.5` (1.5pt) | `1.5.dp` / `strokeWidth: 1.5` |
| **Value Circle Border** | Default color | `semantic.color.onSurface.muted` | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` |
| **Value Circle Border** | Accent color | `semantic.color.primary.default` | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` |
| **Value Text Font** | Typography | `fontSize: 16, fontWeight: 700` | `fontSize: 16, fontWeight: 700` | `Typography.titleSmall` / `Font.headline.weight(.bold)` |
| **Value Text Color** | Color | `semantic.color.onSurface.default` | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` |
| **Value Text Line Height** | Line spacing | `20` (20pt) | `20` (20pt) | `20.sp` / `lineSpacing: 2` |
| **Unit Label Font** | Typography | `fontSize: 9, fontWeight: 600` | `fontSize: 9, fontWeight: 600` | `Custom (9sp)` / `Font.caption2.weight(.semibold)` |
| **Unit Label Color** | Color | `semantic.color.onSurface.muted` | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` |
| **Unit Letter Spacing** | Tracking | `0.5` (0.5pt) | `0.5` (0.5pt) | `0.5.sp` / `tracking: 0.5` |
| **Unit Text Transform** | Case | `uppercase` | `uppercase` | `toUpperCase()` / `.uppercased()` |
| **Unit Top Margin** | Spacing | `2` (2pt) | `2` (2pt) | `2.dp` / `margin(.top, 2)` |

---

## IMPLEMENTATION NOTES

### Data Structure

**WeatherData Type:**
```tsx
type WeatherData = {
  wind: { speed: number } | null      // mph
  rain: { intensity: number } | null  // mm/hr
  temperature: { value: number } | null // fahrenheit
}
```

### Conditional Rendering

**Early Return:**
```tsx
if (!hasAnyData) {
  return null
}
```

The component returns `null` when all weather data is `null` to avoid rendering an empty gauge.

### Metric Separators

**Dotted Border Pattern:**
- Only applied when there's a preceding metric (wind before rain, rain/ wind before temperature)
- Creates visual separation between weather metrics
- Uses `borderStyle: 'dotted'` for subtle visual separation

**Platform-Specific Implementation:**
- **Android:** Use `dashedBorder` modifier or custom `drawBehind` modifier
- **iOS:** Use `strokeStyle = .dot` with `Shape` protocol

### Value Formatting

**Wind Speed:**
```tsx
const formatWind = (speed: number) => Math.round(speed)
```
- Rounds to nearest integer
- Example: `12.3 → 12`, `15.8 → 16`

**Rain Intensity:**
```tsx
const formatRain = (intensity: number) =>
  intensity < 1 ? intensity.toFixed(2) : intensity.toFixed(1)
```
- Below 1mm/hr: 2 decimal places (e.g., `0.45`)
- 1mm/hr and above: 1 decimal place (e.g., `2.3`, `10.5`)

**Temperature:**
```tsx
const formatTemp = (temp: number) => Math.round(temp)
```
- Rounds to nearest integer
- Example: `72.3 → 72`, `68.8 → 69`

### Accent Coloring

**Rain Intensity Threshold:**
```tsx
borderColor: data.rain!.intensity > 2 ? accentColor : mutedColor
```

When rain intensity exceeds 2mm/hr, the value circle border switches from muted to primary (copper) to indicate significant rainfall.

### Positioning

**Absolute Positioning:**
```tsx
position: 'absolute'
top: 0
right: 0
```

The gauge is positioned at the top-right corner of its container, typically overlaying map content.

### Layout Pattern

**Metric Column:**
```
┌─────────────────┐
│  ┌───────────┐  │
│  │     12    │  │ ← Wind (no top border)
│  │    MPH    │  │
│  └───────────┘  │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │ ← Dotted separator
│  ┌───────────┐  │
│  │   1.2     │  │ ← Rain (with top border)
│  │  MM/HR    │  │
│  └───────────┘  │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │ ← Dotted separator
│  ┌───────────┐  │
│  │    72     │  │ ← Temperature (with top border)
│  │    °F     │  │
│  └───────────┘  │
└─────────────────┘
```

---

## PLATFORM-SPECIFIC CONSIDERATIONS

### Android (Kotlin/Compose)

**Dotted Border:**
```kotlin
// Using drawBehind modifier
Modifier.drawBehind {
  val strokeWidth = 1.dp.toPx()
  val dashPath = Path().apply {
    moveTo(0f, 0f)
    lineTo(size.width, 0f)
  }
  drawPath(
    path = dashPath,
    color = Color.White.copy(alpha = 0.1f),
    style = Stroke(
      width = strokeWidth,
      pathEffect = PathEffect.dashPathEffect(floatArrayOf(4f, 4f))
    )
  )
}
```

**Value Circle:**
```kotlin
Box(
  modifier = Modifier
    .size(44.dp)
    .background(
      color = Color.Transparent,
      shape = CircleShape
    )
    .border(
      width = 1.5.dp,
      color = if (rainIntensity > 2) primaryColor else mutedColor,
      shape = CircleShape
    )
    .wrapContentSize(Alignment.Center)
) {
  Text(text = formattedValue, style = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Bold))
}
```

### iOS (Swift/SwiftUI)

**Dotted Border:**
```swift
struct DottedLine: Shape {
  func path(in rect: CGRect) -> Path {
    var path = Path()
    path.move(to: CGPoint(x: 0, y: 0))
    path.addLine(to: CGPoint(x: rect.width, y: 0))
    return path
  }
}

// Usage
DottedLine()
  .stroke(style: StrokeStyle(lineWidth: 1, dash: [4, 4]))
  .foregroundColor(Color.white.opacity(0.1))
```

**Value Circle:**
```swift
ZStack {
  Circle()
    .stroke(rainIntensity > 2 ? Color.primary : Color.onSurfaceMuted, lineWidth: 1.5)
    .frame(width: 44, height: 44)

  Text(formattedValue)
    .font(.system(size: 16, weight: .bold))
}
```

**Unit Label:**
```swift
Text("MPH")
  .font(.system(size: 9, weight: .semibold))
  .foregroundColor(Color.onSurfaceMuted)
  .tracking(0.5)
  .textCase(.uppercase)
```

---

## ACCESSIBILITY

**Accessibility Labels:**
- Wind: `"Wind speed ${speed} miles per hour"`
- Rain: `"Rain intensity ${intensity} millimeters per hour"`
- Temperature: `"Temperature ${value} degrees fahrenheit"`

**Accessibility Role:**
- Container: `role = "summary"` or `.accessibilityElement(children: .combine)`

**Accessibility Value:**
- Gauge presents multiple weather metrics as a single summary

---

## USAGE EXAMPLES

### Basic Usage

```tsx
<WeatherGauge
  data={{
    wind: { speed: 12.3 },
    rain: { intensity: 0.8 },
    temperature: { value: 72 }
  }}
  testID="weather-gauge"
/>
```

### Partial Data

```tsx
<WeatherGauge
  data={{
    wind: { speed: 15.7 },
    rain: null,
    temperature: { value: 68 }
  }}
  testID="weather-gauge"
/>
```

### Empty Data (Hidden)

```tsx
<WeatherGauge
  data={{
    wind: null,
    rain: null,
    temperature: null
  }}
  testID="weather-gauge"
/>
// Returns null, nothing rendered
```

---

## ESCALATE

None. All required tokens and platform equivalents are available.

**Note:** Dotted border implementation requires platform-specific custom drawing code. No native equivalent exists in standard component libraries.
