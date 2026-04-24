# UC-MOL-05-ios Implementer Packet — Iteration 001

You are executing `UC-MOL-05-ios` in a fresh kb-run child session.

Constraints:
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-ios`.
- Do not edit `.kb-run*` files.
- Respect the task file as the source of truth.
- The repository was already dirty before this run; do not revert unrelated changes.
- Produce the code, tests, and story/registry updates needed for this task only.
- Run the task-scoped runtime commands before finishing when feasible.
- In your final response, summarize changed files, commands run, and any remaining risks.

Task file: `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-05-ios-pill-semantics-family.md`
Worktree: `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-ios`
Runtime commands:
- swiftformat --lint ios/LaneShadow/
- cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
- cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
Normalized requirement count: 19
Supplemental requirements: STATE-MATRIX

Important scheduler notes:
- This unit is strict and independent.
- Any story registration changes must stay scoped to this task.
- Existing molecule code may already be present; update or replace it only if it violates the task spec.

Task markdown follows.

--- TASK MARKDOWN START ---
<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-05-ios — Pill semantics family (LSTagPill / LSFilterChip / LSSuggestionChip / LSWeatherBadge) — iOS
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   120 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-05)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: AC-1 none · 0/8 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSTagPill, LSFilterChip, LSSuggestionChip, and LSWeatherBadge ship as four semantic molecules that compose LSPill, LSIcon, and LSText atoms — each resolves the correct color tokens (surface.glass, signal.default, surface.card, weather.<condition>.tint/.default) for its semantic, fires interaction callbacks exactly once, and registers full sandbox stories including all six WeatherCondition × two PillSize variants.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST compose every semantic from LSPill atom (UC-ATM-06) — no Capsule().fill() pill drawing in molecule files.
- MUST route content (icon + label) through LSIcon and LSText atoms — no Image(systemName:), no raw Text().
- MUST resolve all colors through LaneShadowTheme.* — no Color(red:), Color(hex:), or literal hex anywhere.
- MUST define WeatherCondition as a sealed/enum type usable cross-molecule (UC-MOL-06 ChatInput and UC-MOL-07 WeatherTimeline import it).
- MUST register stories under Molecules / Pill Semantics covering each semantic × variant.
- NEVER build pill shape with Capsule().fill(color) directly — always go through LSPill so PillSize tokens resolve.
- NEVER hardcode 32pt height for LSSuggestionChip — derive from theme sizing token.
- NEVER hand-edit ios/LaneShadow.xcodeproj/project.pbxproj.
- STRICTLY: swiftformat --lint exits 0; xcodebuild test exits TEST SUCCEEDED for all four pill test classes.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSTagPill renders glass-surface pill with pin LSIcon + LSText label (PRIMARY)
- [ ] AC-2: LSFilterChip selected→signal.default; unselected→surface.card+border.default
- [ ] AC-3: LSFilterChip onToggle fires exactly once
- [ ] AC-4: LSSuggestionChip onTap fires once; resolves card surface
- [ ] AC-5: LSWeatherBadge resolves color.weather.<condition>.tint/.default for all six conditions
- [ ] AC-6: LSWeatherBadge sm/md sizes use LSPill PillSize heights
- [ ] AC-7: No Capsule()/Color(hex:)/Font.system in any of the four pill molecule files
- [ ] AC-8: Sandbox stories registered for all semantic × variant combinations under both themes

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSTagPill renders glass surface + pin icon + label [PRIMARY]
  GIVEN: developer renders LSTagPill(icon: .pin, label: "Near Santa Cruz, CA")
  WHEN:  view body resolves
  THEN:  LSPill present in semantics tree; color.surface.glass background; LSIcon(.pin) with .signal color resolves; LSText label in typography.ui.label.sm
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTagPillTests/test_glass_surface_and_icon_atom_composition 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSTagPillTests.swift
  TEST_FUNCTION: test_glass_surface_and_icon_atom_composition

AC-2: LSFilterChip selected vs unselected color resolution
  GIVEN: LSFilterChip rendered in selected=true and selected=false states
  WHEN:  view bodies resolve
  THEN:  selected→color.signal.default fill; unselected→color.surface.card + color.border.default border; both use LSPill atom
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFilterChipTests/test_selected_uses_signal_default_unselected_uses_card_surface 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSFilterChipTests.swift
  TEST_FUNCTION: test_selected_uses_signal_default_unselected_uses_card_surface

AC-3: LSFilterChip onToggle fires exactly once
  GIVEN: LSFilterChip with onToggle closure
  WHEN:  developer taps the chip once
  THEN:  onToggle fires exactly once
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFilterChipTests/test_ontoggle_fires_exactly_once 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSFilterChipTests.swift
  TEST_FUNCTION: test_ontoggle_fires_exactly_once

AC-4: LSSuggestionChip onTap fires once and resolves card surface
  GIVEN: LSSuggestionChip with onTap closure
  WHEN:  developer taps the chip
  THEN:  onTap fires once; chip uses color.surface.card + color.border.default + radius.pill + 32pt height
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSuggestionChipTests/test_ontap_fires_once_and_resolves_card_surface 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSSuggestionChipTests.swift
  TEST_FUNCTION: test_ontap_fires_once_and_resolves_card_surface

AC-5: LSWeatherBadge — all six conditions resolve weather color tokens
  GIVEN: LSWeatherBadge rendered for .sun, .rain, .wind, .storm, .hot, .cold
  WHEN:  view bodies resolve
  THEN:  each cell uses color.weather.<condition>.tint background, color.weather.<condition>.default foreground+border, with correct LSIcon (.sun/.rain/.wind/.storm/.therm)
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSWeatherBadgeTests/test_all_six_conditions_resolve_weather_color_tokens 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSWeatherBadgeTests.swift
  TEST_FUNCTION: test_all_six_conditions_resolve_weather_color_tokens

AC-6: LSWeatherBadge sm/md sizes use LSPill PillSize heights
  GIVEN: LSWeatherBadge rendered at .sm and .md sizes
  WHEN:  view bodies resolve
  THEN:  height comes from LSPill atom's PillSize token resolution; no hardcoded heights in molecule code
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSWeatherBadgeTests/test_sm_and_md_size_heights_from_pill_atom 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSWeatherBadgeTests.swift
  TEST_FUNCTION: test_sm_and_md_size_heights_from_pill_atom

AC-7: Atom-composition inspection gate
  GIVEN: all four pill molecule sources compiled
  WHEN:  files inspected
  THEN:  no Capsule(), Color(red:), Color(hex:), or Font.system literals
  VERIFY: grep -n 'Capsule()\|Color(red:\|Color(hex:\|Font.system' ios/LaneShadow/Views/Molecules/LSTagPill.swift ios/LaneShadow/Views/Molecules/LSFilterChip.swift ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-8: Sandbox stories registered for all variants
  GIVEN: developer opens sandbox
  WHEN:  navigating to Molecules / Pill Semantics
  THEN:  TagPill default, FilterChip selected/unselected, SuggestionChip default, WeatherBadge × all 6 conditions × 2 sizes — all present and render under both themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTagPillTests/test_pill_semantics_stories_registered 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSTagPillTests.swift
  TEST_FUNCTION: test_pill_semantics_stories_registered

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | test_glass_surface_and_icon_atom_composition passes | AC-1 |
| TC-2 | test_selected_uses_signal_default_unselected_uses_card_surface passes | AC-2 |
| TC-3 | test_ontoggle_fires_exactly_once passes | AC-3 |
| TC-4 | test_ontap_fires_once_and_resolves_card_surface passes | AC-4 |
| TC-5 | test_all_six_conditions_resolve_weather_color_tokens passes | AC-5 |
| TC-6 | test_sm_and_md_size_heights_from_pill_atom passes | AC-6 |
| TC-7 | No Capsule/Color(hex:)/Font.system in pill molecule sources | AC-7 |
| TC-8 | test_pill_semantics_stories_registered passes | AC-8 |
| TC-9 | swiftformat --lint exits 0 for all four files | AC-7 |
| TC-10 | xcodebuild build exits BUILD SUCCEEDED | AC-8 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Molecules/LSTagPill.swift (NEW)
- ios/LaneShadow/Views/Molecules/LSFilterChip.swift (NEW)
- ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift (NEW)
- ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift (NEW)
- ios/LaneShadowTests/Molecules/LSTagPillTests.swift (NEW)
- ios/LaneShadowTests/Molecules/LSFilterChipTests.swift (NEW)
- ios/LaneShadowTests/Molecules/LSSuggestionChipTests.swift (NEW)
- ios/LaneShadowTests/Molecules/LSWeatherBadgeTests.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Molecules/LSPillSemanticsStory.swift (NEW)
- ios/project.yml (MODIFY if needed; then run scripts/ios/generate-project.sh)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated only
- ios/LaneShadow/Views/Atoms/** — atoms owned by Sprint 02/03
- tokens/** — tokens owned by Sprint 01/03
- android/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/molecules/tag-pill/ [REQUIRED READING]
   - Lines: all
   - Focus: Glass surface, icon placement, non-interactive behavior

2. .spec/design/system/molecules/filter-chip/ [REQUIRED READING]
   - Lines: all
   - Focus: Selected/unselected color states, toggle interaction

3. .spec/design/system/molecules/suggestion-chip/ [REQUIRED READING]
   - Lines: all
   - Focus: 32pt height, card surface, single-tap onTap

4. .spec/design/system/molecules/weather-badge/ [REQUIRED READING]
   - Lines: all
   - Focus: Six condition × two size grid, color.weather.* token mapping, icon mapping per condition

5. .spec/prds/v2/06-uc-mol.md
   - Lines: 91-110
   - Focus: UC-MOL-05 acceptance criteria and semantic definitions

6. ios/LaneShadow/Views/Atoms/LSPill.swift [PRIMARY PATTERN]
   - Lines: all
   - Focus: pill atom this family wraps; PillSize enum; height token resolution

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/tag-pill/, .spec/design/system/molecules/filter-chip/, .spec/design/system/molecules/suggestion-chip/, .spec/design/system/molecules/weather-badge/

Interaction notes:
- REQUIRED READING: all four pill design directories before implementing
- LSFilterChip is uncontrolled — caller owns the Bool selected state and wires onToggle to flip it; the molecule never holds @State for selected
- LSWeatherBadge: define WeatherCondition enum with cases sun/rain/wind/storm/hot/cold; both hot and cold map to .therm icon (distinguish by color token)

Pattern: LSPill atom as container with HStack(LSIcon + LSText) content; background/border applied via .background and .overlay on LSPill
Pattern source: ios/LaneShadow/Views/Atoms/LSPill.swift
Anti-pattern: Do not build pill shape with Capsule().fill(color.signal.default) directly — pill shape must come from LSPill atom so PillSize token heights resolve through the theme correctly.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC. RED: failing xcodebuild test. GREEN: minimal LSPill composition. REFACTOR: extract WeatherCondition→token resolver helper; tests stay green.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No primitive pill shapes): grep -rn 'Capsule()' ios/LaneShadow/Views/Molecules/LS{TagPill,FilterChip,SuggestionChip,WeatherBadge}.swift | wc -l = 0
Gate 2 (No literal colors): same files, grep 'Color(hex:\|Color(red:\|Font.system' = 0
Gate 3 (swiftformat): swiftformat --lint of all four files exit 0
Gate 4 (build): xcodebuild build BUILD SUCCEEDED
Gate 5 (tests): xcodebuild test TEST SUCCEEDED

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-ios (atoms migrated to Copper theme)
Blocks:     UC-MOL-06-ios (LSChatInput uses LSSuggestionChip), UC-MOL-08-ios (LSLocationContextBar uses LSTagPill), UC-ORG-04-ios
Parallel:   UC-MOL-05-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LSTagPill(icon:.pin, label:) WHEN resolved THEN LSPill container; color.surface.glass; LSIcon(.pin, .signal); LSText label.sm", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTagPillTests/test_glass_surface_and_icon_atom_composition 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSFilterChip selected vs unselected WHEN resolved THEN signal.default fill vs card surface + border; both use LSPill atom", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFilterChipTests/test_selected_uses_signal_default_unselected_uses_card_surface 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSFilterChip with onToggle WHEN tapped THEN fires exactly once", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFilterChipTests/test_ontoggle_fires_exactly_once 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSSuggestionChip with onTap WHEN tapped THEN fires once; card surface + border + radius.pill + 32pt height", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSuggestionChipTests/test_ontap_fires_once_and_resolves_card_surface 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSWeatherBadge all six conditions WHEN resolved THEN color.weather.<condition>.tint bg; .default fg+border; correct LSIcon per condition", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSWeatherBadgeTests/test_all_six_conditions_resolve_weather_color_tokens 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSWeatherBadge size .sm and .md WHEN resolved THEN PillSize height tokens from LSPill atom", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSWeatherBadgeTests/test_sm_and_md_size_heights_from_pill_atom 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN all four molecule sources WHEN inspected THEN no Capsule()/Color(hex:)/Font.system", "verify": "grep -n 'Capsule()\\|Color(red:\\|Color(hex:\\|Font.system' ios/LaneShadow/Views/Molecules/LSTagPill.swift ios/LaneShadow/Views/Molecules/LSFilterChip.swift ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift | wc -l | xargs test 0 -eq" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN sandbox WHEN navigating to Molecules/Pill Semantics THEN all semantic × variant stories present under both themes", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTagPillTests/test_pill_semantics_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-1", "type": "test_criterion", "description": "test_glass_surface_and_icon_atom_composition passes", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTagPillTests/test_glass_surface_and_icon_atom_composition 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-2", "type": "test_criterion", "description": "test_selected_uses_signal_default_unselected_uses_card_surface passes", "maps_to_ac": "AC-2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFilterChipTests/test_selected_uses_signal_default_unselected_uses_card_surface 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-3", "type": "test_criterion", "description": "test_ontoggle_fires_exactly_once passes", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFilterChipTests/test_ontoggle_fires_exactly_once 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-4", "type": "test_criterion", "description": "test_ontap_fires_once_and_resolves_card_surface passes", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSuggestionChipTests/test_ontap_fires_once_and_resolves_card_surface 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-5", "type": "test_criterion", "description": "test_all_six_conditions_resolve_weather_color_tokens passes", "maps_to_ac": "AC-5", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSWeatherBadgeTests/test_all_six_conditions_resolve_weather_color_tokens 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-6", "type": "test_criterion", "description": "test_sm_and_md_size_heights_from_pill_atom passes", "maps_to_ac": "AC-6", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSWeatherBadgeTests/test_sm_and_md_size_heights_from_pill_atom 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-7", "type": "test_criterion", "description": "No Capsule/Color(hex:)/Font.system in pill molecule sources", "maps_to_ac": "AC-7", "verify": "grep -n 'Capsule()\\|Color(red:\\|Color(hex:\\|Font.system' ios/LaneShadow/Views/Molecules/LSTagPill.swift ios/LaneShadow/Views/Molecules/LSFilterChip.swift ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-8", "type": "test_criterion", "description": "test_pill_semantics_stories_registered passes", "maps_to_ac": "AC-8", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTagPillTests/test_pill_semantics_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-9", "type": "test_criterion", "description": "swiftformat --lint exits 0", "maps_to_ac": "AC-7", "verify": "swiftformat --lint ios/LaneShadow/Views/Molecules/LSTagPill.swift ios/LaneShadow/Views/Molecules/LSFilterChip.swift ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift ios/LaneShadow/Views/Molecules/LSWeatherBadge.swift" },
    { "id": "TC-10", "type": "test_criterion", "description": "xcodebuild build exits BUILD SUCCEEDED", "maps_to_ac": "AC-8", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" }
  ]
}
-->

--- TASK MARKDOWN END ---
