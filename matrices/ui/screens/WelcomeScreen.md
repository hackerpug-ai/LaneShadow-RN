# WelcomeScreen - STYLE PROPERTIES MATRIX

**Component:** WelcomeScreen
**RN Source:** `react-native/components/onboarding/welcome-screen.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Animated/Animated.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/onboarding/welcome-screen.tsx` | First screen of setup wizard |
| LaneShadowLogo | `react-native/components/auth/lane-shadow-logo.tsx` | Logo atom (see matrices/ui/atoms/LaneShadowLogo.md) |
| Button | `react-native/components/ui/button.tsx` | Button atom (see matrices/ui/atoms/Button.md) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography |

---

## NAVIGATION & ROUTING

| Aspect | RN | Android (Compose) | iOS (SwiftUI) |
|---|---|---|---|
| **Entry point** | Gatekeeper flow | `navController.navigate("welcome")` | NavigationLink `/welcome` |
| **Params** | `isDownloading: boolean` | `isDownloading: Boolean` | `isDownloading: Bool` |
| **Params** | `downloadProgress: ModelDownloadProgress` | `downloadProgress: ModelDownloadProgress` | `downloadProgress: ModelDownloadProgress` |
| **Transitions** | Fade in | `AnimatedContent(..., enter = fadeIn())` | `.opacity(...)` |
| **Back navigation** | None (first screen) | None | None |

---

## DATA FLOW

| Prop | Type | Source | Purpose |
|---|---|---|---|
| isDownloading | boolean | Parent state (ModelGatekeeperProvider) | Download state flag |
| downloadProgress | ModelDownloadProgress | Parent state (ModelGatekeeperProvider) | Progress data |
| onDownloadPress | () => void | Parent callback | Start download |
| onCancelPress | () => void (optional) | Parent callback | Cancel download |

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

### Layout — Logo Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| alignItems | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` + vertical | `.frame(alignment: .center)` | n/a |
| marginBottom | RN-wrapper | `semantic.space.xl` (= 24) | `Modifier.padding(bottom = 24.dp)` | `.padding(.bottom, 24)` | `space.xl` |

### Icon — Logo (LaneShadowLogo)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| size | RN-wrapper | `80` | `Modifier.size(80.dp)` | `.frame(width: 80, height: 80)` | ESCALATE — propose `size.welcomeLogo = 80` |

### Typography — Title (Text variant=headlineMedium)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | RN-wrapper | `headlineMedium` | `MaterialTheme.typography.headlineMedium` | Verify against Paper | n/a |
| text | RN-wrapper | `'Setup Your AI Companion'` | `Text("Setup Your AI Companion")` | `Text("Setup Your AI Companion")` | n/a |
| textAlign | RN-wrapper | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| marginBottom | RN-wrapper | `semantic.space.md` (= 12) | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |

### Typography — Body (Text variant=bodyLarge)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | RN-wrapper | `bodyLarge` | `MaterialTheme.typography.bodyLarge` | Verify against Paper | n/a |
| textAlign | RN-wrapper | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| marginBottom | RN-wrapper | `semantic.space.xl` (= 24) | `Modifier.padding(bottom = 24.dp)` | `.padding(.bottom, 24)` | `space.xl` |

### Layout — Feature Carousel (Animated.View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| height | RN-wrapper | `180` | `Modifier.height(180.dp)` | `.frame(height: 180)` | ESCALATE — propose `layout.featureCarouselHeight = 180` |
| marginBottom | RN-wrapper | `semantic.space.xl` (= 24) | `Modifier.padding(bottom = 24.dp)` | `.padding(.bottom, 24)` | `space.xl` |

### Layout — Progress Pill (View, downloading state)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderRadius | RN-wrapper | `semantic.radius.full` (= 9999) | `RoundedCornerShape(50.percent)` / `CircleShape` (if height = width) | `Capsule()` | `radius.full` |
| paddingVertical | RN-wrapper | `semantic.space.sm` (= 8) | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| paddingHorizontal | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| gap | RN-wrapper | `semantic.space.sm` (= 8) | `Arrangement.spacedBy(8.dp)` / `Modifier.padding(end = 8.dp)` between items | `spacing(8)` | `space.sm` |

### Visual — Progress Bar (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| width | RN-wrapper | Dynamic based on progress | `Modifier.fillMaxWidth(fraction = progress / 100)` | `.frame(maxWidth: .infinity).overlay(...).frame(width: geometry.size.width * progress / 100)` | n/a (dynamic) |
| height | RN-wrapper | `4` | `Modifier.height(4.dp)` | `.frame(height: 4)` | ESCALATE — propose `layout.progressBarHeight = 4` |
| backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| borderRadius | RN-wrapper | `2` | `RoundedCornerShape(2.dp)` | `RoundedRectangle(cornerRadius: 2)` | n/a |

### Typography — Progress Text (Text variant=labelMedium)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | RN-wrapper | `labelMedium` | `MaterialTheme.typography.labelMedium` | Verify against Paper | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

---

## NOTES

- **Two states:** Idle (setup button) and Downloading (progress pill + carousel)
- **Idle state:** Logo, title, body, setup button
- **Downloading state:** Progress pill, feature carousel
- **Feature carousel:** Auto-advances every 5 seconds, shows features with emoji, title, body
- **Progress pill:** Shows percentage and "Awakening Your Shadow..."
- **Progress bar:** 4px tall, primary color, rounded corners, fills based on progress
- **Logo size:** 80px (larger than standard 50px)
- **Spacing:** 24px gaps between sections
- **Safe area:** Handled via insets
- **Animation:** Feature carousel uses Animated timing for transitions
- **TestID propagation:** All interactive elements get testID suffixes
