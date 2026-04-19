# WarningToast

## Component Classification
**Type:** Molecule
**Domain:** Feedback
**Source:** `components/toasts/warning-toast.tsx`

## Purpose
Warning toast notification for cautionary messages. Displays alerts that require attention.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Warning icon
- `Button` (atom) - Dismiss/action button

### Layout Structure
```
┌─────────────────────────────────┐
│  ⚠️ Route expires soon   [×]    │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/toasts/warning-toast.tsx`

**Key Implementation:**
- Toast presentation (top or bottom)
- Warning icon with amber color
- Auto-dismiss timer (longer)
- Optional action button

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/WarningToast.kt`

**Implementation Notes:**
- Use `Snackbar` or custom `Card` with `AnimatedVisibility`
- `Icon` composable for warning
- `LaunchedEffect` for auto-dismiss
- `Button` for action/dismiss

**Expected API:**
```kotlin
@Composable
fun WarningToast(
  message: String,
  visible: Boolean,
  onDismiss: () -> Unit,
  actionLabel: String? = null,
  onAction: () -> Unit = {},
  duration: Int = 6000, // ms (longer)
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/WarningToast.swift`

**Implementation Notes:**
- Use `.alert()` or custom toast overlay
- SF Symbol for warning icon
- `.onAppear()` with `DispatchQueue.asyncAfter` for auto-dismiss
- `Button` for action/dismiss

**Expected API:**
```swift
struct WarningToast: View {
  var message: String
  var visible: Bool
  var onDismiss: () -> Void
  var actionLabel: String? = nil
  var onAction: () -> Void = {}
  var duration: Double = 6.0 // seconds (longer)

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Background Color | Warning container | warningContainer | Color.orange.opacity(0.9) | `color.warningContainer` |
| Text Color | On warning container | onWarningContainer | Color.white | `color.onWarningContainer` |
| Icon Name | warning | warning | exclamationmark.triangle.fill | `icon.warning` |
| Icon Color | On warning container | onWarningContainer | Color.white | `color.onWarningContainer` |
| Icon Size | 20dp | 20.dp | 20 | `iconSize.sm` |
| Font Size | 14sp | 14.sp | 14 | `typography.fontSize.sm` |
| Font Weight | 500 (Medium) | FontWeight.Medium | .medium | `typography.weight.medium` |
| Corner Radius | 8dp | 8.dp | 8 | `borderRadius.md` |
| Elevation | 4 | 4.dp | 4 | `elevation.toast` |
| Padding Horizontal | 16dp | 16.dp | 16 | `spacing.lg` |
| Padding Vertical | 12dp | 12.dp | 12 | `spacing.md` |
| Icon-Text Gap | 12dp | 12.dp | 12 | `spacing.md` |
| Action Button | Text (ghost) | TextButton | Button(.borderless) | `button.ghost` |
| Animation Duration | 300ms | 300ms | 0.3s | `animation.duration.medium` |

## NOTES

### Positioning
- Top: Below status bar (default)
- Bottom: Above navigation (alternative)
- Center: For critical warning (rare)

### Auto-Dismiss
- Default: 6 seconds (longer than info)
- Important: 8 seconds
- With action: No auto-dismiss (require action)

### Use Cases
- Route expires soon
- Weather deteriorating
- Storage low
- Battery low (if relevant)
- Settings conflict
- Deprecated feature

### Action Button
- Optional: "Fix", "Learn More", "Dismiss"
- Primary style for emphasis
- Full width or trailing position

### Accessibility
- `accessibilityLabel`: "{message}"
- `accessibilityRole`: "alert"
- `accessibilityLiveRegion`: "assertive"
- Focus trap when visible
- Action button accessible

### Platform Differences
- **Android:** Material3 `Snackbar` with action
- **iOS:** Custom overlay with action button

### Dependencies
- `IconSymbol` atom
- `Button` atom
- Toast system
- Color tokens (warning)
