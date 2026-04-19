# UI-069: iOS delta molecule — `TurnInstructionCard` (same contract for UC-NAV-02 + UC-FLOW-06)

**Task ID:** UI-069
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 480 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Delta Molecule
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `delta-molecule` slice for `iOS delta molecule — TurnInstructionCard (same contract for UC-NAV-02 + UC-FLOW-06)`.

**Objective:** Implement iOS delta molecule — `TurnInstructionCard` (same contract for UC-NAV-02 + UC-FLOW-06) as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: iOS delta molecule — `TurnInstructionCard` (same contract for UC-NAV-02 + UC-FLOW-06).
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Treat parity as spec-driven against the delta composition contract when there is no existing RN baseline story.

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
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: iOS delta molecule — `TurnInstructionCard` (same contract for UC-NAV-02 + UC-FLOW-06).
**Verify:** `printf "%s\n" "iOS delta molecule — `TurnInstructionCard` (same contract for UC-NAV-02 + UC-FLOW-06)"`

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
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: iOS delta molecule — `TurnInstructionCard` (same contract for UC-NAV-02 + UC-FLOW-06). | `printf "%s\n" "iOS delta molecule — `TurnInstructionCard` (same contract for UC-NAV-02 + UC-FLOW-06)"` |
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
| TurnInstructionCard | **RN baseline pending — properties derived from task spec and UC-NAV-02** | n/a (NEW component — delta) | `ios/LaneShadow/Views/Molecules/TurnInstructionCard.swift` | 1 variant (top-of-screen navigation card) × 3 states (approaching/immediate/none) × lane guidance (optional) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### TurnInstructionCard

**Source files read:**
- LaneShadow: **RN baseline pending — properties derived from task spec**
- Framework: n/a (NEW component — delta)
- Use case: `.spec/prds/native-rewrite/09-uc-navigation.md` (UC-NAV-02: Follow Route with Voice Instructions)

> **Note**: This is a **NEW delta component** — no RN baseline exists. Properties are derived from the task description and UC-NAV-02 which specifies: "top-of-screen card with maneuver icon, street name, distance countdown, and optional lane guidance strip".

**Layout — container:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| width | Task spec | `'100%'` (full width, positioned at top) | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| height | Task spec | `auto` (expands to content) | `Modifier.wrapContentHeight()` | n/a | n/a |
| padding | Task spec | `space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| borderRadius | Task spec | `radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| margin | Task spec | `space.md` = 12 (from edges) | `Modifier.padding(horizontal = 12.dp, vertical = 12.dp)` | `.padding(12)` | `space.md` |

**Layout — internal structure (Row):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| flexDirection | Task spec | `'row'` (icon left, text right) | `Row(...)` | `HStack` | n/a |
| alignItems | Task spec | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | Task spec | `space.md` = 12 | `Spacer(Modifier.width(12.dp))` | `Spacer(minLength: 12)` | `space.md` |

**Layout — maneuver icon:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| iconSize | Task spec | `32` | `Modifier.size(32.dp)` | `.frame(width: 32, height: 32)` | ESCALATE — propose `iconSize.lg = 32` |
| iconColor | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| iconBackground | Task spec | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| iconBorderRadius | Task spec | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| iconPadding | Task spec | `space.sm` = 8 | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` |

**Layout — text content (Column):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| flexDirection | Task spec | `'column'` (street name top, distance bottom) | `Column(...)` | `VStack` | n/a |
| gap | Task spec | `space.xs` = 4 | `Spacer(Modifier.height(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |

**Typography — street name (primary):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| fontSize | Paper labelLarge | 14 | `14.sp` | `.font(.system(size: 14, weight: .medium))` | `type.label.md.fontSize` |
| fontWeight | Paper labelLarge | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` |
| color | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| lineHeight | Paper labelLarge | 20 | `LineHeightStyle` or `lineHeight = 20.sp` | `.lineSpacing(20 - 14)` = 6 | `type.label.md.lineHeight` |
| maxLines | Task spec | `2` (truncate long names) | `maxLines = 2` | `.lineLimit(2)` | n/a |
| overflow | Task spec | `'ellipsis'` | `overflow = TextOverflow.Ellipsis` | `.truncationMode(.tail)` | n/a |

**Typography — distance (secondary):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| fontSize | Paper labelSmall | 11 | `11.sp` | `.font(.system(size: 11, weight: .medium))` | ESCALATE — `type.label.sm.fontSize = 11` |
| fontWeight | Paper labelSmall | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.sm.fontWeight` |
| color | Task spec | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| lineHeight | Paper labelSmall | 16 | `16.sp` | `.lineSpacing(16 - 11)` = 5 | n/a |
| text | Task spec | `"500 m"` or `"100 m"` | `Text("${distance} m")` | `Text("\(distance) m")` | n/a |

**Visual — background:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| backgroundColor | Task spec | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| shadow | Task spec | `elevation[2]` | `Modifier.shadow(elevation = 2.dp)` | `.shadow(color:.black.opacity(0.05), radius: 4, y: 2)` | `elevation[2]` |

**Visual — lane guidance strip (optional):**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| height | Task spec | `4` | `Modifier.height(4.dp)` | `.frame(height: 4)` | ESCALATE — propose `size.laneGuidanceHeight = 4` |
| width | Task spec | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| position | Task spec | `bottom` (attached to bottom edge) | `Modifier.align(Alignment.BottomEnd)` | `.frame(maxWidth: .infinity, alignment: .bottom)` | n/a |
| lanes | Task spec | `array of lane states` (e.g., [straight, left, straight]) | Render as colored rects | Same | n/a |
| laneColor (active) | Task spec | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| laneColor (inactive) | Task spec | `color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| laneSpacing | Task spec | `2` | `Spacer(Modifier.width(2.dp))` | `Spacer(minLength: 2)` | `space.xs / 2`, ESCALATE — propose `space.xxs = 2` |

**Animation — card appearance:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| animationType | Task spec | `slideInFromTop` | `AnimatedVisibility(..., enter = slideInVertically())` | `.transition(.move(edge: .top))` | n/a |
| duration | Task spec | `300ms` | `durationMillis = 300` | `0.3` | ESCALATE — propose `motion.duration.medium = 300` |
| easing | Task spec | `easeOut` | `EaseOut` | `.easeOut` | n/a |

**Interaction:**

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| accessibilityRole | Task spec | `'text'` (instructional) | `Modifier.semantics { role = Role.Img }` | `.accessibilityAddTraits(.isStaticText)` | n/a |
| accessibilityLabel | Task spec | `"Turn left onto Oak Street in 500 meters"` | `contentDescription = "$maneuver $street in $distance"` | `.accessibilityLabel("\(maneuver) \(street) in \(distance)")` | n/a |
| testID | Task spec | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

**State — props:**

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|---|
| maneuver | Task spec | `String` ("Turn left", "Turn right", "U-turn") | `val maneuver: String` | `var maneuver: String` | n/a |
| street | Task spec | `String` | `val street: String` | `var street: String` | n/a |
| distance | Task spec | `Int` (meters) | `val distance: Int` | `var distance: Int` | n/a |
| laneGuidance | Task spec | `List<Bool>?` (optional) | `val laneGuidance: List<Boolean>?` | `var laneGuidance: [Bool]?` | n/a |

## DESIGN NOTES

- Treat parity as spec-driven against the delta composition contract when no RN baseline story exists.
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
