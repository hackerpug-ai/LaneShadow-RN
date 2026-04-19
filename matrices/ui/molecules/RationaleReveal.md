# RationaleReveal

## Component Classification
**Type:** Molecule
**Domain:** Enrichment
**Source:** `components/enrichment/rationale-reveal.tsx`

## Purpose
Animated reveal component for route enrichment rationale. Shows why a route was selected.

## COMPOSITION

### Child Components
- None (text with animation)

### Layout Structure
```
┌─────────────────────────────────┐
│  ↓                              │
│  "Chosen for technical          │
│   challenge and scenic views"   │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/enrichment/rationale-reveal.tsx`

**Key Implementation:**
- Collapsible with arrow icon
- Expand/collapse animation
- Rationale text from enrichment API
- Optional "Learn more" link

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/RationaleReveal.kt`

**Implementation Notes:**
- Use `Column` with `AnimatedVisibility`
- `Icon` for expand/collapse indicator
- `rotate` animation for arrow
- `clickable` modifier for toggle

**Expected API:**
```kotlin
@Composable
fun RationaleReveal(
  rationale: String,
  expanded: Boolean,
  onToggle: () -> Unit,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/RationaleReveal.swift`

**Implementation Notes:**
- Use `VStack` with conditional view
- SF Symbol for chevron
- `.rotationEffect()` for arrow animation
- `@State` for expanded flag

**Expected API:**
```swift
struct RationaleReveal: View {
  var rationale: String
  var expanded: Bool
  var onToggle: () -> Void

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Background Color | Surface variant | surfaceVariant | Color.secondary.opacity(0.1) | `color.surfaceVariant` |
| Corner Radius | 8dp | 8.dp | 8 | `borderRadius.md` |
| Padding | 12dp | 12.dp | 12 | `spacing.md` |
| Font Size | 14sp | 14.sp | 14 | `typography.fontSize.sm` |
| Font Weight | 400 (Regular) | FontWeight.Normal | .regular | `typography.weight.regular` |
| Text Color | Text primary | onSurface | Color.primary | `color.textPrimary` |
| Chevron Icon | expand-more | expand_more | chevron.down | `icon.expand` |
| Chevron Size | 20dp | 20.dp | 20 | `iconSize.sm` |
| Chevron Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Arrow Rotation | 0° (collapsed) → 180° (expanded) | rotate | .rotationEffect | - |
| Animation Duration | 200ms | 200ms | 0.2s | `animation.duration.short` |

## NOTES

### Animation States
- **Collapsed:** Chevron points down, text hidden
- **Expanded:** Chevron points up, text visible
- Transition: Rotate + fade

### Interaction
- Tap to toggle expand/collapse
- Auto-expand on enrichment complete
- Collapse on route change

### Content Format
- Short: 1-2 sentences
- Plain language (no jargon)
- Example: "Chosen for technical challenge and scenic views"

### Accessibility
- `accessibilityLabel`: "Route rationale"
- `accessibilityHint`: "Tap to reveal why this route was chosen"
- `accessibilityRole`: "button"
- Expanded state announced

### Platform Differences
- **Android:** `Icon` with `rotate` modifier
- **iOS:** SF Symbol `chevron.down` with `.rotationEffect()`

### Dependencies
- Enrichment rationale data
- Animation system
- Color tokens
