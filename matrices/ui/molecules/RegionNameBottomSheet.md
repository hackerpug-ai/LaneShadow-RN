# RegionNameBottomSheet

## Component Classification
**Type:** Molecule
**Domain:** Offline
**Source:** `components/offline/region-name-bottom-sheet.tsx`

## Purpose
Bottom sheet for naming a new offline region during download. User enters custom region name.

## COMPOSITION

### Child Components
- `Input` (atom) - Region name input field
- `Button` (atom) - Save and cancel actions

### Layout Structure
```
┌─────────────────────────────────┐
│  ════════ (drag handle)         │
│                                 │
│  Name Your Region               │
│  ┌─────────────────────────┐   │
│  │ California Bay Area      │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │        Save              │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │        Cancel            │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/offline/region-name-bottom-sheet.tsx`

**Key Implementation:**
- Bottom sheet presentation
- Text input with label
- Validation (non-empty, max length)
- Auto-focus on open
- Save/cancel buttons

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/RegionNameBottomSheet.kt`

**Implementation Notes:**
- Use `BottomSheetScaffold` or `ModalBottomSheet`
- `TextField` with `label`
- `KeyboardOptions` for text capitalization
- `FocusRequester` for auto-focus
- Save button disabled if invalid

**Expected API:**
```kotlin
@Composable
fun RegionNameBottomSheet(
  visible: Boolean,
  value: String,
  onChangeText: (String) -> Unit,
  onSave: () -> Unit,
  onClose: () -> Unit,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/RegionNameBottomSheet.swift`

**Implementation Notes:**
- Use `.sheet()` or `.presentationDetents()`
- `TextField` with `prompt` (label)
- `.textCase(.words)` for capitalization
- `.focused()` for auto-focus
- Save button disabled if invalid

**Expected API:**
```swift
struct RegionNameBottomSheet: View {
  var visible: Bool
  var value: String
  var onChangeText: (String) -> Void
  var onSave: () -> Void
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
| Save Button | Primary | Button(primary) | Button(.borderedProminent) | `button.primary` |
| Cancel Button | Secondary | Button(secondary) | Button(.bordered) | `button.secondary` |
| Button Spacing | 8dp apart | 8.dp | 8 | `spacing.sm` |

## NOTES

### Validation
- Required: Non-empty
- Max length: 50 characters
- Trim whitespace
- Duplicate detection (warn if exists)

### Keyboard
- iOS: Sentence capitalization
- Android: Words capitalization
- Return key: "Done" (triggers save)

### Auto-Focus
- Input focused on open
- Keyboard auto-shows
- Save button visible above keyboard

### Suggested Names
- Use detected location
- Examples: "California Bay Area", "SoCal Coast"
- User can override

### Accessibility
- `accessibilityLabel`: "Name your region"
- Input labeled properly
- Save/cancel buttons accessible
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
