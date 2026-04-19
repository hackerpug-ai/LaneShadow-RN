# MinimalOverlayWidget - STYLE PROPERTIES MATRIX

**Component:** MinimalOverlayWidget
**RN Source:** `react-native/components/map/minimal-overlay-widget.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-reanimated/`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/map/minimal-overlay-widget.tsx` | Public API, radial menu layout, Reanimated animations |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Overlay icons (wind, rain, temperature, layers) (see `matrices/ui/atoms/IconSymbol.md`) |
| Pressable | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Icon button press feedback |
| Reanimated | `node_modules/react-native-reanimated/` | Spring animations for expand/collapse and radial icon movement |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Center toggle icon and radial overlay icons (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Center toggle button (40×40px) with three radial icons positioned at -30°, 0°, and +30° angles. When collapsed, radial icons are hidden (scale: 0, opacity: 0). When expanded, radial icons animate outward along 36px radius. Active overlay shows copper glow with active ring indicator.

**Layout:** 120×120px container with relative positioning. Center button positioned absolutely. Radial icons positioned absolutely using trigonometry (x = sin(angle) × radius, y = -cos(angle) × radius).

**Animation:** Reanimated spring physics for rotation and radial icon expansion. Center button rotates 180° on toggle. Radial icons use timing animation for position and opacity.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `120` | `Modifier.width(120.dp)` | `.frame(width: 120)` | ESCALATE — propose `size.radialMenuContainer = 120` |
| height | RN-wrapper | `120` | `Modifier.height(120.dp)` | `.frame(height: 120)` | ESCALATE — propose `size.radialMenuContainer = 120` |
| alignItems | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| position | RN-wrapper | `'relative'` | `Box(modifier = Modifier)` (default is relative) | default | n/a |

### Layout — Center Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `40` | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | ESCALATE — propose `size.radialMenuButton = 40` |
| height | RN-wrapper | `40` | n/a | n/a | n/a |
| borderRadius | RN-wrapper | `20` (50%) | `CircleShape` or `Modifier.clip(CircleShape)` | `ClipShape(Circle())` or `.clipShape(Circle())` | `radius.full` |
| borderWidth | RN-wrapper | `1.5` | `Modifier.border(1.5.dp, ...)` | `.overlay(RoundedRectangle(cornerRadius: 20).strokeBorder(..., lineWidth: 1.5))` | `borderWidth.medium` |
| alignItems | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| zIndex | RN-wrapper | `10` | `Modifier.zIndex(10f)` | `.zIndex(10)` | n/a |

### Layout — Active Ring

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Box(modifier = Modifier.offset(...))` | `.position(...)` | n/a |
| width | RN-wrapper | `48` | `Modifier.size(48.dp)` | `.frame(width: 48, height: 48)` | ESCALATE — propose `size.radialMenuActiveRing = 48` |
| height | RN-wrapper | `48` | n/a | n/a | n/a |
| borderRadius | RN-wrapper | `24` (50%) | `CircleShape` | `Circle()` | `radius.full` |
| borderWidth | RN-wrapper | `2` | `Modifier.border(2.dp, ...)` | `.overlay(Circle().strokeBorder(..., lineWidth: 2))` | `borderWidth.thick` |
| borderStyle | RN-wrapper | `'solid'` | `BorderStroke` | `.strokeBorder(...)` (solid by default) | n/a |

### Layout — Radial Icon Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Box(modifier = Modifier.offset { x, y })` | `.position(x: x, y: y)` | n/a |
| width | RN-wrapper | `36` | `Modifier.size(36.dp)` | `.frame(width: 36, height: 36)` | ESCALATE — propose `size.radialMenuIconButton = 36` |
| height | RN-wrapper | `36` | n/a | n/a | n/a |
| alignItems | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |

### Layout — Radial Icon Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `36` | `Modifier.size(36.dp)` | `.frame(width: 36, height: 36)` | `size.radialMenuIconButton` |
| height | RN-wrapper | `36` | n/a | n/a | n/a |
| borderRadius | RN-wrapper | `18` (50%) | `CircleShape` | `Circle()` | `radius.full` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(Circle().strokeBorder(..., lineWidth: 1))` | `borderWidth.thin` |
| alignItems | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |

### Visual — Center Button Colors

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor (normal) | RN-wrapper | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `Color(.systemGray6)` | `color.surfaceVariant.default` |
| backgroundColor (pressed) | RN-wrapper | `semantic.color.surfaceVariant.pressed` | `MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.8f)` | `Color(.systemGray6).opacity(0.8)` | `color.surfaceVariant.pressed` |
| borderColor (active) | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |
| borderColor (inactive) | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `Color(.separator)` | `color.border.default` |

### Visual — Radial Icon Button Colors

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor (active) | RN-wrapper | `${semantic.color.primary.default}33` (20% opacity) | `MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)` | `Color(.orange).opacity(0.2)` | `color.primary.default` + `opacity.subtle` |
| backgroundColor (normal) | RN-wrapper | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `Color(.systemGray6)` | `color.surfaceVariant.default` |
| backgroundColor (pressed) | RN-wrapper | `semantic.color.surfaceVariant.pressed` | `MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.8f)` | `Color(.systemGray6).opacity(0.8)` | `color.surfaceVariant.pressed` |
| borderColor (active) | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |
| borderColor (inactive) | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `Color(.separator)` | `color.border.default` |
| opacity (available) | RN-wrapper | `1` | `Modifier.alpha(1f)` | `.opacity(1)` | n/a |
| opacity (unavailable) | RN-wrapper | `0.4` | `Modifier.alpha(0.4f)` | `.opacity(0.4)` | ESCALATE — propose `opacity.disabled = 0.4` |

### Visual — Icon Colors

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| color (center, active) | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |
| color (center, inactive) | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| color (radial, active) | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |
| color (radial, inactive) | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.secondaryLabel)` | `color.onSurface.muted` |

### Animation — Spring Physics

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| damping | RN-wrapper | `15` | `spring(dampingRatio = Spring.DampingRatioMediumBouncy)` | `.spring(response: 0.3, dampingFraction: 0.6)` | ESCALATE — propose `animation.springDamping = 15` |
| stiffness | RN-wrapper | `150` | `spring(stiffness = Spring.StiffnessMedium)` | `.spring(response: 0.3)` | ESCALATE — propose `animation.springStiffness = 150` |

### Animation — Radial Expansion

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| radius | RN-wrapper | `36` | Calculated offset in dp | Calculated offset in points | ESCALATE — propose `size.radialMenuRadius = 36` |
| duration | RN-wrapper | `200` | `animateXAsState(..., animationSpec = tween(200))` | `.animation(.easeInOut(duration: 0.2))` | ESCALATE — propose `animation.radialMenuDuration = 200` |
| opacity duration | RN-wrapper | `150` | `animateFloatAsState(..., animationSpec = tween(150))` | `.animation(.easeInOut(duration: 0.15))` | ESCALATE — propose `animation.fadeDuration = 150` |

### Icon — Size

| Location | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| center button | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | `iconSize.md` |
| radial buttons | RN-wrapper | `18` | `Modifier.size(18.dp)` | `.frame(width: 18, height: 18)` | `iconSize.sm` |

### Interaction

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| hitSlop (center) | RN-wrapper | `12` | `Modifier.clickable({}, onClickLabel = null, role = null, key = null, onClick = null, interactionSource = null, indication = null).pointerInteropFilter(null)` | `.padding(12)` (simulated) | `space.md` |
| hitSlop (radial) | RN-wrapper | `8` | `Modifier.clickable(...).pointerInteropFilter(null)` | `.padding(8)` (simulated) | `space.sm` |
| accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |

---

## NOTES

- **Radial positioning:** Icons positioned at -30°, 0°, +30° using trigonometry: x = sin(angle) × 36, y = -cos(angle) × 36
- **Center button rotation:** Rotates 180° when expanded (animated with spring physics)
- **Active indicator:** When overlay is selected, center button gets 48×48px ring with 2px copper border
- **Unavailable overlays:** Radial icons shown at 40% opacity when data unavailable, but still visible
- **Collapse on selection:** Selecting an overlay automatically collapses the menu
- **Toggle behavior:** Clicking center button toggles expand/collapse. Clicking same overlay again deselects and collapses
- **Animation timing:** Radial icons use 200ms for position (scale/translate), 150ms for opacity
- **Spring physics:** Center button rotation uses spring (damping: 15, stiffness: 150) for bouncy feel
- **Icon mapping:** Active overlay shows its icon in center. Collapsed state shows 'layers' stack icon when nothing selected
