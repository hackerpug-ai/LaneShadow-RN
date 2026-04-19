# SuccessToast

## Component Classification
**Type:** Molecule
**Domain:** Feedback
**Source:** `components/toasts/success-toast.tsx`

## Purpose
Success toast notification for completed actions. Displays positive feedback messages.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Success checkmark icon
- `Button` (atom) - Dismiss action (optional)

### Layout Structure
```
┌─────────────────────────────────┐
│  ✓  Route saved          [×]    │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/toasts/success-toast.tsx`

**Key Implementation:**
- Toast presentation (top or bottom)
- Success icon with green color
- Auto-dismiss timer
- Optional dismiss button

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/SuccessToast.kt`

**Implementation Notes:**
- Use `Snackbar` or custom `Card` with `AnimatedVisibility`
- `Icon` composable for checkmark
- `LaunchedEffect` for auto-dismiss
- `IconButton` for manual dismiss

**Expected API:**
```kotlin
@Composable
fun SuccessToast(
  message: String,
  visible: Boolean,
  onDismiss: () -> Unit,
  duration: Int = 4000, // ms
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/SuccessToast.swift`

**Implementation Notes:**
- Use `.alert()` or custom toast overlay
- SF Symbol for checkmark
- `.onAppear()` with `DispatchQueue.asyncAfter` for auto-dismiss
- `Button` or tap gesture for dismiss

**Expected API:**
```swift
struct SuccessToast: View {
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
| Background Color | Success container | successContainer | Color.green.opacity(0.9) | `color.successContainer` |
| Text Color | On success container | onSuccessContainer | Color.white | `color.onSuccessContainer` |
| Icon Name | check | check | checkmark | `icon.check` |
| Icon Color | On success container | onSuccessContainer | Color.white | `color.onSuccessContainer` |
| Icon Size | 20dp | 20.dp | 20 | `iconSize.sm` |
| Font Size | 14sp | 14.sp | 14 | `typography.fontSize.sm` |
| Font Weight | 500 (Medium) | FontWeight.Medium | .medium | `typography.weight.medium` |
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
- Center: For critical success (rare)

### Auto-Dismiss
- Default: 4 seconds
- Long messages: 6 seconds
- No dismiss button (auto only)

### Use Cases
- Route saved
- Settings saved
- Download complete
- Action succeeded
- Favorited

### Accessibility
- `accessibilityLabel`: "{message}"
- `accessibilityRole`: "alert"
- `accessibilityLiveRegion`: "polite"
- Focus trap when visible

### Platform Differences
- **Android:** Material3 `Snackbar` with custom content
- **iOS:** Custom overlay with SF Symbol

### Dependencies
- `IconSymbol` atom
- Toast system
- Color tokens (success)
- Spacing tokens
