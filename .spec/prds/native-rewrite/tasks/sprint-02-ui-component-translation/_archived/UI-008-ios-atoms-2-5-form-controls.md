# UI-008: iOS atoms 2/5 — form controls: `ThemeButton`, `ThemePrimaryButton`, `ThemeInput`, `ThemeTextarea`, `ThemeBottomSheetInput`, `ThemeSwitch`, `ThemeToggle`, `ThemeCheckbox`, `ThemeSlider`

**Task ID:** UI-008
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Atoms
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `atoms` slice for `iOS atoms 2/5 — form controls: ThemeButton, ThemePrimaryButton, ThemeInput, ThemeTextarea, ThemeBottomSheetInput, ThemeSwitch, ThemeToggle, ThemeCheckbox, ThemeSlider`.

**Objective:** Implement iOS atoms 2/5 — form controls: `ThemeButton`, `ThemePrimaryButton`, `ThemeInput`, `ThemeTextarea`, `ThemeBottomSheetInput`, `ThemeSwitch`, `ThemeToggle`, `ThemeCheckbox`, `ThemeSlider` as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `ThemeButton`, `ThemePrimaryButton`, `ThemeInput`, `ThemeTextarea`, `ThemeBottomSheetInput`, `ThemeSwitch`, `ThemeToggle`, `ThemeCheckbox`, `ThemeSlider`.
- Follow the **Photocopy Translation Protocol** in `.spec/prds/native-rewrite/08f-translation-protocol.md`. For every component, read **both** the LaneShadow RN wrapper at `react-native/components/ui/<name>.tsx` **and** the framework primitive source(s) in `node_modules` (react-native-paper, @gorhom/bottom-sheet, react-native core) per the Framework-source Reading Map in `08c-ios-component-map.md`.
- Map **every visual decision** in the RN source (color, height, padding, radius, opacity, border, shadow, animation, state-transition, typography metric) to its semantic-token equivalent from the `UI-001` core theme contract. Read the framework primitive's source in `node_modules` for any external library import and enumerate **every** style property it contributes to the rendered visual. If no token covers a value, STOP and escalate to this sprint's `DECISIONS.md` before improvising.
- Honor the **Prohibited Primitives** rule in `08c-ios-component-map.md` § Prohibited Primitives. Do not ship default-styled `Button`, `TextField`, `TextEditor`, `Toggle`, `Slider`, `Picker`, `List`, `Form`, or `Alert` as the final rendered surface. Compose using the allowed neutral primitives (`ZStack`, `VStack`, `HStack`, `RoundedRectangle`, `Capsule`, `Text` with explicit `.font(.system(...))`, `Canvas`) or wrap a SwiftUI view in a custom `ButtonStyle` / `TextFieldStyle` / `ToggleStyle` that fully overrides the visual.
- Populate the `TRANSLATION SOURCES` table and `STYLE PROPERTIES MATRIX` sub-sections below before implementation begins. Implementer reads these as the authoritative spec.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels (Story.summary = relative RN reference path).
- Cover all interactive states required by the parity spec for atomic controls and visuals.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.
- Ship default `.buttonStyle(.automatic)` / `.textFieldStyle(.automatic)` / `.toggleStyle(.switch)` final-rendered surfaces without a custom `*Style` per `08c` § Override pattern.
- Improvise a value when no semantic token covers it — escalate via `DECISIONS.md` instead.

### STRICTLY
- Preserve light and dark parity, accessibility labels, Dynamic Type, and deterministic fixtures for every scenario.
- Side-by-side AC-6 verification (RN sandbox vs iOS sandbox) is mandatory; screenshot pairs attached to the task PR.
- Swift 6 strict concurrency: Story containers MUST be `@MainActor` because `Story` is not `Sendable`.

## DELIVERABLES

- ios/LaneShadow/Views/Atoms/**
- ios/LaneShadow/Sandbox/Stories/AtomsStories.swift — @MainActor enum with `static let all: [Story]`, aggregated into LaneShadowStories.all
- ios/LaneShadowTests/**
- ios/LaneShadowSnapshotTests/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `ThemeButton`, `ThemePrimaryButton`, `ThemeInput`, `ThemeTextarea`, `ThemeBottomSheetInput`, `ThemeSwitch`, `ThemeToggle`, `ThemeCheckbox`, `ThemeSlider`.
**Verify:** `printf "%s\n" "`ThemeButton`, `ThemePrimaryButton`, `ThemeInput`, `ThemeTextarea`, `ThemeBottomSheetInput`, `ThemeSwitch`, `ThemeToggle`, `ThemeCheckbox`, `ThemeSlider`"`

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

### AC-6 — RN-Baseline-Diff Gate (universal, per `08f`)
**GIVEN** the RN baseline scenario registry from `UI-002` (`react-native/stories/registry/scenarioRegistry.generated.ts`) and the native sandbox stories registered for this task in `LaneShadowStories.all`.
**WHEN** a reviewer opens the same `Story.id` in the RN sandbox and the iOS sandbox side-by-side.
**THEN** rendering matches at parity: token-mapped colors are identical, heights / radii / paddings match within ±1px tolerance, all interactive state transitions (press, focus, disable, error, loading) produce visually identical results, and accessibility traits / labels match. Any intentional deviation is logged in `tasks/sprint-02-ui-component-translation/DECISIONS.md` with rationale and reviewer sign-off.
**Verify:** Screenshot pair (RN | iOS) attached to the task PR for at least one variant per component, plus a `variance--<scenario-id>--rn-vs-ios--<theme>.json` entry per `UI-002` conventions.

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `ThemeButton`, `ThemePrimaryButton`, `ThemeInput`, `ThemeTextarea`, `ThemeBottomSheetInput`, `ThemeSwitch`, `ThemeToggle`, `ThemeCheckbox`, `ThemeSlider`. | `printf "%s\n" "`ThemeButton`, `ThemePrimaryButton`, `ThemeInput`, `ThemeTextarea`, `ThemeBottomSheetInput`, `ThemeSwitch`, `ThemeToggle`, `ThemeCheckbox`, `ThemeSlider`"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `pnpm type-check:native && swiftformat --lint ios/LaneShadow --config .swiftformat && xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test` |

## READING LIST

### Spec layer (read first)
1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `.spec/prds/native-rewrite/08c-ios-component-map.md` — including § Prohibited Primitives and § Framework-source Reading Map (NEW)
6. `.spec/prds/native-rewrite/08f-translation-protocol.md` — Photocopy Translation Protocol (NEW, mandatory)
7. `RULES.md`

### LaneShadow RN wrappers (the source of truth for visual + behavior — read in full)
8. `react-native/components/ui/button.tsx`
9. `react-native/components/ui/primary-button.tsx`
10. `react-native/components/ui/input.tsx`
11. `react-native/components/ui/textarea.tsx`
12. `react-native/components/ui/bottom-sheet-input.tsx`
13. `react-native/components/ui/switch.tsx`
14. `react-native/components/ui/toggle.tsx`
15. `react-native/components/ui/checkbox.tsx`
16. `react-native/components/ui/slider.tsx`
17. `react-native/components/CLAUDE.md` — keyboard-handling contract for `BottomSheetInput`

### Framework primitive sources in `node_modules` (read for every style property contributed to the rendered visual)
18. `node_modules/react-native-paper/src/components/Typography/Text.tsx` + `node_modules/react-native-paper/src/components/Typography/v2/*.tsx` (used by Button, PrimaryButton, Input, BottomSheetInput, Toggle, Checkbox)
19. `node_modules/react-native-paper/src/core/theming.tsx` (used by PrimaryButton via `useTheme`)
20. `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetTextInput/BottomSheetTextInput.tsx` (used by BottomSheetInput)
21. `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` (used by Button, PrimaryButton, Toggle, Checkbox)
22. `node_modules/react-native/Libraries/Components/TextInput/TextInput.js` (used by Input, Textarea)
23. `node_modules/react-native/Libraries/Components/Switch/Switch.js` (used by Switch)
24. `react-native/components/ui/__tests__/` (any existing snapshot or behavior tests for these atoms)

## GUARDRAILS

### WRITE-ALLOWED
- ios/LaneShadow/Views/Atoms/**
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

**Reference:** `.spec/prds/native-rewrite/08c-ios-component-map.md` (+ § Prohibited Primitives, § Override pattern, § Framework-source Reading Map)

**Pattern:** Single SwiftUI `View` per component, composed from allowed neutral primitives (`ZStack`, `VStack`, `HStack`, `RoundedRectangle`, `Capsule`, `Text` with explicit `.font(.system(...))`, `Canvas`) or wrapped in a custom `ButtonStyle` / `TextFieldStyle` / `ToggleStyle` that fully overrides the system visual. Variant / size / state expressed as enum parameters. All visual values sourced from `LaneShadowTheme` via `@Environment(\.laneShadowTheme)`. One `Story(id: "atom.<component>.<state>", tier: .atom, ...)` per state in the `STYLE PROPERTIES MATRIX` registered in `LaneShadowStories.all` (in a `@MainActor enum` because `Story` is not `Sendable`).

**Anti-pattern:** Shipping `.buttonStyle(.automatic)` / `.textFieldStyle(.automatic)` / `.toggleStyle(.switch)` / default `Slider` / `Picker` / `List` / `Form` / `Alert` as the final rendered surface; using `Color.accentColor` instead of `LaneShadowTheme.shared.colors.primary`; hardcoded `.foregroundColor(.white)`, `.padding(16)`, `.font(.system(size: 14))` literals (all must source from theme); live service dependencies; platform-specific naming drift.

## TRANSLATION SOURCES

> **Populated by `swift-planner` per `08f-translation-protocol.md` § Output artifacts.** Implementer reads this table as the authoritative source-file map before reading any 3rd-party docs.

| Component | RN wrapper source | Framework primitives + `node_modules` paths | Native target file | Variants × sizes × states |
|---|---|---|---|---|
| ThemeButton | `react-native/components/ui/button.tsx` | _planner-filled_ | `ios/LaneShadow/Views/Atoms/ThemeButton.swift` | _planner-filled_ |
| ThemePrimaryButton | `react-native/components/ui/primary-button.tsx` | _planner-filled_ | `ios/LaneShadow/Views/Atoms/ThemePrimaryButton.swift` | _planner-filled_ |
| ThemeInput | `react-native/components/ui/input.tsx` | _planner-filled_ | `ios/LaneShadow/Views/Atoms/ThemeInput.swift` | _planner-filled_ |
| ThemeTextarea | `react-native/components/ui/textarea.tsx` | _planner-filled_ | `ios/LaneShadow/Views/Atoms/ThemeTextarea.swift` | _planner-filled_ |
| ThemeBottomSheetInput | `react-native/components/ui/bottom-sheet-input.tsx` | _planner-filled_ | `ios/LaneShadow/Views/Atoms/ThemeBottomSheetInput.swift` | _planner-filled_ |
| ThemeSwitch | `react-native/components/ui/switch.tsx` | _planner-filled_ | `ios/LaneShadow/Views/Atoms/ThemeSwitch.swift` | _planner-filled_ |
| ThemeToggle | `react-native/components/ui/toggle.tsx` | _planner-filled_ | `ios/LaneShadow/Views/Atoms/ThemeToggle.swift` | _planner-filled_ |
| ThemeCheckbox | `react-native/components/ui/checkbox.tsx` | _planner-filled_ | `ios/LaneShadow/Views/Atoms/ThemeCheckbox.swift` | _planner-filled_ |
| ThemeSlider | `react-native/components/ui/slider.tsx` | _planner-filled_ | `ios/LaneShadow/Views/Atoms/ThemeSlider.swift` | _planner-filled_ |

## STYLE PROPERTIES MATRIX

> **Populated by `swift-planner` per `08f-translation-protocol.md` § Style Property Enumeration Rules.** One sub-section per component above. Each sub-section is the **exhaustive** style enumeration (Layout / Visual / Typography / State / Interaction / Keyboard / Animation) with `Source | Value | Android equivalent | iOS equivalent | Token mapping` columns. `ESCALATE` rows MUST also appear in `DECISIONS.md`.

### ThemeButton
_planner-filled_

### ThemePrimaryButton
_planner-filled_

### ThemeInput
_planner-filled_

### ThemeTextarea
_planner-filled_

### ThemeBottomSheetInput
_planner-filled_

### ThemeSwitch
_planner-filled_

### ThemeToggle
_planner-filled_

### ThemeCheckbox
_planner-filled_

### ThemeSlider
_planner-filled_

## DESIGN NOTES

- Cover baseline states and typography or icon behavior explicitly so later molecules inherit stable primitives.
- Define detents, handles, scrim, keyboard avoidance, and safe-area behavior explicitly.
- Avoid default SwiftUI list, form, or navigation styling unless it is fully token-overridden and parity-approved.

## VERIFICATION GATES

- pnpm type-check:native
- swiftformat --lint ios/LaneShadow --config .swiftformat
- xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-001
- UI-002
- UI-004
- UI-006

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
