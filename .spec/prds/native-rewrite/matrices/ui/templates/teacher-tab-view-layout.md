# TeacherTabViewLayout — STYLE PROPERTIES MATRIX

**Component:** TeacherTabViewLayout
**Level:** Template
**Source:** `react-native/components/layouts/teacher-tab-view-layout.tsx`
**Platform Mapping:** Android `Column` + `TabRow`, iOS `VStack` + `TabView`

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/layouts/teacher-tab-view-layout.tsx` | `react-native/Libraries/Components/View/View.js` | Android: `app/src/main/java/com/laneshadow/ui/templates/TeacherTabViewLayout.kt`<br>iOS: `app/ui/templates/TeacherTabViewLayout.swift` | 1 fixed layout with dynamic tabs |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### Layout — Container

**Source files read:**
- LaneShadow: `react-native/components/layouts/teacher-tab-view-layout.tsx`
- Framework: `react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Layout — Tab Bar

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height | RN-wrapper | `48` | `Modifier.height(48.dp)` | `.frame(height: 48)` | ESCALATE — `size.tabBarHeight = 48` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | borderBottomWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(Rectangle().stroke(..., lineWidth: 1))` | ESCALATE — `borderWidth.thin = 1` |
| Visual | borderBottomColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Layout — Tab Content

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| Layout | paddingHorizontal | RN-wrapper | `space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | paddingTop | RN-wrapper | `space.lg` = 16 | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | `space.lg` |

---

## DESIGN NOTES

- Tab bar at top for teacher mode
- Content switches based on selected tab
- Used for teacher-specific multi-tab views
- Minimal chrome — focus on content

---

## VERIFICATION GATES

- Tab bar visible at top
- Tab switching smooth
- Content fills remaining space
- Active tab visually indicated

---

## DEPENDENCIES

- UI-001 (core theme contract)
- TeacherTabBar molecule component
