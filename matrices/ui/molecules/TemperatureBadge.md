# TemperatureBadge - STYLE PROPERTIES MATRIX

**Component:** TemperatureBadge
**RN Source:** `react-native/components/ui/temperature-badge.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/temperature-badge.tsx` | Public API, temperature levels, variant mapping |
| Badge | `react-native/components/ui/badge.tsx` | Badge atom (see `matrices/ui/atoms/Badge.md`) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Temperature icons (see `matrices/ui/atoms/IconSymbol.md`) |

---

## COMPOSITION

**Child atoms:**
- `Badge` - Badge atom with variant/opacity props (see `matrices/ui/atoms/Badge.md`)
- `IconSymbol` - Temperature level icons (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Container View wrapping Badge component. TemperatureBadge maps temperature levels to Badge variants and provides appropriate icons. Badge handles all styling.

**Layout:** Self-sizing container (flex-start), Badge uses internal layout.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.wrapContentWidth()` | n/a | n/a |

### Visual — Badge Variant Mapping (by temperature level)

| Temperature | Badge Variant | Source | Android | iOS | Token |
|---|---|---|---|---|---|
| cold | `'info'` | RN-wrapper mapping | `BadgeVariant.Info` | `.info` | `color.info.default` |
| mild | `'success'` | RN-wrapper mapping | `BadgeVariant.Success` | `.success` | `color.success.default` |
| warm | `'warning'` | RN-wrapper mapping | `BadgeVariant.Warning` | `.warning` | `color.warning.default` |
| hot | `'destructive'` | RN-wrapper mapping | `BadgeVariant.Destructive` | `.destructive` | `color.danger.default` |
| unavailable | `'secondary'` | RN-wrapper mapping | `BadgeVariant.Secondary` | `.secondary` | `color.secondary.default` |

### Visual — Badge Opacity (by temperature level)

| Temperature | Opacity | Source | Android | iOS | Token |
|---|---|---|---|---|---|
| cold/mild/warm/hot | `0.15` | RN-wrapper mapping | `alpha = 0.15f` | `.opacity(0.15)` | ESCALATE — propose `opacity.badge = 0.15` |
| unavailable | `0.08` | RN-wrapper mapping | `alpha = 0.08f` | `.opacity(0.08)` | ESCALATE — propose `opacity.faint = 0.08` |

### Visual — Icons (by temperature level)

| Temperature | Icon Name | Source | Android | iOS |
|---|---|---|---|---|
| cold | `snowflake-thermometer` | RN-wrapper mapping | `Icons.Outlined.Snowflake` or `Icons.Outlined.AcUnit` | `SF Symbol: "thermometer.snowflake"` |
| mild | `thermometer` | RN-wrapper mapping | `Icons.Outlined.Thermometer` | `SF Symbol: "thermometer"` |
| warm | `thermometer-low` | RN-wrapper mapping | `Icons.Outlined.ThermometerLow` | `SF Symbol: "thermometer.low"` |
| hot | `thermometer-high` | RN-wrapper mapping | `Icons.Outlined.ThermometerHigh` | `SF Symbol: "thermometer.high"` |
| unavailable | `help-circle-outline` | RN-wrapper mapping | `Icons.Outlined.HelpCircleOutline` | `SF Symbol: "questionmark.circle"` |

### Visual — Icon Styling

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `14` | `Modifier.size(14.dp)` | `.frame(width: 14, height: 14)` | ESCALATE — `iconSize.xs = 14` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Typography — Display Labels

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| with temperatureValue | RN-wrapper | ``${temperatureValue}°`` | `"$temperatureValue°"` | `"\(temperatureValue)°"` | n/a |
| without temperatureValue | RN-wrapper | Label from LABELS map | `getLabel(temperatureSummary)` | `getLabel(temperatureSummary)` | n/a |

### Labels (by temperature level)

| Temperature | Label |
|---|---|
| cold | `'Cold'` |
| mild | `'Mild'` |
| warm | `'Warm'` |
| hot | `'Hot'` |
| unavailable | `'Unknown'` |

---

## NOTES

- **Extensible pattern:** Uses Partial<Record> maps for forward compatibility with new temperature types
- **Badge atom:** All visual styling delegated to Badge atom component
- **Five levels:** Cold (blue/info), mild (green/success), warm (orange/warning), hot (red/destructive), unavailable (gray/secondary)
- **Icon colors:** All icons use onSurface.subtle color regardless of temperature level
- **Temperature value:** When provided, displays numeric value with ° symbol; otherwise displays text label
- **Badge opacity:** 15% for known levels, 8% for unavailable
- **Platform icons:** Map MaterialCommunityIcons to Material Icons (Android) and SF Symbols (iOS)
