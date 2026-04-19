# TeacherSimpleViewLayout — STYLE PROPERTIES MATRIX

**Component:** TeacherSimpleViewLayout
**Level:** Template
**Source:** `react-native/components/layouts/teacher-simple-view-layout.tsx`
**Platform Mapping:** Android `Column` with safe area, iOS `VStack` with safe area

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/layouts/teacher-simple-view-layout.tsx` | `react-native/Libraries/Components/View/View.js`, `react-native-safe-area-context` | Android: `app/src/main/java/com/laneshadow/ui/templates/TeacherSimpleViewLayout.kt`<br>iOS: `app/ui/templates/TeacherSimpleViewLayout.swift` | 1 fixed layout |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### Layout — Container

**Source files read:**
- LaneShadow: `react-native/components/layouts/teacher-simple-view-layout.tsx`
- Framework: `react-native/Libraries/Components/View/View.js`, `react-native-safe-area-context`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| Layout | safeArea | RN-wrapper | `useSafeAreaInsets()` | `Modifier.padding(SafeAreaPadding)` | `.safeAreaPadding()` | n/a (safe area) |

---

## DESIGN NOTES

- Minimal layout for teacher/training mode screens
- Provides safe area handling and background only
- No chrome — pure content container
- Used for teacher-specific views that don't need standard navigation

---

## VERIFICATION GATES

- Safe areas respected on all edges
- Background color applies correctly
- Content fills available space

---

## DEPENDENCIES

- UI-001 (core theme contract)
- Safe area system
