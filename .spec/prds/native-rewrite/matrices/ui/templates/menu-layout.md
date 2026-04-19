# MenuLayout — STYLE PROPERTIES MATRIX

**Component:** MenuLayout
**Level:** Template
**Source:** `react-native/components/layouts/menu-layout.tsx`
**Platform Mapping:** Android `Box` with drawer gesture, iOS `VStack` with swipe gesture

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/layouts/menu-layout.tsx` | `react-native/Libraries/Components/View/View.js`, gesture handler | Android: `app/src/main/java/com/laneshadow/ui/templates/MenuLayout.kt`<br>iOS: `app/ui/templates/MenuLayout.swift` | 1 fixed layout with drawer state |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### Layout — Drawer Container

**Source files read:**
- LaneShadow: `react-native/components/layouts/menu-layout.tsx`
- Framework: `react-native/Libraries/Components/View/View.js`, `react-native-gesture-handler`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | drawerWidth | RN-wrapper | hardcoded `280` | `Modifier.width(280.dp)` | `.frame(width: 280)` | semantic.size.menuDrawerWidth |
| Layout | drawerMaxWidth | RN-wrapper | `80%` | `Modifier.requiredWidth(Insets.maxWidth * 0.8f)` | `.frame(maxWidth: .infinity * 0.8)` | n/a |
| Visual | backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | scrimColor | RN-wrapper | `rgba(0,0,0,0.55)` | `Color.Black.copy(alpha = 0.55f)` | `.black.opacity(0.55)` | `color.scrim.default` |
| Visual | shadow | RN-wrapper | `elevation[5]` | `Modifier.shadow(elevation = 5.dp)` | `.shadow(color:.black.opacity(0.35), radius:24, y:12)` | `elevation.light.5` |

### Layout — Header Section

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | paddingTop | RN-wrapper | `insets.top + space.lg` | `SafeAreaPadding.top + 16.dp` | `.safeAreaPadding(.top).padding(.top, 16)` | `space.lg` |
| Layout | paddingHorizontal | RN-wrapper | `space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | paddingBottom | RN-wrapper | `space.lg` = 16 | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |

### Layout — Menu Items

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | itemHeight | RN-wrapper | hardcoded `48` | `Modifier.height(48.dp)` | `.frame(height: 48)` | ESCALATE — `size.menuItemHeight = 48` |
| Layout | paddingHorizontal | RN-wrapper | `space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Visual | backgroundColor (selected) | RN-wrapper | `semantic.color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |
| Visual | backgroundColor (pressed) | RN-wrapper | `semantic.color.muted.pressed` | (pressed branch) | (pressed branch) | `color.muted.pressed` |

### Typography — Menu Items

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | RN-wrapper | `16` | `16.sp` | `16` | `type.body.md.fontSize` |
| Typography | fontWeight | RN-wrapper | `'400'` | `FontWeight.Normal` | `.regular` | `type.body.md.fontWeight` |
| Typography | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | color (selected) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Icons — Menu Items

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Icon | size | RN-wrapper | hardcoded `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | `iconSize.lg` |
| Icon | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Icon | color (selected) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Layout | iconGap | RN-wrapper | `space.lg` = 16 | `Spacer(Modifier.width(16.dp))` | `Spacer(minLength: 16)` | `space.lg` |

---

## DESIGN NOTES

- Drawer slides from left with gesture
- Scrim overlays main content when drawer is open
- Drawer has shadow for depth
- Selected item gets muted background + primary color
- Touch feedback on press
- Safe area respected on all edges

---

## VERIFICATION GATES

- Drawer opens with swipe from left edge
- Scrim appears when drawer is open
- Tapping scrim closes drawer
- Selected item visually distinct
- All items accessible within safe area
- Smooth animation (300ms)

---

## DEPENDENCIES

- UI-001 (core theme contract)
- IconSymbol component
- Safe area system
- Gesture system (Android `Modifier.draggable`, iOS `.gesture`)
- DrawerMenu organism component
- SessionContextMenu molecule component
