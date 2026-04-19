# StateFilterSheet

## Component Classification
**Type:** Molecule
**Domain:** Discovery
**Source:** `components/discovery/state-filter-sheet.tsx`

## Purpose
Bottom sheet for filtering routes by state/region. Multi-select filter for discovery.

## COMPOSITION

### Child Components
- `StateListItem` (molecule) - Individual state items
- `IconSymbol` (atom) - Filter and close icons
- `Button` (atom) - Apply and reset actions

### Layout Structure
```
┌─────────────────────────────────┐
│  ════════ (drag handle)         │
│                                 │
│  Filter by State          [×]   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ☑️ California (42)      │   │
│  ├─────────────────────────┤   │
│  │ ☐ Oregon (18)          │   │
│  ├─────────────────────────┤   │
│  │ ☐ Washington (12)      │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │ Reset    │  │ Apply    │    │
│  └──────────┘  └──────────┘    │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/discovery/state-filter-sheet.tsx`

**Key Implementation:**
- Bottom sheet presentation
- Scrollable list of states
- Checkbox per state
- Route count per state
- Apply/reset buttons
- Search/filter states

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/StateFilterSheet.kt`

**Implementation Notes:**
- Use `BottomSheetScaffold` or `ModalBottomSheet`
- `LazyColumn` for scrollable list
- `StateListItem` composition
- `Checkbox` for selection
- `Button` for actions

**Expected API:**
```kotlin
@Composable
fun StateFilterSheet(
  visible: Boolean,
  onClose: () -> Unit,
  states: List<StateFilter>,
  selectedStates: Set<String>,
  onSelect: (String) -> Unit,
  modifier: Modifier = Modifier
)

data class StateFilter(
  val code: String, // "CA", "OR", etc.
  val name: String, // "California", "Oregon", etc.
  val routeCount: Int
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/StateFilterSheet.swift`

**Implementation Notes:**
- Use `.sheet()` or `.presentationDetents()`
- `List` with `ForEach` for scrollable
- `StateListItem` composition
- `Toggle` or custom check for selection
- `Button` for actions

**Expected API:**
```swift
struct StateFilterSheet: View {
  var visible: Bool
  var onClose: () -> Void
  var states: [StateFilter]
  var selectedStates: Set<String>
  var onSelect: (String) -> Void

  struct StateFilter {
    var code: String // "CA", "OR", etc.
    var name: String // "California", "Oregon", etc.
    var routeCount: Int
  }

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
| Padding | 0 (full) | 0.dp | 0 | - |
| Header Padding | 16dp | 16.dp | 16 | `spacing.lg` |
| Title Font | Title medium | Typography.titleMedium | Font.title3 | `typography.title` |
| Title Color | Text primary | onSurface | Color.primary | `color.textPrimary` |
| List Item Height | 56dp | 56.dp | 56 | `size.listItem.default` |
| Checkbox Size | 24dp | 24.dp | 24 | `size.checkbox.default` |
| Checkbox Color | Primary copper | colorPrimary | Color.primary | `color.primary` |
| Count Font | Label medium | Typography.labelMedium | Font.subheadline | `typography.label` |
| Count Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Reset Button | Secondary | Button(secondary) | Button(.bordered) | `button.secondary` |
| Apply Button | Primary | Button(primary) | Button(.borderedProminent) | `button.primary` |
| Button Height | 40dp | 40.dp | 40 | `size.button.sm` |

## NOTES

### List Behavior
- Scrollable if > 6 states
- Alphabetical sort
- Group by region (optional)
- Search bar for filtering (optional)

### Selection Logic
- Multi-select enabled
- Select all / Deselect all
- Route count updates per state
- Count excludes filtered-out routes

### Button States
- **Reset:** Clears all selections, enabled if any selected
- **Apply:** Closes sheet, applies filters, always enabled

### Accessibility
- `accessibilityLabel`: "Filter by state"
- List items: "{state name}, {routeCount} routes"
- Checkbox state announced
- Button actions accessible

### Platform Differences
- **Android:** Material3 `ModalBottomSheet` with `LazyColumn`
- **iOS:** Native `.sheet()` with `List`

### Dependencies
- `StateListItem` molecule
- `IconSymbol` atom
- `Button` atom
- Bottom sheet system
- State filter data
- Localization literals
