# RenameRegionBottomSheet

## Component Classification
**Type:** Molecule
**Domain:** Offline
**Source:** `components/offline/rename-region-bottom-sheet.tsx`

## Purpose
Bottom sheet for renaming an existing offline region. User updates region name.

## COMPOSITION

### Child Components
- `Input` (atom) - Region name input field
- `Button` (atom) - Rename and cancel actions

### Layout Structure
```
┌─────────────────────────────────┐
│  ════════ (drag handle)         │
│                                 │
│  Rename Region                  │
│  ┌─────────────────────────┐   │
│  │ California Bay Area      │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │        Rename            │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │        Cancel            │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/offline/rename-region-bottom-sheet.tsx`

**Key Implementation:**
- Bottom sheet presentation
- Text input with current value
- Validation (non-empty, max length, duplicate)
- Auto-focus on open
- Rename/cancel buttons

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/RenameRegionBottomSheet.kt`

**Implementation Notes:**
- Use `BottomSheetScaffold` or `ModalBottomSheet`
- `TextField` with `label` and `value`
- `KeyboardOptions` for text capitalization
- `FocusRequester` for auto-focus
- Rename button disabled if invalid

**Expected API:**
```kotlin
@Composable
fun RenameRegionBottomSheet(
  visible: Boolean,
  value: String,
  onChangeText: (String) -> Unit,
  onRename: () -> Unit,
  onClose: () -> Unit,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/RenameRegionBottomSheet.swift`

**Implementation Notes:**
- Use `.sheet()` or `.presentationDetents()`
- `TextField` with `prompt` (label) and `text`
- `.textCase(.words)` for capitalization
- `.focused()` for auto-focus
- Rename button disabled if invalid

**Expected API:**
```swift
struct RenameRegionBottomSheet: View {
  var visible: Bool
  var value: String
  var onChangeText: (String) -> Void
  var onRename: () -> Void
  var onClose: () -> Void

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Sheet Corner Radius | 16dp | 16.dp | 16 | `borderRadius.sheet` |
| Background Color | Surface | surface | Color(.systemBackground) | `color.surface` |
| Padding | 24dp | 24.dp | 24 | `spacing.xl` |
| Title Font | Title medium | Typography.titleMedium | Font.title3 | `typography.title` |
| Title Color | Text primary | onSurface | Color.primary | `color.textPrimary` |
| Input Height | 48dp | 48.dp | 48 | `size.input.default` |
| Input Corner Radius | 8dp | 8.dp | 8 | `borderRadius.md` |
| Input Background | Surface variant | surfaceVariant | Color.secondary.opacity(0.1) | `color.surfaceVariant` |
| Rename Button | Primary | Button(primary) | Button(.borderedProminent) | `button.primary` |
| Cancel Button | Secondary | Button(secondary) | Button(.bordered) | `button.secondary` |
| Button Spacing | 8dp apart | 8.dp | 8 | `spacing.sm` |

## NOTES

### Validation
- Required: Non-empty
- Max length: 50 characters
- Trim whitespace
- Duplicate detection (warn if exists, excluding self)

### Keyboard
- iOS: Sentence capitalization
- Android: Words capitalization
- Return key: "Done" (triggers rename)

### Auto-Focus
- Input focused on open
- Keyboard auto-shows
- Text pre-selected for overwrite

### Initial Value
- Pre-fill with current region name
- Select all text for easy overwrite
- Cursor at end if not selected

### Accessibility
- `accessibilityLabel`: "Rename region"
- Input labeled properly
- Rename/cancel buttons accessible
- Error announced if validation fails

### Platform Differences
- **Android:** `TextField` with `singleLine = true`
- **iOS:** `TextField` with `submitLabel(.done)`

### Dependencies
- `Input` atom
- `Button` atom
- Bottom sheet system
- Validation utility
- Localization literals
