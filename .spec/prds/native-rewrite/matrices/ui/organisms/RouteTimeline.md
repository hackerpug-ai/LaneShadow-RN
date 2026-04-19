# RouteTimeline - STYLE PROPERTIES MATRIX

**Component:** RouteTimeline
**RN Source:** `react-native/components/sheets/route-timeline.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `expo-linear-gradient`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/route-timeline.tsx` | Public API, timeline visualization |
| LinearGradient | `expo-linear-gradient` | Vertical gradient line |
| Theme hook | `react-native/hooks/use-semantic-theme.ts` | Theme-aware styling |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- None (primitive composition)

**Composition pattern:**
- Vertical timeline with start dot (top) and end dot (bottom)
- Gradient line connecting dots (primary → 50% primary → 30% onSurface)
- Start dot: 12dp hollow circle with 2dp primary border
- End dot: 12dp filled circle with 50% alpha onSurface muted color
- Designed for horizontal row layout (to the left of input fields)
- Accessibility labels for screen reader support
- Custom alpha utility function for color transparency

**Layout:** Vertical flex container with top padding, 12dp dots, flexible height line

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|---|
| (none - presentational) | - | - | - |

**Side effects:**
- (none - purely presentational)

**Callback signatures:**
- (none - no callbacks)

---

## STYLE PROPERTIES MATRIX

### Layout — Timeline Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | StyleSheet | `'column'` | `Column(...)` | `VStack` | n/a |
| paddingTop | semantic | `semantic.space.lg` (= 16) | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | `space.lg` |
| alignItems | StyleSheet | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` | `.frame(alignment: .center)` | n/a |
| gap | constant | `4` | `Arrangement.spacedBy(4.dp)` / vertical spacing | `spacing(4)` | `space.xs` |

### Visual — Start Dot (top)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | semantic | `semantic.space.md` (= 12) | `Modifier.size(12.dp)` | `.frame(width: 12, height: 12)` | `space.md` |
| height | semantic | `semantic.space.md` (= 12) | Included above | Included above | `space.md` |
| borderRadius | semantic | `semantic.radius.full` (= 9999) | `CircleShape` / `RoundedCornerShape(50.percent)` | `Circle()` | `radius.full` |
| backgroundColor | constant | `'transparent'` | `Color.Transparent` | `Color.clear` | n/a |
| borderWidth | constant | `2` | `Modifier.border(BorderStroke(2.dp, ...))` | `.overlay(Circle().stroke(..., lineWidth: 2))` | `borderWidth.thick` |
| borderColor | semantic | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Visual — End Dot (bottom)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | semantic | `semantic.space.md` (= 12) | `Modifier.size(12.dp)` | `.frame(width: 12, height: 12)` | `space.md` |
| height | semantic | `semantic.space.md` (= 12) | Included above | Included above | `space.md` |
| borderRadius | semantic | `semantic.radius.full` (= 9999) | `CircleShape` / `RoundedCornerShape(50.percent)` | `Circle()` | `radius.full` |
| backgroundColor | computed | `onSurface.muted with 50% alpha` | `LaneShadowTheme.colors.onSurfaceMuted.copy(alpha = 0.5f)` | `theme.colors.onSurfaceMuted.opacity(0.5)` | `color.onSurface.muted` + `opacity.container` |

### Visual — Gradient Line

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | constant | `2` | `Modifier.width(2.dp)` | `.frame(width: 2)` | ESCALATE — propose `strokeWidth.timeline = 2` |
| flex | StyleSheet | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| gradient colors | computed | `[primary, primary@50%, onSurface.muted@30%]` | `Brush.verticalGradient(...)` | `LinearGradient(...)` | Dynamic from theme |
| gradient start | constant | `{x: 0.5, y: 0}` | `Offset(0.5f, 0f)` | `UnitPoint(x: 0.5, y: 0)` | n/a |
| gradient end | constant | `{x: 0.5, y: 1}` | `Offset(0.5f, 1f)` | `UnitPoint(x: 0.5, y: 1)` | n/a |

---

## NOTES

- **Alpha utility:** Custom `withAlpha()` function supports hex, rgb(), rgba() color formats
- **Gradient transition:** Primary color fades to 50% primary, then to 30% onSurface muted
- **Start dot:** Hollow circle indicates start point (origin)
- **End dot:** Filled circle indicates destination
- **Dot size:** 12dp (semantic.space.md) for both dots
- **Line width:** 2dp for subtle visual connection
- **Horizontal layout:** Designed for use in horizontal row (timeline to left of inputs)
- **Accessibility:** Includes testID and accessibilityLabel for screen readers
- **Flex line:** Vertical line uses flex: 1 to fill available space between dots
- **4dp gap:** Small gap between dots and line for visual separation
- **No state:** Purely presentational component with no interactivity
