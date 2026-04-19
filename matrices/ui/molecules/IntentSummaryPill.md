# IntentSummaryPill

## Component Classification
**Type:** Molecule
**Domain:** Discovery
**Source:** `components/discovery/intent-summary-pill.tsx`

## Purpose
Pill badge showing active search intent summary. Displays current search context in discovery.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Intent icon
- `Badge` (atom) - Base pill container

### Layout Structure
```
┌───────────────────────────────┐
│ 🌊 Coastal Scenic    [×]      │
└───────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/discovery/intent-summary-pill.tsx`

**Key Implementation:**
- Pill-shaped container (rounded)
- Intent icon
- Intent label text
- Dismiss icon/button
- Horizontal layout

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/IntentSummaryPill.kt`

**Implementation Notes:**
- Use `Surface` with pill shape or `AssistChip`
- `Row` layout with `Spacer`
- `Icon` for intent indicator
- `IconButton` for dismiss
- `Modifier.clip(RoundedCornerShape)`

**Expected API:**
```kotlin
@Composable
fun IntentSummaryPill(
  intent: SearchIntent,
  onDismiss: () -> Unit,
  modifier: Modifier = Modifier
)

data class SearchIntent(
  val label: String,
  val icon: String,
  val category: IntentCategory
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/IntentSummaryPill.swift`

**Implementation Notes:**
- Use `Capsule` background or `Badge`
- `HStack` with `Spacer`
- SF Symbol for icon
- `Button(role: .cancel)` for dismiss
- `.clipShape(Capsule())`

**Expected API:**
```swift
struct IntentSummaryPill: View {
  var intent: SearchIntent
  var onDismiss: () -> Void

  struct SearchIntent {
    var label: String
    var icon: String
    var category: IntentCategory
  }

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Background Color | Primary container | primaryContainer | Color.primary.opacity(0.1) | `color.primaryContainer` |
| Text Color | On primary container | onPrimaryContainer | Color.primary | `color.onPrimaryContainer` |
| Icon Color | On primary container | onPrimaryContainer | Color.primary | `color.onPrimaryContainer` |
| Height | 32dp | 32.dp | 32 | `size.pill.default` |
| Padding Horizontal | 12dp | 12.dp | 12 | `spacing.md` |
| Corner Radius | 16dp | 16.dp | 16 | `borderRadius.pill` |
| Font Size | 13sp | 13.sp | 13 | `typography.fontSize.sm` |
| Font Weight | 500 (Medium) | FontWeight.Medium | .medium | `typography.weight.medium` |
| Icon Size | 16dp | 16.dp | 16 | `iconSize.xs` |
| Icon-Text Gap | 6dp | 6.dp | 6 | `spacing.xs` |
| Dismiss Icon Size | 16dp | 16.dp | 16 | `iconSize.xs` |
| Dismiss Hit Box | 32dp | 32.dp | 32 | `size.touchTarget.min` |
| Elevation | 1 | 1.dp | 1 | `elevation.pill` |

## NOTES

### Intent Icons
- Coastal: `water` / `wave`
- Scenic: `landscape` / `photo`
- Technical: `road-variant` / `sign`
- Sunset: `weather-sunset` / `sun.max.fill`
- Waterfall: `water` / `drop`
- Elevation: `terrain` / `mountain.2`

### Display Logic
- Show when active intent exists
- Hide on dismiss
- Max 2 pills before scroll
- Truncate long labels: "Coastal Sce..."

### Interaction
- Tap dismiss to clear intent
- No expand behavior (summary only)
- Fade transition on add/remove

### Accessibility
- `accessibilityLabel`: "{intent}, tap to remove"
- `accessibilityRole`: "button"
- `accessibilityHint`: "Removes search filter"
- Dismiss button accessible

### Platform Differences
- **Android:** Material3 `AssistChip` with trailing icon
- **iOS:** Custom capsule with `HStack`

### Dependencies
- `IconSymbol` atom
- `Badge` atom (optional)
- Intent state
- Color tokens (primary container)
