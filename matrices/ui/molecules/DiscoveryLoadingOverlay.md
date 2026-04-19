# DiscoveryLoadingOverlay

## Component Classification
**Type:** Molecule
**Domain:** Discovery
**Source:** `components/discovery/discovery-loading-overlay.tsx`

## Purpose
Loading overlay shown during route discovery search. Provides visual feedback during async queries.

## COMPOSITION

### Child Components
- `Progress` (atom) - Indeterminate progress indicator

### Layout Structure
```
┌─────────────────────────────────┐
│                                 │
│         [Spinner]               │
│                                 │
│    Searching for routes...      │
│                                 │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/discovery/discovery-loading-overlay.tsx`

**Key Implementation:**
- Overlay on top of map/content
- `Progress` indeterminate spinner
- Loading message text
- Semi-transparent backdrop

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/DiscoveryLoadingOverlay.kt`

**Implementation Notes:**
- Use `Box` with `Surface` background
- `CircularProgressIndicator` for spinner
- Centered content with `Alignment.Center`
- Backdrop with `alpha` modifier

**Expected API:**
```kotlin
@Composable
fun DiscoveryLoadingOverlay(
  visible: Boolean,
  message: String? = null,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/DiscoveryLoadingOverlay.swift`

**Implementation Notes:**
- Use `ZStack` layering
- `ProgressView()` for native spinner
- Center alignment with `VStack` and `Spacer`
- Backdrop with `.background(.ultraThinMaterial)`

**Expected API:**
```swift
struct DiscoveryLoadingOverlay: View {
  var visible: Bool
  var message: String? = nil

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Spinner Size | 40dp | 40.dp | 40 | `size.progress.medium` |
| Spinner Color | Primary copper | colorPrimary | Color.primary | `color.primary` |
| Message Font | Body | Typography.bodyMedium | Font.body | `typography.body` |
| Message Color | Text primary | onSurface | Color.primary | `color.textPrimary` |
| Background Color | Surface 90% alpha | surface.copy(alpha=0.9) | Color.ultraThinMaterial | `color.glassOverlay` |
| Corner Radius | 0 (full) | 0.dp | 0 | - |
| Padding | 24dp | 24.dp | 24 | `spacing.xl` |
| Gap (spinner-text) | 16dp | 16.dp | 16 | `spacing.lg` |

## NOTES

### Animation Timing
- Fade in: 200ms ease-out
- Spinner: continuous rotation
- Fade out: 150ms ease-in

### Visibility Logic
- Show when discovery query starts
- Hide when results return or error occurs
- Minimum display time (500ms) to avoid flicker

### Accessibility
- `accessibilityLabel`: "Loading routes"
- `accessibilityRole`: "progressbar"
- `accessibilityValue`: "indeterminate"
- Announcement when shown/hidden

### Platform Differences
- **Android:** Material3 `CircularProgressIndicator`
- **iOS:** Native `ProgressView()` with circular style

### Dependencies
- `Progress` atom
- Discovery state (loading flag)
- Localization literals (default loading message)
