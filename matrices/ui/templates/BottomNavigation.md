# BottomNavigation - STYLE PROPERTIES MATRIX

**Component:** BottomNavigation
**RN Source:** `react-native/components/ui/bottom-navigation.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/components/Typography/Text.tsx`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/bottom-navigation.tsx` | Bottom tab navigation with 4 tabs |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Tab icons (see matrices/ui/atoms/IconSymbol.md) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Tab labels |

---

## LAYOUT COMPOSITION

**Purpose:** Bottom tab navigation bar with 4 tabs (Explore, Saved, Rides, Profile)

**Composition pattern:**
- Container View with 84px height
- Border top (1px)
- Row layout with space-around
- Nav items: icon (24px) + label (10px)
- Active state: primary color
- Inactive state: onSurface.subtle color
- 4px gap between icon and label
- 8px vertical padding, 16px horizontal per item

**Layout:** 84px high navigation bar at bottom with 4 tab items

---

## STYLE PROPERTIES MATRIX

### Layout — Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| height | RN-wrapper | `84` | `Modifier.height(84.dp)` | `.frame(height: 84)` | ESCALATE — propose `layout.bottomNavHeight = 84` |
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-around'` | `horizontalArrangement = Arrangement.SpaceAround` | `.frame(maxWidth: .infinity).spacing(spacer: nil)` | n/a |
| alignItems | RN-wrapper | `'flex-start'` | `verticalAlignment = Alignment.Top` | `.alignment(.top)` | n/a |
| paddingTop | RN-wrapper | `8` | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | ESCALATE — propose `space.bottomNavTopPadding = 8` |
| borderTopWidth | RN-wrapper | `1` | `Modifier.border(BorderStroke(1.dp, ...))` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| borderTopColor | RN-wrapper | `semantic.color.divider.default` | `LaneShadowTheme.colors.divider` | `theme.colors.divider` | `color.divider.default` |
| backgroundColor | RN-wrapper | `semantic.color.surface.default` (or prop) | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |

### Layout — Nav Item (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flexDirection | RN-wrapper | `'column'` | `Column(...)` | `VStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` + vertical | `.frame(alignment: .center)` | n/a |
| gap | RN-wrapper | `4` | `Arrangement.spacedBy(4.dp)` / `Modifier.padding(end = 4.dp)` between items | `spacing(4)` | ESCALATE — propose `space.bottomNavIconGap = 4` |
| paddingVertical | RN-wrapper | `8` | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | ESCALATE — propose `space.bottomNavItemPadding = 8` |
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |

### Icon — Tab Icon (IconSymbol)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| size | RN-wrapper | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `icon.bottomNav = 24` |
| color (active) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| color (inactive) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Typography — Tab Label (Text)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| fontSize | RN-wrapper | `10` | `10.sp` | `.font(.system(size: 10))` | ESCALATE — propose `type.bottomNav.fontSize = 10` |
| color (active) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| color (inactive) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

---

## NOTES

- **Fixed height:** 84px (includes safe area for home indicator)
- **4 tabs:** Explore, Saved, Rides, Profile
- **Active state:** Primary color for icon and label
- **Inactive state:** onSurface.subtle color
- **Icon size:** 24px
- **Label size:** 10px
- **Gap:** 4px between icon and label
- **Item padding:** 8px vertical, 16px horizontal
- **Container padding:** 8px top (accounting for safe area)
- **Border:** 1px top border using divider.default token
- **Background:** surface.default (or custom via prop)
- **TestID:** None at navigation level (propagate to items)
