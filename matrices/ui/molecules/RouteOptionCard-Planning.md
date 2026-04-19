# RouteOptionCard (Planning Variant) Component Matrix

**Component Path:** `react-native/components/planning/route-option-card.tsx`
**Atomic Level:** Molecule
**Domain:** Planning
**Last Updated:** 2025-01-18

---

## COMPOSITION

**React Native Source:**
```tsx
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { Badge } from '../ui/badge'
import { IconSymbol } from '../ui/icon-symbol'
import { RainBadge } from '../ui/rain-badge'
import { TemperatureBadge } from '../ui/temperature-badge'
import { WindBadge } from './wind-badge'
```

**Child Dependencies:**
- `Badge` (atom) - favorite count badge
- `IconSymbol` (atom) - checkmark, heart icons
- `RainBadge` (molecule) - rain intensity badge
- `TemperatureBadge` (molecule) - temperature badge
- `WindBadge` (molecule) - wind level badge

**Layout Structure:**
```
RouteOptionCard (pressable card)
├── Header
│   ├── Title Row
│   │   ├── Route Label (titleMedium)
│   │   └── Checkmark Icon (conditional)
│   └── Rationale (bodyMedium)
├── Stats Row
│   ├── Distance Stat
│   ├── Duration Stat
│   └── Weather Row
│       ├── Wind Badge
│       ├── Rain Badge
│       ├── Temperature Badge
│       └── Favorites Badge (conditional)
└── Favorite List (conditional expandable)
```

---

## TRANSLATION SOURCES

### Kotlin/Compose

**Dependencies:**
- `androidx.compose.foundation.layout.Column`
- `androidx.compose.foundation.layout.Row`
- `androidx.compose.material3.Card`
- `androidx.compose.material3.CardDefaults`
- `Badge` atom (from `ui/atoms/Badge.kt`)
- `IconSymbol` atom (from `ui/atoms/IconSymbol.kt`)
- `RainBadge` molecule (from `ui/molecules/RainBadge.kt`)
- `TemperatureBadge` molecule (from `ui/molecules/TemperatureBadge.kt`)
- `WindBadge` molecule (from `ui/molecules/WindBadge.kt`)

**Platform Equivalents:**
- `Pressable` → `Card` with `clickable`
- `StyleSheet` → `Modifier` chain

### Swift/SwiftUI

**Dependencies:**
- `SwiftUI.VStack`
- `SwiftUI.HStack`
- `Badge` atom (from `UI/Atoms/Badge.swift`)
- `IconSymbol` atom (from `UI/Atoms/IconSymbol.swift`)
- `RainBadge` molecule (from `UI/Molecules/RainBadge.swift`)
- `TemperatureBadge` molecule (from `UI/Molecules/TemperatureBadge.swift`)
- `WindBadge` molecule (from `UI/Molecules/WindBadge.swift`)

**Platform Equivalents:**
- `Pressable` → `Button` or `.onTapGesture`
- `StyleSheet` → View modifier chain

---

## STYLE PROPERTIES MATRIX

| Element | Property | Token Path (Light) | Token Path (Dark) | Platform Mapping |
|---------|----------|-------------------|------------------|------------------|
| **Card Background** | Color | `semantic.color.surface.default` | `semantic.color.surface.default` | `MaterialTheme.colorScheme.surface` |
| **Card Border Width** | Selected | `2` (2pt) | `2` (2pt) | `2.dp` / `strokeWidth: 2` |
| **Card Border Width** | Unselected | `1` (1pt) | `1` (1pt) | `1.dp` / `strokeWidth: 1` |
| **Card Border Color** | Selected | `semantic.color.primary.default` | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` |
| **Card Border Color** | Unselected | `semantic.color.border.default` | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` |
| **Card Radius** | Corner radius | `semantic.radius.lg` (16pt) | `semantic.radius.lg` (16pt) | `16.dp` / `cornerRadius: 16` |
| **Card Padding** | Spacing | `semantic.space.md` (12pt) | `semantic.space.md` (12pt) | `12.dp` / `padding: 12` |
| **Card Opacity** | Loading state | `0.6` (60%) | `0.6` (60%) | `alpha = 0.6f` / `.opacity(0.6)` |
| **Card Margin Vertical** | Spacing | `4` (4pt) | `4` (4pt) | `4.dp` / `margin(.vertical, 4)` |
| **Title Font** | Typography | `variant="titleMedium"` | `variant="titleMedium"` | `Typography.titleMedium` / `Font.title3` |
| **Title Color** | Color | `semantic.color.onSurface.default` | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` |
| **Checkmark Icon Size** | Dimension | `20` (20pt) | `20` (20pt) | `20.dp` / `frame(width: 20, height: 20)` |
| **Checkmark Icon Color** | Color | `semantic.color.primary.default` | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` |
| **Checkmark Left Margin** | Spacing | `8` (8pt) | `8` (8pt) | `8.dp` / `padding(.leading, 8)` |
| **Rationale Font** | Typography | `variant="bodyMedium"` | `variant="bodyMedium"` | `Typography.bodyMedium` / `Font.body` |
| **Rationale Color** | Color | `semantic.color.onSurface.muted` | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` |
| **Rationale Line Height** | Line spacing | `20` (20pt) | `20` (20pt) | `20.sp` / `lineLimit: 2` |
| **Header Bottom Margin** | Spacing | `12` (12pt) | `12` (12pt) | `12.dp` / `margin(.bottom, 12)` |
| **Stats Row Gap** | Spacing | `8` (8pt) | `8` (8pt) | `8.dp` / `spacing: 8` |
| **Stat Label Font** | Typography | `variant="bodySmall"` | `variant="bodySmall"` | `Typography.bodySmall` / `Font.caption` |
| **Stat Label Color** | Color | `semantic.color.onSurface.muted` | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` |
| **Stat Value Font** | Typography | `variant="labelMedium"` | `variant="labelMedium"` | `Typography.labelMedium` / `Font.subheadline` |
| **Stat Value Color** | Color | `semantic.color.onSurface.default` | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` |
| **Weather Row Gap** | Spacing | `8` (8pt) | `8` (8pt) | `8.dp` / `spacing: 8` |
| **Weather Item Flex** | Layout | `1` (equal width) | `1` (equal width) | `Modifier.weight(1f)` / `.frame(maxWidth: .infinity)` |
| **Favorite Badge Background** | Opacity | `surface.default + 50% opacity` | `surface.default + 50% opacity` | `MaterialTheme.colorScheme.surface.copy(alpha = 0.5f)` |
| **Favorite List Radius** | Corner radius | `semantic.radius.md` (8pt) | `semantic.radius.md` (8pt) | `8.dp` / `cornerRadius: 8` |
| **Favorite List Padding** | Spacing | `semantic.space.sm` (8pt) | `semantic.space.sm` (8pt) | `8.dp` / `padding: 8` |
| **Favorite List Top Margin** | Spacing | `semantic.space.sm` (8pt) | `semantic.space.sm` (8pt) | `8.dp` / `margin(.top, 8)` |
| **Favorite List Title Weight** | Font weight | `600` (semibold) | `600` (semibold) | `FontWeight.SemiBold` / `.semibold()` |
| **Favorite List Title Bottom Margin** | Spacing | `4` (4pt) | `4` (4pt) | `4.dp` / `margin(.bottom, 4)` |
| **Favorite Name Bottom Margin** | Spacing | `2` (2pt) | `2` (2pt) | `2.dp` / `margin(.bottom, 2)` |

---

## IMPLEMENTATION NOTES

### Selection State

**Border Styling:**
```tsx
borderColor: isSelected ? semantic.color.primary.default : semantic.color.border.default
borderWidth: isSelected ? 2 : 1
```

Selected routes get a 2pt copper border; unselected routes get a 1pt gray border.

**Checkmark Icon:**
- Shows check-circle icon when selected and not loading
- Shows loading spinner icon when selected and loading
- No icon when unselected

### Loading State

**Visual Feedback:**
```tsx
opacity: isLoading ? 0.6 : 1
disabled={isLoading}
```

Card is dimmed and not tappable while loading.

### Data Formatting

**Distance:**
```tsx
const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${meters}m`
  return `${(meters / 1000).toFixed(1)}km`
}
```
- Below 1km: `"850m"`
- 1km and above: `"12.5km"`

**Duration:**
```tsx
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
```
- Under 1 hour: `"45m"`
- 1 hour+: `"2h 30m"`

### Favorites Integration

**Badge Display:**
- Shows when `includeFavorites = true`
- Displays count with heart icon
- Outline variant when count = 0
- Default variant when count > 0

**Expandable List:**
- Tap badge to toggle favorite names list
- Shows bullet-point list of favorite road names
- Semi-transparent background

**Badge Pressable:**
```tsx
accessibilityLabel={`Route includes ${favoriteCount} favorite${favoriteCount === 1 ? '' : 's'}`}
```

### Layout Behavior

**Stats Row:**
- Left section (distance, duration): `flex: 1` each
- Right section (weather badges): `flex: 3`
- Even spacing with `gap: 8`

**Weather Row:**
- 4 items (wind, rain, temp, favorites)
- Equal width: `flex: 1` each
- Center-aligned content

### Touch Handling

**Card Press:**
- Calls `onSelect(routeOptionId)`
- Disabled when `isLoading = true`

**Favorite Badge Press:**
- Toggles `showFavorites` state
- Independent of card selection

---

## PLATFORM-SPECIFIC CONSIDERATIONS

### Android (Kotlin/Compose)

**Card with Selection:**
```kotlin
Card(
  onClick = { onSelect(routeOption.routeOptionId) },
  enabled = !isLoading,
  colors = CardDefaults.cardColors(
    containerColor = MaterialTheme.colorScheme.surface
  ),
  border = BorderStroke(
    width = if (isSelected) 2.dp else 1.dp,
    color = if (isSelected) MaterialTheme.colorScheme.primary
              else MaterialTheme.colorScheme.outline
  ),
  shape = RoundedCornerShape(16.dp),
  modifier = Modifier
    .padding(12.dp)
    .alpha(if (isLoading) 0.6f else 1f)
) {
  Column(modifier = Modifier.padding(12.dp)) {
    // Content...
  }
}
```

**Icon Mapping:**
- `check-circle` → `Icons.Filled.CheckCircle`
- `loading` → `Icons.Outlined.Refresh` (with rotation animation)
- `heart` → `Icons.Filled.Favorite` or `Icons.Outlined.FavoriteBorder`

### iOS (Swift/SwiftUI)

**Button with Selection Border:**
```swift
Button(action: { onSelect(routeOption.routeOptionId) }) {
  VStack(alignment: .leading, spacing: 12) {
    // Content...
  }
  .padding(12)
  .background(Color.surface)
  .cornerRadius(16)
  .overlay(
    RoundedRectangle(cornerRadius: 16)
      .stroke(isSelected ? Color.primary : Color.border, lineWidth: isSelected ? 2 : 1)
  )
  .opacity(isLoading ? 0.6 : 1)
}
.disabled(isLoading)
```

**SF Symbol Mapping:**
- `check-circle` → `checkmark.circle.fill`
- `loading` → `arrow.clockwise` (with `.rotationEffect`)
- `heart` → `heart.fill` or `heart`

---

## USAGE EXAMPLES

### Basic Usage

```tsx
<RouteOptionCard
  routeOption={routeOption}
  isSelected={selectedRouteId === routeOption.routeOptionId}
  isLoading={isLoadingRoute}
  onSelect={(routeOptionId) => setSelectedRouteId(routeOptionId)}
  testID="route-option-1"
/>
```

### With Favorites

```tsx
<RouteOptionCard
  routeOption={routeOption}
  isSelected={selectedRouteId === routeOption.routeOptionId}
  onSelect={(routeOptionId) => setSelectedRouteId(routeOptionId)}
  includeFavorites={true}
  testID="route-option-1"
/>
```

---

## ACCESSIBILITY

**Accessibility Label:**
- Route name: `"${routeOption.label}"`
- Selection state: `"Selected"` or `"Not selected"`

**Accessibility Hints:**
- "Double tap to select this route"

**Accessibility Role:**
- `.accessibilityAddTraits(.isSelected)` when selected

**Favorite Badge:**
- `"Route includes ${favoriteCount} favorite${favoriteCount === 1 ? '' : 's'}"`

---

## ESCALATE

None. All required tokens and platform equivalents are available.

**Note:** Dependent molecules (`RainBadge`, `TemperatureBadge`, `WindBadge`) must be implemented before this molecule. Reference their respective matrices for implementation details.
