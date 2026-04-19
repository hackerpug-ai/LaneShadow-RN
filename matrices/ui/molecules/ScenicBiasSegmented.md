# ScenicBiasSegmented - STYLE PROPERTIES MATRIX

**Component:** ScenicBiasSegmented
**RN Source:** `react-native/components/ui/scenic-bias-segmented.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/components/SegmentedButtons/SegmentedButtons.tsx`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/scenic-bias-segmented.tsx` | Public API, segmented control layout, Paper theming |
| SegmentedButtons (Paper) | `node_modules/react-native-paper/src/components/SegmentedButtons/SegmentedButtons.tsx` | Material Design segmented control |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Label typography |

---

## COMPOSITION

**Child atoms:**
- None (uses Paper SegmentedButtons directly)

**Composition pattern:** Vertical column with label ("Scenic Bias") above SegmentedButtons. Two buttons: "Default" (arrow-right icon) and "High Scenic" (image icon). Selected button has primary background (copper) with onPrimary text. Unselected has transparent background with onSurfaceVariant text. Container has input color background.

**Layout:** Vertical flex column. SegmentedButtons container uses full width with padding. Buttons have equal flex (1) for 50/50 split.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'column'` | `Column(...)` | `VStack` | n/a |
| gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `.spacing(8)` | `space.sm` |

### Layout — Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'labelSmall'` | `MaterialTheme.typography.labelSmall` | `.font(.system(size: 11, weight: .medium))` | `type.label.sm` |
| color | RN-wrapper | `withAlpha(semantic.color.onSurface.muted, 0.8)` | `MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)` | `Color(.secondaryLabel).opacity(0.8)` | `color.onSurface.muted` + `opacity.subtle` |
| marginLeft | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` |
| text | RN-wrapper | `'Scenic Bias'` | `Text("Scenic Bias")` | `Text("Scenic Bias")` | n/a |

### Layout — Segmented Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| backgroundColor | RN-wrapper | `semantic.color.input.default` | `MaterialTheme.colorScheme.surfaceVariant` | `Color(.systemGray6)` | `color.input.default` |
| borderRadius | RN-wrapper | `semantic.radius.xl` = 16 | `Modifier.clip(RoundedCornerShape(16.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 16))` | `radius.xl` |
| padding | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(4.dp)` | `.padding(4)` | `space.xs` |

### Layout — Segmented Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| paddingVertical | RN-wrapper | `semantic.space.sm + semantic.space.xs` = 8 + 4 = 12 | `Modifier.padding(vertical = 12.dp)` | `.padding(.vertical, 12)` | `space.md` (calculated) |
| paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| borderRadius | RN-wrapper | `semantic.radius.lg` = 12 | `Modifier.clip(RoundedCornerShape(12.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 12))` | `radius.lg` |

### Visual — Button Background

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| selected (default) | RN-wrapper | `semantic.color.background.default` | `MaterialTheme.colorScheme.background` | `Color(.systemBackground)` | `color.background.default` |
| selected (high scenic) | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |
| unselected | RN-wrapper | `'transparent'` | `Color.Transparent` | `Color.clear` | n/a |

### Visual — Label Color

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| selected (default) | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| selected (high scenic) | RN-wrapper | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onPrimary` | `Color(.white)` (or contrast) | `color.onPrimary.default` |
| unselected | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.secondaryLabel)` | `color.onSurface.muted` |

### Typography — Button Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `semantic.type.label.md` | `MaterialTheme.typography.labelMedium` | `.font(.system(size: 13, weight: .medium))` | `type.label.md` |

### Theme — SegmentedButtons Colors

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| secondaryContainer | RN-wrapper | `'transparent'` | `Color.Transparent` | `Color.clear` | n/a |
| onSecondaryContainer | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| primary | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |
| outline | RN-wrapper | `'transparent'` | `Color.Transparent` | `Color.clear` | n/a |
| onSurface | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.secondaryLabel)` | `color.onSurface.muted` |

### Icon — Configuration

| Button | Source | Icon name | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| default | RN-wrapper | `'arrow-right'` | `Icons.Default.ArrowForward` | SF Symbol: `arrow.right` | n/a |
| high scenic | RN-wrapper | `'image'` | `Icons.Default.Image` | SF Symbol: `photo` | n/a |

### Interaction

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| onValueChange | RN-wrapper | callback prop (via Paper) | `SegmentedButtons(..., onValueChange = { ... })` | `Picker(..., selection: $value)` | n/a |

---

## NOTES

- **Paper SegmentedButtons:** Uses react-native-paper Material Design component
- **Two options:** "Default" (arrow-right icon) and "High Scenic" (image icon)
- **Selected state:** "High Scenic" gets primary (copper) background, "Default" gets background color
- **Label:** "Scenic Bias" label above with 80% opacity muted color
- **Container background:** Uses input color for container background
- **Equal width:** Buttons use flex: 1 for 50/50 split
- **Padding calculation:** buttonPaddingY = semantic.space.sm + semantic.space.xs (8 + 4 = 12)
- **Icon visibility:** Icons shown in both selected and unselected states
- **Typography:** label scale, medium size
