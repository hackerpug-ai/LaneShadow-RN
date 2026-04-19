# MapControls Component Matrix

**Component Path:** `react-native/components/map/map-controls.tsx`
**Atomic Level:** Molecule
**Domain:** Map
**Last Updated:** 2025-01-18

---

## COMPOSITION

**React Native Source:**
```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Icon } from 'react-native-paper'
```

**Child Dependencies:**
- `Pressable` (React Native core) - touch handling
- `Icon` (react-native-paper) - icon glyphs
- `View` (React Native core) - layout containers

**Layout Structure:**
```
MapControls (vertical cluster)
├── Zoom Cluster (grouped container)
│   ├── Zoom In Button
│   ├── Divider
│   └── Zoom Out Button
├── Recenter Button (conditional)
├── Layers/Clear Button (conditional)
├── Save Route Button (conditional)
└── Toggle View Button (always bottom)
```

---

## TRANSLATION SOURCES

### Kotlin/Compose

**Dependencies:**
- `androidx.compose.foundation.layout.Column`
- `androidx.compose.foundation.layout.Row`
- `androidx.compose.material.icons.Icons`
- `androidx.compose.material3.IconButton`
- `androidx.compose.material3.Surface` (for elevated clusters)

**Platform Equivalents:**
- `Pressable` → `IconButton` or `Surface` + `clickable`
- `Icon` (react-native-paper) → `Icon` from `material-icons-extended`
- `StyleSheet` → `Modifier` chain

### Swift/SwiftUI

**Dependencies:**
- `SwiftUI.VStack`
- `SwiftUI.HStack`
- `SwiftUI.Image` (SF Symbols)
- `SwiftUI.Button`

**Platform Equivalents:**
- `Pressable` → `Button` with role-based styling
- `Icon` (react-native-paper) → `Image(systemName:)`
- `StyleSheet` → View modifier chain

---

## STYLE PROPERTIES MATRIX

| Element | Property | Token Path (Light) | Token Path (Dark) | Platform Mapping |
|---------|----------|-------------------|------------------|------------------|
| **Cluster Background** | Color | `semantic.color.surfaceVariant.default` | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` |
| **Cluster Border** | Color | `semantic.color.border.default` | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` |
| **Cluster Border** | Width | `1.5` (1.5pt) | `1.5` (1.5pt) | `1.5.dp` / `strokeWidth: 1.5` |
| **Cluster Radius** | Corner radius | `semantic.radius['2xl']` (32pt) | `semantic.radius['2xl']` (32pt) | `32.dp` / `cornerRadius: 32` |
| **Cluster Elevation** | Shadow | `semantic.elevation[3]` | `semantic.elevation.dark[3]` | `shadowElevation = 3.dp` / `.shadow(radius: 8)` |
| **Button Background** | Default state | `semantic.color.surfaceVariant.default` | `semantic.color.surfaceVariant.default` | `Surface(color = surfaceVariant)` |
| **Button Background** | Pressed state | `semantic.color.surfaceVariant.pressed` | `semantic.color.surfaceVariant.pressed` | `MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.8)` |
| **Button Background** | Accent state | `semantic.color.primary.default` | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` |
| **Button Background** | Accent pressed | `semantic.color.primary.pressed` | `semantic.color.primary.pressed` | `MaterialTheme.colorScheme.primary.copy(alpha = 0.8)` |
| **Button Border** | Default | `semantic.color.border.default` | `semantic.color.border.default` | `BorderStroke(1.5.dp, outline)` |
| **Button Border** | Accent | `semantic.color.primary.default` | `semantic.color.primary.default` | `BorderStroke(1.5.dp, primary)` |
| **Icon Color** | Default | `semantic.color.onSurface.default` | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` |
| **Icon Color** | Accent | `semantic.color.onPrimary.default` | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onPrimary` |
| **Icon Size** | Dimension | `20` (20pt) | `20` (20pt) | `20.dp` / ` CGSize(width: 20, height: 20)` |
| **Button Size** | Dimension | `semantic.space['3xl']` (48pt) | `semantic.space['3xl']` (48pt) | `48.dp` / `frame(width: 48, height: 48)` |
| **Button Spacing** | Gap | `semantic.space.xs` (4pt) | `semantic.space.xs` (4pt) | `4.dp` / `spacing: 4` |
| **Label Font** | Typography | `semantic.type.body.sm` (400 weight, 14pt) | `semantic.type.body.sm` (400 weight, 14pt) | `Typography.bodySmall` / `Font.body` |
| **Label Color** | Default | `semantic.color.onSurface.default` | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` |
| **Label Color** | Accent | `semantic.color.onPrimary.default` | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onPrimary` |
| **Horizontal Padding** | With label | `semantic.space.sm` (8pt) | `semantic.space.sm` (8pt) | `8.dp` / `padding(.horizontal, 8)` |
| **Vertical Padding** | Button | `semantic.space.xs` (4pt) | `semantic.space.xs` (4pt) | `4.dp` / `padding(.vertical, 4)` |
| **Divider Color** | Background | `semantic.color.border.default` | `semantic.color.border.default` | `MaterialTheme.colorScheme.outlineVariant` |
| **Hit Slop** | Touch target | `semantic.space.xs` (4pt) | `semantic.space.xs` (4pt) | `4.dp` / `hitSlop: 4` |
| **Top Offset** | Positioning | `insets.top + semantic.space['2xl']` | `insets.top + semantic.space['2xl']` | `WindowInsets.statusBars + 32.dp` |
| **Right Offset** | Positioning | `semantic.space.lg` (16pt) | `semantic.space.lg` (16pt) | `16.dp` / `padding(.trailing, 16)` |

---

## IMPLEMENTATION NOTES

### Mode Switching

**Map Mode (`mode = 'map'`):**
- Shows: zoom cluster, recenter, clear/layers, save route (conditional)
- Toggle button: "message" icon → opens chat

**Chat Mode (`mode = 'chat'`):**
- Shows: only toggle button
- Toggle button: "map" icon → returns to map

The toggle button ALWAYS appears at the bottom of the control cluster in both modes for consistent muscle memory.

### Zoom Cluster Pattern

The zoom in/out buttons are grouped in a rounded container with:
- Shared background and border
- Horizontal divider between buttons
- Pressed state affects individual buttons, not the cluster

### Accent Button Pattern

The save route button uses accent styling when:
- `hasRouteToSave = true` (button is visible)
- `isSavedRoute = true` (active route is already saved)

Accent state:
- Background: `semantic.color.primary.default` (copper)
- Border: same copper color
- Icon color: `semantic.color.onPrimary.default` (dark)
- Bookmark icon gets copper glow

### Label Support

When `showLabels = true`, buttons expand horizontally to show text labels next to icons:
- Width: `auto` (instead of fixed 48pt)
- Minimum width: 48pt (touch target compliance)
- Layout: horizontal row with icon-text gap
- Text: `numberOfLines = 1` (truncate if needed)

### Hit Slop

All buttons have 4pt hit slop in all directions for a minimum 44pt touch target (48pt button + 8pt slop = 56pt effective).

### Positioning

**Default positioning:**
- Top: `insets.top + 32pt` (clears status bar + margin)
- Right: `16pt` (standard edge margin)
- Bottom: `undefined` (bottom-positioned controls use absolute positioning)

**Custom positioning:**
Override via `position` prop:
```tsx
<MapControls position={{ top: 100, right: 20 }} />
```

### Empty Handlers

Buttons with `undefined` handlers default to `() => {}` (no-op) to prevent errors. Parent components should provide handlers or omit the corresponding props.

---

## PLATFORM-SPECIFIC CONSIDERATIONS

### Android (Kotlin/Compose)

**IconButton vs Surface:**
- Use `IconButton` for standalone buttons (no border)
- Use `Surface` + `clickable` for bordered buttons (zoom cluster)

**Elevation:**
- Use `shadowElevation = 3.dp` on the zoom cluster Surface
- Individual buttons should NOT have elevation (visual clutter)

**Icon Set:**
- Use `MaterialIcons` from `androidx.compose.material.icons`
- Map icon names:
  - `plus` → `Icons.Default.Add`
  - `minus` → `Icons.Default.Remove`
  - `crosshairs-gps` → `Icons.Default.MyLocation`
  - `layers` → `Icons.Default.Layers`
  - `bookmark` → `Icons.Default.Bookmark`
  - `message-text-outline` → `Icons.Default.ChatBubbleOutline`
  - `map-outline` → `Icons.Default.MapOutlined`

**Ripple Effect:**
- Use `indicationalRipple` for subtle feedback on glass-morphic buttons
- Avoid `boundedRipple` (too aggressive for map overlays)

### iOS (Swift/SwiftUI)

**SF Symbol Mapping:**
- `plus` → `plus.circle.fill`
- `minus` → `minus.circle.fill`
- `crosshairs-gps` → `location.fill`
- `layers` → `layer.fill`
- `bookmark` → `bookmark.fill`
- `message-text-outline` → `message.circle`
- `map-outline` → `map.circle`

**Button Styles:**
- Use `.buttonStyle(.plain)` for icon-only buttons
- Use `.buttonStyle(.bordered)` for bordered buttons
- Custom accent: `.tint(.primary)` with `.background(.primary)`

**Elevation:**
- Use `.shadow(radius: 8)` on the zoom cluster
- Use `.shadow(color: .black.opacity(0.15), radius: 8, y: 2)` for RN parity

**Touch Feedback:**
- Use `.buttonRepeatBehavior(.enabled)` for rapid zoom in/out
- Add `.scaleEffect(pressed ? 0.95 : 1.0)` for press feedback

---

## ICON MAPPING TABLE

| RN Icon (react-native-paper) | Android (Material Icons) | iOS (SF Symbols) |
|------------------------------|--------------------------|------------------|
| `plus` | `Icons.Default.Add` | `plus.circle.fill` |
| `minus` | `Icons.Default.Remove` | `minus.circle.fill` |
| `crosshairs-gps` | `Icons.Default.MyLocation` | `location.fill` |
| `layers` | `Icons.Default.Layers` | `layer.fill` |
| `bookmark` | `Icons.Default.Bookmark` | `bookmark.fill` |
| `message-text-outline` | `Icons.Default.ChatBubbleOutline` | `message.circle` |
| `map-outline` | `Icons.Default.MapOutlined` | `map.circle` |

---

## ESCALATE

None. All required tokens and platform equivalents are available.

**Note:** React Native Paper icon names map 1:1 to Material Icons and SF Symbols equivalents.
