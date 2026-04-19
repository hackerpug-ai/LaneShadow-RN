# DownloadProgressScreen - STYLE PROPERTIES MATRIX

**Component:** DownloadProgressScreen
**RN Source:** `react-native/components/onboarding/download-progress-screen.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/onboarding/download-progress-screen.tsx` | Model download progress screen |
| Progress | `react-native/components/ui/progress.tsx` | Progress atom (see matrices/ui/atoms/Progress.md) |
| Button | `react-native/components/ui/button.tsx` | Button atom (see matrices/ui/atoms/Button.md) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography |

---

## NAVIGATION & ROUTING

| Aspect | RN | Android (Compose) | iOS (SwiftUI) |
|---|---|---|---|
| **Entry point** | Onboarding flow | `navController.navigate("downloadProgress")` | NavigationLink `/downloadProgress` |
| **Params** | `progress: ModelDownloadProgress` | `progress: ModelDownloadProgress` | `progress: ModelDownloadProgress` |
| **Transitions** | Fade in | `AnimatedContent(..., enter = fadeIn())` | `.opacity(...)` |
| **Exit** | onCancelPress callback | Calls parent callback | Calls parent callback |

---

## DATA FLOW

| Prop | Type | Source | Purpose |
|---|---|---|---|
| progress | ModelDownloadProgress | Parent state (ModelGatekeeperProvider) | Download progress data |
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
| gap | RN-wrapper | `semantic.space.xl` (= 24) | `Arrangement.spacedBy(24.dp)` / `Modifier.padding(end = 24.dp)` between items | `spacing(24)` | `space.xl` |

### Typography — Title (Text variant=headlineMedium)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | RN-wrapper | `headlineMedium` | `MaterialTheme.typography.headlineMedium` | Verify against Paper | n/a |
| text | RN-wrapper | `'Awakening Your Shadow'` | `Text("Awakening Your Shadow")` | `Text("Awakening Your Shadow")` | n/a |
| textAlign | RN-wrapper | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Progress Section (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| gap | RN-wrapper | `semantic.space.md` (= 12) | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |
| marginBottom | RN-wrapper | `semantic.space.xl` (= 24) | `Modifier.padding(bottom = 24.dp)` | `.padding(.bottom, 24)` | `space.xl` |

### Typography — Percentage (Text variant=displaySmall)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | RN-wrapper | `displaySmall` | `MaterialTheme.typography.displaySmall` | Verify against Paper | n/a |
| text | RN-wrapper | `'${progress.percent}%'` | `Text("${progress.percent}%")` | `Text("\(progress.percent)%")` | n/a |
| textAlign | RN-wrapper | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Progress Bar — (Progress component)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| value | RN-wrapper | `progress.percent / 100` | `value = progress.percent / 100f` | `value = progress.percent / 100` | n/a (dynamic) |
| max | RN-wrapper | `1` | Included above (0-1 range) | Included above (0-1 range) | n/a |

### Typography — Time Remaining (Text variant=labelLarge)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | RN-wrapper | `labelLarge` | `MaterialTheme.typography.labelLarge` | Verify against Paper | n/a |
| text | RN-wrapper | `'${formatTimeRemaining(progress.estimatedSecondsRemaining)} remaining'` | `Text("... remaining")` | `Text("... remaining")` | n/a |
| textAlign | RN-wrapper | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Typography — Downloaded Size (Text variant=labelLarge)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | RN-wrapper | `labelLarge` | `MaterialTheme.typography.labelLarge` | Verify against Paper | n/a |
| text | RN-wrapper | `'${formatBytes(progress.downloadedBytes)} / ${formatBytes(progress.totalBytes)}'` | `Text("... / ...")` | `Text("... / ...")` | n/a |
| textAlign | RN-wrapper | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Button — Cancel (Button, optional)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| title | RN-wrapper | `'Cancel'` | Passed to Button | Passed to Button | n/a |
| onPress | RN-wrapper | `onCancelPress` | Passed to Button | Passed to Button | n/a |
| variant | RN-wrapper | `'secondary'` (optional) | `variant = ButtonVariant.Secondary` | `variant = .secondary` | n/a |

---

## NOTES

- **Title:** "Awakening Your Shadow" (headlineMedium, centered)
- **Percentage:** Large display text showing progress percent (displaySmall, primary color)
- **Progress bar:** 0-1 range, fills based on percent/100
- **Time remaining:** Formatted as "Xm remaining" or "Xh Xm remaining"
- **Size info:** Shows "XXX MB / YYY MB" format
- **Cancel button:** Optional, allows interrupting download
- **Spacing:** 24px gaps between major sections, 12px within progress section
- **Safe area:** Handled via insets
- **Formatter:** `formatTimeRemaining()` converts seconds to readable string
- **Formatter:** `formatBytes()` converts bytes to MB/GB
- **TestID propagation:** All interactive elements get testID suffixes
