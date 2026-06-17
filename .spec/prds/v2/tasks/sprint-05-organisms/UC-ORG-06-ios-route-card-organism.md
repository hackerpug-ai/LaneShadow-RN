<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: UC-ORG-06-ios — LSRouteCard domain organism (consumes multi-polyline LSMap) — iOS SwiftUI
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   180 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-06)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: 0/7 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSRouteCard renders a full LSCard wrapper with an LSMap(mode: .preview, polylines: [PolylineData(coordinates: route.polyline, variant: route.variant)], cameraFit: .polyline(padding: .spacing3)) preview; title row in typography.ui.title.md; subtitle row with distance + estimated time in typography.instrument.sm; difficulty LSChip/LSTagPill row; optional 'saved' accent via LSIcon(.heartFill). Variant polyline strokes resolve through color.route.{best,alt1,alt2}. Organism is strictly data-agnostic — no Convex/networking/disk I/O (asserted by test).

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST wrap the card in LSCard atom — no raw RoundedRectangle backgrounds.
- MUST use LSMap(mode: .preview, polylines:, cameraFit: .polyline(padding: .spacing3)) from UC-ATM-12 for the preview — no custom map view.
- MUST resolve polyline stroke by variant through color.route.best / color.route.alt1 / color.route.alt2 tokens.
- MUST render title through LSText(typography.ui.title.md) and subtitle (distance + time) through LSText(typography.instrument.sm).
- MUST render difficulty row through LSPill / LSTagPill atom — no raw Capsule.
- MUST render saved accent via LSIcon(.heartFill) resolved through color.signal.default or route.saved token.
- MUST assert no Convex / networking / file I/O imports in source.
- MUST register stories Default, Saved, Alt Variant, Long Title (overflow), Missing Optional Data, Dark Mode.
- NEVER hand-edit ios/LaneShadow.xcodeproj/project.pbxproj.
- NEVER use Font.system, Color(hex:), Color(red:), or .monospaced() in LSRouteCard.swift.
- NEVER import ConvexMobile, URLSession, FileManager, or other data-layer SDKs in the organism.
- NEVER fetch from a repository or observe a ViewModel — prop-only.
- NEVER re-implement map polyline rendering — delegate to LSMap atom.
- STRICTLY: swiftformat --lint exits 0; xcodebuild test TEST SUCCEEDED for LSRouteCardTests including the no-data-layer import assertion; light + dark render correctly.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: Default best-variant route card renders full composition (PRIMARY)
- [ ] AC-2: Alt variant resolves polyline stroke to color.route.alt1
- [ ] AC-3: Saved state shows LSIcon(.heartFill) accent
- [ ] AC-4: Type-level test pins prop model to routes read schema shape
- [ ] AC-5: No Convex/networking/disk I/O imports in source (static assertion)
- [ ] AC-6: All six stories registered under both themes
- [ ] AC-7: Atom-composition gate (no banned primitives)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Default best-variant full composition [PRIMARY]
  GIVEN: developer renders LSRouteCard(route: mockRoute1) where mockRoute1.variant == .best
  WHEN:  view body resolves
  THEN:  LSCard wraps: LSMap(mode: .preview, polylines: [PolylineData(coordinates: route.polyline, variant: .best)], cameraFit: .polyline(padding: .spacing3)) with start/end annotations; title LSText(ui.title.md); subtitle with distance + time in LSText(instrument.sm); difficulty LSPill row; optional LSIcon(.heartFill) accent
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteCardTests/test_default_best_variant_full_composition 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSRouteCardTests.swift
  TEST_FUNCTION: test_default_best_variant_full_composition

AC-2: Alt variant polyline token
  GIVEN: developer renders LSRouteCard(route: mockRoute.with(variant: .alt1))
  WHEN:  view body resolves
  THEN:  LSMap polyline stroke resolves through color.route.alt1 token — not color.route.best
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteCardTests/test_alt_variant_resolves_color_route_alt1 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSRouteCardTests.swift
  TEST_FUNCTION: test_alt_variant_resolves_color_route_alt1

AC-3: Saved shows heartFill accent
  GIVEN: LSRouteCard(route: mockRoute.with(isSaved: true))
  WHEN:  view body resolves
  THEN:  LSIcon(.heartFill) renders as the saved accent on the card; when isSaved == false the accent is absent
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteCardTests/test_saved_state_shows_heartfill_accent 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSRouteCardTests.swift
  TEST_FUNCTION: test_saved_state_shows_heartfill_accent

AC-4: Route prop mirrors Convex routes schema
  GIVEN: LSRouteCard.Route prop model
  WHEN:  compared against convex/schema.ts routes read type (mirrored Swift fixture)
  THEN:  field-by-field type test confirms id, title, distance, duration, polyline, variant, difficulty, isSaved match the shape; missing-optional-data story passes without crash
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteCardTests/test_route_prop_mirrors_convex_routes_schema 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSRouteCardTests.swift
  TEST_FUNCTION: test_route_prop_mirrors_convex_routes_schema

AC-5: No data-layer imports
  GIVEN: LSRouteCard.swift source
  WHEN:  inspected for data-layer imports
  THEN:  grep returns 0 occurrences of ConvexMobile, URLSession, FileManager, or URL(string:
  VERIFY: grep -n 'ConvexMobile\|URLSession\|FileManager\|URL(string:' ios/LaneShadow/Views/Organisms/LSRouteCard.swift | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-6: Six stories registered
  GIVEN: developer opens the sandbox
  WHEN:  navigating to Organisms / RouteCard
  THEN:  stories Default, Saved, Alt Variant, Long Title (overflow), Missing Optional Data, Dark Mode all present with dotted ids; render under both themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteCardTests/test_route_card_stories_registered 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSRouteCardTests.swift
  TEST_FUNCTION: test_route_card_stories_registered

AC-7: Atom-composition gate
  GIVEN: LSRouteCard.swift source
  WHEN:  inspected
  THEN:  no Font.system, Color(hex:), Color(red:, .monospaced() occurrences
  VERIFY: grep -n 'Font.system\|Color(red:\|Color(hex:\|\.monospaced()' ios/LaneShadow/Views/Organisms/LSRouteCard.swift | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | test_default_best_variant_full_composition passes | AC-1 |
| TC-2 | test_alt_variant_resolves_color_route_alt1 passes | AC-2 |
| TC-3 | test_saved_state_shows_heartfill_accent passes | AC-3 |
| TC-4 | test_route_prop_mirrors_convex_routes_schema passes | AC-4 |
| TC-5 | No data-layer imports in LSRouteCard.swift | AC-5 |
| TC-6 | test_route_card_stories_registered passes | AC-6 |
| TC-7 | No banned font/color primitives in LSRouteCard.swift | AC-7 |
| TC-8 | swiftformat --lint exits 0 for LSRouteCard.swift | AC-7 |
| TC-9 | xcodebuild build BUILD SUCCEEDED | AC-6 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Organisms/LSRouteCard.swift (NEW)
- ios/LaneShadowTests/Organisms/LSRouteCardTests.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Organisms/LSRouteCardStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Organisms/OrganismStories.swift (MODIFY)
- ios/LaneShadow/Models/RouteCardFixtures.swift (NEW — mock route fixtures mirroring Convex shape)
- ios/project.yml (MODIFY if needed; then run scripts/ios/generate-project.sh)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated only
- ios/LaneShadow/Views/Atoms/** — prior sprints
- ios/LaneShadow/Views/Molecules/** — Sprint 4
- tokens/** — Sprint 01/03
- convex/** — backend owned
- android/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-org-06-route-card.html [REQUIRED READING — visual design source]
2. .spec/prds/v2/07-uc-org.md (lines 227-243) — UC-ORG-06 full spec
3. convex/schema.ts — routes read type mirror target
4. .spec/prds/v2/11-technical-requirements.md — RouteDetails + PolylineData schema
5. ios/LaneShadow/Views/Atoms/LSMap.swift [PRIMARY PATTERN] — multi-polyline preview mode
6. ios/LaneShadow/Views/Atoms/LSCard.swift — card wrapper
7. ios/LaneShadow/Views/Atoms/LSPill.swift — difficulty pill
8. ios/LaneShadow/Views/Atoms/LSIcon.swift — .heartFill accent

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/prds/v2/concepts/uc-org-06-route-card.html, .spec/prds/v2/07-uc-org.md, convex/schema.ts

Interaction notes:
- REQUIRED READING: .spec/prds/v2/concepts/uc-org-06-route-card.html before implementing
- LSMap preview is fixed-aspect (e.g. 16:9) embedded inside LSCard top slot; cameraFit handles framing without manual math
- LSRouteCard.Route struct mirrors routes table read shape from convex/schema.ts — duplicated as a Swift value type; any schema drift is caught by AC-4 type test
- Saved accent (LSIcon(.heartFill)) positioned in top-trailing corner of the card with a subtle glass chip behind; use spacing.2 inset
- Difficulty LSPill row stacks horizontally below subtitle with spacing.1 between chips; overflow truncates rather than wraps

Pattern: Full card organism delegating map preview to LSMap atom
Pattern source: ios/LaneShadow/Views/Atoms/LSMap.swift
Anti-pattern: Do not import ConvexMobile or URLSession — organism is data-agnostic. Do not resolve polyline colors via literal hex — route.variant → color.route.* token.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No raw primitives): grep banned pattern list against LSRouteCard.swift = 0
Gate 2 (No data-layer imports): grep 'ConvexMobile\|URLSession\|FileManager' against LSRouteCard.swift = 0
Gate 3 (swiftformat): swiftformat --lint exit 0
Gate 4 (build): xcodebuild build BUILD SUCCEEDED
Gate 5 (tests): xcodebuild test TEST SUCCEEDED for LSRouteCardTests
Gate 6 (stories registered): OrganismStories.all contains all six organisms.routecard.* ids

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-ATM-12-ios, ALIGN-03-ios
Blocks:     UC-SCR-02-ios, UC-SCR-03-ios
Parallel:   UC-ORG-06-android, UC-ORG-03-ios, UC-ORG-04-ios, UC-ORG-05-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Default best-variant full composition", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteCardTests/test_default_best_variant_full_composition" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Alt variant → color.route.alt1", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteCardTests/test_alt_variant_resolves_color_route_alt1" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Saved shows heartFill accent", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteCardTests/test_saved_state_shows_heartfill_accent" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Route prop mirrors Convex schema", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteCardTests/test_route_prop_mirrors_convex_routes_schema" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "No data-layer imports", "verify": "grep -n 'ConvexMobile\\|URLSession\\|FileManager\\|URL(string:' ios/LaneShadow/Views/Organisms/LSRouteCard.swift | wc -l | xargs test 0 -eq" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "Six stories registered", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteCardTests/test_route_card_stories_registered" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "No banned primitives", "verify": "grep -n 'Font.system\\|Color(red:\\|Color(hex:\\|\\.monospaced()' ios/LaneShadow/Views/Organisms/LSRouteCard.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-1", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "test_default_best_variant_full_composition passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteCardTests/test_default_best_variant_full_composition" },
    { "id": "TC-2", "type": "test_criterion", "maps_to_ac": "AC-2", "description": "test_alt_variant_resolves_color_route_alt1 passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteCardTests/test_alt_variant_resolves_color_route_alt1" },
    { "id": "TC-3", "type": "test_criterion", "maps_to_ac": "AC-3", "description": "test_saved_state_shows_heartfill_accent passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteCardTests/test_saved_state_shows_heartfill_accent" },
    { "id": "TC-4", "type": "test_criterion", "maps_to_ac": "AC-4", "description": "test_route_prop_mirrors_convex_routes_schema passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteCardTests/test_route_prop_mirrors_convex_routes_schema" },
    { "id": "TC-5", "type": "test_criterion", "maps_to_ac": "AC-5", "description": "No data-layer imports", "verify": "grep -n 'ConvexMobile\\|URLSession\\|FileManager\\|URL(string:' ios/LaneShadow/Views/Organisms/LSRouteCard.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-6", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "test_route_card_stories_registered passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteCardTests/test_route_card_stories_registered" },
    { "id": "TC-7", "type": "test_criterion", "maps_to_ac": "AC-7", "description": "No banned primitives", "verify": "grep -n 'Font.system\\|Color(red:\\|Color(hex:\\|\\.monospaced()' ios/LaneShadow/Views/Organisms/LSRouteCard.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-8", "type": "test_criterion", "maps_to_ac": "AC-7", "description": "swiftformat --lint exits 0", "verify": "swiftformat --lint ios/LaneShadow/Views/Organisms/LSRouteCard.swift" },
    { "id": "TC-9", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "BUILD SUCCEEDED", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" }
  ]
}
-->
