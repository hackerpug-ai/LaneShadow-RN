# SubpageLayout - STYLE PROPERTIES MATRIX

**Component:** SubpageLayout
**RN Source:** `react-native/components/layouts/subpage-layout.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/components/Typography/Text.tsx`, `node_modules/expo-linear-gradient/src/LinearGradient.tsx`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/layouts/subpage-layout.tsx` | Non-map screen layout with header |
| LinearGradient | `node_modules/expo-linear-gradient/src/LinearGradient.tsx` | Gradient fade from header to background |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Title typography |
| Pressable (RN) | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Back button and action button |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Back and action icons |

---

## LAYOUT COMPOSITION

**Purpose:** Reusable layout for non-map screens (settings, profile, etc.) with back navigation, title, and scrollable content

**Composition pattern:**
- Root View container with flex: 1 and background color
- LinearGradient header zone extending through notch area
- Two-tier header: compact nav row + large title row
- Nav row: back button (left) + optional right action
- Title row: large left-aligned title + copper accent rule
- Content area: flex container with bottom safe area

**Layout:** Gradient header with safe area handling, back button navigation, title with accent, scrollable content area

---

## STYLE PROPERTIES MATRIX

### Layout — Root Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Layout — Header Gradient (LinearGradient)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| colors (start) | RN-wrapper | `semantic.color.surface.default` | `Brush.verticalGradient(..., colors = listOf(surfaceColor, transparent))` | `LinearGradient(..., startPoint: .top, endPoint: .bottom)` | `color.surface.default` |
| colors (end) | RN-wrapper | `surfaceColor with alpha=0` | Included above (transparent) | Included above (Color.clear) | n/a |
| paddingTop | RN-wrapper | `insets.top` (dynamic) | `Modifier.padding(top = WindowInsets.safeDrawing.asPaddingValues().calculateTopPadding())` | `.padding(.top, safeAreaInsets.top)` | n/a (dynamic) |

### Layout — Nav Row (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | `.spacing(spacer: nil).frame(maxWidth: .infinity)` | n/a |
| paddingHorizontal | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| height | RN-wrapper | `52` | `Modifier.height(52.dp)` | `.frame(height: 52)` | ESCALATE — propose `layout.navRowHeight = 52` |

### Layout — Back Button (Pressable)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| width | RN-wrapper | `36` | `Modifier.size(36.dp)` | `.frame(width: 36, height: 36)` | ESCALATE — propose `size.navButton = 36` |
| height | RN-wrapper | `36` | Included above | Included above | ESCALATE — propose `size.navButton = 36` |
| borderRadius | RN-wrapper | `semantic.radius.full` (= 9999) | `RoundedCornerShape(50.percent)` / `CircleShape` | `Capsule()` / `Circle()` | `radius.full` |
| alignItems | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` + vertical | `.frame(alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterVertically)` | Included above | n/a |
| borderWidth | RN-wrapper | `1` | `Modifier.border(BorderStroke(1.dp, ...))` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |

### Visual — Back Button (by state)

| State | Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|---|
| default | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| pressed | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.pressed` | `LaneShadowTheme.colors.surfaceVariantPressed` | `theme.colors.surfaceVariantPressed` | `color.surfaceVariant.pressed` |
| default | borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Icon — Back Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| name | RN-wrapper | `'arrow-left'` | `Icons.AutoMirrored.Filled.ArrowBack` (Material) | `arrow.left` (SF Symbol) | n/a |
| size | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — propose `icon.navButton = 20` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Title Row (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingBottom | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |

### Typography — Title (Paper Text variant=headlineMedium)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | RN-wrapper | `headlineMedium` | `MaterialTheme.typography.headlineMedium` | Verify against Paper source | n/a |
| fontSize | Paper headlineMedium | Verify in source | (verify) | (verify) | ESCALATE — verify token |
| fontWeight | RN-wrapper override | `'700'` | `FontWeight.Bold` / `700` | `.bold()` / `fontWeight(.bold)` | ESCALATE — propose `type.headlineMd.fontWeight = 700` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Visual — Accent Rule (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| width | RN-wrapper | `32` | `Modifier.width(32.dp)` | `.frame(width: 32)` | ESCALATE — propose `size.accentRule = 32` |
| height | RN-wrapper | `3` | `Modifier.height(3.dp)` | `.frame(height: 3)` | ESCALATE — propose `size.accentRuleHeight = 3` |
| borderRadius | RN-wrapper | `1.5` | `RoundedCornerShape(1.5.dp)` | `RoundedRectangle(cornerRadius: 1.5)` | n/a |
| backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| marginTop | RN-wrapper | `semantic.space.sm` (= 8) | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |

### Layout — Content Area (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| paddingBottom | RN-wrapper | `insets.bottom` (dynamic) | `Modifier.padding(bottom = WindowInsets.safeDrawing.asPaddingValues().calculateBottomPadding())` | `.padding(.bottom, safeAreaInsets.bottom)` | n/a (dynamic) |

---

## NOTES

- **Gradient through notch:** LinearGradient extends from top (behind notch) fading to transparent, preventing color-band artifact
- **Safe area handling:** paddingTop on gradient, paddingBottom on content area
- **Two-tier header:** Nav row (52px) + Title row with padding
- **Back button:** 36px circular with surfaceVariant background, border
- **Title:** headlineMedium with fontWeight 700, copper accent rule below
- **Accent rule:** 32px wide, 3px tall, 1.5px radius, primary color
- **Right action:** Optional, mirrors back button styling
- **Press feedback:** surfaceVariant.pressed state on buttons
- **Navigation:** Uses `router.push()` with configurable `backTo` prop
- **TestID propagation:** Title and back button get testID suffixes
