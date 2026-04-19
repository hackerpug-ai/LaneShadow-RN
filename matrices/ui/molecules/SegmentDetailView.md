# SegmentDetailView

## Component Classification
**Type:** Molecule
**Domain:** Planning
**Source:** `components/planning/segment-detail-view.tsx`

## Purpose
Detail view for route segments during planning. Shows segment-specific stats and info.

## COMPOSITION

### Child Components
- `StatRow` (molecule) - Segment statistics
- `IconSymbol` (atom) - Segment type icon

### Layout Structure
```
┌─────────────────────────────────┐
│  🏞️ Technical Challenge         │
│                                 │
│  ┌─────────┐  ┌─────────┐      │
│  │  📏 12mi │  │  ⬆️ 2400│      │
│  └─────────┘  └─────────┘      │
│                                 │
│  ┌─────────┐  ┌─────────┐      │
│  │  🕐 45m │  │  🏔️ Med │      │
│  └─────────┘  └─────────┘      │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/planning/segment-detail-view.tsx`

**Key Implementation:**
- Segment header with icon
- Grid of stat rows
- Segment metadata (type, difficulty)
- Expandable details

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/SegmentDetailView.kt`

**Implementation Notes:**
- Use `Column` with `Rows` for layout
- Compose `StatRow` instances
- `LazyVerticalGrid` for stat layout
- `Icon` for segment type

**Expected API:**
```kotlin
@Composable
fun SegmentDetailView(
  segment: RouteSegment,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/SegmentDetailView.swift`

**Implementation Notes:**
- Use `VStack` with `HStack` for layout
- Compose `StatRow` views
- `LazyVGrid` for stat layout
- SF Symbol for segment type

**Expected API:**
```swift
struct SegmentDetailView: View {
  var segment: RouteSegment

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Background Color | Surface | surface | Color(.systemBackground) | `color.surface` |
| Corner Radius | 8dp | 8.dp | 8 | `borderRadius.md` |
| Padding | 16dp | 16.dp | 16 | `spacing.lg` |
| Header Font | Title medium | Typography.titleMedium | Font.headline | `typography.title` |
| Header Color | Text primary | onSurface | Color.primary | `color.textPrimary` |
| Icon Size | 24dp | 24.dp | 24 | `iconSize.md` |
| Icon Color | Primary copper | colorPrimary | Color.primary | `color.primary` |
| Stat Grid Columns | 2 | 2 | 2 | - |
| Stat Gap | 8dp | 8.dp | 8 | `spacing.sm` |
| Stat Row Gap | 12dp | 12.dp | 12 | `spacing.md` |
| Divider | Separator | HorizontalDivider | Divider | `separator.default` |

## NOTES

### Segment Types
- **Technical:** Challenge icon
- **Scenic:** Landscape icon
- **Elevation:** Mountain icon
- **Traffic:** Car icon
- **Weather:** Sun/cloud icon

### Stats Displayed
- Distance (mi/km)
- Duration (time)
- Elevation gain (ft/m)
- Difficulty level
- Traffic level
- Weather condition

### Layout Options
- Compact: 2 columns
- Detailed: 1 column, full labels
- Minimal: Icon + value only

### Interaction
- Tap segment to highlight on map
- Long-press for options
- Swipe to navigate segments

### Accessibility
- `accessibilityLabel`: "{segment.type} segment, {distance}, {duration}"
- `accessibilityRole`: "summary"
- Stats individually accessible

### Platform Differences
- **Android:** `LazyVerticalGrid` for responsive layout
- **iOS:** `LazyVGrid` with grid columns

### Dependencies
- `StatRow` molecule
- `IconSymbol` atom
- Route segment data
- Grid layout system
