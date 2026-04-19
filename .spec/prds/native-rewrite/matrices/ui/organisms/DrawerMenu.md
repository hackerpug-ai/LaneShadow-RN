# DrawerMenu - STYLE PROPERTIES MATRIX

**Component:** DrawerMenu
**RN Source:** `react-native/components/ui/drawer-menu.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/Animated/Animated.js`, `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`, `node_modules/react-native-paper/src/components/Typography/Text.tsx`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/drawer-menu.tsx` | Public API, slide-out drawer, menu items |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Menu item icons (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography |
| Animated (RN) | `node_modules/react-native/Libraries/Components/Animated/Animated.js` | Slide-in animation |
| Pressable (RN) | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Press feedback |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `IconSymbol` - Menu item icons (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:**
- Fixed-width drawer (280px) with slide-in animation from left (-280px to 0)
- Backdrop overlay with scrim color
- Optional header with title and bottom border
- Scrollable content area with sections
- Each section has optional title and list of menu items
- Optional footer with additional menu items
- Active state shows primary color with 10% alpha background
- Pressed state shows surface.pressed background
- Disabled state shows 50% opacity

**Layout:** Absolute positioned drawer on left edge, backdrop fills entire screen

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|
| translateX | Animated.Value | useState(new Animated.Value(-DRAWER_WIDTH)) | `Animatable(0f).animateTo(..., animationSpec = tween())` / `withAnimation(.easeInOut(duration: 0.3)) { offset = ... }` |

**Side effects:**
- Animate open/close on `isOpen` change: `useEffect([isOpen, translateX])` → `LaunchedEffect(isOpen) { animateFloatAsState(...) }` / `.onChange(of: isOpen) { withAnimation { ... } }`

**Callback signatures:**
- `onClose: () => void` → `() -> Unit` / `() -> Void`
- `items[].onPress: () => void` → `() -> Unit` / `() -> Void`
- `items[].onLongPress?: () => void` → `() -> Unit` / `() -> Void`

**Animation specs:**
- Duration: 300ms
- Easing: timing (default)
- Use native driver: true

---

## STYLE PROPERTIES MATRIX

### Layout — Drawer Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `DRAWER_WIDTH = 280` | `Modifier.width(280.dp)` | `.frame(width: 280)` | ESCALATE — propose `layout.drawerWidth = 280` |
| height | RN-wrapper | `'100%'` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(unbounded = true).absoluteOffset(...)` | `.frame(maxWidth: .infinity, maxHeight: .infinity).overlay(...)` | n/a |
| top | RN-wrapper | `0` | `Modifier.absoluteOffset(y = 0.dp)` / `Modifier.padding(top = 0.dp)` | alignment `.top` | n/a |
| left | RN-wrapper | `0` | `Modifier.absoluteOffset(x = -280.dp)` (initial) → `0.dp` (open) | `.offset(x: isOpen ? 0 : -280)` | n/a |
| bottom | RN-wrapper | `0` | Implicit from height: 100% | `.frame(maxHeight: .infinity)` | n/a |
| zIndex | RN-wrapper | `20` | `Modifier.zIndex(20)` (Compose 1.6+) or `Box` with elevation | `.zIndex(20)` | ESCALATE — propose `elevation.drawer = 20` |
| backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| paddingTop | RN-wrapper | `insets.top` (safe area) | `Modifier.padding(top = WindowInsets.safeDrawing.asPaddingValues().calculateTopPadding())` | `.padding(.top, safeAreaInsets.top)` | n/a (safe area) |
| paddingBottom | RN-wrapper | `insets.bottom` (safe area) | `Modifier.padding(bottom = WindowInsets.safeDrawing.asPaddingValues().calculateBottomPadding())` | `.padding(.bottom, safeAreaInsets.bottom)` | n/a (safe area) |

### Layout — Backdrop

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(unbounded = true)` | `.frame(maxWidth: .infinity, maxHeight: .infinity).overlay(...)` | n/a |
| top/left/right/bottom | RN-wrapper | `0` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| zIndex | RN-wrapper | `10` | `Modifier.zIndex(10)` (Compose 1.6+) or `Box` with elevation | `.zIndex(10)` | ESCALATE — propose `elevation.backdrop = 10` |
| backgroundColor | RN-wrapper | `semantic.color.scrim.default` | `LaneShadowTheme.colors.scrim` | `theme.colors.scrim` | `color.scrim.default` |

### Layout — Header

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` (implicit) - actually vertical in source | `Column(...)` | `VStack` | n/a |
| paddingVertical | RN-wrapper | `semantic.space.xs` (= 4) | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| paddingHorizontal | RN-wrapper | `semantic.space.md` (= 12) | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| borderBottomWidth | RN-wrapper | `1` | `Modifier.border(BorderStroke(1.dp, ...))` / `Divider()` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| borderBottomColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Typography — Header Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.heading.md.fontSize` | `LaneShadowTheme.typography.headlineMedium.fontSize` | `theme.typography.headlineMedium.fontSize` | `type.heading.md.fontSize` |
| fontWeight | RN-wrapper | `semantic.type.heading.md.fontWeight` | `LaneShadowTheme.typography.headlineMedium.fontWeight` | `theme.typography.headlineMedium.weight` | `type.heading.md.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Section

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| padding | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |

### Typography — Section Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.label.sm.fontSize` | `LaneShadowTheme.typography.labelSmall.fontSize` | `theme.typography.labelSmall.fontSize` | `type.label.sm.fontSize` |
| fontWeight | RN-wrapper | `semantic.type.label.sm.fontWeight` | `LaneShadowTheme.typography.labelSmall.fontWeight` | `theme.typography.labelSmall.weight` | `type.label.sm.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| marginBottom | RN-wrapper | `semantic.space.sm` (= 8) | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |

### Layout — Menu Item

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `12` | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | ESCALATE — propose `space.itemGap = 12` |
| padding | RN-wrapper | `semantic.space.md` (= 12) | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| borderRadius | RN-wrapper | `semantic.radius.lg` (= 12) | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` |
| marginBottom | RN-wrapper | `semantic.space.xs` (= 4) | `Modifier.padding(bottom = 4.dp)` | `.padding(.bottom, 4)` | `space.xs` |

### Visual — Menu Item (by state)

| State | Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| active | backgroundColor | RN-wrapper | `${semantic.color.primary.default}1A` (10% alpha) | `LaneShadowTheme.colors.primary.copy(alpha = 0.1f)` | `theme.colors.primary.opacity(0.1)` | `color.primary.default + opacity 0.1` |
| pressed | backgroundColor | RN-wrapper | `semantic.color.surface.pressed` | `LaneShadowTheme.colors.surfacePressed` | `theme.colors.surfacePressed` | `color.surface.pressed` |
| default | backgroundColor | RN-wrapper | `'transparent'` | `Color.Transparent` | `Color.clear` | n/a |
| disabled | opacity | RN-wrapper | `0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | `opacity.disabled = 0.5` |

### Icon — Menu Item Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `icon.md = 24` |
| color (active) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| color (disabled) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| color (default) | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Menu Item Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.md.fontSize` | `LaneShadowTheme.typography.bodyMedium.fontSize` | `theme.typography.bodyMedium.fontSize` | `type.body.md.fontSize` |
| fontWeight (active) | RN-wrapper | `'500'` (medium) | `FontWeight.Medium` | `.medium` | `type.body.md.fontWeight` (verify equals 500) |
| fontWeight (default) | RN-wrapper | `'400'` (regular) | `FontWeight.Normal` | `.regular` | `type.body.regular.fontWeight` |
| color (active) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| color (disabled) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| color (default) | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Footer

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| paddingVertical | RN-wrapper | `semantic.space.sm` (= 8) | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| paddingHorizontal | RN-wrapper | `semantic.space.md` (= 12) | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| borderTopWidth | RN-wrapper | `1` | `Modifier.border(BorderStroke(1.dp, ...))` / `Divider()` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| borderTopColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Layout — Footer Item

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.lg` (= 16) | `Arrangement.spacedBy(16.dp)` / `Modifier.padding(end = 16.dp)` between items | `spacing(16)` | `space.lg` |
| paddingVertical | RN-wrapper | `semantic.space.xs` (= 4) | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| paddingHorizontal | RN-wrapper | `semantic.space.md` (= 12) | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| borderRadius | RN-wrapper | `semantic.radius.lg` (= 12) | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` |
| marginBottom | RN-wrapper | `semantic.space.sm` (= 8) (except last) | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |
| backgroundColor (pressed) | RN-wrapper | `semantic.color.surface.pressed` | `LaneShadowTheme.colors.surfacePressed` | `theme.colors.surfacePressed` | `color.surface.pressed` |

### Icon — Footer Item Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `icon.md = 24` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Footer Item Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.md.fontSize` | `LaneShadowTheme.typography.bodyMedium.fontSize` | `theme.typography.bodyMedium.fontSize` | `type.body.md.fontSize` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

---

## NOTES

- **Animation:** Slide-in from left using `Animated.timing` with 300ms duration
- **Safe areas:** Respects `useSafeAreaInsets()` for top/bottom padding
- **Backdrop:** Full-screen scrim with `color.scrim.default` at z-index 10
- **Drawer z-index:** 20 (above backdrop)
- **Active state:** Primary color with 10% alpha background
- **Pressed state:** `surface.pressed` background
- **Disabled state:** 50% opacity on entire item
- **Icon size:** 24px for both header and footer items
- **Item gap:** 12px between icon and text
- **Section title:** Uses `label.sm` typography with `onSurface.muted` color
- **Footer border:** Top border using `border.default` color
- **Long press:** 500ms delay (`delayLongPress={500}`)
- **Scrollable content:** Middle section uses `ScrollView` for overflow
