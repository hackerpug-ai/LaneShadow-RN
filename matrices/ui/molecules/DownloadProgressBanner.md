# DownloadProgressBanner

## Component Classification
**Type:** Molecule
**Domain:** Model
**Source:** `components/model/DownloadProgressBanner.tsx`

## Purpose
Banner display of model download progress with cancel action. Shows active download state inline.

## COMPOSITION

### Child Components
- `Progress` (atom) - Linear progress indicator
- `Button` (atom) - Cancel action

### Layout Structure
```
┌─────────────────────────────────┐
│  Downloading Model...     [X]   │
│  ████████████░░░░░░  65%       │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/model/DownloadProgressBanner.tsx`

**Key Implementation:**
- Linear progress bar (horizontal)
- Percentage text display
- Cancel icon button (compact)
- Elevation for banner prominence

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/DownloadProgressBanner.kt`

**Implementation Notes:**
- Use `LinearProgressIndicator` for progress
- `Row` layout with `Spacer` for positioning
- `IconButton` for cancel action
- `Card` or `Surface` for container

**Expected API:**
```kotlin
@Composable
fun DownloadProgressBanner(
  progress: Float, // 0.0 to 1.0
  onCancel: () -> Unit,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/DownloadProgressBanner.swift`

**Implementation Notes:**
- Use `ProgressView()` with linear style
- `HStack` with `Spacer` for layout
- `Button(role: .destructive)` for cancel
- `RoundedRectangle` background

**Expected API:**
```swift
struct DownloadProgressBanner: View {
  var progress: Double // 0.0 to 1.0
  var onCancel: () -> Void

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Container Height | 48dp | 48.dp | 48 | `size.banner.compact` |
| Background Color | Surface variant | surfaceVariant | Color.secondary.opacity(0.1) | `color.surfaceVariant` |
| Progress Height | 4dp | 4.dp | 4 | `size.progress.thin` |
| Progress Color | Primary copper | colorPrimary | Color.primary | `color.primary` |
| Track Color | Surface variant | surfaceVariant | Color.gray.opacity(0.3) | `color.surfaceVariant` |
| Text Font | Label medium | Typography.labelMedium | Font.subheadline | `typography.label` |
| Text Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Cancel Icon | close | close | xmark | `icon.close` |
| Cancel Icon Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Corner Radius | 8dp | 8.dp | 8 | `borderRadius.md` |
| Elevation | 2 | CardDefaults.elevatedCardElevation | 2 | `elevation.banner` |
| Padding Horizontal | 16dp | 16.dp | 16 | `spacing.lg` |
| Padding Vertical | 12dp | 12.dp | 12 | `spacing.md` |

## NOTES

### Layout Logic
- Progress bar spans full width minus padding
- Cancel button right-aligned
- Percentage text left-aligned

### Interaction
- Tap cancel button to abort download
- No dismiss on banner tap (only cancel button)
- Auto-dismiss on complete/error

### Accessibility
- `accessibilityLabel`: "Downloading model, 65 percent complete"
- `accessibilityRole`: "progressbar"
- `accessibilityValue`: "{progress} percent"
- Cancel button: "Cancel download"

### Platform Differences
- **Android:** Material3 `LinearProgressIndicator`
- **iOS:** Native `ProgressView()` with `.progressViewStyle(.linear)`

### Dependencies
- `Progress` atom
- `Button` atom (icon variant)
- Download state (progress value)
- Localization literals
