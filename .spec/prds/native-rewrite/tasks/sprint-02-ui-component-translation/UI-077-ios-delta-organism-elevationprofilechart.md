# UI-077: iOS delta organism — `ElevationProfileChart` (same contract for UC-COMP-04); Swift Charts + custom annotation

**Task ID:** UI-077
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 720 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Delta Organism
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `delta-organism` slice for `iOS delta organism — ElevationProfileChart (same contract for UC-COMP-04); Swift Charts + custom annotation`.

**Objective:** Implement iOS delta organism — `ElevationProfileChart` (same contract for UC-COMP-04); Swift Charts + custom annotation as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: iOS delta organism — `ElevationProfileChart` (same contract for UC-COMP-04); Swift Charts + custom annotation.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Treat parity as spec-driven against the delta composition contract when there is no existing RN baseline story.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- ios/LaneShadow/Views/Organisms/**
- ios/LaneShadow/Sandbox/Stories/OrganismsStories.swift — @MainActor enum with `static let all: [Story]`, aggregated into LaneShadowStories.all
- ios/LaneShadowTests/**
- ios/LaneShadowSnapshotTests/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: iOS delta organism — `ElevationProfileChart` (same contract for UC-COMP-04); Swift Charts + custom annotation.
**Verify:** `printf "%s\n" "iOS delta organism — `ElevationProfileChart` (same contract for UC-COMP-04); Swift Charts + custom annotation"`

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
**GIVEN** This task composes multiple lower-level components and fixtures.
**WHEN** The platform scenario is exercised end to end in the sandbox.
**THEN** The composition renders using only previously defined platform components, deterministic fixtures, and no backend or auth dependencies.
**Verify:** `rg -n "deterministic|fixtures|no auth|no backend" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`

### AC-6
**GIVEN** native-sandbox is installed and a DEBUG build is running.
**WHEN** `make ios_sandbox` launches the sandbox (passes `-LaneShadowSandbox` arg to the app).
**THEN** every component listed in DELIVERABLES has at least one `Story(id: "<tier>.<component>.<state>", tier: .<tier>, component: "<Name>", name: "<State>", summary: "<rn-reference-path>") { _ in <SwiftUI usage> }` registered in `LaneShadowStories.all` and renders in the story-tree drawer under its tier, wrapped by `themedPreview { $0.laneShadowTheme() }`.

**Launch:** `make ios_sandbox` (canonical). Secondary: device shake (simulator: `xcrun simctl io booted shake`) or `xcrun simctl launch <id> com.laneshadow.app -LaneShadowSandbox`.

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: iOS delta organism — `ElevationProfileChart` (same contract for UC-COMP-04); Swift Charts + custom annotation. | `printf "%s\n" "iOS delta organism — `ElevationProfileChart` (same contract for UC-COMP-04); Swift Charts + custom annotation"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | AC-5 | The composition renders using only previously defined platform components, deterministic fixtures, and no backend or auth dependencies. | `rg -n "deterministic\|fixtures\|no auth\|no backend" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-6 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `swiftformat --lint ios/LaneShadow --config .swiftformat && xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `RULES.md`
6. `.spec/prds/native-rewrite/08c-ios-component-map.md`

## GUARDRAILS

### WRITE-ALLOWED
- ios/LaneShadow/Views/Organisms/**
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
| ElevationProfileChart | **RN BASELINE PENDING** — new delta component for UC-COMP-04 | `node_modules/@shopify/flash-list/src/FlashList.tsx` (reference for list patterns); `node_modules/react-native-maps/lib/androidmapview/MapView.js` (for elevation data patterns); custom Canvas/SVG drawing (reference: `react-native/Libraries/Components/View/View.js`) | `ios/LaneShadow/Views/Organisms/ElevationProfileChart.swift` | 1 fixed layout × 3 states (empty/loading/loaded) × 2 interaction modes (static/interactive with crosshair) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### ElevationProfileChart

**Source files read:**
- Task specification: UI-077 task description
- Framework reference: `node_modules/react-native/Libraries/Components/View/View.js`
- Swift Charts framework (iOS): `SwiftUI/Charts`

**Note:** This is a NEW delta component. Properties below are derived from the UC-COMP-04 use case and task specification. RN baseline implementation is pending.

**Layout — container dimensions:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| containerHeight | Task spec | `space.4xl + space.2xl` = 96 | `Modifier.height(96.dp)` | `.frame(height: 96)` | `space.4xl + space.2xl` |
| containerWidth | Task spec | 100% parent | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| chartPadding | Task spec | `space.md` = 12 | `Modifier.padding(all = 12.dp)` | `.padding(12)` | `space.md` |

**Layout — crosshair marker (interactive mode):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| markerLineWidth | Task spec | 1 | `drawLine(width = 1.dp)` | `.stroke(style: StrokeStyle(lineWidth: 1))` | ESCALATE — propose `strokeWidth.thin = 1` |
| markerColor | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| markerRadius | Task spec | `radius.xs` = 4 | `CircleShape(radius = 4.dp)` | `Circle().frame(width: 8, height: 8)` | `radius.sm` (half) |

**Visual — chart colors (grade-based segments):**

| Grade | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flat (0-3%) | Task spec | `color.success.default` (green) | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| moderate (3-6%) | Task spec | `color.primary.default` (blue) | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| steep (6-10%) | Task spec | `color.warning.default` (yellow) | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| extreme (10%+) | Task spec | `color.danger.default` (red) | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |

**Visual — background and surface:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| chartBackground | Task spec | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| gridLineColor | Task spec | `color.outline.default` with alpha 0.3 | `LaneShadowTheme.colors.outline.copy(alpha = 0.3f)` | `theme.colors.outline.opacity(0.3)` | `color.outline.default` + alpha |
| axisTextColor | Task spec | `color.onSurfaceVariant.default` | `LaneShadowTheme.colors.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurfaceVariant.default` |

**Typography — axis labels:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| labelStyle | Task spec | `labelSmall` (11sp) | `MaterialTheme.typography.labelSmall` | `theme.typography.caption` | ESCALATE — propose `type.label.xs = 11` |
| labelColor | Task spec | `color.onSurfaceVariant.default` | `LaneShadowTheme.colors.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurfaceVariant.default` |

**Interaction — crosshair behavior:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| touchTargetSize | Task spec | `space.3xl` = 48 (minimum) | `Modifier.size(48.dp)` | `.frame(width: 48, height: 48)` | `space.3xl` |
| hapticFeedback | Task spec | light impact on marker move | `LocalHapticFeedback.current.performHapticFeedback(HapticFeedbackType.TextHandleMove)` | `UIImpactFeedbackGenerator(style: .light).impactOccurred()` | n/a |

**States — empty/loading/loaded:**

| State | Source | Visual | Android | iOS | Token |
|---|---|---|---|---|---|
| empty | Task spec | placeholder illustration with `color.onSurface.disabled` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |
| loading | Task spec | shimmer effect with `color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| loaded | Task spec | full chart render with grade-colored segments | (see chart colors above) | (see chart colors above) | (see chart colors above) |

**Swift Charts-specific configuration (iOS):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| chartType | Task spec | Line chart with segmented colored areas | `LineChart(...)` with `LineComponent(...)` per segment | `Chart { ... }` with `AreaPlot` | n/a |
| animationDuration | Task spec | 300ms | `animationSpec = tween(300)` | `.animation(.easeInOut(duration: 0.3))` | ESCALATE — propose `motion.duration.fast = 300` |

## DESIGN NOTES

- Treat parity as spec-driven against the delta composition contract when no RN baseline story exists.
- Avoid default SwiftUI list, form, or navigation styling unless it is fully token-overridden and parity-approved.

## VERIFICATION GATES

- pnpm type-check:native
- swiftformat --lint ios/LaneShadow --config .swiftformat
- xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-038
- UI-067

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
