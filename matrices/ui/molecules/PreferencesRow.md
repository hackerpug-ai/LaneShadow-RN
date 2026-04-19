# PreferencesRow - STYLE PROPERTIES MATRIX

**Component:** PreferencesRow
**RN Source:** `react-native/components/sheets/preferences-row.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`, `@react-native-community/datetimepicker/`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/preferences-row.tsx` | Public API, chip layout, preference state management |
| ScrollView | `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` | Horizontal scrolling for chip overflow |
| DateTimePicker | `@react-native-community/datetimepicker/` | Native date/time picker for departure time |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Chip icons (image, clock, highway, cash, heart) (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Chip label typography |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Chip icons (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Horizontal scrolling row of 5 preference chips (Scenic, Departure Time, No Highways, No Tolls, Favorites). Each chip is a Pressable with icon + text. Active chips use primary background with onPrimary colors. Inactive chips use surfaceVariant background with onSurfaceVariant colors.

**Layout:** Horizontal ScrollView with no scrollbar. Chips are 40px height with pill shape (20px borderRadius). 8px gap between chips.

---

## STYLE PROPERTIES MATRIX

### Layout — ScrollView

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| horizontal | RN-wrapper | `true` | `Modifier.horizontalScroll(rememberScrollState())` | `.horizontal(.scrollable)` or `ScrollView(.horizontal)` | n/a |
| showsHorizontalScrollIndicator | RN-wrapper | `false` | `Modifier.scrollbars(false)` or `overflow = Overflow.Hidden` | `.scrollIndicators(.hidden)` | n/a |

### Layout — Scroll Content

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `.spacing(8)` | `space.sm` |
| paddingVertical | RN-wrapper | `2` | `Modifier.padding(vertical = 2.dp)` | `.padding(.vertical, 2)` | ESCALATE — use `space.xs = 4` or keep magic number |

### Layout — Chip

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `6` | `Arrangement.spacedBy(6.dp)` | `.spacing(6)` | ESCALATE — propose `space.chipGap = 6` |
| height | RN-wrapper | `40` | `Modifier.height(40.dp)` | `.frame(height: 40)` | ESCALATE — propose `size.chipHeight = 40` |
| paddingHorizontal | RN-wrapper | `12` | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| borderRadius | RN-wrapper | `20` (50%) | `CircleShape` or `Modifier.clip(RoundedCornerShape(20.dp))` | `ClipShape(Capsule())` or `.clipShape(Capsule())` | `radius.full` |

### Visual — Chip Background

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| active | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |
| inactive | RN-wrapper | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `Color(.systemGray6)` | `color.surfaceVariant.default` |

### Visual — Chip Opacity

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| pressed | RN-wrapper | `0.8` | `Modifier.clickable(...).graphicsLayer { this.alpha = 0.8f }` or `indication` with alpha | `.opacity(0.8)` | ESCALATE — propose `opacity.pressed = 0.8` |
| disabled (no favorites) | RN-wrapper | `0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | ESCALATE — propose `opacity.disabled = 0.5` |
| normal | RN-wrapper | `1` | Default | Default | n/a |

### Visual — Icon Colors

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| active | RN-wrapper | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onPrimary` | `Color(.white)` (or contrast) | `color.onPrimary.default` |
| inactive | RN-wrapper | `semantic.color.onSurface.muted` (fallback to onSurface.default) | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.secondaryLabel)` | `color.onSurface.muted` |

### Visual — Text Colors

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| active | RN-wrapper | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onPrimary` | `Color(.white)` (or contrast) | `color.onPrimary.default` |
| inactive | RN-wrapper | `semantic.color.onSurface.muted` (fallback to onSurface.default) | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.secondaryLabel)` | `color.onSurface.muted` |

### Typography — Chip Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `13` | `fontSize = 13.sp` | `.font(.system(size: 13))` | ESCALATE — propose `type.label.chip.fontSize = 13` |
| fontWeight | RN-wrapper | `'500'` | `fontWeight = FontWeight.Medium` | `.fontWeight(.medium)` | ESCALATE — propose `type.label.chip.fontWeight = 500` |

### Icon — Names

| Chip | Source | Icon name | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| Scenic | RN-wrapper | `'image'` | `Icons.Outlined.Image` | SF Symbol: `photo` | n/a |
| Departure Time | RN-wrapper | `'clock-outline'` | `Icons.Outlined.Schedule` | SF Symbol: `clock` | n/a |
| No Highways | RN-wrapper | `'highway'` | `Icons.Outlined.Route` | SF Symbol: `road` | n/a |
| No Tolls | RN-wrapper | `'cash'` | `Icons.Outlined.AttachMoney` | SF Symbol: `dollarsign.circle` | n/a |
| Favorites | RN-wrapper | `'heart'` | `Icons.Outlined.FavoriteBorder` | SF Symbol: `heart` | n/a |

### Icon — Size

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | `iconSize.sm` |

### DateTimePicker — Configuration

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| mode | RN-wrapper | `'datetime'` | `mode = DatePickerMode.Date + time` | `.dateAndTime` | n/a |
| display | RN-wrapper | `'default'` | Platform default | Platform default | n/a |
| minimumDate | RN-wrapper | `new Date()` (now) | `min = LocalDate.now()` | `minimumDate: Date()` | n/a |
| minuteInterval | RN-wrapper | `15` | `minuteInterval = 15` | `minuteInterval: 15` | n/a |

### Interaction

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| onPress (chips) | RN-wrapper | callback prop per chip | `Modifier.clickable { onPress() }` | `.onTapGesture { onPress() }` | n/a |
| pressed opacity | RN-wrapper | `opacity: pressed ? 0.8 : 1` | `Modifier.graphicsLayer { alpha = if (pressed) 0.8f else 1f }` | `.opacity(pressed ? 0.8 : 1)` | `opacity.pressed` |

### Chip Labels

| Chip | Source | Label text | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| Scenic | RN-wrapper | `'Scenic'` | `Text("Scenic")` | `Text("Scenic")` | n/a |
| Departure Time | RN-wrapper | `formatDepartureTime(date)` | Dynamic format function | Dynamic format function | n/a |
| No Highways | RN-wrapper | `'No Highways'` | `Text("No Highways")` | `Text("No Highways")` | n/a |
| No Tolls | RN-wrapper | `'No Tolls'` | `Text("No Tolls")` | `Text("No Tolls")` | n/a |
| Favorites | RN-wrapper | `'Favorites'` | `Text("Favorites")` | `Text("Favorites")` | n/a |

---

## NOTES

- **5 chips:** Scenic (toggle), Departure Time (opens picker), No Highways (toggle), No Tolls (toggle), Favorites (toggle)
- **Toggle behavior:** Scenic, No Highways, No Tolls, Favorites toggle between active/inactive on press
- **Active state:** Primary background (copper), onPrimary icon/text
- **Inactive state:** surfaceVariant background, onSurfaceVariant icon/text
- **Disabled state:** Favorites chip at 50% opacity when hasFavorites is false
- **Departure time format:** "Today, 2:30 PM", "Tomorrow, 9:00 AM", or "Mar 15, 2:30 PM"
- **Date picker:** Native DateTimePicker, datetime mode, 15-minute intervals, minimum date is now
- **Chip height:** 40px fixed height for consistency
- **Chip gap:** 8px between chips
- **Icon size:** 16px
- **Internal gap:** 6px between icon and text
- **Horizontal padding:** 12px
- **Border radius:** 20px (50% for pill shape)
- **Pressed opacity:** 0.8
- **Typography:** 13px font size, 500 font weight
- **Scrolling:** Horizontal ScrollView, no scrollbar
- **Format function:** formatDepartureTime uses toLocaleTimeString and toLocaleDateString
