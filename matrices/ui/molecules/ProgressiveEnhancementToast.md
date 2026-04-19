# ProgressiveEnhancementToast

## Component Classification
**Type:** Molecule
**Domain:** Enrichment
**Source:** `components/enrichment/progressive-enhancement-toast.tsx`

## Purpose
Toast notification shown when route enrichment completes. Displays progressive enhancement status.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Success/enrichment icon
- `Button` (atom) - Dismiss action

### Layout Structure
```
┌─────────────────────────────────┐
│  ✨ Route enhanced    [×]        │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/enrichment/progressive-enhancement-toast.tsx`

**Key Implementation:**
- Toast presentation (top overlay)
- Sparkle/success icon
- Auto-dismiss timer
- Optional dismiss button

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/ProgressiveEnhancementToast.kt`

**Implementation Notes:**
- Use `Snackbar` or custom `Card` with `AnimatedVisibility`
- `Icon` composable for sparkle
- `LaunchedEffect` for auto-dismiss
- `IconButton` for manual dismiss

**Expected API:**
```kotlin
@Composable
fun ProgressiveEnhancementToast(
  visible: Boolean,
  message: String? = null,
  onDismiss: () -> Unit,
  duration: Int = 4000, // ms
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/ProgressiveEnhancementToast.swift`

**Implementation Notes:**
- Use custom toast overlay (native toasts are basic)
- SF Symbol for sparkle icon
- `.onAppear()` with `DispatchQueue.asyncAfter` for auto-dismiss
- `Button` or tap gesture for dismiss

**Expected API:**
```swift
struct ProgressiveEnhancementToast: View {
  var visible: Bool
  var message: String? = nil
  var onDismiss: () -> Void
  var duration: Double = 4.0

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Background Color | Primary container | primaryContainer | Color.primary.opacity(0.9) | `color.primaryContainer` |
| Text Color | On primary container | onPrimaryContainer | Color.white | `color.onPrimaryContainer` |
| Icon Name | sparkle | auto_awesome | sparkle | `icon.sparkle` |
| Icon Color | On primary container | onPrimaryContainer | Color.white | `color.onPrimaryContainer` |
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
- Center: For critical (rare)

### Auto-Dismiss
- Default: 4 seconds
- Long messages: 6 seconds
- Optional dismiss button

### Message Content
- Default: "Route enhanced"
- Custom: Override with prop
- No technical details (user-facing)

### Accessibility
- `accessibilityLabel`: "Route enhanced"
- `accessibilityRole`: "alert"
- `accessibilityLiveRegion`: "polite"
- Focus trap when visible

### Platform Differences
- **Android:** Material3 `Snackbar` with custom content
- **iOS:** Custom overlay with SF Symbol

### Dependencies
- `IconSymbol` atom
- Toast system
- Color tokens (primary container)
- Enrichment state
