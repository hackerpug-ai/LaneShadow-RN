# RouteTimeline - STYLE PROPERTIES MATRIX

**Component:** RouteTimeline
**RN Source:** `react-native/components/sheets/route-timeline.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `expo-linear-gradient`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/route-timeline.tsx` | Public API, timeline visualization |
| LinearGradient | `expo-linear-gradient` | Gradient line connecting dots |
| View (RN) | `node_modules/react-native/Libraries/Components/View/View.js` | Container, dots, line |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- None (pure visualization component)

**Composition pattern:**
- 24px wide vertical column
- Start dot (top): 12px hollow circle with 2px primary border
- Gradient line (middle): 2px wide, flex: 1, fades from primary to muted
- End dot (bottom): 12px filled circle with 50% opacity muted color
- Gradient colors: primary → 50% primary → 30% muted

**Layout:** Fixed width column, stretches to fill parent height

---

## STATE & BEHAVIOR

No local state. Pure presentational component.

---

## STYLE PROPERTIES MATRIX

### Layout — Timeline Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `24` | `Modifier.width(24.dp)` | `.frame(width: 24)` | ESCALATE — propose `layout.timelineWidth = 24` |
| flexDirection | RN-wrapper | `'column'` | `Column(...)` | `VStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` + vertical | `.frame(maxWidth: .infinity).overlay(..., alignment: .center)` | n/a |
| flexShrink | RN-wrapper | `0` | `Modifier.requiredWidth(24.dp)` (no shrink) | `.fixedSize(horizontal: true, vertical: false)` | n/a |
| alignSelf | RN-wrapper | `'stretch'` | `Modifier.fillMaxHeight()` / `Modifier.height(IntrinsicSize.Max)` | `.frame(maxHeight: .infinity)` | n/a |
| paddingTop | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | `space.lg` |

### Visual — Timeline Dots (both start and end)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `semantic.space.md` (= 12) | `Modifier.size(12.dp)` | `.frame(width: 12, height: 12)` | `space.md` |
| height | RN-wrapper | `semantic.space.md` (= 12) | Included above | Included above | `space.md` |
| borderRadius | RN-wrapper | `semantic.radius.full` (= 9999) | `CircleShape` | `Circle()` / `Capsule()` | `radius.full` |

### Visual — Start Dot (top)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `'transparent'` | `Color.Transparent` | `Color.clear` | n/a |
| borderWidth | RN-wrapper | `2` | `Modifier.border(BorderStroke(2.dp, ...))` | `.overlay(Circle().stroke(..., lineWidth: 2))` | `borderWidth.thick` |
| borderColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Visual — End Dot (bottom)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `onSurface.muted with 50% opacity` | `LaneShadowTheme.colors.onSurfaceMuted?.copy(alpha = 0.5f)` | `theme.colors.onSurfaceMuted?.opacity(0.5)` | `color.onSurface.muted + opacity 0.5` |

### Visual — Timeline Line (gradient)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `2` | `Modifier.width(2.dp)` | `.frame(width: 2)` | ESCALATE — propose `borderWidth.timeline = 2` |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` / `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |
| marginVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | ESCALATE — propose `space.micro = 4` |
| borderRadius | RN-wrapper | `9999` | `RoundedCornerShape(50.dp)` / `CircleShape` (for ends) | `.clipShape(Capsule())` | `radius.full` |
| gradient | RN-wrapper | `[primary, 50% primary, 30% muted]` | `Brush.verticalGradient(...colors = [...])` | `LinearGradient(...)` | n/a (multi-color) |

---

## NOTES

- **Fixed width:** 24px container
- **Dot size:** 12px (space.md)
- **Start dot:** Hollow circle with 2px primary border
- **End dot:** Filled circle with 50% opacity muted color
- **Line width:** 2px
- **Gradient:** Three-stop vertical gradient (primary → 50% primary → 30% muted)
- **Stretch:** Timeline stretches to fill available height via flex: 1 on line
- **Spacing:** 4px margin above and below the line
- **Usage:** Designed to be displayed to the left of input fields in a horizontal row
- **Accessibility:** Includes accessibility labels for start/end points when selected
