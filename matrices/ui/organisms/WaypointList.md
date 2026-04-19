# WaypointList - STYLE PROPERTIES MATRIX

**Component:** WaypointList
**RN Source:** `react-native/components/waypoints/waypoint-list.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native-paper/src/components/Typography/Text.tsx`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/waypoints/waypoint-list.tsx` | Public API, glassmorphic container, collapsible list |
| WaypointCard | `react-native/components/waypoints/waypoint-card.tsx` | Individual waypoint cards (see `matrices/ui/molecules/WaypointCard.md`) |
| DragHandle | `react-native/components/ui/drag-handle.tsx` | Drag affordance (see `matrices/ui/atoms/DragHandle.md`) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Expand/collapse icon (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `WaypointCard` - Individual waypoint cards (see `matrices/ui/molecules/WaypointCard.md`)
- `DragHandle` - Drag affordance handle (see `matrices/ui/atoms/DragHandle.md`)
- `IconSymbol` - Expand/collapse chevron icon

**Composition pattern:**
- Glassmorphic container with 85% opacity surface background
- Collapsible header with title, count, pending indicator, and chevron
- Drag handle shown when expanded
- Waypoint cards list (hidden when collapsed)
- Loading state shows "Loading waypoints..."
- Empty state shows "No waypoints for this route"
- Pending approval indicator (8px dot) when any waypoint is ready/pending

**Layout:** Full-width container with 16px border radius and 1px border (30% opacity)

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|
| isCollapsed | boolean | useState(initiallyCollapsed) | `rememberSaveable { mutableStateOf(initiallyCollapsed) }` / `@State var isCollapsed: Bool` |
| waypoints | Waypoint[] (from Convex) | useQuery | `LaunchedEffect(routePlanId) { ... }` / `.task { await ... }` |
| sortedWaypoints | Waypoint[] (computed) | useMemo | `waypoints.sortedBy { it.order ?: it.createdAt }` / `waypoints.sorted { ... }` |

**Side effects:**
- Fetch waypoints on mount: `useQuery(api.db.waypoints.listWaypointsByRoutePlan, {routePlanId})` → `LaunchedEffect(routePlanId) { waypoints = fetch(...) }` / `.task { waypoints = try await fetch(...) }`

**Callback signatures:**
- `onApprove?: (waypointId: Id<'waypoints'>) => void` → `(waypointId: String) -> Unit` / `(String) -> Void`
- `onReject?: (waypointId: Id<'waypoints'>) => void` → `(waypointId: String) -> Unit` / `(String) -> Void`
- `onReorder?: (waypointId: Id<'waypoints'>, newOrder: number) => void` → `(waypointId: String, newOrder: Int) -> Unit` / `(String, Int) -> Void`

**Computed values:**
- `hasPendingApprovals`: `sortedWaypoints.some(wp => wp.status === 'ready' || wp.status === 'pending')`

---

## STYLE PROPERTIES MATRIX

### Visual — Glassmorphic Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| borderRadius | RN-wrapper | `16` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| backgroundColor | RN-wrapper | `surface.default with 85% opacity` | `LaneShadowTheme.colors.surface.copy(alpha = 0.85f)` | `theme.colors.surface.opacity(0.85)` | `color.surface.default + opacity 0.85` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(BorderStroke(1.dp, ...))` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| borderColor | RN-wrapper | `border.default with 30% opacity` | `LaneShadowTheme.colors.border.copy(alpha = 0.3f)` | `theme.colors.border.opacity(0.3)` | `color.border.default + opacity 0.3` |

### Layout — Header

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| padding | RN-wrapper | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| borderRadius | RN-wrapper | `16` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| backgroundColor (pressed) | RN-wrapper | `primary.default with 10% opacity` | `LaneShadowTheme.colors.primary.copy(alpha = 0.1f)` | `theme.colors.primary.opacity(0.1)` | `color.primary.default + opacity 0.1` |

### Layout — Header Left

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` / `Modifier.padding(end = 8.dp)` between items | `spacing(8)` | `space.sm` |

### Typography — Header Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `18` | `18.sp` | `.font(.system(size: 18))` | ESCALATE — propose `type.title.md.fontSize = 18` |
| fontWeight | RN-wrapper | `'600'` (semibold) | `FontWeight.SemiBold` | `.semibold` | `type.title.md.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Header Count

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `14` | `14.sp` | `.font(.system(size: 14))` | ESCALATE — verify `type.body.sm.fontSize = 14` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Visual — Pending Indicator

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `8` | `Modifier.size(8.dp)` | `.frame(width: 8, height: 8)` | ESCALATE — propose `size.indicator = 8` |
| height | RN-wrapper | `8` | Included above | Included above | ESCALATE — propose `size.indicator = 8` |
| borderRadius | RN-wrapper | `4` | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |
| backgroundColor | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |

### Icon — Expand/Collapse Chevron

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `icon.md = 24` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| name (collapsed) | RN-wrapper | `'chevron-down'` | `Icons.Rounded.KeyboardArrowDown` | `chevron.down` | n/a |
| name (expanded) | RN-wrapper | `'chevron-up'` | `Icons.Rounded.KeyboardArrowUp` | `chevron.up` | n/a |

### Layout — Drag Handle Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity).overlay(..., alignment: .center)` | n/a |
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | ESCALATE — propose `space.micro = 4` |

### Layout — Waypoint Cards Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingBottom | RN-wrapper | `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |

### Typography — Loading Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `14` | `14.sp` | `.font(.system(size: 14))` | ESCALATE — verify `type.body.sm.fontSize = 14` |
| textAlign | RN-wrapper | `'center'` | `TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Typography — Empty Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `14` | `14.sp` | `.font(.system(size: 14))` | ESCALATE — verify `type.body.sm.fontSize = 14` |
| fontStyle | RN-wrapper | `'italic'` | `FontStyle.Italic` | `.italic()` | n/a |
| textAlign | RN-wrapper | `'center'` | `TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

---

## NOTES

- **Glassmorphic effect:** 85% opacity surface background, 30% opacity border
- **Collapsible:** Pressable header toggles card visibility
- **Pending indicator:** 8px warning dot when any waypoint has status 'ready' or 'pending'
- **Drag handle:** 40px × 5px rounded bar shown below header when expanded
- **Loading state:** Shows centered "Loading waypoints..." text
- **Empty state:** Shows centered italic "No waypoints for this route" text
- **Waypoint cards:** Rendered from `sortedWaypoints` array
- **Sorting logic:** Sorts by `order` field if available, falls back to `createdAt`
- **Accessibility:** Header is pressable with expand/collapse accessibility labels
- **Press feedback:** Header shows 10% primary background on press
