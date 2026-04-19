# LabelSkeleton

## Component Classification
**Type:** Molecule
**Domain:** Loading
**Source:** `components/skeleton/label-skeleton.tsx`

## Purpose
Placeholder skeleton for text labels during loading. Provides visual structure for label content.

## COMPOSITION

### Child Components
- `Skeleton` (atom) - Base skeleton placeholder

### Layout Structure
```
┌─────────────────────────────────┐
│  ████████████████████           │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/skeleton/label-skeleton.tsx`

**Key Implementation:**
- Width prop for variable sizing
- Fixed height for label line
- Shimmer/pulse animation
- Border radius matching text

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/LabelSkeleton.kt`

**Implementation Notes:**
- Use `Box` with `shimmer()` modifier
- Width parameter (default: full)
- Fixed height for label
- `RoundedCornerShape` for text-like corners

**Expected API:**
```kotlin
@Composable
fun LabelSkeleton(
  width: Dp = Dp.Unspecified, // or specific width
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/LabelSkeleton.swift`

**Implementation Notes:**
- Use `RoundedRectangle` with `.redacted(reason: .placeholder)`
- Width parameter (default: infinity)
- Fixed height for label
- `.opacity()` animation

**Expected API:**
```swift
struct LabelSkeleton: View {
  var width: CGFloat? = nil // nil = full

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Height | 16dp | 16.dp | 16 | `typography.lineHeight.md` |
| Width | Prop (default full) | Dp parameter | CGFloat parameter | - |
| Corner Radius | 4dp | 4.dp | 4 | `borderRadius.sm` |
| Background Color | Surface variant | surfaceVariant | Color.secondary.opacity(0.1) | `color.surfaceVariant` |
| Shimmer Color | Pulse alpha | Animated alpha | Opacity animation | `color.shimmer` |
| Animation Duration | 1500ms | 1500ms | 1.5s | `animation.duration.slow` |

## NOTES

### Width Variants
- **Small:** 80dp (short label)
- **Medium:** 120dp (medium label)
- **Full:** FillMaxWidth (full label)
- **Custom:** Prop-based width

### Use Cases
- Card titles
- List item labels
- Form field labels
- Metadata labels

### Accessibility
- `accessibilityLabel`: "Loading label"
- `accessibilityRole`: "text"
- Hidden from accessibility when replaced

### Platform Differences
- **Android:** `Box` with `shimmer()` modifier
- **iOS:** `.redacted(reason: .placeholder)` for native blur

### Dependencies
- `Skeleton` atom
- Animation system
- Color tokens
