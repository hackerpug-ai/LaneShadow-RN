# DiscoveryFilterBar Component Matrix

**Component Path:** `react-native/components/discovery/discovery-filter-bar.tsx`
**Atomic Level:** Molecule
**Domain:** Discovery
**Last Updated:** 2025-01-18

---

## COMPOSITION

**React Native Source:**
```tsx
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Chip } from '../ui/chip'
```

**Child Dependencies:**
- `Chip` (atom) - archetype filter chips
- `ScrollView` (React Native core) - horizontal scrolling

**Layout Structure:**
```
DiscoveryFilterBar (glass-morphic horizontal bar)
└── ScrollView (horizontal)
    ├── Chip: "All (count)"
    ├── Chip: "Twisties (count)"
    ├── Chip: "Scenic (count)"
    ├── Chip: "Technical (count)"
    ├── Chip: "Cruising (count)"
    ├── Chip: "Sport (count)"
    └── Chip: "Adventure (count)"
```

---

## TRANSLATION SOURCES

### Kotlin/Compose

**Dependencies:**
- `androidx.compose.foundation.layout.Row`
- `androidx.compose.foundation.lazy.LazyRow`
- `Chip` atom (from `ui/atoms/Chip.kt`)

**Platform Equivalents:**
- `ScrollView` → `LazyRow`
- `Chip` (atom) → `Chip` composable
- `StyleSheet` → `Modifier` chain

### Swift/SwiftUI

**Dependencies:**
- `SwiftUI.HStack`
- `SwiftUI.ScrollView`
- `Chip` atom (from `UI/Atoms/Chip.swift`)

**Platform Equivalents:**
- `ScrollView` → `ScrollView(.horizontal)`
- `Chip` (atom) → `Chip` view
- `StyleSheet` → View modifier chain

---

## STYLE PROPERTIES MATRIX

| Element | Property | Token Path (Light) | Token Path (Dark) | Platform Mapping |
|---------|----------|-------------------|------------------|------------------|
| **Container Background** | Color | `semantic.color.surface.default + 80% opacity` | `semantic.color.surface.default + 80% opacity` | `MaterialTheme.colorScheme.surface.copy(alpha = 0.8f)` |
| **Container Bottom Border** | Color | `semantic.color.border.default + 20% opacity` | `semantic.color.border.default + 20% opacity` | `MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)` |
| **Container Bottom Border** | Width | `1` (1pt) | `1` (1pt) | `1.dp` / `strokeWidth: 1` |
| **Container Top Padding** | Spacing | `insets.top + semantic.space.md` | `insets.top + semantic.space.md` | `WindowInsets.statusBars.asPaddingValues() + 12.dp` |
| **Container Bottom Padding** | Spacing | `semantic.space.md` (12pt) | `semantic.space.md` (12pt) | `12.dp` / `padding(.bottom, 12)` |
| **Container Horizontal Padding** | Spacing | `semantic.space.lg` (16pt) | `semantic.space.lg` (16pt) | `16.dp` / `padding(.horizontal, 16)` |
| **Chip Gap** | Spacing | `semantic.space.sm` (8pt) | `semantic.space.sm` (8pt) | `8.dp` / `spacing: 8` |
| **Chip Icon Mapping** | Icons | Custom per archetype | Custom per archetype | Material Icons / SF Symbols |
| **Chip Labels** | Text | Uppercase first letter | Uppercase first letter | `capitalize()` / `.capitalized` |
| **Chip Format** | Count | `formatCount()` | `formatCount()` | Custom function |

---

## IMPLEMENTATION NOTES

### Glassmorphic Pattern

**80% Opacity Background:**
```tsx
backgroundColor: `${semantic.color.surface.default}CC` // 80% opacity (CC hex = 204)
```

**20% Opacity Border:**
```tsx
borderBottomColor: `${semantic.color.border.default}33` // 20% opacity (33 hex = 51)
```

The glassmorphic effect allows map content to show through subtly while maintaining legibility of the filter chips.

### Safe Area Handling

**Top Padding:**
```tsx
paddingTop: insets.top + semantic.space.md
```

The filter bar extends to the top of the screen and accounts for the status bar area via `useSafeAreaInsets()`.

### Chip Behavior

**"All" Chip:**
- Always visible
- Clears all selected archetypes when pressed
- Shows total route count across all archetypes
- Selected state: `selectedArchetypes.length === 0`

**Archetype Chips:**
- Toggle individual archetypes
- Multi-select allowed
- Last selected archetype deselection → shows all (clears filter)

### Count Formatting

**formatCount Function:**
```tsx
const formatCount = (count: number): string => {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k` // 1.2k, 3.4k
  if (count > 99) return '99+'                            // 99+
  return count.toString()                                  // 0-99
}
```

### Icon Mapping

**Archetype Icons:**

| Archetype | RN Icon (react-native-paper) | Android (Material Icons) | iOS (SF Symbols) |
|-----------|------------------------------|--------------------------|------------------|
| All | `check-all` | `Icons.Default.CheckCircle` | `checkmark.circle.fill` |
| Twisties | `road-variant` | `Icons.Default.Timeline` | `road.lanes.curved.left` |
| Scenic | `landscape` | `Icons.Default.Landscape` | `mountain.2.fill` |
| Technical | `wrench` | `Icons.Default.Build` | `wrench.and.screwdriver` |
| Cruising | `motorbike` | `Icons.Default.TwoWheeler` | `figure.outdoor.tricycle` |
| Sport | `fire` | `Icons.Default.LocalFireDepartment` | `flame.fill` |
| Adventure | `compass` | `Icons.Default.Explore` | `compass.fill` |

### Horizontal Scrolling

**ScrollView Configuration:**
```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.scrollContent}
>
```

- Horizontal scrolling only
- Hides scroll indicator for cleaner appearance
- Maintains spacing between chips

---

## PLATFORM-SPECIFIC CONSIDERATIONS

### Android (Kotlin/Compose)

**LazyRow:**
```kotlin
LazyRow(
  modifier = Modifier
    .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.8f))
    .drawWithContent {
      drawContent()
      // Draw bottom border
      drawLine(
        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f),
        strokeWidth = 1.dp.toPx(),
        start = Offset(0f, size.height),
        end = Offset(size.width, size.height)
      )
    }
    .padding(
      top = WindowInsets.statusBars.asPaddingValues().calculateTopPadding() + 12.dp,
      bottom = 12.dp,
      start = 16.dp,
      end = 16.dp
    ),
  horizontalArrangement = Arrangement.spacedBy(8.dp)
) {
  // Chips...
}
```

**Chip Composition:**
```kotlin
@Composable
fun FilterChip(
  label: String,
  icon: ImageVector,
  selected: Boolean,
  onClick: () -> Unit
) {
  Chip(
    onClick = onClick,
    label = { Text(label) },
    icon = { Icon(imageVector = icon, contentDescription = null) },
    selected = selected
  )
}
```

### iOS (Swift/SwiftUI)

**ScrollView:**
```swift
ScrollView(.horizontal, showsIndicators: false) {
  HStack(spacing: 8) {
    // Chips...
  }
  .padding(.top, safeArea.top + 12)
  .padding(.bottom, 12)
  .padding(.horizontal, 16)
}
.background(Color.surface.opacity(0.8))
.overlay(
  Rectangle()
    .fill(Color.border.opacity(0.2))
    .frame(height: 1)
    .frame(maxWidth: .infinity, alignment: .bottom)
)
```

**Chip Composition:**
```swift
struct FilterChip: View {
  let label: String
  let icon: String
  let selected: Bool
  let onTap: () -> Void

  var body: some View {
    Chip(label: label, icon: icon, selected: selected, onTap: onTap)
  }
}
```

---

## USAGE EXAMPLES

### Basic Usage

```tsx
<DiscoveryFilterBar
  selectedArchetypes={['twisties', 'scenic']}
  onArchetypeChange={(archetypes) => console.log(archetypes)}
  counts={{
    all: 150,
    twisties: 45,
    scenic: 38,
    technical: 22,
    cruising: 18,
    sport: 15,
    adventure: 12
  }}
  testID="discovery-filter-bar"
/>
```

### All Routes Selected

```tsx
<DiscoveryFilterBar
  selectedArchetypes={[]}
  onArchetypeChange={(archetypes) => console.log(archetypes)}
  counts={{
    all: 150,
    twisties: 45,
    scenic: 38,
    technical: 22,
    cruising: 18,
    sport: 15,
    adventure: 12
  }}
  testID="discovery-filter-bar"
/>
```

---

## ACCESSIBILITY

**Accessibility Labels:**
- Each chip: `"${label} routes, ${count} available"`
- Example: `"Twisties routes, 45 available"`

**Accessibility Hints:**
- "Double tap to toggle filter"

**Accessibility Role:**
- `role = "tab"` or `.accessibilityAddTraits(.isButton)`

---

## ESCALATE

None. All required tokens and platform equivalents are available.

**Note:** The `Chip` atom must be implemented before this molecule. Reference the `Chip.md` matrix for implementation details.
