================================================================================
TASK: FID-S02-T05 - iOS RouteResults + RouteDetails Variants
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  lint: swiftformat --lint {files}
  test: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-8 not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

iOS sandbox renders RouteResults S02 (alt-selection re-promote), S04 (refining scrim + primer chips + send), V03 (Recall chip), and RouteDetails S03 (dark), S04 (medium detent), S05 (dismissing copper-stripe flash), V01 (saved-state toast + Save button flip) — plus the existing iOS mixed-weather story is fixed to actually load the `mixedWeather` variant.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST register variants under canonical IDs: `templates.route-results.s02-alt-selected`, `s04-refining`, `v03-recall`, `templates.route-details.s03-dark`, `s04-medium`, `s05-dismissing`, `v01-saved`
- MUST connect `LSNavigatorMessage` `onRouteCardTap: (String) -> Void` callback so route-card taps update `selectedRouteId` (Gap H1-07) — the callback must be a new public parameter
- MUST add `selectedRouteId: String?` state to `RouteResultsScreen` and re-promote dashed→solid + re-tint card border by variant color when it changes
- NEVER hardcode color/spacing/typography literals — use theme tokens
- NEVER add a new top-level template; the variants are state-driven on the existing `RouteResultsScreen` / `RouteDetailsScreen`
- MUST fix the iOS mixed-weather story to actually pass `RouteDetailsScreen(provider: provider, variant: .mixedWeather)` (currently no variant arg → defaults to `.default`)

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] S02 alt-selection re-promote works (AC-1 PRIMARY)
- [ ] S04 refining state — warm scrim + 40% polyline + auto-dismissed callout + 3 primer chips + copper send button (AC-2)
- [ ] V03 Recall chip — glass pill at message position; tap restores callout (AC-3)
- [ ] RouteDetails S03 (dark) story registered + renders dark theme tokens (AC-4)
- [ ] RouteDetails S04 (medium detent) story registered + sheet presents at medium peek (AC-5)
- [ ] RouteDetails S05 (dismissing) — copper top-edge stripe gradient flash on dismiss drag (AC-6)
- [ ] RouteDetails V01 saved-state — toast + Save button saved variant + "Saved" pill beside best badge (AC-7)
- [ ] iOS mixed-weather story fix — `RouteDetailsScreen(provider:variant:)` called with `.mixedWeather` (AC-8)
- [ ] `xcodebuild build` + `xcodebuild test` pass + native-compliance clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Alt-selection re-promote (S02) [PRIMARY]
  GIVEN: RouteResultsScreen S02 story renders with `selectedRouteId = best.id` and three route cards
  WHEN:  The user taps the alt1 route attachment card
  THEN:  `LSNavigatorMessage.onRouteCardTap` fires with alt1's id, `selectedRouteId` updates to alt1's id, alt1's polyline promotes from dashed to solid + 0.55→0.9 opacity, and the alt1 card border re-tints to `theme.colors.route.alt1`

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/RouteResultsDetailsVariantTests.swift
  TEST_FUNCTION: testS02AltSelectionRepromote

AC-2: Refining state (S04)
  GIVEN: RouteResultsScreen S04 story is rendered in refining mode
  WHEN:  The screen draws
  THEN:  A `surface.scrim-soft` overlay covers the map, all polylines render at 0.4 opacity, the LSNavigatorMessage is hidden, three primer chips appear above the chat input, and a `signal.default` send button is revealed in the trailing chat-input slot

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/RouteResultsDetailsVariantTests.swift
  TEST_FUNCTION: testS04RefiningState

AC-3: Recall chip (V03)
  GIVEN: RouteResultsScreen V03 story is rendered with the LSNavigatorMessage previously dismissed
  WHEN:  The screen draws
  THEN:  A glass pill ("Recall") with `surface.glass` background + `border.glass` + `backdrop blur(14)` is parked at the message position; tapping it sets the callout's visibility back to true

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/RouteResultsDetailsVariantTests.swift
  TEST_FUNCTION: testV03RecallChip

AC-4: RouteDetails S03 (dark) story
  GIVEN: Sandbox story `templates.route-details.s03-dark` is rendered
  WHEN:  The screen draws under `colorScheme = .dark`
  THEN:  All theme tokens resolve to dark variants (sheet background `surface.card` dark, copper signal preserved, weather timeline contrast preserved)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/RouteResultsDetailsVariantTests.swift
  TEST_FUNCTION: testRouteDetailsS03Dark

AC-5: RouteDetails S04 (medium detent)
  GIVEN: Sandbox story `templates.route-details.s04-medium` is rendered
  WHEN:  The sheet presents
  THEN:  `LSBottomSheet(detent: .medium, …)` is used; the sheet sits at the medium peek (~0.45) with the map and overlay sheet visible

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/RouteResultsDetailsVariantTests.swift
  TEST_FUNCTION: testRouteDetailsS04MediumDetent

AC-6: RouteDetails S05 (dismissing copper stripe)
  GIVEN: Sandbox story `templates.route-details.s05-dismissing` is rendered with a drag past the medium detent
  WHEN:  The dismiss drag passes the threshold
  THEN:  A copper top-edge stripe gradient flash renders at top of the sheet (linear-gradient transparent → `signal.default` → transparent at `theme.strokeWidth.lg` height, opacity 0.85)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/RouteResultsDetailsVariantTests.swift
  TEST_FUNCTION: testRouteDetailsS05Dismissing

AC-7: RouteDetails V01 saved-state
  GIVEN: Sandbox story `templates.route-details.v01-saved` is rendered with `isSaved = true`
  WHEN:  The screen draws
  THEN:  A glass-+-copper-stripe toast slides in at the top, the Save button renders the saved variant (`signal.tint` border + `signal.whisper` bg + `signal.default` text), and a "Saved" pill appears beside the LSBestBadge

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/RouteResultsDetailsVariantTests.swift
  TEST_FUNCTION: testRouteDetailsV01Saved

AC-8: Mixed-weather story fix
  GIVEN: Sandbox story `templates.route-details.s02-mixed-weather` is invoked
  WHEN:  The story builder constructs the screen
  THEN:  `RouteDetailsScreen(provider: provider, variant: .mixedWeather)` is called explicitly — NOT `RouteDetailsScreen(provider: provider)` which silently defaults to `.default`

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/RouteResultsDetailsVariantTests.swift
  TEST_FUNCTION: testRouteDetailsMixedWeatherStoryFix

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Screens/RouteResultsScreen.swift (MODIFY — selectedRouteId state, refining mode, recall chip)
- ios/LaneShadow/Views/Screens/RouteDetailsScreen.swift (MODIFY — saved-state toast + button flip)
- ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift (MODIFY — add onRouteCardTap callback, callout visibility prop)
- ios/LaneShadow/Views/Organisms/LSRouteSheet.swift (MODIFY — dismissing copper stripe, medium-detent compatible)
- ios/LaneShadow/Views/Atoms/LSSavedPill.swift (NEW — small "Saved" pill atom)
- ios/LaneShadow/Views/Molecules/LSToast.swift (NEW — toast molecule)
- ios/LaneShadow/Sandbox/MockProviders/RouteMockProvider.swift (MODIFY — variants for S02/S04/V03/S03/S04/S05/V01)
- ios/LaneShadow/Sandbox/Stories/Templates/RouteResultsScreenStory.swift (MODIFY — register S02, S04, V03)
- ios/LaneShadow/Sandbox/Stories/Templates/RouteDetailsScreenStory.swift (MODIFY — register S03, S04, S05, V01 + fix mixed-weather)
- ios/LaneShadowTests/Sandbox/RouteResultsDetailsVariantTests.swift (NEW)

writeProhibited:
- android/** — paired Android task (FID-S02-T06)
- server/**, react-native/**
- tokens/** — must NOT add new tokens
- Any file not explicitly listed above

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- RouteResultsScreen.swift (MODIFY): `selectedRouteId` state, refining mode, recall chip
- RouteDetailsScreen.swift (MODIFY): saved-state toast + Save flip + dismissing flash hook
- LSNavigatorMessage.swift (MODIFY): public `onRouteCardTap: (String) -> Void` callback + `isVisible` Bool
- LSRouteSheet.swift (MODIFY): dismissing copper-stripe overlay; verify medium detent compatibility (medium detent should already exist from Sprint 01 T04)
- LSSavedPill.swift (NEW), LSToast.swift (NEW)
- RouteMockProvider.swift (MODIFY): seven new variants
- RouteResultsScreenStory.swift / RouteDetailsScreenStory.swift (MODIFY): seven new sandbox stories with canonical IDs + mixed-weather fix
- RouteResultsDetailsVariantTests.swift (NEW): per-AC verification

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/views/mapapp/route-results/route-results-screen.html [PRIMARY REFERENCE]
   - Sections: S02 alt-selected, S04 refining, V03 dismissed (Recall chip)
2. .spec/design/system/views/mapapp/route-details/route-details-screen.html [PRIMARY REFERENCE]
   - Sections: S03 dark, S04 medium detent, S05 dismissing, V01 saved
3. .spec/prds/v3-integration/remediations/02-views-route.md
   - Sections: Gap A1-01..A1-04, A1-05, A2-02, A2-03, A2-04, F2-05, H2-06, H1-07
4. ios/LaneShadow/Views/Screens/RouteResultsScreen.swift
   - Focus: Current screen composition; identify where selectedRouteId state should live and how onRouteCardTap should thread through
5. ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift
   - Focus: Current attachment-card rendering and the absent onRouteCardTap closure parameter

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence per AC
Gate 2: One test per AC
Gate 3: Story IDs canonical + identical to Android paired task T06
Gate 4: All tests pass — `xcodebuild test`
Gate 5: Build passes — `xcodebuild build`
Gate 6: Native compliance — `scripts/tokens/enforce-native-compliance.sh` exits 0
Gate 7: Scope compliance — `git diff --name-only ⊆ writeAllowed`

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Android variants (FID-S02-T06)
- Real Convex/route data wiring (Sprint 04 — CHAT-S04-T05 / T07)
- V02 weather-divergent + storm-hatch overlay (track in Sprint 06 polish if needed; per remediation B1-06 it's deferrable)
- Adding new tokens (`surface.scrim-soft` already exists per remediation; verify before committing)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** RouteResultsScreen on iOS exposes a single default story, has no `selectedRouteId` state, and `LSNavigatorMessage` does not expose a route-card tap callback (Gap H1-07). RouteDetailsScreen has 2 stories — `default` and a buggy `mixedWeather` story that doesn't actually pass `.mixedWeather` (Gap A2-02). No saved-state UX exists. Dismissing copper-stripe flash is unimplemented. Medium detent should be available from Sprint 01 T04 (LSBottomSheet detent: .medium / .large).

**Gap:** Without these variants, no snapshot can capture the alt-selection / refining / dismissing / saved flows; integration sprints will wire real data into a sandbox that still hides 50%+ of designed states.

--------------------------------------------------------------------------------
REVIEW (for swift-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per AC; tests assert state-driven rendering not pixel matches
- LSNavigatorMessage gains `onRouteCardTap` callback parameter (default no-op); existing call sites still compile
- All seven new stories carry canonical IDs identical to Android T06
- Saved-state toast doesn't spuriously re-fire on recomposition
- SCOPE respected (`git diff --name-only ⊆ writeAllowed`)

Should verify (≤5):
- LSToast / LSSavedPill are reusable and theme-token compliant
- Dismissing copper stripe doesn't render outside the dismiss-drag interaction
- Refining state's auto-dismiss doesn't delete the LSNavigatorMessage from view hierarchy (it should hide and be re-toggleable via Recall in V03)
- Dark mode story exercises the same screen — no parallel dark variant of the screen file
- Accessibility: Save button's saved/unsaved state is announced via `accessibilityValue`

Verdict: [APPROVED | NEEDS_FIXES]
Feedback (required if NEEDS_FIXES):
```
[Specific, actionable issues — reference file:line where possible]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S01-T03 (LSRouteCard geometry), FID-S01-T04 (LSRouteSheet bottom-sheet shell incl. medium detent)
Blocks:     FID-S02-T10 (snapshot baselines for new stories)
Parallel:   FID-S02-T01..T04, T06..T08

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN RouteResults S02 with selectedRouteId=best.id WHEN user taps alt1 card THEN LSNavigatorMessage.onRouteCardTap fires with alt1.id, selectedRouteId updates, alt1 polyline promotes dashed→solid + 0.55→0.9 opacity, alt1 card border re-tints to route.alt1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN RouteResults S04 refining mode WHEN screen draws THEN surface.scrim-soft overlays map, polylines at 0.4 opacity, LSNavigatorMessage hidden, three primer chips above chat input, signal.default send button revealed in trailing slot", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN RouteResults V03 with callout dismissed WHEN screen draws THEN glass Recall pill (surface.glass + border.glass + backdrop blur 14) parked at message position; tap restores callout visibility", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN templates.route-details.s03-dark story WHEN screen draws under colorScheme=.dark THEN theme tokens resolve to dark variants and copper signal + weather contrast preserved", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN templates.route-details.s04-medium story WHEN sheet presents THEN LSBottomSheet(detent:.medium) used and sheet sits at ~0.45 peek with map + overlay visible", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN templates.route-details.s05-dismissing story with drag past medium detent WHEN dismiss threshold passed THEN copper top-edge stripe gradient flash renders (linear-gradient transparent→signal.default→transparent at strokeWidth.lg height opacity 0.85)", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN templates.route-details.v01-saved story with isSaved=true WHEN screen draws THEN LSToast slides in (glass + copper stripe), Save button renders saved variant (signal.tint border + signal.whisper bg + signal.default text), and LSSavedPill appears beside LSBestBadge", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN templates.route-details.s02-mixed-weather story WHEN story builder constructs screen THEN RouteDetailsScreen(provider:variant:) called with .mixedWeather (not bare provider arg)", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "TC-1", "type": "test_criterion", "description": "Tapping alt1 card in S02 fires onRouteCardTap with alt1 id, updates selectedRouteId, and re-tints card border + promotes polyline", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/RouteResultsDetailsVariantTests/testS02AltSelectionRepromote" },
    { "id": "TC-2", "type": "test_criterion", "description": "S04 refining renders surface.scrim-soft overlay, polyline opacity 0.4, hidden callout, 3 primer chips, copper send button", "maps_to_ac": "AC-2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/RouteResultsDetailsVariantTests/testS04RefiningState" },
    { "id": "TC-3", "type": "test_criterion", "description": "V03 renders Recall glass pill at message position; tap toggles callout isVisible to true", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/RouteResultsDetailsVariantTests/testV03RecallChip" },
    { "id": "TC-4", "type": "test_criterion", "description": "S03 dark story story-id is templates.route-details.s03-dark and renders with colorScheme=.dark", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/RouteResultsDetailsVariantTests/testRouteDetailsS03Dark" },
    { "id": "TC-5", "type": "test_criterion", "description": "S04 medium-detent story uses LSBottomSheet(detent:.medium)", "maps_to_ac": "AC-5", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/RouteResultsDetailsVariantTests/testRouteDetailsS04MediumDetent" },
    { "id": "TC-6", "type": "test_criterion", "description": "S05 dismissing renders copper-stripe gradient overlay at top of sheet at strokeWidth.lg height opacity 0.85", "maps_to_ac": "AC-6", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/RouteResultsDetailsVariantTests/testRouteDetailsS05Dismissing" },
    { "id": "TC-7", "type": "test_criterion", "description": "V01 saved-state shows LSToast, Save button saved variant tokens, and LSSavedPill beside LSBestBadge", "maps_to_ac": "AC-7", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/RouteResultsDetailsVariantTests/testRouteDetailsV01Saved" },
    { "id": "TC-8", "type": "test_criterion", "description": "Mixed-weather story builder calls RouteDetailsScreen with variant:.mixedWeather argument", "maps_to_ac": "AC-8", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/RouteResultsDetailsVariantTests/testRouteDetailsMixedWeatherStoryFix" }
  ]
}
-->
