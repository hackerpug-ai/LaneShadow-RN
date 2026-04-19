# TeacherTabBar — STYLE PROPERTIES MATRIX

**Component:** TeacherTabBar
**Level:** Molecule (used in templates)
**Source:** `react-native/components/layouts/teacher-tab-bar.tsx`
**Platform Mapping:** Android `TabRow`, iOS `HStack` with custom tab buttons

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/layouts/teacher-tab-bar.tsx` | `react-native/Libraries/Components/View/View.js`, `react-native/Libraries/Components/Pressable/Pressable.js` | Android: `app/src/main/java/com/laneshadow/ui/molecules/TeacherTabBar.kt`<br>iOS: `app/ui/molecules/TeacherTabBar.swift` | 1 fixed layout with dynamic tabs |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### Layout — Tab Bar Container

**Source files read:**
- LaneShadow: `react-native/components/layouts/teacher-tab-bar.tsx`
- Framework: `react-native/Libraries/Components/View/View.js`, `react-native/Libraries/Components/Pressable/Pressable.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height | RN-wrapper | `48` | `Modifier.height(48.dp)` | `.frame(height: 48)` | ESCALATE — `size.tabBarHeight = 48` |
| Layout | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | paddingHorizontal | RN-wrapper | `space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | borderBottomWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(Rectangle().stroke(..., lineWidth: 1))` | ESCALATE — `borderWidth.thin = 1` |
| Visual | borderBottomColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Layout — Tab Items

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | paddingVertical | RN-wrapper | `space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| Layout | paddingHorizontal | RN-wrapper | `space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout | gap | RN-wrapper | `space.sm` = 8 | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |

### Visual — Tab States

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Visual | indicatorHeight | RN-wrapper | `2` | `Modifier.height(2.dp)` | `.frame(height: 2)` | ESCALATE — `size.tabIndicatorHeight = 2` |
| Visual | indicatorColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | backgroundColor (active) | RN-wrapper | `semantic.color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |
| Visual | backgroundColor (pressed) | RN-wrapper | `semantic.color.muted.pressed` | (pressed branch) | (pressed branch) | `color.muted.pressed` |

### Typography — Tab Labels

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | RN-wrapper | `14` | `14.sp` | `14` | `type.label.md.fontSize` |
| Typography | fontWeight (active) | RN-wrapper | `'600'` | `FontWeight.SemiBold` | `.semibold` | `type.label.md.fontWeight` |
| Typography | fontWeight (inactive) | RN-wrapper | `'400'` | `FontWeight.Normal` | `.regular` | `type.body.md.fontWeight` |
| Typography | color (active) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography | color (inactive) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

---

## DESIGN NOTES

- Horizontal scrollable tab bar
- Active tab has bottom indicator
- Active tab label is bolder and primary color
- Inactive tabs are muted
- Touch feedback on press

---

## VERIFICATION GATES

- Tabs scroll horizontally if needed
- Active tab indicator visible
- Tap switches tabs smoothly
- Touch feedback visible
- Indicator animates to new position

---

## DEPENDENCIES

- UI-001 (core theme contract)
- IconSymbol component (for tab icons)
