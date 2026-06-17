<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: UC-ORG-06-android — LSRouteCard domain organism (consumes multi-polyline LSMap) — Android Compose
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   180 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-06)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteCardTest'
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 0/6 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSRouteCard renders LSCard wrapper containing LSMap(MapMode.Preview) auto-framed via CameraFit.Polyline(padding=spacing.3) with start/end annotations and polyline tinted by route.variant (best/alt1/alt2 → colors.route.*), title row typography.ui.title.md, subtitle row typography.instrument.sm with distance + estimated time, difficulty LSChip/LSTagPill row, optional saved-state LSIcon(HeartFill) accent; data is prop-only with type aligned to convex/schema.ts routes table; 6 sandbox stories registered.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST wrap content in LSCard (atom) — never raw Surface/Card.
- MUST consume LSMap via MapMode.Preview with PolylineData(coordinates=route.polyline, variant=route.variant) and CameraFit.Polyline(padding=Spacing.spacing3).
- MUST resolve polyline stroke color from LaneShadowTheme.colors.route.{best,alt1,alt2} keyed by RouteVariant — never inline hex.
- MUST use LSChip / LSTagPill for difficulty tag (composition-only).
- MUST register 6 stories: Default, Saved, Alt Variant, Long Title (overflow), Missing Optional Data, Dark Mode.
- NEVER inline Color(0x...), TextStyle(, FontFamily(.
- NEVER reach to Convex/networking/disk — organism is data-agnostic and prop-only.
- NEVER reuse LSRouteAttachmentCard (compact molecule) — LSRouteCard is the full card.
- STRICTLY detekt 0; compileDebugKotlin BUILD SUCCESSFUL; grep gate 0; type-level test asserts Route prop shape mirrors convex/schema.ts routes table fields.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSCard with LSMap preview (auto-framed polyline), title, subtitle, difficulty tag, optional saved-state icon (PRIMARY)
- [ ] AC-2: route.variant=alt1 resolves polyline stroke to colors.route.alt1
- [ ] AC-3: 6 sandbox stories registered with dotted ids
- [ ] AC-4: Type-level test confirms Route prop type mirrors convex schema routes type
- [ ] AC-5: No Convex/networking/disk reachout (asserted by source-file grep)
- [ ] AC-6: Saved state shows LSIcon(HeartFill) accent; absent otherwise

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Default best-variant card with map preview [PRIMARY]
  GIVEN: Developer composes LSRouteCard(route=mockRoute1)
  WHEN:  Composable enters composition
  THEN:  LSCard wrapper present (test tag); LSMap test tag with mode=Preview, polylines list size 1, cameraFit type Polyline padding=Spacing.spacing3, start+end annotations present; title LSText(typography.ui.title.md); subtitle LSText(typography.instrument.sm) showing distance + time; difficulty LSChip/LSTagPill present
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteCardTest.default_renders_card_with_map_preview_title_subtitle_and_chip' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSRouteCardTest.kt
  TEST_FUNCTION: default_renders_card_with_map_preview_title_subtitle_and_chip

AC-2: Alt1 variant resolves polyline to colors.route.alt1
  GIVEN: LSRouteCard(route=mockRoute1.copy(variant=RouteVariant.Alt1))
  WHEN:  Composable enters composition
  THEN:  PolylineData.color resolves to LaneShadowTheme.colors.route.alt1; pixel sample of LSMap polyline matches token; no inline hex in source
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteCardTest.alt1_variant_resolves_to_route_alt1_token' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSRouteCardTest.kt
  TEST_FUNCTION: alt1_variant_resolves_to_route_alt1_token

AC-3: 6 sandbox stories registered
  GIVEN: Developer opens debug sandbox app
  WHEN:  Navigating to Organisms / RouteCard
  THEN:  Stories Default, Saved, Alt Variant, Long Title (overflow), Missing Optional Data, Dark Mode present with dotted ids organisms.routecard.* and tier=ComponentTier.Organism
  VERIFY: grep -c 'organisms.routecard' android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSRouteCardStory.kt | awk '$1 >= 6'
  TDD_STATE: none
  TEST_FILE: android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSRouteCardStory.kt
  TEST_FUNCTION: (grep gate)

AC-4: Route prop type mirrors convex schema
  GIVEN: RouteCardRoute data class used as prop
  WHEN:  Type-level test compiles
  THEN:  RouteCardRoute fields { id, title, distance, estimatedTime, polyline, variant, difficulty, isSaved? } align with convex/schema.ts routes table fields; mismatch fails compile
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteCardTest.route_prop_type_mirrors_convex_schema' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSRouteCardTest.kt
  TEST_FUNCTION: route_prop_type_mirrors_convex_schema

AC-5: No data-layer imports
  GIVEN: LSRouteCard.kt source
  WHEN:  grep gate runs
  THEN:  No imports from convex.*, retrofit.*, okhttp.*, java.io.*, kotlinx.coroutines.flow (for fetching); only ui/atoms, ui/molecules, theme imports
  VERIFY: grep -rn 'import com.laneshadow.network\|import.*convex\|import retrofit\|import okhttp\|import java.io' android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteCard.kt | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (grep gate)

AC-6: Saved state shows HeartFill icon
  GIVEN: LSRouteCard(route=mockRoute1.copy(isSaved=true))
  WHEN:  Composable enters composition
  THEN:  LSIcon(LSIconName.HeartFill) test tag present; tinted colors.signal.default or colors.content.text.primary per design; same composition without isSaved=true does not contain the heart icon
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteCardTest.saved_state_shows_heart_fill_icon' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSRouteCardTest.kt
  TEST_FUNCTION: saved_state_shows_heart_fill_icon

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | LSCard wraps LSMap preview + title + subtitle + chip | AC-1 |
| TC-2 | PolylineData color matches colors.route.alt1 for Alt1 variant | AC-2 |
| TC-3 | 6 sandbox stories registered | AC-3 |
| TC-4 | RouteCardRoute prop fields align with convex schema routes table | AC-4 |
| TC-5 | No network/Convex/disk imports in LSRouteCard.kt | AC-5 |
| TC-6 | Saved state shows HeartFill; non-saved omits | AC-6 |
| TC-7 | No hardcoded color/typography/font in LSRouteCard.kt | AC-1 |
| TC-8 | CameraFit.Polyline padding equals Spacing.spacing3 | AC-1 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteCard.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/organisms/RouteCardTypes.kt (NEW — RouteCardRoute, RouteVariant data classes)
- android/app/src/test/java/com/laneshadow/ui/organisms/LSRouteCardTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSRouteCardStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt (MODIFY)

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/atoms/**
- android/app/src/main/java/com/laneshadow/ui/molecules/**
- tokens/**
- server/**
- ios/**

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-org-06-route-card.html [REQUIRED READING]
2. .spec/prds/v2/07-uc-org.md (UC-ORG-06, lines 227-243)
3. convex/schema.ts (routes table)
4. android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt (UC-ATM-12 multi-polyline contract)
5. android/app/src/main/java/com/laneshadow/ui/atoms/LSCard.kt
6. android/app/src/main/java/com/laneshadow/ui/atoms/LSChip.kt
7. android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt
8. android/app/src/main/java/com/laneshadow/theme/LaneShadowTheme.kt

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/prds/v2/concepts/uc-org-06-route-card.html, .spec/prds/v2/07-uc-org.md (UC-ORG-06)

Interaction notes:
- REQUIRED READING: .spec/prds/v2/concepts/uc-org-06-route-card.html — extract card layout, embedded map preview sizing, difficulty chip + saved accent
- Polyline variant color routes through colors.route map: best→colors.route.best, alt1→colors.route.alt1, alt2→colors.route.alt2
- Stories include Missing Optional Data variant where saved + difficulty are absent — composable must handle null gracefully without throwing

Pattern: LSCard + embedded LSMap preview + token-driven polyline variant; saved-state accent atom-only
Pattern source: .spec/prds/v2/concepts/uc-org-06-route-card.html
Anti-pattern: Reaching out to Convex inside the card or hardcoding polyline hex per variant.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

1. detekt 0
2. compileDebugKotlin BUILD SUCCESSFUL
3. testDebugUnitTest LSRouteCardTest green
4. grep gate Color(0x/TextStyle(/FontFamily( == 0
5. grep gate convex/network/io imports == 0
6. story grep ≥ 6

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-ATM-12-android (LSMap multi-polyline contract, shipped), UC-ATM-* (LSCard, LSChip, LSIcon)
Blocks:     Sprint 6 RouteResults / catalog screens
Parallel:   UC-ORG-06-ios, UC-ORG-02-android, UC-ORG-03-android, UC-ORG-04-android, UC-ORG-05-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Card with map preview + title + subtitle + chip", "verify": "gradle test --tests LSRouteCardTest.default_renders_card_with_map_preview_title_subtitle_and_chip" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Alt1 variant polyline colors.route.alt1", "verify": "gradle test --tests LSRouteCardTest.alt1_variant_resolves_to_route_alt1_token" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "6 sandbox stories registered", "verify": "grep -c 'organisms.routecard' LSRouteCardStory.kt | awk '$1 >= 6'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Route prop mirrors convex schema", "verify": "gradle test --tests LSRouteCardTest.route_prop_type_mirrors_convex_schema" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "No convex/network/io imports", "verify": "grep -rn 'import com.laneshadow.network\\|import.*convex\\|import retrofit\\|import okhttp\\|import java.io' android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteCard.kt | wc -l | xargs test 0 -eq" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "Saved state shows HeartFill icon", "verify": "gradle test --tests LSRouteCardTest.saved_state_shows_heart_fill_icon" },
    { "id": "TC-1", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "Card composition correct", "verify": "compose test" },
    { "id": "TC-2", "type": "test_criterion", "maps_to_ac": "AC-2", "description": "Alt1 polyline color from token", "verify": "compose test" },
    { "id": "TC-3", "type": "test_criterion", "maps_to_ac": "AC-3", "description": "6 stories registered", "verify": "grep gate" },
    { "id": "TC-4", "type": "test_criterion", "maps_to_ac": "AC-4", "description": "Prop type mirrors convex schema", "verify": "type test" },
    { "id": "TC-5", "type": "test_criterion", "maps_to_ac": "AC-5", "description": "No convex/network imports", "verify": "grep gate" },
    { "id": "TC-6", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "Saved state heart icon presence", "verify": "compose test" },
    { "id": "TC-7", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "No hardcoded styling tokens", "verify": "grep -rn 'Color(0x\\|TextStyle(\\|FontFamily(' android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteCard.kt | wc -l | xargs test 0 -eq" },
    { "id": "TC-8", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "cameraFit padding spacing.3", "verify": "compose test" }
  ]
}
-->
