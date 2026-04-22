# kb-run Implementer Prompt

Task: UC-ATM-10-android
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
5. Commit all task changes with a message starting with `UC-ATM-10-android:` or `feat(UC-ATM-10-android):`.
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
TASK: UC-ATM-10-android — Icon atom (`LSIcon`) — design-owned SVG catalog — Android Compose
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   240 min

RUNTIME_COMMANDS:
  test:         cd android && ./gradlew :app:testDebugUnitTest
  instrumented: cd android && ./gradlew :app:connectedDebugAndroidTest
  typecheck:    cd android && ./gradlew :app:compileDebugKotlin
  lint:         cd android && ./gradlew detekt
  icons_check:  pnpm icons:check
  release_no_sandbox: cd android && ./gradlew :app:assembleRelease && unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox

PRD_REFS:   UC-ATM-10, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-10-icon.html
DEPENDS_ON: UC-TOK-02, UC-TOK-03, UC-TOK-05 (catalog generation), UC-SBX-00-android
BLOCKS:     UC-ATM-02-android (Button icon), UC-ATM-03-android (Input icon), UC-ATM-07-android (Badge weather + star)

PROGRESS: AC-1 none · 0/9 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSIcon(name: IconName, size: IconSize = IconSize.Md, color: IconColor = IconColor.Content(ContentColor.Primary))` renders a design-owned SVG glyph on Android Compose. Names come from the generated `IconName` enum at `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/IconName.kt` (UC-TOK-05) — 25 names total: `send, expand, collapse, menu, plus, close, sliders, bookmark, bookmarkFill, star, starFill, pin, clock, sun, rain, wind, storm, therm, route, map, layers, share, heart, heartFill, sparkle, compass, edit, trash, bike, chevR, chevL`. SVGs render as Compose `ImageVector` (or Android vector drawable resources) with a 1.5dp rounded stroke baseline sourced from `LaneShadowTheme.icon.stroke.width`. Sizes resolve from `LaneShadowTheme.sizing.icon.{xs, sm, md, lg, xl}`. Colors resolve through `IconColor` typed sealed union — never raw `Color`.

Material Icons are forbidden everywhere in `android/app/src/main/`.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER reference `androidx.compose.material.icons` or `Icons.(Filled|Outlined).*` anywhere in `android/app/src/main/` — zero matches required across the whole module.
- NEVER expose a raw `Color` parameter on `LSIcon` — only the typed `IconColor` sealed union (resolves through `color.content.*`, `color.signal.*`, `color.status.*`, `color.weather.*`).
- NEVER hardcode `Color(0xFF…)` literals.
- NEVER hardcode stroke width — MUST consume `LaneShadowTheme.icon.stroke.width`.
- NEVER hardcode icon sizes — MUST consume `LaneShadowTheme.sizing.icon.{xs|sm|md|lg|xl}`.
- NEVER place sandbox stories under `android/app/src/main/**`.
- MUST modify only files listed in SCOPE.writeAllowed.
- STRICTLY no edits to `~/Projects/native-theme/**`, `~/Projects/native-sandbox/**`, or `tokens/**` (the generated `IconName` enum lives in `tokens/`; this task only consumes it).

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSIcon` composable exists at `android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt` accepting `name: IconName`, `size: IconSize = IconSize.Md`, `color: IconColor = IconColor.Content(ContentColor.Primary)` — maps to AC-1 (PRIMARY)
- [ ] `IconSize` sealed/enum union with `Xs, Sm, Md, Lg, Xl` cases mapping to `sizing.icon.*` — maps to AC-1, AC-2
- [ ] `IconColor` sealed union: `Content(ContentColor)`, `Signal`, `Status(StatusColor)`, `Weather(WeatherColor)` — maps to AC-3
- [ ] All 25 `IconName` cases render without crash — maps to AC-4
- [ ] Stroke width resolves through `icon.stroke.width` token — maps to AC-2
- [ ] Raw `Color` parameter rejected at compile-time — maps to AC-5
- [ ] Catalog story `atoms.icon.catalog` and color-overrides story `atoms.icon.colorOverrides` registered — maps to AC-6
- [ ] Zero matches for Material Icons across `android/app/src/main/` — maps to AC-7
- [ ] `pnpm icons:check` passes — maps to AC-8
- [ ] Release APK contains zero `com.nativesandbox` references — maps to AC-9
- [ ] Detekt clean; `compileDebugKotlin` green; instrumented + unit tests pass

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSIcon renders compass at sizing.icon.md with token stroke + default content color [PRIMARY]
  GIVEN: A Compose host providing `LaneShadowTheme`
  WHEN:  Developer renders `LSIcon(name = IconName.compass)`
  THEN:  Measured size equals `LaneShadowTheme.sizing.icon.md`; stroke width equals `LaneShadowTheme.icon.stroke.width` (1.5dp baseline); foreground color equals `LaneShadowTheme.color.content.primary`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconInstrumentationTest.kt
  TEST_FUNCTION: icon_compass_md_resolves_size_stroke_and_default_color
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSIconInstrumentationTest.icon_compass_md_resolves_size_stroke_and_default_color

AC-2: IconSize enum maps each case to sizing.icon.* token (xs/sm/md/lg/xl)
  GIVEN: `IconSize.kt`
  WHEN:  Each case is mapped to its dp value via the theme
  THEN:  Resolved dp values equal `LaneShadowTheme.sizing.icon.{xs,sm,md,lg,xl}` from the generated theme; no `.dp` literal in `IconSize.kt` outside of theme lookup
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/IconSizeTest.kt
  TEST_FUNCTION: iconSize_each_case_maps_to_sizing_token
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.atoms.IconSizeTest.iconSize_each_case_maps_to_sizing_token

AC-3: IconColor.Signal resolves color.signal.default
  GIVEN: A Compose host
  WHEN:  `LSIcon(name = IconName.starFill, color = IconColor.Signal)` composed
  THEN:  Foreground color equals `LaneShadowTheme.color.signal.default`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconInstrumentationTest.kt
  TEST_FUNCTION: icon_color_signal_resolves_color_signal_default
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSIconInstrumentationTest.icon_color_signal_resolves_color_signal_default

AC-4: All 25 IconName cases render without crash
  GIVEN: A Compose host
  WHEN:  Test iterates `IconName.values()` and composes `LSIcon(name = it)` for each
  THEN:  All 25 compose without throwing; node count == 25
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconCatalogInstrumentationTest.kt
  TEST_FUNCTION: icon_catalog_renders_all_25_names_without_crash
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSIconCatalogInstrumentationTest.icon_catalog_renders_all_25_names_without_crash

AC-5: Raw Color parameter rejected at compile-time (error gate — type-safety)
  GIVEN: `LSIcon` API surface
  WHEN:  Developer attempts `LSIcon(name = IconName.compass, color = Color.Red)`
  THEN:  Kotlin compiler rejects — `color` parameter only accepts `IconColor` sealed union
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSIconTypeSafetyTest.kt
  TEST_FUNCTION: icon_color_param_rejects_raw_Color
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.atoms.LSIconTypeSafetyTest.icon_color_param_rejects_raw_Color

AC-6: Catalog + color-overrides stories registered with id atoms.icon.*
  GIVEN: `LSIconStories.kt`
  WHEN:  Sandbox aggregator composes atom stories
  THEN:  Stories present with ids `atoms.icon.catalog` (renders all 25 at sizing.icon.md) and `atoms.icon.colorOverrides` (renders sample icons across IconColor variants), all `tier = ComponentTier.Atom`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/debug/java/com/laneshadow/sandbox/stories/LSIconStories.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for id in atoms.icon.catalog atoms.icon.colorOverrides; do grep -q "$id" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSIconStories.kt || exit 1; done

AC-7: ZERO Material Icons references anywhere in android/app/src/main/ (error gate — boundary)
  GIVEN: `android/app/src/main/`
  WHEN:  Reviewer greps recursively
  THEN:  Zero matches for `androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)' android/app/src/main/

AC-8: pnpm icons:check passes (error gate — catalog parity)
  GIVEN: The 25-name design-owned catalog
  WHEN:  `pnpm icons:check` is run
  THEN:  Command exits 0 — catalog SVGs match the generated `IconName` enum exactly
  TDD_STATE:     none
  TEST_FILE:     package.json (icons:check script)
  TEST_FUNCTION: n/a (build gate)
  VERIFY:        pnpm icons:check

AC-9: Release APK contains zero sandbox references (error gate — release hygiene)
  GIVEN: A release build
  WHEN:  `./gradlew :app:assembleRelease` is run and APK is inspected
  THEN:  `unzip -l app-release.apk | grep -c com.nativesandbox` returns 0
  TDD_STATE:     none
  TEST_FILE:     android/app/build.gradle.kts
  TEST_FUNCTION: n/a (build gate)
  VERIFY:        cd android && ./gradlew :app:assembleRelease && [ "$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)" = "0" ]

--------------------------------------------------------------------------------
TEST CRITERIA (boolean — each maps to one AC)
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Verify |
|-----|-----------|---------|--------|
| TC-1 | LSIcon compass at Md resolves sizing.icon.md + icon.stroke.width + color.content.primary | AC-1 | gradlew connectedDebugAndroidTest …icon_compass_md_resolves_size_stroke_and_default_color |
| TC-2 | IconSize maps each case to sizing.icon.* token | AC-2 | gradlew testDebugUnitTest …iconSize_each_case_maps_to_sizing_token |
| TC-3 | IconColor.Signal resolves color.signal.default | AC-3 | gradlew connectedDebugAndroidTest …icon_color_signal_resolves_color_signal_default |
| TC-4 | All 25 IconName cases render without crash | AC-4 | gradlew connectedDebugAndroidTest …icon_catalog_renders_all_25_names_without_crash |
| TC-5 | Raw Color parameter rejected at compile-time | AC-5 | gradlew testDebugUnitTest …icon_color_param_rejects_raw_Color |
| TC-6 | atoms.icon.catalog + atoms.icon.colorOverrides stories registered | AC-6 | grep gate above |
| TC-7 | Zero Material Icons across android/app/src/main/ | AC-7 | grep gate above |
| TC-8 | pnpm icons:check exits 0 | AC-8 | pnpm icons:check |
| TC-9 | Release APK clean of sandbox refs | AC-9 | unzip+grep gate above |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/IconSize.kt (NEW — sealed/enum + theme mapping)
- android/app/src/main/java/com/laneshadow/ui/atoms/IconColor.kt (NEW — sealed union)
- android/app/src/main/res/drawable/ic_*.xml (NEW — vector drawables for the 25 names IF needed; alternatively ImageVector definitions in source)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSIconStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowStories.kt (MODIFY — register LSIconStories)
- android/app/src/test/java/com/laneshadow/ui/atoms/IconSizeTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSIconTypeSafetyTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconInstrumentationTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconCatalogInstrumentationTest.kt (NEW)

writeProhibited:
- ios/** — swift-implementer scope
- ~/Projects/native-theme/** — schema upstream
- ~/Projects/native-sandbox/** — runtime upstream
- tokens/** — generator output (UC-TOK-05 owns IconName enum + SVG catalog source)
- android/app/src/main/** for sandbox story files (stories DEBUG-ONLY)
- Anything not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First)
--------------------------------------------------------------------------------

✅ Always:
- Consume `IconName` from the generated enum at `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/`.
- Resolve sizes through `LaneShadowTheme.sizing.icon.*`.
- Resolve stroke width through `LaneShadowTheme.icon.stroke.width`.
- Resolve colors through the `IconColor` sealed union.
- Place all story code under `android/app/src/debug/`.

⚠️ Ask First:
- Adding a 26th icon name — must originate from UC-TOK-05 catalog regeneration.
- Adding a new IconColor case — must align with existing color token namespace.
- Loading SVGs at runtime (network/dynamic) — this atom is bundled-asset only.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/IconSize.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/IconColor.kt (NEW)
- android/app/src/main/res/drawable/ic_*.xml (NEW — if vector-drawable approach)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSIconStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowStories.kt (MODIFY)
- android/app/src/test/java/com/laneshadow/ui/atoms/IconSizeTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSIconTypeSafetyTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconInstrumentationTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconCatalogInstrumentationTest.kt (NEW)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED (write failing test) → GREEN (minimal impl) → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

After all 9 ACs: dispatch kotlin-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-10-icon.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual catalog of all 25 icons + stroke style + size matrix

2. .spec/prds/v2/05-uc-atm.md
   - Lines: section UC-ATM-10
   - Focus: Canonical AC bullets

3. tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/IconName.kt
   - Lines: all
   - Focus: The 25-name enum this atom consumes

4. tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/Theme.kt
   - Lines: all
   - Focus: `sizing.icon.*`, `icon.stroke.width`, `color.content.*`, `color.signal.*`, `color.status.*`, `color.weather.*`

5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6 (Story contract), §10 (ArgTypes discipline)
   - Focus: Story id format `atoms.{component}.{variant}`, ComponentTier.Atom

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence (TDD_STATE shows red before green per AC).
Gate 2: One test per behavioral AC; AC-6/AC-7/AC-8/AC-9 = grep/build gates.
Gate 3: Unit tests pass — `cd android && ./gradlew :app:testDebugUnitTest` exits 0.
Gate 4: Instrumented tests pass — `cd android && ./gradlew :app:connectedDebugAndroidTest` exits 0.
Gate 5: compileDebugKotlin green.
Gate 6: detekt clean.
Gate 7: Zero Material Icons across `android/app/src/main/`.
Gate 8: `pnpm icons:check` exits 0.
Gate 9: Release APK has zero `com.nativesandbox` references.
Gate 10: Scope compliance — `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- iOS implementation (UC-ATM-10-ios — swift-implementer parallel).
- Adding new icons beyond the 25-name catalog — escalate to UC-TOK-05 owner.
- Animated icons — defer to a separate task.
- Material Icons fallback — explicitly disallowed.

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-05 generates the `IconName` enum and SVG catalog assets. UC-TOK-02/03 generate `color.*`, `sizing.icon.*`, and `icon.stroke.width`. Android currently has no icon atom and is at risk of inlining `androidx.compose.material.icons.Icons.Filled.*` in downstream atoms (Button, Input) and molecules.

**Gap:** Without LSIcon, the entire UC-ATM-* sprint can leak Material Icons into production, defeating the design-owned catalog promise.

--------------------------------------------------------------------------------
REVIEW (for kotlin-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC; instrumented tests verify token-resolved size, stroke, and color per IconColor variant.
- RED evidence in TDD_STATE.
- Zero Material Icons across `android/app/src/main/` (grep gate).
- Both `atoms.icon.catalog` and `atoms.icon.colorOverrides` stories registered under DEBUG source set.
- SCOPE respected (`git diff --name-only` ⊆ writeAllowed).

Should verify (≤5):
- IconColor is a true sealed union with Content/Signal/Status/Weather variants — never raw `Color`.
- IconSize maps each case via theme lookup — no `.dp` literals in IconSize.kt outside theme call.
- All 25 IconName cases render in the catalog instrumentation test.
- Test naming follows `{condition}_{expected}` snake-case convention.
- `pnpm icons:check` exits 0; release APK gate exits 0 sandbox refs.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-02 (color tokens), UC-TOK-03 (sizing + icon.stroke.width), UC-TOK-05 (catalog generation — IconName enum + SVG assets), UC-SBX-00-android
Blocks:     UC-ATM-02-android (Button icon), UC-ATM-03-android (Input icon), UC-ATM-07-android (Badge weather + star)
Parallel:   UC-ATM-10-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN host WHEN LSIcon(compass) composed THEN size=sizing.icon.md, stroke=icon.stroke.width, foreground=color.content.primary", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSIconInstrumentationTest.icon_compass_md_resolves_size_stroke_and_default_color" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN IconSize cases WHEN mapped THEN dp values equal sizing.icon.{xs,sm,md,lg,xl}", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.atoms.IconSizeTest.iconSize_each_case_maps_to_sizing_token" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN host WHEN LSIcon(starFill, Signal) composed THEN foreground=color.signal.default", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSIconInstrumentationTest.icon_color_signal_resolves_color_signal_default" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN IconName.values() WHEN each composed THEN all 25 render without crash", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSIconCatalogInstrumentationTest.icon_catalog_renders_all_25_names_without_crash" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSIcon API WHEN raw Color passed THEN Kotlin compiler rejects", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.atoms.LSIconTypeSafetyTest.icon_color_param_rejects_raw_Color" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSIconStories.kt WHEN aggregator composes THEN atoms.icon.catalog and atoms.icon.colorOverrides stories registered as ComponentTier.Atom", "verify": "for id in atoms.icon.catalog atoms.icon.colorOverrides; do grep -q \"$id\" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSIconStories.kt || exit 1; done" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN android/app/src/main/ WHEN grep'd THEN zero Material Icons references", "verify": "! grep -REn 'androidx\\.compose\\.material\\.icons|Icons\\.(Filled|Outlined)' android/app/src/main/" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN catalog WHEN pnpm icons:check runs THEN exits 0", "verify": "pnpm icons:check" },
    { "id": "AC-9", "type": "acceptance_criterion", "description": "GIVEN release build WHEN APK inspected THEN zero com.nativesandbox refs", "verify": "cd android && ./gradlew :app:assembleRelease && [ \"$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)\" = \"0\" ]" },
    { "id": "TC-1", "type": "test_criterion", "description": "compass Md resolves size+stroke+content.primary", "maps_to_ac": "AC-1", "verify": "gradlew connectedDebugAndroidTest …icon_compass_md_resolves_size_stroke_and_default_color" },
    { "id": "TC-2", "type": "test_criterion", "description": "IconSize maps to sizing.icon tokens", "maps_to_ac": "AC-2", "verify": "gradlew testDebugUnitTest …iconSize_each_case_maps_to_sizing_token" },
    { "id": "TC-3", "type": "test_criterion", "description": "IconColor.Signal resolves color.signal.default", "maps_to_ac": "AC-3", "verify": "gradlew connectedDebugAndroidTest …icon_color_signal_resolves_color_signal_default" },
    { "id": "TC-4", "type": "test_criterion", "description": "All 25 IconName cases render", "maps_to_ac": "AC-4", "verify": "gradlew connectedDebugAndroidTest …icon_catalog_renders_all_25_names_without_crash" },
    { "id": "TC-5", "type": "test_criterion", "description": "Raw Color rejected at compile", "maps_to_ac": "AC-5", "verify": "gradlew testDebugUnitTest …icon_color_param_rejects_raw_Color" },
    { "id": "TC-6", "type": "test_criterion", "description": "Catalog + colorOverrides stories registered", "maps_to_ac": "AC-6", "verify": "grep gate" },
    { "id": "TC-7", "type": "test_criterion", "description": "Zero Material Icons across android/app/src/main/", "maps_to_ac": "AC-7", "verify": "grep gate" },
    { "id": "TC-8", "type": "test_criterion", "description": "pnpm icons:check passes", "maps_to_ac": "AC-8", "verify": "pnpm icons:check" },
    { "id": "TC-9", "type": "test_criterion", "description": "Release APK clean of sandbox refs", "maps_to_ac": "AC-9", "verify": "unzip+grep gate" }
  ]
}
-->

