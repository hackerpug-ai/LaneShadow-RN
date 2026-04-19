# FavoriteRoadsSection - Organism Matrix

**Component Source:** `react-native/components/settings/favorite-roads-section.tsx`

**Atomic Level:** Organism

**Domain:** Settings / Routes

---

## COMPOSITION ANALYSIS

### Child Components
- **Internal Components:**
  - `SectionHeader` - Section title
  - `SavedRouteCard` - Individual route card
  - `EmptyState` - No routes placeholder
  - `DeleteFavoriteDialog` - Delete confirmation
  - `IconSymbol` - Delete icon
- **Composition Pattern:**
  - Loading state (skeleton placeholders)
  - Empty state (EmptyState component)
  - List state (FlatList with cards)
  - Delete confirmation dialog

### Layout Structure
```
FavoriteRoadsSection
├── Loading State (conditional)
│   ├── SectionHeader
│   └── Skeleton placeholders (3)
├── Empty State (conditional)
│   ├── SectionHeader
│   ├── EmptyState
│   └── DeleteFavoriteDialog (hidden)
└── List State (conditional)
    ├── SectionHeader
    ├── FlatList
    │   └── SavedRouteCardWithDelete (per item)
    │       ├── SavedRouteCard
    │       └── Delete Button
    └── DeleteFavoriteDialog
```

---

## STATE & BEHAVIOR

### State Management
- **Local State:**
  - `deleteTarget: string | null` - Route ID pending deletion
- **Remote State (Convex):**
  - `savedRoutesData` - From `useQuery(api.db.savedRoutes.getSavedRoutesList)`
- **Mutations:**
  - `softDeleteRoute` - From `useMutation(api.db.savedRoutes.softDeleteRoute)`
- **Derived State:**
  - `routeToDelete` - Route object for dialog display
  - Loading states from Convex query

### User Interactions
- **Card Press:**
  - Navigates to route detail (TODO in comments)
- **Delete Button Press:**
  - Opens confirmation dialog
  - Sets `deleteTarget` state
- **Confirm Delete:**
  - Calls `softDeleteRoute` mutation
  - Clears `deleteTarget` state
- **Cancel Delete:**
  - Clears `deleteTarget` state
  - Closes dialog

### Data Flow
- Query fetches saved routes on mount
- Loading state shows skeletons
- Empty state shows when no routes
- List renders when routes exist
- Delete mutation triggers optimistic update

---

## TRANSLATION SOURCES

### React Native → Kotlin/Compose

**Data Fetching:**
- RN: `useQuery` (Convex)
- Kotlin: `StateFlow` in ViewModel + `LaunchedEffect`

**Lists:**
- RN: `FlatList`
- Kotlin: `LazyColumn`

**Dialogs:**
- RN: `DeleteFavoriteDialog` (custom component)
- Kotlin: `AlertDialog` from Material 3

**State Management:**
- RN: `useState` + Convex mutations
- Kotlin: `ViewModel` + `mutableStateOf`

### React Native → Swift/SwiftUI

**Data Fetching:**
- RN: `useQuery` (Convex)
- Swift: `@ObservedObject` + async/await

**Lists:**
- RN: `FlatList`
- Swift: `List` + `ForEach`

**Dialogs:**
- RN: `DeleteFavoriteDialog` (custom component)
- Swift: `.alert()` or `.confirmationDialog()`

**State Management:**
- RN: `useState` + Convex mutations
- Swift: `@State` + `@StateObject`

---

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin Token | Swift Token | Platform Fallback |
|----------|----------|--------------|-------------|-------------------|
| **Section Margin Bottom** | `semantic.space.lg` | `16.dp` | `16` | 16pt |
| **Card Row Gap** | 12pt (StyleSheet) | `12.dp` | `12` | 12pt |
| **Delete Button Padding** | 8pt (StyleSheet) | `8.dp` | `8` | 8pt |
| **Delete Button Radius** | 8pt (StyleSheet) | `8.dp` | `8` | 8pt |
| **Delete Icon Color** | `semantic.color.danger.default` | `MaterialTheme.colorScheme.error` | `.red` | #E35D6A |
| **Skeleton Height** | 80pt (StyleSheet) | `80.dp` | `80` | 80pt |
| **Skeleton Background** | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `.thickMaterial` | #2B2E33 |
| **Skeleton Border Radius** | `semantic.radius.lg` | `MaterialTheme.shapes.medium` | `.cornerRadius(12)` | 12pt |
| **Item Separator Height** | `semantic.space.md` | `12.dp` | `12` | 12pt |
| **Pressed Opacity** | 0.6 | `alpha = 0.6f` | `.opacity(0.6)` | 60% |

### Platform-Specific Adjustments

**Android:**
- Use `LazyColumn` with `items()` for list
- Use `SwipeToDismiss` for delete action
- Skeleton with `LinearProgressIndicator` or `Box` shimmer

**iOS:**
- Use `List` with `.onDelete()` for swipe-to-delete
- Skeleton with `.redacted(reason: .placeholder)`
- Native confirmation dialog with `.alert()`

---

## NOTES

### Zero ESCALATE Tokens
- ✅ No platform-specific APIs requiring escalation
- ✅ Standard list rendering patterns
- ✅ Dialog APIs are standard on both platforms
- ⚠️ **Backend Dependency:** Convex queries/mutations need native backend integration

### Implementation Considerations

**Kotlin:**
```kotlin
@Composable
fun FavoriteRoadsSection(
  viewModel: FavoriteRoadsViewModel = viewModel()
) {
  val routes by viewModel.routes.collectAsState()
  val showDeleteDialog by viewModel.showDeleteDialog.collectAsState()

  LazyColumn {
    items(routes, key = { it.id }) { route ->
      SavedRouteCard(
        route = route,
        onDelete = { viewModel.setDeleteTarget(route.id) }
      )
    }
  }

  if (showDeleteDialog) {
    DeleteDialog(
      onConfirm = { viewModel.confirmDelete() },
      onDismiss = { viewModel.dismissDelete() }
    )
  }
}
```

**Swift:**
```swift
struct FavoriteRoadsSection: View {
  @ObservedObject var viewModel: FavoriteRoadsViewModel

  var body: some View {
    List {
      ForEach(viewModel.routes) { route in
        SavedRouteCard(route: route)
          .swipeActions {
            Button(role: .destructive) {
              viewModel.setDeleteTarget(route.id)
            } label: {
              Label("Delete", systemImage: "trash")
            }
          }
      }
    }
    .alert("Delete Route?", isPresented: $viewModel.showDeleteDialog) {
      Button("Delete", role: .destructive) { viewModel.confirmDelete() }
      Button("Cancel", role: .cancel) {}
    }
  }
}
```

### Testing Notes
- Test loading skeleton rendering
- Test empty state display
- Test list scroll performance with many routes
- Test delete dialog appearance/dismissal
- Test optimistic updates after delete
- Test error handling if delete fails
- Verify Convex backend integration

### Backend Integration
- **Critical:** Requires Convex backend for `savedRoutes.getSavedRoutesList`
- **Critical:** Requires Convex backend for `savedRoutes.softDeleteRoute`
- Consider offline-first architecture with local caching
- Error handling for network failures

### Dependencies
- **Required:** Convex client (or equivalent backend)
- **Required:** SavedRouteCard component
- **Required:** SectionHeader component
- **Required:** EmptyState component
- **Required:** DeleteFavoriteDialog component
