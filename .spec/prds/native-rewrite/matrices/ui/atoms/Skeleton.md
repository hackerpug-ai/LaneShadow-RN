# Skeleton - STYLE PROPERTIES MATRIX

**Component:** Skeleton
**RN Source:** `react-native/components/ui/skeleton.tsx`
**Atomic Level:** Atom
**Domain:** Feedback/Loading

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/skeleton.tsx` | Public API, pulse animation |

---

## STYLE PROPERTIES MATRIX

### Layout — Dimensions

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | prop `width` | `Modifier.width(width.dp)` | `.frame(width: width)` | n/a (prop-controlled) |
| height | RN-wrapper | prop `height` | `Modifier.height(height.dp)` | `.frame(height: height)` | n/a (prop-controlled) |
| borderRadius | RN-wrapper | prop `shape` defaults to `radius.md` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |

### Visual — Colors

| Theme | Source | Background | Shimmer | Android | iOS | Token |
|---|---|---|---|---|---|---|
| light | RN-wrapper | `color.surface.default` | `color.onSurface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| dark | RN-wrapper | `color.surface.default` | `color.onSurface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |

### Animation — Pulse

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| minOpacity | RN-wrapper | 0.4 | `animateFloatAsState(0.4f)` | `.opacity(0.4)` | `opacity.pulseMin` |
| maxOpacity | RN-wrapper | 1.0 | `animateFloatAsState(1f)` | `.opacity(1)` | `opacity.pulseMax` |
| duration | RN-wrapper | 1500ms (implied) | `infiniteRepeatable(tween(duration = 1500))` | `.animation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true))` | semantic.motion.duration.pulse|
| easing | RN-wrapper | ease-in-out | `AnimationSpec.EaseInOut` | `.easeInOut` | `motion.easing.emphasized` |

---

## NOTES

- **Prop-driven**: Width and height controlled by props for flexible sizing
- **Border radius**: Defaults to `radius.md` (8px), overrideable via shape prop
- **Animation**: Pulse between 40% and 100% opacity
- **Duration**: 1500ms cycle (600ms fade suggested by `motion.duration.highlight`)
- **Usage**: Loading placeholder for dynamic content
