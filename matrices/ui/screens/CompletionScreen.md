# CompletionScreen - STYLE PROPERTIES MATRIX

**Component:** CompletionScreen
**RN Source:** `react-native/components/onboarding/completion-screen.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/onboarding/completion-screen.tsx` | Model download completion screen |
| LaneShadowLogo | `react-native/components/auth/lane-shadow-logo.tsx` | Logo atom (see matrices/ui/atoms/LaneShadowLogo.md) |
| Button | `react-native/components/ui/button.tsx` | Button atom (see matrices/ui/atoms/Button.md) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography |

---

## NAVIGATION & ROUTING

| Aspect | RN | Android (Compose) | iOS (SwiftUI) |
|---|---|---|---|
| **Entry point** | Gatekeeper flow | `navController.navigate("completion")` | NavigationLink `/completion` |
| **Params** | None | None | None |
| **Transitions** | Fade in | `AnimatedContent(..., enter = fadeIn())` | `.opacity(...)` |
| **Exit** | onStartRiding callback | Calls parent callback | Calls parent callback |

---

## DATA FLOW

| Prop | Type | Source | Purpose |
|---|---|---|---|
| onStartRiding | () => void | Parent callback (ModelGatekeeperProvider) | Complete setup and enter main app |

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

### Layout — Logo Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| backgroundColor | RN-wrapper | `semantic.color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| borderRadius | RN-wrapper | `semantic.radius.xl` (= 16) | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.xl` |
| width | RN-wrapper | `80` | `Modifier.size(80.dp)` | `.frame(width: 80, height: 80)` | ESCALATE — propose `size.completionLogo = 80` |
| height | RN-wrapper | `80` | Included above | Included above | ESCALATE — propose `size.completionLogo = 80` |
| alignItems | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` + vertical | `.frame(alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | Included above | Included above | n/a |
| alignSelf | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity, alignment: .center)` | n/a |
| elevation | RN-wrapper | `semantic.elevation[3]` | `Modifier.shadow(elevation = 3.dp, ...)` | `.shadow(...)` | `elevation[3]` |

### Icon — Logo (LaneShadowLogo)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| size | RN-wrapper | `50` | `Modifier.size(50.dp)` | `.frame(width: 50, height: 50)` | ESCALATE — propose `size.logo = 50` |

### Typography — Title (Text variant=headlineMedium)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | RN-wrapper | `headlineMedium` | `MaterialTheme.typography.headlineMedium` | Verify against Paper | n/a |
| text | RN-wrapper | `'Your Shadow is Ready'` | `Text("Your Shadow is Ready")` | `Text("Your Shadow is Ready")` | n/a |
| textAlign | RN-wrapper | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Body (Text variant=bodyLarge)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | RN-wrapper | `bodyLarge` | `MaterialTheme.typography.bodyLarge` | Verify against Paper | n/a |
| text | RN-wrapper | `'You can now start exploring routes with your AI companion.'` | `Text(...)` | `Text(...)` | n/a |
| textAlign | RN-wrapper | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Layout — Button Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| alignSelf | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity, alignment: .center)` | n/a |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |

### Button — Start Riding (Button)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| title | RN-wrapper | `'Start Riding'` | Passed to Button | Passed to Button | n/a |
| onPress | RN-wrapper | `onStartRiding` | Passed to Button | Passed to Button | n/a |
| variant | RN-wrapper | `'default'` (primary) | `variant = ButtonVariant.Default` | `variant = .default` | n/a |

---

## NOTES

- **Success state:** Green/success background for logo container
- **Logo:** 50px LaneShadowLogo centered in 80px success circle
- **Elevation:** Logo container has elevation[3]
- **Title:** "Your Shadow is Ready" (headlineMedium, centered)
- **Body:** Explains ready to explore (bodyLarge, centered, muted color)
- **Button:** Full-width primary button "Start Riding"
- **Spacing:** 24px gaps between all elements
- **Safe area:** Handled via insets
- **Callback:** onStartRiding marks setup complete and enters main app
- **TestID propagation:** All interactive elements get testID suffixes
