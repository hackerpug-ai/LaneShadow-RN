# TeacherSimpleViewLayout - STYLE PROPERTIES MATRIX

**Component:** TeacherSimpleViewLayout
**RN Source:** `react-native/components/layouts/teacher-simple-view-layout.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native-paper/src/components/Typography/Text.tsx`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/layouts/teacher-simple-view-layout.tsx` | Teacher view layout without tabs |
| BaseViewLayout | `react-native/components/layouts/base-view-layout.tsx` | Base layout with safe area (see matrices/ui/templates/BaseViewLayout.md) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Title typography |
| Pressable (RN) | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Back button |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Back icon |

---

## LAYOUT COMPOSITION

**Purpose:** Layout for teacher views without tab bar (Profile, Settings) with simple back button header

**Composition pattern:**
- BaseViewLayout wrapper for safe area handling
- Header row (60px height) with back button, centered title, spacer
- Back button with press feedback
- Content area with flex: 1

**Layout:** Simple header with centered title, back button left, empty spacer right, content below

---

## STYLE PROPERTIES MATRIX

### Layout — Header Row (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | `.frame(maxWidth: .infinity)` | n/a |
| height | RN-wrapper | `60` | `Modifier.height(60.dp)` | `.frame(height: 60)` | ESCALATE — propose `layout.teacherHeaderHeight = 60` |
| backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| borderBottomWidth | RN-wrapper | `1` | `Modifier.border(BorderStroke(1.dp, ...))` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| borderBottomColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| paddingHorizontal | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingVertical | RN-wrapper | `semantic.space.sm` (= 8) | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |

### Layout — Back Button (Pressable)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| width | RN-wrapper | `44` | `Modifier.size(44.dp)` | `.frame(width: 44, height: 44)` | ESCALATE — propose `size.touchTarget = 44` |
| height | RN-wrapper | `44` | Included above | Included above | ESCALATE — propose `size.touchTarget = 44` |
| alignItems | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` + vertical | `.frame(alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | Included above | Included above | n/a |
| borderRadius | RN-wrapper | `semantic.radius.full` (= 9999) | `RoundedCornerShape(50.percent)` / `CircleShape` | `Capsule()` / `Circle()` | `radius.full` |
| padding | RN-wrapper | `semantic.space.sm` (= 8) | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` |

### Visual — Back Button (by state)

| State | Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|---|
| default | backgroundColor | RN-wrapper | `'transparent'` | `Color.Transparent` | `Color.clear` | n/a |
| pressed | backgroundColor | RN-wrapper | `semantic.color.surface.pressed` | `LaneShadowTheme.colors.surfacePressed` | `theme.colors.surfacePressed` | `color.surface.pressed` |

### Icon — Back Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| name | RN-wrapper | `'arrow-left'` | `Icons.AutoMirrored.Filled.ArrowBack` (Material) | `arrow.left` (SF Symbol) | n/a |
| size | RN-wrapper | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `icon.teacherNav = 24` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Title Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| alignItems | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity, alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterVertically)` | `.frame(alignment: .center)` | n/a |

### Typography — Title (Paper Text variant=titleLarge)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | RN-wrapper | `titleLarge` | `MaterialTheme.typography.titleLarge` | Verify against Paper source | n/a |
| fontSize | Paper titleLarge | Verify in source | (verify) | (verify) | ESCALATE — verify token |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Header Right Spacer (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| width | RN-wrapper | `44` | `Modifier.width(44.dp)` | `.frame(width: 44)` | ESCALATE — propose `size.touchTarget = 44` |

### Layout — Content Area (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |

---

## NOTES

- **Header height:** Fixed at 60px
- **Touch targets:** Back button and spacer are 44px (minimum touch target)
- **Back navigation:** Uses `router.back()` for navigation
- **Centered title:** Title centered using flex: 1 container with center alignment
- **Press feedback:** surface.pressed state on back button
- **Border:** 1px bottom border using border.default token
- **Safe area:** Handled by BaseViewLayout wrapper
- **TestID propagation:** Back button gets testID suffix
