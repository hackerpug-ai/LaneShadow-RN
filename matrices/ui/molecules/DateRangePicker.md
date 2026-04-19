# DateRangePicker - STYLE PROPERTIES MATRIX

**Component:** DateRangePicker
**RN Source:** `react-native/components/ui/date-range-picker.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/date-range-picker.tsx` | Public API, horizontal chip layout, date range calculation |
| ScrollView | `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` | Horizontal scrolling for chip overflow |
| Pressable | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Chip press feedback |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Chip label typography |

---

## COMPOSITION

**Child atoms:**
- None (uses Text directly)

**Composition pattern:** Horizontal scrolling row of chip-style Pressable buttons. Each chip contains a Text label. Chips have pill shape (full borderRadius). Selected chip uses primary color background with onPrimary text. Unselected chips use surfaceVariant background with onSurface text.

**Layout:** Horizontal ScrollView with no scrollbar. Content container uses gap spacing. Chips are self-sizing (flex-start) with padding.

---

## STYLE PROPERTIES MATRIX

### Layout — ScrollView

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| horizontal | RN-wrapper | `true` | `Modifier.horizontalScroll(rememberScrollState())` | `.horizontal(.scrollable())` or `ScrollView(.horizontal)` | n/a |
| showsHorizontalScrollIndicator | RN-wrapper | `false` | `Modifier.scrollbars(false)` or `overflow = Overflow.Hidden` | `.scrollIndicators(.hidden)` | n/a |
| contentContainerStyle gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` inside Row | `.spacing(8)` | `space.sm` |
| contentContainerStyle paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |

### Layout — Chip

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.wrapContentWidth()` (default) | default | n/a |
| paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| paddingVertical | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `Modifier.clip(CircleShape)` or `Modifier.clip(RoundedCornerShape(50.percent))` | `.clipShape(Capsule())` | `radius.full` |

### Visual — Chip Background

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| selected | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |
| normal | RN-wrapper | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `Color(.systemGray6)` | `color.surfaceVariant.default` |

### Visual — Text Color

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| selected | RN-wrapper | `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onPrimary` | `Color(.white)` (or appropriate contrast) | `color.onPrimary.default` |
| normal | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |

### Typography — Chip Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `.font(.system(size: 11, weight: .medium))` | `type.label.sm` |

### Interaction

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| onPress | RN-wrapper | callback prop | `Modifier.clickable { onPress() }` | `.onTapGesture { onPress() }` | n/a |
| toggle behavior | RN-wrapper | Clicking selected deselects to 'all' | State management in Compose | `@State var selected` with toggle logic | n/a |

---

## NOTES

- **Horizontal scrolling:** ScrollView with horizontal enabled, no scrollbar
- **Pill shape:** Chips use full borderRadius (9999) for capsule/pill shape
- **Toggle behavior:** Clicking same preset twice deselects back to 'all'
- **Presets:** 'All time', 'Last week' (7 days), 'Last month' (30 days), 'Last 3 months' (90 days)
- **Date calculation:** Uses `Date.now() - daysBack * 24 * 60 * 60 * 1000` to calculate afterDate timestamp
- **Gap spacing:** 8px gap between chips using ScrollView contentContainerStyle
- **Padding:** 12px horizontal padding on content container for screen edge margins
- **Selected state:** Primary background with onPrimary text
- **Unselected state:** surfaceVariant background with onSurface text
- **Typography:** label scale, small size
