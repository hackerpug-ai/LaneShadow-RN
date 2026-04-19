# TopographicBackground - STYLE PROPERTIES MATRIX

**Component:** TopographicBackground
**RN Source:** `react-native/components/auth/topographic-background.tsx`
**Framework Primitives:** `react-native-svg/`, `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/auth/topographic-background.tsx` | Public API, SVG rendering |
| Svg | `react-native-svg/` | SVG vector graphics rendering |
| Path | `react-native-svg/` | Contour line paths |
| RadialGradient | `react-native-svg/` | Glow gradient background |
| Rect | `react-native-svg/` | Background rectangle |

---

## COMPOSITION

**Child atoms:**
- None (SVG primitives only)

**Composition pattern:** Full-screen absolute positioned View with SVG content. SVG contains radial gradient (glow) and 6 contour path lines. View has pointerEvents="none" to pass touches through. Used as decorative background in auth screens.

**Layout:** Absolute positioned container filling entire screen (StyleSheet.absoluteFillObject). SVG viewBox="0 0 360 800" (mobile screen aspect ratio).

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` (via StyleSheet.absoluteFillObject) | `Modifier.fillMaxSize()` with parent Box | `.frame(maxWidth: .infinity, maxHeight: .infinity).position(x: 0, y: 0)` | n/a |
| top | RN-wrapper | `0` | Included in absolute fill | Included in absolute fill | n/a |
| left | RN-wrapper | `0` | Included in absolute fill | Included in absolute fill | n/a |
| right | RN-wrapper | `0` | Included in absolute fill | Included in absolute fill | n/a |
| bottom | RN-wrapper | `0` | Included in absolute fill | Included in absolute fill | n/a |
| pointerEvents | RN-wrapper | `'none'` | `Modifier.pointerInteropFilter { false }` or `clickable(false)` | `.allowsHitTesting(false)` | n/a |

### Layout — SVG

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| height | RN-wrapper | `'100%'` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |
| viewBox | RN-wrapper | `'0 0 360 800'` | `Painter.intrinsicSize` or custom | `CGSize(width: 360, height: 800)` | n/a |
| opacity | RN-wrapper | `opacity` prop (default 0.1) | `Modifier.alpha(opacity)` | `.opacity(opacity)` | n/a |

### Visual — RadialGradient (Glow)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| id | RN-wrapper | `'topoGlow'` | Gradient reference | Gradient identifier | n/a |
| cx | RN-wrapper | `'20%'` | `offsetX = 0.2f` (relative) | `.relative` coordinate | n/a |
| cy | RN-wrapper | `'25%'` | `offsetY = 0.25f` (relative) | `.relative` coordinate | n/a |
| rx | RN-wrapper | `'60%'` | 60% of width | 60% of width | n/a |
| ry | RN-wrapper | `'60%'` | 60% of height | 60% of height | n/a |

### Visual — RadialGradient Stops

| Offset | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| 0% | RN-wrapper | `primary color, 22% opacity` | `Color.Copy(alpha = 0.22f)` | `opacity: 0.22` | `color.primary.default` + `opacity.glowCenter = 0.22` |
| 55% | RN-wrapper | `primary color, 8% opacity` | `Color.Copy(alpha = 0.08f)` | `opacity: 0.08` | `color.primary.default` + `opacity.glowMid = 0.08` |
| 100% | RN-wrapper | `primary color, 0% opacity` | `Color.Copy(alpha = 0f)` | `opacity: 0` | `color.primary.default` + `opacity.transparent = 0` |

### Visual — Rect (Background)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| x | RN-wrapper | `0` | `left = 0.dp` | `x: 0` | n/a |
| y | RN-wrapper | `0` | `top = 0.dp` | `y: 0` | n/a |
| width | RN-wrapper | `360` | `width = 360.dp` | `width: 360` | n/a |
| height | RN-wrapper | `800` | `height = 800.dp` | `height: 800` | n/a |
| fill | RN-wrapper | `'url(#topoGlow)'` | `Brush.verticalGradient(...)` | `.fill(RadialGradient(...))` | n/a (SVG reference) |

### Visual — Contour Paths

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| stroke | RN-wrapper | `semantic.color.onSurface.default` | `Color(...)` in Stroke | `stroke: Color(...)` | `color.onSurface.default` |
| strokeOpacity | RN-wrapper | `0.06 → 0.03` (decreasing per line) | `alpha = 0.06f → 0.03f` | `opacity: 0.06 → 0.03` | ESCALATE — propose `opacity.contourLine[n]` |
| strokeWidth | RN-wrapper | `Math.max(1, Math.round(semantic.space.xs / 2))` | `strokeWidth = ...dp` | `strokeWidth: ...` | ESCALATE — calculate from `space.xs` |
| fill | RN-wrapper | `'none'` | `DrawStyle.Stroke` (no fill) | `fillColor: nil` | n/a |

**Contour Path Data (d attribute):**
1. `M-40 110 C 40 30, 150 30, 230 110 S 420 190, 520 110` (top)
2. `M-60 170 C 20 90, 150 90, 260 170 S 470 250, 590 170`
3. `M-80 230 C 0 150, 150 150, 280 230 S 520 330, 660 230`
4. `M-100 300 C -10 220, 160 220, 300 300 S 560 420, 700 300`
5. `M-120 380 C -20 300, 170 300, 320 380 S 600 510, 760 380`
6. `M-140 470 C -30 390, 180 390, 340 470 S 640 620, 820 470` (bottom)

**Stroke Opacity Gradient:** 0.06, 0.05, 0.045, 0.04, 0.035, 0.03 (decreasing from top to bottom)

**Stroke Width Calculation:** `Math.max(1, Math.round(semantic.space.xs / 2))` → typically 2px (if xs=4)

### Prop — Opacity

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| default | RN-wrapper | `0.1` | `Modifier.alpha(0.1f)` | `.opacity(0.1)` | ESCALATE — propose `opacity.topographicBg = 0.1` |
| prop | RN-wrapper | `opacity?: number` | `Modifier.alpha(opacity ?: 0.1f)` | `.opacity(opacity ?? 0.1)` | n/a |

---

## NOTES

- **Full-screen overlay:** Absolute positioned View fills entire screen
- **Non-interactive:** pointerEvents="none" passes all touches through to content below
- **SVG viewBox:** 360×800 (mobile portrait aspect ratio)
- **Glow effect:** Radial gradient at top-left (20%, 25%), 60% spread
- **Gradient stops:** 22% opacity (center) → 8% (55%) → 0% (edge)
- **Contour lines:** 6 bezier curves creating topographic map effect
- **Stroke color:** onSurface.default
- **Stroke opacity:** Gradient from 0.06 (top) to 0.03 (bottom)
- **Stroke width:** Calculated as half of space.xs, minimum 1px
- **Fill:** None (stroke only)
- **Overall opacity:** Default 0.1, configurable via prop
- **Purpose:** Decorative background for auth screens, creating subtle topographic texture
- **Performance:** SVG is lightweight, scales without rasterization
- **Theme-aware:** Uses semantic color tokens for stroke and gradient

**Design Pattern:**
- Glow creates ambient light effect at top-left
- Contour lines simulate elevation map
- Very subtle opacity (10% default, 3-6% per line) for non-intrusive background
- Used behind AuthCard in login/signup screens
