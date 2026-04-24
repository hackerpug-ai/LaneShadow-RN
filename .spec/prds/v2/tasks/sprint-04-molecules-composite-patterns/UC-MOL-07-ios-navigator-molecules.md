<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-07-ios — Navigator molecules (LSPhaseIndicator / LSWeatherTimeline / LSInstrumentReadout) — iOS
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   180 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-07)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: AC-1 none · 0/7 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSPhaseIndicator, LSWeatherTimeline, LSInstrumentReadout render on iOS with correct domain structure, atom composition (LSPhaseDot, LSIcon, LSText, LSDivider, LSPill), color.weather.*.tint/.default tokens for all six conditions, mono typography for instrument values, motion.recipe.phaseDotPulse animation active on the active phase step, and all stories registered. swiftformat clean.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST route phase dots through LSPhaseDot atom (UC-ATM-08) — no custom circle drawing.
- MUST route phase step labels through LSText typography.instrument.sm (mono).
- MUST route weather icons through LSIcon atom.
- MUST route temperature/instrument values through LSText typography.instrument.sm/lg (mono).
- MUST route LSInstrumentReadout dividers through LSDivider atom.
- MUST resolve weather cell backgrounds through color.weather.<condition>.tint token.
- MUST use LSPhaseDot(state: .active) which contains phaseDotPulse animation — do NOT re-implement.
- MUST register stories.
- NEVER draw custom circle for phase dots.
- NEVER use Font.system(...).monospaced() — route through LaneShadowTheme.type.instrument.* token.
- NEVER hardcode weather hex colors.
- NEVER hand-edit ios/LaneShadow.xcodeproj/project.pbxproj.
- STRICTLY: swiftformat --lint exits 0; xcodebuild test exits TEST SUCCEEDED for all 3 molecule test classes; light/dark both render.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSPhaseIndicator renders compass chip + header + LSPhaseDot list (PRIMARY)
- [ ] AC-2: Active step shows phaseDotPulse via LSPhaseDot delegation
- [ ] AC-3: LSWeatherTimeline renders 6 cells with per-condition tints
- [ ] AC-4: LSInstrumentReadout 4-column grid with LSDivider + mono values
- [ ] AC-5: LSInstrumentReadout supports N-column (3-column without crash)
- [ ] AC-6: Atom-composition gate (no Font.system/Color(hex:)/.monospaced())
- [ ] AC-7: Stories registered for all 3 Navigator molecules

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSPhaseIndicator renders compass chip + header + LSPhaseDot list [PRIMARY]
  GIVEN: developer renders LSPhaseIndicator(phases: mockPhases, header: "Let me think on that…")
  WHEN:  view body resolves
  THEN:  compass chip = LSIcon(.compass) inside LSPill(size: .sm) with color.signal.default tinted at 22% background; header via LSText(typography.opinion.md); each step renders LSPhaseDot(state:) + LSText(typography.instrument.sm, mono) label
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSPhaseIndicatorTests/test_renders_compass_chip_header_and_phasedot_step_list 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSPhaseIndicatorTests.swift
  TEST_FUNCTION: test_renders_compass_chip_header_and_phasedot_step_list

AC-2: Active step shows phaseDotPulse via LSPhaseDot delegation
  GIVEN: LSPhaseIndicator with at least one PlanningPhase in .active state
  WHEN:  view renders
  THEN:  active step's LSPhaseDot(.active) shows pulse ring (sourced from atom's motion.recipe.phaseDotPulse); no custom animation in molecule code
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSPhaseIndicatorTests/test_active_step_phasedot_pulse_animation_present 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSPhaseIndicatorTests.swift
  TEST_FUNCTION: test_active_step_phasedot_pulse_animation_present

AC-3: LSWeatherTimeline renders 6 cells with per-condition tints
  GIVEN: developer renders LSWeatherTimeline(entries: sixEntries, from: "9 AM", to: "2 PM")
  WHEN:  view body resolves
  THEN:  header row "Weather along the way" typography.ui.label.md + time span typography.ui.label.sm; 6 cells with hour LSText(label.sm), LSIcon weather, temp LSText(instrument.sm); cell bg = color.weather.<condition>.tint; border = color.weather.<condition>.default at 33% alpha
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSWeatherTimelineTests/test_six_cells_render_with_per_condition_tinted_backgrounds 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSWeatherTimelineTests.swift
  TEST_FUNCTION: test_six_cells_render_with_per_condition_tinted_backgrounds

AC-4: LSInstrumentReadout 4-column grid
  GIVEN: developer renders LSInstrumentReadout(metrics: [.dist("64 mi"), .time("2h 10m"), .climb("2,400ft"), .scenic("9.2")])
  WHEN:  view body resolves
  THEN:  4-column grid with top LSDivider + bottom LSDivider; each cell label LSText(typography.ui.label.sm) + value LSText(typography.instrument.lg, mono); no inter-column dividers
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSInstrumentReadoutTests/test_four_column_grid_with_divider_atoms_and_mono_values 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSInstrumentReadoutTests.swift
  TEST_FUNCTION: test_four_column_grid_with_divider_atoms_and_mono_values

AC-5: LSInstrumentReadout supports N-column grids
  GIVEN: developer renders LSInstrumentReadout with 3 metrics
  WHEN:  view body resolves
  THEN:  3-column grid renders with top/bottom LSDivider; no crash
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSInstrumentReadoutTests/test_three_column_grid_renders_without_crash 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSInstrumentReadoutTests.swift
  TEST_FUNCTION: test_three_column_grid_renders_without_crash

AC-6: Atom-composition inspection gate
  GIVEN: all three molecule sources compiled
  WHEN:  inspected
  THEN:  no Font.system, Color(hex:), .monospaced() in molecule source
  VERIFY: grep -n 'Font.system\|Color(red:\|Color(hex:\|\.monospaced()' ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift ios/LaneShadow/Views/Molecules/LSWeatherTimeline.swift ios/LaneShadow/Views/Molecules/LSInstrumentReadout.swift | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-7: Stories registered for all 3 Navigator molecules
  GIVEN: developer opens sandbox
  WHEN:  navigating to Molecules / PhaseIndicator, WeatherTimeline, InstrumentReadout
  THEN:  PhaseIndicator stories Default, All Done, All Pending; WeatherTimeline stories 6 Hours, Mixed Weather, All Clear; InstrumentReadout stories 4 Metrics, 3 Metrics, Long Values — all present, render under both themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSPhaseIndicatorTests/test_phase_indicator_stories_registered 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSPhaseIndicatorTests.swift
  TEST_FUNCTION: test_phase_indicator_stories_registered

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | test_renders_compass_chip_header_and_phasedot_step_list passes | AC-1 |
| TC-2 | test_active_step_phasedot_pulse_animation_present passes | AC-2 |
| TC-3 | test_six_cells_render_with_per_condition_tinted_backgrounds passes | AC-3 |
| TC-4 | test_four_column_grid_with_divider_atoms_and_mono_values passes | AC-4 |
| TC-5 | test_three_column_grid_renders_without_crash passes | AC-5 |
| TC-6 | No Font.system/.monospaced()/Color(hex:) in Navigator molecule sources | AC-6 |
| TC-7 | test_phase_indicator_stories_registered passes | AC-7 |
| TC-8 | swiftformat --lint exits 0 for all 3 files | AC-6 |
| TC-9 | xcodebuild build BUILD SUCCEEDED | AC-7 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift (NEW)
- ios/LaneShadow/Views/Molecules/LSWeatherTimeline.swift (NEW)
- ios/LaneShadow/Views/Molecules/LSInstrumentReadout.swift (NEW)
- ios/LaneShadowTests/Molecules/LSPhaseIndicatorTests.swift (NEW)
- ios/LaneShadowTests/Molecules/LSWeatherTimelineTests.swift (NEW)
- ios/LaneShadowTests/Molecules/LSInstrumentReadoutTests.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Molecules/LSNavigatorMoleculesStory.swift (NEW)
- ios/project.yml (MODIFY if needed; then run scripts/ios/generate-project.sh)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated only
- ios/LaneShadow/Views/Atoms/** — atoms owned by Sprint 02/03
- tokens/** — tokens owned by Sprint 01/03
- android/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/molecules/phase-indicator/ [REQUIRED READING]
2. .spec/design/system/molecules/weather-timeline/ [REQUIRED READING]
3. .spec/design/system/molecules/instrument-readout/ [REQUIRED READING]
4. .spec/prds/v2/06-uc-mol.md (lines 351-430) — UC-MOL-07 full molecule specs
5. ios/LaneShadow/Views/Atoms/LSPhaseDot.swift [PRIMARY PATTERN] — owns phaseDotPulse animation
6. ios/LaneShadow/Views/Atoms/LSDivider.swift — divider atom for LSInstrumentReadout
7. ios/LaneShadow/Views/Atoms/LSPill.swift — LSPill(size: .sm) for compass chip

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/phase-indicator/, .spec/design/system/molecules/weather-timeline/, .spec/design/system/molecules/instrument-readout/

Interaction notes:
- REQUIRED READING: all 3 design directories before implementing
- LSWeatherTimeline: use LazyHStack inside ScrollView for 6-cell grid so it scrolls if more entries
- LSInstrumentReadout: use LazyVGrid with adaptive or fixed columns — let metrics.count drive column count

Pattern: VStack of named domain rows; atom delegation; weather color resolution via static func per condition
Pattern source: ios/LaneShadow/Views/Atoms/LSPhaseDot.swift
Anti-pattern: Do not copy MapPlanningIndicator.swift (legacy TypingIndicator + raw Text with literal colors); build fresh from atoms.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No mono font literals): grep '\.monospaced()\|Font.system' all 3 files = 0
Gate 2 (swiftformat): swiftformat --lint exit 0
Gate 3 (build): xcodebuild build BUILD SUCCEEDED
Gate 4 (tests): xcodebuild test TEST SUCCEEDED

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-ios
Blocks:     UC-ORG-02-ios, UC-ORG-03-ios, UC-ORG-04-ios
Parallel:   UC-MOL-07-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LSPhaseIndicator(phases:header:) WHEN resolved THEN compass LSPill chip + LSText opinion.md header + LSPhaseDot + LSText instrument.sm per step", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSPhaseIndicatorTests/test_renders_compass_chip_header_and_phasedot_step_list 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN active phase step WHEN rendered THEN LSPhaseDot(.active) pulse ring animation present via atom", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSPhaseIndicatorTests/test_active_step_phasedot_pulse_animation_present 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSWeatherTimeline 6 entries WHEN resolved THEN header row + 6 cells with color.weather.*.tint bg; .default border; LSIcon + mono temp", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSWeatherTimelineTests/test_six_cells_render_with_per_condition_tinted_backgrounds 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSInstrumentReadout 4 metrics WHEN resolved THEN 4-column grid; LSDivider top+bottom; LSText label.sm + instrument.lg mono per cell", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSInstrumentReadoutTests/test_four_column_grid_with_divider_atoms_and_mono_values 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSInstrumentReadout 3 metrics WHEN rendered THEN 3-column grid renders without crash", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSInstrumentReadoutTests/test_three_column_grid_renders_without_crash 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN compiled sources WHEN inspected THEN no Font.system/.monospaced()/Color(hex:)", "verify": "grep -n 'Font.system\\|Color(red:\\|Color(hex:\\|\\.monospaced()' ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift ios/LaneShadow/Views/Molecules/LSWeatherTimeline.swift ios/LaneShadow/Views/Molecules/LSInstrumentReadout.swift | wc -l | xargs test 0 -eq" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN sandbox WHEN navigating to Molecules/PhaseIndicator, WeatherTimeline, InstrumentReadout THEN all variant stories present under both themes", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSPhaseIndicatorTests/test_phase_indicator_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-1", "type": "test_criterion", "description": "test_renders_compass_chip_header_and_phasedot_step_list passes", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSPhaseIndicatorTests/test_renders_compass_chip_header_and_phasedot_step_list 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-2", "type": "test_criterion", "description": "test_active_step_phasedot_pulse_animation_present passes", "maps_to_ac": "AC-2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSPhaseIndicatorTests/test_active_step_phasedot_pulse_animation_present 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-3", "type": "test_criterion", "description": "test_six_cells_render_with_per_condition_tinted_backgrounds passes", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSWeatherTimelineTests/test_six_cells_render_with_per_condition_tinted_backgrounds 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-4", "type": "test_criterion", "description": "test_four_column_grid_with_divider_atoms_and_mono_values passes", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSInstrumentReadoutTests/test_four_column_grid_with_divider_atoms_and_mono_values 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-5", "type": "test_criterion", "description": "test_three_column_grid_renders_without_crash passes", "maps_to_ac": "AC-5", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSInstrumentReadoutTests/test_three_column_grid_renders_without_crash 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-6", "type": "test_criterion", "description": "No Font.system/.monospaced()/Color(hex:) in sources", "maps_to_ac": "AC-6", "verify": "grep -n 'Font.system\\|Color(red:\\|Color(hex:\\|\\.monospaced()' ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift ios/LaneShadow/Views/Molecules/LSWeatherTimeline.swift ios/LaneShadow/Views/Molecules/LSInstrumentReadout.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-7", "type": "test_criterion", "description": "test_phase_indicator_stories_registered passes", "maps_to_ac": "AC-7", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSPhaseIndicatorTests/test_phase_indicator_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-8", "type": "test_criterion", "description": "swiftformat --lint exits 0", "maps_to_ac": "AC-6", "verify": "swiftformat --lint ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift ios/LaneShadow/Views/Molecules/LSWeatherTimeline.swift ios/LaneShadow/Views/Molecules/LSInstrumentReadout.swift" },
    { "id": "TC-9", "type": "test_criterion", "description": "xcodebuild build BUILD SUCCEEDED", "maps_to_ac": "AC-7", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" }
  ]
}
-->
