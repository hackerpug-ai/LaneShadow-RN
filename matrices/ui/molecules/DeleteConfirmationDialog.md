# DeleteConfirmationDialog

## Component Classification
**Type:** Molecule
**Domain:** Offline
**Source:** `components/offline/delete-confirmation-dialog.tsx`

## Purpose
Confirmation dialog for offline region deletion. Requires explicit user confirmation before destructive action.

## COMPOSITION

### Child Components
- `Button` (atom) - Confirm and cancel actions

### Layout Structure
```
┌─────────────────────────────────┐
│  Delete Region                  │
│  ─────────────────────────      │
│                                 │
│  Delete "California Bay Area"?  │
│  This action cannot be undone.  │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │ Cancel   │  │ Delete   │    │
│  └──────────┘  └──────────┘    │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/offline/delete-confirmation-dialog.tsx`

**Key Implementation:**
- Modal/alert dialog presentation
- Destructive action styling
- Region name interpolation
- Two-button layout (cancel, confirm)

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/DeleteConfirmationDialog.kt`

**Implementation Notes:**
- Use `AlertDialog` from Material3
- `text` parameter for message content
- `confirmButton` and `dismissButton` slots
- Destructive color for confirm button

**Expected API:**
```kotlin
@Composable
fun DeleteConfirmationDialog(
  visible: Boolean,
  regionName: String,
  onConfirm: () -> Unit,
  onDismiss: () -> Unit,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/DeleteConfirmationDialog.swift`

**Implementation Notes:**
- Use `.alert()` or `.confirmationDialog()`
- `Alert` type for simple dialog
- Destructive button role styling
- Dynamic message with region name

**Expected API:**
```swift
struct DeleteConfirmationDialog: View {
  var visible: Bool
  var regionName: String
  var onConfirm: () -> Void
  var onDismiss: () -> Void

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Dialog Title | "Delete Region" | Text string | Text | `literals.deleteRegion` |
| Message Font | Body | Typography.bodyLarge | Font.body | `typography.body` |
| Message Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Confirm Button | Destructive | Destructive color | .destructive | `color.danger` |
| Cancel Button | Secondary | Text button | .cancel | `color.textPrimary` |
| Button Spacing | 8dp apart | 8.dp | 8 | `spacing.sm` |
| Dialog Elevation | 24dp | 24.dp | - | `elevation.dialog` |
| Corner Radius | 28dp | 28.dp | - | `borderRadius.dialog` |

## NOTES

### Interaction Pattern
- Requires explicit tap on "Delete" to confirm
- Tap outside or "Cancel" dismisses without action
- Destructive action requires secondary confirmation pattern

### Accessibility
- `accessibilityLabel`: "Delete region confirmation"
- `accessibilityRole`: "alert"
- Destructive button marked as destructive
- Escape key/cancel button available

### Localization
- Region name interpolated into message
- Warning text about irreversible action
- Button labels: "Delete", "Cancel"

### Platform Differences
- **Android:** Material3 `AlertDialog` with `text` composable
- **iOS:** Native `.alert()` with `.destructive` role

### Dependencies
- `Button` atom
- Dialog/alert system
- Color tokens for destructive state
- Localization literals
