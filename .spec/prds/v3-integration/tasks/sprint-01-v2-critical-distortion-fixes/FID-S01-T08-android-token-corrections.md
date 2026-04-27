# FID-S01-T08 — Android remaining HIGH-severity token corrections

**Sprint:** [SPRINT.md](./SPRINT.md) · **Agent:** kotlin-implementer · **Estimate:** 180 min · **Type:** FEATURE · **Priority:** P0 · **Effort:** M · **Status:** Backlog

## BACKGROUND

Five Android organism gaps remain after T06/T07: pinned indicator dot uses `primary.default.copy(alpha = 0.12f)` instead of `signal.default` full opacity; LSRouteCard saved-state heart uses `IconColor.Content(Primary)` not `IconColor.Signal`; LSRouteCard map preview uses fixed `.height(160.dp)` instead of `aspectRatio(9f/4f)`; LSRouteSheet hardcodes `'9am'`/`'3pm'` instead of accepting `timeRange: Pair<String, String>`; LSSectionHeader Row uses `verticalAlignment = CenterVertically` instead of `alignBy(LastBaseline)`.

## CRITICAL CONSTRAINTS

- MUST source every color from `theme.colors.signal.* / status.*` — NEVER `copy(alpha = 0.12f)` hacks; pinned dot becomes `signal.default` at full opacity.
- MUST replace LSRouteCard map `.height(160.dp)` (or equivalent fixed-height modifier) with `Modifier.aspectRatio(9f/4f)`.
- MUST add `timeRange: Pair<String, String>` parameter to LSRouteSheet WITHOUT removing existing `weatherTimeline` param; thread to LSWeatherTimeline `from`/`to` props.
- MUST switch LSSectionHeader Row from `verticalAlignment = Alignment.CenterVertically` to per-child `Modifier.alignBy(LastBaseline)`.
- STRICTLY do NOT modify `ios/**`, `server/**`, `react-native/**`, `web/**`, `tokens/**`.
- MUST keep all Android sandbox story IDs identical to iOS (organisms.routecard.*, organisms.routesheet.*, organisms.sectionheader.*, organisms.navigatormessage.*) per RULES.md#cross-platform-component-parity.
- NEVER lower assertion strength to make a token-compliance test pass; if a literal is required, allowlist explicitly.

## SPECIFICATION

**Objective:** Close the remaining 5 HIGH/MED-severity Android token & layout gaps in the content-organism layer (LSNavigatorMessage pinned dot, LSRouteCard heart + map aspect, LSRouteSheet timeRange wiring, LSSectionHeader baseline alignment) so Android matches `.spec/design/system/` and reaches story parity with iOS for these four organisms.

**Success state:** (1) LSNavigatorMessage pinned dot renders at full opacity using `theme.colors.signal.default`. (2) LSRouteCard saved heart uses `IconColor.Signal`. (3) LSRouteCard map preview honors `aspectRatio(9f/4f)`. (4) LSRouteSheet accepts `timeRange: Pair<String, String>` and threads into LSWeatherTimeline (no more `'9am'/'3pm'` literals). (5) LSSectionHeader Row aligns title + see-all link by `LastBaseline`. All four organisms have Android sandbox stories with IDs matching iOS verbatim. `pnpm snapshots:check` passes.

## ACCEPTANCE CRITERIA

- **AC-1** GIVEN LSNavigatorMessage rendered with `isPinned = true`, WHEN pinned indicator dot laid out, THEN dot background equals `theme.colors.signal.default` at full opacity (`alpha == 1.0f`); NOT `theme.colors.primary.default.copy(alpha = 0.12f)`.
  - verify: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSNavigatorMessageTest.pinnedDotIsSignalDefaultFullOpacity'`
- **AC-2** GIVEN LSRouteCard rendered with `isSaved = true`, WHEN heart icon composed, THEN LSIcon color resolves to `IconColor.Signal` — NOT `IconColor.Content(ContentColor.Primary)`.
  - verify: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteCardTest.savedHeartUsesIconColorSignal'`
- **AC-3** GIVEN LSRouteCard rendered at any width (e.g. 360.dp), WHEN map preview measured, THEN height equals width × (4f/9f) within 1px tolerance and NO `Modifier.height(160.dp)` literal remains.
  - verify: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteCardTest.mapPreviewHasNineByFourAspectRatio'`
- **AC-4** GIVEN LSRouteSheet invoked with `timeRange = '7am'` to `'1pm'`, WHEN weather timeline section rendered, THEN from/to labels passed to LSWeatherTimeline equal `'7am'`/`'1pm'` (no `'9am'`/`'3pm'` literals reachable).
  - verify: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteSheetTest.timeRangeIsForwardedToWeatherTimeline'`
- **AC-5** GIVEN LSSectionHeader rendered with title and see-all link, WHEN Row composed, THEN title text and see-all text share same `LastBaseline` y-coordinate (per Compose `alignBy` semantics) and `verticalAlignment = Alignment.CenterVertically` is removed.
  - verify: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSectionHeaderTest.titleAndSeeAllShareLastBaseline'`
- **AC-6** GIVEN Android sandbox built, WHEN `AppStories.all` enumerated, THEN story IDs for `organisms.routecard.{default,saved,alt1,long-title-overflow,missing-optional-data,dark-mode}`, `organisms.routesheet.{best-route,alt-route,long-title,mixed-weather,dark-mode}`, `organisms.sectionheader.{title-only,title-with-see-all,caps-label,custom-inset,dark-mode}`, `organisms.navigatormessage.{message-only,one-attachment,three-attachments,pinned,long-body,dark-mode}` are present and match iOS verbatim.
  - verify: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.sandbox.stories.ContentOrganismStoryParityTest' && pnpm snapshots:check`

## TEST CRITERIA

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | LSNavigatorMessageTest.pinnedDotIsSignalDefaultFullOpacity asserts dot bg = signal.default alpha 1.0f | AC-1 | gradle test |
| TC-2 | LSRouteCardTest.savedHeartUsesIconColorSignal asserts IconColor.Signal | AC-2 | gradle test |
| TC-3 | LSRouteCardTest.mapPreviewHasNineByFourAspectRatio asserts measured height = width × 4/9 ±1px | AC-3 | gradle test |
| TC-4 | LSRouteSheetTest.timeRangeIsForwardedToWeatherTimeline asserts from='7am', to='1pm' | AC-4 | gradle test |
| TC-5 | LSSectionHeaderTest.titleAndSeeAllShareLastBaseline asserts bottom y match within 1px | AC-5 | gradle test |
| TC-6 | ContentOrganismStoryParityTest asserts 4 organism story sets match iOS | AC-6 | gradle test + `pnpm snapshots:check` |
| TC-7 | Token compliance script returns exit 0 against 4 modified organism files | AC-1 | `scripts/tokens/enforce-native-compliance.sh` |

## READING LIST

- `[PHASE: RED]` `.spec/prds/v3-integration/remediations/05-organisms-content.md` — gaps E1-04, E3-04, E3-03 (Android), E2-05, E4-03
- `[PHASE: GREEN]` `android/app/src/main/java/com/laneshadow/ui/organisms/LSNavigatorMessage.kt` — pinned dot color fix line ~262
- `[PHASE: GREEN]` `android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteCard.kt` — heart IconColor lines 74-80 + map aspectRatio
- `[PHASE: GREEN]` `android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt` — add timeRange param; remove '9am'/'3pm' lines 143-148
- `[PHASE: GREEN]` `android/app/src/main/java/com/laneshadow/ui/organisms/LSSectionHeader.kt` — replace CenterVertically with alignBy(LastBaseline)
- `[PHASE: GREEN]` `android/app/src/debug/java/com/laneshadow/sandbox/stories/AppStories.kt` — register newly-added story entries
- `[PHASE: GREEN]` `android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/` — author/extend Android story files
- `[PHASE: RED]` `ios/LaneShadow/Sandbox/Stories/Organisms/` — source of truth for parity story IDs (read-only)
- `[PHASE: RED]` `RULES.md` — Cross-Platform Component Parity rule + accessibility
- `[PHASE: RED]` `tokens/platforms/kotlin/` — verify signal.default availability + IconColor.Signal enum

## GUARDRAILS

**WRITE-ALLOWED:**
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSNavigatorMessage.kt`
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteCard.kt`
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt`
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSSectionHeader.kt`
- `android/app/src/main/java/com/laneshadow/ui/templates/RouteDetailsScreen.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/AppStories.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSRouteCardStory.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSRouteSheetStory.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSSectionHeaderStory.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSNavigatorMessageStory.kt`
- `android/app/src/test/java/com/laneshadow/ui/organisms/LSNavigatorMessageTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/organisms/LSRouteCardTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/organisms/LSRouteSheetTest.kt`
- `android/app/src/test/java/com/laneshadow/ui/organisms/LSSectionHeaderTest.kt`
- `android/app/src/test/java/com/laneshadow/sandbox/stories/ContentOrganismStoryParityTest.kt`
- `.spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/snapshots/android/organisms.{routecard,routesheet,sectionheader,navigatormessage}.*.png`

**WRITE-PROHIBITED:** `ios/**`, `server/**`, `react-native/**`, `web/**`, `tokens/**`, `LSSessionsDrawer.kt` (owned by T06/T07), `LSTopBar.kt` (owned by T06)

## DESIGN

**References:**
- `.spec/design/system/organisms/navigator-callouts/navigator-callouts.html` (pinned indicator)
- `.spec/design/system/organisms/route-card/route-card.html` (heart, aspect-ratio)
- `.spec/design/system/organisms/route-sheet/route-sheet.html` (weather timeline params)
- `.spec/design/system/organisms/section-header/section-header.html` (baseline alignment)
- `.spec/prds/v3-integration/12-uc-fid.md` UC-FID-01 HIGH-severity AC subset
- `.spec/prds/v3-integration/remediations/05-organisms-content.md` E1-04 / E3-04 / E3-03 (Android) / E2-05 / E4-03

**Pattern:** Token-driven semantic styling + Compose layout primitives (`Modifier.aspectRatio`, `Modifier.alignBy(LastBaseline)`) + slot-based prop forwarding for testability.
**Pattern source:** Material 3 Compose layout APIs; existing LSRouteCard story patterns on iOS; LSWeatherTimeline existing API surface.
**Anti-pattern:** Hardcoding alpha factors (`0.12f`) to dim brand colors instead of using muted semantic tokens. Fixed-height map previews. String-literal time labels not reflecting actual weather window. CenterVertically alignment on mixed-typography rows producing visible vertical drift.

## RED PHASE INSTRUCTIONS

Author 5 Robolectric / `createComposeRule` unit test files (one per organism) under `android/app/src/test/java/com/laneshadow/ui/organisms/`. Use `SemanticsNodeInteraction.fetchSemanticsNode()` + captured Modifier inspection to assert color/icon/aspect/baseline. For TC-4 inject CompositionLocal-based LSWeatherTimeline spy OR refactor LSRouteSheet to accept a `weatherTimelineSlot` lambda for testability. For TC-5 use `composeTestRule.onNodeWithTag(LSSECTIONHEADER_TITLE_TAG).getUnclippedBoundsInRoot().bottom` and compare see-all bottom within 1.dp tolerance. For TC-6 add `ContentOrganismStoryParityTest` under `android/app/src/test/java/com/laneshadow/sandbox/stories/` that loads `AppStories.all` and asserts each of the four organisms' story id sets matches iOS hardcoded reference list. All six TCs MUST fail before implementation.

## GREEN PHASE INSTRUCTIONS

1. **LSNavigatorMessage.kt** line ~262: replace `theme.colors.primary.default.copy(alpha = 0.12f)` with `theme.colors.signal.default` (full opacity).
2. **LSRouteCard.kt** lines 74-80: change `IconColor.Content(ContentColor.Primary)` → `IconColor.Signal`.
3. **LSRouteCard.kt** map slot: remove `.height(160.dp)` and apply `Modifier.aspectRatio(9f / 4f)` to same Box.
4. **LSRouteSheet.kt:** add `timeRange: Pair<String, String>` param to public composable signature (positional after weatherTimeline; default null OR required based on existing call sites — RouteDetailsScreen.kt is the consumer). Lines 143-148: replace `from = "9am", to = "3pm"` with `from = timeRange.first, to = timeRange.second`. Update RouteDetailsScreen.kt to pass `timeRange` derived from `state.weatherTimeline.firstOrNull()?.hour to state.weatherTimeline.lastOrNull()?.hour` (with safe fallback).
5. **LSSectionHeader.kt** line 52: remove `verticalAlignment = Alignment.CenterVertically` from Row; on each child (title + see-all link) apply `Modifier.alignBy(LastBaseline)`. Add `Modifier.padding(vertical = theme.space.md)` to Row container per remediation E4-04.
6. Author Android sandbox stories: `LSRouteCardStory.kt` (6 stories), `LSRouteSheetStory.kt` (5), `LSSectionHeaderStory.kt` (5), `LSNavigatorMessageStory.kt` (6) — IDs verbatim from iOS sources. Register each in `AppStories.all`.
7. Run all gates; regenerate snapshot fixtures; confirm `pnpm snapshots:check` passes.

## REVIEW NOTES

- **Cross-platform parity:** grep iOS `Stories/Organisms` for `id:` and Android stories for `id =`; the four organism families MUST have identical lowercase.dot.kebab-case ids per RULES.md#cross-platform-component-parity.
- **Token compliance:** `scripts/tokens/enforce-native-compliance.sh` against the 4 modified organism files MUST exit 0.
- **Accessibility:** aspectRatio change preserves LSRouteCard map preview minimum touch area. LSSectionHeader baseline alignment improves screen-reader reading order — verify TalkBack via androidTest if time permits.
- **Boy Scout:** while in LSRouteCard, check for missing separator pipe between subtitle and meta (gap E3-06) — if 1-line fix, include and note in commit body. Do not expand into difficulty-pill rework (gap E3-05).
- **API change risk:** adding required `timeRange` param to LSRouteSheet breaks call sites — grep codebase for `LSRouteSheet(` and update each or default the param to derived fallback. RouteDetailsScreen.kt is the only known consumer.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| kotlin-compile | `cd android && ./gradlew :app:compileDebugKotlin` | BUILD SUCCESSFUL exit 0 |
| unit-tests | `cd android && ./gradlew test` | all 6 organism test classes pass |
| assemble-debug | `cd android && ./gradlew assembleDebug` | BUILD SUCCESSFUL exit 0 |
| token-compliance | `scripts/tokens/enforce-native-compliance.sh` | exit 0 |
| snapshot-parity | `pnpm snapshots:check` | exit 0 |

## CODING STANDARDS

`RULES.md#accessibility-standards`, `RULES.md#cross-platform-component-parity`

## DEPENDENCIES

- **depends_on:** [FID-S01-T07] (T07 unblocks the Android compile)
- **blocks:** [FID-S01-T09]

> **Rationale:** Independent of T06 at the file level, but shares `AppStories.kt` registry — coordinate merge order to avoid conflicts.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"Pinned dot signal.default full opacity","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSNavigatorMessageTest.pinnedDotIsSignalDefaultFullOpacity'","phase":"green"},{"id":"AC-2","type":"acceptance_criterion","description":"Saved heart uses IconColor.Signal","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteCardTest.savedHeartUsesIconColorSignal'","phase":"green"},{"id":"AC-3","type":"acceptance_criterion","description":"Map preview aspectRatio 9f/4f","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteCardTest.mapPreviewHasNineByFourAspectRatio'","phase":"green"},{"id":"AC-4","type":"acceptance_criterion","description":"timeRange forwarded to LSWeatherTimeline","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteSheetTest.timeRangeIsForwardedToWeatherTimeline'","phase":"green"},{"id":"AC-5","type":"acceptance_criterion","description":"SectionHeader title+see-all share LastBaseline","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSectionHeaderTest.titleAndSeeAllShareLastBaseline'","phase":"green"},{"id":"AC-6","type":"acceptance_criterion","description":"4 organism story sets match iOS verbatim","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.sandbox.stories.ContentOrganismStoryParityTest' && pnpm snapshots:check","phase":"green"},{"id":"TC-1","type":"test_criterion","description":"pinnedDotIsSignalDefaultFullOpacity","maps_to_ac":"AC-1","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSNavigatorMessageTest.pinnedDotIsSignalDefaultFullOpacity'","phase":"red"},{"id":"TC-2","type":"test_criterion","description":"savedHeartUsesIconColorSignal","maps_to_ac":"AC-2","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteCardTest.savedHeartUsesIconColorSignal'","phase":"red"},{"id":"TC-3","type":"test_criterion","description":"mapPreviewHasNineByFourAspectRatio","maps_to_ac":"AC-3","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteCardTest.mapPreviewHasNineByFourAspectRatio'","phase":"red"},{"id":"TC-4","type":"test_criterion","description":"timeRangeIsForwardedToWeatherTimeline","maps_to_ac":"AC-4","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteSheetTest.timeRangeIsForwardedToWeatherTimeline'","phase":"red"},{"id":"TC-5","type":"test_criterion","description":"titleAndSeeAllShareLastBaseline","maps_to_ac":"AC-5","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSectionHeaderTest.titleAndSeeAllShareLastBaseline'","phase":"red"},{"id":"TC-6","type":"test_criterion","description":"ContentOrganismStoryParityTest + snapshots:check","maps_to_ac":"AC-6","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.sandbox.stories.ContentOrganismStoryParityTest' && pnpm snapshots:check","phase":"red"},{"id":"TC-7","type":"test_criterion","description":"Token compliance","maps_to_ac":"AC-1","verify":"scripts/tokens/enforce-native-compliance.sh","phase":"green"}]}
-->
