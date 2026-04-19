# IntentSearchSheet

## Component Classification
**Type:** Molecule
**Domain:** Discovery
**Source:** `components/discovery/intent-search-sheet.tsx`

## Purpose
Bottom sheet for intent-based route discovery search. Natural language input for finding routes by description.

## COMPOSITION

### Child Components
- `Input` (atom) - Search input field
- `IconSymbol` (atom) - Search and close icons
- `Button` (atom) - Submit action

### Layout Structure
```
┌─────────────────────────────────┐
│  ════════ (drag handle)         │
│                                 │
│  What are you looking for?      │
│  ┌─────────────────────────┐   │
│  │ [🔍] Scenic coastal...  │   │
│  └─────────────────────────┘   │
│                                 │
│  Try: "sunset overlooks" or     │
│  "technical twisties"           │
│                                 │
│  ┌─────────────────────────┐   │
│  │        Search            │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/discovery/intent-search-sheet.tsx`

**Key Implementation:**
- Bottom sheet presentation
- Text input with search icon
- Example suggestions
- Submit button
- Keyboard handling

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/IntentSearchSheet.kt`

**Implementation Notes:**
- Use `BottomSheetScaffold` or `ModalBottomSheet`
- `TextField` with `leadingIcon` for search input
- `Column` layout with `Spacer`
- `Button` for submit
- Keyboard auto-focus on open

**Expected API:**
```kotlin
@Composable
fun IntentSearchSheet(
  visible: Boolean,
  query: String,
  onQueryChange: (String) -> Unit,
  onSelect: (String) -> Unit,
  onClose: () -> Unit,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/IntentSearchSheet.swift`

**Implementation Notes:**
- Use `.sheet()` or `.presentationDetents()`
- `TextField` with `HStack` for icon
- `VStack` layout with `Spacer`
- `Button` for submit
- `.keyboardAppearance(.default)`

**Expected API:**
```swift
struct IntentSearchSheet: View {
  var visible: Bool
  var query: String
  var onQueryChange: (String) -> Void
  var onSelect: (String) -> Void
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
| Input Height | 48dp | 48.dp | 48 | `size.input.default` |
| Input Corner Radius | 8dp | 8.dp | 8 | `borderRadius.md` |
| Input Background | Surface variant | surfaceVariant | Color.secondary.opacity(0.1) | `color.surfaceVariant` |
| Search Icon | search | search | magnifyingglass | `icon.search` |
| Search Icon Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Placeholder Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Submit Button | Primary | Button(primary) | Button(.borderedProminent) | `button.primary` |
| Suggestion Text Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Suggestion Font | Body small | Typography.bodySmall | Font.caption | `typography.bodySmall` |

## NOTES

### Interaction
- Auto-focus input on open
- Submit on keyboard "Search" key
- Swipe down to dismiss
- Close icon top-right

### Example Suggestions
- "sunset overlooks"
- "technical twisties"
- "coastal drives"
- "waterfall routes"

### Search Behavior
- Natural language processing
- Intent extraction (scenic, technical, etc.)
- Fuzzy matching on route metadata

### Accessibility
- `accessibilityLabel`: "Search routes by description"
- `accessibilityHint`: "Enter what you're looking for"
- Input labeled properly
- Submit button accessible

### Platform Differences
- **Android:** `TextField` with `ImeAction.Search`
- **iOS:** `TextField` with `SubmitLabel.search`

### Dependencies
- `Input` atom
- `IconSymbol` atom
- `Button` atom
- Bottom sheet system
- Intent search API
- Localization literals
