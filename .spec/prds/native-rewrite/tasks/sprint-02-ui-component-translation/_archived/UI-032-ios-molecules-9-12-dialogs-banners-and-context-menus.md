# UI-032: iOS molecules 9/12 — dialogs, banners & context menus: `ThemeDeleteRouteDialog`, `ThemeRenameRouteDialog`, `DeleteFavoriteDialog`, `SaveFavoriteSheet`, `FavoriteExclusionAlert`, `ThemeSessionContextMenu`, `ThemeNewSessionButton`, `ThemeConnectionBanner`, `ThemePermissionNotification`, `ThemeFavoritesInfoSheet`, `ThemePlanningErrorSheet`, `ThemePlanningLoading`, `ThemeTogglesContainer`, `SaveRouteConfirmationSheet`

**Task ID:** UI-032
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 720 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Molecules
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `molecules` slice for `iOS molecules 9/12 — dialogs, banners & context menus: ThemeDeleteRouteDialog, ThemeRenameRouteDialog, DeleteFavoriteDialog, SaveFavoriteSheet, FavoriteExclusionAlert, ThemeSessionContextMenu, ThemeNewSessionButton, ThemeConnectionBanner, ThemePermissionNotification, ThemeFavoritesInfoSheet, ThemePlanningErrorSheet, ThemePlanningLoading, ThemeTogglesContainer, SaveRouteConfirmationSheet`.

**Objective:** Implement iOS molecules 9/12 — dialogs, banners & context menus: `ThemeDeleteRouteDialog`, `ThemeRenameRouteDialog`, `DeleteFavoriteDialog`, `SaveFavoriteSheet`, `FavoriteExclusionAlert`, `ThemeSessionContextMenu`, `ThemeNewSessionButton`, `ThemeConnectionBanner`, `ThemePermissionNotification`, `ThemeFavoritesInfoSheet`, `ThemePlanningErrorSheet`, `ThemePlanningLoading`, `ThemeTogglesContainer`, `SaveRouteConfirmationSheet` as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `ThemeDeleteRouteDialog`, `ThemeRenameRouteDialog`, `DeleteFavoriteDialog`, `SaveFavoriteSheet`, `FavoriteExclusionAlert`, `ThemeSessionContextMenu`, `ThemeNewSessionButton`, `ThemeConnectionBanner`, `ThemePermissionNotification`, `ThemeFavoritesInfoSheet`, `ThemePlanningErrorSheet`, `ThemePlanningLoading`, `ThemeTogglesContainer`, `SaveRouteConfirmationSheet`.
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
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `ThemeDeleteRouteDialog`, `ThemeRenameRouteDialog`, `DeleteFavoriteDialog`, `SaveFavoriteSheet`, `FavoriteExclusionAlert`, `ThemeSessionContextMenu`, `ThemeNewSessionButton`, `ThemeConnectionBanner`, `ThemePermissionNotification`, `ThemeFavoritesInfoSheet`, `ThemePlanningErrorSheet`, `ThemePlanningLoading`, `ThemeTogglesContainer`, `SaveRouteConfirmationSheet`.
**Verify:** `printf "%s\n" "`ThemeDeleteRouteDialog`, `ThemeRenameRouteDialog`, `DeleteFavoriteDialog`, `SaveFavoriteSheet`, `FavoriteExclusionAlert`, `ThemeSessionContextMenu`, `ThemeNewSessionButton`, `ThemeConnectionBanner`, `ThemePermissionNotification`, `ThemeFavoritesInfoSheet`, `ThemePlanningErrorSheet`, `ThemePlanningLoading`, `ThemeTogglesContainer`, `SaveRouteConfirmationSheet`"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `ThemeDeleteRouteDialog`, `ThemeRenameRouteDialog`, `DeleteFavoriteDialog`, `SaveFavoriteSheet`, `FavoriteExclusionAlert`, `ThemeSessionContextMenu`, `ThemeNewSessionButton`, `ThemeConnectionBanner`, `ThemePermissionNotification`, `ThemeFavoritesInfoSheet`, `ThemePlanningErrorSheet`, `ThemePlanningLoading`, `ThemeTogglesContainer`, `SaveRouteConfirmationSheet`. | `printf "%s\n" "`ThemeDeleteRouteDialog`, `ThemeRenameRouteDialog`, `DeleteFavoriteDialog`, `SaveFavoriteSheet`, `FavoriteExclusionAlert`, `ThemeSessionContextMenu`, `ThemeNewSessionButton`, `ThemeConnectionBanner`, `ThemePermissionNotification`, `ThemeFavoritesInfoSheet`, `ThemePlanningErrorSheet`, `ThemePlanningLoading`, `ThemeTogglesContainer`, `SaveRouteConfirmationSheet`"` |
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
| ThemeDeleteRouteDialog | `react-native/components/ui/delete-route-dialog.tsx` | `node_modules/react-native-paper/src/components/Dialog/Dialog.tsx`; `node_modules/react-native-paper/src/components/Button/Button.tsx` | `ios/LaneShadow/Views/Molecules/ThemeDeleteRouteDialog.swift` | 1 variant × 2 actions (cancel/confirm) |
| ThemeRenameRouteDialog | `react-native/components/ui/rename-route-dialog.tsx` | `node_modules/react-native-paper/src/components/Dialog/Dialog.tsx`; `node_modules/react-native-paper/src/components/TextInput/TextInput.tsx` | `ios/LaneShadow/Views/Molecules/ThemeRenameRouteDialog.swift` | 1 variant × 3 states (idle/valid/invalid) × 2 actions |
| DeleteFavoriteDialog | `react-native/components/ui/delete-favorite-dialog.tsx` | `node_modules/react-native-paper/src/components/Dialog/Dialog.tsx` | `ios/LaneShadow/Views/Molecules/DeleteFavoriteDialog.swift` | 1 variant × 2 actions (cancel/confirm) |
| SaveFavoriteSheet | `react-native/components/ui/save-favorite-sheet.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`; `node_modules/react-native-paper/src/components/TextInput/TextInput.tsx` | `ios/LaneShadow/Views/Molecules/SaveFavoriteSheet.swift` | 1 variant × 3 states (idle/saving/error) |
| FavoriteExclusionAlert | `react-native/components/ui/favorite-exclusion-alert.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `ios/LaneShadow/Views/Molecules/FavoriteExclusionAlert.swift` | 1 variant × auto-dismiss (10s) |
| ThemeSessionContextMenu | `react-native/components/ui/session-context-menu.tsx` | `node_modules/react-native/Libraries/Modal/Modal.js`; `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `ios/LaneShadow/Views/Molecules/ThemeSessionContextMenu.swift` | Modal positioned menu × N items × destructive variant |
| ThemeNewSessionButton | `react-native/components/ui/new-session-button.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `ios/LaneShadow/Views/Molecules/ThemeNewSessionButton.swift` | 3 variants (header/fab/text) × 3 sizes (sm/md/lg) × 2 states (idle/disabled) |
| ThemeConnectionBanner | `react-native/components/ui/connection-banner.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `ios/LaneShadow/Views/Molecules/ThemeConnectionBanner.swift` | 1 fixed variant |
| ThemePermissionNotification | `react-native/components/ui/permission-notification.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`; `node_modules/react-native-safe-area-context/src/NativeSafeAreaProvider.tsx` | `ios/LaneShadow/Views/Molecules/ThemePermissionNotification.swift` | 1 variant × optional action button × safe-area top |
| ThemeFavoritesInfoSheet | `react-native/components/sheets/favorites-info-sheet.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx` | `ios/LaneShadow/Views/Molecules/ThemeFavoritesInfoSheet.swift` | 1 variant × list content |
| ThemePlanningErrorSheet | `react-native/components/sheets/planning-error-sheet.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx` | `ios/LaneShadow/Views/Molecules/ThemePlanningErrorSheet.swift` | 1 variant × 2 actions (try again/back) |
| ThemePlanningLoading | `react-native/components/sheets/planning-loading.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-paper/src/components/ActivityIndicator/ActivityIndicator.tsx` | `ios/LaneShadow/Views/Molecules/ThemePlanningLoading.swift` | Full-screen scrim × activity indicator × cancel button |
| ThemeTogglesContainer | `react-native/components/sheets/toggles-container.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; Switch atom | `ios/LaneShadow/Views/Molecules/ThemeTogglesContainer.swift` | 2 toggles (avoid highways/avoid tolls) × icon containers |
| SaveRouteConfirmationSheet | `react-native/components/sheets/save-route-confirmation-sheet.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`; `node_modules/react-native-paper/src/components/TextInput/TextInput.tsx` | `ios/LaneShadow/Views/Molecules/SaveRouteConfirmationSheet.swift` | 1 variant × 3 states (idle/saving/error) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

> **Note:** The iOS components use the same source files as Android, so the style properties are identical. Refer to UI-031 for the complete STYLE PROPERTIES MATRIX. The iOS equivalents are already documented in the Android table's "iOS equivalent" column. Key differences:
> - Use SwiftUI native primitives: `Alert`, `sheet`, `presentationDetents`, `confirmationDialog`
> - Shadow via `.shadow(color:radius:y:)`, elevation via `.shadow(...)` with radius
> - Typography via `.font(.system(size:weight:))` mapping to token values
> - Spacing via `.padding(_:)` with token values
> - Radius via `.cornerRadius(_:)` or `RoundedRectangle(cornerRadius:)` with token values
> - Colors via `theme.colors.*` environment values

## DESIGN NOTES

- Preserve RN spacing, composition hierarchy, and edge-case fixtures such as long labels, loading, and error states.
- Define detents, handles, scrim, keyboard avoidance, and safe-area behavior explicitly.
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
