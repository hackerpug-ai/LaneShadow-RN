# CompletionSummaryCard - STYLE PROPERTIES MATRIX

**Component:** CompletionSummaryCard (DELTA)
**Level:** Organism
**RN Source:** **NEW COMPONENT — NO RN BASELINE**
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js` (composition of existing components)

---

## DELTA CONTEXT

**Source UC:** UC-REC-05, UC-NAV-06, UC-FLOW-08 — Post-ride summary display

**Rationale:** Net-new organism consolidating ride completion UI. Combines metrics, curvature, polyline preview, and save/discard CTAs into reusable card. Replaces `RideCompletionScreen` + `RideSummaryScreen` use cases.

**Migration path:** Compose existing components (`StatRow`, `Badge`, `Button`, route preview) - no new primitives needed.

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| UC Spec | `.spec/prds/native-rewrite/10-uc-ride-recording.md`, `09-uc-navigation.md`, `15-uc-ride-flow.md` | UC-REC-05, UC-NAV-06, UC-FLOW-08 requirements |
| StatRow | `react-native/components/ui/stat-row.tsx` | Metrics display (see matrices/ui/molecules/StatRow.md) |
| Badge | `react-native/components/ui/badge.tsx` | Metric badges (see matrices/ui/atoms/Badge.md) |
| Button | `react-native/components/ui/button.tsx` | CTAs (see matrices/ui/atoms/Button.md) |

---

## STYLE PROPERTIES MATRIX

### Layout — Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| width | Task spec | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| backgroundColor | Task spec | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| borderRadius | Task spec | `radius.lg` = 12 | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` |
| padding | Task spec | `space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| gap | Task spec | `space.lg` = 16 | `Arrangement.spacedBy(16.dp)` / `Modifier.padding(end = 16.dp)` between items | `spacing(16)` | `space.lg` |

### Layout — Header (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flexDirection | Task spec | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | Task spec | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | Task spec | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | `.frame(maxWidth: .infinity)` | n/a |
| marginBottom | Task spec | `space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |

### Typography — Title (Text variant=headlineSmall)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | Task spec | `headlineSmall` | `MaterialTheme.typography.headlineSmall` | Verify against Paper | n/a |
| fontSize | Paper headlineSmall | Verify in source | (verify) | (verify) | ESCALATE — verify token |
| color | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| text | Task spec | `'Ride Complete'` | `Text("Ride Complete")` | `Text("Ride Complete")` | n/a |

### Layout — Metrics Grid (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flexDirection | Task spec | `'row'` | `Row(...)` | `HStack` | n/a |
| flexWrap | Task spec | `'wrap'` | `Row(..., horizontalArrangement = Arrangement.spacedBy(8.dp))` | `LazyVGrid(...)` | n/a |
| gap | Task spec | `space.md` = 12 | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |
| marginBottom | Task spec | `space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |

### Layout — Metric Item (StatRow composition)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| icon | Task spec | Dynamic (clock, road, mountain) | `StatRow(icon = ..., value = ...)` | `StatRow(icon: ..., value: ...)` | n/a |
| value | Task spec | Dynamic (e.g., '2h 15m', '45 mi', '3,200 ft') | Included above | Included above | n/a |
| badge | Task spec | Optional variant badge | `Badge(...)` | `Badge(...)` | n/a |

### Layout — Curvature Section (View, optional)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flexDirection | Task spec | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | Task spec | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | Task spec | `space.sm` = 8 | `Arrangement.spacedBy(8.dp)` / `Modifier.padding(end = 8.dp)` between items | `spacing(8)` | `space.sm` |
| marginBottom | Task spec | `space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |

### Typography — Curvature Label (Text variant=labelLarge)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | Task spec | `labelLarge` | `MaterialTheme.typography.labelLarge` | Verify against Paper | n/a |
| color | Task spec | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| text | Task spec | `'Curvature: Very Curvy'` | `Text("Curvature: Very Curvy")` | `Text("Curvature: Very Curvy")` | n/a (dynamic) |

### Badge — Curvature Badge

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | Task spec | `'primary'` | `BadgeVariant.Primary` | `BadgeVariant.primary` | n/a |
| text | Task spec | `'85% curvy'` | `Badge(text = "85% curvy")` | `Badge("85% curvy")` | n/a (dynamic) |

### Layout — Route Preview (View, optional)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| height | Task spec | `120` | `Modifier.height(120.dp)` | `.frame(height: 120)` | ESCALATE — propose `size.routePreviewHeight = 120` |
| borderRadius | Task spec | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| overflow | Task spec | `'hidden'` | `Modifier.clip(shape)` | `.clipped()` | n/a |
| marginBottom | Task spec | `space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |

### Visual — Route Preview Background

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| backgroundColor | Task spec | `color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |

### Layout — Action Buttons (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flexDirection | Task spec | `'row'` | `Row(...)` | `HStack` | n/a |
| gap | Task spec | `space.md` = 12 | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |

### Button — Discard (Button)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| title | Task spec | `'Discard'` | `Button(title = "Discard", ...)` | `Button("Discard")` | n/a |
| variant | Task spec | `'secondary'` | `ButtonVariant.Secondary` | `ButtonVariant.secondary` | n/a |
| onPress | Task spec | `onDiscard` | `onPress = onDiscard` | `onPress: onDiscard` | n/a |
| flex | Task spec | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |

### Button — Save (Button)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| title | Task spec | `'Save Ride'` | `Button(title = "Save Ride", ...)` | `Button("Save Ride")` | n/a |
| variant | Task spec | `'default'` (primary) | `ButtonVariant.Default` | `ButtonVariant.default` | n/a |
| onPress | Task spec | `onSave` | `onPress = onSave` | `onPress: onSave` | n/a |
| flex | Task spec | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |

### State — Props

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|
| title | Task spec | `String` | `val title: String` | `var title: String` | n/a |
| metrics | Task spec | `List<Metric>` | `val metrics: List<Metric>` | `var metrics: [Metric]` | n/a |
| curvature | Task spec | `CurvatureData?` | `val curvature: CurvatureData?` | `var curvature: CurvatureData?` | n/a |
| routePreview | Task spec | `RoutePolyline?` | `val routePreview: RoutePolyline?` | `var routePreview: RoutePolyline?` | n/a |
| onDiscard | Task spec | `() -> Unit` | `onDiscard: () -> Unit` | `onDiscard: () -> Void` | n/a |
| onSave | Task spec | `() -> Unit` | `onSave: () -> Unit` | `onSave: () -> Void` | n/a |

### Data Model — Metric

| Property | Type | Purpose |
|---|---|---|
| icon | IconName | StatRow icon |
| value | String | Formatted metric value |
| badge | BadgeData? | Optional badge |

---

## NOTES

- **NEW organism:** No RN baseline exists
- **Composition:** Header + metrics grid + curvature + route preview + action buttons
- **Header:** "Ride Complete" title
- **Metrics:** 2-4 StatRow items with icons, values, optional badges
- **Curvature:** Label + badge (e.g., "85% curvy")
- **Route preview:** 120px tall, surfaceVariant background (optional)
- **Actions:** Discard (secondary) + Save (primary) buttons, equal width
- **Spacing:** 16px card padding, 12px gaps between sections
- **Border radius:** 12px
- **Accessibility:** `accessibilityLabel` = "Ride summary: {metrics}"
- **TestID:** Passed to container
