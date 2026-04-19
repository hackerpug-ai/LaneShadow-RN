# RouteLegTimeline - STYLE PROPERTIES MATRIX

**Component:** RouteLegTimeline
**RN Source:** `react-native/components/ui/route-leg-timeline.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/expo-linear-gradient/`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/route-leg-timeline.tsx` | Public API, segment layout, timeline visualization |
| LinearGradient | `node_modules/expo-linear-gradient/` | Gradient connector line between dots |
| WindBadge | `react-native/components/ui/wind-badge.tsx` | Wind level badge per segment (see `matrices/ui/molecules/WindBadge.md`) |
| RainBadge | `react-native/components/ui/rain-badge.tsx` | Rain intensity badge per segment (see `matrices/ui/molecules/RainBadge.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Labels and stats typography |

---

## COMPOSITION

**Child atoms/molecules:**
- `WindBadge` - Wind level indicator (see `matrices/ui/molecules/WindBadge.md`)
- `RainBadge` - Rain intensity indicator (see `matrices/ui/molecules/RainBadge.md`)

**Composition pattern:** Two-column layout. Left column has timeline dots (start dot, gradient connector, end/waypoint dot). Right column has start label, segment label, distance/duration stats, weather badges. Gradient fades from primary (top) to muted (bottom).

**Layout:** Vertical stack of segment rows (flexDirection: 'row'). Each segment has left column (timeline) and right content column. Segment spacing via paddingVertical.

---

## STYLE PROPERTIES MATRIX

### Layout — Segment Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'stretch'` | `verticalAlignment = Alignment.Top` (stretch not direct) | `.alignment(.top)` | n/a |
| paddingVertical | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(vertical = 12.dp)` | `.padding(.vertical, 12)` | `space.md` |

### Layout — Left Column (Timeline)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'column'` | `Column(...)` | `VStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | n/a | n/a |
| flexShrink | RN-wrapper | `0` | `Modifier.width(...)` (fixed width prevents shrink) | `.frame(width: ...)` | n/a |
| width | RN-wrapper | `semantic.space.xl` = 24 | `Modifier.width(24.dp)` | `.frame(width: 24)` | `space.xl` |

### Layout — Timeline Dot

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `semantic.space.md` = 12 | `Modifier.size(12.dp)` | `.frame(width: 12, height: 12)` | `space.md` |
| height | RN-wrapper | `semantic.space.md` = 12 | n/a | n/a | n/a |
| borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| borderWidth (start/end) | RN-wrapper | `2` | `Modifier.border(2.dp, ...)` | `.overlay(Circle().strokeBorder(..., lineWidth: 2))` | `borderWidth.thick` |

### Layout — Connector (Gradient Line)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `2` | `Modifier.width(2.dp)` | `.frame(width: 2)` | `borderWidth.thin` |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxHeight: .infinity)` | n/a |
| marginVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| borderRadius | RN-wrapper | `9999` | `CircleShape` on vertical line | `.clipShape(Capsule())` | `radius.full` |

### Layout — Right Content Column

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| flexDirection | RN-wrapper | `'column'` | `Column(...)` | `VStack` | n/a |
| paddingLeft | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(start = 8.dp)` | `.padding(.leading, 8)` | `space.sm` |

### Layout — Stats Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `.spacing(8)` | `space.sm` |
| marginBottom | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(bottom = 4.dp)` | `.padding(.bottom, 4)` | `space.xs` |

### Layout — Badges Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| flexWrap | RN-wrapper | `'wrap'` | `FlowRow(...)` or `Row(horizontalArrangement = Arrangement.spacedBy(...))` | `FlowLayout` or `LazyVGrid` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.xs` = 4 | `Arrangement.spacedBy(4.dp)` | `.spacing(4)` | `space.xs` |
| marginBottom | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(bottom = 4.dp)` | `.padding(.bottom, 4)` | `space.xs` |

### Visual — Timeline Dot Colors

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| start dot backgroundColor | RN-wrapper | `'transparent'` | `Color.Transparent` | `Color.clear` | n/a |
| start dot borderColor | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |
| end dot (last) backgroundColor | RN-wrapper | `withAlpha(semantic.color.onSurface.muted, 0.5)` | `MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)` | `Color(.secondaryLabel).opacity(0.5)` | `color.onSurface.muted` + `opacity.faint` |
| waypoint dot backgroundColor | RN-wrapper | `'transparent'` | `Color.Transparent` | `Color.clear` | n/a |
| waypoint dot borderColor | RN-wrapper | `withAlpha(semantic.color.primary.default, 0.5)` | `MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)` | `Color(.orange).opacity(0.5)` | `color.primary.default` + `opacity.faint` |

### Visual — Gradient Connector

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| colors | RN-wrapper | `[primary, withAlpha(primary, 0.5), withAlpha(onSurface.muted, 0.3)]` | `Brush.verticalGradient(colorStops = [...])` | `LinearGradient(colors: [...], startPoint: .top, endPoint: .bottom)` | `color.primary.default` → opacity variations |
| start | RN-wrapper | `{ x: 0.5, y: 0 }` | `Alignment.CenterStart` | `.top` | n/a |
| end | RN-wrapper | `{ x: 0.5, y: 1 }` | `Alignment.CenterEnd` | `.bottom` | n/a |

### Typography — Labels

| Element | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| start/end label variant | RN-wrapper | `'bodySmall'` | `MaterialTheme.typography.bodySmall` | `.font(.system(size: 12))` | ESCALATE — propose `type.body.sm` |
| start/end label color | RN-wrapper | `semantic.color.onSurface.subtle` | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.tertiaryLabel)` | `color.onSurface.subtle` |
| segment label variant | RN-wrapper | `'bodySmall'` | `MaterialTheme.typography.bodySmall` | `.font(.system(size: 12))` | `type.body.sm` |
| segment label color | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.secondaryLabel)` | `color.onSurface.muted` |
| stats variant | RN-wrapper | `'bodySmall'` | `MaterialTheme.typography.bodySmall` | `.font(.system(size: 12))` | `type.body.sm` |
| stats color | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| separator color | RN-wrapper | `semantic.color.onSurface.subtle` | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.tertiaryLabel)` | `color.onSurface.subtle` |

### Spacing — Margins

| Element | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| label marginBottom | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(bottom = 4.dp)` or `Spacer(height = 4.dp)` | `.padding(.bottom, 4)` | `space.xs` |
| label marginTop (end) | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(top = 4.dp)` or `Spacer(height = 4.dp)` | `.padding(.top, 4)` | `space.xs` |

---

## NOTES

- **Two-column layout:** Left column (24px wide) for timeline, right column (flex: 1) for content
- **Timeline dots:** 12×12px circles. Start/end use 2px border with transparent fill. End dot (last segment) uses 50% opacity fill. Waypoint dots use 50% opacity border.
- **Gradient connector:** 2px wide line with vertical gradient from primary → 50% primary → 30% muted
- **Weather badges:** WindBadge and RainBadge in horizontal row with 4px gap
- **Label hierarchy:** Start/end label (subtle color), segment label ("Segment N"), stats (distance · duration), badges
- **Spacing:** 4px margin bottom between label rows
- **Empty state:** Returns null if legs array is empty
- **Leg labels:** Uses AI-generated label if available, falls back to "Start", "Destination", or "Start/End of Segment N"
- **Weather data:** Extracts worst rain/wind level per leg from overlays
- **Format helpers:** Distance in miles (1 decimal), duration in Xh Xm or Xm format
- **withAlpha utility:** Converts hex/rgb/rgba to rgba with specified opacity
