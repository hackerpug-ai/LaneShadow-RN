# ElevationProfileChart - STYLE PROPERTIES MATRIX

**Component:** ElevationProfileChart (DELTA)
**Level:** Organism
**RN Source:** **NEW COMPONENT — NO RN BASELINE**
**Framework Primitives:** Platform chart libraries

---

## DELTA CONTEXT

**Source UC:** UC-COMP-04 — Route comparison with elevation profile visualization

**Rationale:** Net-new organism for native chart rendering with grade-colored segments + crosshair. No chart primitive exists in 08a catalog.

**Migration path:** Native chart library integration:
- Android: Vico chart library
- iOS: Swift Charts framework

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| UC Spec | `.spec/prds/native-rewrite/14-uc-route-comparison.md` | UC-COMP-04 requirements |

---

## STYLE PROPERTIES MATRIX

### Layout — Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| width | Task spec | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| height | Task spec | `180` (chart height) | `Modifier.height(180.dp)` | `.frame(height: 180)` | ESCALATE — propose `layout.elevationChartHeight = 180` |
| backgroundColor | Task spec | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| borderRadius | Task spec | `radius.lg` = 12 | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` |
| padding | Task spec | `space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |

### Layout — Chart (platform-specific)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| chartType | Task spec | `line chart` | `LineChart(...)` | `Chart { ... }` | n/a (chart lib) |
| xAxis | Task spec | `distance (km/mi)` | `bottomAxis = ...` | `Chart(..., xAxis: ...)` | n/a |
| yAxis | Task spec | `elevation (m/ft)` | `startAxis = ...` | `Chart(..., yAxis: ...)` | n/a |

### Visual — Line Segments (by grade)

| Grade | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flat | color | Task spec | `color.success.default` | Success | Success | `color.success.default` |
| uphill | color | Task spec | `color.warning.default` | Warning | Warning | `color.warning.default` |
| steep | color | Task spec | `color.danger.default` | Danger | Danger | `color.danger.default` |

### Visual — Area Fill (below line)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| brush | Task spec | `vertical gradient` | `Brush.verticalGradient(...)` | `.foregroundStyle(.linearGradient(...))` | n/a |
| colors | Task spec | `primary with 0.3 to 0 alpha` | `[primaryColor.copy(alpha = 0.3f), Color.Transparent]` | `[primary.opacity(0.3), Color.clear]` | ESCALATE — propose `opacity.chartFill = 0.3` |

### Visual — Crosshair (interactive)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| verticalLine | Task spec | `dashed, onSurface.subtle` | `DashedPathEffect(...)` | `Stroke(style: .init(dash: [4, 4]))` | n/a |
| horizontalLine | Task spec | `dashed, onSurface.subtle` | `DashedPathEffect(...)` | `Stroke(style: .init(dash: [4, 4]))` | n/a |
| intersectionDot | Task spec | `primary, 8px` | `CircleShape(size = 8.dp)` | `Circle().frame(width: 8, height: 8)` | ESCALATE — propose `size.crosshairDot = 8` |

### Visual — Grid Lines (optional)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| horizontal | Task spec | `onSurface.subtle, 0.5px` | `Line(..., color = onSurfaceSubtle, strokeWidth = 0.5.dp)` | `GridComponent(..., stroke: BorderStroke(width: 0.5, ...))` | n/a |
| vertical | Task spec | `onSurface.subtle, 0.5px` | Included above | Included above | n/a |

### Typography — Axis Labels (Text variant=labelSmall)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | Task spec | `labelSmall` | `MaterialTheme.typography.labelSmall` | Verify against Paper | n/a |
| color | Task spec | `color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Typography — Tooltip (Text variant=labelMedium)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | Task spec | `labelMedium` | `MaterialTheme.typography.labelMedium` | Verify against Paper | n/a |
| text | Task spec | `'1,234 m'` | `Text("1,234 m")` | `Text("1,234 m")` | n/a (dynamic) |
| color | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### State — Props

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|
| elevationPoints | Task spec | `List<ElevationPoint>` | `val elevationPoints: List<ElevationPoint>` | `var elevationPoints: [ElevationPoint]` | n/a |
| unit | Task spec | `'metric'` or `'imperial'` | `val unit: DistanceUnit` | `var unit: DistanceUnit` | n/a |
| onPointSelect | Task spec | `(ElevationPoint) -> Unit` | `onPointSelect: (ElevationPoint) -> Unit` | `onPointSelect: (ElevationPoint) -> Void` | n/a |

### Data Model — ElevationPoint

| Property | Type | Purpose |
|---|---|---|
| distance | Double (km or mi) | X-axis value |
| elevation | Double (m or ft) | Y-axis value |
| grade | String ('flat', 'uphill', 'steep') | Segment color |

---

## NOTES

- **NEW organism:** No RN baseline exists
- **Chart libraries:** Vico (Android), Swift Charts (iOS)
- **Chart size:** 180px height, full width
- **Line segments:** Color-coded by grade (success/warning/danger)
- **Area fill:** Primary color gradient 30% to transparent
- **Crosshair:** Dashed lines + intersection dot on touch
- **Grid:** Optional subtle grid lines
- **Axis labels:** Distance (x), elevation (y)
- **Tooltip:** Shows elevation at crosshair position
- **Interactive:** Touch to show crosshair and tooltip
- **Units:** Metric (m, km) or imperial (ft, mi)
- **Accessibility:** `accessibilityLabel` = "Elevation profile chart"
- **TestID:** Passed to container
