# InfoToast

## Component Classification
**Type:** Molecule
**Domain:** Feedback
**Source:** `components/toasts/info-toast.tsx`

## Purpose
Informational toast notification for non-critical updates. Displays auto-dismissed messages.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Info icon
- `Button` (atom) - Dismiss action (optional)

### Layout Structure
```
┌─────────────────────────────────┐
│  ⓘ  Sync complete              [×] │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/toasts/info-toast.tsx`

**Key Implementation:**
- Toast presentation (top or bottom)
- Info icon with blue color
- Auto-dismiss timer
- Optional dismiss button

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/InfoToast.kt`

**Implementation Notes:**
- Use `Snackbar` or custom `Card` with `AnimatedVisibility`
- `Icon` composable for info indicator
- `LaunchedEffect` for auto-dismiss
- `IconButton` for manual dismiss

**Expected API:**
```kotlin
@Composable
fun InfoToast(
  message: String,
  visible: Boolean,
  onDismiss: () -> Unit,
  duration: Int = 4000, // ms
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/InfoToast.swift`

**Implementation Notes:**
- Use `.alert()` or custom toast overlay
- SF Symbol for info icon
- `.onAppear()` with `DispatchQueue.asyncAfter` for auto-dismiss
- `Button` or tap gesture for dismiss

**Expected API:**
```swift
struct InfoToast: View {
  var message: String
  var visible: Bool
  var onDismiss: () -> Void
  var duration: Double = 4.0 // seconds

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Background Color | Surface variant | surfaceVariant | Color.secondary.opacity(0.9) | `color.surfaceVariant` |
| Text Color | On surface variant | onSurfaceVariant | Color.primary | `color.onSurfaceVariant` |
| Icon Name | info | info | info.circle.fill | `icon.info` |
| Icon Color | Info blue | colorInfo | Color.blue | `color.info` |
| Icon Size | 20dp | 20.dp | 20 | `iconSize.sm` |
| Font Size | 14sp | 14.sp | 14 | `typography.fontSize.sm` |
| Font Weight | 400 (Regular) | FontWeight.Normal | .regular | `typography.weight.regular` |
| Corner Radius | 8dp | 8.dp | 8 | `borderRadius.md` |
| Elevation | 4 | 4.dp | 4 | `elevation.toast` |
| Padding Horizontal | 16dp | 16.dp | 16 | `spacing.lg` |
| Padding Vertical | 12dp | 12.dp | 12 | `spacing.md` |
| Icon-Text Gap | 12dp | 12.dp | 12 | `spacing.md` |
| Animation Duration | 300ms | 300ms | 0.3s | `animation.duration.medium` |

## NOTES

### Positioning
- Top: Below status bar (default)
- Bottom: Above navigation (alternative)
- Center: For critical info (rare)

### Auto-Dismiss
- Default: 4 seconds
- Long messages: 6 seconds
- No dismiss button (auto only)

### Use Cases
- Sync complete
- Settings saved
- Background task done
- Non-error updates

### Accessibility
- `accessibilityLabel`: "{message}"
- `accessibilityRole`: "alert"
- `accessibilityLiveRegion`: "polite"
- Focus trap when visible

### Platform Differences
- **Android:** Material3 `Snackbar` at bottom
- **iOS:** Custom overlay at top (native toasts are bottom-only)

### Dependencies
- `IconSymbol` atom
- Toast/snackbar system
- Color tokens (info)
- Spacing tokens
