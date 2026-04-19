# ModelDownloadScreen - STYLE PROPERTIES MATRIX

**Component:** ModelDownloadScreen
**RN Source:** `react-native/components/setup/ModelDownloadScreen.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/setup/ModelDownloadScreen.tsx` | Alternative model download screen |
| ActivityIndicator (RN) | `node_modules/react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js` | Loading indicator |
| Text (RN) | `node_modules/react-native/Libraries/Text/Text.js` | Labels |
| Pressable (RN) | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Buttons |

---

## NAVIGATION & ROUTING

| Aspect | RN | Android (Compose) | iOS (SwiftUI) |
|---|---|---|---|
| **Entry point** | Setup flow | `navController.navigate("modelDownload")` | NavigationLink `/modelDownload` |
| **Params** | `onComplete: () => void` | `onComplete: () -> Unit` | `onComplete: () -> Void` |
| **Transitions** | Fade in | `AnimatedContent(..., enter = fadeIn())` | `.opacity(...)` |
| **Exit** | onComplete callback | Calls parent callback | Calls parent callback |

---

## DATA FLOW

| Prop | Type | Source | Purpose |
|---|---|---|---|
| onComplete | () => void | Parent callback | Complete setup and enter main app |

**Local state:**
- networkStatus: NetworkStatus (from state)
- downloadProgress: number (0-100)
- isDownloading: boolean
- error: string | null
- modelLoaded: boolean

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

### Layout — Loading Indicator (ActivityIndicator)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| size | RN-wrapper | `'large'` | `Modifier.size(48.dp)` | `.controlSize(.large)` | n/a (platform) |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Typography — Status Text (Text)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| fontSize | RN-wrapper | `16` | `16.sp` | `.font(.system(size: 16))` | ESCALATE — verify token |
| textAlign | RN-wrapper | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

---

## NOTES

- **WiFi requirement:** Enforces WiFi connection for download
- **Progress tracking:** Shows 0-100% progress
- **Storage validation:** Checks available space before download
- **Error handling:** User-friendly error messages
- **Resume support:** Can resume interrupted downloads
- **Loading state:** ActivityIndicator while checking/downloading
- **Completion:** Calls onComplete when download finishes
- **TestID propagation:** All interactive elements get testID suffixes

**Note:** This is an alternative download screen to DownloadProgressScreen. Check which is currently used in production.
