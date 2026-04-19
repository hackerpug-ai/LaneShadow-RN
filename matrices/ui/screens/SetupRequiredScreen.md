# SetupRequiredScreen - STYLE PROPERTIES MATRIX

**Component:** SetupRequiredScreen
**RN Source:** `react-native/components/gatekeeper/setup-required-screen.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/gatekeeper/setup-required-screen.tsx` | Model corrupted/recovery screen |
| Button | `react-native/components/ui/button.tsx` | Button atom (see matrices/ui/atoms/Button.md) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography |

---

## NAVIGATION & ROUTING

| Aspect | RN | Android (Compose) | iOS (SwiftUI) |
|---|---|---|---|
| **Entry point** | Gatekeeper flow | `navController.navigate("setupRequired")` | NavigationLink `/setupRequired` |
| **Params** | None | None | None |
| **Transitions** | Fade in | `AnimatedContent(..., enter = fadeIn())` | `.opacity(...)` |
| **Exit** | onRestorePress callback | Calls parent callback | Calls parent callback |

---

## DATA FLOW

| Prop | Type | Source | Purpose |
|---|---|---|---|
| onRestorePress | () => void | Parent callback (ModelGatekeeperProvider) | Delete corrupted model and re-download |

---

## STYLE PROPERTIES MATRIX

### Layout — Root Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Layout — Content Area (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterVertically)` | `.frame(alignment: .center)` | n/a |
| paddingHorizontal | RN-wrapper | `semantic.space.xl` (= 24) | `Modifier.padding(horizontal = 24.dp)` | `.padding(.horizontal, 24)` | `space.xl` |
| gap | RN-wrapper | `semantic.space.xl` (= 24) | `Arrangement.spacedBy(24.dp)` / `Modifier.padding(end = 24.dp)` between items | `spacing(24)` | `space.xl` |

### Typography — Title (Text variant=headlineMedium)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | RN-wrapper | `headlineMedium` | `MaterialTheme.typography.headlineMedium` | Verify against Paper | n/a |
| text | RN-wrapper | `'Setup Required'` | `Text("Setup Required")` | `Text("Setup Required")` | n/a |
| textAlign | RN-wrapper | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Body (Text variant=bodyLarge)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | RN-wrapper | `bodyLarge` | `MaterialTheme.typography.bodyLarge` | Verify against Paper | n/a |
| text | RN-wrapper | `'Your Shadow needs to be restored. Please download again.'` | `Text(...)` | `Text(...)` | n/a |
| textAlign | RN-wrapper | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Layout — Button Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| alignSelf | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity, alignment: .center)` | n/a |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |

### Button — Restore (Button)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| title | RN-wrapper | `'Restore Your Shadow'` | Passed to Button | Passed to Button | n/a |
| onPress | RN-wrapper | `onRestorePress` | Passed to Button | Passed to Button | n/a |
| variant | RN-wrapper | `'default'` (primary) | `variant = ButtonVariant.Default` | `variant = .default` | n/a |

---

## NOTES

- **Recovery flow:** Shown when model file is corrupted
- **Title:** "Setup Required" (headlineMedium, centered)
- **Body:** Explains need to restore (bodyLarge, centered, muted color)
- **Button:** Full-width primary button "Restore Your Shadow"
- **Action:** Deletes corrupted file and triggers re-download
- **Spacing:** 24px gaps between all elements
- **Safe area:** Handled via insets
- **TestID propagation:** All interactive elements get testID suffixes
