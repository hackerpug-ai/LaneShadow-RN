# DownloadErrorSheet

## Component Classification
**Type:** Molecule
**Domain:** Onboarding
**Source:** `components/onboarding/download-error-sheet.tsx`

## Purpose
Bottom sheet shown when offline region download fails. Provides error context and retry action.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Error icon
- `Button` (atom) - Retry and dismiss actions

### Layout Structure
```
┌─────────────────────────────────┐
│  ════════ (drag handle)         │
│                                 │
│       [Error Icon]              │
│                                 │
│  Download Failed                │
│  Couldn't download region.      │
│  Check your connection.         │
│                                 │
│  ┌─────────────────────────┐   │
│  │      Retry              │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │      Cancel             │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/onboarding/download-error-sheet.tsx`

**Key Implementation:**
- Bottom sheet presentation (Gorhom)
- Error message with technical detail
- Two-button layout (retry, cancel)
- Dismissible via drag handle

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/DownloadErrorSheet.kt`

**Implementation Notes:**
- Use `BottomSheetScaffold` or `ModalBottomSheet`
- `Column` layout with `Spacer` for spacing
- `Icon` for error indicator
- `Button` components for actions

**Expected API:**
```kotlin
@Composable
fun DownloadErrorSheet(
  visible: Boolean,
  error: String,
  onRetry: () -> Unit,
  onCancel: () -> Unit,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/DownloadErrorSheet.swift`

**Implementation Notes:**
- Use `.sheet()` or `.presentationDetents()`
- `VStack` with `Spacer` for layout
- SF Symbol for error icon
- Native button styles

**Expected API:**
```swift
struct DownloadErrorSheet: View {
  var visible: Bool
  var error: String
  var onRetry: () -> Void
  var onCancel: () -> Void

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Icon Name | error-outline | error_outline | exclamationmark.triangle.fill | `icon.error` |
| Icon Size | 48dp | 48.dp | 48 | `iconSize.xl` |
| Icon Color | Danger red | colorError | Color.red | `color.danger` |
| Title Font | Title large | Typography.titleLarge | Font.title2 | `typography.title` |
| Title Color | Text primary | onSurface | Color.primary | `color.textPrimary` |
| Message Font | Body | Typography.bodyMedium | Font.body | `typography.body` |
| Message Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Retry Button | Primary | Button(primary) | Button(.borderedProminent) | `button.primary` |
| Cancel Button | Secondary | Button(secondary) | Button(.bordered) | `button.secondary` |
| Sheet Corner Radius | 16dp | 16.dp | 16 | `borderRadius.sheet` |
| Padding | 24dp | 24.dp | 24 | `spacing.xl` |

## NOTES

### Interaction Pattern
- Swipe down to dismiss
- Tap "Retry" to restart download
- Tap "Cancel" to abort and return

### Error Context
- Display technical error message
- Suggest common fixes (connection, storage)
- Link to troubleshooting (optional)

### Accessibility
- `accessibilityLabel`: "Download error"
- `accessibilityHint`: "Retry or cancel download"
- `accessibilityRole`: "alert"
- Focus trap when open

### Platform Differences
- **Android:** Material3 `ModalBottomSheet` with drag handle
- **iOS:** Native `.sheet()` with `.presentationDragIndicator()`

### Dependencies
- `IconSymbol` atom
- `Button` atom
- Bottom sheet system
- Error state from download manager
- Localization literals
