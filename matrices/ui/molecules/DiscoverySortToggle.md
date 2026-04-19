# DiscoverySortToggle Component Matrix

**Component Path:** `react-native/components/discovery/discovery-sort-toggle.tsx`
**Atomic Level:** Molecule
**Domain:** Discovery
**Last Updated:** 2025-01-18

---

## COMPOSITION

**React Native Source:**
```tsx
import { StyleSheet, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
```

**Child Dependencies:**
- `ToggleGroup` (molecule) - segmented control
- `ToggleGroupItem` (molecule) - toggle buttons

**Layout Structure:**
```
DiscoverySortToggle (glass-morphic container)
└── ToggleGroup (single-select segmented control)
    ├── ToggleGroupItem: "Best"
    └── ToggleGroupItem: "Nearest"
```

---

## TRANSLATION SOURCES

### Kotlin/Compose

**Dependencies:**
- `androidx.compose.material3.Surface`
- `androidx.compose.material3.FilterChip` or segmented control
- `ToggleGroup` molecule (from `ui/molecules/ToggleGroup.kt`)

**Platform Equivalents:**
- `ToggleGroup` → `FilterChip` group or custom segmented control
- `ToggleGroupItem` → `FilterChip`
- `StyleSheet` → `Modifier` chain

### Swift/SwiftUI

**Dependencies:**
- `SwiftUI.Picker`
- `SwiftUI.HStack`
- `ToggleGroup` molecule (from `UI/Molecules/ToggleGroup.swift`)

**Platform Equivalents:**
- `ToggleGroup` → `Picker` with `.segmented` style or `HStack` of buttons
- `ToggleGroupItem` → Picker views or toggle buttons
- `StyleSheet` → View modifier chain

---

## STYLE PROPERTIES MATRIX

| Element | Property | Token Path (Light) | Token Path (Dark) | Platform Mapping |
|---------|----------|-------------------|------------------|------------------|
| **Container Background** | Color | `semantic.color.surface.default + 80% opacity` | `semantic.color.surface.default + 80% opacity` | `MaterialTheme.colorScheme.surface.copy(alpha = 0.8f)` |
| **Container Border** | Color | `semantic.color.border.default + 20% opacity` | `semantic.color.border.default + 20% opacity` | `MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)` |
| **Container Border** | Width | `1` (1pt) | `1` (1pt) | `1.dp` / `strokeWidth: 1` |
| **Container Radius** | Corner radius | `semantic.radius.md` (8pt) | `semantic.radius.md` (8pt) | `8.dp` / `cornerRadius: 8` |
| **Container Padding** | Spacing | `semantic.space.xs` (4pt) | `semantic.space.xs` (4pt) | `4.dp` / `padding: 4` |
| **ToggleGroup Size** | Variant | `"sm"` (small) | `"sm"` (small) | Custom size prop |
| **ToggleGroup Variant** | Style | `"outline"` | `"outline"` | outlined variant |
| **ToggleGroup Type** | Selection | `"single"` (single-select) | `"single"` (single-select) | single selection mode |

---

## IMPLEMENTATION NOTES

### Glassmorphic Pattern

**80% Opacity Background:**
```tsx
backgroundColor: `${semantic.color.surface.default}CC` // 80% opacity
```

**20% Opacity Border:**
```tsx
borderColor: `${semantic.color.border.default}33` // 20% opacity
```

Matches the glassmorphic styling of DiscoveryFilterBar for visual consistency across the discovery screen header.

### ToggleGroup Configuration

**Single-Select Mode:**
```tsx
type="single"
value={mode}
onValueChange={(value) => onModeChange(value as SortMode)}
```

Only one sort mode can be active at a time.

**Outline Variant:**
```tsx
variant="outline"
```

Provides a bordered appearance that works well with the glassmorphic container.

**Small Size:**
```tsx
size="sm"
```

Compact sizing for unobtrusive placement near the filter bar.

### Sort Modes

**Best Mode:**
- Sorts routes by a composite score (scenic quality, road conditions, rider preferences)
- Default mode

**Nearest Mode:**
- Sorts routes by distance from current location
- Alternative for finding nearby rides

### Layout Alignment

**Self Alignment:**
```tsx
alignSelf: 'flex-start'
```

Left-aligned to match the filter bar, creating a cohesive header layout.

### Test ID Pattern

**Default:**
```tsx
testID = 'discovery-sort-toggle'
```

---

## PLATFORM-SPECIFIC CONSIDERATIONS

### Android (Kotlin/Compose)

**FilterChip Group:**
```kotlin
@Composable
fun DiscoverySortToggle(
  mode: SortMode,
  onModeChange: (SortMode) -> Unit,
  modifier: Modifier = Modifier
) {
  Surface(
    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f),
    shape = RoundedCornerShape(8.dp),
    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)),
    modifier = modifier.padding(4.dp)
  ) {
    Row(
      horizontalArrangement = Arrangement.Start,
      modifier = Modifier.padding(4.dp)
    ) {
      SortMode.values().forEach { sortMode ->
        FilterChip(
          selected = mode == sortMode,
          onClick = { onModeChange(sortMode) },
          label = { Text(sortMode.label, style = MaterialTheme.typography.labelSmall) },
          modifier = Modifier.padding(end = 4.dp)
        )
      }
    }
  }
}

enum class SortMode(val label: String) {
  BEST("Best"),
  NEAREST("Nearest")
}
```

**Alternative: Segmented Button:**
```kotlin
// Using Material 3 SegmentedButton
Row(
  modifier = Modifier
    .background(
      MaterialTheme.colorScheme.surface.copy(alpha = 0.8f),
      RoundedCornerShape(8.dp)
    )
    .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
    .padding(4.dp)
) {
  SegmentedButton(
    selected = mode == SortMode.BEST,
    onClick = { onModeChange(SortMode.BEST) },
    shape = RoundedCornerShape(8.dp)
  ) {
    Text("Best")
  }
  SegmentedButton(
    selected = mode == SortMode.NEAREST,
    onClick = { onModeChange(SortMode.NEAREST) },
    shape = RoundedCornerShape(8.dp)
  ) {
    Text("Nearest")
  }
}
```

### iOS (Swift/SwiftUI)

**Picker with Segmented Style:**
```swift
struct DiscoverySortToggle: View {
  @Environment(\.semanticTheme) var semantic
  @Binding var mode: SortMode
  let onModeChange: (SortMode) -> Void

  var body: some View {
    Picker("Sort mode", selection: $mode) {
      Text("Best").tag(SortMode.best)
      Text("Nearest").tag(SortMode.nearest)
    }
    .pickerStyle(.segmented)
    .background(Color.surface.opacity(0.8))
    .overlay(
      RoundedRectangle(cornerRadius: 8)
        .stroke(Color.border.opacity(0.2), lineWidth: 1)
    )
    .padding(4)
  }
}

enum SortMode: String, CaseIterable {
  case best, nearest

  var label: String {
    rawValue.capitalized
  }
}
```

**Alternative: Custom Toggle Buttons:**
```swift
struct DiscoverySortToggle: View {
  @Environment(\.semanticTheme) var semantic
  @Binding var mode: SortMode
  let onModeChange: (SortMode) -> Void

  var body: some View {
    HStack(spacing: 4) {
      ForEach(SortMode.allCases, id: \.self) { sortMode in
        Button(action: { onModeChange(sortMode) }) {
          Text(sortMode.label)
            .font(.caption)
            .foregroundStyle(mode == sortMode ? Color.onSurface : Color.onSurfaceMuted)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(
              mode == sortMode ? Color.surfaceVariant : Color.clear,
              in: RoundedRectangle(cornerRadius: 8)
            )
        }
      }
    }
    .padding(4)
    .background(Color.surface.opacity(0.8), in: RoundedRectangle(cornerRadius: 8))
    .overlay(
      RoundedRectangle(cornerRadius: 8)
        .stroke(Color.border.opacity(0.2), lineWidth: 1)
    )
  }
}
```

---

## USAGE EXAMPLES

### Basic Usage

```tsx
<DiscoverySortToggle
  mode="best"
  onModeChange={(mode) => console.log('Sort mode:', mode)}
  testID="discovery-sort-toggle"
/>
```

### With State

```tsx
const [sortMode, setSortMode] = useState<SortMode>('best')

<DiscoverySortToggle
  mode={sortMode}
  onModeChange={setSortMode}
  testID="discovery-sort-toggle"
/>
```

---

## ACCESSIBILITY

**Accessibility Labels:**
- "Sort by best score" (Best mode)
- "Sort by nearest distance" (Nearest mode)

**Accessibility Role:**
- `role = "radiogroup"` on Android
- `.accessibilityElement(children: .contain)` on iOS

**Accessibility Value:**
- Announces currently selected mode: "Best, selected"

---

## ESCALATE

None. All required tokens and platform equivalents are available.

**Note:** The `ToggleGroup` molecule must be implemented before this molecule. Reference the `ToggleGroup.md` matrix for implementation details.
