# TeacherTabViewLayout - STYLE PROPERTIES MATRIX

**Component:** TeacherTabViewLayout
**RN Source:** `react-native/components/layouts/teacher-tab-view-layout.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/layouts/teacher-tab-view-layout.tsx` | Teacher view layout with tab bar and voice assistant |
| MenuLayout | `react-native/components/layouts/menu-layout.tsx` | Drawer menu layout (see matrices/ui/templates/MenuLayout.md) |
| BaseViewLayout | `react-native/components/layouts/base-view-layout.tsx` | Base layout with safe area (see matrices/ui/templates/BaseViewLayout.md) |
| Header | `react-native/components/layouts/header.tsx` | Header molecule (see matrices/ui/molecules/Header.md) |
| TeacherTabBar | `react-native/components/layouts/teacher-tab-bar.tsx` | Tab bar molecule (see matrices/ui/molecules/TeacherTabBar.md) |
| VoiceAssistantOverlay | `react-native/components/assistant/voice-assistant-overlay.tsx` | Voice assistant organism (see matrices/ui/organisms/VoiceAssistantOverlay.md) |
| Banner | `react-native/components/ui/banner.tsx` | Banner molecule (see matrices/ui/molecules/Banner.md) |

---

## LAYOUT COMPOSITION

**Purpose:** Composed layout for teacher views with tab bar (Feed, Reports), drawer menu, and voice assistant

**Composition pattern:**
- MenuLayout wrapper for drawer menu
- BaseViewLayout for safe area handling
- Header molecule with menu button
- Banner (currently hidden) for offline notifications
- Content area with flex: 1
- TeacherTabBar at bottom with tab items and microphone action
- VoiceAssistantOverlay for push-to-talk voice input

**Layout:** Full-screen layout with drawer, header, banner, content, tab bar, and voice overlay

---

## STYLE PROPERTIES MATRIX

### Layout — Content Area (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |

### Layout — Children (function render)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| composition | RN-wrapper | `function receiving onMenuPress` | `@Composable fun children(onMenuPress: () -> Unit)` | `@ViewBuilder var content: () -> Void` | n/a |

---

## NOTES

- **MenuLayout:** Provides drawer menu with teacher-specific configuration
- **BaseViewLayout:** Provides safe area handling
- **Header:** Title with menu button
- **Banner:** Offline notification (currently hidden)
- **Content:** flex: 1 container for child content
- **TeacherTabBar:** Tab navigation with voice assistant microphone button
- **Voice assistant:** Push-to-talk pattern with pressIn/pressOut handlers
- **Haptic feedback:** Medium impact on press, light impact on release
- **Voice scope:** Classroom context with placeholder ID
- **TestID propagation:** Header and tab bar get testID suffixes
- **Children as function:** Passes `onMenuPress` callback to children
