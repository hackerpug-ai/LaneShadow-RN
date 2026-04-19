# LocationInput

## Component Classification
**Type:** Molecule
**Domain:** Locations
**Source:** `components/location-input.tsx`

## Purpose
Input field for location search with autocomplete. Handles address/POI entry and selection.

## COMPOSITION

### Child Components
- `Input` (atom) - Text input field
- `IconSymbol` (atom) - Location icon

### Layout Structure
```
┌─────────────────────────────────┐
│  [📍] Enter destination         │
│       ─────────────────────      │
│       San Francisco, CA         │
│       📍 San Francisco, CA      │
│       123 Market St             │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/location-input.tsx`

**Key Implementation:**
- Input with location icon
- Autocomplete dropdown
- Debounced search
- Location type detection (address, POI)
- Current location option

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/LocationInput.kt`

**Implementation Notes:**
- Use `TextField` with `leadingIcon`
- `DropdownMenu` or `LazyColumn` for autocomplete
- `LaunchedEffect` with delay for debounce
- `PlaceAutocomplete` integration
- Keyboard type for addresses

**Expected API:**
```kotlin
@Composable
fun LocationInput(
  value: String,
  onChangeText: (String) -> Unit,
  onSelect: (Location) -> Unit,
  placeholder: String = "Enter destination",
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/LocationInput.swift`

**Implementation Notes:**
- Use `TextField` with `HStack` for icon
- Autocomplete with `.popover()` or overlay
- `debounce` operator for search delay
- `MKLocalSearch` for autocomplete
- `.keyboardType(.default)` or `.URL`

**Expected API:**
```swift
struct LocationInput: View {
  var value: String
  var onChangeText: (String) -> Void
  var onSelect: (Location) -> Void
  var placeholder: String = "Enter destination"

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Input Height | 48dp | 48.dp | 48 | `size.input.default` |
| Corner Radius | 8dp | 8.dp | 8 | `borderRadius.md` |
| Border Color | Outline | outline | Color.gray.opacity(0.3) | `color.outline` |
| Border Width | 1dp | 1.dp | 1 | `borderWidth.thin` |
| Focus Border Color | Primary copper | colorPrimary | Color.primary | `color.primary` |
| Focus Border Width | 2dp | 2.dp | 2 | `borderWidth.focus` |
| Background Color | Surface | surface | Color(.systemBackground) | `color.surface` |
| Text Color | On surface | onSurface | Color.primary | `color.textPrimary` |
| Placeholder Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Location Icon | map-marker | map-marker | mappin.circle.fill | `icon.location` |
| Icon Color | Primary copper | colorPrimary | Color.primary | `color.primary` |
| Icon Size | 20dp | 20.dp | 20 | `iconSize.sm` |
| Padding Horizontal | 16dp | 16.dp | 16 | `spacing.lg` |
| Padding Vertical | 12dp | 12.dp | 12 | `spacing.md` |

## NOTES

### Autocomplete Behavior
- Debounce: 300ms after typing stops
- Min characters: 2 before search
- Max results: 5 suggestions
- Current location: Always first option

### Location Types
- Addresses: "123 Main St, City, ST"
- POIs: "Golden Gate Bridge"
- Cities: "San Francisco, CA"
- Coordinates: (fallback)

### Keyboard
- iOS: Default keyboard (no special type)
- Android: Text auto-cap sentences
- Return key: "Search" or "Done"

### Accessibility
- `accessibilityLabel`: "Destination"
- `accessibilityHint`: "Enter a location or place"
- Autocomplete items accessible
- Current location option: "Use current location"

### Platform Differences
- **Android:** `TextField` with `singleLine = true`
- **iOS:** `TextField` with `submitLabel(.search)`

### Dependencies
- `Input` atom
- `IconSymbol` atom
- Location autocomplete API
- Geocoding service
- Debounce utility
