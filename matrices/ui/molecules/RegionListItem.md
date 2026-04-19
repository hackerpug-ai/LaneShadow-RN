# RegionListItem - STYLE PROPERTIES MATRIX

**Component:** RegionListItem
**RN Source:** `react-native/components/offline/region-list-item.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/offline/region-list-item.tsx` | Public API, region card layout, action buttons |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Action icons (map, pencil, trash) (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Region name, size, date, bounds, button labels |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Action button icons (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Card with region info section (name + size on top row, date + bounds below) and action row with 3 evenly spaced buttons (View, Rename, Delete). Card has border, rounded corners, padding. Action row has divider on top. Delete button uses danger color.

**Layout:** Vertical column. Info section has row layout (space-between) for title/size. Action row is horizontal with space-around distribution.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.card.default` | `MaterialTheme.colorScheme.surface` | `Color(.secondarySystemGroupedBackground)` | `color.card.default` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `Color(.separator)` | `color.border.default` |
| borderRadius | RN-wrapper | `semantic.radius.lg` = 12 | `Modifier.clip(RoundedCornerShape(12.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 12))` | `radius.lg` |
| padding | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(..., lineWidth: 1))` | `borderWidth.thin` |

### Layout — Info Area

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| No special layout | RN-wrapper | Default | default | default | n/a |

### Layout — Title/Size Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| marginBottom | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(bottom = 4.dp)` | `.padding(.bottom, 4)` | `space.xs` |

### Layout — Action Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-around'` | `horizontalArrangement = Arrangement.SpaceAround` | n/a | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| marginTop | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |
| paddingTop | RN-wrapper | `semantic.space.md` = 12 | n/a | n/a | n/a |
| borderTopWidth | RN-wrapper | `1` | `Divider(modifier = Modifier.height(1.dp))` | `.overlay(Rectangle().fill(.separator).frame(height: 1), alignment: .top)` | `borderWidth.thin` |
| borderTopColor | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outlineVariant` | `Color(.separator)` | `color.border.default` |

### Layout — Action Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `horizontalArrangement = Arrangement.Center` | n/a | n/a |
| gap | RN-wrapper | `4` | `Arrangement.spacedBy(4.dp)` | `.spacing(4)` | `space.xs` |
| paddingHorizontal | RN-wrapper | `12` | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| paddingVertical | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `Modifier.clip(RoundedCornerShape(8.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 8))` | `radius.md` |

### Typography — Region Name

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'titleMedium'` | `MaterialTheme.typography.titleMedium` | `.font(.system(size: 16, weight: .semibold))` | ESCALATE — map to `type.heading.sm` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| numberOfLines | RN-wrapper | `1` | `maxLines = 1` | `.lineLimit(1)` | n/a |

### Typography — Region Size

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'labelMedium'` | `MaterialTheme.typography.labelMedium` | `.font(.system(size: 11, weight: .medium))` | ESCALATE — map to `type.label.md` |
| color | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |

### Typography — Date/Bounds

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'bodySmall'` | `MaterialTheme.typography.bodySmall` | `.font(.system(size: 12))` | `type.body.sm` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.secondaryLabel)` | `color.onSurface.muted` |

### Typography — Action Button Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'labelSmall'` | `MaterialTheme.typography.labelSmall` | `.font(.system(size: 11))` | ESCALATE — map to `type.label.sm` |
| color (View/Rename) | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| color (Delete) | RN-wrapper | `semantic.color.danger.default` | `MaterialTheme.colorScheme.error` | `Color(.red)` | `color.danger.default` |

### Visual — Action Button Background

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| pressed (View/Rename) | RN-wrapper | `semantic.color.surfaceVariant.pressed` | `MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.8f)` | `Color(.systemGray6).opacity(0.8)` | `color.surfaceVariant.pressed` |
| pressed (Delete) | RN-wrapper | `${semantic.color.danger.default}1A` (10% opacity) | `MaterialTheme.colorScheme.error.copy(alpha = 0.1f)` | `Color(.red).opacity(0.1)` | `color.danger.default` + `opacity.faint` |
| normal | RN-wrapper | `'transparent'` | `Color.Transparent` | `Color.clear` | n/a |

### Icon — Action Icons

| Button | Source | Icon name | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| View | RN-wrapper | `'map-outline'` | `Icons.Outlined.Map` | SF Symbol: `map` | n/a |
| Rename | RN-wrapper | `'pencil-outline'` | `Icons.Outlined.Edit` | SF Symbol: `pencil` | n/a |
| Delete | RN-wrapper | `'trash-can-outline'` | `Icons.Outlined.Delete` | SF Symbol: `trash` | n/a |

### Icon — Colors

| Button | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| View | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| Rename | RN-wrapper | `semantic.color.onSurface.default` | Same as above | Same as above | `color.onSurface.default` |
| Delete | RN-wrapper | `semantic.color.danger.default` | `MaterialTheme.colorScheme.error` | `Color(.red)` | `color.danger.default` |

### Icon — Size

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | `iconSize.sm` |

### Format — Size

| Range | Source | Format example | Token mapping |
|---|---|---|---|---|
| < 1 KB | RN-wrapper | `{bytes} B` | `123 B` | n/a |
| < 1 MB | RN-wrapper | `{(bytes / 1024).toFixed(1)} KB` | `12.3 KB` | n/a |
| < 1 GB | RN-wrapper | `{(bytes / (1024*1024)).toFixed(0)} MB` | `123 MB` | n/a |
| ≥ 1 GB | RN-wrapper | `{(bytes / (1024*1024*1024)).toFixed(1)} GB` | `1.2 GB` | n/a |

### Format — Date

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| format | RN-wrapper | `toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })` | `DateTimeFormatter.ofPattern("MMM d, yyyy")` | `DateFormatter.dateFormat = "MMM d, yyyy"` | n/a |
| example | RN-wrapper | `'Jan 15, 2026'` | `Jan 15, 2026` | `Jan 15, 2026` | n/a |

### Format — Bounds

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| format | RN-wrapper | Center lat/lng to 2 decimal places + " area" | `"{lat.toFixed(2)}, {lng.toFixed(2)} area"` | Same format | n/a |
| example | RN-wrapper | `'37.77, -122.42 area'` | `37.77, -122.42 area` | Same | n/a |

### Accessibility

| Button | Source | accessibilityLabel | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| View | RN-wrapper | `'View {region.name} on map'` | `contentDescription = "View $regionName on map"` | `.accessibilityLabel("View \(regionName) on map")` | n/a |
| Rename | RN-wrapper | `'Rename {region.name}'` | `contentDescription = "Rename $regionName"` | `.accessibilityLabel("Rename \(regionName)")` | n/a |
| Delete | RN-wrapper | `'Delete {region.name}'` | `contentDescription = "Delete $regionName"` | `.accessibilityLabel("Delete \(regionName)")` | n/a |
| Container | RN-wrapper | `'{region.name}, {size}, Downloaded {date}'` | Full info | Full info | n/a |
| accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |

---

## NOTES

- **Card layout:** Info section (top), divider, action row (bottom)
- **Info section:** Region name (left, titleMedium, flex: 1) + size (right, labelMedium, primary color)
- **Subtitle:** Downloaded date + bounds center (bodySmall, muted color)
- **Action row:** 3 buttons evenly distributed (space-around)
- **Buttons:** Icon + text (labelSmall), 4px gap, 12px horizontal padding, 8px vertical padding
- **View/Rename buttons:** onSurface color, pressed state uses surfaceVariant.pressed
- **Delete button:** danger color for icon + text, pressed state uses 10% opacity danger background
- **Icons:** 16px, map-outline (View), pencil-outline (Rename), trash-can-outline (Delete)
- **Spacing:** 4px margin bottom between title/size row and subtitle, 12px margin top for action row
- **Divider:** 1px border color on top of action row
- **Border radius:** 8px for action buttons, 12px for card
- **Size formatting:** Human-readable units (B, KB, MB, GB) with appropriate decimals
- **Date formatting:** "MMM d, yyyy" format (e.g., "Jan 15, 2026")
- **Bounds formatting:** Center lat/lng to 2 decimals + " area"
- **Accessibility:** Comprehensive labels for all buttons, container exposes full region info
