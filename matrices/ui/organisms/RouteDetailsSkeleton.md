# RouteDetailsSkeleton - Organism Matrix

**Component Source:** `react-native/components/skeleton/route-details-skeleton.tsx`

**Atomic Level:** Organism

**Domain:** Loading States / Routes

---

## COMPOSITION ANALYSIS

### Child Components
- **Internal Components:**
  - `LabelSkeleton` - Text placeholder
  - `WeatherBadgeSkeleton` - Weather badge placeholder
  - `CardSkeleton` - Card placeholder
- **Composition Pattern:**
  - Multi-section loading state
  - Configurable counts (weather badges, stat rows)
  - Optional route card display
  - Accessibility support (role="progressbar")

### Layout Structure
```
RouteDetailsSkeleton
├── Title Section
│   ├── LabelSkeleton (long, title)
│   └── Badge Row
│       ├── LabelSkeleton (short, badge 1)
│       └── LabelSkeleton (medium, badge 2)
├── Weather Strip Section
│   ├── LabelSkeleton (short, label)
│   └── Weather Strip (row)
│       └── WeatherBadgeSkeleton[] (weatherCount)
├── Stats Section
│   ├── LabelSkeleton (short, label)
│   └── Stat Rows[] (statRowCount)
│       ├── Icon Circle (View)
│       └── LabelSkeleton (short/medium)
└── Route Card Section (conditional)
    └── CardSkeleton (compact)
```

---

## STATE & BEHAVIOR

### Props Interface
```typescript
export type RouteDetailsSkeletonProps = {
  weatherCount?: number      // Default: 3
  statRowCount?: number      // Default: 3
  showRouteCard?: boolean    // Default: true
  style?: StyleProp<ViewStyle>
  testID?: string
}
```

### State Management
- **Props-Driven:**
  - No internal state
  - All display controlled via props
- **Derived:**
  - Array generation from `weatherCount` and `statRowCount`
  - Width variations for visual interest (short/medium/long)

### Accessibility
- **Role:** `progressbar`
- **Label:** "Loading route details"
- **Purpose:** Screen reader announcement for loading state

---

## TRANSLATION SOURCES

### React Native → Kotlin/Compose

**Skeleton Components:**
- RN: Custom `LabelSkeleton`, `WeatherBadgeSkeleton`, `CardSkeleton`
- Kotlin: `Box` shimmer effects or `LinearProgressIndicator`

**Arrays:**
- RN: `Array.from({ length: n })`
- Kotlin: List generation in composable

**Conditional Rendering:**
- RN: Conditional rendering in JSX
- Kotlin: `if (condition) { }` blocks

### React Native → Swift/SwiftUI

**Skeleton Components:**
- RN: Custom skeleton components
- Swift: `.redacted(reason: .placeholder)` modifier

**Arrays:**
- RN: `Array.from({ length: n })`
- Swift: `ForEach(0..<n)`

**Conditional Rendering:**
- RN: Conditional rendering in JSX
- Swift: `if condition { }` blocks

---

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin Token | Swift Token | Platform Fallback |
|----------|----------|--------------|-------------|-------------------|
| **Container Gap** | `semantic.space.lg` | `16.dp` | `16` | 16pt |
| **Title Section Gap** | `semantic.space.md` | `12.dp` | `12` | 12pt |
| **Badge Row Gap** | 8pt (StyleSheet) | `8.dp` | `8` | 8pt |
| **Section Gap** | 8pt (StyleSheet) | `8.dp` | `8` | 8pt |
| **Weather Strip Gap** | 8pt (StyleSheet) | `8.dp` | `8` | 8pt |
| **Stat Row Gap** | `semantic.space.sm` | `8.dp` | `8` | 8pt |
| **Icon Size** | 18x18pt | `18.dp` | `18` | 18pt |
| **Icon Radius** | `semantic.radius.sm` | `4.dp` | `4` | 4pt |
| **Icon Background** | `semantic.color.muted.default` | `MaterialTheme.colorScheme.surfaceVariant` | `.gray.opacity(0.3)` | #6B7280 |
| **Badge Height** | 20pt | `20.dp` | `20` | 20pt |
| **Badge Radius** | `semantic.radius.sm` | `4.dp` | `4` | 4pt |
| **Weather Label Height** | 14pt | `14.dp` | `14` | 14pt |
| **Stats Label Height** | 14pt | `14.dp` | `14` | 14pt |
| **Stat Label Height** | 14pt | `14.dp` | `14` | 14pt |
| **Container Padding** | 8pt vertical | `PaddingValues(vertical = 8.dp)` | `.padding(.vertical, 8)` | 8pt |

### Platform-Specific Adjustments

**Android:**
- Use `Shimmer` effect from `com.facebook.shimmer:shimmer`
- Or use `LinearProgressIndicator` with indeterminate mode
- Use `Box` with `alpha` animations for fade effect

**iOS:**
- Use `.redacted(reason: .placeholder)` for native skeleton effect
- Or use `.unredacted()` for non-skeleton elements
- Use `.shimmering()` modifier from third-party library

---

## NOTES

### Zero ESCALATE Tokens
- ✅ No platform-specific APIs requiring escalation
- ✅ Pure visual placeholder component
- ✅ Standard view composition
- ✅ Accessibility built-in

### Implementation Considerations

**Kotlin:**
```kotlin
@Composable
fun RouteDetailsSkeleton(
  weatherCount: Int = 3,
  statRowCount: Int = 3,
  showRouteCard: Boolean = true,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier
      .padding(vertical = 8.dp)
      .semantics { this.role = Role.ProgressBar },
    verticalArrangement = Arrangement.spacedBy(16.dp)
  ) {
    // Title Section
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
      LabelSkeleton(width = SkeletonWidth.Long)
      Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        LabelSkeleton(width = SkeletonWidth.Short, height = 20.dp)
        LabelSkeleton(width = SkeletonWidth.Medium, height = 20.dp)
      }
    }

    // Weather Strip Section
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
      LabelSkeleton(width = SkeletonWidth.Short, height = 14.dp)
      Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        repeat(weatherCount) {
          WeatherBadgeSkeleton(compact = true)
        }
      }
    }

    // Stats Section
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
      LabelSkeleton(width = SkeletonWidth.Short, height = 14.dp)
      repeat(statRowCount) { index ->
        Row(
          horizontalArrangement = Arrangement.spacedBy(8.dp),
          verticalAlignment = Alignment.CenterVertically
        ) {
          Box(
            modifier = Modifier
              .size(18.dp)
              .background(Color.Gray, RoundedCornerShape(4.dp))
          )
          LabelSkeleton(
            width = if (index == 0) SkeletonWidth.Medium else SkeletonWidth.Short,
            height = 14.dp
          )
        }
      }
    }

    // Route Card
    if (showRouteCard) {
      CardSkeleton(compact = true, showBestBadge = false, showWeatherBadge = false)
    }
  }
}
```

**Swift:**
```swift
struct RouteDetailsSkeleton: View {
  var weatherCount: Int = 3
  var statRowCount: Int = 3
  var showRouteCard: Bool = true

  var body: some View {
    VStack(spacing: 16) {
      // Title Section
      VStack(spacing: 12) {
        LabelSkeleton(width: .long)
        HStack(spacing: 8) {
          LabelSkeleton(width: .short, height: 20)
          LabelSkeleton(width: .medium, height: 20)
        }
      }

      // Weather Strip Section
      VStack(spacing: 8) {
        LabelSkeleton(width: .short, height: 14)
        HStack(spacing: 8) {
          ForEach(0..<weatherCount, id: \.self) { _ in
            WeatherBadgeSkeleton(compact: true)
          }
        }
      }

      // Stats Section
      VStack(spacing: 8) {
        LabelSkeleton(width: .short, height: 14)
        ForEach(0..<statRowCount, id: \.self) { index in
          HStack(spacing: 8) {
            Circle()
              .fill(Color.gray.opacity(0.3))
              .frame(width: 18, height: 18)
            LabelSkeleton(
              width: index == 0 ? .medium : .short,
              height: 14
            )
          }
        }
      }

      // Route Card
      if showRouteCard {
        CardSkeleton(
          compact: true,
          showBestBadge: false,
          showWeatherBadge: false
        )
      }
    }
    .padding(.vertical, 8)
    .accessibilityLabel("Loading route details")
    .accessibilityRole(.progressIndicator)
  }
}
```

### Shimmer Effects

**Kotlin (Facebook Shimmer):**
```kotlin
@Composable
fun ShimmerPlaceholder(
  modifier: Modifier = Modifier
) {
  val shimmerColors = listOf(
    Color.LightGray.copy(alpha = 0.3f),
    Color.LightGray.copy(alpha = 0.1f),
    Color.LightGray.copy(alpha = 0.3f)
  )

  val transition = rememberInfiniteTransition(label = "shimmer")
  val translateAnimation = transition.animateFloat(
    initialValue = 0f,
    targetValue = 1000f,
    animationSpec = infiniteRepeatable(
      animation = tween(1000),
      repeatMode = RepeatMode.Restart
    ), label = "shimmer"
  )

  Box(
    modifier = modifier
      .background(
        Brush.horizontalGradient(
          colors = shimmerColors,
          startX = translateAnimation.value,
          endX = translateAnimation.value + 500f
        )
      )
  )
}
```

**Swift (Native Redaction):**
```swift
struct SkeletonView: View {
  var body: some View {
    VStack {
      Text("Placeholder")
        .redacted(reason: .placeholder)
    }
  }
}
```

### Testing Notes
- Test skeleton rendering with various prop combinations
- Verify accessibility label is announced
- Test that skeleton matches final layout structure
- Verify shimmer effect is not too distracting
- Test with screen reader (VoiceOver/TalkBack)
- Verify performance with many skeleton elements

### Dependencies
- **Required:** LabelSkeleton component
- **Required:** WeatherBadgeSkeleton component
- **Required:** CardSkeleton component
- **Optional:** Shimmer animation library (or custom implementation)
- **Optional:** `.redacted()` modifier for iOS (native)

### Performance Considerations
- Skeleton animations should be lightweight
- Avoid complex shadows or gradients in skeletons
- Use opacity animations instead of position animations where possible
- Consider reducing animation frequency on low-end devices

### Accessibility
- **Critical:** Screen readers announce "Loading route details"
- Use `role="progressbar"` or `accessibilityRole="progressIndicator"`
- Ensure skeleton elements are not individually announced
- Test with VoiceOver (iOS) and TalkBack (Android)
