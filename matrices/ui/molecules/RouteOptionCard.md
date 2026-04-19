# RouteOptionCard - STYLE PROPERTIES MATRIX

**Component:** RouteOptionCard
**RN Source:** `react-native/components/ui/route-option-card.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/route-option-card.tsx` | Public API, variants, layout |
| RouteBadge | `react-native/components/ui/route-badge.tsx` | Route badges (see `matrices/ui/molecules/RouteBadge.md`) |
| StatRow | `react-native/components/ui/stat-row.tsx` | Route stats (see `matrices/ui/molecules/StatRow.md`) |
| WeatherPill | `react-native/components/ui/weather-pill.tsx` | Weather summary (see `matrices/ui/molecules/WeatherPill.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography |

---

## COMPOSITION

**Child molecules:**
- `RouteBadge` - Route badges (curated, scenic, etc.) (see `matrices/ui/molecules/RouteBadge.md`)
- `StatRow` - Route stats (distance, duration, elevation) (see `matrices/ui/molecules/StatRow.md`)
- `WeatherPill` - Weather summary pill (see `matrices/ui/molecules/WeatherPill.md`)

**Composition pattern:** Vertical column with header (name + badges), stats row, and optional weather pill. Compact variant shows single row.

**Layout:** Column layout with gaps between sections, responsive to variant prop.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `16` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| marginBottom | RN-wrapper | `12` | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |
| padding (selected) | RN-wrapper | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| padding (compact) | RN-wrapper | `12` | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |

### Visual — Container (by variant)

| Variant | Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| selected | backgroundColor | RN-wrapper | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| selected | borderColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| selected | borderWidth | RN-wrapper | `2` | `Modifier.border(2.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 2))` | `borderWidth.thick` |
| selected | opacity | RN-wrapper | `1` | `Modifier.alpha(1f)` | `.opacity(1)` | n/a |
| compact | backgroundColor | RN-wrapper | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| compact | borderColor | RN-wrapper | `rgba(255, 255, 255, 0.05)` | `Color.White.copy(alpha = 0.05f)` | `Color.white.opacity(0.05)` | ESCALATE — propose `opacity.borderSubtle = 0.05` |
| compact | borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| compact | opacity | RN-wrapper | `0.8` | `Modifier.alpha(0.8f)` | `.opacity(0.8)` | `opacity.disabled = 0.8` |

### Layout — Header (selected variant)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| alignItems | RN-wrapper | `'flex-start'` | `verticalAlignment = Alignment.Top` | `.alignment(.top)` | n/a |
| marginBottom | RN-wrapper | `12` | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |

### Typography — Route Name (selected)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `18` | `18.sp` | `18` | ESCALATE — propose `type.title.lg.fontSize = 18` |
| fontWeight | RN-wrapper | `'600'` (semibold) | `FontWeight.SemiBold` | `.semibold` | `type.title.lg.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| marginBottom | RN-wrapper | `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |

### Layout — Badges Row (selected)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| gap | RN-wrapper | `8` | `Modifier.padding(end = 8.dp)` between items | `Spacer(minLength: 8)` | `space.sm` |
| flexWrap | RN-wrapper | `'wrap'` | `Modifier.wrapContentWidth(...)` | n/a | n/a |

### Layout — Stats Row (selected)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| gap | RN-wrapper | `16` | `Modifier.padding(end = 16.dp)` between items | `Spacer(minLength: 16)` | `space.lg` |
| marginBottom | RN-wrapper | `12` | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |

### Typography — Compact Variant

| Element | Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| name | fontSize | RN-wrapper | `16` | `16.sp` | `16` | `type.title.md.fontSize` |
| name | fontWeight | RN-wrapper | `'500'` (medium) | `FontWeight.Medium` | `.medium` | `type.title.md.fontWeight` |
| name | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| stats | fontSize | RN-wrapper | `14` | `14.sp` | `14` | `type.body.md.fontSize` |
| stats | color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Layout — Compact Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

---

## NOTES

- **Selected variant:** 16px padding, 2px primary border, full detail view
- **Compact variant:** 12px padding, 1px subtle border, single row layout
- **Visual hierarchy:** Selected state uses thicker primary border (2px) to indicate selection
- **Children:** Delegates styling to RouteBadge, StatRow, WeatherPill components
- **Badges:** Horizontal row with 8px gap, wraps to multiple lines
- **Stats:** Horizontal row with 16px gap
- **Spacing:** 12px margin bottom on card, 12px bottom margin on header and stats
- **Compact:** Side-by-side name and stats, reduced opacity (0.8)
- **Border radius:** 16px (lg) for card shape
- **Weather pill:** Only renders in selected variant when weatherSummary provided
