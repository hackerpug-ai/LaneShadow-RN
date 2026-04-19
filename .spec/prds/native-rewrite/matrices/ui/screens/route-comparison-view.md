# RouteComparisonView — STYLE PROPERTIES MATRIX

**Component:** RouteComparisonView
**Level:** Screen
**Source:** `react-native/components/screens/route-comparison-view.tsx`
**Platform Mapping:** Android `Column` + `LazyColumn`, iOS `ScrollView` + `VStack`

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/screens/route-comparison-view.tsx` | `react-native/Libraries/Components/ScrollView/ScrollView.js`, `react-native-paper` | Android: `app/src/main/java/com/laneshadow/ui/screens/RouteComparisonView.kt`<br>iOS: `app/ui/screens/RouteComparisonView.swift` | 3 states: loading, empty, loaded |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### Layout — Screen Container

**Source files read:**
- LaneShadow: `react-native/components/screens/route-comparison-view.tsx`
- Framework: `react-native/Libraries/Components/ScrollView/ScrollView.js`, `react-native-paper/src/components/Typography/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Layout — Content List

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | paddingHorizontal | RN-wrapper | `space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | paddingTop | RN-wrapper | `16` | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | ESCALATE — `space.lg` |
| Layout | paddingBottom | RN-wrapper | `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | ESCALATE — `space.lg` |
| Layout | gap | RN-wrapper | `12` | `Spacer(Modifier.height(12.dp))` | `Spacer(minLength: 12)` | ESCALATE — `space.md` |

### Layout — Route Cards

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | padding | RN-wrapper | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | ESCALATE — `space.lg` |
| Layout | gap | RN-wrapper | `12` | `Spacer(Modifier.height(12.dp))` | `Spacer(minLength: 12)` | ESCALATE — `space.md` |
| Visual | backgroundColor (selected) | RN-wrapper | `primary.default` + 8% alpha | `LaneShadowTheme.colors.primary.copy(alpha = 0.08f)` | `theme.colors.primary.opacity(0.08)` | `color.primary.default` + alpha |
| Visual | backgroundColor (unselected) | RN-wrapper | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| Visual | borderWidth (selected) | RN-wrapper | `2` | `Modifier.border(2.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 2))` | ESCALATE — `borderWidth.thick = 2` |
| Visual | borderColor (selected) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | borderRadius | RN-wrapper | `16` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |

### Layout — Route Badge

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | gap | RN-wrapper | `4` | `Spacer(Modifier.width(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |
| Layout | paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| Layout | paddingHorizontal | RN-wrapper | `10` | `Modifier.padding(horizontal = 10.dp)` | `.padding(.horizontal, 10)` | ESCALATE — `space.md - 2` |
| Visual | backgroundColor (selected) | RN-wrapper | `primary.default` + 15% alpha | `LaneShadowTheme.colors.primary.copy(alpha = 0.15f)` | `theme.colors.primary.opacity(0.15)` | `color.primary.default` + alpha |
| Visual | backgroundColor (unselected) | RN-wrapper | `semantic.color.divider.default` | `LaneShadowTheme.colors.divider` | `theme.colors.divider` | `color.divider.default` |
| Visual | borderRadius | RN-wrapper | `6` | `RoundedCornerShape(6.dp)` | `RoundedRectangle(cornerRadius: 6)` | ESCALATE — `radius.sm + 2` |

### Typography — Route Badge

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | RN-wrapper | `12` | `12.sp` | `12` | `type.label.sm.fontSize` |
| Typography | fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` | `.semibold` | `type.label.sm.fontWeight` |
| Typography | letterSpacing | RN-wrapper | `0.5` | `LetterSpacing(0.5.sp)` | `.tracking(0.5)` | ESCALATE — `type.label.sm.letterSpacing = 0.5` |
| Typography | textTransform | RN-wrapper | `'uppercase'` | `text.uppercase()` | `.textCase(.uppercase)` | n/a |
| Typography | color (selected) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography | color (unselected) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Layout — Stats Row

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | gap | RN-wrapper | `16` | `Spacer(Modifier.width(16.dp))` | `Spacer(minLength: 16)` | `space.lg` |
| Layout | alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

### Layout — Actions

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | justifyContent | RN-wrapper | `'flex-end'` | `horizontalArrangement = Arrangement.End` | `.frame(maxWidth: .infinity, alignment: .trailing)` | n/a |
| Layout | gap | RN-wrapper | `8` | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |

### Layout — Loading State

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.Center)` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | gap | RN-wrapper | `12` | `Spacer(Modifier.height(12.dp))` | `Spacer(minLength: 12)` | ESCALATE — `space.md` |
| Visual | indicatorColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Typography — Loading Text

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | variant | RN-wrapper | `bodyMedium` (Paper) | `MaterialTheme.typography.bodyMedium` | `.font(.bodyMedium)` | ESCALATE — map to semantic |
| Typography | color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Layout — Empty State

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.Center)` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | gap | RN-wrapper | `12` | `Spacer(Modifier.height(12.dp))` | `Spacer(minLength: 12)` | ESCALATE — `space.md` |

### Typography — Empty State

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | variant (title) | RN-wrapper | `titleMedium` (Paper) | `MaterialTheme.typography.titleMedium` | `.font(.titleMedium)` | ESCALATE — map to semantic |
| Typography | color (title) | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | variant (body) | RN-wrapper | `bodyMedium` (Paper) | `MaterialTheme.typography.bodyMedium` | `.font(.bodyMedium)` | ESCALATE — map to semantic |
| Typography | color (body) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

---

## DESIGN NOTES

- Lists route options for comparison
- Selected route gets primary background + border
- Each card shows badge, rationale, stats, wind, actions
- Loading and empty states
- Scrollable content
- Uses SubpageLayout for header/nav

---

## VERIFICATION GATES

- Routes list scrolls smoothly
- Selected route visually distinct
- Cards accessible (44pt min)
- Loading state visible
- Empty state shows helpful message
- Buttons work (details, save)

---

## DEPENDENCIES

- UI-001 (core theme contract)
- SubpageLayout template
- Button component
- IconSymbol component
- ScrollView/Column (Android `LazyColumn`, iOS `ScrollView`)

---

## COMPOSITION

- RouteComparisonView = SubpageLayout + ScrollView + [RouteCard]
- RouteCard = Badge + Text + StatRow + WindBadge + Button + Button
- Uses formatDistance/formatDuration helpers
