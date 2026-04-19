# CompletionSummaryCard — STYLE PROPERTIES MATRIX

**Component:** CompletionSummaryCard
**Level:** Organism (Delta)
**Source:** UC-REC-05, UC-NAV-06, UC-FLOW-08 (NEW for Sprint 2)
**Platform Mapping:** Android `Column` + metrics, iOS `VStack` + metrics

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | NEW component (no RN source) | Column + card layout | Android: `app/src/main/java/com/laneshadow/ui/organisms/CompletionSummaryCard.kt`<br>iOS: `app/ui/organisms/CompletionSummaryCard.swift` | 1 fixed layout with dynamic metrics |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property for this net-new component.

### Layout — Card Container

**Source files read:**
- Specification: UC-REC-05, UC-NAV-06, UC-FLOW-08 (ride completion use cases)
- Design: Post-ride summary hero (metrics + curvature + polyline preview + save/discard CTAs)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | padding | UC spec | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | ESCALATE — `space.lg` |
| Visual | backgroundColor | UC spec | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| Visual | borderRadius | UC spec | `16` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Visual | shadow | UC spec | `elevation[3]` | `Modifier.shadow(elevation = 3.dp)` | `.shadow(color:.black.opacity(0.08), radius:8, y:4)` | `elevation.light.3` |
| Layout | gap | UC spec | `16` | `Spacer(Modifier.height(16.dp))` | `Spacer(minLength: 16)` | `space.lg` |

### Layout — Metrics Grid

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | UC spec | Grid (2 columns) | `Row(horizontalArrangement = Arrangement.spacedBy(8.dp))` | `LazyVGrid(columns: [.flexible()], spacing: 8)` | n/a |
| Layout | gap | UC spec | `8` | `Spacer(Modifier.width(8.dp))` | `spacing: 8` | `space.sm` |
| Layout | metricWidth | UC spec | `50%` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |

### Layout — Metric Item

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | padding | UC spec | `12` | `Modifier.padding(12.dp)` | `.padding(12)` | ESCALATE — `space.md` |
| Visual | backgroundColor | UC spec | `surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | borderRadius | UC spec | `8` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Layout | gap | UC spec | `4` | `Spacer(Modifier.height(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |

### Typography — Metric Label

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | UC spec | `11` | `11.sp` | `font(.system(size: 11))` | ESCALATE — `type.label.sm.fontSize = 11` |
| Typography | fontWeight | UC spec | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.sm.fontWeight` |
| Typography | color | UC spec | `onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Typography | textTransform | UC spec | `'uppercase'` | `text.uppercase()` | `.textCase(.uppercase)` | n/a |

### Typography — Metric Value

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | UC spec | `20` | `20.sp` | `font(.system(size: 20))` | ESCALATE — map to `type.title.lg.fontSize = 24` (scale down) |
| Typography | fontWeight | UC spec | `'700'` | `FontWeight.Bold` | `.bold` | ESCALATE — `fontWeight.bold = 700` |
| Typography | color | UC spec | `onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Polyline Preview

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height | UC spec | `80` | `Modifier.height(80.dp)` | `.frame(height: 80)` | ESCALATE — propose `size.previewHeight = 80` |
| Visual | backgroundColor | UC spec | `background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| Visual | borderRadius | UC spec | `8` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Visual | strokeColor | UC spec | `primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | strokeWidth | UC spec | `3` | `strokeWidth = 3.dp` | `.stroke(lineWidth: 3)` | ESCALATE — propose `borderWidth.polyline = 3` |

### Layout — Action Buttons

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | UC spec | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | justifyContent | UC spec | `'flex-end'` | `horizontalArrangement = Arrangement.End` | `.frame(maxWidth: .infinity, alignment: .trailing)` | n/a |
| Layout | gap | UC spec | `8` | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |

---

## DESIGN NOTES

- **Net-new component** for Sprint 2 delta
- Post-ride summary card
- Shows metrics (distance, duration, elevation, etc.)
- Polyline preview of route
- Save and discard buttons
- Consolidates `RideCompletionScreen` + `RideSummaryScreen` use cases
- Used in ride completion flow

---

## VERIFICATION GATES

- Metrics grid aligned
- Metric labels readable
- Polyline visible
- Buttons accessible
- Card shadow visible

---

## DEPENDENCIES

- UI-001 (core theme contract)
- Button component
- IconSymbol component
- Map polyline rendering

---

## COMPOSITION

- CompletionSummaryCard = Column + [MetricsGrid, PolylinePreview, ActionButtons]
- MetricsGrid = [MetricItem, MetricItem, ...]
- MetricItem = Column + [label, value, icon]
- Used by: RideCompletionScreen
