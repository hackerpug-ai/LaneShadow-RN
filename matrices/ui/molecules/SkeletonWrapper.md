# SkeletonWrapper

## Component Classification
**Type:** Molecule
**Domain:** Loading
**Source:** `components/skeleton/skeleton-wrapper.tsx`

## Purpose
Wrapper component that shows skeleton placeholder while loading, then reveals content when ready.

## COMPOSITION

### Child Components
- `Skeleton` (atom) - Loading placeholder
- Content (children) - Real content when loaded

### Layout Structure
```
Loading:
┌─────────────────────────────────┐
│  ████████████████████           │
│  ████████████████████           │
└─────────────────────────────────┘

Loaded:
┌─────────────────────────────────┐
│  Actual Content Here            │
│  More Content Here              │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/skeleton/skeleton-wrapper.tsx`

**Key Implementation:**
- Conditional render (loading vs content)
- `Skeleton` composition
- Fade transition between states
- Preserve layout to avoid shift

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/SkeletonWrapper.kt`

**Implementation Notes:**
- Use `Box` with conditional content
- `Crossfade` for smooth transition
- `Skeleton` atom when loading
- `@Composable content` when loaded

**Expected API:**
```kotlin
@Composable
fun SkeletonWrapper(
  loading: Boolean,
  modifier: Modifier = Modifier,
  content: @Composable () -> Unit
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/SkeletonWrapper.swift`

**Implementation Notes:**
- Use `ZStack` with conditional views
- `transition(.opacity)` for fade
- `Skeleton` atom when loading
- `@ViewBuilder content` when loaded

**Expected API:**
```swift
struct SkeletonWrapper<Content: View>: View {
  var loading: Bool
  var content: Content

  init(loading: Bool, @ViewBuilder content: () -> Content) {
    self.loading = loading
    self.content = content()
  }

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Transition Duration | 300ms | 300ms | 0.3s | `animation.duration.medium` |
| Transition Curve | Ease-in-out | EaseInOut | .easeInOut | `animation.curve.easeInOut` |
| Skeleton Match | True (preserve layout) | Match content dimensions | Match content frame | - |
| Fade Out Delay | 0ms | 0ms | 0s | - |
| Fade In Delay | 50ms | 50ms | 0.05s | - |

## NOTES

### Animation Sequence
1. Loading true: Show skeleton
2. Loading false: Fade out skeleton (300ms)
3. Delay: 50ms overlap
4. Fade in content (300ms)

### Layout Preservation
- Skeleton should match content dimensions
- Prevents layout shift on load
- Use placeholder data for sizing
- Skeleton opacity: 0.6 for subtlety

### Use Cases
- Card content loading
- List items
- Detail views
- Any async content

### Accessibility
- `accessibilityLabel`: "Loading" (when loading)
- Content accessible when shown
- `accessibilityRole`: "text" (loading only)

### Platform Differences
- **Android:** `Crossfade` for smooth transition
- **iOS:** `withAnimation` + `.opacity()`

### Dependencies
- `Skeleton` atom
- Animation system
- Content dimensions
