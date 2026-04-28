================================================================================
TASK: FID-S02-T06 - Android RouteResults + RouteDetails Variants
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  test: cd android && ./gradlew test
  lint: cd android && ./gradlew detekt
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-7 not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Android sandbox renders RouteResults S02 (alt-selection re-promote with `Animatable.animateTo` polyline rework) + S04 (refining) + V03 (Recall chip), and RouteDetails S03 (dark) + S04 (medium detent) + S05 (dismissing copper stripe) + V01 (saved-state toast + Save button flip) at parity with iOS T05.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST register variants under the SAME canonical IDs as iOS T05 — `templates.route-results.s02-alt-selected`, `s04-refining`, `v03-recall`, `templates.route-details.s03-dark`, `s04-medium`, `s05-dismissing`, `v01-saved`
- MUST connect `LSNavigatorMessage` `onRouteCardTap: (String) -> Unit` callback (Gap H1-07 paired side) so route-card taps update `selectedRouteId`
- NEVER hardcode color/spacing/typography literals — read from `theme.colors`, `theme.space`, `theme.type`
- MUST drive variants from MockProvider state — no story-id branching in screen composables
- MUST NOT regress polyline animation work landed in FID-S02-T02 (`Animatable.animateTo`); the alt-selection re-promote uses the same `Animatable<Float>` polyline driver

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] S02 alt-selection re-promote works (AC-1 PRIMARY)
- [ ] S04 refining state — `surface.scrim-soft` overlay + 0.4 polyline opacity + auto-dismissed callout + 3 primer chips + signal send button (AC-2)
- [ ] V03 Recall chip — glass pill restores callout (AC-3)
- [ ] S03 dark story registered (AC-4)
- [ ] S04 medium-detent story registered (AC-5)
- [ ] S05 dismissing copper-stripe flash on drag past detent (AC-6)
- [ ] V01 saved-state toast + Save button flip + LSSavedPill beside LSBestBadge (AC-7)
- [ ] `./gradlew :app:compileDebugKotlin` + `./gradlew test` pass + native-compliance clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Alt-selection re-promote (S02) [PRIMARY]
  GIVEN: RouteResultsScreen S02 story renders with `selectedRouteId = best.id` and three route attachment cards
  WHEN:  The user taps the alt1 card
  THEN:  `LSNavigatorMessage.onRouteCardTap` fires with alt1 id, `selectedRouteId` updates, alt1's polyline re-promotes from dashed→solid + 0.55→0.9 alpha via `Animatable.animateTo` from FID-S02-T02 driver, and alt1 card border re-tints to `theme.colors.route.alt1`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/RouteResultsDetailsVariantTests.kt
  TEST_FUNCTION: testS02AltSelectionRepromote

AC-2: Refining state (S04)
  GIVEN: RouteResultsScreen S04 story is rendered with `mode = Refining`
  WHEN:  The screen draws
  THEN:  `theme.colors.surface.scrimSoft` overlays the map, polylines render at alpha 0.4, the LSNavigatorMessage is hidden, three primer chips appear above the chat input, and a `theme.colors.signal.default` send button renders in the trailing chat-input slot

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/RouteResultsDetailsVariantTests.kt
  TEST_FUNCTION: testS04RefiningState

AC-3: Recall chip (V03)
  GIVEN: RouteResultsScreen V03 story is rendered with the LSNavigatorMessage `isVisible = false`
  WHEN:  The screen draws
  THEN:  A glass pill ("Recall") with `surface.glass` background + `border.glass` + Compose blur modifier (14.dp) is rendered at the message position; clicking it sets the callout `isVisible = true`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/RouteResultsDetailsVariantTests.kt
  TEST_FUNCTION: testV03RecallChip

AC-4: RouteDetails S03 dark
  GIVEN: Sandbox story `templates.route-details.s03-dark` is rendered
  WHEN:  The host applies `darkTheme = true`
  THEN:  All theme tokens resolve to dark variants and the map / sheet / weather timeline render in dark theme

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/RouteResultsDetailsVariantTests.kt
  TEST_FUNCTION: testRouteDetailsS03Dark

AC-5: RouteDetails S04 medium detent
  GIVEN: Sandbox story `templates.route-details.s04-medium` is rendered
  WHEN:  The sheet presents
  THEN:  `LSBottomSheet(detent = SheetDetent.Medium)` is used and the sheet sits at the medium peek with map + sheet visible

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/RouteResultsDetailsVariantTests.kt
  TEST_FUNCTION: testRouteDetailsS04MediumDetent

AC-6: RouteDetails S05 dismissing copper stripe
  GIVEN: Sandbox story `templates.route-details.s05-dismissing` with sheet drag past medium detent
  WHEN:  The dismiss threshold is passed
  THEN:  A copper top-edge stripe gradient flash renders at the top of the sheet (`Brush.linearGradient` transparent → `signal.default` → transparent at `theme.strokeWidth.lg` height, alpha 0.85)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/RouteResultsDetailsVariantTests.kt
  TEST_FUNCTION: testRouteDetailsS05Dismissing

AC-7: RouteDetails V01 saved-state
  GIVEN: Sandbox story `templates.route-details.v01-saved` with `isSaved = true`
  WHEN:  The screen draws
  THEN:  An `LSToast` slides in (glass + copper top stripe), the Save button renders the saved variant (`signal.tint` border + `signal.whisper` background + `signal.default` text), and an `LSSavedPill` appears beside the LSBestBadge

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/RouteResultsDetailsVariantTests.kt
  TEST_FUNCTION: testRouteDetailsV01Saved

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/screens/RouteResultsScreen.kt (MODIFY — selectedRouteId state, refining mode, recall chip)
- android/app/src/main/java/com/laneshadow/ui/screens/RouteDetailsScreen.kt (MODIFY — saved-state toast + button flip)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSNavigatorMessage.kt (MODIFY — onRouteCardTap callback, isVisible flag)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt (MODIFY — dismissing copper stripe; medium-detent compatibility)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSSavedPill.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSToast.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/RouteMockProvider.kt (MODIFY — variants)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/templates/RouteResultsScreenStory.kt (MODIFY — register S02, S04, V03)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/templates/RouteDetailsScreenStory.kt (MODIFY — register S03, S04, S05, V01)
- android/app/src/test/java/com/laneshadow/sandbox/RouteResultsDetailsVariantTests.kt (NEW)

writeProhibited:
- ios/** — paired iOS task (FID-S02-T05)
- server/**, react-native/**
- tokens/** — must NOT add new tokens
- Any file not explicitly listed above

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- RouteResultsScreen.kt (MODIFY): selectedRouteId state + refining + recall
- RouteDetailsScreen.kt (MODIFY): saved-state toast + Save flip + dismissing flash hook
- LSNavigatorMessage.kt (MODIFY): `onRouteCardTap: (String) -> Unit` parameter (default no-op) + `isVisible: Boolean` flag
- LSRouteSheet.kt (MODIFY): dismissing copper-stripe overlay
- LSSavedPill.kt (NEW), LSToast.kt (NEW)
- RouteMockProvider.kt (MODIFY): seven new variants
- RouteResultsScreenStory.kt / RouteDetailsScreenStory.kt (MODIFY): seven new sandbox stories with canonical IDs identical to iOS T05
- RouteResultsDetailsVariantTests.kt (NEW): per-AC verification

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/views/route-results-screen/route-results-screen.html [PRIMARY REFERENCE]
2. .spec/design/system/views/route-details-screen/route-details-screen.html [PRIMARY REFERENCE]
3. .spec/prds/v3-integration/remediations/02-views-route.md
   - Sections: Gap A1-01..A1-05, A2-02..A2-04, F2-05, H2-06, H1-07
4. android/app/src/main/java/com/laneshadow/ui/screens/RouteResultsScreen.kt
   - Focus: Current screen + the `Animatable` polyline driver from FID-S02-T02 — do not regress
5. android/app/src/main/java/com/laneshadow/ui/organisms/LSNavigatorMessage.kt
   - Focus: Current attachment-card composable; identify where to thread `onRouteCardTap` callback

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence per AC
Gate 2: One test per AC
Gate 3: Story IDs identical to iOS T05 (cross-platform parity key)
Gate 4: All tests pass — `./gradlew test`
Gate 5: Compile passes — `./gradlew :app:compileDebugKotlin`
Gate 6: Native compliance — `scripts/tokens/enforce-native-compliance.sh` exits 0
Gate 7: Scope compliance — `git diff --name-only ⊆ writeAllowed`

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- iOS variants (FID-S02-T05)
- Real Convex/route data wiring (Sprint 04)
- V02 weather-divergent + storm-hatch overlay (deferred)
- Adding new tokens

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** Android RouteResultsScreen exposes 9 stories (default + dark + several stress tests) but neither S02 alt-selection re-promote, S04 refining, nor V03 Recall variants. Android RouteDetailsScreen exposes 9 stories too, but lacks S03/S04/S05/V01. `LSNavigatorMessage` does not expose an `onRouteCardTap` callback. Polyline animation has been reworked via `Animatable.animateTo` in FID-S02-T02 — the alt-selection re-promote piggybacks on that driver.

**Gap:** Cross-platform parity demands identical story coverage with identical IDs; saved-state and refining/recall flows need to render in sandbox so subsequent integration sprints have visual ground truth.

--------------------------------------------------------------------------------
REVIEW (for kotlin-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per AC
- LSNavigatorMessage gains `onRouteCardTap: (String) -> Unit = {}` parameter (default no-op) — existing callers compile unchanged
- All seven new stories carry canonical IDs identical to iOS T05
- Saved-state toast doesn't re-fire on recomposition (single-shot via `LaunchedEffect(isSaved)`)
- SCOPE respected (`git diff --name-only ⊆ writeAllowed`)

Should verify (≤5):
- Recall chip on V03 doesn't introduce a layout shift when callout returns
- Dismissing copper stripe correctly observes drag offset; no rendering when not dragging
- Polyline `Animatable.animateTo` from T02 still works after S02 re-promote logic is layered on top
- Compose previews for new stories (helps cross-platform visual sync)
- Accessibility — saved-state pill includes `contentDescription = "Saved"`

Verdict: [APPROVED | NEEDS_FIXES]
Feedback (required if NEEDS_FIXES):
```
[Specific, actionable issues — reference file:line where possible]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S02-T02 (Android polyline `Animatable.animateTo` driver), FID-S01-T07 (Android build blockers), FID-S01-T08 (Android route-card / route-sheet token work)
Blocks:     FID-S02-T10 (snapshot baselines)
Parallel:   FID-S02-T01..T05, T07, T08

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN RouteResults S02 story with selectedRouteId=best.id WHEN user taps alt1 card THEN LSNavigatorMessage.onRouteCardTap fires with alt1 id, selectedRouteId updates, alt1 polyline re-promotes via Animatable.animateTo from dashed/0.55 to solid/0.9, alt1 card border re-tints to route.alt1", "verify": "./gradlew test" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN RouteResults S04 with mode=Refining WHEN screen draws THEN surface.scrimSoft overlays map, polylines alpha 0.4, callout hidden, three primer chips above chat input, signal.default send button revealed", "verify": "./gradlew test" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN RouteResults V03 with callout isVisible=false WHEN screen draws THEN glass Recall pill (surface.glass + border.glass + blur 14.dp) at message position; click sets isVisible=true", "verify": "./gradlew test" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN templates.route-details.s03-dark story with darkTheme=true WHEN screen draws THEN theme tokens resolve dark and map + sheet + weather timeline render in dark theme", "verify": "./gradlew test" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN templates.route-details.s04-medium story WHEN sheet presents THEN LSBottomSheet(detent=SheetDetent.Medium) used and sheet sits at medium peek with map + sheet visible", "verify": "./gradlew test" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN templates.route-details.s05-dismissing story with drag past medium detent WHEN threshold passed THEN copper top-edge stripe gradient flash renders (Brush.linearGradient transparent→signal.default→transparent at strokeWidth.lg height, alpha 0.85)", "verify": "./gradlew test" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN templates.route-details.v01-saved story with isSaved=true WHEN screen draws THEN LSToast slides in, Save button renders saved variant (signal.tint border + signal.whisper bg + signal.default text), LSSavedPill appears beside LSBestBadge", "verify": "./gradlew test" },
    { "id": "TC-1", "type": "test_criterion", "description": "Tapping alt1 card invokes onRouteCardTap with alt1 id, updates selectedRouteId, and triggers Animatable.animateTo on alt1 polyline progress to 1.0 + alpha 0.9", "maps_to_ac": "AC-1", "verify": "./gradlew test --tests '*.RouteResultsDetailsVariantTests.testS02AltSelectionRepromote'" },
    { "id": "TC-2", "type": "test_criterion", "description": "S04 refining mode renders surface.scrimSoft overlay, polyline alpha 0.4, hidden LSNavigatorMessage, three primer chips, signal.default send button", "maps_to_ac": "AC-2", "verify": "./gradlew test --tests '*.RouteResultsDetailsVariantTests.testS04RefiningState'" },
    { "id": "TC-3", "type": "test_criterion", "description": "V03 Recall pill rendered with surface.glass + border.glass + 14.dp blur; click sets LSNavigatorMessage isVisible=true", "maps_to_ac": "AC-3", "verify": "./gradlew test --tests '*.RouteResultsDetailsVariantTests.testV03RecallChip'" },
    { "id": "TC-4", "type": "test_criterion", "description": "S03 dark story-id registered as templates.route-details.s03-dark with darkTheme applied", "maps_to_ac": "AC-4", "verify": "./gradlew test --tests '*.RouteResultsDetailsVariantTests.testRouteDetailsS03Dark'" },
    { "id": "TC-5", "type": "test_criterion", "description": "S04 medium-detent story uses LSBottomSheet(detent=SheetDetent.Medium)", "maps_to_ac": "AC-5", "verify": "./gradlew test --tests '*.RouteResultsDetailsVariantTests.testRouteDetailsS04MediumDetent'" },
    { "id": "TC-6", "type": "test_criterion", "description": "S05 dismissing renders copper-stripe gradient overlay at top of sheet at strokeWidth.lg height alpha 0.85 only when drag offset past dismiss threshold", "maps_to_ac": "AC-6", "verify": "./gradlew test --tests '*.RouteResultsDetailsVariantTests.testRouteDetailsS05Dismissing'" },
    { "id": "TC-7", "type": "test_criterion", "description": "V01 saved-state shows LSToast composable, Save button uses saved variant tokens, LSSavedPill appears beside LSBestBadge", "maps_to_ac": "AC-7", "verify": "./gradlew test --tests '*.RouteResultsDetailsVariantTests.testRouteDetailsV01Saved'" }
  ]
}
-->
