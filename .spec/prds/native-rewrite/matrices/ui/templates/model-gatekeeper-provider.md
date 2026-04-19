# ModelGatekeeperProvider — STYLE PROPERTIES MATRIX

**Component:** ModelGatekeeperProvider
**Level:** Template (State Provider)
**Source:** `react-native/components/gatekeeper/model-gatekeeper-provider.tsx`
**Platform Mapping:** Android `State` + `CompositionLocalProvider`, iOS `@Environment` + `Observable`

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| State | `react-native/components/gatekeeper/model-gatekeeper-provider.tsx` | `react-native/Libraries/Context/Context.js` | Android: `app/src/main/java/com/laneshadow/ui/templates/ModelGatekeeperProvider.kt`<br>iOS: `app/ui/templates/ModelGatekeeperProvider.swift` | 1 fixed state provider |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### State — Provider

**Source files read:**
- LaneShadow: `react-native/components/gatekeeper/model-gatekeeper-provider.tsx`
- Framework: `react-native/Libraries/Context/Context.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| State | contextValue | RN-wrapper | `ModelGatekeeperState` | `CompositionLocalProvider(LocalModelGatekeeper provides ...)` | `@Environment(\.modelGatekeeper)` | n/a |
| State | modelDownloaded | RN-wrapper | `boolean` | `State<ModelGatekeeperState>` | `@Published var modelDownloaded: Bool` | n/a |
| State | isDownloading | RN-wrapper | `boolean` | `State<ModelGatekeeperState>` | `@Published var isDownloading: Bool` | n/a |
| State | downloadProgress | RN-wrapper | `number` (0-100) | `State<ModelGatekeeperState>` | `@Published var downloadProgress: Double` | n/a |
| State | requiredForFeature | RN-wrapper | `string[]` (feature list) | `State<ModelGatekeeperState>` | `@Published var requiredForFeature: [String]` | n/a |

---

## DESIGN NOTES

- **State provider** — no visual styling
- Provides model gatekeeper state to child components
- Used to control access to AI features
- Shows setup prompts when model not downloaded
- Tracks download progress

---

## VERIFICATION GATES

- State accessible to child components
- Model status correctly tracked
- Feature gating works
- Download progress updates

---

## DEPENDENCIES

- UI-001 (core theme contract)
- State management (Android `State`, iOS `@Observable`)
- Model download system
- SetupRequiredScreen component

---

## BEHAVIOR

- Wraps app root or feature subtree
- Checks model availability on mount
- Shows SetupRequiredScreen if model missing
- Tracks download progress
- Unlocks features when model ready
