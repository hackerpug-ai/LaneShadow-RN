<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: UC-ORG-04-android — LSRouteSheet organism — Android Compose
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   180 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-04)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteSheetTest'
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 0/6 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSRouteSheet renders inside LSBottomSheet with drag handle (36dp wide, color.border.strong) + LSBestBadge (when route.isBest) + opinion-serif title + muted subtitle + 4-column LSInstrumentReadout + LSWeatherTimeline + sticky action row (LSButton outline Save flex 1, LSButton primary Ride this flex 2); onSave/onRide/onDismiss each fire exactly once; default detent .Large; 5 stories registered.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST present via LSBottomSheet (UC-MOL-03) with default detent SheetDetent.Large; never re-implement sheet drag/dismiss.
- MUST use LSInstrumentReadout (UC-MOL-07) with metrics dist/time/climb/scenic — no inline 4-column grid.
- MUST use LSWeatherTimeline (UC-MOL-07) for weather entries — no inline LazyRow of weather cells.
- MUST use LSBestBadge (atom) only when route.isBest == true.
- MUST use LSButton(outline) for Save and LSButton(primary) for Ride this; sticky bottom action row via Modifier.align(Alignment.BottomCenter) inside sheet content.
- NEVER inline Color(0x...), TextStyle(, FontFamily(, tween( literals.
- NEVER reach to network/Convex; data is prop-driven (RouteDetails, WeatherTimelineEntry).
- NEVER reproduce the instrument readout or weather timeline inline — always delegate to molecules.
- STRICTLY detekt 0; compileDebugKotlin BUILD SUCCESSFUL; grep gate 0 matches in LSRouteSheet.kt.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: Sheet renders drag handle + best badge + opinion title + subtitle + LSInstrumentReadout + LSWeatherTimeline + sticky action row (PRIMARY)
- [ ] AC-2: Save tap fires onSave once; Ride this tap fires onRide once
- [ ] AC-3: Drag-down dismiss fires onDismiss exactly once via LSBottomSheet delegation
- [ ] AC-4: Composes only from MOL+ATM tiers — no inline reimplementation of readout/timeline
- [ ] AC-5: Default detent SheetDetent.Large applied via LSBottomSheet
- [ ] AC-6: 5 sandbox stories registered (Best Route, Alt Route no Best, Long Title+Via, Mixed Weather Timeline, Dark Mode)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Best route renders full composition [PRIMARY]
  GIVEN: Developer presents LSRouteSheet(route=bestRouteDetails, weatherTimeline=sixHourTimeline, onSave={}, onRide={}, onDismiss={})
  WHEN:  Composable enters composition
  THEN:  Drag handle Row 36dp wide bg=colors.border.strong; LSBestBadge present (route.isBest); title LSText("The Skyline Spine", typography.opinion.lg); subtitle LSText(typography.ui.body.md, color.content.textMuted); LSInstrumentReadout test tag present with 4 metrics; LSWeatherTimeline test tag present; bottom action Row contains LSButton(outline,Save) + LSButton(primary,Ride this)
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteSheetTest.best_route_renders_full_composition' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSRouteSheetTest.kt
  TEST_FUNCTION: best_route_renders_full_composition

AC-2: Save and Ride taps fire once each
  GIVEN: LSRouteSheet with onSave and onRide mocks
  WHEN:  Test taps Save then Ride this
  THEN:  onSave invocation count == 1 after first tap; onRide invocation count == 1 after second tap; counts do not cross-fire
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteSheetTest.action_taps_fire_callbacks_exactly_once' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSRouteSheetTest.kt
  TEST_FUNCTION: action_taps_fire_callbacks_exactly_once

AC-3: Drag-down dismiss via LSBottomSheet
  GIVEN: LSRouteSheet presented inside LSBottomSheet test harness with onDismiss mock
  WHEN:  Test triggers drag-down dismiss via LSBottomSheet semantics action
  THEN:  onDismiss invocation count == 1; LSBottomSheet handles drag — LSRouteSheet contains no Modifier.draggable in source
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteSheetTest.drag_down_fires_on_dismiss_via_lsbottomsheet' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSRouteSheetTest.kt
  TEST_FUNCTION: drag_down_fires_on_dismiss_via_lsbottomsheet

AC-4: Molecule delegation gate
  GIVEN: LSRouteSheet.kt source
  WHEN:  Static analysis runs
  THEN:  Tree contains test tags LSInstrumentReadout, LSWeatherTimeline, LSBottomSheet; LSRouteSheet.kt contains zero references to LSDivider() inline metric grid or LazyRow weather cells (delegation, not reimplementation)
  VERIFY: grep -n 'LazyRow\|LSDivider' android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (grep gate)

AC-5: Default detent is Large
  GIVEN: LSRouteSheet without explicit detent prop
  WHEN:  Composable enters composition
  THEN:  LSBottomSheet rendered with detent argument SheetDetent.Large (asserted via test hook param tag)
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteSheetTest.default_detent_is_large' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSRouteSheetTest.kt
  TEST_FUNCTION: default_detent_is_large

AC-6: 5 sandbox stories registered
  GIVEN: Developer opens debug sandbox app
  WHEN:  Navigating to Organisms / RouteSheet
  THEN:  Stories Best Route, Alt Route (no Best badge), Long Title + Via, Mixed Weather Timeline, Dark Mode present with dotted ids organisms.routesheet.* and tier=ComponentTier.Organism
  VERIFY: grep -c 'organisms.routesheet' android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSRouteSheetStory.kt | awk '$1 >= 5'
  TDD_STATE: none
  TEST_FILE: android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSRouteSheetStory.kt
  TEST_FUNCTION: (grep gate)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | Drag handle, best badge, opinion title, instrument readout, weather timeline, action row all rendered in sheet | AC-1 |
| TC-2 | Save and Ride tap each fire exactly once | AC-2 |
| TC-3 | Drag-down dismiss handled by LSBottomSheet (not LSRouteSheet) | AC-3 |
| TC-4 | LSRouteSheet.kt contains zero LazyRow or raw LSDivider() — molecule delegation only | AC-4 |
| TC-5 | Default detent passed to LSBottomSheet equals SheetDetent.Large | AC-5 |
| TC-6 | 5 sandbox stories registered with ComponentTier.Organism | AC-6 |
| TC-7 | No hardcoded color/typography/font in LSRouteSheet.kt | AC-1 |
| TC-8 | When route.isBest == false, LSBestBadge is absent from tree | AC-1 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/organisms/LSRouteSheetTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSRouteSheetStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt (MODIFY)

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/atoms/**
- android/app/src/main/java/com/laneshadow/ui/molecules/**
- tokens/**
- ios/**

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-org-04-route-sheet.html [REQUIRED READING]
2. .spec/prds/v2/07-uc-org.md (UC-ORG-04, lines 148-181)
3. android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt
4. android/app/src/main/java/com/laneshadow/ui/molecules/LSInstrumentReadout.kt
5. android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherTimeline.kt
6. android/app/src/main/java/com/laneshadow/ui/atoms/LSBestBadge.kt
7. android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt
8. android/app/src/main/java/com/laneshadow/theme/LaneShadowTheme.kt

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/prds/v2/concepts/uc-org-04-route-sheet.html, .spec/prds/v2/07-uc-org.md (UC-ORG-04)

Interaction notes:
- REQUIRED READING: .spec/prds/v2/concepts/uc-org-04-route-sheet.html — extract sheet header layout, instrument readout placement, sticky action row
- Sticky action row uses Modifier.align(Alignment.BottomCenter).padding(spacing.4) inside the sheet's vertical Column; Save flex 1 + Ride this flex 2 via Modifier.weight
- Drag handle is a centered Box(width=36.dp,height=4.dp,bg=colors.border.strong)

Pattern: Bottom-sheet content delegating instrument + weather to molecules with sticky action row
Pattern source: .spec/prds/v2/concepts/uc-org-04-route-sheet.html
Anti-pattern: Reimplementing the 4-column readout or weather LazyRow inline.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

1. detekt 0
2. compileDebugKotlin BUILD SUCCESSFUL
3. testDebugUnitTest LSRouteSheetTest green
4. grep gate Color(0x/TextStyle(/FontFamily( == 0
5. grep gate LazyRow/LSDivider inline == 0
6. story grep ≥ 5

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-MOL-03-android (LSBottomSheet, shipped), UC-MOL-07-android (LSInstrumentReadout + LSWeatherTimeline, shipped), UC-ATM-* (LSBestBadge, LSButton)
Blocks:     Sprint 6 RouteDetails screen
Parallel:   UC-ORG-04-ios, UC-ORG-02-android, UC-ORG-03-android, UC-ORG-05-android, UC-ORG-06-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Best route full composition renders drag handle + badge + title + instrument + weather + action row", "verify": "gradle test --tests LSRouteSheetTest.best_route_renders_full_composition" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Save/Ride taps fire exactly once each", "verify": "gradle test --tests LSRouteSheetTest.action_taps_fire_callbacks_exactly_once" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Drag-down dismiss via LSBottomSheet fires onDismiss once", "verify": "gradle test --tests LSRouteSheetTest.drag_down_fires_on_dismiss_via_lsbottomsheet" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "No inline LazyRow / LSDivider in LSRouteSheet.kt (molecule delegation)", "verify": "grep -n 'LazyRow\\|LSDivider' android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt | wc -l | xargs test 0 -eq" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "Default detent is SheetDetent.Large", "verify": "gradle test --tests LSRouteSheetTest.default_detent_is_large" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "5 sandbox stories registered", "verify": "grep -c 'organisms.routesheet' LSRouteSheetStory.kt | awk '$1 >= 5'" },
    { "id": "TC-1", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "Full composition rendered in sheet", "verify": "compose test" },
    { "id": "TC-2", "type": "test_criterion", "maps_to_ac": "AC-2", "description": "Save/Ride fire exactly once", "verify": "compose test" },
    { "id": "TC-3", "type": "test_criterion", "maps_to_ac": "AC-3", "description": "Drag handled by LSBottomSheet", "verify": "grep+compose" },
    { "id": "TC-4", "type": "test_criterion", "maps_to_ac": "AC-4", "description": "No LazyRow/LSDivider in LSRouteSheet.kt", "verify": "grep gate" },
    { "id": "TC-5", "type": "test_criterion", "maps_to_ac": "AC-5", "description": "detent Large by default", "verify": "compose test" },
    { "id": "TC-6", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "5 stories registered", "verify": "grep gate" },
    { "id": "TC-7", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "No hardcoded styling tokens in LSRouteSheet.kt", "verify": "grep -rn 'Color(0x\\|TextStyle(\\|FontFamily(' android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt | wc -l | xargs test 0 -eq" },
    { "id": "TC-8", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "Best badge absent when route.isBest=false", "verify": "compose test" }
  ]
}
-->
