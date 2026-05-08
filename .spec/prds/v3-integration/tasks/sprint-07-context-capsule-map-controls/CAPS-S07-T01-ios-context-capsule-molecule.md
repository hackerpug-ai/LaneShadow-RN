# CAPS-S07-T01 — iOS LSContextCapsule molecule (5 state variants, glass surface, sandbox stories)

> Status: ✅ Done
> Cycle: 1
> Updated: 2026-05-07T21:15:00-07:00

> **Task ID:** CAPS-S07-T01
> **Sprint:** [Sprint 07 — Production Sync](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 240 min
> **Type:** FEATURE
> **Status:** Done
> **Priority:** P0
> **Effort:** L
> **Sprint ID:** sprint-07-context-capsule-map-controls
> **PRD Refs:** UC-FID-01, Sprint 07 — Context Capsule + Map Controls (Map View Redesign 2026-05-06)

## Background

The 2026-05-06 design redesign introduced `mol-context-capsule` as the canonical replacement for the legacy floating greeting overlay (Newsreader `t-opinion-xl` headline + meta row + standalone advisory card). The molecule unifies five visual states (`--idle`, `--planning`, `--route`, `--warning`, `--saved`) into one glass container. iOS production has no equivalent component — Sprint 06's idle screen ships the legacy floating headline and advisory card. This task creates the iOS SwiftUI `LSContextCapsule` molecule plus 10 sandbox stories so subsequent retrofits (CAPS-S07-T05) and downstream sprints (08–11) have a stable component to consume.

The component must match the `mol-context-capsule` HTML visual contract at `.spec/design/system/molecules/context-capsule/context-capsule.html` (italic em on scope-word, copper signal for idle/planning, content-primary italic for route, JetBrains Mono metrics, optional `--warning`/`--saved` modifiers). All visuals are token-driven via `LaneShadowTheme.color.{surface,signal,content,status,border}.*`.

## Critical Constraints

**MUST:**
- Implement `LSContextCapsule` as a public SwiftUI View at `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` consuming `@Environment(\.theme)` for spacing/radius/typography
- Expose state via a `CapsuleState` enum: `.idle(headline: AttributedString, metaItems: [String])`, `.planning(headline: String)`, `.route(name: AttributedString, metrics: [String])` plus additive Bool modifiers `isWarning` (idle only) and `isSaved` (route only)
- Render glass surface using `LaneShadowTheme.color.surface.glass` token via `.background(.ultraThinMaterial)` overlay tinted with surface.glass; hairline border via `border.default`; radius `theme.radius.lg`; shadow tier `elev.overlay`; padding `theme.space.sm × theme.space.md` (matching `var(--space-3) × var(--space-4)`)
- Headline typography uses `theme.type.opinion.md.font` (Newsreader 17pt) with italic em on the scope-word rendered via AttributedString italic run in `signal.default` copper for idle/planning, `content.primary` for route
- Meta row uses `theme.type.label.sm.font` with separator dots at `currentColor.opacity(0.45)` and `space.xs` gap; route variant overrides font family to JetBrains Mono via `theme.type.instrument.sm.font`
- Warning modifier tints meta row to `LaneShadowTheme.color.status.warning.default`
- Saved modifier draws a copper hairline overlay via `.overlay(RoundedRectangle(...).stroke(signal.default, lineWidth: borderWidth.thin))`
- Planning state renders a copper pulse-dot via `LSSpinner` or token-driven Circle with `signal.default` fill and 1.4s ease-in-out scale/opacity animation respecting `@Environment(\.accessibilityReduceMotion)`
- Register all 10 sandbox stories (5 states × 2 themes) via a new `LSContextCapsuleStories.swift` file added to `MoleculesStories.all`; story IDs follow `molecules.context-capsule.{state}-{theme}` parity convention (kebab-case lowercase dot-separated)

**NEVER:**
- NEVER hardcode hex literals, RGB tuples, numeric font sizes/weights, or pixel paddings — every visual must resolve through LaneShadowTheme tokens
- NEVER use `.foregroundColor` (deprecated); use `.foregroundStyle`
- NEVER bake any wiring to live `IdleViewModel` state in this task — the molecule accepts `CapsuleState` as input only; live wiring lives in CAPS-S07-T05
- NEVER edit the Sprint 06 LSMap host (`Views/Atoms/LSMap.swift`, `AppFlow/MapView/LSMapHost.swift`) — out of scope
- NEVER add stories outside `LSContextCapsuleStories.swift`; do not modify other story files

**STRICTLY:**
- STRICTLY follow `ios-principles.md`: SwiftUI body must remain small enough to avoid full-tree recomposition; extract subviews for headline, meta row, spinner, saved overlay
- STRICTLY use the canonical sandbox story id naming per `RULES.md §Cross-Platform Component Parity` — Android twin (CAPS-S07-T02) MUST share these IDs
- STRICTLY pass token-purity check: `scripts/tokens/enforce-native-compliance.sh` exit 0

## Specification

**Objective:** Ship a new public SwiftUI molecule `LSContextCapsule` with 5 visual state variants matching the `mol-context-capsule` design contract from `.spec/design/system/molecules/context-capsule/`, plus 10 sandbox stories (5 states × 2 themes) registered in `LaneShadowStories.all` so the design-review pipeline can capture each variant against the 2026-05-06 references.

**Success State:** `xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests` exits 0; opening the iOS sandbox catalog shows 10 stories under `molecules.context-capsule.*` rendering each state in light + dark glass with token-purity verified by `scripts/tokens/enforce-native-compliance.sh`.

## Acceptance Criteria

### AC-1 — Idle state renders greeting + meta dot row

**GIVEN** `LSContextCapsule(state: .idle(headline: 'Where are we riding *today*, Justin?', metaItems: ['Friday', '68°F', 'Clear']))`
**WHEN** the view renders in light theme
**THEN** Newsreader headline displays with italic copper em on 'today', meta row shows three label-sm spans separated by translucent dots, and the container resolves to `surface.glass` background with `border.default` hairline and `radius.lg` corners
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_idleState_rendersHeadlineAndMetaRow`

### AC-2 — Planning state renders single-line headline + pulse spinner

**GIVEN** `LSContextCapsule(state: .planning(headline: 'Sketching a coastal loop…'))`
**WHEN** the view renders
**THEN** the layout is a horizontal HStack with a copper pulse-dot (`signal.default`) on the leading edge and an italic Newsreader headline; the pulse animates 1.4s ease-in-out unless reduce-motion is enabled in which case the dot is static
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_planningState_rendersSpinnerAndHeadline`

### AC-3 — Route state shows JetBrains Mono metrics in content-tertiary

**GIVEN** `LSContextCapsule(state: .route(name: 'Coastal cruise' as italic AttributedString, metrics: ['47 mi', '2h 15m', 'arr 4:32p']))`
**WHEN** the view renders
**THEN** headline shows the route name as italic `content.primary` em (NOT signal copper), and the meta row resolves to JetBrains Mono / instrument font in `content.tertiary` with three dot-separated metrics
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_routeState_rendersInstrumentMetrics`

### AC-4 — Warning modifier tints meta row to status.warning

**GIVEN** `LSContextCapsule(state: .idle(headline: 'Not the *prettiest* day for it.', metaItems: ['Friday', '52°F', 'Rain · 0.4″']), isWarning: true)`
**WHEN** the view renders
**THEN** meta row foregroundStyle resolves to `LaneShadowTheme.color.status.warning.default`; headline retains copper italic em; capsule chrome (background, border, radius) is unchanged from base idle
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_warningModifier_tintsMetaRowWarning`

### AC-5 — Saved modifier draws copper hairline overlay

**GIVEN** `LSContextCapsule(state: .route(name: 'Mountain Pass Sunrise', metrics: ['62 mi','3h 02m','arr 9:18a']), isSaved: true)`
**WHEN** the view renders
**THEN** a RoundedRectangle stroke at `borderWidth.thin` of `signal.default` is drawn as an overlay on the inherited `radius.lg` corner; the saved overlay is removed when `isSaved` is false
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_savedModifier_drawsCopperHairline`

### AC-6 — Dark theme re-resolves all surfaces, signals, and meta tints

**GIVEN** the same idle and route inputs as AC-1 and AC-3, mounted under `colorScheme(.dark)` and `\.theme` reset to dark variant
**WHEN** the views render
**THEN** `surface.glass` resolves to dark token, `content.primary` swaps to dark-mode primary, `signal.default` copper remains identical brand color across themes (per design contract), and no shape/typography deltas are observed
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_darkTheme_reResolvesTokens`

### AC-7 — Token purity (zero hex literals or numeric typography)

**GIVEN** the new file `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift`
**WHEN** `scripts/tokens/enforce-native-compliance.sh` runs
**THEN** exit 0 with no findings; `LSContextCapsule.swift` contains zero `Color(red:...)`, zero hex strings, zero numeric font-size literals, zero hardcoded spacing CGFloat constants
**Verify:** `scripts/tokens/enforce-native-compliance.sh && grep -E 'Color\(red:|#[0-9A-Fa-f]{6}|\.font\(\.system\(size:' ios/LaneShadow/Views/Molecules/LSContextCapsule.swift | wc -l`

### AC-8 — Sandbox catalog registers all 10 stories

**GIVEN** `LSContextCapsuleStories.all` is included in `MoleculesStories.all`
**WHEN** the sandbox app builds and the story registry is queried
**THEN** 10 stories exist with IDs `molecules.context-capsule.{idle,planning,route,warning,saved}-{light,dark}` and each story renders the corresponding state without runtime errors
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_sandboxStories_allTenRegistered`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Idle state renders headline AttributedString with italic copper em on the scope-word and meta row of label-sm dot-separated spans | AC-1 | `xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_idleState_rendersHeadlineAndMetaRow` | happy_path |
| TC-2 | Planning state renders horizontal layout with copper pulse-dot + italic single-line headline; pulse animation respects accessibilityReduceMotion | AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_planningState_rendersSpinnerAndHeadline` | happy_path |
| TC-3 | Route state forces meta row to instrument font in content.tertiary; route name italic em uses content.primary not signal | AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_routeState_rendersInstrumentMetrics` | happy_path |
| TC-4 | Warning modifier on idle tints meta row to status.warning.default while leaving headline italic em in copper | AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_warningModifier_tintsMetaRowWarning` | edge |
| TC-5 | Saved modifier on route adds copper hairline overlay; toggling isSaved=false removes overlay | AC-5 | `xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_savedModifier_drawsCopperHairline` | edge |
| TC-6 | Mounting same inputs under colorScheme(.dark) re-resolves surface.glass and content.primary tokens; no shape changes | AC-6 | `xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_darkTheme_reResolvesTokens` | happy_path |
| TC-7 | enforce-native-compliance.sh and grep show zero hex/RGB/numeric-font-size violations in LSContextCapsule.swift | AC-7 | `scripts/tokens/enforce-native-compliance.sh && grep -cE 'Color\(red:|#[0-9A-Fa-f]{6}' ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` | edge |
| TC-8 | Story registry contains exactly 10 entries with id prefix molecules.context-capsule. | AC-8 | `xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_sandboxStories_allTenRegistered` | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `.spec/design/system/molecules/context-capsule/context-capsule.html` | all | Visual contract — surface.glass + blur(14)+sat(1.2), border.default hairline, radius.lg, padding space-3×space-4, 5 state variants, italic copper scope-word |
| `.spec/design/system/molecules/context-capsule/README.md` | all | State matrix, token recipe, geometry table, accessibility roles, production mapping to IdleViewModel.greetingScope/metaRow/weatherAdvisory |
| `ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift` | 1-110 | Pattern source — token-driven SwiftUI molecule using LaneShadowTheme.color.{surface,signal,status} + theme.radius/borderWidth + RoundedRectangle stroke overlay |
| `ios/LaneShadow/Views/Molecules/LSAdvisoryCard.swift` | 1-77 | Closest analogue — composes colored-stripe + tinted background + Newsreader italic body using theme tokens; replaceable by capsule --warning state |
| `ios/LaneShadow/Sandbox/Stories/Molecules/LSChatInputStories.swift` | 1-80 | Sandbox story registration pattern — Story struct with id/tier/component/name + closure returning a SwiftUI view, aggregated into MoleculesStories.all |
| `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-IOS-T01-idle-viewmodel-evolution.md` | all | Greeting.scope state machine + greetingDisplayName/metaRow/weatherAdvisory data fields the capsule will eventually consume in T05 |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` (NEW)
- `ios/LaneShadow/Sandbox/Stories/Molecules/LSContextCapsuleStories.swift` (NEW)
- `ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift` (MODIFY — add LSContextCapsuleStories.all to MoleculesStories.all)
- `ios/LaneShadowTests/Molecules/LSContextCapsuleTests.swift` (NEW)
- `ios/project.yml` (MODIFY only if file additions require regeneration)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Atoms/LSMap.swift` — Sprint 06 map host, do not touch
- `ios/LaneShadow/AppFlow/MapView/**` — Sprint 06 host, out of scope
- `ios/LaneShadow/Features/Idle/**` — IdleViewModel wiring lives in CAPS-S07-T05
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` — modified by CAPS-S07-T05
- `android/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope
- `ios/LaneShadow.xcodeproj/**` — generated; only edit `ios/project.yml`

## Design

**References:**
- `.spec/design/system/molecules/context-capsule/context-capsule.html`
- `.spec/design/system/molecules/context-capsule/README.md`

**Interaction Notes:** The capsule is non-interactive presentation chrome — no tap targets, no focus traversal. Pulse-dot animation must be guarded by `@Environment(\.accessibilityReduceMotion)`; under reduce-motion, dot is statically opaque. Headline em rendering uses AttributedString with italic+foregroundColor(signal.default) for idle/planning and italic+foregroundColor(content.primary) for route — never both copper and primary in the same headline.

**Pattern:** `ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift:1-110` — token-driven container with theme-resolved background, hairline stroke, radius via theme.radius.*, internal sub-rows via @ViewBuilder

**Pattern Source:** Sprint 04/05 molecule conventions; `LSAdvisoryCard.swift` demonstrates the colored-stripe + tinted-bg pattern that the `--warning` modifier supplants with status.warning meta-row tint

**Anti-Pattern:** Inlining hex/RGB/font-size literals; rendering the route metric row in the same Newsreader font as idle (must switch to instrument/JetBrains Mono); creating a separate state for `--warning` instead of an additive Bool modifier on `.idle`

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_idleState_rendersHeadlineAndMetaRow` |
| AC-2 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_planningState_rendersSpinnerAndHeadline` |
| AC-3 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_routeState_rendersInstrumentMetrics` |
| AC-4 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_warningModifier_tintsMetaRowWarning` |
| AC-5 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_savedModifier_drawsCopperHairline` |
| AC-6 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_darkTheme_reResolvesTokens` |
| AC-7 | `scripts/tokens/enforce-native-compliance.sh` |
| AC-8 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_sandboxStories_allTenRegistered` |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| lint | `swiftlint lint ios/LaneShadow/Views/Molecules/LSContextCapsule.swift ios/LaneShadow/Sandbox/Stories/Molecules/LSContextCapsuleStories.swift` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** New SwiftUI molecule under `ios/LaneShadow/Views/Molecules` with @Observable-aware state struct + token-driven glass surface; matches swift-implementer's mandate (SwiftUI views, Newsreader/JetBrains Mono typography, design-token compliance, sandbox stories). The work is purely in Swift/SwiftUI with sandbox NativeSandbox Story registrations.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md`
- `brain/docs/mobile-architecture/testing-strategy.md`
- `brain/docs/mobile-architecture/performance-optimization.md`
- `RULES.md` (LaneShadow §Cross-Platform Component Parity, §Accessibility Standards iOS)

## Dependencies

**Depends on:** _(none)_
**Blocks:**
- CAPS-S07-T05 (idle retrofit consumes LSContextCapsule)
- CAPS-S07-T07 (capture tests reference idle-context-capsule a11y id)
- CAPS-S07-T09 (sprint gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN .idle state with greeting+meta WHEN render in light THEN Newsreader headline with italic copper em on scope-word, meta dot row, surface.glass+border.default+radius.lg chrome","verify":"xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_idleState_rendersHeadlineAndMetaRow","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN .planning state WHEN renders THEN HStack with copper signal.default pulse-dot + italic Newsreader headline, animation respects reduce-motion","verify":"xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_planningState_rendersSpinnerAndHeadline","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN .route state WHEN renders THEN italic content.primary route name em + JetBrains Mono content.tertiary metric meta row","verify":"xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_routeState_rendersInstrumentMetrics","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN .idle + isWarning=true WHEN renders THEN meta row resolves to status.warning.default; headline em stays copper","verify":"xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_warningModifier_tintsMetaRowWarning","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN .route + isSaved=true WHEN renders THEN copper signal.default hairline overlay drawn at radius.lg; removed when false","verify":"xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_savedModifier_drawsCopperHairline","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN dark colorScheme WHEN renders THEN surface.glass+content.primary tokens re-resolve dark; signal.default copper unchanged","verify":"xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_darkTheme_reResolvesTokens","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"GIVEN file LSContextCapsule.swift WHEN enforce-native-compliance.sh runs THEN exit 0; zero hex/RGB/numeric font literals","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-8","type":"acceptance_criterion","description":"GIVEN MoleculesStories.all WHEN queried THEN 10 stories with id prefix molecules.context-capsule. exist (5 states × 2 themes)","verify":"xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_sandboxStories_allTenRegistered","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Idle state renders Newsreader italic em + label-sm dot row","verify":"xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_idleState_rendersHeadlineAndMetaRow","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Planning state pulse-dot animates with reduce-motion guard","verify":"xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_planningState_rendersSpinnerAndHeadline","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Route state forces instrument-mono meta in content.tertiary","verify":"xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_routeState_rendersInstrumentMetrics","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Warning modifier flips meta tint to status.warning.default","verify":"xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_warningModifier_tintsMetaRowWarning","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Saved modifier toggles copper hairline overlay","verify":"xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_savedModifier_drawsCopperHairline","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Dark theme re-resolves tokens with no shape changes","verify":"xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_darkTheme_reResolvesTokens","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Native compliance shell returns 0 findings","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"},
    {"id":"TC-8","type":"test_criterion","description":"10 sandbox stories present under molecules.context-capsule.","verify":"xcodebuild test -only-testing:LaneShadowTests/Molecules/LSContextCapsuleTests/test_sandboxStories_allTenRegistered","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-8"}
  ]
}
-->
