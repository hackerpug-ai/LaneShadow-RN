# WeatherPill - STYLE PROPERTIES MATRIX

**Component:** WeatherPill
**RN Source:** `react-native/components/ui/weather-pill.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/weather-pill.tsx` | Public API, layout, pill styling |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Weather icon (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Description text |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Weather condition icon (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Row container with icon and text. Pill-shaped (fully rounded). Default warning color scheme, overrideable via props.

**Layout:** Horizontal row (`flexDirection: 'row'`), center alignment, fixed icon-to-text gap.

---

## STYLE PROPERTIES MATRIX

### Layout — Pill

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `Alignment.CenterVertically` | `.center` | n/a |
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.wrapContentWidth()` | n/a | n/a |
| gap | RN-wrapper | `6` | `Arrangement.spacedBy(6.dp)` | `Spacer(6)` | ESCALATE — between `space.xs` (4) and `space.sm` (8); use `6.dp` literal |
| paddingVertical | RN-wrapper | `6` | `Modifier.padding(vertical = 6.dp)` | `.padding(.vertical, 6)` | ESCALATE — between `space.xs` (4) and `space.sm` (8); use `6.dp` literal |
| paddingHorizontal | RN-wrapper | `12` | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| borderRadius | RN-wrapper | `20` | `RoundedCornerShape(20.dp)` or `CircleShape` if height matches | `Capsule()` | ESCALATE — propose `radius.pill = 20` |

### Visual — Background

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `${semantic.color.warning.default}26` (15% opacity) | `LaneShadowTheme.colors.warning.copy(alpha = 0.15f)` | `theme.colors.warning.opacity(0.15)` | `color.warning.default` + `opacity.badge = 0.15` |
| override | RN-wrapper | `backgroundColor` prop | `backgroundColor = backgroundColor` | `.background(backgroundColor ?? default)` | n/a (prop override) |

### Visual — Text/Icon Color

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| override | RN-wrapper | `textColor` prop | `color = textColor` | `.foregroundColor(textColor ?? default)` | n/a (prop override) |

### Visual — Icon

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| name | RN-wrapper | `icon` prop | map to Material Icons | map to SF Symbol | n/a |
| size | RN-wrapper | `iconSize` prop (default 16) | `Modifier.size(iconSize.dp)` | `.frame(width: iconSize, height: iconSize)` | ESCALATE — between `iconSize.xs` (14) and `iconSize.sm` (16); use `16.dp` literal |
| color | RN-wrapper | `textColor` prop or `semantic.color.warning.default` | same as text | same as text | matches text color |

### Typography — Description

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `13` | `13.sp` | `13` | ESCALATE — between `type.label.sm` (12) and `type.body.sm` (14); use `13.sp` literal |
| color | RN-wrapper | `textColor` prop or `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |

---

## NOTES

- **Pill shape:** Fully rounded (20px radius) for pill appearance
- **Default warning:** Uses warning color scheme (orange) for weather alerts
- **Override props:** `backgroundColor` and `textColor` props allow custom color schemes
- **Flexible icon:** Icon name passed as prop for different weather conditions
- **Compact size:** 13px font, 6px padding for compact pill
- **Gap spacing:** 6px gap between icon and text
- **Self-sizing:** Uses alignSelf: flex-start to size to content
- **Use cases:** Weather condition indicators in route cards, map overlays, forecasts
