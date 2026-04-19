# Speedometer - STYLE PROPERTIES MATRIX

**Component:** Speedometer (DELTA)
**Level:** Molecule
**RN Source:** **NEW COMPONENT — NO RN BASELINE**
**Framework Primitives:** Platform-specific drawing APIs

---

## DELTA CONTEXT

**Source UC:** UC-NAV-04 — Turn-by-turn navigation with speed limit display

**Rationale:** Net-new component for radial speed gauge with speed-limit color state machine. No existing gauge primitive in the component catalog.

**Migration path:** Native-only implementation using custom drawing:
- Android: `Canvas` + `DrawScope` arc drawing
- iOS: `SwiftUI` Path + `trim` modifier for arcs

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| UC Spec | `.spec/prds/native-rewrite/09-uc-navigation.md` | UC-NAV-04 requirements |

---

## STYLE PROPERTIES MATRIX

### Layout — Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| width | Task spec | `120` | `Modifier.size(120.dp)` | `.frame(width: 120, height: 120)` | ESCALATE — propose `size.speedometer = 120` |
| height | Task spec | `120` | Included above | Included above | ESCALATE — propose `size.speedometer = 120` |
| backgroundColor | Task spec | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| borderRadius | Task spec | `radius.full` = 9999 | `RoundedCornerShape(50.percent)` / `CircleShape` | `Circle()` | `radius.full` |

### Visual — Gauge Arc (Canvas/Path)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| sweepAngle | Task spec | `270` (degrees) | `-270.degrees` (clockwise from top) | `.trim(from: 0.125, to: 0.875)` | n/a |
| strokeWidth | Task spec | `8` | `8.dp` | `8` | ESCALATE — propose `size.gaugeStroke = 8` |
| trackColor | Task spec | `color.surfaceVariant.default` | SurfaceVariant | SurfaceVariant | `color.surfaceVariant.default` |

### Visual — Speed Arc (by speed vs limit)

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| under-limit | color | Task spec | `color.success.default` | Success | Success | `color.success.default` |
| at-limit | color | Task spec | `color.warning.default` | Warning | Warning | `color.warning.default` |
| over-limit | color | Task spec | `color.danger.default` | Danger | Danger | `color.danger.default` |

### Typography — Speed Value (Text)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | Task spec | `32` | `32.sp` | `.font(.system(size: 32, weight: .bold))` | ESCALATE — propose `type.speedometerValue.fontSize = 32` |
| fontWeight | Task spec | `'700'` (bold) | `FontWeight.Bold` | `.bold` | ESCALATE — propose `type.speedometerValue.fontWeight = 700` |
| color | Task spec | `color.onSurface.default` | OnSurface | OnSurface | `color.onSurface.default` |
| textAlign | Task spec | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |

### Typography — Unit Label (Text)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | Task spec | `12` | `12.sp` | `.font(.system(size: 12))` | ESCALATE — propose `type.speedometerUnit.fontSize = 12` |
| color | Task spec | `color.onSurface.muted` | OnSurfaceMuted | OnSurfaceMuted | `color.onSurface.muted` |
| text | Task spec | `'mph'` or `'km/h'` | `Text("mph")` | `Text("mph")` | n/a |

### Visual — Speed Limit Indicator (optional)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | Task spec | `top-right` | `Modifier.align(Alignment.TopEnd)` | `.frame(maxWidth: .infinity, alignment: .topTrailing)` | n/a |
| backgroundColor | Task spec | `color.surfaceVariant.default` | SurfaceVariant | SurfaceVariant | `color.surfaceVariant.default` |
| borderRadius | Task spec | `radius.sm` = 4 | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |
| padding | Task spec | `4` | `Modifier.padding(4.dp)` | `.padding(4)` | `space.xs` |

### Typography — Speed Limit Value (Text)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | Task spec | `14` | `14.sp` | `.font(.system(size: 14, weight: .bold))` | ESCALATE — propose `type.speedLimitValue.fontSize = 14` |
| fontWeight | Task spec | `'700'` (bold) | `FontWeight.Bold` | `.bold` | ESCALATE — propose `type.speedLimitValue.fontWeight = 700` |
| color | Task spec | `color.onSurface.default` | OnSurface | OnSurface | `color.onSurface.default` |

### State — Props

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|
| speed | Task spec | `Int` (mph or km/h) | `val speed: Int` | `var speed: Int` | n/a |
| speedLimit | Task spec | `Int` (mph or km/h) | `val speedLimit: Int` | `var speedLimit: Int` | n/a |
| unit | Task spec | `'mph'` or `'km/h'` | `val unit: SpeedUnit` | `var unit: SpeedUnit` | n/a |

---

## NOTES

- **NEW component:** No RN baseline exists
- **Radial gauge:** 270-degree arc (3/4 circle, open at bottom)
- **Size:** 120px circular container
- **Track:** surfaceVariant color, 8px stroke
- **Speed arc:** Color-coded by speed vs limit (success/warning/danger)
- **Speed value:** 32px bold text centered
- **Unit label:** 12px muted text below value
- **Speed limit indicator:** Optional badge at top-right
- **Color states:** Green (under), Amber (at), Red (over limit)
- **Accessibility:** `accessibilityLabel` = "{speed} miles per hour", `accessibilityRole` = "summary"
