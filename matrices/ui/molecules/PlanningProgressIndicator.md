# PlanningProgressIndicator - STYLE PROPERTIES MATRIX

**Component:** PlanningProgressIndicator
**RN Source:** `react-native/components/ui/planning-progress-indicator.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/planning-progress-indicator.tsx` | Public API, step layout, state visualization |
| ActivityIndicator | `node_modules/react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js` | Loading spinner for current step |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Step labels and emoji icons |

---

## COMPOSITION

**Child atoms:**
- `ActivityIndicator` - Loading spinner for current step (platform atom)

**Composition pattern:** Horizontal row of 4 steps (reading, finding, weather, building). Each step has icon container (44×44px circle) with emoji icon or ActivityIndicator, label below, and horizontal connector to next step. Completed steps use success color, current step uses primary color with spinner, pending steps use subtle colors.

**Layout:** Horizontal flex row with space-between. Steps have flex: 1 for equal width. Connectors are absolutely positioned behind steps.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'flex-start'` | `verticalAlignment = Alignment.Top` | `.alignment(.top)` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| padding | RN-wrapper | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| margin | RN-wrapper | `16` | `Modifier.padding(16.dp)` (wrap in padding Box) | `.padding(16)` | `space.lg` |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `.spacing(8)` | `space.sm` |
| borderRadius | RN-wrapper | `12` | `Modifier.clip(RoundedCornerShape(12.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 12))` | `radius.lg` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(..., lineWidth: 1))` | `borderWidth.thin` |

### Layout — Step

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | n/a | n/a |
| position | RN-wrapper | `'relative'` | `Box(modifier = Modifier)` (default is relative) | default | n/a |

### Layout — Icon Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `44` | `Modifier.size(44.dp)` | `.frame(width: 44, height: 44)` | ESCALATE — propose `size.progressIcon = 44` |
| height | RN-wrapper | `44` | n/a | n/a | n/a |
| borderRadius | RN-wrapper | `22` (50%) | `CircleShape` | `Circle()` | `radius.full` |
| alignItems | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| marginBottom | RN-wrapper | `10` | `Modifier.padding(bottom = 10.dp)` or `Spacer(modifier = Modifier.height(10.dp))` | `.padding(.bottom, 10)` | ESCALATE — propose `space.xl = 24` or use `space.md` = 12 close enough |
| position | RN-wrapper | `'relative'` | default | default | n/a |
| borderWidth | RN-wrapper | `2` | `Modifier.border(2.dp, ...)` | `.overlay(Circle().strokeBorder(..., lineWidth: 2))` | `borderWidth.thick` |

### Layout — Active Dot

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Box(modifier = Modifier.offset(...))` | `.position(...)` | n/a |
| bottom | RN-wrapper | `-3` | `Modifier.offset(y = (-3).dp)` (negative offset in Compose) | `.position(bottom: -3)` | n/a |
| width | RN-wrapper | `6` | `Modifier.size(6.dp)` | `.frame(width: 6, height: 6)` | ESCALATE — propose `size.activeDot = 6` |
| height | RN-wrapper | `6` | n/a | n/a | n/a |
| borderRadius | RN-wrapper | `3` (50%) | `CircleShape` | `Circle()` | `radius.full` |

### Layout — Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `12` | `fontSize = 12.sp` | `.font(.system(size: 12))` | ESCALATE — propose `type.label.xs.fontSize = 12` |
| textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| lineHeight | RN-wrapper | `16` | `lineHeight = 16.sp` | `.lineSpacing(16 - 12)` or `.lineLimit(1).fixedSize()` | ESCALATE — propose `type.label.xs.lineHeight = 16` |

### Layout — Connector

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Box(modifier = Modifier.offset(...))` | `.position(...)` | n/a |
| top | RN-wrapper | `22` (half of iconContainer height) | `Modifier.offset(y = 22.dp)` | `.position(top: 22)` | n/a |
| left | RN-wrapper | `'50%'` | `Modifier.offset(x = LocalDensity.current.run { ... } / 2)` (complex in Compose) | `.position(x: fractionalWidth(0.5))` | n/a |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| height | RN-wrapper | `2` | `Modifier.height(2.dp)` | `.frame(height: 2)` | `borderWidth.thin` |
| zIndex | RN-wrapper | `-1` | `Modifier.zIndex(-1f)` | `.zIndex(-1)` | n/a |

### Visual — Container Background

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.card.default` | `MaterialTheme.colorScheme.surface` | `Color(.secondarySystemGroupedBackground)` | `color.card.default` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `Color(.separator)` | `color.border.default` |
| elevation | RN-wrapper | `semantic.elevation[2]` | `Modifier.shadow(4.dp, ...)` or `Modifier.graphicsLayer { shadowElevation = 4f }` | `.shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)` | `elevation[2]` |

### Visual — Icon Container Background

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| completed | RN-wrapper | `${semantic.color.success.default}25` (15% opacity) | `MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)` | `Color(.green).opacity(0.15)` | `color.success.default` + ESCALATE — propose `opacity.subtle = 0.15` |
| current | RN-wrapper | `${semantic.color.primary.default}25` (15% opacity) | `MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)` | `Color(.orange).opacity(0.15)` | `color.primary.default` + `opacity.subtle` |
| pending | RN-wrapper | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `Color(.systemGray6)` | `color.surfaceVariant.default` |

### Visual — Icon Container Border

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| completed | RN-wrapper | `semantic.color.success.default` | `MaterialTheme.colorScheme.primary` | `Color(.green)` | `color.success.default` |
| current | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |
| pending | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `Color(.separator)` | `color.border.default` |

### Visual — Label Color

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| completed | RN-wrapper | `semantic.color.success.default` | `MaterialTheme.colorScheme.primary` | `Color(.green)` | `color.success.default` |
| current | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| pending | RN-wrapper | `semantic.color.onSurface.subtle` | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.tertiaryLabel)` | `color.onSurface.subtle` |
| opacity (pending) | RN-wrapper | `0.6` | `Modifier.alpha(0.6f)` | `.opacity(0.6)` | ESCALATE — propose `opacity.pending = 0.6` |

### Visual — Label FontWeight

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| current | RN-wrapper | `'700'` | `fontWeight = FontWeight.Bold` | `.fontWeight(.bold)` | ESCALATE — propose `type.label.xs.fontWeight.current = 700` |
| other | RN-wrapper | `'600'` | `fontWeight = FontWeight.SemiBold` | `.fontWeight(.semibold)` | ESCALATE — propose `type.label.xs.fontWeight.default = 600` |

### Visual — Active Dot

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |

### Visual — Connector

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| completed | RN-wrapper | `${semantic.color.success.default}60` (40% opacity) | `MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)` | `Color(.green).opacity(0.4)` | `color.success.default` + ESCALATE — propose `opacity.faint = 0.4` |
| pending | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `Color(.separator)` | `color.border.default` |

### Icon — Size

| Type | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| emoji | RN-wrapper | `18` (fontSize) | `fontSize = 18.sp` | `.font(.system(size: 18))` | ESCALATE — propose `type.emoji.md = 18` |
| ActivityIndicator | RN-wrapper | `'small'` | `Modifier.size(20.dp)` (small = ~20dp) | `.controlSize(.small)` or `.scaleEffect(0.8)` | Platform default |

### Icon — Color

| Type | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| ActivityIndicator | RN-wrapper | `semantic.color.primary.default` | `Color(...)` in ActivityIndicator | `.tint(.orange)` | `color.primary.default` |

---

## NOTES

- **4 steps:** Reading your ride (📖), Finding scenic roads (🛣️), Checking weather (🌤️), Building options (⚙️)
- **Early exit:** Returns null when currentStep is 'complete' or visible is false
- **Completed steps:** Success color (green) for background, border, label, connector
- **Current step:** Primary color (copper) with ActivityIndicator spinner, active dot below
- **Pending steps:** Subtle colors (surfaceVariant background, border, subtle label)
- **Connectors:** Horizontal line between steps, positioned at iconContainer center (top: 22)
- **Active dot:** 6×6px circle at bottom of current step icon container
- **Label opacity:** Pending steps at 60% opacity
- **Font weight:** Current step uses bold (700), others use semibold (600)
- **Emoji icons:** Rendered as Text with fontSize 18
- **Equal width:** Steps use flex: 1 for equal distribution
- **Card styling:** Container has card background, border, elevation 2, rounded corners
