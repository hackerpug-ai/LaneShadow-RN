# HighlightTagsStagger

## Component Classification
**Type:** Molecule
**Domain:** Enrichment
**Source:** `components/enrichment/highlight-tags-stagger.tsx`

## Purpose
Staggered animated fade-in for highlight tags (badges) during enrichment. Progressive disclosure of route highlights.

## COMPOSITION

### Child Components
- `Badge` (atom) - Individual highlight tags

### Layout Structure
```
┌─────────────────────────────────┐
│                                 │
│  [Technical]  [Sweeping]        │
│    (fade 0ms)    (fade 100ms)   │
│                                 │
│  [Elevated]                     │
│    (fade 200ms)                 │
│                                 │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/enrichment/highlight-tags-stagger.tsx`

**Key Implementation:**
- Array of tag strings
- Staggered delay per tag index
- Wrap behavior (flex wrap)
- Badge composition per tag

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/HighlightTagsStagger.kt`

**Implementation Notes:**
- Use `Row` with `horizontalArrangement = Arrangement.spacedBy`
- `LazyRow` for scrolling if many tags
- `AnimatedVisibility` with delay per item
- `Badge` or `FilterChip` for tags

**Expected API:**
```kotlin
@Composable
fun HighlightTagsStagger(
  tags: List<String>,
  modifier: Modifier = Modifier,
  staggerDelay: Int = 100 // ms per tag
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/HighlightTagsStagger.swift`

**Implementation Notes:**
- Use `LazyVGrid` or wrap-aware `FlowLayout`
- Stagger with `.animation(.easeInOut.delay())` per tag
- `Badge` or capsule text for tags
- Custom layout for wrap behavior

**Expected API:**
```swift
struct HighlightTagsStagger: View {
  var tags: [String]
  var staggerDelay: Double = 0.1 // seconds per tag

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Badge Background | Secondary surface | surfaceVariant | Color.secondary.opacity(0.1) | `color.surfaceVariant` |
| Badge Text Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Badge Height | 28dp | 28.dp | 28 | `size.badge.md` |
| Badge Padding | 8dp h, 4dp v | 8.dp, 4.dp | 8, 4 | `spacing.sm`, `spacing.xs` |
| Corner Radius | 14dp | 14.dp | 14 | `borderRadius.pill` |
| Font Size | 12sp | 12.sp | 12 | `typography.fontSize.xs` |
| Font Weight | 500 (Medium) | FontWeight.Medium | .medium | `typography.weight.medium` |
| Gap Between Badges | 8dp | 8.dp | 8 | `spacing.sm` |
| Animation Duration | 300ms | 300ms | 0.3s | `animation.duration.medium` |
| Animation Curve | Ease-out | EaseOutCubic | .easeOut | `animation.curve.easeOut` |

## NOTES

### Stagger Timing
- Tag 1: 0ms delay
- Tag 2: 100ms delay
- Tag 3: 200ms delay
- Tag N: (N-1) × 100ms delay

### Layout Behavior
- Horizontal flow with wrapping
- Max tags before scroll: ~8
- Scroll indicator if overflow

### Tag Content
- Examples: "Technical", "Sweeping", "Elevated", "Scenic"
- From enrichment API highlights
- Max 3-5 tags recommended

### Accessibility
- `accessibilityLabel`: "Highlights: {tag1}, {tag2}"
- `accessibilityRole`: "text"
- Announce as list

### Platform Differences
- **Android:** `Row` with wrap or `LazyRow` for scroll
- **iOS:** Custom flow layout or `LazyVGrid` with columns

### Dependencies
- `Badge` atom
- Enrichment highlights data
- Animation system
- Spacing tokens
