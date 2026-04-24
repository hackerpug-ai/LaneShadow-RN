<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-08-android — LocationContextBar + RouteAttachmentCard molecules — Android
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     S
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   120 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-08)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: AC-1 none · 0/8 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSLocationContextBar (two LSTagPill row with space-between layout, onModeChange callback fires once) and LSRouteAttachmentCard (variant stripe, optional LSBestBadge, scenic dot meter, optional LSWeatherBadge, compact mode, onTap fires once) both render in the Android sandbox with token-driven composition and all PRD-specified story variants registered (9+).

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST compose LSLocationContextBar from two LSTagPill atoms (UC-MOL-05) — leading location pill, trailing mode pill; Row with Arrangement.SpaceBetween.
- MUST implement 3px leading stripe in LSRouteAttachmentCard as Box of width 3.dp backed by theme.colors.route.<variant> (best, alt1, alt2).
- MUST use LSBestBadge atom for optional best badge — only when route.isBest && !compact.
- MUST use LSWeatherBadge (UC-MOL-05) for optional weather badge — only when !compact.
- MUST implement scenic dot meter as 5 Box circles (filled/hollow) with color.signal.default / color.border.strong.
- MUST register stories for all PRD variants of both molecules.
- NEVER inline raw pill shapes for mode pill — use LSTagPill from UC-MOL-05.
- NEVER use literal 3.dp leading stripe without named constant.
- NEVER hardcode route variant stripe colors as hex.
- NEVER render LSBestBadge or LSWeatherBadge in compact mode.
- STRICTLY: onModeChange fires exactly once per mode pill tap; onTap fires exactly once per card tap; selected=true changes border to color.signal.default; detekt 0; compileDebugKotlin BUILD SUCCESSFUL.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSLocationContextBar renders two LSTagPill atoms space-between (PRIMARY)
- [ ] AC-2: onModeChange fires exactly once on mode pill tap
- [ ] AC-3: LSRouteAttachmentCard full best+selected renders all slots
- [ ] AC-4: Compact mode suppresses LSBestBadge and LSWeatherBadge
- [ ] AC-5: Best/alt1/alt2 stripe colors resolve correctly
- [ ] AC-6: onTap fires exactly once
- [ ] AC-7: 9+ stories registered for both molecules
- [ ] AC-8: Atom-composition gate (zero Color(0xFF in either file)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSLocationContextBar renders two LSTagPill atoms space-between [PRIMARY]
  GIVEN: developer composes LSLocationContextBar(location="Near Santa Cruz, CA", mode=LocationMode.Manual, onModeChange={})
  WHEN:  Composable enters composition
  THEN:  horizontal Row with Arrangement.SpaceBetween; leading LSTagPill with LSIcon(.pin, color=.signal) + location label LSText(typography.ui.label.sm) + color.content.textMuted; trailing LSTagPill with mode text "MANUAL"; horizontal padding spacing.2; LSPillCornerRadiusKey present in both pills' semantics
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSLocationContextBarTest.renders_two_tag_pills_with_space_between' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSLocationContextBarTest.kt
  TEST_FUNCTION: renders_two_tag_pills_with_space_between

AC-2: onModeChange fires exactly once
  GIVEN: LSLocationContextBar with onModeChange={counter++}
  WHEN:  developer taps mode (trailing) pill via Compose UI test
  THEN:  counter=1; tapping location (leading) pill does not increment
  VERIFY: cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSLocationContextBarUiTest.mode_pill_tap_fires_on_mode_change_once' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSLocationContextBarUiTest.kt
  TEST_FUNCTION: mode_pill_tap_fires_on_mode_change_once

AC-3: LSRouteAttachmentCard full best+selected renders all slots
  GIVEN: developer composes LSRouteAttachmentCard(route=bestRouteMock, selected=true, compact=false)
  WHEN:  Composable enters composition
  THEN:  3px leading stripe = color.route.best; border = color.signal.default (selected=true); LSBestBadge top; title LSText(typography.ui.title.md); via subtitle LSText(typography.ui.body.sm, color.content.textMuted); LSWeatherBadge right-aligned; metrics row with distance + duration in typography.instrument.sm + 5 scenic dots; container = color.surface.card + radius.md
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardTest.full_best_selected_variant_renders_all_slots' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSRouteAttachmentCardTest.kt
  TEST_FUNCTION: full_best_selected_variant_renders_all_slots

AC-4: Compact mode suppresses badges
  GIVEN: LSRouteAttachmentCard(route=bestRouteMock, compact=true)
  WHEN:  Composable enters composition
  THEN:  LSBestBadge absent; LSWeatherBadge absent; padding tighter (10dp vertical, 12dp horizontal); title and via subtitle still present
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardTest.compact_mode_suppresses_best_badge_and_weather_badge' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSRouteAttachmentCardTest.kt
  TEST_FUNCTION: compact_mode_suppresses_best_badge_and_weather_badge

AC-5: Route variant stripe resolves correct color
  GIVEN: LSRouteAttachmentCard rendered with each of RouteVariant.Best, Alt1, Alt2
  WHEN:  semantics tree inspected for leading stripe bg color
  THEN:  Best = color.route.best; Alt1 = color.route.alt1; Alt2 = color.route.alt2; all 3 distinct from LaneShadowTheme; no literal Color(0xFF…) in source
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardTest.route_variant_stripe_resolves_correct_color' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSRouteAttachmentCardTest.kt
  TEST_FUNCTION: route_variant_stripe_resolves_correct_color

AC-6: onTap fires exactly once
  GIVEN: LSRouteAttachmentCard with onTap={counter++}
  WHEN:  developer taps card via Compose UI test
  THEN:  counter=1; second tap → 2 (not 0 or 3)
  VERIFY: cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardUiTest.on_tap_fires_exactly_once' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSRouteAttachmentCardUiTest.kt
  TEST_FUNCTION: on_tap_fires_exactly_once

AC-7: Stories registered for both molecules
  GIVEN: developer opens sandbox
  WHEN:  navigating to Molecules / LocationContextBar and Molecules / RouteAttachmentCard
  THEN:  LocationContextBar (Default auto, Manual Mode, Long Location Label); RouteAttachmentCard (Best Selected, Best Compact, Alt1, Alt2, With Favorite Flag, Long Title overflow)
  VERIFY: grep -c 'molecules.locationcontextbar\|molecules.routeattachment' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSLocationContextBarStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSRouteAttachmentCardStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 9'
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-8: Atom-composition gate
  GIVEN: LSLocationContextBar.kt and LSRouteAttachmentCard.kt examined by grep
  WHEN:  files scanned for literal color values
  THEN:  zero Color(0xFF; stripe color resolved through theme.colors.route.<variant> at runtime
  VERIFY: grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSLocationContextBar.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSRouteAttachmentCard.kt | wc -l | grep -x '0'
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | LSLocationContextBarTest.renders_two_tag_pills_with_space_between passes | AC-1 |
| TC-2 | LSLocationContextBarUiTest.mode_pill_tap_fires_on_mode_change_once passes (connected) | AC-2 |
| TC-3 | LSRouteAttachmentCardTest.full_best_selected_variant_renders_all_slots passes | AC-3 |
| TC-4 | LSRouteAttachmentCardTest.compact_mode_suppresses_best_badge_and_weather_badge passes | AC-4 |
| TC-5 | LSRouteAttachmentCardTest.route_variant_stripe_resolves_correct_color passes | AC-5 |
| TC-6 | LSRouteAttachmentCardUiTest.on_tap_fires_exactly_once passes (connected) | AC-6 |
| TC-7 | Zero Color(0xFF in both molecule files | AC-8 |
| TC-8 | 9+ story IDs across both story files | AC-7 |
| TC-9 | detekt + compileDebugKotlin succeed | AC-1 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/molecules/LSLocationContextBar.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSRouteAttachmentCard.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/RouteAttachmentTypes.kt (NEW — RouteAttachment, RouteVariant, LocationMode)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSLocationContextBarTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSRouteAttachmentCardTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSLocationContextBarUiTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSRouteAttachmentCardUiTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSLocationContextBarStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSRouteAttachmentCardStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt (MODIFY)

writeProhibited:
- android/app/build.gradle.kts — no new deps without justification
- android/app/src/main/java/com/laneshadow/ui/atoms/** — atoms owned by Sprint 02/03
- android/app/src/main/java/com/laneshadow/ui/molecules/LSTagPill.kt — owned by UC-MOL-05-android
- android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt — owned by UC-MOL-05-android
- tokens/** — tokens owned by Sprint 01/03
- ios/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/molecules/location-context-bar/ [REQUIRED READING]
2. .spec/design/system/molecules/route-attachment-card/ [REQUIRED READING]
3. .spec/prds/v2/06-uc-mol.md (lines 175-201) — UC-MOL-08 full component definitions
4. android/app/src/main/java/com/laneshadow/ui/molecules/LSTagPill.kt — UC-MOL-05 — compose two
5. android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt — UC-MOL-05
6. android/app/src/main/java/com/laneshadow/ui/atoms/LSBestBadge.kt — top-of-card badge
7. android/app/src/main/java/com/laneshadow/ui/atoms/LSCard.kt — base surface for RouteAttachmentCard

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/location-context-bar/, .spec/design/system/molecules/route-attachment-card/

Interaction notes:
- REQUIRED READING: both directories before implementing
- LSRouteAttachmentCard leading stripe: Box(modifier=Modifier.width(RouteStripeWidth).fillMaxHeight().background(stripeColor)) at start of Row; RouteStripeWidth = 3.dp as named constant with spec citation comment
- Scenic dot meter: 5 Box composables in Row — filled use Modifier.background(theme.colors.signal.default, CircleShape); hollow use Modifier.border(1.dp, theme.colors.border.strong, CircleShape); ScenicDotSize = 6.dp named constant

Pattern: LSLocationContextBar mirrors LSListRow's Row-of-two-atoms; LSRouteAttachmentCard wraps LSCard with leading stripe Box + content Column
Pattern source: android/app/src/main/java/com/laneshadow/ui/atoms/LSCard.kt
Anti-pattern: Do not build location/mode pills from raw Row + clip(RoundedCornerShape) — compose LSTagPill; do not hardcode stripe width as raw 3.dp literal.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No literal colors): grep 'Color(0xFF' both files = 0
Gate 2 (detekt): cd android && ./gradlew detekt exit 0
Gate 3 (compile): cd android && ./gradlew :app:compileDebugKotlin BUILD SUCCESSFUL
Gate 4 (tests): cd android && ./gradlew test BUILD SUCCESSFUL

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-android, UC-MOL-05-android (LSTagPill, LSWeatherBadge)
Blocks:     UC-MOL-06-android, UC-ORG-04-android, UC-ORG-05-android
Parallel:   UC-MOL-08-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "LSLocationContextBar — Row(SpaceBetween) of two LSTagPill; leading has LSIcon(.pin, signal) + location label; trailing has mode text; horizontal padding spacing.2", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSLocationContextBarTest.renders_two_tag_pills_with_space_between' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Mode pill tap fires onModeChange once; location pill tap does not fire onModeChange", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSLocationContextBarUiTest.mode_pill_tap_fires_on_mode_change_once' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Full best+selected — 3px stripe color.route.best + signal border + LSBestBadge + title/via text + LSWeatherBadge + scenic dots + mono metrics", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardTest.full_best_selected_variant_renders_all_slots' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "compact=true suppresses LSBestBadge and LSWeatherBadge; tighter padding", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardTest.compact_mode_suppresses_best_badge_and_weather_badge' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "Best/alt1/alt2 variants resolve distinct leading stripe colors from theme.colors.route.*", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardTest.route_variant_stripe_resolves_correct_color' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "onTap fires exactly once per card tap", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardUiTest.on_tap_fires_exactly_once' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "9+ stories for LocationContextBar (3) and RouteAttachmentCard (6) in sandbox", "verify": "grep -c 'molecules.locationcontextbar\\|molecules.routeattachment' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSLocationContextBarStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSRouteAttachmentCardStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 9'" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "Zero Color(0xFF in both molecule files; stripe color resolves from theme at runtime", "verify": "grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSLocationContextBar.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSRouteAttachmentCard.kt | wc -l | grep -x '0'" },
    { "id": "TC-1", "type": "test_criterion", "description": "renders_two_tag_pills_with_space_between passes", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSLocationContextBarTest.renders_two_tag_pills_with_space_between' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-2", "type": "test_criterion", "description": "mode_pill_tap_fires_on_mode_change_once passes (connected)", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSLocationContextBarUiTest.mode_pill_tap_fires_on_mode_change_once' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-3", "type": "test_criterion", "description": "full_best_selected_variant_renders_all_slots passes", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardTest.full_best_selected_variant_renders_all_slots' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-4", "type": "test_criterion", "description": "compact_mode_suppresses_best_badge_and_weather_badge passes", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardTest.compact_mode_suppresses_best_badge_and_weather_badge' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-5", "type": "test_criterion", "description": "route_variant_stripe_resolves_correct_color passes", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardTest.route_variant_stripe_resolves_correct_color' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-6", "type": "test_criterion", "description": "on_tap_fires_exactly_once passes (connected)", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSRouteAttachmentCardUiTest.on_tap_fires_exactly_once' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-7", "type": "test_criterion", "description": "Zero Color(0xFF in both molecule files", "maps_to_ac": "AC-8", "verify": "grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSLocationContextBar.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSRouteAttachmentCard.kt | wc -l | grep -x '0'" },
    { "id": "TC-8", "type": "test_criterion", "description": "9+ story IDs across both story files", "maps_to_ac": "AC-7", "verify": "grep -c 'molecules.locationcontextbar\\|molecules.routeattachment' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSLocationContextBarStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSRouteAttachmentCardStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 9'" },
    { "id": "TC-9", "type": "test_criterion", "description": "detekt + compileDebugKotlin succeed", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew detekt :app:compileDebugKotlin 2>&1 | grep 'BUILD SUCCESSFUL'" }
  ]
}
-->
