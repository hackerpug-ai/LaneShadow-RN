# Speedometer — STYLE PROPERTIES MATRIX

**Component:** Speedometer
**Level:** Molecule (Delta)
**Source:** UC-NAV-04 (NEW for Sprint 2)
**Platform Mapping:** Android `Canvas` radial gauge, iOS `Shape` radial gauge

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Visual | NEW component (no RN source) | Canvas drawing APIs | Android: `app/src/main/java/com/laneshadow/ui/molecules/Speedometer.kt`<br>iOS: `app/ui/molecules/Speedometer.swift` | 3 states: normal, warning, danger |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property for this net-new component.

### Layout — Gauge Container

**Source files read:**
- Specification: UC-NAV-04 (navigation use case)
- Design: Radial speed gauge with speed-limit color state machine

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | size | UC spec | `200 × 200` | `Modifier.size(200.dp)` | `.frame(width: 200, height: 200)` | ESCALATE — propose `size.speedometer = 200` |
| Visual | backgroundColor | UC spec | `transparent` | `Color.Transparent` | `.clear` | n/a |

### Visual — Gauge Arc

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | arcStrokeWidth | UC spec | `12` | `Stroke(width = 12.dp)` | `.stroke(lineWidth: 12)` | ESCALATE — propose `size.gaugeStrokeWidth = 12` |
| Visual | arcColor (background) | UC spec | `semantic.color.onSurface.disabled` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |
| Visual | arcColor (normal) | UC spec | `semantic.color.success.default` (≤ speed limit) | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| Visual | arcColor (warning) | UC spec | `semantic.color.warning.default` (1-10 over) | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| Visual | arcColor (danger) | UC spec | `semantic.color.danger.default` (>10 over) | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| Animation | sweepAngle | UC spec | 0-270° based on speed | `animateFloatAsState(...)` | `@State var sweepAngle: CGFloat` | n/a |
| Animation | duration | UC spec | `300ms` | `animationSpec = tween(300)` | `.animation(.easeInOut(duration: 0.3))` | ESCALATE — `motion.duration.normal = 300` |

### Typography — Speed Value

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | UC spec | `48` | `48.sp` | `font(.system(size: 48))` | ESCALATE — map to `type.display.sm.fontSize = 36` (scale up) |
| Typography | fontWeight | UC spec | `'700'` | `FontWeight.Bold` | `.bold` | ESCALATE — `fontWeight.bold = 700` |
| Typography | color | UC spec | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | textAlign | UC spec | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| Layout | position | UC spec | Centered | `Modifier.wrapContentSize(Alignment.Center)` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |

### Typography — Unit Label

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | UC spec | `14` | `14.sp` | `font(.system(size: 14))` | `type.label.md.fontSize` |
| Typography | fontWeight | UC spec | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` |
| Typography | color | UC spec | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Typography | textAlign | UC spec | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| Layout | marginTop | UC spec | `4` | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | `space.xs` |

### Typography — Speed Limit

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | UC spec | `12` | `12.sp` | `font(.system(size: 12))` | `type.label.sm.fontSize` |
| Typography | fontWeight | UC spec | `'600'` | `FontWeight.SemiBold` | `.semibold` | `type.label.sm.fontWeight` |
| Typography | color | UC spec | Varies by state | `LaneShadowTheme.colors.[success/warning/danger]` | `theme.colors.[success/warning/danger]` | State-based tokens |
| Typography | textAlign | UC spec | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| Layout | marginTop | UC spec | `8` | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |

---

## DESIGN NOTES

- **Net-new component** for Sprint 2 delta
- Radial speed gauge (270° arc)
- Color state machine based on speed limit:
  - Green: at or below limit
  - Amber: 1-10 mph over limit
  - Red: >10 mph over limit
- Smooth animation (300ms)
- Large speed value in center
- Unit label (mph/kph)
- Speed limit shown below

---

## VERIFICATION GATES

- Arc animates smoothly
- Colors change at thresholds
- Speed value readable
- Speed limit visible
- Centered layout works

---

## DEPENDENCIES

- UI-001 (core theme contract)
- Canvas drawing (Android `Canvas`, iOS `Shape`)
- Animation system

---

## COMPOSITION

- Speedometer = Canvas + [arc, speedValue, unitLabel, speedLimit]
- Used by: NavigationOverlay (map overlay during navigation)
