# SessionSidebar - STYLE PROPERTIES MATRIX

**Component:** SessionSidebar
**RN Source:** `react-native/components/ui/session-sidebar.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native/Libraries/Components/Text/Text.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/session-sidebar.tsx` | Public API, session list, grouping |
| SessionCard | `react-native/components/ui/session-card.tsx` | Session cards (see `matrices/ui/molecules/SessionCard.md`) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Icons (see `matrices/ui/atoms/IconSymbol.md`) |
| ScrollView (RN) | `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` | Scroll container |
| Pressable (RN) | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Press feedback |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `SessionCard` - Individual session cards (see `matrices/ui/molecules/SessionCard.md`)
- `IconSymbol` - New session button icon, empty state icon

**Composition pattern:**
- Full-height sidebar with 80% screen width
- Header with "Sessions" title and "New" button
- Scrollable list grouped by time (Today, Yesterday, Older)
- Each group has title and list of session cards
- Empty state shows when no sessions
- Backdrop overlay with press-to-dismiss
- Group titles use uppercase with letter spacing
- New session button has copper accent and press feedback

**Layout:** Horizontal row with sidebar (left) and backdrop (right filling remaining space)

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|
| visible | boolean (prop) | props.visible | Derived from parent state / @Binding var isVisible: Bool |
| groupedSessions | object (computed) | Computed from sessions prop | `sessions.groupBy { ... }` / Dictionary grouping |
| activeSessionId | string | undefined (prop) | props.activeSessionId / @Binding var activeSessionId: String? |

**Computed groupings:**
- `today`: Sessions where `date.toDateString() === new Date().toDateString()`
- `yesterday`: Sessions where `date.toDateString() === new Date(Date.now() - 86400000).toDateString()`
- `older`: All other sessions

**Callback signatures:**
- `onClose: () => void` → `() -> Unit` / `() -> Void`
- `onSessionPress: (sessionId: string) => void` → `(sessionId: String) -> Unit` / `(String) -> Void`
- `onNewSession: () => void` → `() -> Unit` / `() -> Void`

---

## STYLE PROPERTIES MATRIX

### Layout — Sidebar Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `SCREEN_WIDTH * 0.8` | `Modifier.fillMaxWidth(fraction = 0.8f)` | `.frame(width: screenWidth * 0.8)` | ESCALATE — propose `layout.sidebarWidth = 0.8` |
| height | RN-wrapper | `'100%'` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |
| backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Layout — Overlay (entire row)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` via StyleSheet.absoluteFillObject | `Modifier.wrapContentSize(unbounded = true)` | `.frame(maxWidth: .infinity, maxHeight: .infinity).overlay(...)` | n/a |
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| zIndex | RN-wrapper | `1000` | `Modifier.zIndex(1000)` (Compose 1.6+) or `Box` with elevation | `.zIndex(1000)` | ESCALATE — propose `elevation.modal = 1000` |

### Layout — Header

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| paddingHorizontal | RN-wrapper | `20` | `Modifier.padding(horizontal = 20.dp)` | `.padding(.horizontal, 20)` | ESCALATE — propose `space.header = 20` |
| paddingVertical | RN-wrapper | `20` | `Modifier.padding(vertical = 20.dp)` | `.padding(.vertical, 20)` | ESCALATE — propose `space.header = 20` |
| borderBottomWidth | RN-wrapper | `1` | `Modifier.border(BorderStroke(1.dp, ...))` / `Divider()` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| borderBottomColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Typography — Header Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `28` | `28.sp` | `.font(.system(size: 28))` | ESCALATE — propose `type.display.xs.fontSize = 28` |
| fontWeight | RN-wrapper | `'800'` (extra bold) | `FontWeight.ExtraBold` | `.weight(.heavy)` | ESCALATE — propose `type.display.xs.fontWeight = 800` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — New Session Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `6` | `Arrangement.spacedBy(6.dp)` / `Modifier.padding(end = 6.dp)` between items | `spacing(6)` | ESCALATE — propose `space.tight = 6` |
| paddingHorizontal | RN-wrapper | `12` | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| paddingVertical | RN-wrapper | `8` | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| borderRadius | RN-wrapper | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` |
| backgroundColor (pressed) | RN-wrapper | `${semantic.color.primary.pressed}20` (12.5% alpha) | `LaneShadowTheme.colors.primaryPressed.copy(alpha = 0.125f)` | `theme.colors.primaryPressed.opacity(0.125)` | `color.primary.pressed + opacity 0.125` |

### Typography — New Session Button Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `16` | `16.sp` | `.font(.system(size: 16))` | ESCALATE — propose `type.body.md.fontSize = 16` |
| fontWeight | RN-wrapper | `'700'` (bold) | `FontWeight.Bold` | `.weight(.bold)` | ESCALATE — propose `type.body.md.fontWeight = 700` |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Icon — New Session Button Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `26` | `Modifier.size(26.dp)` | `.frame(width: 26, height: 26)` | ESCALATE — propose `icon.lg = 26` |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Layout — Sessions List

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxHeight()` / `Modifier.weight(1f)` | `.frame(maxHeight: .infinity)` | n/a |
| content padding | RN-wrapper | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |

### Layout — Group

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| marginBottom | RN-wrapper | `24` | `Modifier.padding(bottom = 24.dp)` | `.padding(.bottom, 24)` | `space.xl` |

### Typography — Group Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `13` | `13.sp` | `.font(.system(size: 13))` | ESCALATE — propose `type.label.xs.fontSize = 13` |
| fontWeight | RN-wrapper | `'700'` (bold) | `FontWeight.Bold` | `.weight(.bold)` | ESCALATE — propose `type.label.xs.fontWeight = 700` |
| textTransform | RN-wrapper | `'uppercase'` | `composableStyle { textAlign = ... }` | `.textCase(.uppercase)` | n/a |
| letterSpacing | RN-wrapper | `0.8` | `style { letterSpacing = 0.8.sp }` | `.tracking(0.8)` | ESCALATE — propose `type.label.xs.letterSpacing = 0.8` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| marginBottom | RN-wrapper | `12` | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |

### Layout — Group Sessions

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| gap | RN-wrapper | `12` | `VerticalArrangement.spacedBy(12.dp)` / `Modifier.padding(bottom = 12.dp)` between items | `spacing(12)` | `space.md` |

### Layout — Empty State

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| paddingVertical | RN-wrapper | `60` | `Modifier.padding(vertical = 60.dp)` | `.padding(.vertical, 60)` | ESCALATE — propose `space.4xl = 60` |
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` + vertical | `.frame(maxWidth: .infinity).overlay(..., alignment: .center)` | n/a |
| gap | RN-wrapper | `12` | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |

### Icon — Empty State Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `48` | `Modifier.size(48.dp)` | `.frame(width: 48, height: 48)` | ESCALATE — propose `icon.xl = 48` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Typography — Empty State Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `15` | `15.sp` | `.font(.system(size: 15))` | ESCALATE — verify `type.body.sm.fontSize = 15` |
| fontWeight | RN-wrapper | `'500'` (medium) | `FontWeight.Medium` | `.weight(.medium)` | ESCALATE — verify `type.body.sm.fontWeight = 500` |
| textAlign | RN-wrapper | `'center'` | `TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Layout — Backdrop

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| backgroundColor (default) | RN-wrapper | `rgba(0, 0, 0, 0.5)` | `Color.Black.copy(alpha = 0.5f)` | `Color.black.opacity(0.5)` | ESCALATE — propose `color.scrim.default = rgba(0,0,0,0.5)` |
| backgroundColor (pressed) | RN-wrapper | `rgba(0, 0, 0, 0.6)` | `Color.Black.copy(alpha = 0.6f)` | `Color.black.opacity(0.6)` | ESCALATE — propose `color.scrim.pressed = rgba(0,0,0,0.6)` |

---

## NOTES

- **Sidebar width:** 80% of screen width
- **Header:** Extra-bold 28px title with copper "New" button
- **Grouping:** Sessions grouped by Today, Yesterday, Older using date comparison
- **Group titles:** Uppercase with 0.8 letter spacing
- **Empty state:** Large icon (48px) with centered text
- **Backdrop:** Semi-transparent black (50% default, 60% pressed)
- **z-index:** 1000 for entire overlay
- **New session button:** Press state adds 12.5% alpha primary background
- **Spacing:** 24px bottom margin on groups, 12px gap between session cards
- **Icons:** "plus-circle-outline" (26px), "message-outline" (48px for empty state)
- **Press feedback:** New session button shows pressed background color
