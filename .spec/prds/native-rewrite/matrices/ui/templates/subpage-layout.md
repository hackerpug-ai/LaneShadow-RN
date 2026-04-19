# SubpageLayout — STYLE PROPERTIES MATRIX

**Component:** SubpageLayout
**Level:** Template
**Source:** `react-native/components/layouts/subpage-layout.tsx`
**Platform Mapping:** Android `Column` + `LinearGradient`, iOS `VStack` + gradient overlay

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/layouts/subpage-layout.tsx` | `expo-linear-gradient`, `react-native/Libraries/Components/View/View.js`, `react-native-safe-area-context` | Android: `app/src/main/java/com/laneshadow/ui/templates/SubpageLayout.kt`<br>iOS: `app/ui/templates/SubpageLayout.swift` | 1 fixed layout with optional rightAction |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### Layout — Header Zone

**Source files read:**
- LaneShadow: `react-native/components/layouts/subpage-layout.tsx`
- Framework: `expo-linear-gradient`, `react-native/Libraries/Components/View/View.js`, `react-native-paper/src/components/Typography/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | paddingTop (header) | RN-wrapper | `paddingTop: insets.top` | `Modifier.padding(top = SafeAreaPadding.top)` | `.safeAreaPadding(.top)` | n/a (safe area) |
| Layout | headerHeight | RN-wrapper | hardcoded `52` (nav row) | `Modifier.height(52.dp)` | `.frame(height: 52)` | ESCALATE — propose `size.subpageNavRowHeight = 52` |
| Layout | paddingHorizontal | RN-wrapper | `space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | titlePaddingBottom | RN-wrapper | `space.lg` = 16 | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |
| Layout | backButtonSize | RN-wrapper | `36 × 36` | `Modifier.size(36.dp)` | `.frame(width: 36, height: 36)` | ESCALATE — propose `size.subpageBackButtonSize = 36` |
| Layout | accentRuleWidth | RN-wrapper | hardcoded `32` | `Modifier.width(32.dp)` | `.frame(width: 32)` | ESCALATE — propose `size.subpageAccentRuleWidth = 32` |
| Layout | accentRuleHeight | RN-wrapper | hardcoded `3` | `Modifier.height(3.dp)` | `.frame(height: 3)` | ESCALATE — propose `size.subpageAccentRuleHeight = 3` |
| Layout | accentRuleRadius | RN-wrapper | hardcoded `1.5` | `RoundedCornerShape(1.5.dp)` | `RoundedRectangle(cornerRadius: 1.5)` | n/a |
| Layout | gap (subtitle→accent) | RN-wrapper | `space.sm` = 8 | `Spacer(Modifier.height(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |

### Visual — Gradient Header

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Visual | gradientStartColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | gradientEndColor | RN-wrapper | `surface.default` with alpha=0 | `Color.Transparent` | `.clear` | n/a |
| Visual | backgroundColor (body) | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Visual — Back Button

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Visual | backgroundColor (idle) | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Visual | backgroundColor (pressed) | RN-wrapper | `semantic.color.surfaceVariant.pressed` | (pressed branch) | (pressed branch) | `color.surfaceVariant.pressed` |
| Visual | borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| Visual | borderWidth | RN-wrapper | hardcoded `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — `borderWidth.thin = 1` |
| Visual | borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Typography — Title

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | variant | RN-wrapper | `headlineMedium` (Paper) | `MaterialTheme.typography.headlineMedium` | `.font(.headlineMedium)` | ESCALATE — map to semantic tokens |
| Typography | fontSize | headlineMedium | 28 | `28.sp` | `28` | ESCALATE — propose `type.heading.xl.fontSize = 28` |
| Typography | fontWeight | RN-wrapper | hardcoded `'700'` | `FontWeight.Bold` | `.bold` | ESCALATE — `fontWeight.bold = 700` |
| Typography | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Accent Rule

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Visual | backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Icons

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Icon | name | RN-wrapper | `arrow-left` | `Icons.Outlined.ArrowLeft` | `arrow.left` | n/a |
| Icon | size | RN-wrapper | hardcoded `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — `iconSize.md2 = 20` |
| Icon | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Content Area

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | paddingBottom | RN-wrapper | `insets.bottom` | `Modifier.padding(bottom = SafeAreaPadding.bottom)` | `.safeAreaPadding(.bottom)` | n/a (safe area) |
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |

---

## DESIGN NOTES

- **Critical gradient pattern**: The gradient MUST extend through the safe area (notch/status bar zone) to prevent visible color band artifact
- On Android: Use `Modifier.padding(top = WindowInsets.safeDrawing.asPaddingValues().value)` on the gradient container
- On iOS: Use `.safeAreaPadding(.top)` on the gradient container
- Do NOT use `SafeAreaView` as root — use plain `View` with manual padding
- Accent rule provides brand reinforcement (copper) and visual anchor
- Back button is circular with border — matches map overlay chrome language

---

## VERIFICATION GATES

- Gradient extends seamlessly through status bar on iOS
- No visible color band between status bar and header on Android
- Back button touch target meets minimum size (44pt)
- Title text does not wrap on long titles
- Accent rule aligns with title start
- Right action button aligns with back button

---

## DEPENDENCIES

- UI-001 (core theme contract)
- IconSymbol component
- Safe area system
- Gradient system (Android `Brush.verticalGradient`, iOS `LinearGradient`)
