# DownloadProgressIndicator

## Component Classification
**Type:** Molecule
**Domain:** Offline / Model
**Source:** `components/offline/download-progress-indicator.tsx` (shared with model)

## Purpose
Progress indicator for downloads (offline regions or models). Shows numeric percentage and visual progress.

## COMPOSITION

### Child Components
- `Progress` (atom) - Linear or circular progress

### Layout Structure
```
┌─────────────────────────────────┐
│                                 │
│         ████████  45%           │
│    Downloading region...        │
│                                 │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/offline/download-progress-indicator.tsx`

**Key Implementation:**
- Progress bar (linear) or spinner (circular)
- Percentage text overlay
- Status message
- Optional remaining time estimate

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/DownloadProgressIndicator.kt`

**Implementation Notes:**
- Use `LinearProgressIndicator` or `CircularProgressIndicator`
- `Text` composable for percentage
- `Column` layout for vertical stacking
- Support for determinate and indeterminate states

**Expected API:**
```kotlin
@Composable
fun DownloadProgressIndicator(
  progress: Float?, // null for indeterminate
  message: String? = null,
  style: ProgressStyle = ProgressStyle.Linear,
  modifier: Modifier = Modifier
)

enum class ProgressStyle { Linear, Circular }
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/DownloadProgressIndicator.swift`

**Implementation Notes:**
- Use `ProgressView()` for linear or circular
- `Text` overlay for percentage
- `VStack` for layout
- `.progressViewStyle()` modifier

**Expected API:**
```swift
struct DownloadProgressIndicator: View {
  var progress: Double? // nil for indeterminate
  var message: String? = nil
  var style: ProgressViewStyle = .linear

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Progress Height | 4dp | 4.dp | 4 | `size.progress.thin` |
| Progress Color | Primary copper | colorPrimary | Color.primary | `color.primary` |
| Track Color | Surface variant | surfaceVariant | Color.gray.opacity(0.3) | `color.surfaceVariant` |
| Percentage Font | Label large | Typography.labelLarge | Font.headline | `typography.label` |
| Percentage Color | Text primary | onSurface | Color.primary | `color.textPrimary` |
| Message Font | Body small | Typography.bodySmall | Font.caption | `typography.bodySmall` |
| Message Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Gap (elements) | 8dp | 8.dp | 8 | `spacing.sm` |

## NOTES

### Progress Representation
- Linear: Horizontal bar, good for inline display
- Circular: Spinner, good for centered emphasis
- Percentage text: "45%" format
- Indeterminate: Animated spinner, no percentage

### Optional Features
- Remaining time estimate: "2 min left"
- Download size: "45 MB of 100 MB"
- Caching status: "From cache"

### Accessibility
- `accessibilityLabel`: "{message}, {progress} percent complete"
- `accessibilityRole`: "progressbar"
- `accessibilityValue`: "{progress} percent"
- Live region updates on progress change

### Platform Differences
- **Android:** Material3 progress components
- **iOS:** Native `ProgressView()` with automatic styling

### Dependencies
- `Progress` atom
- Download state (progress, message)
- Typography tokens
- Localization literals
