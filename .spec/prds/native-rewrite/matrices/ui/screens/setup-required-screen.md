# SetupRequiredScreen — STYLE PROPERTIES MATRIX

**Component:** SetupRequiredScreen
**Level:** Screen
**Source:** `react-native/components/gatekeeper/setup-required-screen.tsx`
**Platform Mapping:** Android `Column`, iOS `VStack`

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/gatekeeper/setup-required-screen.tsx` | `react-native/Libraries/Components/View/View.js` | Android: `app/src/main/java/com/laneshadow/ui/screens/SetupRequiredScreen.kt`<br>iOS: `app/ui/screens/SetupRequiredScreen.swift` | 1 fixed screen |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### Layout — Screen Container

**Source files read:**
- LaneShadow: `react-native/components/gatekeeper/setup-required-screen.tsx`
- Framework: `react-native/Libraries/Components/View/View.js`, `react-native-paper/src/components/Typography/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.Center)` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | paddingHorizontal | RN-wrapper | `space.xl` = 24 | `Modifier.padding(horizontal = 24.dp)` | `.padding(.horizontal, 24)` | `space.xl` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Layout — Icon

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Icon | name | RN-wrapper | `alert-circle` | `Icons.Outlined.Warning` | `exclamationmark.triangle` | n/a |
| Icon | size | RN-wrapper | `48` | `Modifier.size(48.dp)` | `.frame(width: 48, height: 48)` | `iconSize.emptyState` |
| Icon | color | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| Layout | alignSelf | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | marginBottom | RN-wrapper | `space.lg` = 16 | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |

### Typography — Title

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | variant | RN-wrapper | `headlineMedium` (Paper) | `MaterialTheme.typography.headlineMedium` | `.font(.headlineMedium)` | ESCALATE — map to semantic |
| Typography | textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| Typography | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Layout | marginBottom | RN-wrapper | `space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |

### Typography — Message

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | variant | RN-wrapper | `bodyLarge` (Paper) | `MaterialTheme.typography.bodyLarge` | `.font(.bodyLarge)` | ESCALATE — map to `type.body.md` |
| Typography | textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| Typography | color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Layout | marginBottom | RN-wrapper | `space.xl` = 24 | `Modifier.padding(bottom = 24.dp)` | `.padding(.bottom, 24)` | `space.xl` |

---

## DESIGN NOTES

- Shows when model not downloaded
- Warning icon
- Clear message
- Setup button
- Centered content

---

## VERIFICATION GATES

- Icon visible
- Text readable
- Button tappable

---

## DEPENDENCIES

- UI-001 (core theme contract)
- Button component
- IconSymbol component

---

## COMPOSITION

- SetupRequiredScreen = Column + [Icon, Text, Text, Button]
