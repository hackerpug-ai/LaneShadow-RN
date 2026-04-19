# UI-026: iOS molecules 6/12 — map overlay UI: `ThemeMapHeaderOverlay`, `MapControls`, `ThemeMapPlanningIndicator`, `ThemeMinimalOverlayWidget`, `ThemeMinimalOverlayWidgetPreview`, `ThemeOverlayToggle`, `ThemePlanFAB`, `SearchResultMarker`, `WaypointMarker`

**Task ID:** UI-026
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Molecules
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `molecules` slice for `iOS molecules 6/12 — map overlay UI: ThemeMapHeaderOverlay, MapControls, ThemeMapPlanningIndicator, ThemeMinimalOverlayWidget, ThemeMinimalOverlayWidgetPreview, ThemeOverlayToggle, ThemePlanFAB, SearchResultMarker, WaypointMarker`.

**Objective:** Implement iOS molecules 6/12 — map overlay UI: `ThemeMapHeaderOverlay`, `MapControls`, `ThemeMapPlanningIndicator`, `ThemeMinimalOverlayWidget`, `ThemeMinimalOverlayWidgetPreview`, `ThemeOverlayToggle`, `ThemePlanFAB`, `SearchResultMarker`, `WaypointMarker` as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `ThemeMapHeaderOverlay`, `MapControls`, `ThemeMapPlanningIndicator`, `ThemeMinimalOverlayWidget`, `ThemeMinimalOverlayWidgetPreview`, `ThemeOverlayToggle`, `ThemePlanFAB`, `SearchResultMarker`, `WaypointMarker`.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Compose only from already-defined atoms on the same platform and preserve RN layout hierarchy.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- ios/LaneShadow/Views/Molecules/**
- ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift — @MainActor enum with `static let all: [Story]`, aggregated into LaneShadowStories.all
- ios/LaneShadowTests/**
- ios/LaneShadowSnapshotTests/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `ThemeMapHeaderOverlay`, `MapControls`, `ThemeMapPlanningIndicator`, `ThemeMinimalOverlayWidget`, `ThemeMinimalOverlayWidgetPreview`, `ThemeOverlayToggle`, `ThemePlanFAB`, `SearchResultMarker`, `WaypointMarker`.
**Verify:** `printf "%s\n" "`ThemeMapHeaderOverlay`, `MapControls`, `ThemeMapPlanningIndicator`, `ThemeMinimalOverlayWidget`, `ThemeMinimalOverlayWidgetPreview`, `ThemeOverlayToggle`, `ThemePlanFAB`, `SearchResultMarker`, `WaypointMarker`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `ThemeMapHeaderOverlay`, `MapControls`, `ThemeMapPlanningIndicator`, `ThemeMinimalOverlayWidget`, `ThemeMinimalOverlayWidgetPreview`, `ThemeOverlayToggle`, `ThemePlanFAB`, `SearchResultMarker`, `WaypointMarker`. | `printf "%s\n" "`ThemeMapHeaderOverlay`, `MapControls`, `ThemeMapPlanningIndicator`, `ThemeMinimalOverlayWidget`, `ThemeMinimalOverlayWidgetPreview`, `ThemeOverlayToggle`, `ThemePlanFAB`, `SearchResultMarker`, `WaypointMarker`"` |
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
- ios/LaneShadow/Views/Molecules/**
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
| ThemeMapHeaderOverlay | `react-native/components/map/map-header-overlay.tsx` | `expo-linear-gradient` (LinearGradient); `react-native-safe-area-context` (useSafeAreaInsets) | `ios/LaneShadow/Views/Molecules/ThemeMapHeaderOverlay.swift` | 2 layouts (with/without background) × optional left/right actions |
| MapControls | `react-native/components/map/map-controls.tsx` | `react-native/Libraries/Components/Pressable/Pressable.js`; `react-native-paper/src/components/Icon/Icon.js` | `ios/LaneShadow/Views/Molecules/MapControls.swift` | 2 modes (map/chat) × 5 buttons (zoom in/out/recenter/layers/save) × optional labels |
| ThemeMapPlanningIndicator | `react-native/components/map/map-planning-indicator.tsx` | `react-native-reanimated` (FadeIn/FadeOut); `react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js` | `ios/LaneShadow/Views/Molecules/ThemeMapPlanningIndicator.swift` | 1 layout × visible/hidden × bottom offset positioning |
| ThemeMinimalOverlayWidget | `react-native/components/map/minimal-overlay-widget.tsx` | `react-native-reanimated` (spring/timing animations); `react-native/Libraries/Components/Pressable/Pressable.js` | `ios/LaneShadow/Views/Molecules/ThemeMinimalOverlayWidget.swift` | 3 overlays (wind/rain/temperature) × 2 states (collapsed/expanded) × availability flags |
| ThemeMinimalOverlayWidgetPreview | `react-native/components/map/minimal-overlay-widget-preview.tsx` | `react-native/Libraries/Components/ScrollView/ScrollView.js` (horizontal); `react-native/Libraries/Components/Pressable/Pressable.js` | `ios/LaneShadow/Sandbox/Stories/ThemeMinimalOverlayWidgetPreviewStories.swift` | 4 scenarios (all/wind-only/rain+temp/none) × demo showcase |
| ThemeOverlayToggle | `react-native/components/map/overlay-toggle.tsx` | `react-native/Libraries/Components/Pressable/Pressable.js`; `react-native-paper/src/components/ToggleGroup/ToggleGroup.js` | `ios/LaneShadow/Views/Molecules/ThemeOverlayToggle.swift` | 3 overlays (wind/rain/temperature) × single-select × disabled states |
| ThemePlanFAB | `react-native/components/map/plan-fab.tsx` | `react-native-safe-area-context` (useSafeAreaInsets); `react-native-paper/src/components/IconButton/IconButton.js` | `ios/LaneShadow/Views/Molecules/ThemePlanFAB.swift` | 1 fixed layout × safe-area bottom positioning |
| SearchResultMarker | `react-native/components/map/search-result-marker.tsx` | `@rnmapbox/maps` (MarkerView); `expo-haptics` (Haptics.impactAsync); `react-native-svg` (Svg, Circle) | `ios/LaneShadow/Views/Molecules/SearchResultMarker.swift` | Numbered marker (1-based index) × 2 states (default/selected) × tap feedback |
| WaypointMarker | `react-native/components/map/waypoint-marker.tsx` | `@rnmapbox/maps` (MarkerView); `expo-haptics` (Haptics.impactAsync); `react-native-svg` (Svg, Circle, Path, G) | `ios/LaneShadow/Views/Molecules/WaypointMarker.swift` | Pin-shaped marker × 3 kinds (on-route/off-route/mixed) × 4 states (default/selected/pressed/disabled) × optional index |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

> **NOTE:** iOS equivalents below reference SwiftUI modifiers. For detailed Android mappings, see UI-025 (Android molecules 6/12) which shares the same RN wrapper sources.

### ThemeMapHeaderOverlay, MapControls, ThemeMapPlanningIndicator, ThemeMinimalOverlayWidget, ThemeOverlayToggle, ThemePlanFAB, SearchResultMarker, WaypointMarker

> **NOTE:** For all map overlay UI components, the iOS mappings follow the same pattern as Android — using SwiftUI equivalents for React Native primitives. See UI-025 for complete property matrices. Key differences:
> - `View` → `VStack`/`HStack`/`ZStack`
> - `Text` → `Text` with `.font()` modifiers
> - `Pressable` → `Button` with `.buttonStyle()`
> - `ScrollView` → `ScrollView`/`LazyHStack`/`LazyVStack`
> - `ActivityIndicator` → `ProgressView()` (iOS native activity indicator)
> - `Animated.View` with `FadeIn/FadeOut` → `.transition(.opacity)` or `.animation()`
> - `StyleSheet.hairlineWidth` → `1` (use explicit 1pt on iOS)
> - `rgba()` color utilities → `.opacity()` modifier on Color
> - `useSemanticTheme()` → `@Environment(\.theme)` or `.laneShadowTheme()` modifier
> - `useSafeAreaInsets()` → `GeometryReader` { $0.safeAreaInsets } or `.safeAreaInset()`
> - `@rnmapbox/maps` (MarkerView) → Mapbox SDK for iOS native annotations
> - `expo-haptics` (Haptics.impactAsync) → `UIImpactFeedbackGenerator(style: .light).impactOccurred()`
> - `react-native-svg` → SwiftUI native `Shape` or `Path` drawing with `Circle()`
> - `expo-linear-gradient` → SwiftUI native `LinearGradient`
> - `react-native-reanimated` animations → SwiftUI native `.animation(.spring())` or `.transition()`

## DESIGN NOTES

- Preserve RN spacing, composition hierarchy, and edge-case fixtures such as long labels, loading, and error states.
- Use fixed cameras, fixed coordinates, and deterministic map visuals for screenshot capture.
- Avoid default SwiftUI list, form, or navigation styling unless it is fully token-overridden and parity-approved.

## VERIFICATION GATES

- pnpm type-check:native
- swiftformat --lint ios/LaneShadow --config .swiftformat
- xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-014

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
