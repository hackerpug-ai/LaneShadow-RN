# DepartureTimeSelector - STYLE PROPERTIES MATRIX

**Component:** DepartureTimeSelector
**RN Source:** `react-native/components/ui/departure-time-selector.tsx`
**Framework Primitives:** `@react-native-community/datetimepicker`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/departure-time-selector.tsx` | Public API, date formatting, trigger button |
| DateTimePicker | `@react-native-community/datetimepicker` | Native date/time picker |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Clock and chevron icons (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Clock icon (left), chevron-down icon (right) (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Label above pressable button. Button contains left icon, text (flex: 1), right icon. DateTimePicker modal.

**Layout:** Vertical column (label, button). Button is row layout.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| gap | RN-wrapper | `8` | `Modifier.padding(bottom = 8.dp)` between label and button | `Spacer(minLength: 8)` | `space.sm` |

### Typography — Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `13` | `13.sp` | `13` | ESCALATE — propose `type.label.xs.fontSize = 13` |
| fontWeight | RN-wrapper | `'500'` (medium) | `FontWeight.Medium` | `.medium` | `type.label.xs.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| textTransform | RN-wrapper | `'uppercase'` | `textCompose = ...` | `.textCase(.uppercase)` | n/a |
| letterSpacing | RN-wrapper | `0.5` | `letterSpacing = 0.5.sp` | `.tracking(0.5)` | ESCALATE — propose `type.label.letterSpacing = 0.5` |

### Layout — Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| paddingVertical | RN-wrapper | `12` | `Modifier.padding(vertical = 12.dp)` | `.padding(.vertical, 12)` | `space.md` |
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| borderRadius | RN-wrapper | `8` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| gap | RN-wrapper | `8` | `Modifier.padding(end = 8.dp)` between items | `Spacer(minLength: 8)` | `space.sm` |

### Visual — Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `${semantic.color.primary.default}1F` (12% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.12f)` | `theme.colors.primary.opacity(0.12)` | `color.primary.default` + `opacity.overlaySurface = 0.12` |
| borderColor | RN-wrapper | `${semantic.color.primary.default}4D` (30% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.3f)` | `theme.colors.primary.opacity(0.3)` | `color.primary.default` + `opacity.border = 0.3` |
| opacity (pressed) | RN-wrapper | `0.8` | `Modifier.alpha(0.8f)` | `.opacity(0.8)` | `opacity.pressed = 0.8` |

### Visual — Clock Icon (Left)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `18` | `18.dp` | `18` | ESCALATE — propose `iconSize.md2 = 18` |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| name | RN-wrapper | `'clock-outline'` | `Icons.Outlined.Schedule` | SF Symbol: `clock` | n/a |
| marginRight | RN-wrapper | `-4` | `Modifier.padding(end = (-4).dp)` | `.padding(.trailing, -4)` | n/a |

### Typography — Button Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| fontSize | RN-wrapper | `15` | `15.sp` | `15` | ESCALATE — propose `type.body.md.fontSize = 15` |
| fontWeight | RN-wrapper | `'500'` (medium) | `FontWeight.Medium` | `.medium` | `type.body.md.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Visual — Chevron Icon (Right)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `18` | `18.dp` | `18` | `iconSize.md2` |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| name | RN-wrapper | `'chevron-down'` | `Icons.Outlined.KeyboardArrowDown` | SF Symbol: `chevron.down` | n/a |

### DateTimePicker Props

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| mode | RN-wrapper | `'datetime'` | `mode = DatePickerMode.Date` (custom) | `.datePickerStyle(.compact)` | n/a |
| display | RN-wrapper | `'default'` | platform default | platform default | n/a |
| minimumDate | RN-wrapper | prop or `new Date()` | `minDate` | `minimumDate` | n/a |
| minuteInterval | RN-wrapper | `15` | `minuteInterval = 15` | `.minuteInterval(15)` | n/a |

---

## NOTES

- **Date format:** "Today, 2:30 PM" or "Tomorrow, 9:00 AM" or "Mar 15, 2:30 PM"
- **Label:** Uppercase with 0.5 letter spacing, 13sp medium weight
- **Button:** Subtle primary background (12% opacity) with primary border (30% opacity)
- **Icon sizing:** 18px for both clock and chevron icons
- **Gap:** 8px between button elements, 8px between label and button
- **Border radius:** 8px for button
- **Press state:** 0.8 opacity when pressed
- **Text:** 15sp medium weight, fills available space (flex: 1)
- **Clock icon margin:** Negative right margin (-4px) for tighter spacing
- **Primary color:** Icons and border use primary copper color
- **DateTimePicker:** Native modal with 15-minute intervals
- **Minimum date:** Current date or prop-provided minimum
