# UI-007: Android atoms 2/5 — form controls: `Button`, `PrimaryButton`, `Input`, `Textarea`, `BottomSheetInput`, `Switch`, `Toggle`, `Checkbox`, `Slider`

**Task ID:** UI-007
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Atoms
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `atoms` slice for `Android atoms 2/5 — form controls: Button, PrimaryButton, Input, Textarea, BottomSheetInput, Switch, Toggle, Checkbox, Slider`.

**Objective:** Implement Android atoms 2/5 — form controls: `Button`, `PrimaryButton`, `Input`, `Textarea`, `BottomSheetInput`, `Switch`, `Toggle`, `Checkbox`, `Slider` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `Button`, `PrimaryButton`, `Input`, `Textarea`, `BottomSheetInput`, `Switch`, `Toggle`, `Checkbox`, `Slider`.
- Follow the **Photocopy Translation Protocol** in `.spec/prds/native-rewrite/08f-translation-protocol.md`. For every component, read **both** the LaneShadow RN wrapper at `react-native/components/ui/<name>.tsx` **and** the framework primitive source(s) in `node_modules` (react-native-paper, @gorhom/bottom-sheet, react-native core) per the Framework-source Reading Map in `08b-android-component-map.md`.
- Map **every visual decision** in the RN source (color, height, padding, radius, opacity, border, shadow / elevation, animation, state-transition, typography metric) to its semantic-token equivalent from the `UI-001` core theme contract. Read the framework primitive's source in `node_modules` for any external library import and enumerate **every** style property it contributes to the rendered visual. If no token covers a value, STOP and escalate to this sprint's `DECISIONS.md` before improvising.
- Honor the **Prohibited Primitives** rule in `08b-android-component-map.md` § Prohibited Primitives. Do not ship `androidx.compose.material3.Button` / `TextField` / `Switch` / `Checkbox` / `Slider` / `Card` / `FloatingActionButton` as the final rendered surface. Compose using the allowed neutral primitives (`Surface` with `tonalElevation = 0.dp`, `Box`, `Row`, `Column`, `BasicText`, `BasicTextField`, `Canvas`, `Modifier.clickable / pointerInput`).
- Populate the `TRANSLATION SOURCES` table and `STYLE PROPERTIES MATRIX` sub-sections below before implementation begins. Implementer reads these as the authoritative spec.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels (Story.summary = relative RN reference path).
- Cover all interactive states required by the parity spec for atomic controls and visuals.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.
- Ship `androidx.compose.material3.*` final-rendered surfaces without the full default override pattern documented in `08b` § Override pattern.
- Improvise a value when no semantic token covers it — escalate via `DECISIONS.md` instead.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.
- Side-by-side AC-6 verification (RN sandbox vs Android sandbox) is mandatory; screenshot pairs attached to the task PR.

## DELIVERABLES

- android/app/src/main/java/com/laneshadow/ui/atoms/**
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt — story set aggregated into AppStories.all
- android/app/src/test/java/com/laneshadow/**
- android/app/src/androidTest/java/com/laneshadow/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `Button`, `PrimaryButton`, `Input`, `Textarea`, `BottomSheetInput`, `Switch`, `Toggle`, `Checkbox`, `Slider`.
**Verify:** `printf "%s\n" "`Button`, `PrimaryButton`, `Input`, `Textarea`, `BottomSheetInput`, `Switch`, `Toggle`, `Checkbox`, `Slider`"`

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
**GIVEN** native-sandbox is installed and the DEBUG variant is running.
**WHEN** `make android_sandbox` launches the sandbox (sends intent extra `com.laneshadow.OPEN_SANDBOX=true` to MainActivity).
**THEN** every component listed in DELIVERABLES has at least one `Story(id = "<tier>.<component>.<state>", tier = ComponentTier.<Tier>, component = "<Name>", name = "<State>", summary = "<rn-reference-path>") { <Composable usage> }` registered in `AppStories.all` and renders in the story-tree drawer under its tier, wrapped by `themedPreview { content -> LaneShadowTheme { content() } }`.

**Launch:** `make android_sandbox` (canonical). Secondary: long-press app root (debug gesture) or `adb shell am start -a android.intent.action.VIEW -d "app-sandbox://sandbox"`.

### AC-6 — RN-Baseline-Diff Gate (universal, per `08f`)
**GIVEN** the RN baseline scenario registry from `UI-002` (`react-native/stories/registry/scenarioRegistry.generated.ts`) and the native sandbox stories registered for this task in `AppStories.all`.
**WHEN** a reviewer opens the same `Story.id` in the RN sandbox and the Android sandbox side-by-side.
**THEN** rendering matches at parity: token-mapped colors are identical, heights / radii / paddings match within ±1px tolerance, all interactive state transitions (press, focus, disable, error, loading) produce visually identical results, and accessibility roles / labels match. Any intentional deviation is logged in `tasks/sprint-02-ui-component-translation/DECISIONS.md` with rationale and reviewer sign-off.
**Verify:** Screenshot pair (RN | Android) attached to the task PR for at least one variant per component, plus a `variance--<scenario-id>--rn-vs-android--<theme>.json` entry per `UI-002` conventions.

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `Button`, `PrimaryButton`, `Input`, `Textarea`, `BottomSheetInput`, `Switch`, `Toggle`, `Checkbox`, `Slider`. | `printf "%s\n" "`Button`, `PrimaryButton`, `Input`, `Textarea`, `BottomSheetInput`, `Switch`, `Toggle`, `Checkbox`, `Slider`"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `pnpm type-check:native && ./android/gradlew assembleDebug` |

## READING LIST

### Spec layer (read first)
1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `.spec/prds/native-rewrite/08b-android-component-map.md` — including § Prohibited Primitives and § Framework-source Reading Map (NEW)
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
- android/app/src/main/java/com/laneshadow/ui/atoms/**
- android/app/src/main/java/com/laneshadow/ui/sandbox/**
- android/app/src/test/java/com/laneshadow/**
- android/app/src/androidTest/java/com/laneshadow/**

### WRITE-PROHIBITED
- ios/**
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

**Reference:** `.spec/prds/native-rewrite/08b-android-component-map.md` (+ § Prohibited Primitives, § Override pattern, § Framework-source Reading Map)

**Pattern:** Single reusable `@Composable` per component, composed from allowed neutral primitives (`Surface(tonalElevation = 0.dp)`, `Box`, `Row`, `Column`, `BasicText`, `BasicTextField`, `Canvas`, `Modifier.clickable / pointerInput`), with variant / size / state expressed as enum parameters, all visual values sourced from `LaneShadowTheme.colors / spacing / radius / typography`, and one `Story(id = "atom.<component>.<state>", tier = ComponentTier.Atom, ...)` per state in the `STYLE PROPERTIES MATRIX` registered in `AppStories.all`.

**Anti-pattern:** Shipping `androidx.compose.material3.Button / TextField / Switch / Checkbox / Slider / Card / FloatingActionButton` as the final rendered surface; using `MaterialTheme.colorScheme.*` instead of `LaneShadowTheme.colors.*`; hardcoded `Color(0xFF...)`, `4.dp`, `16.sp` literals; backend-aware composables; duplicated variant files (use one composable + enum parameter).

## TRANSLATION SOURCES

> **Populated by `kotlin-planner` per `08f-translation-protocol.md` § Output artifacts.** Implementer reads this table as the authoritative source-file map before reading any 3rd-party docs.

| Component | RN wrapper source | Framework primitives + `node_modules` paths | Native target file | Variants × sizes × states |
|---|---|---|---|---|
| Button | `react-native/components/ui/button.tsx` | _planner-filled_ | `android/app/src/main/java/com/laneshadow/ui/atoms/Button.kt` | _planner-filled_ |
| PrimaryButton | `react-native/components/ui/primary-button.tsx` | _planner-filled_ | `android/app/src/main/java/com/laneshadow/ui/atoms/PrimaryButton.kt` | _planner-filled_ |
| Input | `react-native/components/ui/input.tsx` | _planner-filled_ | `android/app/src/main/java/com/laneshadow/ui/atoms/Input.kt` | _planner-filled_ |
| Textarea | `react-native/components/ui/textarea.tsx` | _planner-filled_ | `android/app/src/main/java/com/laneshadow/ui/atoms/Textarea.kt` | _planner-filled_ |
| BottomSheetInput | `react-native/components/ui/bottom-sheet-input.tsx` | _planner-filled_ | `android/app/src/main/java/com/laneshadow/ui/atoms/BottomSheetInput.kt` | _planner-filled_ |
| Switch | `react-native/components/ui/switch.tsx` | _planner-filled_ | `android/app/src/main/java/com/laneshadow/ui/atoms/Switch.kt` | _planner-filled_ |
| Toggle | `react-native/components/ui/toggle.tsx` | _planner-filled_ | `android/app/src/main/java/com/laneshadow/ui/atoms/Toggle.kt` | _planner-filled_ |
| Checkbox | `react-native/components/ui/checkbox.tsx` | _planner-filled_ | `android/app/src/main/java/com/laneshadow/ui/atoms/Checkbox.kt` | _planner-filled_ |
| Slider | `react-native/components/ui/slider.tsx` | _planner-filled_ | `android/app/src/main/java/com/laneshadow/ui/atoms/Slider.kt` | _planner-filled_ |

## STYLE PROPERTIES MATRIX

> **Populated by `kotlin-planner` per `08f-translation-protocol.md` § Style Property Enumeration Rules.** One sub-section per component above. Each sub-section is the **exhaustive** style enumeration (Layout / Visual / Typography / State / Interaction / Keyboard / Animation) with `Source | Value | Android equivalent | iOS equivalent | Token mapping` columns. `ESCALATE` rows MUST also appear in `DECISIONS.md`.

### Button
_planner-filled_

### PrimaryButton
_planner-filled_

### Input
_planner-filled_

### Textarea
_planner-filled_

### BottomSheetInput
_planner-filled_

### Switch
_planner-filled_

### Toggle
_planner-filled_

### Checkbox
_planner-filled_

### Slider
_planner-filled_

## DESIGN NOTES

- Cover baseline states and typography or icon behavior explicitly so later molecules inherit stable primitives.
- Define detents, handles, scrim, keyboard avoidance, and safe-area behavior explicitly.
- Avoid unstyled Material defaults and route all styling through the documented Compose theme layer.

## VERIFICATION GATES

- pnpm type-check:native
- ./android/gradlew assembleDebug
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-001
- UI-002
- UI-003
- UI-005

## CODING STANDARDS

- .spec/prds/native-rewrite/08d-component-parity-spec.md — naming, interface, token, state, animation, accessibility, keyboard, and RTL parity
- .spec/prds/native-rewrite/08-design-system.md — token generation and consumption rules
- ~/Projects/brain/docs/TDD-METHODOLOGY.md — RED/GREEN/REFACTOR evidence expectations

## OUT OF SCOPE

- Feature wiring beyond sandbox-ready component translation.
- Changes to unrelated sprints or backend and server code.

---

## Native Sandbox Integration (added 2026-04-18)

`native-sandbox` is installed as a Gradle composite build (`com.nativesandbox:library` via `includeBuild("../../native-sandbox/android")` with `debugImplementation`).

### Sandbox Deliverables (in addition to the component sources above)

- `android/app/src/debug/java/com/laneshadow/sandbox/stories/<ComponentGroup>Stories.kt` — debug-only story set; `object` with `val all: List<Story>`, aggregated into `AppStories.all` at `android/app/src/debug/java/com/laneshadow/sandbox/stories/AppStories.kt`.

### Sandbox Acceptance Criterion

**GIVEN** the native-sandbox Gradle composite build is wired and the DEBUG variant is built.
**WHEN** the reviewer runs `make android_sandbox` (or triggers the long-press gesture / sends intent extra `com.laneshadow.OPEN_SANDBOX=true`).
**THEN** every component named in DELIVERABLES has at least one registered `Story(id = "<tier>.<component>.<state>", tier = ComponentTier.<Tier>, component = "<Name>", name = "<State>", summary = "<rn-reference-path>") { <Composable usage> }` appearing in the sandbox story-tree drawer, wrapped by `previewWrapper = themedPreview { content -> LaneShadowTheme { content() } }` so the preview canvas inherits LaneShadow tokens while chrome stays neutral.

### Reviewer Launch

- **Primary:** `make android_sandbox` (from repo root) — builds debug APK, installs, launches MainActivity with the sandbox intent extra.
- **Secondary:** long-press app root (debug-only gesture), or `adb shell am start -a android.intent.action.VIEW -d "app-sandbox://sandbox"`.

### Contract references

- `com.nativesandbox.model.Story` — `id`, `tier` (ComponentTier), `component`, `name`, `summary`, `content: @Composable`.
- `com.nativesandbox.views.SandboxRoot` — entry composable; receives `stories`, optional `themeController`, `previewWrapper`.
- Chrome is theme-neutral by design; only the preview canvas is re-themed via `previewWrapper`.
