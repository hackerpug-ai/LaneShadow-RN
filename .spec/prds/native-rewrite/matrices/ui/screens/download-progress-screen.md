# DownloadProgressScreen — STYLE PROPERTIES MATRIX

**Component:** DownloadProgressScreen
**Level:** Screen
**Source:** `react-native/components/onboarding/download-progress-screen.tsx`
**Platform Mapping:** Android `Column`, iOS `VStack`

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/onboarding/download-progress-screen.tsx` | `react-native/Libraries/Components/View/View.js` | Android: `app/src/main/java/com/laneshadow/ui/screens/DownloadProgressScreen.kt`<br>iOS: `app/ui/screens/DownloadProgressScreen.swift` | 2 states: downloading, complete |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### Layout — Screen Container

**Source files read:**
- LaneShadow: `react-native/components/onboarding/download-progress-screen.tsx`
- Framework: `react-native/Libraries/Components/View/View.js`, `react-native-paper/src/components/Typography/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.Center)` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | paddingHorizontal | RN-wrapper | `space.xl` = 24 | `Modifier.padding(horizontal = 24.dp)` | `.padding(.horizontal, 24)` | `space.xl` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Layout — Progress Bar

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height | RN-wrapper | `8` | `Modifier.height(8.dp)` | `.frame(height: 8)` | ESCALATE — `control.sliderTrackHeight = 8` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.secondary.default` | `LaneShadowTheme.colors.secondary` | `theme.colors.secondary` | `color.secondary.default` |
| Visual | borderRadius | RN-wrapper | `radius.full` = 9999 | `RoundedCornerShape(percent = 50)` | `Capsule()` | `radius.full` |
| Layout | marginBottom | RN-wrapper | `space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |

### Layout — Progress Fill

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width | RN-wrapper | `${progress}%` | `Modifier.fillMaxWidth(progress / 100f)` | `.frame(width: progress * maxWidth)` | n/a |
| Visual | backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Typography — Progress Text

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | variant | RN-wrapper | `bodyLarge` (Paper) | `MaterialTheme.typography.bodyLarge` | `.font(.bodyLarge)` | ESCALATE — map to `type.body.md` |
| Typography | textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| Typography | color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Layout | marginBottom | RN-wrapper | `space.xl` = 24 | `Modifier.padding(bottom = 24.dp)` | `.padding(.bottom, 24)` | `space.xl` |

---

## DESIGN NOTES

- Shows download progress
- Progress bar fills from 0 to 100%
- Shows percentage text
- Done button appears when complete

---

## VERIFICATION GATES

- Progress bar animates
- Percentage updates
- Done button appears when complete

---

## DEPENDENCIES

- UI-001 (core theme contract)
- Progress component
- Button component

---

## COMPOSITION

- DownloadProgressScreen = Column + [Progress, Text, Button]
