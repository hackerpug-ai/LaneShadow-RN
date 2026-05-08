# CAPS-S07-T02 — Android LSContextCapsule molecule (Compose parity, 5 state variants, glass surface, sandbox stories)

> Status: ✅ Done
> Cycle: 1
> Commit: ba03ab54ebb4c3fb30f9bb68213ba17d10056446
> Updated: 2026-05-07T21:15:00-07:00

> **Task ID:** CAPS-S07-T02 · **Sprint:** [Sprint 07](./SPRINT.md) · **Agent:** kotlin-implementer · **Estimate:** 240 min · **Type:** FEATURE · **Status:** Done · **Priority:** P0 · **Effort:** L
> **PRD Refs:** UC-FID-01, UC-CHAT-01, UC-MAP-01

## Background

Android parity to CAPS-S07-T01 (iOS). Compose composable `LSContextCapsule` mirrors the `mol-context-capsule` design contract. State sealed class (`CapsuleState.Idle/Planning/Route` + `isWarning`/`isSaved` modifiers) drives all visual variants. Token-driven glass surface, italic em on scope-word via AnnotatedString + SpanStyle, JetBrains Mono override on Route metrics, copper hairline overlay on Saved.

## Critical Constraints

**MUST:**
- Drive ALL colors via `LocalLaneShadowTheme.current` — zero `Color(0xFF…)` literals; `scripts/tokens/enforce-native-compliance.sh` exits 0
- Own glass surface via `LSGlassPanel` reuse OR a token-driven recipe matching surface-glass / border-default / radius-lg / elev-overlay / blur 14dp — never hand-roll a non-token surface
- Place italic em on the scope-word ONLY (Idle: copper signal-default; Route: content-primary) using AnnotatedString + SpanStyle(fontStyle=Italic), never a wholly-italic headline
- Register all 10 stories (5 states × 2 themes) with canonical IDs `molecules.contextcapsule.{idle|idle-evening|idle-no-location|idle-warning|idle-first-ride|planning|route|route-saved}.{light|dark}`

**NEVER:**
- Wire live ViewModel data inside this task — the molecule consumes its own `CapsuleState`; live wiring lives in CAPS-S07-T06
- Hardcode `Color(0xFF…)` hex literals
- Use Material 3 default-tinted components (FilledIconButton, etc.) without theme overrides

**STRICTLY:**
- Mirror canonical sandbox story id naming per `RULES.md §Cross-Platform Component Parity` — iOS twin (CAPS-S07-T01) MUST share these IDs
- Pure stateless `@Composable` — no Hilt or DI here

## Specification

**Objective:** Ship a new `LSContextCapsule` Compose molecule with 5 visual state variants matching the design contract, plus 10 sandbox stories (5 states × 2 themes) registered in `AppStories.all`.

**Success State:** `./gradlew :app:testDebugUnitTest` exits 0; `./gradlew :app:assembleDebug` builds clean; sandbox catalog contains 10 entries under `molecules.contextcapsule.*`; `scripts/tokens/enforce-native-compliance.sh` exit 0.

## Acceptance Criteria

### AC-1 — Idle state renders italic copper scope-word + meta dot row [PRIMARY]

**GIVEN** `CapsuleState.Idle(scope=IdleScope.TODAY, headline=AnnotatedString building 'Where are we riding today, Justin?' with italic SpanStyle on 'today', metaItems=listOf('Friday','68°F','Clear'))`
**WHEN** `LSContextCapsule` composes
**THEN** Newsreader 17sp headline node exists with italic span on 'today' tinted `theme.colors.signal.default`; meta row renders 3 text labels separated by 4dp circular dots (45% currentColor opacity) styled `theme.typography.ui.label.sm`; surface uses `theme.colors.card.default` at 0.72 alpha behind a 14dp blur; border = `theme.colors.border.default` at `theme.stroke.sm`; radius = `theme.radius.lg`
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.idle_state_renders_copper_italic_scope_and_meta_dots'`

### AC-2 — Planning state renders pulse spinner + italic single-line headline

**GIVEN** `CapsuleState.Planning(headline='Sketching a coastal loop…')`
**WHEN** `LSContextCapsule` composes
**THEN** Capsule lays out as horizontal Row with 12dp gap between LSCapsuleSpinner (8dp dot pulsing 0.4→1.0 alpha at 1.4s with InfiniteTransition) and a fully-italic Newsreader 15sp headline; reduceMotion accessibility flag freezes spinner alpha at 0.7
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.planning_state_renders_pulse_spinner_and_italic_headline'`

### AC-3 — Route state renders italic primary name + JetBrains Mono tertiary metrics

**GIVEN** `CapsuleState.Route(name='Coastal cruise', metrics=listOf('47 mi','2h 15m','arr 4:32p'), isSaved=false)`
**WHEN** `LSContextCapsule` composes
**THEN** Headline renders 'Coastal cruise' wrapped in italic SpanStyle tinted `theme.content.primary` (NOT signal); meta row uses `fontFamily=theme.typography.fontFamilies.instrument` (JetBrains Mono) at `theme.content.tertiary`; no copper signal hairline border (isSaved=false)
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.route_state_uses_primary_italic_and_mono_tertiary_metrics'`

### AC-4 — isWarning modifier tints meta row to status-warning

**GIVEN** `CapsuleState.Idle(scope=IdleScope.TODAY, headline=AnnotatedString building 'Not the prettiest day for it.' with italic 'prettiest', metaItems=listOf('Friday','52°F','Rain · 0.4″'), isWarning=true)`
**WHEN** `LSContextCapsule` composes
**THEN** Meta row text and dots both tint to `theme.colors.warning.default` (=`--status-warning`); headline color and italic em color remain unchanged; capsule surface chrome unchanged
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.warning_modifier_tints_meta_row_only'`

### AC-5 — isSaved modifier paints copper signal hairline border on Route

**GIVEN** `CapsuleState.Route(name='Mountain Pass Sunrise', metrics=listOf('62 mi','3h 02m','arr 9:18a'), isSaved=true)`
**WHEN** `LSContextCapsule` composes
**THEN** Capsule renders an additional inset hairline border (`theme.stroke.sm`) in `theme.colors.signal.default` on top of the default border-default border; semantics expose `lsContextCapsuleSaved=true` for tests
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.saved_modifier_paints_copper_hairline_border'`

### AC-6 — Theme toggle re-resolves glass + tints without remount

**GIVEN** Capsule rendered in light theme then `LocalLaneShadowTheme` switches to dark via `LaneShadowThemeBridge`
**WHEN** Compose recomposes
**THEN** Surface alpha + border tokens re-resolve to dark equivalents; copper signal-default and warning tints remain identical brand colors across themes; the underlying composable instance identity is stable (no `key()` reset)
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.theme_toggle_reresolves_tokens_without_remount'`

### AC-7 — Sandbox catalog registers 10 canonical capsule stories

**GIVEN** `AppStories.all` assembled at debug build time
**WHEN** Filtered for ids matching `molecules.contextcapsule.*`
**THEN** Result contains exactly 10 entries with canonical IDs `molecules.contextcapsule.{idle|idle-evening|idle-no-location|idle-warning|idle-first-ride|planning|route|route-saved}.{light|dark}` — each `Story.tier = ComponentTier.Molecule` and `component = 'LSContextCapsule'`; `AppStoriesNamingTest` passes
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.sandbox.AppStoriesRegistryTest.context_capsule_registers_ten_canonical_stories'`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | Idle state shows italic copper SpanStyle on scope word + 3 meta labels with 4dp dots between | AC-1 | happy_path |
| TC-2 | Planning state composes Row(spinner, italic headline) with InfiniteTransition pulse | AC-2 | happy_path |
| TC-3 | Route state uses content-primary italic for name + JetBrains Mono content-tertiary for metrics | AC-3 | happy_path |
| TC-4 | isWarning=true → meta row only colored theme.colors.warning.default | AC-4 | edge_case |
| TC-5 | isSaved=true on Route → inset hairline at theme.colors.signal.default | AC-5 | edge_case |
| TC-6 | LaneShadowThemeBridge dark switch keeps composable identity stable | AC-6 | happy_path |
| TC-7 | AppStoriesRegistryTest counts 10 ids matching `molecules.contextcapsule.*` regex | AC-7 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt` | 1-120 | **PRIMARY PATTERN** — glass-panel composition + LocalLaneShadowTheme.current resolution + Modifier composition discipline |
| `android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt` | 60-180 | resolveGlassBlurStrategy + LSGlassPanelStyle token recipe — REUSE LSGlassPanel as the surface or mirror its blur strategy |
| `android/app/src/main/java/com/laneshadow/ui/molecules/LSAdvisoryCard.kt` | 1-100 | Closest precedent for warning-tinted molecule — token resolution for `theme.colors.warning.default` |
| `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSChatInputStory.kt` | 1-90 | Story registration shape with canonical id `molecules.{component}.{variant}` + LaneShadowTheme wrapper |
| `.spec/design/system/molecules/context-capsule/context-capsule.html` | all | Visual ground truth: glass-surface tokens, italic em rules per state, meta dot recipe at 4dp/45% opacity |

## Guardrails

**Write-Allowed:**
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSContextCapsule.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSContextCapsuleTypes.kt` (NEW — `CapsuleState` sealed class + `IdleScope` enum)
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSContextCapsuleTest.kt` (NEW)
- `android/app/src/test/java/com/laneshadow/ui/sandbox/AppStoriesRegistryTest.kt` (MODIFY — add capsule story assertion)
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSContextCapsuleStory.kt` (NEW)
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt` (MODIFY — add `LSContextCapsuleStory.all`)

**Write-Prohibited:**
- `ios/**`, `server/**`, `react-native/**`, `tokens/**`
- `android/app/src/main/java/com/laneshadow/ui/idle/**` — capsule wiring lives in CAPS-S07-T06
- `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` — retrofit lives in T06
- `android/app/src/androidTest/**` — instrumented updates live in T08

## Design

**References:**
- `.spec/design/system/molecules/context-capsule/context-capsule.html`
- `.spec/design/system/molecules/context-capsule/README.md`

**Token Recipe:**
- Surface: `theme.colors.card.default` @ 0.72 alpha behind 14dp blur (mirror `resolveLSGlassPanelStyle` with `radius=theme.radius.lg`)
- Border: `theme.colors.border.default` at `theme.stroke.sm`
- Radius: `theme.radius.lg` (10dp)
- Padding: horizontal `theme.space.md` (12dp), vertical `theme.space.sm` (8dp)
- Min/max width: 220.dp / 340.dp
- Headline (Idle/Route): `theme.typography.opinion.md` (Newsreader 17sp); Planning: `theme.typography.opinion.sm` (15sp)
- Meta default: `theme.typography.ui.label.sm`; Route override: `fontFamily=theme.typography.fontFamilies.instrument`
- Headline em color: Idle/Planning → `theme.colors.signal.default`; Route → `theme.content.primary`
- Meta colors: default → `theme.content.secondary`; Route → `theme.content.tertiary`; Warning → `theme.colors.warning.default`
- Saved border: `theme.colors.signal.default` at `theme.stroke.sm` inset
- Spinner: `theme.colors.signal.default`
- Meta dot: 4.dp circle, currentColor at 0.45 alpha

**Pattern:** `LSChatInput.kt:1-120` — token-driven Compose molecule using `LocalLaneShadowTheme.current` + `LSGlassPanel` + sealed-class state

**Pattern Source:** Sprint 06 LSChatInput shape; LSAdvisoryCard demonstrates warning-tinted token resolution

**Anti-Pattern:** Color hex literals; theme-wide italic on the whole headline; depending on IdleViewModel; splitting Idle into multiple top-level composables

**Compose Considerations:** State sealed class is `@Stable` (data classes with primitives + immutable `List<String>`). Spinner uses `rememberInfiniteTransition` keyed on `LocalAccessibilityManager.current.isReduceMotionEnabled` so reduce-motion freezes animation. SpanStyle + AnnotatedString allocation hoisted to `remember(state)` block.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.idle_state_renders_copper_italic_scope_and_meta_dots'` |
| AC-2 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.planning_state_renders_pulse_spinner_and_italic_headline'` |
| AC-3 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.route_state_uses_primary_italic_and_mono_tertiary_metrics'` |
| AC-4 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.warning_modifier_tints_meta_row_only'` |
| AC-5 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.saved_modifier_paints_copper_hairline_border'` |
| AC-6 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.theme_toggle_reresolves_tokens_without_remount'` |
| AC-7 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.sandbox.AppStoriesRegistryTest.context_capsule_registers_ten_canonical_stories'` |
| build | `./gradlew :app:assembleDebug` |
| compile | `./gradlew :app:compileDebugKotlin` |
| lint | `./gradlew detekt` |
| tokens | `scripts/tokens/enforce-native-compliance.sh` |
| scope | `git diff --name-only` ⊆ writeAllowed |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Pure Compose component authoring with theme-driven glass surface, italic AnnotatedString headlines, sandbox story registration — matches kotlin-implementer's molecule remit and follows the IDLE-S06-AND-T02 / LSChatInput pattern in this codebase.

## Coding Standards

- `RULES.md` §Cross-Platform Component Parity — story IDs match canonical lowercase.dot-separated.kebab-case spec; iOS T01 uses identical IDs
- `RULES.md` §Accessibility Standards (Android) — capsule headline exposed via `Modifier.semantics { heading() }` when used as page primary heading
- `RULES.md` §Verification Standards — exact gradle commands above
- `brain/docs/mobile-architecture/android-principles.md` — UDF pure stateless composable; state hoisting at consumer site
- `brain/docs/mobile-architecture/performance-optimization.md` — `remember(state)` for AnnotatedString construction; `@Stable` sealed class

## Dependencies

**Depends on:** _(none)_
**Blocks:** CAPS-S07-T06 (idle retrofit consumes LSContextCapsule)
**Parallel:** CAPS-S07-T01 (iOS twin), CAPS-S07-T04 (Android map controls)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN CapsuleState.Idle with italic 'today' WHEN composed THEN copper italic span + meta dot row + glass surface","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.idle_state_renders_copper_italic_scope_and_meta_dots'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN CapsuleState.Planning WHEN composed THEN spinner + italic headline in Row layout","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.planning_state_renders_pulse_spinner_and_italic_headline'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN CapsuleState.Route WHEN composed THEN content-primary italic + JetBrains Mono tertiary metrics","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.route_state_uses_primary_italic_and_mono_tertiary_metrics'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN isWarning=true WHEN composed THEN meta row tints to status-warning only","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.warning_modifier_tints_meta_row_only'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN isSaved=true on Route WHEN composed THEN copper hairline overlay","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.saved_modifier_paints_copper_hairline_border'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN light theme WHEN bridge flips dark THEN tokens re-resolve no remount","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.theme_toggle_reresolves_tokens_without_remount'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"AppStories.all contains 10 capsule stories with canonical IDs","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.sandbox.AppStoriesRegistryTest.context_capsule_registers_ten_canonical_stories'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Idle italic copper scope + 3 meta labels with dots","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.idle_state_renders_copper_italic_scope_and_meta_dots'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Planning Row(spinner, italic headline)","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.planning_state_renders_pulse_spinner_and_italic_headline'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Route italic content-primary + Mono metrics","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.route_state_uses_primary_italic_and_mono_tertiary_metrics'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Warning meta row tint","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.warning_modifier_tints_meta_row_only'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Saved hairline overlay","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.saved_modifier_paints_copper_hairline_border'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Theme switch composable identity stable","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest.theme_toggle_reresolves_tokens_without_remount'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"10 capsule IDs in AppStoriesRegistryTest","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.sandbox.AppStoriesRegistryTest.context_capsule_registers_ten_canonical_stories'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"}
  ]
}
-->
