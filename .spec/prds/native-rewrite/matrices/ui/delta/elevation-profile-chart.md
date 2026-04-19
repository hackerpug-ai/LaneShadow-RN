# ElevationProfileChart — STYLE PROPERTIES MATRIX

**Component:** ElevationProfileChart
**Level:** Organism (Delta)
**Source:** UC-COMP-04 (NEW for Sprint 2)
**Platform Mapping:** Android `Vico` chart, iOS `Swift Charts`

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Visual | NEW component (no RN source) | Native chart libraries | Android: `app/src/main/java/com/laneshadow/ui/organisms/ElevationProfileChart.kt`<br>iOS: `app/ui/organisms/ElevationProfileChart.swift` | 1 fixed chart with grade coloring |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property for this net-new component.

### Layout — Chart Container

**Source files read:**
- Specification: UC-COMP-04 (route comparison use case)
- Design: Native chart with grade-colored segments + crosshair

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height | UC spec | `120` | `Modifier.height(120.dp)` | `.frame(height: 120)` | ESCALATE — propose `size.chartHeight = 120` |
| Layout | width | UC spec | `100%` of parent | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Visual | backgroundColor | UC spec | `transparent` | `Color.Transparent` | `.clear` | n/a |
| Visual | padding | UC spec | `0` (no padding) | `Modifier.padding(0.dp)` | `.padding(0)` | n/a |

### Visual — Chart Line

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Visual | lineColor | UC spec | Grade-based (see below) | `lineColor = gradeColor` | `.foregroundStyle(gradeColor)` | n/a (grade-based) |
| Visual | lineColor (flat) | UC spec | `semantic.color.success.default` (≤3%) | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| Visual | lineColor (moderate) | UC spec | `semantic.color.warning.default` (3-6%) | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| Visual | lineColor (steep) | UC spec | `semantic.color.danger.default` (>6%) | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| Visual | lineWidth | UC spec | `2` | `strokeWidth = 2.dp` | `.stroke(lineWidth: 2)` | ESCALATE — `borderWidth.thick = 2` |
| Visual | lineStyle | UC spec | Solid | `solid` | `.stroke` with no dash | n/a |

### Visual — Fill Gradient

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Visual | fillEnabled | UC spec | `true` | `areaStyle = AreaStyle(...)` | `.area` | n/a |
| Visual | fillStartColor | UC spec | `primary.default` with 30% alpha | `primary.copy(alpha = 0.3f)` | `primary.opacity(0.3)` | `color.primary.default` + alpha |
| Visual | fillEndColor | UC spec | `primary.default` with 0% alpha | `primary.copy(alpha = 0f)` | `primary.opacity(0)` | `color.primary.default` + alpha |

### Layout — Crosshair

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | visibility | UC spec | `false` (hidden until tap) | `alpha = if (isPressed) 1f else 0f` | `.opacity(isPressed ? 1 : 0)` | n/a |
| Visual | verticalLineColor | UC spec | `onSurface.subtle` with 50% alpha | `onSurfaceSubtle.copy(alpha = 0.5f)` | `onSurfaceSubtle.opacity(0.5)` | `color.onSurface.subtle` + alpha |
| Visual | verticalLineWidth | UC spec | `1` | `strokeWidth = 1.dp` | `.stroke(lineWidth: 1)` | ESCALATE — `borderWidth.thin = 1` |
| Visual | horizontalLineColor | UC spec | Same as vertical | Same | Same | Same |
| Visual | dotColor | UC spec | `primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | dotSize | UC spec | `6` | `Modifier.size(6.dp)` | `.frame(width: 6, height: 6)` | ESCALATE — propose `size.crosshairDot = 6` |

### Typography — Axis Labels

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | UC spec | `10` | `10.sp` | `font(.system(size: 10))` | ESCALATE — map to `type.label.sm.fontSize = 11` (closest) |
| Typography | color | UC spec | `onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Layout | padding | UC spec | `4` | `Modifier.padding(4.dp)` | `.padding(4)` | `space.xs` |

### Typography — Tooltip Label

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | visibility | UC spec | `false` (hidden until tap) | Same as crosshair | Same | n/a |
| Typography | fontSize | UC spec | `12` | `12.sp` | `font(.system(size: 12))` | `type.label.sm.fontSize` |
| Typography | fontWeight | UC spec | `'600'` | `FontWeight.SemiBold` | `.semibold` | `type.label.sm.fontWeight` |
| Typography | color | UC spec | `onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Visual | backgroundColor | UC spec | `surface.default` with 95% alpha | `surface.copy(alpha = 0.95f)` | `surface.opacity(0.95)` | ESCALATE — `opacity.tooltipBg = 0.95` |
| Visual | borderRadius | UC spec | `4` | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |
| Visual | shadow | UC spec | `elevation[2]` | `Modifier.shadow(elevation = 2.dp)` | `.shadow(color:.black.opacity(0.05), radius:4, y:2)` | `elevation.light.2` |

---

## DESIGN NOTES

- **Net-new component** for Sprint 2 delta
- Native chart implementation (no React Native)
- Android: Vico chart library
- iOS: Swift Charts framework
- Grade-colored segments (green/amber/red)
- Crosshair on touch/press
- Tooltip showing elevation at point
- No chart primitive in 08a (this is organism-level)
- Used in route comparison

---

## VERIFICATION GATES

- Chart renders elevation data
- Grade colors correct
- Crosshair appears on touch
- Tooltip shows elevation
- Smooth line rendering
- Fill gradient visible

---

## DEPENDENCIES

- UI-001 (core theme contract)
- Chart libraries:
  - Android: `com.patrykandpatrick.vico:views`
  - iOS: `SwiftCharts` framework
- Touch/gesture system

---

## COMPOSITION

- ElevationProfileChart = Vico/SwiftCharts + [line, fill, crosshair, tooltip, axisLabels]
- Used by: RouteComparisonView, RouteDetailsSheet
