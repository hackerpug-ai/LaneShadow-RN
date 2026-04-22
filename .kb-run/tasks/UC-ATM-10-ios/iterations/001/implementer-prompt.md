# kb-run Implementer Prompt

Task: UC-ATM-10-ios
Platform: iOS SwiftUI
Implementer role: swift-implementer
Reviewer role: swift-reviewer
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
3. `/Users/justinrich/Projects/brain/agents/swift-implementer.md` for role-specific implementation guidance, but kb-run rules above override any instruction to spawn reviewers/subagents.
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
5. Commit all task changes with a message starting with `UC-ATM-10-ios:` or `feat(UC-ATM-10-ios):`.
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
TASK: UC-ATM-10-ios — Icon atom (`LSIcon`) — design-owned SVG catalog — iOS SwiftUI
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   240 min

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTests
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  lint:      swiftformat --lint ios/LaneShadow/

PRD_REFS:   UC-ATM-10, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-10-icon.html
DEPENDS_ON: UC-TOK-02, UC-TOK-03, UC-TOK-05 (SVG catalog generation), UC-SBX-00-ios
BLOCKS:     UC-ATM-02-ios (Button icon slot), UC-ATM-03-ios (Input icon slot), UC-ATM-07-ios (Badge weather icons + star), UC-MOL-*, UC-ORG-*, UC-SCR-*

PROGRESS: AC-1 none · 0/9 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSIcon(name: IconName, size: IconSize, color: ContentColor = .primary)` renders typed glyphs from the design-owned SVG catalog on iOS SwiftUI. Consumes the generated `IconName` enum (25 names: `send, expand, collapse, menu, plus, close, sliders, bookmark, bookmarkFill, star, starFill, pin, clock, sun, rain, wind, storm, therm, route, map, layers, share, heart, heartFill, sparkle, compass, edit, trash, bike, chevR, chevL`) produced by UC-TOK-05 in `tokens/platforms/swift/Sources/LaneShadowTheme/`. Stroke is a 1.5pt rounded line from `icon.stroke.width`. Sizes resolve through `sizing.icon.{xs,sm,md,lg,xl}`. Color drives through a typed `ContentColor` enum (`color.content.*` plus `.signal` accent).

This atom is the SOLE icon source in `ios/LaneShadow/`. SF Symbols (`Image(systemName:)`, `UIImage(systemName:)`) are forbidden everywhere.

Note: The 25-name list above contains the canonical names from UC-TOK-05; the resolved `IconName` enum may be larger but MUST contain at minimum these 25 cases.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER use `Image(systemName:)` or `UIImage(systemName:)` anywhere in `ios/LaneShadow/` — zero tolerance.
- NEVER expose a raw `Color` parameter on `LSIcon` — only the `ContentColor` enum. Raw color must be rejected at compile-time.
- NEVER hardcode the 1.5pt stroke — resolve through `icon.stroke.width`.
- NEVER hardcode icon sizes — resolve through `sizing.icon.{xs,sm,md,lg,xl}`.
- NEVER hand-author additional SVGs in this task — catalog comes from UC-TOK-05; missing icons must be added upstream.
- MUST modify only files listed in SCOPE.writeAllowed.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSIcon` exists at `ios/LaneShadow/Views/Atoms/LSIcon.swift` accepting typed `name: IconName`, `size: IconSize`, `color: ContentColor = .primary` — maps to AC-1
- [ ] `compass` at `.md` resolves `sizing.icon.md` + `icon.stroke.width` — maps to AC-1
- [ ] `color: .signal` resolves `color.signal.default` — maps to AC-2
- [ ] All 25 canonical icons render without crash — maps to AC-3
- [ ] Raw `Color` parameter rejected at compile-time — maps to AC-4
- [ ] Zero `Image(systemName:` / `UIImage(systemName:` references across `ios/LaneShadow/` — maps to AC-5
- [ ] Catalog story + color-overrides story registered — maps to AC-6
- [ ] `pnpm icons:check` passes (catalog parity gate) — maps to AC-7
- [ ] No literal stroke width / icon size in source — maps to AC-8
- [ ] iOS typecheck/build green; XCTest green; swiftformat clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSIcon compass at .md resolves sizing.icon.md + icon.stroke.width [PRIMARY]
  GIVEN: An iOS SwiftUI view importing LaneShadowTheme
  WHEN:  Developer renders `LSIcon(name: .compass, size: .md)`
  THEN:  Rendered frame == `sizing.icon.md`, stroke width == `icon.stroke.width` (1.5pt), foreground == `color.content.primary`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSIconTests.swift
  TEST_FUNCTION: test_compass_md_resolves_size_and_stroke_tokens
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTests/test_compass_md_resolves_size_and_stroke_tokens

AC-2: LSIcon color: .signal resolves color.signal.default
  GIVEN: An iOS SwiftUI view
  WHEN:  Developer renders `LSIcon(name: .star, size: .sm, color: .signal)`
  THEN:  Resolved foreground == `color.signal.default`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSIconTests.swift
  TEST_FUNCTION: test_color_signal_resolves_token
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTests/test_color_signal_resolves_token

AC-3: All 25 canonical icons render without crash (catalog smoke)
  GIVEN: An iOS SwiftUI view
  WHEN:  Each of the 25 canonical names is rendered at `.md`
  THEN:  No crash; resolved drawable is non-nil for every name
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSIconTests.swift
  TEST_FUNCTION: test_all_canonical_icons_render_without_crash
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTests/test_all_canonical_icons_render_without_crash

AC-4: Raw Color parameter rejected at compile-time (error gate — type-safety)
  GIVEN: LSIcon API surface
  WHEN:  Developer attempts `LSIcon(name: .star, size: .sm, color: Color.red)`
  THEN:  Swift compiler rejects — `color` parameter only accepts `ContentColor` enum
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSIconTypeSafetyTests.swift
  TEST_FUNCTION: test_color_param_rejects_raw_Color
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTypeSafetyTests/test_color_param_rejects_raw_Color

AC-5: Zero SF Symbol references across ios/LaneShadow/ (error gate — boundary)
  GIVEN: All Swift source under ios/LaneShadow/
  WHEN:  Reviewer greps
  THEN:  Zero matches for `Image(systemName:` or `UIImage(systemName:`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'Image\(systemName:|UIImage\(systemName:' ios/LaneShadow/

AC-6: Catalog story + color-overrides story registered
  GIVEN: `ios/LaneShadow/Sandbox/Stories/LSIconStories.swift`
  WHEN:  AtomStories.all is composed
  THEN:  Story ids `atoms.icon.catalog` and `atoms.icon.colorOverrides` exist, tier = `.atom`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Sandbox/Stories/LSIconStories.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for id in atoms.icon.catalog atoms.icon.colorOverrides; do grep -q "$id" ios/LaneShadow/Sandbox/Stories/LSIconStories.swift || exit 1; done && grep -q 'LSIconStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift

AC-7: pnpm icons:check passes (catalog parity)
  GIVEN: Generated `IconName` enum + bundled SVG assets
  WHEN:  Developer runs `pnpm icons:check`
  THEN:  Exit 0 — every enum case has a backing asset, no orphan assets
  TDD_STATE:     none
  TEST_FILE:     n/a (catalog gate)
  TEST_FUNCTION: n/a (CLI gate)
  VERIFY:        pnpm icons:check

AC-8: No literal stroke width or icon size in LSIcon.swift (error gate — boundary)
  GIVEN: ios/LaneShadow/Views/Atoms/LSIcon.swift
  WHEN:  Reviewer greps
  THEN:  Zero matches for `lineWidth: 1.5`, `frame(width: [0-9]`, or `Color\\.` literals
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Views/Atoms/LSIcon.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'lineWidth: 1\.5|frame\(width: [0-9]|Color\.(red|green|blue|black|white|gray|orange|yellow|purple|pink)' ios/LaneShadow/Views/Atoms/LSIcon.swift

--------------------------------------------------------------------------------
TEST CRITERIA (boolean — each maps to one AC)
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Verify |
|-----|-----------|---------|--------|
| TC-1 | compass .md resolves sizing.icon.md + icon.stroke.width | AC-1 | xcodebuild test …test_compass_md_resolves_size_and_stroke_tokens |
| TC-2 | color: .signal resolves color.signal.default | AC-2 | xcodebuild test …test_color_signal_resolves_token |
| TC-3 | All 25 canonical icons render without crash | AC-3 | xcodebuild test …test_all_canonical_icons_render_without_crash |
| TC-4 | Raw Color.red rejected by Swift compiler | AC-4 | xcodebuild test …test_color_param_rejects_raw_Color |
| TC-5 | Zero SF Symbol references across ios/LaneShadow/ | AC-5 | grep gate above |
| TC-6 | Catalog + colorOverrides stories registered + aggregator wired | AC-6 | grep gate above |
| TC-7 | pnpm icons:check passes | AC-7 | pnpm icons:check |
| TC-8 | No literal stroke width / icon size / Color in LSIcon.swift | AC-8 | grep gate above |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Atoms/LSIcon.swift (NEW)
- ios/LaneShadow/Views/Atoms/IconSize.swift (NEW — typed size enum)
- ios/LaneShadow/Sandbox/Stories/LSIconStories.swift (NEW)
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY — register LSIconStories.all)
- ios/LaneShadowTests/Atoms/LSIconTests.swift (NEW)
- ios/LaneShadowTests/Atoms/LSIconTypeSafetyTests.swift (NEW)

writeProhibited:
- ~/Projects/native-theme/**
- ~/Projects/native-sandbox/**
- tokens/platforms/swift/Sources/LaneShadowTheme/Generated/** — UC-TOK-05 owns IconName + SVG bundle
- tokens/icons/** — design-owned SVG source
- android/**
- ios/LaneShadow.xcodeproj/**
- Anything not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First)
--------------------------------------------------------------------------------

✅ Always:
- Resolve glyphs through the generated `IconName` enum.
- Resolve stroke via `theme.icon.stroke.width`; size via `theme.sizing.icon.{size}`; color via `ContentColor` → `theme.color.content.*` or `.signal`.
- Stories tier = `.atom`; ids `atoms.icon.{variant}`.

⚠️ Ask First:
- Adding a NEW icon name (must originate in UC-TOK-05 design source — never hand-author here).
- Adding a NEW `IconSize` beyond xs/sm/md/lg/xl.
- Adding a NEW `ContentColor` case beyond what UC-TOK-03 exposes.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Atoms/LSIcon.swift (NEW): the typed icon atom
- ios/LaneShadow/Views/Atoms/IconSize.swift (NEW): size enum (xs/sm/md/lg/xl)
- ios/LaneShadow/Sandbox/Stories/LSIconStories.swift (NEW): catalog + colorOverrides stories
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY): include `LSIconStories.all`
- ios/LaneShadowTests/Atoms/LSIconTests.swift (NEW): 3 behavior tests
- ios/LaneShadowTests/Atoms/LSIconTypeSafetyTests.swift (NEW): compile-time rejection test

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED → GREEN → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

Special: AC-5 is a global grep gate. Before declaring done, run `grep -REn 'Image\(systemName:|UIImage\(systemName:' ios/LaneShadow/` and remove any pre-existing references — Boy Scout Rule. Replacement uses LSIcon.

After all 8 ACs: dispatch swift-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-10-icon.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual catalog + size matrix + stroke contract
2. .spec/prds/v2/05-uc-atm.md
   - Lines: 225-260
   - Focus: UC-ATM-10 canonical AC bullets
3. .spec/prds/v2/tasks/sprint-01-foundation-tokens-and-v2-reset/UC-TOK-05-generate-swift-theme-and-icon-catalog.md
   - Lines: all
   - Focus: Direct upstream — IconName generation + SVG bundle layout
4. tokens/platforms/swift/Sources/LaneShadowTheme/Theme.swift
   - Lines: all
   - Focus: sizing.icon.*, icon.stroke.width, color.signal.default, color.content.* accessors
5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6 (Story contract), §10 (ArgTypes discipline)
   - Focus: ComponentTier.atom, story id format

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence per behavioral AC.
Gate 2: One test per AC (AC-1..AC-4 = test fns; AC-5..AC-8 = grep/CLI gates).
Gate 3: All XCTest pass.
Gate 4: Swift build green.
Gate 5: swiftformat clean.
Gate 6: Zero SF Symbol references — `! grep -REn 'Image\(systemName:|UIImage\(systemName:' ios/LaneShadow/`.
Gate 7: `pnpm icons:check` exits 0.
Gate 8: No literal stroke/size/Color in LSIcon.swift (grep).
Gate 9: Catalog + colorOverrides stories registered.
Gate 10: Scope compliance — `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Adding new icon names (escalate to UC-TOK-05 design source).
- Adding new IconSize / ContentColor cases (escalate to UC-TOK-02/03).
- Animated/morphing icons.
- Android Compose pair (UC-ATM-10-android — parallel kotlin-implementer).

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-05 generates the `IconName` enum and bundles the 25-icon SVG catalog into `tokens/platforms/swift/Sources/LaneShadowTheme/`. UC-TOK-02 exposes `sizing.icon.{xs,sm,md,lg,xl}` and `icon.stroke.width` (1.5pt). UC-TOK-03 exposes `color.content.*` and `color.signal.default`. iOS currently relies on SF Symbols throughout.

**Gap:** No `LSIcon` atom exists. Without it, downstream atoms (Button, Input, Badge) and molecules continue depending on SF Symbols, which violates the design-owned catalog contract and prevents brand-consistent stroke/weight.

--------------------------------------------------------------------------------
REVIEW (for swift-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC; tests verify token-resolved size, stroke, color.
- RED evidence in TDD_STATE history.
- Zero SF Symbol references across ios/LaneShadow/.
- Raw `Color` parameter rejected at compile-time.
- `pnpm icons:check` exits 0.

Should verify (≤5):
- All 25 canonical icons resolve to non-nil drawables.
- API ergonomics — `LSIcon(name: .compass, size: .md)` compiles cleanly.
- Catalog story renders all icons in a deterministic grid.
- Test naming follows `test_{condition}_{expected}`.
- SCOPE respected — no edits to `tokens/platforms/swift/.../Generated/` or `tokens/icons/`.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-02 (sizing/stroke), UC-TOK-03 (content/signal color), UC-TOK-05 (IconName + SVG catalog generation), UC-SBX-00-ios (sandbox runtime)
Blocks:     UC-ATM-02-ios (Button icon slot), UC-ATM-03-ios (Input icon slot), UC-ATM-07-ios (Badge weather icons + star), UC-MOL-*, UC-ORG-*, UC-SCR-*
Parallel:   UC-ATM-10-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN iOS view WHEN LSIcon(.compass,.md) rendered THEN frame=sizing.icon.md, stroke=icon.stroke.width, fg=color.content.primary", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTests/test_compass_md_resolves_size_and_stroke_tokens" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN color: .signal WHEN rendered THEN foreground=color.signal.default", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTests/test_color_signal_resolves_token" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN all 25 canonical icons WHEN rendered at .md THEN no crash, drawable non-nil", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTests/test_all_canonical_icons_render_without_crash" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSIcon API WHEN raw Color passed THEN compiler rejects", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTypeSafetyTests/test_color_param_rejects_raw_Color" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN ios/LaneShadow/ WHEN grep'd THEN zero SF Symbol references", "verify": "! grep -REn 'Image\\(systemName:|UIImage\\(systemName:' ios/LaneShadow/" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSIconStories.swift WHEN composed THEN catalog + colorOverrides stories registered", "verify": "for id in atoms.icon.catalog atoms.icon.colorOverrides; do grep -q \"$id\" ios/LaneShadow/Sandbox/Stories/LSIconStories.swift || exit 1; done && grep -q 'LSIconStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN generated IconName + SVG bundle WHEN pnpm icons:check run THEN exit 0", "verify": "pnpm icons:check" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN LSIcon.swift WHEN grep'd THEN zero literal stroke width / icon size / Color", "verify": "! grep -REn 'lineWidth: 1\\.5|frame\\(width: [0-9]|Color\\.(red|green|blue|black|white|gray|orange|yellow|purple|pink)' ios/LaneShadow/Views/Atoms/LSIcon.swift" },
    { "id": "TC-1", "type": "test_criterion", "description": "compass .md size+stroke token resolution", "maps_to_ac": "AC-1", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSIconTests/test_compass_md_resolves_size_and_stroke_tokens" },
    { "id": "TC-2", "type": "test_criterion", "description": "color .signal token resolution", "maps_to_ac": "AC-2", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSIconTests/test_color_signal_resolves_token" },
    { "id": "TC-3", "type": "test_criterion", "description": "All 25 canonical icons render", "maps_to_ac": "AC-3", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSIconTests/test_all_canonical_icons_render_without_crash" },
    { "id": "TC-4", "type": "test_criterion", "description": "Raw Color rejected at compile", "maps_to_ac": "AC-4", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSIconTypeSafetyTests/test_color_param_rejects_raw_Color" },
    { "id": "TC-5", "type": "test_criterion", "description": "Zero SF Symbols across ios/LaneShadow/", "maps_to_ac": "AC-5", "verify": "! grep -REn 'Image\\(systemName:' ios/LaneShadow/" },
    { "id": "TC-6", "type": "test_criterion", "description": "Catalog + colorOverrides stories registered", "maps_to_ac": "AC-6", "verify": "grep -q 'atoms.icon.catalog' ios/LaneShadow/Sandbox/Stories/LSIconStories.swift" },
    { "id": "TC-7", "type": "test_criterion", "description": "pnpm icons:check passes", "maps_to_ac": "AC-7", "verify": "pnpm icons:check" },
    { "id": "TC-8", "type": "test_criterion", "description": "No literal stroke/size/Color in LSIcon.swift", "maps_to_ac": "AC-8", "verify": "! grep -REn 'lineWidth: 1\\.5' ios/LaneShadow/Views/Atoms/LSIcon.swift" }
  ]
}
-->

