# UC-MOL-08-ios Implementer Packet — Iteration 001

You are executing `UC-MOL-08-ios` in a fresh kb-run child session.

Constraints:
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-08-ios`.
- Do not edit `.kb-run*` files.
- Respect the task file as the source of truth.
- The root repository is already dirty; do not revert unrelated changes.
- This worktree is intentionally based on the approved `UC-MOL-05-ios` branch head (`69917ef488ed3ef95e8ec9318251d95193528634`) because root `main` is not currently mergeable.
- Produce only the code, tests, and story/registry updates needed for this task.
- Run the task-scoped runtime commands before finishing when feasible.
- In your final response, summarize changed files, commands run, and any remaining risks.

Task file: `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-08-ios-location-route-molecules.md`
Worktree: `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-08-ios`
Runtime commands:
- `swiftformat --lint ios/LaneShadow/`
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`

Important scheduler notes:
- This unit depends on `UC-MOL-05-ios`, and that dependency is already satisfied in this worktree base.
- Do not modify legacy `ios/LaneShadow/Views/Molecules/RouteAttachmentCard.swift`.
- Any project membership change must go through `ios/project.yml` plus the existing generator flow; never hand-edit `.pbxproj`.

Task markdown follows.

--- TASK MARKDOWN START ---
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

AC-2: onModeChange fires exactly once on mode pill tap
  GIVEN: LSLocationContextBar rendered with onModeChange closure
  WHEN:  developer taps trailing mode pill
  THEN:  onModeChange fires exactly once; location pill does not fire callback
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSLocationContextBarTests/test_mode_pill_tap_fires_onmodechange_once 2>&1 | grep 'TEST SUCCEEDED'

AC-3: LSRouteAttachmentCard best variant renders all slots
  GIVEN: developer renders LSRouteAttachmentCard(route: bestRouteMock, selected: false, compact: false)
  WHEN:  view body resolves
  THEN:  LSCard container with color.surface.card + radius.md + color.border.default border; 3px leading stripe in color.route.best; LSBestBadge top; LSText(typography.ui.title.md) title + LSText(typography.ui.body.sm, color.content.textMuted) via subtitle; LSWeatherBadge right-aligned; metrics row mono typography.instrument.sm
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_best_variant_stripe_and_bestbadge_and_weatherbadge 2>&1 | grep 'TEST SUCCEEDED'

AC-4: selected state applies signal.default border
  GIVEN: LSRouteAttachmentCard(route: bestRouteMock, selected: true, compact: false)
  WHEN:  view body resolves
  THEN:  border = color.signal.default instead of color.border.default; all other tokens unchanged
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_selected_state_applies_signal_border 2>&1 | grep 'TEST SUCCEEDED'

AC-5: compact mode hides badges
  GIVEN: LSRouteAttachmentCard(route: bestRouteMock, compact: true)
  WHEN:  view body resolves
  THEN:  LSBestBadge not rendered; LSWeatherBadge not rendered; padding 10pt vertical / 12pt horizontal; leading stripe still present
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_compact_mode_hides_badge_and_weather 2>&1 | grep 'TEST SUCCEEDED'

AC-6: alt1/alt2 stripe colors
  GIVEN: developer renders LSRouteAttachmentCard with alt1Route and alt2Route
  WHEN:  view bodies resolve
  THEN:  alt1 stripe = color.route.alt1; alt2 stripe = color.route.alt2; neither shows LSBestBadge
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_alt1_alt2_stripe_colors_resolve_route_tokens 2>&1 | grep 'TEST SUCCEEDED'

AC-7: onTap fires once when card has handler
  GIVEN: LSRouteAttachmentCard with onTap closure
  WHEN:  developer taps the card
  THEN:  onTap fires exactly once
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteAttachmentCardTests/test_ontap_fires_once 2>&1 | grep 'TEST SUCCEEDED'

AC-8: Sandbox stories registered
  GIVEN: developer opens sandbox
  WHEN:  navigating to Molecules / LocationContextBar and Molecules / RouteAttachmentCard
  THEN:  LocationContextBar stories Default (auto), Manual Mode, Long Location Label; RouteAttachmentCard stories Best Selected, Best Compact, Alt1, Alt2, With Favorite Flag, Long Title — all present, render under both themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSLocationContextBarTests/test_location_context_stories_registered 2>&1 | grep 'TEST SUCCEEDED'

--- TASK MARKDOWN END ---
