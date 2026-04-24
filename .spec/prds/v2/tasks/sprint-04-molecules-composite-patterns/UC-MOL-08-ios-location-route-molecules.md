<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-08-ios — LocationContextBar + RouteAttachmentCard molecules — iOS
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   120 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-08)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: AC-1 none · 0/8 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSLocationContextBar renders two LSTagPill atoms in space-between HStack with onModeChange callback. LSRouteAttachmentCard renders with color.route.<variant> leading stripe, optional LSBestBadge, LSWeatherBadge, 5-dot scenic meter, compact mode, selected border, and all 3 route-variant stripes. All stories registered. swiftformat clean. xcodebuild test exits TEST SUCCEEDED.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST compose LSLocationContextBar exclusively from LSTagPill molecules (UC-MOL-05).
- MUST implement 3px leading stripe via 3pt-wide Rectangle with color.route.<variant> fill — mirror LSGlassPanel stripe pattern.
- MUST compose LSRouteAttachmentCard container from LSCard atom (UC-ATM-07).
- MUST route title/subtitle through LSText with TypographyVariant.
- MUST route optional LSBestBadge from existing LSBestBadge atom.
- MUST route optional weather badge through LSWeatherBadge molecule (UC-MOL-05).
- MUST route scenic meter dots through LSIcon atom (filled vs hollow variants) — no raw Circle()/Image(systemName:).
- MUST resolve all colors through LaneShadowTheme.* — no literal hex.
- MUST register stories.
- NOTE: existing legacy ios/LaneShadow/Views/Molecules/RouteAttachmentCard.swift uses pre-Sprint 04 patterns — do NOT modify; create LSRouteAttachmentCard alongside.
- NEVER modify legacy RouteAttachmentCard.swift.
- NEVER hardcode route variant colors as hex.
- NEVER use Image(systemName:) for scenic meter dots.
- NEVER hand-edit ios/LaneShadow.xcodeproj/project.pbxproj.
- STRICTLY: swiftformat --lint exits 0; xcodebuild test exits TEST SUCCEEDED.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSLocationContextBar renders two LSTagPill atoms space-between (PRIMARY)
- [ ] AC-2: onModeChange fires exactly once when mode pill tapped
- [ ] AC-3: LSRouteAttachmentCard best variant renders stripe + LSBestBadge + LSWeatherBadge + metrics
- [ ] AC-4: Selected state applies color.signal.default border
- [ ] AC-5: Compact mode hides LSBestBadge and LSWeatherBadge with tighter padding
- [ ] AC-6: alt1/alt2 route variants resolve correct stripe colors
- [ ] AC-7: onTap fires once when card has handler
- [ ] AC-8: Sandbox stories registered for both molecules

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSLocationContextBar renders two LSTagPills space-between [PRIMARY]
  GIVEN: developer instantiates LSLocationContextBar(location: "Near Santa Cruz, CA", mode: .manual, onModeChange: { })
  WHEN:  view body resolves
  THEN:  HStack with Spacer between pills; leading LSTagPill with LSIcon(.pin, .signal) + location label; trailing LSTagPill with "MANUAL"; horizontal padding spacing.2; height fits pill tokens
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSLocationContextBarTests/test_two_tagpill_atoms_space_between_with_pin_icon 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSLocationContextBarTests.swift
  TEST_FUNCTION: test_two_tagpill_atoms_space_between_with_pin_icon

AC-2: onModeChange fires exactly once on mode pill tap
  GIVEN: LSLocationContextBar rendered with onModeChange closure
  WHEN:  developer taps trailing mode pill
  THEN:  onModeChange fires exactly once; location pill does not fire callback
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSLocationContextBarTests/test_mode_pill_tap_fires_onmodechange_once 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSLocationContextBarTests.swift
  TEST_FUNCTION: test_mode_pill_tap_fires_onmodechange_once

AC-3: LSRouteAttachmentCard best variant renders all slots
  GIVEN: developer renders LSRouteAttachmentCard(route: bestRouteMock, selected: false, compact: false)
  WHEN:  view body resolves
  THEN:  LSCard container with color.surface.card + radius.md + color.border.default border; 3px leading stripe in color.route.best; LSBestBadge top; LSText(typography.ui.title.md) title + LSText(typography.ui.body.sm, color.content.textMuted) via subtitle; LSWeatherBadge right-aligned; metrics row mono typography.instrument.sm
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_best_variant_stripe_and_bestbadge_and_weatherbadge 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSRouteAttachmentCardTests.swift
  TEST_FUNCTION: test_best_variant_stripe_and_bestbadge_and_weatherbadge

AC-4: selected state applies signal.default border
  GIVEN: LSRouteAttachmentCard(route: bestRouteMock, selected: true, compact: false)
  WHEN:  view body resolves
  THEN:  border = color.signal.default instead of color.border.default; all other tokens unchanged
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_selected_state_applies_signal_border 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSRouteAttachmentCardTests.swift
  TEST_FUNCTION: test_selected_state_applies_signal_border

AC-5: compact mode hides badges
  GIVEN: LSRouteAttachmentCard(route: bestRouteMock, compact: true)
  WHEN:  view body resolves
  THEN:  LSBestBadge not rendered; LSWeatherBadge not rendered; padding 10pt vertical / 12pt horizontal; leading stripe still present
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_compact_mode_hides_badge_and_weather 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSRouteAttachmentCardTests.swift
  TEST_FUNCTION: test_compact_mode_hides_badge_and_weather

AC-6: alt1/alt2 stripe colors
  GIVEN: developer renders LSRouteAttachmentCard with alt1Route and alt2Route
  WHEN:  view bodies resolve
  THEN:  alt1 stripe = color.route.alt1; alt2 stripe = color.route.alt2; neither shows LSBestBadge
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_alt1_alt2_stripe_colors_resolve_route_tokens 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSRouteAttachmentCardTests.swift
  TEST_FUNCTION: test_alt1_alt2_stripe_colors_resolve_route_tokens

AC-7: onTap fires once when card has handler
  GIVEN: LSRouteAttachmentCard with onTap closure
  WHEN:  developer taps the card
  THEN:  onTap fires exactly once
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_ontap_fires_once 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSRouteAttachmentCardTests.swift
  TEST_FUNCTION: test_ontap_fires_once

AC-8: Sandbox stories registered
  GIVEN: developer opens sandbox
  WHEN:  navigating to Molecules / LocationContextBar and Molecules / RouteAttachmentCard
  THEN:  LocationContextBar stories Default (auto), Manual Mode, Long Location Label; RouteAttachmentCard stories Best Selected, Best Compact, Alt1, Alt2, With Favorite Flag, Long Title — all present, render under both themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSLocationContextBarTests/test_location_context_stories_registered 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSLocationContextBarTests.swift
  TEST_FUNCTION: test_location_context_stories_registered

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | test_two_tagpill_atoms_space_between_with_pin_icon passes | AC-1 |
| TC-2 | test_mode_pill_tap_fires_onmodechange_once passes | AC-2 |
| TC-3 | test_best_variant_stripe_and_bestbadge_and_weatherbadge passes | AC-3 |
| TC-4 | test_selected_state_applies_signal_border passes | AC-4 |
| TC-5 | test_compact_mode_hides_badge_and_weather passes | AC-5 |
| TC-6 | test_alt1_alt2_stripe_colors_resolve_route_tokens passes | AC-6 |
| TC-7 | test_ontap_fires_once passes | AC-7 |
| TC-8 | No literal hex or Image(systemName:) in molecule sources | AC-3 |
| TC-9 | test_location_context_stories_registered passes | AC-8 |
| TC-10 | Legacy RouteAttachmentCard.swift unchanged | AC-3 |
| TC-11 | swiftformat --lint exits 0 | AC-8 |
| TC-12 | xcodebuild build BUILD SUCCEEDED | AC-8 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Molecules/LSLocationContextBar.swift (NEW)
- ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift (NEW)
- ios/LaneShadowTests/Molecules/LSLocationContextBarTests.swift (NEW)
- ios/LaneShadowTests/Molecules/LSRouteAttachmentCardTests.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Molecules/LSLocationContextBarStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Molecules/LSRouteAttachmentCardStory.swift (NEW)
- ios/project.yml (MODIFY if needed; then run scripts/ios/generate-project.sh)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated only
- ios/LaneShadow/Views/Atoms/** — atoms owned by Sprint 02/03
- ios/LaneShadow/Views/Molecules/RouteAttachmentCard.swift — LEGACY, do not touch
- tokens/** — tokens owned by Sprint 01/03
- android/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/molecules/location-context-bar/ [REQUIRED READING]
2. .spec/design/system/molecules/route-attachment-card/ [REQUIRED READING]
3. .spec/prds/v2/06-uc-mol.md (lines 431-500) — UC-MOL-08 full spec
4. ios/LaneShadow/Views/Atoms/LSBestBadge.swift — existing atom
5. ios/LaneShadow/Views/Atoms/LSCard.swift [PRIMARY PATTERN] — surface for RouteAttachmentCard
6. ios/LaneShadow/Views/Atoms/LSGlassPanel.swift (62-90) — leading stripe pattern to mirror
7. ios/LaneShadow/Views/Molecules/RouteAttachmentCard.swift (1-60) — READ ONLY legacy

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/location-context-bar/, .spec/design/system/molecules/route-attachment-card/

Interaction notes:
- REQUIRED READING: both molecule design directories before implementing
- Leading stripe: ZStack with leading-aligned 3pt-wide Rectangle(.fill(color.route.<variant>)) overlaid on LSCard, clipped to card radius — mirror LSGlassPanel.swift lines 41-51
- Scenic meter: 5 LSIcon atoms in HStack; filled = .circleFill with color.signal.default; hollow = .circle with color.border.strong

Pattern: LSCard with overlay stripe + VStack of conditional atoms; mirrors LSGlassPanel callout stripe
Pattern source: ios/LaneShadow/Views/Atoms/LSGlassPanel.swift
Anti-pattern: Do not extend or modify legacy RouteAttachmentCard struct — create LSRouteAttachmentCard as clean new struct.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No literal colors): grep 'Color(hex:\|Image(systemName:' both files = 0
Gate 2 (Legacy unchanged): git diff HEAD -- legacy file = 0 lines
Gate 3 (swiftformat): swiftformat --lint exit 0
Gate 4 (build): xcodebuild build BUILD SUCCEEDED
Gate 5 (tests): xcodebuild test TEST SUCCEEDED

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-ios, UC-MOL-05-ios (LSTagPill, LSWeatherBadge)
Blocks:     UC-MOL-06-ios, UC-ORG-04-ios, UC-ORG-06-ios
Parallel:   UC-MOL-08-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LSLocationContextBar(location:mode:.manual,onModeChange:) WHEN resolved THEN two LSTagPill atoms; leading pin+label; trailing mode text; space-between; spacing.2 padding", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSLocationContextBarTests/test_two_tagpill_atoms_space_between_with_pin_icon 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN mode pill tapped WHEN rendered THEN onModeChange fires once; location pill does not fire", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSLocationContextBarTests/test_mode_pill_tap_fires_onmodechange_once 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSRouteAttachmentCard best compact:false WHEN resolved THEN LSCard + radius.md + border.default + 3px color.route.best stripe + LSBestBadge + LSText title.md/body.sm + LSWeatherBadge + metrics row instrument.sm", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_best_variant_stripe_and_bestbadge_and_weatherbadge 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN selected:true WHEN resolved THEN border = color.signal.default", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_selected_state_applies_signal_border 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN compact:true WHEN resolved THEN no LSBestBadge; no LSWeatherBadge; tighter 10/12pt padding", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_compact_mode_hides_badge_and_weather 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN alt1 and alt2 routes WHEN resolved THEN stripe = color.route.alt1 / color.route.alt2; no LSBestBadge", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_alt1_alt2_stripe_colors_resolve_route_tokens 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN onTap set WHEN tapped THEN fires once", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_ontap_fires_once 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN sandbox WHEN navigating to Molecules/LocationContextBar and RouteAttachmentCard THEN all variant stories present under both themes", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSLocationContextBarTests/test_location_context_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-1", "type": "test_criterion", "description": "test_two_tagpill_atoms_space_between_with_pin_icon passes", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSLocationContextBarTests/test_two_tagpill_atoms_space_between_with_pin_icon 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-2", "type": "test_criterion", "description": "test_mode_pill_tap_fires_onmodechange_once passes", "maps_to_ac": "AC-2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSLocationContextBarTests/test_mode_pill_tap_fires_onmodechange_once 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-3", "type": "test_criterion", "description": "test_best_variant_stripe_and_bestbadge_and_weatherbadge passes", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_best_variant_stripe_and_bestbadge_and_weatherbadge 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-4", "type": "test_criterion", "description": "test_selected_state_applies_signal_border passes", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_selected_state_applies_signal_border 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-5", "type": "test_criterion", "description": "test_compact_mode_hides_badge_and_weather passes", "maps_to_ac": "AC-5", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_compact_mode_hides_badge_and_weather 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-6", "type": "test_criterion", "description": "test_alt1_alt2_stripe_colors_resolve_route_tokens passes", "maps_to_ac": "AC-6", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_alt1_alt2_stripe_colors_resolve_route_tokens 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-7", "type": "test_criterion", "description": "test_ontap_fires_once passes", "maps_to_ac": "AC-7", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_ontap_fires_once 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-8", "type": "test_criterion", "description": "No literal hex or Image(systemName:) in new molecule sources", "maps_to_ac": "AC-3", "verify": "grep -n 'Color(red:\\|Color(hex:\\|Image(systemName:' ios/LaneShadow/Views/Molecules/LSLocationContextBar.swift ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-9", "type": "test_criterion", "description": "test_location_context_stories_registered passes", "maps_to_ac": "AC-8", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSLocationContextBarTests/test_location_context_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-10", "type": "test_criterion", "description": "Legacy RouteAttachmentCard.swift unchanged", "maps_to_ac": "AC-3", "verify": "git diff HEAD -- ios/LaneShadow/Views/Molecules/RouteAttachmentCard.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-11", "type": "test_criterion", "description": "swiftformat --lint exits 0 for new files", "maps_to_ac": "AC-8", "verify": "swiftformat --lint ios/LaneShadow/Views/Molecules/LSLocationContextBar.swift ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift" },
    { "id": "TC-12", "type": "test_criterion", "description": "xcodebuild build BUILD SUCCEEDED", "maps_to_ac": "AC-8", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" }
  ]
}
-->
