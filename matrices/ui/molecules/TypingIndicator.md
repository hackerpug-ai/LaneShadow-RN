# TypingIndicator

## Component Classification
**Type:** Molecule
**Domain:** Chat
**Source:** `components/chat/typing-indicator.tsx`

## Purpose
Animated indicator showing AI is typing/responding. Three-dot bounce animation.

## COMPOSITION

### Child Components
- None (pure animation)

### Layout Structure
```
┌─────────────────────────────────┐
│                                 │
│     ●   ●   ●                   │
│    (bounce animation)           │
│                                 │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/chat/typing-indicator.tsx`

**Key Implementation:**
- Three circular dots
- Staggered bounce animation
- Opacity fade in/out
- Compact size

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/TypingIndicator.kt`

**Implementation Notes:**
- Use `Row` with 3 `Circle` composable
- `InfiniteTransition` for infinite animation
- Staggered `animateFloatAsSpec` per dot
- `alpha` and `scale` animated

**Expected API:**
```kotlin
@Composable
fun TypingIndicator(
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/TypingIndicator.swift`

**Implementation Notes:**
- Use `HStack` with 3 `Circle` views
- `.animation()` with staggered delays
- `.opacity()` and `.scaleEffect()`
- Repeat forever

**Expected API:**
```swift
struct TypingIndicator: View {
  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Dot Size | 8dp | 8.dp | 8 | `size.typingDot` |
| Dot Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Dot Shape | Circle | CircleShape | Circle() | `shape.circle` |
| Gap Between Dots | 4dp | 4.dp | 4 | `spacing.xs` |
| Bounce Height | 4dp | 4.dp | 4 | `motion.typingBounce` |
| Animation Duration | 400ms per cycle | 400ms | 0.4s | `animation.duration.typing` |
| Animation Curve | Ease-in-out | EaseInOut | .easeInOut | `animation.curve.easeInOut` |
| Stagger Delay | 100ms per dot | 100ms | 0.1s | `animation.stagger.typing` |
| Fade Opacity Range | 0.4 - 1.0 | 0.4f - 1.0f | 0.4 - 1.0 | - |
| Container Width | 40dp | 40.dp | 40 | `size.typingContainer` |
| Container Height | 12dp | 12.dp | 12 | `size.typingContainer` |

## NOTES

### Animation Timing
- Dot 1: 0ms delay
- Dot 2: 100ms delay
- Dot 3: 200ms delay
- Cycle repeats: 400ms total

### Visual States
- **Default:** 3 dots, bouncing
- **Hidden:** Fade out, remove
- **Compact:** Smaller dots for tight spaces

### Use Cases
- Chat input while AI responds
- Route planning status
- Loading thoughts in reasoning card
- Any async text generation

### Layout Options
- Inline: With message bubbles
- Centered: Full-width indicator
- Compact: For list items

### Accessibility
- `accessibilityLabel`: "Typing" or "Responding"
- `accessibilityRole`: "progressbar" (indeterminate)
- Live region updates
- Hidden from screen readers when complete

### Platform Differences
- **Android:** Compose `InfiniteTransition`
- **iOS:** SwiftUI `.animation(.easeInOut.repeatForever())`

### Dependencies
- Animation system
- Color tokens
- Spacing tokens
