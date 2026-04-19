# UI-083: iOS delta organism — `GatekeeperUpgradePrompt` (same contract for UC-GATE-03 + UC-GATE-08)

**Task ID:** UI-083
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Delta Organism
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `delta-organism` slice for `iOS delta organism — GatekeeperUpgradePrompt (same contract for UC-GATE-03 + UC-GATE-08)`.

**Objective:** Implement iOS delta organism — `GatekeeperUpgradePrompt` (same contract for UC-GATE-03 + UC-GATE-08) as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: iOS delta organism — `GatekeeperUpgradePrompt` (same contract for UC-GATE-03 + UC-GATE-08).
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
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: iOS delta organism — `GatekeeperUpgradePrompt` (same contract for UC-GATE-03 + UC-GATE-08).
**Verify:** `printf "%s\n" "iOS delta organism — `GatekeeperUpgradePrompt` (same contract for UC-GATE-03 + UC-GATE-08)"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: iOS delta organism — `GatekeeperUpgradePrompt` (same contract for UC-GATE-03 + UC-GATE-08). | `printf "%s\n" "iOS delta organism — `GatekeeperUpgradePrompt` (same contract for UC-GATE-03 + UC-GATE-08)"` |
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
| GatekeeperUpgradePrompt | **RN BASELINE PENDING** — new delta organism for UC-GATE-01 | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetModal/BottomSheetModal.tsx` (reference for modal patterns); `node_modules/react-native/Libraries/Components/Modal/Modal.js` | `ios/LaneShadow/Views/Organisms/GatekeeperUpgradePrompt.swift` | 1 fixed layout × 2 states (visible/dismissed) × 3 prompt types (limit/renewal/feature) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### GatekeeperUpgradePrompt

**Source files read:**
- Task specification: UI-083 task description
- Framework reference: `node_modules/react-native/Libraries/Components/Modal/Modal.js`
- Composed components: Button (UI-017)

**Note:** This is a NEW delta organism component. Properties below are derived from the UC-GATE-01 use case and task specification. RN baseline implementation is pending.

**Layout — modal container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| modalWidth | Task spec | 90% of screen width (max 400) | `Modifier.widthIn(max = 400.dp).fillMaxWidth(0.9f)` | `.frame(maxWidth: 400).frame(width: geometry.size.width * 0.9)` | n/a (screen ratio) |
| modalCornerRadius | Task spec | `radius.xl` = 24 | `RoundedCornerShape(24.dp)` | `RoundedRectangle(cornerRadius: 24)` | `radius.xl` |
| modalPadding | Task spec | `space.xl` = 24 | `Modifier.padding(all = 24.dp)` | `.padding(24)` | `space.xl` |
| modalElevation | Task spec | `elevation[3]` | `LaneShadowTheme.elevation.level3` | `theme.elevation[3]` | `elevation[3]` |

**Layout — icon section:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| iconContainerSize | Task spec | 64 | `Modifier.size(64.dp)` | `.frame(width: 64, height: 64)` | ESCALATE — propose `space.4xl + space.md = 64` |
| iconContainerRadius | Task spec | `radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| iconSize | Task spec | 32 | `Modifier.size(32.dp)` | `.frame(width: 32, height: 32)` | `space.2xl` |
| iconGap | Task spec | `space.lg` = 16 | `Arrangement.spacedBy(16.dp)` | `VStack(spacing: 16)` | `space.lg` |

**Layout — content sections:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| sectionGap | Task spec | `space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `VStack(spacing: 12)` | `space.md` |
| buttonGap | Task spec | `space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `HStack(spacing: 8)` | `space.sm` |
| buttonHeight | Button component | `space.2xl + space.sm` = 40 | `Modifier.height(40.dp)` | `.frame(height: 40)` | `space.2xl + space.sm` |

**Layout — detents (sheet heights):**

| Detent | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | Task spec | 60% of screen height | `BottomSheetScaffold(sheetPeekHeight = 0.6f * screenHeight)` | `.presentationDetents([.fraction(0.6)])` | n/a (screen ratio) |

**Visual — colors (by prompt type):**

| Type | Element | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| limit | iconBackground | Task spec | `color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| limit | iconTint | Task spec | `color.onWarning.default` | `LaneShadowTheme.colors.onWarning` | `theme.colors.onWarning` | `color.onWarning.default` |
| renewal | iconBackground | Task spec | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| renewal | iconTint | Task spec | `color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| feature | iconBackground | Task spec | `color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| feature | iconTint | Task spec | `color.onSuccess.default` | `LaneShadowTheme.colors.onSuccess` | `theme.colors.onSuccess` | `color.onSuccess.default` |
| all | modalBackground | Task spec | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| all | scrimColor | Task spec | `color.scrim.default` with alpha 0.8 | `LaneShadowTheme.colors.scrim.copy(alpha = 0.8f)` | `Color.black.opacity(0.6)` | `color.scrim.default` + alpha |

**Typography — text hierarchy:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| titleSize | Task spec | `headlineMedium` (18sp) | `MaterialTheme.typography.headlineMedium` | `theme.typography.headline` | ESCALATE — propose `type.display.xs = 18` |
| titleColor | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| bodySize | Task spec | `bodyMedium` (14sp) | `MaterialTheme.typography.bodyMedium` | `theme.typography.body` | `type.body.md` |
| bodyColor | Task spec | `color.onSurfaceVariant.default` | `LaneShadowTheme.colors.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurfaceVariant.default` |
| footnoteSize | Task spec | `bodySmall` (12sp) | `MaterialTheme.typography.bodySmall` | `theme.typography.footnote` | ESCALATE — propose `type.body.xs = 12` |
| footnoteColor | Task spec | `color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

**Visual — button colors:**

| Button | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| primary (upgrade) | Task spec | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| secondary (dismiss) | Task spec | `color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |

**Interaction — touch targets:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| minTouchTarget | Task spec | `space.3xl` = 48 | `Modifier.size(min = 48.dp)` | `.frame(minWidth: 48, minHeight: 48)` | `space.3xl` |
| hapticFeedback | Task spec | light impact on show | `LocalHapticFeedback.current.performHapticFeedback(HapticFeedbackType.TextHandleMove)` | `UIImpactFeedbackGenerator(style: .light).impactOccurred()` | n/a |

**States — visible/dismissed:**

| State | Source | Visual | Android | iOS | Token |
|---|---|---|---|---|---|
| visible | Task spec | modal rendered with scrim | `Dialog(onDismissRequest = ...)` | `.sheet(isPresented: ...)` | n/a |
| dismissed | Task spec | hidden, no scrim | `null` (no Dialog) | `.sheet(isPresented: false)` | n/a |

**Prompt types — limit/renewal/feature:**

| Type | Source | Title pattern | Icon | CTA text |
|---|---|---|---|---|
| limit | Task spec | "Route limit reached" | warning icon | "Upgrade to Pro" |
| renewal | Task spec | "Subscription expiring" | info icon | "Renew Now" |
| feature | Task spec | "Premium feature" | lock icon | "Unlock Access" |

**Animation — modal transitions:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| transitionDuration | Task spec | 250ms | `animationSpec = tween(250)` | `.animation(.easeInOut(duration: 0.25))` | ESCALATE — propose `motion.duration.standard = 250` |
| easingFunction | Task spec | ease-out | `Easing.FastEase` | `.easeOut` | ESCALATE — propose `motion.easing.enter = easeOut` |

## DESIGN NOTES

- Treat parity as spec-driven against the delta composition contract when no RN baseline story exists.
- Avoid default SwiftUI list, form, or navigation styling unless it is fully token-overridden and parity-approved.

## VERIFICATION GATES

- pnpm type-check:native
- swiftformat --lint ios/LaneShadow --config .swiftformat
- xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-056
- UI-010

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
