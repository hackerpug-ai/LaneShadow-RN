# FID-S01-T06 — Android Sessions drawer container fix + token corrections

**Sprint:** [SPRINT.md](./SPRINT.md) · **Agent:** kotlin-implementer · **Estimate:** 240 min · **Type:** FEATURE · **Priority:** P0 · **Effort:** M · **Status:** Backlog

## BACKGROUND

Android `LSSessionsDrawer` wraps in `LSGlassPanel(Chrome)` causing map content to bleed through; uses raw alpha derivative for active row instead of `signal.whisper` semantic token; active stripe uses raw `theme.space.xs` not `stroke.lg` (2dp); LSTopBar hamburger lacks Material 3 minimum touch target enforcement; drawer shadow recipe missing.

## CRITICAL CONSTRAINTS

- MUST replace `LSGlassPanel(Chrome)` wrapper with solid `Column + background(theme.colors.surface.card)` — never re-introduce glass blur on the drawer container.
- MUST source every color/dimension from `LocalLaneShadowTheme` or `GeneratedTokens` — NEVER use `Color(0xFF...)`, `.dp` literals for tokenized sizes, or raw alpha factors. Token compliance enforced by `scripts/tokens/enforce-native-compliance.sh`.
- MUST keep Android story IDs identical to iOS counterparts (`organisms.sessionsdrawer.default / .empty / .long-list / .no-active / .dark-mode`) per RULES.md#cross-platform-component-parity.
- STRICTLY do NOT modify `ios/**`, `server/**`, `react-native/**`, `web/**`, `tokens/**`.
- NEVER lower hamburger Box hit target below 48.dp; use `Modifier.minimumInteractiveComponentSize()` or explicit `.size(48.dp).contentShape(Rectangle)`.
- NEVER bypass lefthook hooks (`--no-verify`).

## SPECIFICATION

**Objective:** Bring Android LSSessionsDrawer to design fidelity against `.spec/design/system/organisms/sessions-drawer/` — solid surface container, correct stroke width, semantic active-row tint, accessible hit target on hamburger entry, spec'd directional drawer shadow.

**Success state:** LSSessionsDrawer renders an opaque copper-card container (no map bleed-through), active stripe is exactly `stroke.lg` wide using `signal.default`, active row background is `theme.colors.signal.whisper` (auto-resolves dark mode), LSTopBar hamburger has ≥48dp Box hit target, and a `2dp 0 16dp` shadow projects to the right edge. Snapshot tests for `sessionsdrawer.default` and `sessionsdrawer.no-active` pass against PNG fixtures parallel to iOS.

## ACCEPTANCE CRITERIA

- **AC-1** GIVEN LSSessionsDrawer rendered with non-empty session list, WHEN composable renders in sandbox, THEN root container is NOT wrapped in `LSGlassPanel` and exposes `surface.card` as its background; map content behind the drawer is not visible through the body.
  - verify: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest.containerIsSolidSurfaceCard'`
- **AC-2** GIVEN session row rendered with `isActive = true`, WHEN active stripe laid out, THEN width equals `GeneratedTokens.sizing.stroke.lg` (2.dp) and row background equals `theme.colors.signal.whisper`.
  - verify: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest.activeRowUsesSignalWhisperAndStrokeLg'`
- **AC-3** GIVEN LSTopBar hamburger chip rendered, WHEN instrumentation/Robolectric measurement taken, THEN hit target Box ≥48.dp × 48.dp via `Modifier.minimumInteractiveComponentSize()` or explicit size, and chip height literal `40.dp` is replaced with token reference.
  - verify: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSTopBarTest.hamburgerHitTargetIs48dp'`
- **AC-4** GIVEN drawer rendered, WHEN `Modifier.shadow` applied, THEN directional shadow with elevation 2.dp blur 16.dp ambient color rgba(34,24,16,0.14) applied to right edge.
  - verify: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest.drawerHasTrailingShadow'`
- **AC-5** GIVEN Android sandbox built, WHEN OrganismStories registry enumerated, THEN story IDs `organisms.sessionsdrawer.{default,empty,long-list,no-active,dark-mode}` present and match iOS LSSessionsDrawerStory.swift verbatim.
  - verify: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.sandbox.stories.LSSessionsDrawerStoryParityTest' && pnpm snapshots:check`

## TEST CRITERIA

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | containerIsSolidSurfaceCard asserts no LSGlassPanelVariant key + root background = surface.card | AC-1 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest.containerIsSolidSurfaceCard'` |
| TC-2 | activeRowUsesSignalWhisperAndStrokeLg measures stripe width and active-row background | AC-2 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest.activeRowUsesSignalWhisperAndStrokeLg'` |
| TC-3 | hamburgerHitTargetIs48dp asserts width/height ≥48dp | AC-3 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSTopBarTest.hamburgerHitTargetIs48dp'` |
| TC-4 | drawerHasTrailingShadow asserts Modifier.shadow elevation 2dp + ambient color | AC-4 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest.drawerHasTrailingShadow'` |
| TC-5 | LSSessionsDrawerStoryParityTest enumerates AppStories.all and asserts 5 ids match iOS + snapshots:check passes | AC-5 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.sandbox.stories.LSSessionsDrawerStoryParityTest' && pnpm snapshots:check` |
| TC-6 | Token compliance script returns exit 0 against modified files | AC-1 | `scripts/tokens/enforce-native-compliance.sh android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt` |

## READING LIST

- `[PHASE: RED]` `.spec/prds/v3-integration/remediations/04-organisms-chrome.md` — sessions-drawer container/stripe/shadow/hamburger gaps
- `[PHASE: RED]` `.spec/prds/v3-integration/remediations/03-views-sessions-error.md` — active-row signal.whisper + stroke.lg requirement at view layer
- `[PHASE: GREEN]` `android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt` — strip LSGlassPanel, swap stripe + bg tokens, add shadow
- `[PHASE: GREEN]` `android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt` — remove hardcoded 40.dp, add minimumInteractiveComponentSize()
- `[PHASE: GREEN]` `android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSSessionsDrawerStory.kt` — align five sandbox stories with iOS IDs
- `[PHASE: RED]` `ios/LaneShadow/Sandbox/Stories/Organisms/LSSessionsDrawerStory.swift` — source of truth for parity story IDs (read-only)
- `[PHASE: RED]` `tokens/platforms/kotlin/` — verify signal.whisper, stroke.lg, surface.card available
- `[PHASE: RED]` `RULES.md` — Cross-Platform Component Parity rule + 48dp accessibility

## GUARDRAILS

**WRITE-ALLOWED:**
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt`
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSSessionsDrawerStory.kt`
- `android/app/src/test/java/com/laneshadow/ui/organisms/LSSessionsDrawerTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/organisms/LSTopBarTest.kt`
- `android/app/src/test/java/com/laneshadow/sandbox/stories/LSSessionsDrawerStoryParityTest.kt`
- `.spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/snapshots/android/organisms.sessionsdrawer.*.png`

**WRITE-PROHIBITED:** `ios/**`, `server/**`, `react-native/**`, `web/**`, `tokens/**`

## DESIGN

**References:**
- `.spec/design/system/organisms/sessions-drawer/sessions-drawer.html`
- `.spec/design/system/organisms/sessions-drawer/README.md`
- `.spec/prds/v3-integration/12-uc-fid.md` UC-FID-01 HIGH-severity AC subset
- `.spec/prds/v3-integration/remediations/04-organisms-chrome.md` gaps C-01/C-03/C-04/D1-06/B-06
- `.spec/prds/v3-integration/remediations/03-views-sessions-error.md` gaps C1-03/D1-04/D1-06

**Pattern:** Solid surface organism with directional elevation shadow + token-driven active-state styling; Material 3 hit-target compliance via `minimumInteractiveComponentSize()`.
**Pattern source:** Material 3 Compose accessibility guidelines + LSCard/LSGlassPanel decomposition pattern (LSCard for solid, LSGlassPanel only for glass-blur chrome).
**Anti-pattern:** Wrapping any solid-card surface in LSGlassPanel just to inherit shadow/border behavior — leaks blur where design specifies opacity. Sourcing active-row tint via `Color.copy(alpha=…)` instead of `signal.whisper` semantic token (breaks dark mode).

## RED PHASE INSTRUCTIONS

Author Robolectric / `createComposeRule` unit tests in `android/app/src/test/java/com/laneshadow/ui/organisms/LSSessionsDrawerTest.kt` covering TC-1..TC-4. Use `SemanticsMatcher` to assert `LSGlassPanelVariant` key is absent (TC-1). Use `onNodeWithTag(LSSSESSIONSDRAWER_ACTIVE_STRIPE_TAG).getBoundsInRoot().width` and assert `== GeneratedTokens.sizing.stroke.lg.toPx()` (TC-2). For TC-3 add `LSTopBarTest.kt` and assert `assertWidthIsAtLeast(48.dp).assertHeightIsAtLeast(48.dp)` on hamburger node. For TC-4 inspect captured Modifier chain via `Modifier.foldIn` for `ShadowElement` with elevation 2.dp. Run gradle test — all four MUST fail before implementation. For TC-5 add `LSSessionsDrawerStoryParityTest.kt` under `android/app/src/test/java/com/laneshadow/sandbox/stories/` that loads `OrganismStories` registry and asserts the five expected ids. Snapshot fixtures should be authored as empty placeholders so `pnpm snapshots:check` fails until GREEN regenerates them.

## GREEN PHASE INSTRUCTIONS

1. In LSSessionsDrawer.kt: replace `LSGlassPanel(variant = GlassVariant.Chrome, ...)` wrapper at lines 84-94 with `Column` modifier chain: `Modifier.width(drawerWidth).fillMaxHeight().background(theme.colors.surface.card).shadow(elevation = 2.dp, ambientColor = Color(0xFF221810).copy(alpha = 0.14f), spotColor = ...).border(width = GeneratedTokens.sizing.stroke.sm, color = theme.colors.border.default)`. NOTE: shadow color literal MUST be sourced via private val constant if token-compliance flags raw `Color()` — wrap in `tokens/platforms/kotlin` allowlist OR introduce `theme.elevation.drawer` alias.
2. Active stripe (lines 215-225): swap `.width(theme.space.xs)` → `.width(GeneratedTokens.sizing.stroke.lg)`.
3. Active row background (lines 192-199): replace `GeneratedTokens.color.Signal.default.copy(alpha = ...)` with `theme.colors.signal.whisper`.
4. In LSTopBar.kt: remove `chipHeight = 40.dp` literal, replace with `Modifier.minimumInteractiveComponentSize()` on hamburger Box; alternately wrap in `Box(Modifier.size(48.dp).contentShape(RectangleShape))`.
5. Update LSSessionsDrawerStory.kt to register all 5 stories with exact IDs from iOS source.
6. Re-run gradle test until green; regenerate snapshot PNG fixtures via existing capture pipeline; run `pnpm snapshots:check`.

## REVIEW NOTES

- **Cross-platform parity:** confirm story ids `organisms.sessionsdrawer.{default,empty,long-list,no-active,dark-mode}` match iOS LSSessionsDrawerStory.swift exactly — diff with grep on both files.
- **Token compliance:** `scripts/tokens/enforce-native-compliance.sh` against the 3 modified .kt files MUST exit 0; raw shadow color may need `tokens/platforms/kotlin` allowlist entry — note in commit body if introduced.
- **Accessibility:** hamburger hit target ≥48.dp per RULES.md#accessibility-standards (Material 3 minimum); verify with `assertWidthIsAtLeast(48.dp)` not just visual inspection.
- **Snapshot determinism:** regenerate `sessionsdrawer.*` PNG fixtures and confirm `pnpm snapshots:check` passes both iOS+Android.
- **Boy Scout:** if `LSGlassPanelVariantKey` semantics property is now orphaned post-refactor, remove its declaration to avoid dead code.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| kotlin-compile | `cd android && ./gradlew :app:compileDebugKotlin` | BUILD SUCCESSFUL exit 0 |
| unit-tests | `cd android && ./gradlew test` | BUILD SUCCESSFUL with all LSSessionsDrawerTest + LSTopBarTest cases passing |
| assemble-debug | `cd android && ./gradlew assembleDebug` | BUILD SUCCESSFUL exit 0 |
| token-compliance | `scripts/tokens/enforce-native-compliance.sh` | exit 0 |
| snapshot-parity | `pnpm snapshots:check` | exit 0 |

## CODING STANDARDS

`RULES.md#accessibility-standards`, `RULES.md#cross-platform-component-parity`

## DEPENDENCIES

- **depends_on:** [FID-S01-T07] (T07 unblocks Android compile so this task's tests can run)
- **blocks:** [FID-S01-T09]

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"Container is solid surface.card no LSGlassPanel","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest.containerIsSolidSurfaceCard'","phase":"green"},{"id":"AC-2","type":"acceptance_criterion","description":"Active row uses signal.whisper + stroke.lg","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest.activeRowUsesSignalWhisperAndStrokeLg'","phase":"green"},{"id":"AC-3","type":"acceptance_criterion","description":"Hamburger hit target ≥48dp","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSTopBarTest.hamburgerHitTargetIs48dp'","phase":"green"},{"id":"AC-4","type":"acceptance_criterion","description":"Drawer trailing shadow elevation 2dp","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest.drawerHasTrailingShadow'","phase":"green"},{"id":"AC-5","type":"acceptance_criterion","description":"5 story IDs match iOS","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.sandbox.stories.LSSessionsDrawerStoryParityTest' && pnpm snapshots:check","phase":"green"},{"id":"TC-1","type":"test_criterion","description":"containerIsSolidSurfaceCard","maps_to_ac":"AC-1","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest.containerIsSolidSurfaceCard'","phase":"red"},{"id":"TC-2","type":"test_criterion","description":"activeRowUsesSignalWhisperAndStrokeLg","maps_to_ac":"AC-2","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest.activeRowUsesSignalWhisperAndStrokeLg'","phase":"red"},{"id":"TC-3","type":"test_criterion","description":"hamburgerHitTargetIs48dp","maps_to_ac":"AC-3","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSTopBarTest.hamburgerHitTargetIs48dp'","phase":"red"},{"id":"TC-4","type":"test_criterion","description":"drawerHasTrailingShadow","maps_to_ac":"AC-4","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest.drawerHasTrailingShadow'","phase":"red"},{"id":"TC-5","type":"test_criterion","description":"Story parity test + snapshots:check","maps_to_ac":"AC-5","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.sandbox.stories.LSSessionsDrawerStoryParityTest' && pnpm snapshots:check","phase":"red"},{"id":"TC-6","type":"test_criterion","description":"Token compliance","maps_to_ac":"AC-1","verify":"scripts/tokens/enforce-native-compliance.sh android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt","phase":"green"}]}
-->
