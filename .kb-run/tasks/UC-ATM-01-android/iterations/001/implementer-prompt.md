# kb-run Implementer Prompt

Task: UC-ATM-01-android
Platform: Android Compose
Implementer role: kotlin-implementer
Reviewer role: kotlin-reviewer
Sprint: sprint-02-atoms-foundation-primitives
Worktree only: $(pwd)

## Non-Negotiable kb-run Rules

- You are a direct `codex exec` child process, not an in-harness subagent. Do not spawn or delegate to any subagent.
- Work only in this task worktree. Do not edit parent/main worktree files.
- Do not edit any `.kb-run*` orchestrator state, task notebooks, session logs, or checksums.
- Create a real git commit before finishing. Commit normally so hooks run. Never use `--no-verify`, `-n`, hook-disabling environment variables, or disabled hook paths.
- Finish with a clean worktree.
- Use `scripts/agent-worktree-env.sh` isolation. The launch wrapper sources it before Codex starts; verify `DERIVED_DATA_PATH` / `GRADLE_USER_HOME` if you run builds.
- Respect LaneShadow RULES.md. In particular: do not mutate `.pbxproj`, `.xcodeproj`, or `.xcworkspace` internals. If target membership blocks iOS build/test, report a blocker instead of editing those files.
- Consume generated theme tokens only. No literal colors, spacing, typography, SF Symbols, or Material Icons in atom code unless the task explicitly permits it.
- Sandbox stories must use the native-sandbox Story contract and tier aggregators.

## Required Reading

Read these before editing:

1. `/Users/justinrich/Projects/brain/docs/ROOT-CONTEXT.md`
2. `RULES.md`
3. `/Users/justinrich/Projects/brain/agents/kotlin-implementer.md` for role-specific implementation guidance, but kb-run rules above override any instruction to spawn reviewers/subagents.
4. This task markdown below.
5. The task's READING LIST and referenced design/spec files.

## Current Sprint Reconciliation

The host verified these tasks are already ancestors of current `main`:

- UC-ATM-01-ios at commit 66a1dfc4
- UC-ATM-06-ios at commit 7b44a079

These older implementation commits exist off-history and are not considered complete unless reviewed/merged later:

- UC-ATM-02-ios: 4a996f04
- UC-ATM-02-android: b9cb264d
- UC-ATM-03-ios: 898c4b7f
- UC-ATM-03-android: 63df8b92
- UC-ATM-04-ios: 89adf155 on a misnamed unmerged branch

Base your work on current HEAD in this worktree; do not cherry-pick off-history work unless the task requires it and you can keep scope clean.

## Expected Workflow

1. Inspect existing code and generated token APIs.
2. Add focused tests first where practical; show failing evidence in your final response.
3. Implement the atom and sandbox stories inside SCOPE.
4. Run the runtime commands from the task file, or the closest available subset if a command is blocked.
5. Commit all task changes with a message starting with `UC-ATM-01-android:` or `feat(UC-ATM-01-android):`.
6. Final response must include commit SHA, changed files, validation commands and results, and blockers if any.

## Sprint Overview

# Sprint 2: Atoms — Foundation Primitives

**Sequence:** 2
**Timeline:** Phase 2 · Week 2
**Status:** Planned

---

## Overview

This sprint delivers the ten non-map atom UCs — the smallest typed UI primitives that every molecule, organism, and screen downstream will compose from. Each atom ships as paired iOS (SwiftUI) + Android (Compose) implementations with identical public APIs and identical sandbox stories, consumes only TOK-generated constants (no literal colors, no literal spacing), and registers in the Atoms tier aggregator on both platforms. This set includes the four Navigator-specific primitives that are new in V2 — `LSPill`, `LSGlassPanel`, `LSPhaseDot`, `LSScrim` — plus the design-owned SVG `LSIcon` catalog that retires SF Symbols and Material Icons.

Per-platform split: every UC expands to a paired `-ios` + `-android` task so `swift-implementer` and `kotlin-implementer` work in parallel without shared-tree contention. The 10-task-per-sprint gate is intentionally exceeded (20 paired tasks) to surface parallel execution at the planning layer; the sprint's human testing gate still operates at UC granularity.

---

## Package Boundaries (CONSTITUTION)

Inherited from Sprint 1; restated for enforcement at reviewer time.

- **Theme package is the ONLY token source.** Every atom imports colors, typography, spacing, motion recipes, and icon names from the project-local theme package:
  - iOS → `tokens/platforms/swift/Sources/LaneShadowTheme/` (generated `Tokens.swift` + `ThemeProvider` + `@Environment` hooks).
  - Android → `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/` + `LaneShadowTheme` Compose wrapper.
  - The theme package path-references `~/Projects/native-theme` for `ColorSet` / `TypographyStyle` / `parseColorString` primitives. No `Color(red:...)`, no `Color(0xFF...)`, no `systemFont(ofSize:)`, no `FontFamily.Serif`, no SF Symbols, no Material Icons anywhere in atom code.
- **Sandbox runtime is the ONLY preview surface.** Every atom ships a Story that consumes `Story`, `SandboxRoot`, `ThemeController`, `ArgValues` from `~/Projects/native-sandbox`:
  - iOS stories live at `ios/LaneShadow/Sandbox/Stories/*Stories.swift` (SPM path ref to `~/Projects/native-sandbox/ios/`).
  - Android stories live at `android/app/src/debug/java/com/laneshadow/sandbox/stories/*Stories.kt` (Gradle composite to `~/Projects/native-sandbox/android/`).
  - Atom previews outside the sandbox (e.g. `#Preview {}` without the `Story` wrapper, custom debug screens) are rejected at review.
- **Story contract (native-sandbox Tier 1 — `~/Projects/native-sandbox/RULES.md` §6).** Every atom ships one or more `Story` values conforming to:
  - `id` — dotted, tier-first, stable: `atoms.{component}.{variant}` (e.g. `atoms.button.primary`, `atoms.icon.catalog`, `atoms.glasspanel.callout-signal`).
  - `tier` — `ComponentTier.atom` (iOS) / `ComponentTier.Atom` (Android). Do NOT introduce new tiers; the enum is fixed at 6 values by native-sandbox.
  - `component` — PascalCase component name (e.g. `"LSButton"`, `"LSIcon"`).
  - `name` — short human-readable variant label ("Primary Button", "Catalog", "Callout Signal").
  - `summary` — one sentence describing what the story demonstrates.
  - Render closure — takes `ArgValues` (iOS) or no args (Android); returns the rendered component.
  - Stateless by default. Mutable state belongs in the ThemeController or fixture providers, not inside the story closure.
- **Tier aggregator composition.** Stories register via per-tier enums/objects (`AtomStories.all` on iOS — an `enum` with `static let all: [Story]`; `AtomStories.all` on Android — an `object` with `val all: List<Story>`). The host-level `LaneShadowSandbox` composes `AtomStories.all + MoleculeStories.all + …`. No global registry.
- **Debug-only on Android.** Every atom Story file lives under `android/app/src/debug/java/com/laneshadow/sandbox/stories/`. Release builds must not ship any sandbox code — `./gradlew :app:assembleRelease` followed by a grep of the resulting APK for `com.nativesandbox` returns zero matches.
- **ArgTypes discipline.** Native-sandbox Tier 1 does not render dynamic ArgType controls yet. Ship `argTypes` metadata where useful (iOS has scaffolding for `text`/`boolean`/`select`/`radio`/`range`/`color`/`object`) but do not build a competing inspector UI in the host — per `RULES.md` §10, the moment you need runtime controls, open a PR against native-sandbox instead. Stories without `argTypes` must still render from their `initialArgs`/stateless render closure.

---

## Human Test Deliverable

A reviewer can open every foundation atom story in the sandbox on iOS and Android, toggle light and dark, exercise the full `argTypes` inspector for each atom, and confirm that `LSGlassPanel` chrome + callout variants, `LSPill` at all sizes, `LSBadge` status + weather variants, `LSPhaseDot` active-state ring pulse, `LSScrim` tap-through vs. blocking modes, and every icon in the 25-name catalog render identically across platforms and match the Copper Navigator concepts.

**Test Steps:**
1. Launch `/native-sandbox --platform ios` and `/native-sandbox --platform android`; confirm the Atoms tier shows stories for Typography, Button, TextField, TextArea, Display (Avatar/Divider/Spinner), Surface (Card/Panel/GlassPanel), Pill, Badge, PhaseDot, Scrim, and Icon.
2. Open the Typography swatch story on both platforms and verify Newsreader/Geist/JetBrains Mono variants render at token-specified sizes and line heights; increase system font size and confirm Dynamic Type / font-scale scaling.
3. Open the Button family (one story per variant × state) and verify primary/secondary/ghost/accept/destructive/outline each resolve their default/pressed/disabled colors from `color.action.*`, meet minimum touch-target size, and render leading/trailing icon slots correctly.
4. Open the GlassPanel Chrome and Callout (signal/warning) stories on both platforms and verify the translucent backdrop blur, `elevation.overlay`, and 3px leading accent stripe resolve correctly in light and dark.
5. Open the Badge family and verify the six weather variants (`clear/rain/wind/storm/hot/cold`) each render with their correct tint background + solid foreground + leading weather icon; verify `LSBestBadge` renders in `color.signal.*` with a filled-star prefix.
6. Open the PhaseDot story and confirm the Pending/Active/Done states render per token; verify the Active state's concentric ring pulse animation references `motion.recipe.phaseDotPulse` (not a hardcoded duration).
7. Open the Icon swatch story and verify all 25 icons render at `sizing.icon.{xs,sm,md,lg,xl}` with 1.5px rounded stroke from `icon.stroke.width`; grep the repo for `UIImage(systemName:)` / `Image(systemName:)` / `Icons.Filled.*` / `Icons.Outlined.*` and confirm zero matches.
8. Toggle light/dark at every story; run `pnpm sandbox:parity-check` and confirm every Atoms story ID exists on both platforms.

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UC-ATM-01-ios | Typography atoms (`LSText`) — iOS SwiftUI | swift-implementer | 120 min |
| UC-ATM-01-android | Typography atoms (`LSText`) — Android Compose | kotlin-implementer | 120 min |
| UC-ATM-02-ios | Button atom (all variants + states) — iOS SwiftUI | swift-implementer | 240 min |
| UC-ATM-02-android | Button atom (all variants + states) — Android Compose | kotlin-implementer | 240 min |
| UC-ATM-03-ios | Input atoms (`LSTextField`, `LSTextArea`) — iOS SwiftUI | swift-implementer | 180 min |
| UC-ATM-03-android | Input atoms (`LSTextField`, `LSTextArea`) — Android Compose | kotlin-implementer | 180 min |
| UC-ATM-04-ios | Base display atoms (Avatar, Divider, Spinner) — iOS SwiftUI | swift-implementer | 120 min |
| UC-ATM-04-android | Base display atoms (Avatar, Divider, Spinner) — Android Compose | kotlin-implementer | 120 min |
| UC-ATM-05-ios | Surface trio (`LSCard`, `LSPanel`, `LSGlassPanel`) — iOS SwiftUI | swift-implementer | 180 min |
| UC-ATM-05-android | Surface trio (`LSCard`, `LSPanel`, `LSGlassPanel`) — Android Compose | kotlin-implementer | 180 min |
| UC-ATM-06-ios | Pill atom (`LSPill`) — iOS SwiftUI | swift-implementer | 60 min |
| UC-ATM-06-android | Pill atom (`LSPill`) — Android Compose | kotlin-implementer | 60 min |
| UC-ATM-07-ios | Badge atom (`LSBadge` + `LSBestBadge`) — iOS SwiftUI | swift-implementer | 120 min |
| UC-ATM-07-android | Badge atom (`LSBadge` + `LSBestBadge`) — Android Compose | kotlin-implementer | 120 min |
| UC-ATM-08-ios | PhaseDot atom (`LSPhaseDot`) — iOS SwiftUI | swift-implementer | 90 min |
| UC-ATM-08-android | PhaseDot atom (`LSPhaseDot`) — Android Compose | kotlin-implementer | 90 min |
| UC-ATM-09-ios | Scrim atom (`LSScrim`) — iOS SwiftUI | swift-implementer | 60 min |
| UC-ATM-09-android | Scrim atom (`LSScrim`) — Android Compose | kotlin-implementer | 60 min |
| UC-ATM-10-ios | Icon atom (`LSIcon`) — design-owned SVG catalog — iOS SwiftUI | swift-implementer | 240 min |
| UC-ATM-10-android | Icon atom (`LSIcon`) — design-owned SVG catalog — Android Compose | kotlin-implementer | 240 min |

---

## Human Testing Gate

**Gate:** Every foundation atom story renders in the sandbox on both iOS and Android — typography, buttons, inputs, avatar/divider/spinner, surface trio (including `LSGlassPanel` with its translucent blur + leading accent stripe), `LSPill`, `LSBadge` status + weather variants, `LSPhaseDot` with the `motion.recipe.phaseDotPulse` ring pulse, `LSScrim`, and the 25-icon design-owned catalog — identical across platforms and faithful to the Copper concepts, with zero SF Symbols / Material Icons references remaining in either native tree.

---

## Source Coverage

- `.spec/prds/v2/05-uc-atm.md` — UC-ATM-01 through UC-ATM-10 acceptance criteria
- `.spec/prds/v2/concepts/designs.html` — authoritative Copper Navigator composition
- `.spec/prds/v2/11-technical-requirements.md` — atom API surface, platform library contracts, icon generation pipeline
- `~/Projects/native-sandbox/` — Story/SandboxRoot/ThemeController runtime
- `~/Projects/native-theme/` — `ColorSet`, `TypographyStyle`, `parseColorString` primitives

### Per-Task Design Files

| Task | Design Reference |
|------|-----------------|
| UC-ATM-01-ios | [`concepts/uc-atm-01-text.html`](../../concepts/uc-atm-01-text.html) |
| UC-ATM-01-android | [`concepts/uc-atm-01-text.html`](../../concepts/uc-atm-01-text.html) |
| UC-ATM-02-ios | [`concepts/uc-atm-02-button.html`](../../concepts/uc-atm-02-button.html) |
| UC-ATM-02-android | [`concepts/uc-atm-02-button.html`](../../concepts/uc-atm-02-button.html) |
| UC-ATM-03-ios | [`concepts/uc-atm-03-input.html`](../../concepts/uc-atm-03-input.html) |
| UC-ATM-03-android | [`concepts/uc-atm-03-input.html`](../../concepts/uc-atm-03-input.html) |
| UC-ATM-04-ios | [`concepts/uc-atm-04-display.html`](../../concepts/uc-atm-04-display.html) |
| UC-ATM-04-android | [`concepts/uc-atm-04-display.html`](../../concepts/uc-atm-04-display.html) |
| UC-ATM-05-ios | [`concepts/uc-atm-05-surfaces.html`](../../concepts/uc-atm-05-surfaces.html) |
| UC-ATM-05-android | [`concepts/uc-atm-05-surfaces.html`](../../concepts/uc-atm-05-surfaces.html) |
| UC-ATM-06-ios | [`concepts/uc-atm-06-pill.html`](../../concepts/uc-atm-06-pill.html) |
| UC-ATM-06-android | [`concepts/uc-atm-06-pill.html`](../../concepts/uc-atm-06-pill.html) |
| UC-ATM-07-ios | [`concepts/uc-atm-07-badge.html`](../../concepts/uc-atm-07-badge.html) |
| UC-ATM-07-android | [`concepts/uc-atm-07-badge.html`](../../concepts/uc-atm-07-badge.html) |
| UC-ATM-08-ios | [`concepts/uc-atm-08-phasedot.html`](../../concepts/uc-atm-08-phasedot.html) |
| UC-ATM-08-android | [`concepts/uc-atm-08-phasedot.html`](../../concepts/uc-atm-08-phasedot.html) |
| UC-ATM-09-ios | [`concepts/uc-atm-09-scrim.html`](../../concepts/uc-atm-09-scrim.html) |
| UC-ATM-09-android | [`concepts/uc-atm-09-scrim.html`](../../concepts/uc-atm-09-scrim.html) |
| UC-ATM-10-ios | [`concepts/uc-atm-10-icon.html`](../../concepts/uc-atm-10-icon.html) |
| UC-ATM-10-android | [`concepts/uc-atm-10-icon.html`](../../concepts/uc-atm-10-icon.html) |

---

## Blocks

- Sprint 3 (Atoms: LSMap) — `LSGlassPanel` from UC-ATM-05 is consumed by LSMap's error-fallback surface.
- Sprint 4 (Molecules) — every molecule composes from UC-ATM-01 through UC-ATM-10 atoms; no molecule may inline a raw `Text`/`Box` with literal colors.
- Sprints 5, 6, 7 — indirectly, through the molecule + organism + screen dependency chain.

---

## Task Detail Files

Generated by `/kb-sprint-tasks-plan` on 2026-04-21T20:30:00Z

- UC-ATM-01-ios-typography-atoms-lstext-ios-swiftui.md
- UC-ATM-01-android-typography-atoms-lstext-android-compose.md
- UC-ATM-02-ios-button-atom-all-variants-states-ios-swiftui.md
- UC-ATM-02-android-button-atom-all-variants-states-android-compose.md
- UC-ATM-03-ios-input-atoms-lstextfield-lstextarea-ios-swiftui.md
- UC-ATM-03-android-input-atoms-lstextfield-lstextarea-android-compose.md
- UC-ATM-04-ios-base-display-atoms-avatar-divider-spinner-ios-swiftui.md
- UC-ATM-04-android-base-display-atoms-avatar-divider-spinner-android-compose.md
- UC-ATM-05-ios-surface-trio-lscard-lspanel-lsglasspanel-ios-swiftui.md
- UC-ATM-05-android-surface-trio-lscard-lspanel-lsglasspanel-android-compose.md
- UC-ATM-06-ios-pill-atom-lspill-ios-swiftui.md
- UC-ATM-06-android-pill-atom-lspill-android-compose.md
- UC-ATM-07-ios-badge-atom-lsbadge-lsbestbadge-ios-swiftui.md
- UC-ATM-07-android-badge-atom-lsbadge-lsbestbadge-android-compose.md
- UC-ATM-08-ios-phasedot-atom-lsphasedot-ios-swiftui.md
- UC-ATM-08-android-phasedot-atom-lsphasedot-android-compose.md
- UC-ATM-09-ios-scrim-atom-lsscrim-ios-swiftui.md
- UC-ATM-09-android-scrim-atom-lsscrim-android-compose.md
- UC-ATM-10-ios-icon-atom-lsicon-design-owned-svg-catalog-ios-swiftui.md
- UC-ATM-10-android-icon-atom-lsicon-design-owned-svg-catalog-android-compose.md


## Task Markdown

<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-01-android — Typography atoms (`LSText`) — Android Compose
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   120 min

RUNTIME_COMMANDS:
  test:         cd android && ./gradlew :app:testDebugUnitTest
  instrumented: cd android && ./gradlew :app:connectedDebugAndroidTest
  typecheck:    cd android && ./gradlew :app:compileDebugKotlin
  lint:         cd android && ./gradlew detekt
  release:      cd android && ./gradlew :app:assembleRelease && unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox

PRD_REFS:   UC-ATM-01, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-01-text.html
DEPENDS_ON: UC-TOK-01, UC-TOK-05, UC-SBX-00-android
BLOCKS:     UC-ATM-04-android (Avatar initials), UC-MOL-*, UC-ORG-*, UC-SCR-*

PROGRESS: AC-1 none · 0/8 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSText(text: String, variant: TypographyVariant, color: ContentColor = ContentColor.Primary)` renders typed text on Android Jetpack Compose, resolving font family (Newsreader/Geist/JetBrains Mono), size (sp), line-height, weight, and color exclusively from the LaneShadowTheme tokens generated by UC-TOK-01.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER reference `FontFamily.Serif`, `FontFamily.SansSerif`, `FontFamily.Monospace`, `FontFamily.Default`, or any literal font-name string in `android/app/src/main/`. All typography MUST resolve through `LaneShadowTheme.typography.*`.
- NEVER expose a raw `androidx.compose.ui.graphics.Color` parameter on `LSText` — only the `ContentColor` enum (resolves through `color.content.*`). Raw color must be rejected at compile-time.
- NEVER use `androidx.compose.material.icons.*` or `Icons.Filled/Outlined.*` anywhere in the atom or its stories.
- NEVER write Story previews under `android/app/src/main/**`. Stories live ONLY under `android/app/src/debug/java/com/laneshadow/sandbox/stories/**` so the release APK ships zero `com.nativesandbox.*` symbols.
- NEVER use `Color(0xFF…)` literals — all color must resolve through `MaterialTheme.colorScheme` / `LaneShadowTheme.color.*`.
- MUST modify only files listed in SCOPE.writeAllowed.
- STRICTLY no edits to `~/Projects/native-theme/**`, `~/Projects/native-sandbox/**`, or `ios/**`.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSText` composable exists at `android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt` and accepts `text: String`, `variant: TypographyVariant`, `color: ContentColor = ContentColor.Primary` — maps to AC-1 (PRIMARY)
- [ ] Three families (`opinion`/`ui`/`instrument`) all renderable across full size matrix — maps to AC-2, AC-3
- [ ] Font-scale (sp) accessibility scaling propagates — maps to AC-4
- [ ] `ContentColor` override resolves through `color.content.*` — maps to AC-5
- [ ] Raw `Color` parameter rejected at compile-time — maps to AC-6
- [ ] Typography swatch story `atoms.text.swatch` registered (debug variant only) — maps to AC-7
- [ ] No literal font references in LSText.kt — maps to AC-8
- [ ] Release APK contains zero `com.nativesandbox` entries — maps to AC-9 (boundary gate)
- [ ] Android compile/build green; JUnit + Compose UI tests green; detekt clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSText renders opinion.xl variant with token-resolved Newsreader [PRIMARY]
  GIVEN: An Android Compose view importing LaneShadowTheme
  WHEN:  Developer renders `LSText(text = "Where are we riding today?", variant = TypographyVariant.Opinion.Xl)`
  THEN:  Resolved font family == Newsreader, fontSize (sp) and lineHeight match `typography.opinion.xl` token exactly
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSTextTest.kt
  TEST_FUNCTION: opinion_xl_resolves_newsreader_token
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSTextTest.opinion_xl_resolves_newsreader_token"

AC-2: LSText renders ui.body.md variant (Geist sans)
  GIVEN: An Android Compose view
  WHEN:  Developer renders `LSText(text = "Continue", variant = TypographyVariant.Ui.Body.Md)`
  THEN:  Resolved font family == Geist, fontSize + lineHeight match `typography.ui.body.md`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSTextTest.kt
  TEST_FUNCTION: ui_body_md_resolves_geist_token
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSTextTest.ui_body_md_resolves_geist_token"

AC-3: LSText renders instrument.lg variant (JetBrains Mono)
  GIVEN: An Android Compose view
  WHEN:  Developer renders `LSText(text = "64 mi", variant = TypographyVariant.Instrument.Lg)`
  THEN:  Resolved font family == JetBrains Mono, fontSize + lineHeight match `typography.instrument.lg`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSTextTest.kt
  TEST_FUNCTION: instrument_lg_resolves_mono_token
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSTextTest.instrument_lg_resolves_mono_token"

AC-4: Font-scale (sp) accessibility scaling propagates (edge — accessibility)
  GIVEN: An LSText(..., variant = TypographyVariant.Ui.Body.Md) rendered in a host view
  WHEN:  System fontScale is set to 1.5f via `LocalDensity` override
  THEN:  Rendered pixel-size scales proportionally above the token base sp value (since variant uses sp not dp)
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSTextInstrumentationTest.kt
  TEST_FUNCTION: font_scale_propagates_to_rendered_size
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests "com.laneshadow.ui.atoms.LSTextInstrumentationTest.font_scale_propagates_to_rendered_size"

AC-5: ContentColor override resolves through color.content.* (edge)
  GIVEN: `LSText(text = "...", variant = TypographyVariant.Ui.Body.Md, color = ContentColor.Secondary)`
  WHEN:  Rendered
  THEN:  Resolved foreground == `theme.color.content.secondary` (light + dark variants)
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSTextTest.kt
  TEST_FUNCTION: content_color_secondary_resolves_token
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSTextTest.content_color_secondary_resolves_token"

AC-6: Raw Color parameter rejected at compile-time (error gate — type-safety)
  GIVEN: LSText API surface
  WHEN:  Developer attempts `LSText(text = "...", variant = TypographyVariant.Ui.Body.Md, color = Color.Red)`
  THEN:  Kotlin compiler rejects — `color` parameter only accepts `ContentColor` enum (compileDebugKotlin fails on a witness file)
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSTextTest.kt
  TEST_FUNCTION: color_param_rejects_raw_Color (reflective signature assertion)
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSTextTest.color_param_rejects_raw_Color"

AC-7: Typography swatch story registered with id atoms.text.swatch (DEBUG-ONLY)
  GIVEN: `android/app/src/debug/java/com/laneshadow/sandbox/stories/LSTextStories.kt`
  WHEN:  AtomStories.all is composed
  THEN:  Story with id `atoms.text.swatch` exists, tier = `ComponentTier.Atom`, renders the cross-family matrix
  TDD_STATE:     none
  TEST_FILE:     android/app/src/debug/java/com/laneshadow/sandbox/stories/LSTextStories.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        grep -q 'atoms.text.swatch' android/app/src/debug/java/com/laneshadow/sandbox/stories/LSTextStories.kt && grep -q 'LSTextStories' android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomStories.kt

AC-8: No literal font references in LSText.kt (error gate — boundary)
  GIVEN: android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt
  WHEN:  Reviewer greps
  THEN:  Zero matches for `FontFamily.Serif`, `FontFamily.SansSerif`, `FontFamily.Monospace`, `FontFamily.Default`, `Color(0x`, or `androidx.compose.material.icons`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'FontFamily\.(Serif|SansSerif|Monospace|Default)|Color\(0x|androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)' android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt

AC-9: Release APK contains zero sandbox symbols (boundary gate)
  GIVEN: A release build of the app
  WHEN:  APK contents are inspected
  THEN:  Count of `com.nativesandbox` entries is exactly 0
  TDD_STATE:     none
  TEST_FILE:     n/a (build artifact gate)
  TEST_FUNCTION: n/a (shell gate)
  VERIFY:        cd android && ./gradlew :app:assembleRelease && [ "$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)" = "0" ]

--------------------------------------------------------------------------------
TEST CRITERIA (boolean — each maps to one AC)
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Verify |
|-----|-----------|---------|--------|
| TC-1 | LSText opinion.xl resolves Newsreader font + token sp/lineHeight | AC-1 | ./gradlew :app:testDebugUnitTest --tests "*.LSTextTest.opinion_xl_resolves_newsreader_token" |
| TC-2 | LSText ui.body.md resolves Geist font + token sp/lineHeight | AC-2 | ./gradlew :app:testDebugUnitTest --tests "*.LSTextTest.ui_body_md_resolves_geist_token" |
| TC-3 | LSText instrument.lg resolves JetBrains Mono + token sp/lineHeight | AC-3 | ./gradlew :app:testDebugUnitTest --tests "*.LSTextTest.instrument_lg_resolves_mono_token" |
| TC-4 | Rendered size scales when fontScale = 1.5f | AC-4 | ./gradlew :app:connectedDebugAndroidTest --tests "*.LSTextInstrumentationTest.font_scale_propagates_to_rendered_size" |
| TC-5 | color = ContentColor.Secondary resolves theme.color.content.secondary | AC-5 | ./gradlew :app:testDebugUnitTest --tests "*.LSTextTest.content_color_secondary_resolves_token" |
| TC-6 | Raw Color argument is rejected by Kotlin compiler / signature is ContentColor | AC-6 | ./gradlew :app:testDebugUnitTest --tests "*.LSTextTest.color_param_rejects_raw_Color" |
| TC-7 | Story id atoms.text.swatch is present and registered | AC-7 | grep gate above |
| TC-8 | LSText.kt contains zero literal font/color references and no Material Icons | AC-8 | grep gate above |
| TC-9 | Release APK contains zero com.nativesandbox entries | AC-9 | assembleRelease + unzip gate above |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/TypographyVariant.kt (NEW — typed variant enum if not generated)
- android/app/src/main/java/com/laneshadow/ui/atoms/ContentColor.kt (NEW or MODIFY if already exists)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSTextStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomStories.kt (MODIFY — register LSTextStories.all)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSTextTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSTextInstrumentationTest.kt (NEW)

writeProhibited:
- ios/** — swift-implementer scope
- ~/Projects/native-theme/** — schema upstream
- ~/Projects/native-sandbox/** — runtime upstream
- android/app/src/main/** for any sandbox/story file (DEBUG-ONLY rule — stories must live under src/debug/)
- tokens/platforms/kotlin/** — generator output (UC-TOK-05 owns)
- Anything not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First)
--------------------------------------------------------------------------------

✅ Always:
- Resolve typography via `LaneShadowTheme.typography.*` (composition local) — never inline.
- Wrap previews in native-sandbox `Story` values; register via tier aggregator under `src/debug/`.
- Honor `LocalDensity.fontScale` from environment; use sp units.

⚠️ Ask First:
- Adding a NEW typography variant not listed in `typography.tokens.json` (must originate from UC-TOK-01).
- Introducing a new font weight beyond what UC-TOK-01 manifest declares.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt (NEW): the typed text atom composable
- android/app/src/main/java/com/laneshadow/ui/atoms/TypographyVariant.kt (NEW): the variant sealed hierarchy / enum
- android/app/src/main/java/com/laneshadow/ui/atoms/ContentColor.kt (NEW or MODIFY): ContentColor enum
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSTextStories.kt (NEW): `atoms.text.swatch` story
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomStories.kt (MODIFY): include `LSTextStories.all`
- android/app/src/test/java/com/laneshadow/ui/atoms/LSTextTest.kt (NEW): behavior + signature tests
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSTextInstrumentationTest.kt (NEW): font-scale propagation

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED (write failing test) → GREEN (minimal impl) → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

After all 9 ACs: dispatch kotlin-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-01-text.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual design source for variant matrix and color resolution

2. .spec/prds/v2/05-uc-atm.md
   - Lines: 30-49
   - Focus: UC-ATM-01 canonical AC bullets

3. .spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-01-ios-typography-atoms-lstext-ios-swiftui.md
   - Lines: all
   - Focus: Sibling iOS task — structural pattern only (do NOT copy iOS APIs)

4. android/app/src/main/java/com/laneshadow/ui/theme/LaneShadowTheme.kt
   - Lines: all
   - Focus: ThemeProvider, composition locals, generated typography tokens

5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6 (Story contract), §10 (ArgTypes discipline)
   - Focus: Story id format `atoms.{component}.{variant}`, ComponentTier.Atom

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence (TDD_STATE shows red before green per AC).
Gate 2: One test per behavioral AC (AC-1..AC-6 = test functions; AC-7..AC-8 = grep gates; AC-9 = build gate).
Gate 3: All JUnit pass — `cd android && ./gradlew :app:testDebugUnitTest` exits 0.
Gate 4: All Compose UI tests pass — `cd android && ./gradlew :app:connectedDebugAndroidTest` exits 0.
Gate 5: Kotlin compile green — `cd android && ./gradlew :app:compileDebugKotlin` exits 0.
Gate 6: detekt clean — `cd android && ./gradlew detekt` exits 0.
Gate 7: No literal fonts/colors/icons — `! grep -REn 'FontFamily\.(Serif|SansSerif|Monospace|Default)|Color\(0x|androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)' android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt` returns zero.
Gate 8: Story registered — `grep -q 'LSTextStories' android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomStories.kt`.
Gate 9: Release APK clean — `unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox` == 0.
Gate 10: Scope compliance — `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- iOS SwiftUI implementation (UC-ATM-01-ios — runs in parallel under swift-implementer).
- Adding new typography variants beyond UC-TOK-01 — escalate first.
- Modifying generated theme files — regenerate via `pnpm tokens:generate` if needed.

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-01 generates `typography.opinion.{sm..xxl}`, `typography.ui.{headline,title,body,caption,label}.{sizes}`, `typography.instrument.{sizes}` into `tokens/platforms/kotlin/...`. Android has no typed text atom — sandbox previews still use raw `Text(..., fontFamily = ...)`.

**Gap:** No `LSText` atom exists. Without it, every downstream molecule, organism, and screen would inline raw Compose `Text(...)` modifiers, defeating UC-TOK-01.

--------------------------------------------------------------------------------
REVIEW (for kotlin-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC; tests verify rendered token resolution, not implementation strings.
- RED evidence present in TDD_STATE history.
- No literal font/color references and no Material Icons in LSText.kt (grep gate).
- Story id matches `atoms.text.swatch`; registered in tier aggregator under `src/debug/`.
- SCOPE respected (`git diff --name-only` ⊆ writeAllowed) AND release APK contains zero `com.nativesandbox` entries.

Should verify (≤5):
- API ergonomics — `TypographyVariant.Opinion.Xl`, `TypographyVariant.Ui.Body.Md`, `TypographyVariant.Instrument.Lg` accessors compile cleanly.
- Font-scale tested at multiple categories (1.0f, 1.5f, 2.0f).
- Light + dark mode both pass color resolution.
- Test naming follows `{condition}_{expected}` convention.
- Anti-pattern check: zero `FontFamily.{Serif|SansSerif|Monospace|Default}`, `Color(0x...)`, `Icons.Filled.*`, `Icons.Outlined.*`.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-01 (typography tokens), UC-TOK-05 (generated Kotlin theme), UC-SBX-00-android (sandbox runtime)
Blocks:     UC-ATM-04-android (Avatar initials), UC-MOL-* (every molecule consumes LSText), UC-ORG-*, UC-SCR-*
Parallel:   UC-ATM-01-ios (iOS pair)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN Compose view WHEN LSText opinion.xl rendered THEN font=Newsreader, sp+lineHeight=typography.opinion.xl", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSTextTest.opinion_xl_resolves_newsreader_token\"" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN view WHEN LSText ui.body.md rendered THEN font=Geist, sp+lineHeight=typography.ui.body.md", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSTextTest.ui_body_md_resolves_geist_token\"" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN view WHEN LSText instrument.lg rendered THEN font=JetBrains Mono, sp+lineHeight=typography.instrument.lg", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSTextTest.instrument_lg_resolves_mono_token\"" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSText ui.body.md WHEN fontScale=1.5f THEN rendered px scales above token base sp", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests \"com.laneshadow.ui.atoms.LSTextInstrumentationTest.font_scale_propagates_to_rendered_size\"" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN color=ContentColor.Secondary WHEN rendered THEN foreground=theme.color.content.secondary", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSTextTest.content_color_secondary_resolves_token\"" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSText API WHEN raw Color passed THEN compiler rejects (signature only ContentColor)", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSTextTest.color_param_rejects_raw_Color\"" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN LSTextStories.kt WHEN AtomStories.all composed THEN atoms.text.swatch story registered under src/debug/", "verify": "grep -q 'atoms.text.swatch' android/app/src/debug/java/com/laneshadow/sandbox/stories/LSTextStories.kt && grep -q 'LSTextStories' android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomStories.kt" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN LSText.kt WHEN grep'd THEN zero literal font, Color(0x, or Material Icons references", "verify": "! grep -REn 'FontFamily\\.(Serif|SansSerif|Monospace|Default)|Color\\(0x|androidx\\.compose\\.material\\.icons|Icons\\.(Filled|Outlined)' android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt" },
    { "id": "AC-9", "type": "acceptance_criterion", "description": "GIVEN release build WHEN APK inspected THEN com.nativesandbox count = 0", "verify": "cd android && ./gradlew :app:assembleRelease && [ \"$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)\" = \"0\" ]" },
    { "id": "TC-1", "type": "test_criterion", "description": "Opinion.xl Newsreader resolution", "maps_to_ac": "AC-1", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSTextTest.opinion_xl_resolves_newsreader_token\"" },
    { "id": "TC-2", "type": "test_criterion", "description": "ui.body.md Geist resolution", "maps_to_ac": "AC-2", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSTextTest.ui_body_md_resolves_geist_token\"" },
    { "id": "TC-3", "type": "test_criterion", "description": "instrument.lg Mono resolution", "maps_to_ac": "AC-3", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSTextTest.instrument_lg_resolves_mono_token\"" },
    { "id": "TC-4", "type": "test_criterion", "description": "Font-scale propagation", "maps_to_ac": "AC-4", "verify": "./gradlew :app:connectedDebugAndroidTest --tests \"*.LSTextInstrumentationTest.font_scale_propagates_to_rendered_size\"" },
    { "id": "TC-5", "type": "test_criterion", "description": "ContentColor.Secondary token resolution", "maps_to_ac": "AC-5", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSTextTest.content_color_secondary_resolves_token\"" },
    { "id": "TC-6", "type": "test_criterion", "description": "Raw Color rejected at compile", "maps_to_ac": "AC-6", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSTextTest.color_param_rejects_raw_Color\"" },
    { "id": "TC-7", "type": "test_criterion", "description": "Swatch story registered", "maps_to_ac": "AC-7", "verify": "grep -q 'atoms.text.swatch' android/app/src/debug/java/com/laneshadow/sandbox/stories/LSTextStories.kt" },
    { "id": "TC-8", "type": "test_criterion", "description": "No literal fonts/colors/icons in LSText.kt", "maps_to_ac": "AC-8", "verify": "! grep -REn 'FontFamily\\.(Serif|SansSerif|Monospace|Default)|Color\\(0x|androidx\\.compose\\.material\\.icons|Icons\\.(Filled|Outlined)' android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt" },
    { "id": "TC-9", "type": "test_criterion", "description": "Release APK ships zero sandbox symbols", "maps_to_ac": "AC-9", "verify": "[ \"$(unzip -l android/app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)\" = \"0\" ]" }
  ]
}
-->

