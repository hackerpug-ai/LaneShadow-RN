# ModelGatekeeperProvider - STYLE PROPERTIES MATRIX

**Component:** ModelGatekeeperProvider
**RN Source:** `react-native/components/gatekeeper/model-gatekeeper-provider.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/gatekeeper/model-gatekeeper-provider.tsx` | Root provider enforcing model download gatekeeper |
| WelcomeScreen | `react-native/components/onboarding/welcome-screen.tsx` | Welcome screen (see matrices/ui/screens/WelcomeScreen.md) |
| CompletionScreen | `react-native/components/onboarding/completion-screen.tsx` | Completion screen (see matrices/ui/screens/CompletionScreen.md) |
| SetupRequiredScreen | `react-native/components/gatekeeper/setup-required-screen.tsx` | Setup required screen (see matrices/ui/screens/SetupRequiredScreen.md) |
| ActivityIndicator (RN) | `node_modules/react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js` | Loading indicator |

---

## LAYOUT COMPOSITION

**Purpose:** Root-level provider that enforces the gatekeeper system - prevents app usage until local AI model is downloaded, validated, and verified

**Composition pattern:**
- State provider wrapper around children
- Checks hydration of settings and download stores
- Shows loading while hydrating
- Skips gatekeeper if onboarding completed
- Routes to WelcomeScreen for required/downloading states
- Routes to SetupRequiredScreen for corrupted state
- Routes to CompletionScreen for valid state
- Renders children when model ready and onboarding complete

**Layout:** Conditional rendering based on gatekeeper state - loading, welcome, setup-required, completion, or main app

---

## STYLE PROPERTIES MATRIX

### Layout — Loading Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterVertically)` | `.frame(alignment: .center)` | n/a |
| alignItems | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` | Included above | n/a |

### Visual — ActivityIndicator

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| size | RN-wrapper | `'large'` | `Modifier.size(48.dp)` | `.controlSize(.large)` | n/a (platform) |

### Layout — Full Screen Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |

---

## STATE & BEHAVIOR

| State | Type | Source | Purpose |
|---|---|---|---|
| isReady | boolean (derived) | `settingsHydrated && downloadHydrated` | Both stores hydrated |
| isChecking | boolean | `useModelSetup().isChecking` | Checking model status |
| status | string | `useModelSetup().status` | Gatekeeper status (required/downloading/corrupted/valid) |
| hasCompletedOnboarding | boolean | `useSettingsStore(s => s.hasCompletedOnboarding)` | Onboarding completion flag |

**Routing logic:**
- `!isReady` → Show loading indicator
- `hasCompletedOnboarding` → Render children (skip gatekeeper)
- `isChecking` → Show loading indicator
- `status === 'required' or 'downloading'` → Show WelcomeScreen
- `status === 'corrupted'` → Show SetupRequiredScreen
- `status === 'valid'` → Show CompletionScreen

---

## NOTES

- **Root provider:** Wraps entire app
- **Store hydration:** Waits for both settings and download stores
- **Onboarding bypass:** If already completed, skips gatekeeper entirely
- **Model status:** Checks if model required, downloading, corrupted, or valid
- **Welcome flow:** Handles both "required" and "downloading" states
- **Setup required:** Shows when model is corrupted
- **Completion:** Shows when download complete but not yet confirmed
- **Main app:** Renders children when model valid and onboarding complete
- **TestID propagation:** All screens get testID prefix
- **Platform equivalent:** Android: LaunchedEffect + state, iOS: @StateObject + view switcher
