# UI-056: iOS templates 2/2 — infra wrappers: `BottomSheetWrapper`, `BottomActionSheet`, `ThemeErrorBoundary`, `ModelGatekeeperProvider`, `ButtonUsage`

**Task ID:** UI-056
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 240 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Templates
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `templates` slice for `iOS templates 2/2 — infra wrappers: BottomSheetWrapper, BottomActionSheet, ThemeErrorBoundary, ModelGatekeeperProvider, ButtonUsage`.

**Objective:** Implement iOS templates 2/2 — infra wrappers: `BottomSheetWrapper`, `BottomActionSheet`, `ThemeErrorBoundary`, `ModelGatekeeperProvider`, `ButtonUsage` as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `BottomSheetWrapper`, `BottomActionSheet`, `ThemeErrorBoundary`, `ModelGatekeeperProvider`, `ButtonUsage`.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Respect safe-area, layout shell, and background treatment parity without adding new primitives.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- ios/LaneShadow/Views/Templates/**
- ios/LaneShadow/Sandbox/Stories/TemplatesStories.swift — @MainActor enum with `static let all: [Story]`, aggregated into LaneShadowStories.all
- ios/LaneShadowTests/**
- ios/LaneShadowSnapshotTests/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `BottomSheetWrapper`, `BottomActionSheet`, `ThemeErrorBoundary`, `ModelGatekeeperProvider`, `ButtonUsage`.
**Verify:** `printf "%s\n" "`BottomSheetWrapper`, `BottomActionSheet`, `ThemeErrorBoundary`, `ModelGatekeeperProvider`, `ButtonUsage`"`

### AC-2
**GIVEN** Sprint 2 requires token-only styling and light and dark support.
**WHEN** The task scenarios render in the sandbox.
**THEN** All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives.
**Verify:** `rg -n "Token consumption|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md`

### AC-3
**GIVEN** Every translated component must be reviewable before rider-facing wiring resumes.
**WHEN** Sandbox scenarios are registered for this task.
**THEN** Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable.
**Verify:** `rg -n "RN reference|scenario|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`

### AC-4
**GIVEN** Parity includes behavior as well as visuals.
**WHEN** The task is validated against the parity spec.
**THEN** Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family.
**Verify:** `rg -n "Accessibility|Keyboard handling|RTL support|Animation parity|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md`

### AC-5
**GIVEN** native-sandbox is installed and a DEBUG build is running.
**WHEN** `make ios_sandbox` launches the sandbox (passes `-LaneShadowSandbox` arg to the app).
**THEN** every component listed in DELIVERABLES has at least one `Story(id: "<tier>.<component>.<state>", tier: .<tier>, component: "<Name>", name: "<State>", summary: "<rn-reference-path>") { _ in <SwiftUI usage> }` registered in `LaneShadowStories.all` and renders in the story-tree drawer under its tier, wrapped by `themedPreview { $0.laneShadowTheme() }`.

**Launch:** `make ios_sandbox` (canonical). Secondary: device shake (simulator: `xcrun simctl io booted shake`) or `xcrun simctl launch <id> com.laneshadow.app -LaneShadowSandbox`.

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `BottomSheetWrapper`, `BottomActionSheet`, `ThemeErrorBoundary`, `ModelGatekeeperProvider`, `ButtonUsage`. | `printf "%s\n" "`BottomSheetWrapper`, `BottomActionSheet`, `ThemeErrorBoundary`, `ModelGatekeeperProvider`, `ButtonUsage`"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `pnpm type-check:native && swiftformat --lint ios/LaneShadow --config .swiftformat && xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `RULES.md`
6. `.spec/prds/native-rewrite/08c-ios-component-map.md`

## GUARDRAILS

### WRITE-ALLOWED
- ios/LaneShadow/Views/Templates/**
- ios/LaneShadow/Sandbox/**
- ios/LaneShadowTests/**
- ios/LaneShadowSnapshotTests/**
- ios/LaneShadowUITests/**

### WRITE-PROHIBITED
- android/**
- server/**
- convex/**
- Any unrelated sprint folders outside .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/**

### MUST
- Follow the parity contract in `.spec/prds/native-rewrite/08d-component-parity-spec.md`.
- Keep sandbox scenarios deterministic and labeled with RN reference paths.
- Limit changes to the component family or sandbox or reporting surface owned by this task.

### MUST NOT
- Do not add backend or auth dependencies just to render scenarios.
- Do not modify unrelated platform directories or downstream sprint artifacts.

## CODE PATTERN

**Reference:** `.spec/prds/native-rewrite/08c-ios-component-map.md`

**Pattern:** Single SwiftUI view with enum or binding-driven variants, theme environment consumption, and deterministic sandbox scenarios.

**Anti-pattern:** Default SwiftUI styling, live service dependencies, or platform-specific naming drift.

## TRANSLATION SOURCES

| Component | RN wrapper source | Framework primitives + `node_modules` paths | Native target file | Variants × sizes × states |
|---|---|---|---|---|
| BottomSheetWrapper | N/A (Gorhom wrapper parity) | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx` | `ios/LaneShadow/Views/Templates/BottomSheetWrapper.swift` | 1 wrapper × 2 states (visible/dismissed) |
| BottomActionSheet | `react-native/components/ui/bottom-action-sheet.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetModal/BottomSheetModal.tsx`; `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetBackdrop/BottomSheetBackdrop.tsx` | `ios/LaneShadow/Views/Templates/BottomActionSheet.swift` | 1 sheet × 2 variants (hasTextInput true/false) |
| ThemeErrorBoundary | `react-native/components/logging/error-boundary.tsx` | `node_modules/react/src/React.js` (ErrorBoundary pattern) | `ios/LaneShadow/Views/Templates/ThemeErrorBoundary.swift` | 1 wrapper × 2 states (normal/error) |
| ModelGatekeeperProvider | `react-native/components/gatekeeper/model-gatekeeper-provider.tsx` | `node_modules/react/src/React.js` (Context pattern) | `ios/LaneShadow/Views/Templates/ModelGatekeeperProvider.swift` | 1 provider × 2 states (locked/unlocked) |
| ButtonUsage | `react-native/components/ui/button.usage.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Templates/ButtonUsage.swift` | Documentation examples (no runtime) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### BottomSheetWrapper

**Source files read:**
- LaneShadow: N/A (Gorhom wrapper parity)
- Framework: `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | snapPoints | Gorhom default | `['90%']` | `BottomSheetScaffold(sheetPeekHeight = 0.9f * screenHeight)` | `presentationDetent([.large])` | n/a |
| Layout | topInset | Gorhom default | `insets.top` | `WindowInsets.statusBars.asPaddingValues()` | `safeAreaInsets.top` | n/a (safe area) |
| Interaction | enablePanDownToClose | Gorhom default | `true` | `BottomSheetScaffold(sheetSwipeEnabled = true)` | `.presentationDragIndicator(.visible)` | n/a |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| Visual | handleComponent | RN-wrapper | `null` (hidden) | no handle | `.dragIndicator(.hidden())` | n/a |
| Visual | backdropComponent | Gorhom | `BottomSheetBackdrop` with opacity 0.5 | `ModalBottomSheet(scrimColor = Color.Black.copy(alpha = 0.5f))` | `.presentationBackground(.regularMaterial)` | ESCALATE — propose `opacity.scrim = 0.5` |

### BottomActionSheet

**Source files read:**
- LaneShadow: `react-native/components/ui/bottom-action-sheet.tsx`
- Framework: `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetModal/BottomSheetModal.tsx`, `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetBackdrop/BottomSheetBackdrop.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | snapPoints | RN-wrapper | `['90%']` (customizable) | `BottomSheetScaffold(sheetPeekHeight = 0.9f * screenHeight)` | `presentationDetent([.large])` | n/a |
| Layout | topInset | RN-wrapper | `insets.top` | `WindowInsets.statusBars.asPaddingValues()` | `safeAreaInsets.top` | n/a (safe area) |
| Layout | stackBehavior | RN-wrapper | `'push'` | `BottomSheetScaffold(sheetSkipPeeked = false)` | `.presentationDetent(.medium, .large)` | n/a |
| Interaction | enablePanDownToClose | RN-wrapper | `true` | `BottomSheetScaffold(sheetSwipeEnabled = true)` | `.presentationDragIndicator(.visible)` | n/a |
| Interaction | keyboardBehavior (hasTextInput=true) | RN-wrapper | `'interactive'` | `WindowInsets.ime` (Compose) | `.keyboard(.interactive)` | n/a |
| Interaction | keyboardBehavior (hasTextInput=false) | RN-wrapper | `'fillParent'` | `WindowInsets.ime` (Compose) | `.keyboard(.default)` | n/a |
| Interaction | android_keyboardInputMode | RN-wrapper | `'adjustResize'` | `WindowInsets.ime` (Compose) | n/a (iOS-only) | n/a |
| Interaction | keyboardBlurBehavior (hasTextInput=true) | RN-wrapper | `'restore'` | n/a | n/a | n/a |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| Visual | handleComponent | RN-wrapper | `null` (hidden) | no handle | `.dragIndicator(.hidden())` | n/a |
| Visual | backdropComponent | RN-wrapper | `BottomSheetBackdrop` with opacity 0.5 | `ModalBottomSheet(scrimColor = Color.Black.copy(alpha = 0.5f))` | `.presentationBackground(.regularMaterial)` | ESCALATE — propose `opacity.scrim = 0.5` |
| Visual | backdrop pressBehavior | RN-wrapper | `'close'` | `ModalBottomSheet(onDismissRequest = ...)` | `.presentationBackground(.interactive)` | n/a |

### ThemeErrorBoundary

**Source files read:**
- LaneShadow: `react-native/components/logging/error-boundary.tsx`
- Framework: `node_modules/react/src/React.js` (ErrorBoundary pattern)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | pattern | RN-wrapper | class component wrapper | `LaunchedEffect + try/catch` or `ViewModel` | `.task { try { ... } catch { ... } }` | n/a |
| Visual | error screen | RN-wrapper | centered View with Text | `Column(horizontalAlignment = Alignment.CenterHorizontally)` | `VStack { ... }` | n/a |
| Visual | error message | RN-wrapper | "Something went wrong." | `Text("Something went wrong.")` | `Text("Something went wrong.")` | n/a |
| Visual | error details (DEV) | RN-wrapper | `error.message` | `if (BuildConfig.DEBUG) Text(error.message)` | `if #DEBUG Text(error.localizedDescription)` | n/a |
| Visual | loadingContainer | RN-wrapper | `flex: 1, center` | `Box(contentAlignment = Alignment.Center)` | `VStack { Spacer(); ...; Spacer() }` | n/a |

### ModelGatekeeperProvider

**Source files read:**
- LaneShadow: `react-native/components/gatekeeper/model-gatekeeper-provider.tsx`
- Framework: `node_modules/react/src/React.js` (Context pattern)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | pattern | RN-wrapper | Context Provider with conditional rendering | `CompositionLocalProvider` | `@Environment` | n/a |
| State | modelValid | RN-wrapper | derived from `status` | `val modelValid: State<Boolean>` | `@Environment var modelValid: Bool` | n/a |
| State | hasCompletedOnboarding | RN-wrapper | Zustand store | `DataStore` | `@AppStorage` | n/a |
| State | isReady | RN-wrapper | `settingsHydrated && downloadHydrated` | `val isReady: Boolean` | `@State var isReady: Bool` | n/a |
| Layout | loadingContainer | RN-wrapper | `flex: 1, center` | `Box(contentAlignment = Alignment.Center)` | `VStack { Spacer(); ...; Spacer() }` | n/a |
| Visual | ActivityIndicator | RN-wrapper | `size="large"` | `CircularProgressIndicator()` | `ProgressView()` | n/a |
| Interaction | conditional rendering | RN-wrapper | if/else based on status | `when (status) { ... }` | `switch status { case ... }` | n/a |

### ButtonUsage

**Source files read:**
- LaneShadow: `react-native/components/ui/button.usage.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | pattern | RN-wrapper | Documentation/examples only | KDoc/examples | Doc examples | n/a |
| Visual | demo buttons | RN-wrapper | various Button variants | `Button(variant = ..., size = ...)` | `Button(variant: ..., size: ...)` | n/a |

---

## DESIGN NOTES

- Treat safe-area, background, and layout shell behavior as parity-sensitive design work, not platform defaults.
- Define detents, handles, scrim, keyboard avoidance, and safe-area behavior explicitly.
- Avoid default SwiftUI list, form, or navigation styling unless it is fully token-overridden and parity-approved.

## VERIFICATION GATES

- pnpm type-check:native
- swiftformat --lint ios/LaneShadow --config .swiftformat
- xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-052

## CODING STANDARDS

- .spec/prds/native-rewrite/08d-component-parity-spec.md — naming, interface, token, state, animation, accessibility, keyboard, and RTL parity
- .spec/prds/native-rewrite/08-design-system.md — token generation and consumption rules
- ~/Projects/brain/docs/TDD-METHODOLOGY.md — RED/GREEN/REFACTOR evidence expectations

## OUT OF SCOPE

- Feature wiring beyond sandbox-ready component translation.
- Changes to unrelated sprints or backend and server code.

---

## Native Sandbox Integration (added 2026-04-18)

`native-sandbox` is installed as a local SPM package (`NativeSandbox` product at `relativePath = ../../native-sandbox/ios`, linked into the LaneShadow target).

### Sandbox Deliverables (in addition to the component sources above)

- `ios/LaneShadow/Sandbox/Stories/<ComponentGroup>Stories.swift` — `@MainActor enum <Group>Stories { static let all: [Story] }` aggregated into `LaneShadowStories.all` at `ios/LaneShadow/Sandbox/LaneShadowStories.swift`.

### Sandbox Acceptance Criterion

**GIVEN** the NativeSandbox SPM package is linked and a DEBUG build is running.
**WHEN** the reviewer runs `make ios_sandbox` (or shakes the device / passes `-LaneShadowSandbox` arg).
**THEN** every component named in DELIVERABLES has at least one registered `Story(id: "<tier>.<component>.<state>", tier: .<tier>, component: "<Name>", name: "<State>", summary: "<rn-reference-path>") { _ in <SwiftUI usage> }` appearing in the sandbox story-tree drawer, wrapped by `previewWrapper: themedPreview { $0.laneShadowTheme() }` so the preview canvas inherits LaneShadow tokens while chrome stays neutral.

### Reviewer Launch

- **Primary:** `make ios_sandbox` (from repo root) — builds Debug, installs to simulator, launches with `-LaneShadowSandbox` arg.
- **Secondary:** device shake (simulator: `xcrun simctl io booted shake`), or `xcrun simctl launch <sim-id> com.laneshadow.app -LaneShadowSandbox`, or deep link `laneshadow-sandbox://sandbox`.

### Contract references

- `NativeSandbox.Story` — `id`, `tier` (`.atom|.molecule|.organism|.template|.screen`), `component`, `name`, `summary`, `content` view builder (`{ _ in ... }`).
- `NativeSandbox.SandboxRoot` — entry view; receives `stories`, optional `themeController`, `previewWrapper`.
- Swift 6 strict concurrency: Story containers MUST be `@MainActor` because `Story` is not Sendable.
- Chrome is theme-neutral by design; only the preview canvas is re-themed via `previewWrapper`.
