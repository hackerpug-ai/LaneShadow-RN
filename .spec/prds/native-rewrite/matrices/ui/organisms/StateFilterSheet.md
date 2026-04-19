# StateFilterSheet - Organism Matrix

**Component Source:** `react-native/components/discovery/state-filter-sheet.tsx`

**Atomic Level:** Organism

**Domain:** Discovery / Filtering

---

## COMPOSITION ANALYSIS

### Child Components
- **External Dependencies:**
  - `@gorhom/bottom-sheet` (BottomSheetWrapper)
- **Internal Components:**
  - `BottomSheetInput` - Search input
  - `StateListItem` - Individual state item
  - `Button` - Clear button
  - `IconSymbol` - Empty state icon
- **Composition Pattern:**
  - Full-height bottom sheet
  - Search header with stats
  - Scrollable list of states
  - Conditional clear button
  - Empty state handling

### Layout Structure
```
StateFilterSheet
└── BottomSheetWrapper (preset: full)
    ├── Header
    │   ├── Title ("Filter by State")
    │   └── Subtitle (selected count • total routes)
    ├── Search Input
    │   └── BottomSheetInput (search states...)
    ├── State List (FlatList)
    │   └── StateListItem[] (per state)
    │       ├── State Code (badge)
    │       ├── State Name
    │       ├── Route Count
    │       └── Checkmark (if selected)
    └── Clear Button (conditional)
```

---

## STATE & BEHAVIOR

### Props Interface
```typescript
export type StateFilterSheetProps = {
  visible: boolean
  states: StateData[]
  selected: string[]  // State codes
  onSelectionChange: (states: string[]) => void
  onDismiss: () => void
  testID?: string
}

export type StateData = {
  code: string      // e.g., "CA"
  name: string      // e.g., "California"
  routeCount: number
}
```

### State Management
- **Local State:**
  - `searchQuery: string` - Search input value
- **Remote State:**
  - All data passed via props (controlled component)
- **Derived State:**
  - `filteredStates` - States matching search query with routes > 0
  - `totalSelectedRoutes` - Sum of route counts for selected states

### User Interactions
- **Search Input:**
  - Filters states by name (case-insensitive)
  - Hides zero-route states
- **State Press:**
  - Toggles state selection (multi-select)
  - Fires `onSelectionChange()` callback
-**Clear Button:**
  - Clears selection (sets to empty array)
  - Dismisses sheet

### Display Logic
- **Filtering:**
  - Zero-route states are filtered out
  - Search filters by state name (case-insensitive)
  - Selected states show at top (optional enhancement)
- **Header Stats:**
  - Shows selected count and total routes
  - Changes based on selection

---

## TRANSLATION SOURCES

### React Native → Kotlin/Compose

**Bottom Sheet:**
- RN: `@gorhom/bottom-sheet` (BottomSheetWrapper, preset: full)
- Kotlin: `ModalBottomSheetLayout` or `BottomSheetScaffold` with `fullHeight`

**Search Input:**
- RN: `BottomSheetInput` (custom component)
- Kotlin: `TextField` with `Modifier.onFocusChanged()`

**Lists:**
- RN: `FlatList`
- Kotlin: `LazyColumn` with `items()`

**Search Filtering:**
- RN: `useMemo` + `filter()`
- Kotlin: `remember(filteredStates)`

### React Native → Swift/SwiftUI

**Bottom Sheet:**
- RN: `@gorhom/bottom-sheet`
- Swift: `.sheet(isPresented:)` + `.presentationDetents([.large])`

**Search Input:**
- RN: `BottomSheetInput` (custom component)
- Swift: `TextField` with `.textInputStyle()`

**Lists:**
- RN: `FlatList`
- Swift: `List` + `ForEach`

**Search Filtering:**
- RN: `useMemo` + `filter()`
- Swift: Computed property or `@State` with `didSet`

---

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin Token | Swift Token | Platform Fallback |
|----------|----------|--------------|-------------|-------------------|
| **Container Gap** | 16pt (StyleSheet) | `16.dp` | `16` | 16pt |
| **Header Gap** | 4pt (StyleSheet) | `4.dp` | `4` | 4pt |
| **Header Padding Bottom** | 16pt (StyleSheet) | `16.dp` | `16` | 16pt |
| **Header Border** | `semantic.color.border.default` | `DividerDefaults.color` | `.divider` | Border color |
| **Title Color** | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `.primary` | #F3F4F6 |
| **Subtitle Color** | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `.secondary` | #9CA3AF |
| **Empty Container Padding** | 48pt vertical, 24pt horizontal | `PaddingValues(vertical = 48.dp, horizontal = 24.dp)` | `.padding(.vertical, 48).padding(.horizontal, 24)` | 48pt, 24pt |
| **Empty Icon Size** | 48pt | `48.dp` | `48` | 48pt |
| **Empty Icon Color** | `semantic.color.onSurface.subtle` | `MaterialTheme.colorScheme.onSurfaceVariant` | `.secondary.opacity(0.5)` | #6B7280 |
| **Empty Text Color** | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `.secondary` | #9CA3AF |
| **Empty Text Align** | Center | `TextAlign.Center` | `.multilineTextAlignment(.center)` | Center |
| **List Gap** | 0 (FlatList) | `Arrangement.spacedBy(0.dp)` | `spacing(0)` | 0 |
| **Footer Padding Top** | 16pt (StyleSheet) | `16.dp` | `16` | 16pt |
| **Footer Border Width** | 0 | `0.dp` | `0` | 0 |
| **Clear Button Width** | 100% | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | 100% |

### Platform-Specific Adjustments

**Android:**
- Use `ModalBottomSheetLayout` for full-height sheet
- Use `TextField` with `leadingIcon` for search
- Use `LazyColumn` with `items()` for list
- Use `OutlinedButton` for clear button

**iOS:**
- Use `.presentationDetents([.large])` for full-height
- Use `.searchable()` modifier for search (iOS 16+)
- Use `List` with `.listStyle(.plain)` for list
- Use `.buttonStyle(.bordered)` for clear button

---

## NOTES

### Zero ESCALATE Tokens
- ✅ No platform-specific APIs requiring escalation
- ✅ Standard bottom sheet patterns
- ✅ Search input is standard component
- ✅ List rendering is standard

### Implementation Considerations

**Kotlin:**
```kotlin
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StateFilterSheet(
  isVisible: Boolean,
  states: List<StateData>,
  selected: List<String>,
  onSelectionChange: (List<String>) -> Unit,
  onDismiss: () -> Unit
) {
  var searchQuery by remember { mutableStateOf("") }

  val filteredStates = remember(states, searchQuery) {
    states.filter {
      it.routeCount > 0 && it.name.contains(searchQuery, ignoreCase = true)
    }
  }

  val totalSelectedRoutes = remember(states, selected) {
    states.filter { it.code in selected }.sumOf { it.routeCount }
  }

  if (isVisible) {
    ModalBottomSheet(
      onDismissRequest = onDismiss,
      sheetState = rememberModalBottomSheetState()
    ) {
      Column(
        modifier = Modifier
          .fillMaxHeight()
          .padding(16.dp)
      ) {
        // Header
        Text(
          text = "Filter by State",
          style = MaterialTheme.typography.titleLarge,
          color = MaterialTheme.colorScheme.onSurface
        )
        Text(
          text = if (selected.isNotEmpty()) {
            "${selected.size} state${if (selected.size > 1) "s" else ""} selected · $totalSelectedRoutes routes"
          } else {
            "Select states to filter routes"
          },
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Search Input
        TextField(
          value = searchQuery,
          onValueChange = { searchQuery = it },
          placeholder = { Text("Search states...") },
          leadingIcon = {
            Icon(Icons.Default.Search, contentDescription = null)
          },
          modifier = Modifier.fillMaxWidth(),
          singleLine = true
        )

        Spacer(modifier = Modifier.height(16.dp))

        // State List
        LazyColumn {
          items(filteredStates, key = { it.code }) { state ->
            StateListItem(
              state = state,
              isSelected = state.code in selected,
              onClick = {
                val nextSelected = if (state.code in selected) {
                  selected - state.code
                } else {
                  selected + state.code
                }
                onSelectionChange(nextSelected)
              }
            )
          }
        }

        // Clear Button
        if (selected.isNotEmpty()) {
          Spacer(modifier = Modifier.height(16.dp))
          Button(
            onClick = {
              onSelectionChange(emptyList())
              onDismiss()
            },
            modifier = Modifier.fillMaxWidth(),
            variant = ButtonVariant.Outline
          ) {
            Text("Clear Selection")
          }
        }
      }
    }
  }
}
```

**Swift:**
```swift
struct StateFilterSheet: View {
  @Binding var isVisible: Bool
  let states: [StateData]
  @Binding var selected: [String]
  var onSelectionChange: ([String]) -> Void = { _ in }

  @State private var searchQuery = ""

  var filteredStates: [StateData] {
    states.filter {
      $0.routeCount > 0 && $0.name.localizedCaseInsensitiveContains(searchQuery)
    }
  }

  var totalSelectedRoutes: Int {
    states.filter { selected.contains($0.code) }.reduce(0) { $0 + $1.routeCount }
  }

  var body: some View {
    .sheet(isPresented: $isVisible) {
      NavigationView {
        VStack(spacing: 16) {
          // Header
          VStack(alignment: .leading, spacing: 4) {
            Text("Filter by State")
              .font(.titleLarge)
              .foregroundColor(.primary)

            Text(selected.isEmpty ? "Select states to filter routes" :
                 "\(selected.count) state\(selected.count != 1 ? "s" : "") selected · \(totalSelectedRoutes) routes")
              .font(.bodyMedium)
              .foregroundColor(.secondary)
          }

          Divider()

          // Search Input
          HStack {
            Image(systemName: "magnify")
              .foregroundColor(.secondary)
            TextField("Search states...", text: $searchQuery)
              .textFieldStyle(.plain)
          }
          .padding()
          .background(Color(uiColor.systemBackground))
          .cornerRadius(8)

          // State List
          ScrollView {
            VStack(spacing: 0) {
              ForEach(filteredStates) { state in
                StateListItem(
                  state: state,
                  isSelected: selected.contains(state.code),
                  onClick: {
                    var nextSelected = selected
                    if let index = nextSelected.firstIndex(of: state.code) {
                      nextSelected.remove(at: index)
                    } else {
                      nextSelected.append(state.code)
                    }
                    onSelectionChange(nextSelected)
                  }
                )
              }
            }
          }

          // Clear Button
          if !selected.isEmpty {
            Button(action: {
              onSelectionChange([])
              isVisible = false
            }) {
              Text("Clear Selection")
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .padding(.top, 16)
          }
        }
        .padding()
        .navigationTitle("Filter by State")
        .navigationBarTitleDisplayMode(.inline)
      }
      .presentationDetents([.large])
      .presentationDragIndicator(.visible)
    }
  }
}
```

### Testing Notes
- Test search filtering with various queries
- Test state toggle (add/remove from selection)
- Test empty state display
- Test clear button visibility (only when selection exists)
- Test keyboard handling with BottomSheetInput
- Test scroll performance with 50+ states
- Verify accessibility (VoiceOver/TalkBack)
- Test that zero-route states are hidden

### Dependencies
- **Required:** StateData structure
- **Required:** StateListItem component
- **Required:** BottomSheetWrapper component
- **Required:** BottomSheetInput component
- **Required:** Button component
- **Required:** IconSymbol component
- **Optional:** MOCK_US_STATES data (for design testing)

### Backend Integration
- **Critical:** Requires database query for state route counts (CUR-012)
- **Query:** `GET /api/states?withRouteCounts=true`
- **Response:** Array of `{code, name, routeCount}`
- **Performance:** Consider pagination if 50+ states with many routes

### UX Considerations
- **Search Debouncing:** Add 150-300ms delay to avoid excessive re-renders
- **Keyboard Handling:** BottomSheetInput integrates with Gorhom keyboard handling
- **Selection Persistence:** Save selected states to user preferences
- **Selected States First:** Show selected states at top of list (optional enhancement)

### Accessibility
- Search input should have `placeholder` and `accessibilityLabel`
- Each state item should have `accessibilityLabel` ("California, 156 routes")
- Selected state should have `accessibilityState.selected`
- Clear button should have `accessibilityLabel`
- Test with VoiceOver (iOS) and TalkBack (Android)

### Performance Considerations
- Use `useMemo` / `remember` for filtered states
- Use `keyExtractor` in FlatList / `key` in ForEach
- Avoid inline functions in renderItem / items
- Consider virtualization if 100+ states
- Debounce search input (150-300ms)
