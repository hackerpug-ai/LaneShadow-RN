# MenuLayout - STYLE PROPERTIES MATRIX

**Component:** MenuLayout
**RN Source:** `react-native/components/layouts/menu-layout.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Animated/Animated.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/layouts/menu-layout.tsx` | Slide-out drawer menu layout |
| DrawerMenu | `react-native/components/ui/menus/drawer-menu.tsx` | Drawer menu organism (see matrices/ui/organisms/DrawerMenu.md) |
| SessionContextMenu | `react-native/components/ui/session-context-menu.tsx` | Context menu for session actions (see matrices/ui/molecules/SessionContextMenu.md) |
| Animated (RN) | `node_modules/react-native/Libraries/Animated/Animated.js` | Drawer slide animation |

---

## LAYOUT COMPOSITION

**Purpose:** Layout with slide-out drawer menu and animated content area

**Composition pattern:**
- Root container with flex: 1
- DrawerMenu organism (280px width) positioned absolutely
- Animated.View content area that slides when drawer opens/closes
- Slide direction depends on alignment prop (left/right)
- SessionContextMenu overlay for long-press actions
- Children can be function receiving `onMenuPress` callback or static ReactNode

**Layout:** Full-screen container with overlay drawer and sliding content area (300ms animation)

---

## STYLE PROPERTIES MATRIX

### Layout — Root Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |

### Layout — Content Area (Animated.View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| transform (translateX) | RN-wrapper | `menuOpen ? DRAWER_WIDTH : 0` (animated) | `Modifier.offset{x = animateOffsetAsState(...)}` | `.offset(x: drawerOffset)` | n/a (animation) |
| animation duration | RN-wrapper | `300` | `animationSpec = tween(durationMillis = 300)` | `.animation(.easeInOut(duration: 0.3))` | ESCALATE — propose `motion.drawerDuration = 300` |

### Constants

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| DRAWER_WIDTH | RN-wrapper | `280` | `280.dp` | `280` | ESCALATE — propose `layout.drawerWidth = 280` |

---

## NOTES

- **Drawer width:** Fixed at 280px
- **Animation:** 300ms slide animation using Animated.timing
- **Alignment:** Supports left or right drawer alignment
- **Content slide:** Content area slides opposite to drawer direction
- **Context menu:** SessionContextMenu appears at fixed position on long-press
- **Menu sections:** Supports external sections or defaults to internal navigation
- **Session integration:** Fetches sessions from Convex, handles deletion
- **Children as function:** Can pass function receiving `onMenuPress` callback
- **TestID propagation:** Passes testID to DrawerMenu
- **State management:** Internal state for context menu visibility and position
