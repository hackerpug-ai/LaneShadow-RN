<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-07-android — Navigator molecules (LSPhaseIndicator / LSWeatherTimeline / LSInstrumentReadout) — Android
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   180 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-07)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: AC-1 none · 0/7 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSPhaseIndicator (compass chip + header + LSPhaseDot list with phaseDotPulse on active step), LSWeatherTimeline (horizontal 6-cell LazyRow with per-condition tinted backgrounds + LSWeatherBadge cells), LSInstrumentReadout (4-column grid with top/bottom LSDivider + mono typography) all render in the Android sandbox with token-driven composition; stories registered for all PRD-specified variants (9+).

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use LSPhaseDot (UC-ATM-08) for each step in LSPhaseIndicator; active step's pulse is inherited from atom — do NOT re-implement.
- MUST use LazyRow for LSWeatherTimeline horizontal cells; cell bg from theme.colors.weather.<condition>.tint.
- MUST use LSDivider (UC-ATM-05) for top/bottom borders in LSInstrumentReadout — not raw Divider() from Material3.
- MUST use typography.instrument.sm (mono) for phase step labels and hour/temperature; instrument.lg (mono) for metric values via LSText.
- MUST register stories for all PRD variants per molecule.
- NEVER re-implement phaseDotPulse animation inside LSPhaseIndicator — call LSPhaseDot(state=PhaseDotState.Active).
- NEVER use fixed-size Row for LSWeatherTimeline — must be LazyRow.
- NEVER use MaterialTheme.typography for mono metric values — route through LSText with typography.instrument.* variant.
- NEVER inline raw Divider() from Material3 — use LSDivider.
- STRICTLY: WeatherCondition reused from PillSemanticsTypes.kt (UC-MOL-05); LSInstrumentReadout columns use Modifier.weight(1f) per column; detekt 0; compileDebugKotlin BUILD SUCCESSFUL.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSPhaseIndicator renders compass chip + header + LSPhaseDot list (PRIMARY)
- [ ] AC-2: phaseDotPulse animation present on active step via LSPhaseDot delegation
- [ ] AC-3: LSWeatherTimeline renders 6 cells in LazyRow with per-condition tints
- [ ] AC-4: LSWeatherTimeline handles variable cell counts (3 and 8)
- [ ] AC-5: LSInstrumentReadout 4-column grid with LSDivider + mono values
- [ ] AC-6: LSInstrumentReadout adapts to N columns
- [ ] AC-7: 9+ stories registered for all 3 Navigator molecules

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSPhaseIndicator renders compass chip + header + LSPhaseDot list [PRIMARY]
  GIVEN: developer composes LSPhaseIndicator(phases=mockPhases, header="Let me think on that…")
  WHEN:  Composable enters composition with 5 phases (1 active, 2 done, 2 pending)
  THEN:  leading compass chip = LSIcon(.compass, color=.signal) inside LSPill(size=sm) with 22%-tinted color.signal.default bg; header LSText(typography.opinion.md); each step LSPhaseDot at correct state; step labels LSText(typography.instrument.sm) mono
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSPhaseIndicatorTest.renders_compass_chip_header_and_phase_dot_list' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSPhaseIndicatorTest.kt
  TEST_FUNCTION: renders_compass_chip_header_and_phase_dot_list

AC-2: phaseDotPulse animation present via LSPhaseDot delegation
  GIVEN: LSPhaseIndicator with one phase in Active state
  WHEN:  semantics tree inspected
  THEN:  LSPhaseDotAnimatedKey=true on active step's dot node; PhaseDotPulseTag test tag in tree (set by LSPhaseDot); no custom animation code in LSPhaseIndicator.kt
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSPhaseIndicatorTest.active_step_has_phase_dot_pulse_via_delegation' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSPhaseIndicatorTest.kt
  TEST_FUNCTION: active_step_has_phase_dot_pulse_via_delegation

AC-3: LSWeatherTimeline 6 cells with per-condition tints
  GIVEN: developer composes LSWeatherTimeline(entries=6WeatherEntries, from="9 AM", to="2 PM")
  WHEN:  Composable enters composition
  THEN:  LazyRow of 6 cells; each cell bg = theme.colors.weather.<condition>.tint; hour LSText(typography.ui.label.sm); temp LSText(typography.instrument.sm); LSIcon condition glyph; header row "Weather along the way" + time span
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSWeatherTimelineTest.six_cells_render_with_condition_tinted_backgrounds' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherTimelineTest.kt
  TEST_FUNCTION: six_cells_render_with_condition_tinted_backgrounds

AC-4: LSWeatherTimeline variable cell counts
  GIVEN: LSWeatherTimeline with 3 entries and separately with 8 entries
  WHEN:  each enters composition
  THEN:  3-entry case renders 3 cells; 8-entry case renders 8 cells, LazyRow scrollable; no IndexOutOfBoundsException
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSWeatherTimelineTest.variable_entry_count_renders_without_crash' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherTimelineTest.kt
  TEST_FUNCTION: variable_entry_count_renders_without_crash

AC-5: LSInstrumentReadout 4-column grid with LSDivider + mono values
  GIVEN: developer composes LSInstrumentReadout(metrics=listOf(dist("64 mi"), time("2h 10m"), climb("2,400ft"), scenic("9.2")))
  WHEN:  Composable enters composition
  THEN:  top + bottom LSDivider atoms in semantics tree; 4 columns equal weight; label LSText(typography.ui.label.sm); value LSText(typography.instrument.lg) mono; no literal Divider() from Material3
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSInstrumentReadoutTest.four_column_grid_with_dividers_and_mono_values' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSInstrumentReadoutTest.kt
  TEST_FUNCTION: four_column_grid_with_dividers_and_mono_values

AC-6: LSInstrumentReadout adapts to N columns
  GIVEN: LSInstrumentReadout with 3 metrics
  WHEN:  Composable enters composition
  THEN:  3 columns render with equal weight; top/bottom LSDividers still present; no crash
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSInstrumentReadoutTest.three_metric_variant_renders_n_columns' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSInstrumentReadoutTest.kt
  TEST_FUNCTION: three_metric_variant_renders_n_columns

AC-7: Stories registered
  GIVEN: developer opens sandbox
  WHEN:  navigating to Molecules / PhaseIndicator, WeatherTimeline, InstrumentReadout
  THEN:  PhaseIndicator stories Default, All Done, All Pending; WeatherTimeline 6 Hours, Mixed Weather, All Clear; InstrumentReadout 4 Metrics, 3 Metrics, Long Values
  VERIFY: grep -c 'molecules.phase\|molecules.weather.timeline\|molecules.instrument' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSNavigatorMoleculesStory.kt | awk '$1 >= 9'
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | LSPhaseIndicatorTest.renders_compass_chip_header_and_phase_dot_list passes | AC-1 |
| TC-2 | LSPhaseIndicatorTest.active_step_has_phase_dot_pulse_via_delegation passes | AC-2 |
| TC-3 | LSWeatherTimelineTest.six_cells_render_with_condition_tinted_backgrounds passes | AC-3 |
| TC-4 | LSWeatherTimelineTest.variable_entry_count_renders_without_crash passes | AC-4 |
| TC-5 | LSInstrumentReadoutTest.four_column_grid_with_dividers_and_mono_values passes | AC-5 |
| TC-6 | LSInstrumentReadoutTest.three_metric_variant_renders_n_columns passes | AC-6 |
| TC-7 | Zero Color(0xFF in all 3 navigator molecule files | AC-1 |
| TC-8 | No raw Material3 Divider() in LSInstrumentReadout.kt — only LSDivider | AC-5 |
| TC-9 | 9+ story IDs in LSNavigatorMoleculesStory.kt | AC-7 |
| TC-10 | detekt + compileDebugKotlin succeed | AC-1 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/molecules/LSPhaseIndicator.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherTimeline.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSInstrumentReadout.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/NavigatorMoleculeTypes.kt (NEW — PlanningPhase, WeatherTimelineEntry, InstrumentMetric)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSPhaseIndicatorTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherTimelineTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSInstrumentReadoutTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSNavigatorMoleculesStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt (MODIFY)

writeProhibited:
- android/app/build.gradle.kts — no new deps without justification
- android/app/src/main/java/com/laneshadow/ui/atoms/** — atoms owned by Sprint 02/03
- tokens/** — tokens owned by Sprint 01/03
- ios/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/molecules/phase-indicator/ [REQUIRED READING]
2. .spec/design/system/molecules/weather-timeline/ [REQUIRED READING]
3. .spec/design/system/molecules/instrument-readout/ [REQUIRED READING]
4. .spec/prds/v2/06-uc-mol.md (lines 156-172) — UC-MOL-07 full component definitions
5. android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt [PRIMARY PATTERN] — owns phaseDotPulse animation
6. android/app/src/main/java/com/laneshadow/ui/atoms/LSDivider.kt — for LSInstrumentReadout borders
7. android/app/src/main/java/com/laneshadow/ui/molecules/PillSemanticsTypes.kt — WeatherCondition sealed interface (import, do not duplicate)

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/phase-indicator/, .spec/design/system/molecules/weather-timeline/, .spec/design/system/molecules/instrument-readout/

Interaction notes:
- REQUIRED READING: all 3 design directories before implementing
- LSWeatherTimeline cells: LazyRow(contentPadding=PaddingValues(horizontal=theme.space.sm), horizontalArrangement=Arrangement.spacedBy(theme.space.xs)); each cell fixed-width Column; do not hardcode cell widths
- LSPhaseIndicator compass chip tint: apply 22% alpha via color.signal.default.copy(alpha=0.22f) — do NOT hardcode hex

Pattern: LSPhaseIndicator mirrors vertical phase-dot list from LSPhaseDot.kt; LSWeatherTimeline mirrors LazyRow cell pattern; LSInstrumentReadout uses Row with Modifier.weight(1f) per column flanked by LSDivider
Pattern source: android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt
Anti-pattern: Do not copy phaseDotPulse InfiniteTransition into LSPhaseIndicator; do not use Divider() from Material3.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No literal colors): grep 'Color(0xFF' all 3 files = 0
Gate 2 (No raw Divider): grep 'import androidx.compose.material3.Divider\|Divider(' LSInstrumentReadout.kt | grep -v LSDivider = 0
Gate 3 (detekt): cd android && ./gradlew detekt exit 0
Gate 4 (compile): cd android && ./gradlew :app:compileDebugKotlin BUILD SUCCESSFUL
Gate 5 (tests): cd android && ./gradlew test BUILD SUCCESSFUL

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-android, UC-MOL-05-android (WeatherCondition shared type)
Blocks:     UC-ORG-03-android, UC-ORG-05-android
Parallel:   UC-MOL-07-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "LSPhaseIndicator — compass chip (LSIcon in LSPill + 22% signal tint) + header LSText(opinion.md) + LSPhaseDot per step + LSText(instrument.sm) labels", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSPhaseIndicatorTest.renders_compass_chip_header_and_phase_dot_list' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Active step's phaseDotPulse animation inherited from LSPhaseDot — LSPhaseDotAnimatedKey=true in semantics; no custom animation in LSPhaseIndicator.kt", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSPhaseIndicatorTest.active_step_has_phase_dot_pulse_via_delegation' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "LSWeatherTimeline — 6-cell LazyRow; each cell has condition tint background, LSIcon glyph, hour LSText(label.sm), temp LSText(instrument.sm); header row", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSWeatherTimelineTest.six_cells_render_with_condition_tinted_backgrounds' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "LSWeatherTimeline handles variable cell count (3 or 8) without crash; LazyRow scrollable", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSWeatherTimelineTest.variable_entry_count_renders_without_crash' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "LSInstrumentReadout — 4 equal-weight columns; LSDivider top+bottom; label LSText(label.sm); value LSText(instrument.lg) mono", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSInstrumentReadoutTest.four_column_grid_with_dividers_and_mono_values' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "LSInstrumentReadout adapts to N columns for non-4 metric count; no crash", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSInstrumentReadoutTest.three_metric_variant_renders_n_columns' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "9+ stories across PhaseIndicator (3), WeatherTimeline (3), InstrumentReadout (3) in sandbox", "verify": "grep -c 'molecules.phase\\|molecules.weather.timeline\\|molecules.instrument' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSNavigatorMoleculesStory.kt | awk '$1 >= 9'" },
    { "id": "TC-1", "type": "test_criterion", "description": "renders_compass_chip_header_and_phase_dot_list passes", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSPhaseIndicatorTest.renders_compass_chip_header_and_phase_dot_list' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-2", "type": "test_criterion", "description": "active_step_has_phase_dot_pulse_via_delegation passes", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSPhaseIndicatorTest.active_step_has_phase_dot_pulse_via_delegation' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-3", "type": "test_criterion", "description": "six_cells_render_with_condition_tinted_backgrounds passes", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSWeatherTimelineTest.six_cells_render_with_condition_tinted_backgrounds' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-4", "type": "test_criterion", "description": "variable_entry_count_renders_without_crash passes", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSWeatherTimelineTest.variable_entry_count_renders_without_crash' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-5", "type": "test_criterion", "description": "four_column_grid_with_dividers_and_mono_values passes", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSInstrumentReadoutTest.four_column_grid_with_dividers_and_mono_values' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-6", "type": "test_criterion", "description": "three_metric_variant_renders_n_columns passes", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSInstrumentReadoutTest.three_metric_variant_renders_n_columns' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-7", "type": "test_criterion", "description": "Zero Color(0xFF across all 3 navigator molecule files", "maps_to_ac": "AC-1", "verify": "grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSPhaseIndicator.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherTimeline.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSInstrumentReadout.kt | wc -l | grep -x '0'" },
    { "id": "TC-8", "type": "test_criterion", "description": "No raw Material3 Divider() in LSInstrumentReadout.kt", "maps_to_ac": "AC-5", "verify": "grep -n 'import androidx.compose.material3.Divider\\|Divider(' android/app/src/main/java/com/laneshadow/ui/molecules/LSInstrumentReadout.kt | grep -v 'LSDivider' | wc -l | grep -x '0'" },
    { "id": "TC-9", "type": "test_criterion", "description": "9+ story IDs across navigator molecule story file", "maps_to_ac": "AC-7", "verify": "grep -c 'molecules.phase\\|molecules.weather.timeline\\|molecules.instrument' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSNavigatorMoleculesStory.kt | awk '$1 >= 9'" },
    { "id": "TC-10", "type": "test_criterion", "description": "detekt + compileDebugKotlin succeed", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew detekt :app:compileDebugKotlin 2>&1 | grep 'BUILD SUCCESSFUL'" }
  ]
}
-->
