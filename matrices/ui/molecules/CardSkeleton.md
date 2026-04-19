# CardSkeleton

## Component Classification
**Type:** Molecule
**Domain:** Loading
**Source:** `components/skeleton/card-skeleton.tsx`

## Purpose
Placeholder skeleton loading state for card components. Provides visual structure during content loading.

## COMPOSITION

### Child Components
- `Skeleton` (atom) - Base skeleton placeholder

### Layout Structure
```
┌─────────────────────────────────┐
│  ┌─────────────────────────┐    │
│  │ Header (Skeleton)       │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │                          │    │
│  │ Content Area (Skeleton)  │    │
│  │                          │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/skeleton/card-skeleton.tsx`

**Key Implementation:**
- Uses `Skeleton` atom for structure
- Fixed height/width constraints
- Shimmer/pulse animation timing
- Border radius matching actual cards

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/CardSkeleton.kt`

**Implementation Notes:**
- Use `Box` with `Surface` for card container
- Compose `Skeleton` atom instances
- Match card elevation/shadow system
- Use `shimmer()` modifier or custom animation

**Expected API:**
```kotlin
@Composable
fun CardSkeleton(
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/CardSkeleton.swift`

**Implementation Notes:**
- Use `VStack` with ` RoundedRectangle` background
- Compose `Skeleton` atom views
- Match card corner radius and shadow
- Use `.redacted(reason: .placeholder)` or custom shimmer

**Expected API:**
```swift
struct CardSkeleton: View {
  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Container Height | 120dp | 120.dp | 120 | `spacing.cardHeight` |
| Container Width | Full | FillMaxWidth | maxWidth: .infinity | - |
| Corner Radius | 8pt | 8.dp | 8 | `borderRadius.md` |
| Background Color | Surface variant | surfaceVariant | Color.secondary.opacity(0.1) | `color.surfaceVariant` |
| Shimmer Color | Pulse alpha | Animated alpha | Opacity animation | `color.shimmer` |
| Elevation | Card default | CardDefaults.elevation | .shadow(radius: 2) | `elevation.card` |
| Padding | 16dp | 16.dp | 16 | `spacing.lg` |

## NOTES

### Animation Timing
- Shimmer pulse: 1500ms duration, infinite repeat
- Fade-in on load: 300ms ease-out

### Accessibility
- `accessibilityLabel`: "Loading card content"
- `accessibilityRole`: "text" (semantic only)

### Variants
- Default: Standard card skeleton
- Compact: Reduced height for list items
- Tall: Extended height for detailed cards

### Platform Differences
- **Android:** Use Material3 `Card` container with `shimmer()` modifier
- **iOS:** Use `.redacted(reason: .placeholder)` for native blur effect

### Dependencies
- Requires `Skeleton` atom
- Token system for spacing, colors, elevation
- Animation system for shimmer effect
