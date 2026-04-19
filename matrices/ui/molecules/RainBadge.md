# RainBadge - STYLE PROPERTIES MATRIX

**Component:** RainBadge
**RN Source:** `react-native/components/ui/rain-badge.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/rain-badge.tsx` | Public API, rain intensity levels, variant mapping |
| Badge | `react-native/components/ui/badge.tsx` | Badge atom (see `matrices/ui/atoms/Badge.md`) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Rain intensity icons (see `matrices/ui/atoms/IconSymbol.md`) |

---

## COMPOSITION

**Child atoms:**
- `Badge` - Badge atom with variant/opacity props (see `matrices/ui/atoms/Badge.md`)
- `IconSymbol` - Rain intensity icons (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Container View wrapping Badge component. RainBadge maps rain intensity levels to Badge variants and provides appropriate icons with dynamic colors. Badge handles all styling.

**Layout:** Self-sizing container (flex-start), Badge uses internal layout.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignSelf | RN-wrapper | `'flex-start'` | `Modifier.wrapContentWidth()` | n/a | n/a |

### Visual — Badge Variant Mapping (by rain level)

| Rain Level | Badge Variant | Source | Android | iOS | Token |
|---|---|---|---|---|---|
| none | `'success'` | RN-wrapper mapping | `BadgeVariant.Success` | `.success` | `color.success.default` |
| light | `'warning'` | RN-wrapper mapping | `BadgeVariant.Warning` | `.warning` | `color.warning.default` |
| moderate | `'warning'` | RN-wrapper mapping | `BadgeVariant.Warning` | `.warning` | `color.warning.default` |
| heavy | `'destructive'` | RN-wrapper mapping | `BadgeVariant.Destructive` | `.destructive` | `color.danger.default` |
| unavailable | `'secondary'` | RN-wrapper mapping | `BadgeVariant.Secondary` | `.secondary` | `color.secondary.default` |

### Visual — Badge Opacity (by rain level)

| Rain Level | Opacity | Source | Android | iOS | Token |
|---|---|---|---|---|---|
| none/light/heavy | `0.15` | RN-wrapper mapping | `alpha = 0.15f` | `.opacity(0.15)` | ESCALATE — `opacity.badge = 0.15` |
| moderate | `0.2` | RN-wrapper mapping | `alpha = 0.2f` | `.opacity(0.2)` | ESCALATE — propose `opacity.badgeHigh = 0.2` |
| unavailable | `0.08` | RN-wrapper mapping | `alpha = 0.08f` | `.opacity(0.08)` | ESCALATE — `opacity.faint = 0.08` |

### Visual — Icons (by rain level)

| Rain Level | Icon Name | Source | Android | iOS |
|---|---|---|---|---|
| none | `check-circle-outline` | RN-wrapper mapping | `Icons.Outlined.CheckCircle` | `SF Symbol: "checkmark.circle"` |
| light | `water-outline` | RN-wrapper mapping | `Icons.Outlined.WaterOutline` or `Icons.Outlined.WaterDrop` | `SF Symbol: "drop"` |
| moderate | `water` | RN-wrapper mapping | `Icons.Outlined.Water` or `Icons.Filled.WaterDrop` | `SF Symbol: "drop.fill"` |
| heavy | `weather-pouring` | RN-wrapper mapping | `Icons.Outlined.WeatherPouring` | `SF Symbol: "cloud.heavyrain.fill"` |
| unavailable | `help-circle-outline` | RN-wrapper mapping | `Icons.Outlined.HelpCircleOutline` | `SF Symbol: "questionmark.circle"` |

### Visual — Icon Color (by rain level)

| Rain Level | Icon Color | Source | Android | iOS | Token |
|---|---|---|---|---|---|
| none | `semantic.color.success.default` | RN-wrapper mapping | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| light/moderate | `semantic.color.warning.default` | RN-wrapper mapping | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| heavy | `semantic.color.danger.default` | RN-wrapper mapping | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| unavailable | `semantic.color.onSurface.subtle` | RN-wrapper mapping | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Visual — Icon Styling

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `14` | `Modifier.size(14.dp)` | `.frame(width: 14, height: 14)` | ESCALATE — `iconSize.xs = 14` |

### Labels (by rain level)

| Rain Level | Label |
|---|---|
| none | `'No rain'` |
| light | `'Light rain'` |
| moderate | `'Moderate rain'` |
| heavy | `'Heavy rain'` |
| unavailable | `'Unknown'` |

---

## NOTES

- **Extensible pattern:** Uses Partial<Record> maps for forward compatibility with new rain types
- **Badge atom:** All visual styling delegated to Badge atom component
- **Five levels:** None (green/success), light (orange/warning), moderate (orange/warning), heavy (red/destructive), unavailable (gray/secondary)
- **Dynamic icon colors:** Icon color matches badge variant color (not subtle like other badges)
- **Badge opacity:** 15% for most, 20% for moderate (heavier), 8% for unavailable
- **Platform icons:** Map MaterialCommunityIcons to Material Icons (Android) and SF Symbols (iOS)
