# DiscoveryEmptyOverlay

## Component Classification
**Type:** Molecule
**Domain:** Discovery
**Source:** `components/discovery/discovery-empty-overlay.tsx`

## Purpose
Empty state overlay shown when route discovery returns no results. Provides guidance and CTAs for user action.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Empty state icon
- `EmptyState` (molecule) - Base empty state component

### Layout Structure
```
┌─────────────────────────────────┐
│                                 │
│         [Map Icon]              │
│                                 │
│     No routes found             │
│   Try adjusting your filters    │
│   or search a different area    │
│                                 │
│  ┌─────────────────────────┐   │
│  │   Clear All Filters     │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/discovery/discovery-empty-overlay.tsx`

**Key Implementation:**
- Conditionally rendered overlay
- `EmptyState` molecule composition
- Map-themed icon selection
- CTA button for filter reset

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/DiscoveryEmptyOverlay.kt`

**Implementation Notes:**
- Use `Box` with alignment over map content
- Compose `EmptyState` molecule
- Conditional visibility with `AnimatedVisibility`
- Map-themed icon name mapping

**Expected API:**
```kotlin
@Composable
fun DiscoveryEmptyOverlay(
  visible: Boolean,
  onClearFilters: () -> Unit,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/DiscoveryEmptyOverlay.swift`

**Implementation Notes:**
- Use `ZStack` layering over map
- Compose `EmptyState` view
- Conditional view with opacity transition
- SF Symbol for map icon

**Expected API:**
```swift
struct DiscoveryEmptyOverlay: View {
  var visible: Bool
  var onClearFilters: () -> Void

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Icon Name | map.outline | map.outline | map.fill | `icon.map` |
| Icon Size | 48dp | 48.dp | 48 | `iconSize.xl` |
| Icon Color | Primary copper | colorPrimary | Color.primary | `color.primary` |
| Headline | "No routes found" | Text string | Text | `literals.noRoutesFound` |
| Body | Multi-line | Text string | Text | `literals.emptyDiscoveryBody` |
| Background Color | Glass overlay | surface.copy(alpha=0.9) | Color.ultraThinMaterial | `color.glassOverlay` |
| Corner Radius | 16dp | 16.dp | 16 | `borderRadius.lg` |
| Padding | 24dp | 24.dp | 24 | `spacing.xl` |
| CTA Button | Primary | Button(primary) | Button(role: nil) | `button.primary` |

## NOTES

### Visibility Logic
- Show when discovery query returns empty
- Hide when results populate
- Fade transition on state change

### User Actions
- Primary CTA: "Clear All Filters"
- Dismiss on tap outside (optional)
- No other interactive elements

### Accessibility
- `accessibilityLabel`: "No routes found"
- `accessibilityHint`: "Adjust filters to find routes"
- `accessibilityRole`: "text"
- CTA button accessible action

### Platform Differences
- **Android:** Use `Surface` with elevated shadow
- **iOS:** Use `.background(.ultraThinMaterial)` for native blur

### Dependencies
- `EmptyState` molecule
- `IconSymbol` atom
- Discovery filter state
- Localization literals
