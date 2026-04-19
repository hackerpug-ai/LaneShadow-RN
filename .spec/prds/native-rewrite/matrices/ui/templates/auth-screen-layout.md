# AuthScreenLayout — STYLE PROPERTIES MATRIX

**Component:** AuthScreenLayout
**Level:** Template
**Source:** `react-native/components/auth/auth-screen-layout.tsx`
**Platform Mapping:** Android `Column` with safe area, iOS `VStack` with safe area

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/auth/auth-screen-layout.tsx` | `react-native/Libraries/Components/View/View.js`, `react-native-safe-area-context` | Android: `app/src/main/java/com/laneshadow/ui/templates/AuthScreenLayout.kt`<br>iOS: `app/ui/templates/AuthScreenLayout.swift` | 1 fixed layout |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### Layout — Container

**Source files read:**
- LaneShadow: `react-native/components/auth/auth-screen-layout.tsx`
- Framework: `react-native/Libraries/Components/View/View.js`, `react-native-safe-area-context`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | paddingHorizontal | RN-wrapper | `space.xl` = 24 | `Modifier.padding(horizontal = 24.dp)` | `.padding(.horizontal, 24)` | `space.xl` |
| Layout | paddingTop | RN-wrapper | `insets.top + space.xl` | `SafeAreaPadding.top + 24.dp` | `.safeAreaPadding(.top).padding(.top, 24)` | `space.xl` |
| Layout | paddingBottom | RN-wrapper | `insets.bottom + space.xl` | `SafeAreaPadding.bottom + 24.dp` | `.safeAreaPadding(.bottom).padding(.bottom, 24)` | `space.xl` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Layout — Content Area

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | gap | RN-wrapper | `space.lg` = 16 | `Spacer(Modifier.height(16.dp))` | `Spacer(minLength: 16)` | `space.lg` |
| Layout | maxWidth | RN-wrapper | `400` (centered) | `Modifier.requiredWidthIn(max = 400.dp)` | `.frame(maxWidth: 400)` | semantic.size.authContentMaxWidth |
| Layout | alignSelf | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity).layoutPriority(1)` | n/a |

---

## DESIGN NOTES

- Simple container for auth screens (login, signup, etc.)
- Centers content with max width
- Safe area handling on all edges
- Generous padding for breathing room
- Used by WelcomeScreen, CompletionScreen, etc.

---

## VERIFICATION GATES

- Content centered horizontally
- Safe areas respected on all edges
- Max width constraint works on large screens
- Padding consistent on all sides

---

## DEPENDENCIES

- UI-001 (core theme contract)
- Safe area system
