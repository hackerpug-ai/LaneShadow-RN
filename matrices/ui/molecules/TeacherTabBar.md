# TeacherTabBar - STYLE PROPERTIES MATRIX

**Component:** TeacherTabBar
**RN Source:** `react-native/components/layouts/teacher-tab-bar.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/layouts/teacher-tab-bar.tsx` | Public API, teacher bottom navigation |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Tab icons, action icon (see `matrices/ui/atoms/IconSymbol.md`) |
| Pressable | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Tab button, action button touch handling |

---

## COMPOSITION

**Child atoms:**
- `TabButton` - Tab button with icon and label (Feed, Reports)
- `IconSymbol` - Tab icons (newspaper, chart-bar), action icon
- `Pressable` - Tab buttons, center action button
- `View` - Tab bar container, tab item containers, active indicator
- `Text` - Tab labels

**Composition pattern:** Bottom tab bar with 2 tabs (Feed, Reports) and elevated center action button (microphone).

**Layout:** Horizontal row, 80px height, space-between layout. Center button elevated -30px from top.

---

## STYLE PROPERTIES MATRIX

### Layout — Tab Bar Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | `.frame(maxWidth: .infinity)` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| height | RN-wrapper | `80` | `80.dp` | `80` | ESCALATE — custom height |
| borderTopWidth | RN-wrapper | `1` | `1.dp` | `1` | n/a |

### Visual — Tab Bar Background

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| borderTopColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| paddingHorizontal | RN-wrapper | `semantic.space.lg` | `LaneShadowTheme.spacing.large` | `.padding(.horizontal, 16)` | `space.lg` (16) |

### Layout — Tab Item

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'column'` | `Column(...)` | `VStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| gap | RN-wrapper | `semantic.space.xs` | `LaneShadowTheme.spacing.extraSmall` | `4` | `space.xs` (4) |

### Visual — Active Indicator

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `${semantic.color.primary.default}33` (20% alpha) | `LaneShadowTheme.colors.primary.copy(alpha = 0.2f)` | `theme.colors.primary.opacity(0.2)` | `color.primary.default` |
| borderRadius | RN-wrapper | `semantic.radius.full` | `CircleShape` | `.cornerRadius(9999)` | `radius.full` |
| paddingHorizontal | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.horizontal, 8)` | `space.sm` (8) |
| paddingVertical | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.vertical, 8)` | `space.sm` (8) |
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |

### Visual — Tab Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `24` | `24.dp` | `24` | ESCALATE — standard icon size |
| color (active) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| color (inactive) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Typography — Tab Label (Active)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'labelMedium'` (Paper) | `LaneShadowTheme.typography.labelMedium` | `Font.subheadline` | `type.label.md` |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Typography — Tab Label (Inactive)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'bodySmall'` (Paper) | `LaneShadowTheme.typography.bodySmall` | `Font.footnote` | `type.body.sm` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Layout — Center Button Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| marginTop | RN-wrapper | `-30` | `-30.dp` | `-30` | ESCALATE — negative elevation |

### Visual — Center Action Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `64` | `64.dp` | `64` | ESCALATE — custom size |
| height | RN-wrapper | `64` | `64.dp` | `64` | ESCALATE — custom size |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| backgroundColor (default) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| backgroundColor (pressed/active) | RN-wrapper | `semantic.color.primary.pressed` | `LaneShadowTheme.colors.primaryPressed` | `theme.colors.primaryPressed` | `color.primary.pressed` |
| backgroundColor (disabled) | RN-wrapper | `semantic.color.primary.disabled` | `LaneShadowTheme.colors.primaryDisabled` | `theme.colors.primaryDisabled` | `color.primary.disabled` |
| borderRadius | RN-wrapper | `semantic.radius.full` | `CircleShape` | `.cornerRadius(9999)` | `radius.full` |
| shadowColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| shadowOffset.width | RN-wrapper | `0` | `0.dp` | `0` | n/a |
| shadowOffset.height | RN-wrapper | `4` | `4.dp` | `4` | n/a |
| shadowOpacity | RN-wrapper | `0.3` | `0.3f` | `0.3` | n/a |
| shadowRadius | RN-wrapper | `8` | `8.dp` | `8` | n/a |
| opacity (disabled) | RN-wrapper | `0.5` | `alpha = 0.5f` | `.opacity(0.5)` | n/a |

### Visual — Center Button Transform

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| transform (active/pressed) | RN-wrapper | `scale: 1.1` | `Modifier.scale(1.1f)` | `.scaleEffect(1.1)` | n/a |
| transform (default) | RN-wrapper | `scale: 1.0` | `Modifier.scale(1f)` | `.scaleEffect(1)` | n/a |

### Visual — Center Button Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size (default) | RN-wrapper | `32` | `32.dp` | `32` | ESCALATE — between `iconSize.lg` (24) and `iconSize.xl` (32) |
| size (active) | RN-wrapper | `36` | `36.dp` | `36` | ESCALATE — larger when active |
| color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

---

## NOTES

- **Teacher role:** Bottom tab bar for teacher screens (Feed, Reports)
- **Center action button:** Elevated microphone button with shadow (-30px top margin)
- **Active state:** Active tab shows icon in 20% primary color capsule, primary color text
- **Inactive state:** Inactive tab shows muted icon, muted text
- **Push-to-talk:** Sprint 06 feature - `onPressIn`/`onPressOut` for voice recording
- **Visual feedback:** Active button scales to 1.1x, icon size increases 32→36
- **Disabled state:** Disabled button shows 0.5 opacity, primary disabled color
- **Shadow styling:** Elevated button has shadow (4px offset, 0.3 opacity, 8px radius)
- **Tab icons:** Feed (newspaper), Reports (chart-bar)
- **Action button:** Microphone icon (push-to-talk for voice assistant)
- **Fixed height:** 80px tab bar height accommodates elevated button
- **Paper typography:** Uses `labelMedium` (active), `bodySmall` (inactive)
- **Flex layout:** Tab items have flex=1 for equal spacing
