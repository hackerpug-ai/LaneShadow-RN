# UC-MOL-05-android Implementer Packet — Iteration 001

You are executing `UC-MOL-05-android` in a fresh kb-run child session.

Constraints:
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-android`.
- Do not edit `.kb-run*` files.
- Respect the task file as the source of truth.
- The repository was already dirty before this run; do not revert unrelated changes.
- Produce the code, tests, and story/registry updates needed for this task only.
- Run the task-scoped runtime commands before finishing when feasible.
- In your final response, summarize changed files, commands run, and any remaining risks.

Task file: `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-05-android-pill-semantics-family.md`
Worktree: `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-android`
Runtime commands:
- cd android && ./gradlew detekt
- cd android && ./gradlew :app:compileDebugKotlin
- cd android && ./gradlew test
Normalized requirement count: 18
Supplemental requirements: STATE-MATRIX

Important scheduler notes:
- This unit is strict and independent.
- Any story registration changes must stay scoped to this task.
- Existing molecule code may already be present; update or replace it only if it violates the task spec.

Task markdown follows.

--- TASK MARKDOWN START ---
<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-05-android — Pill semantics family (LSTagPill / LSFilterChip / LSSuggestionChip / LSWeatherBadge) — Android
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   120 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-05)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: AC-1 none · 0/8 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSTagPill, LSFilterChip, LSSuggestionChip, LSWeatherBadge ship as four semantic Compose molecules composing LSPill, LSIcon, LSText atoms — each resolves correct color tokens (surface.glass, signal.default, surface.card, weather.<condition>.tint/.default), fires interaction callbacks exactly once, and registers full sandbox stories including all six WeatherCondition × two PillSize variants (12+ stories).

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST compose every semantic from LSPill atom (UC-ATM-06) — no Box(modifier=Modifier.clip(RoundedCornerShape(50))) pill drawing.
- MUST route content through LSIcon and LSText atoms — no Image()/Icon()/raw Text().
- MUST resolve all colors through LaneShadowTheme.* — no Color(0xFF...).
- MUST define WeatherCondition as sealed interface in shared PillSemanticsTypes.kt for cross-molecule import.
- MUST register stories under Molecules / Pill Semantics covering each semantic × variant.
- NEVER build pill shape with Box(Modifier.clip(RoundedCornerShape(50))) — always go through LSPill.
- NEVER hardcode 32.dp height for LSSuggestionChip without referencing a named constant.
- NEVER use MaterialTheme.colorScheme/typography directly.
- STRICTLY: detekt exits 0; compileDebugKotlin BUILD SUCCESSFUL.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSTagPill renders glass-surface pill with pin LSIcon + LSText label (PRIMARY)
- [ ] AC-2: LSFilterChip selected→signal.default; unselected→surface.card+border.default
- [ ] AC-3: LSSuggestionChip onTap fires exactly once
- [ ] AC-4: LSWeatherBadge rain condition resolves correct tint and icon
- [ ] AC-5: All 6 weather conditions resolve distinct tints
- [ ] AC-6: Zero Color(0xFF in all 4 molecule files
- [ ] AC-7: 12+ stories for pill semantics family in sandbox
- [ ] AC-8: LSFilterChip onToggle fires exactly once

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSTagPill renders glass-surface pill with icon + label [PRIMARY]
  GIVEN: developer composes LSTagPill(icon=Glyph.Pin, label="Near Santa Cruz, CA")
  WHEN:  Composable enters composition
  THEN:  LSPill present in semantics tree (LSPillCornerRadiusKey resolved); color.surface.glass background; LSIcon(.pin, .signal); LSText label.sm
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSTagPillTest.renders_glass_surface_pill_with_icon_and_label' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSTagPillTest.kt
  TEST_FUNCTION: renders_glass_surface_pill_with_icon_and_label

AC-2: LSFilterChip selected vs unselected color resolution
  GIVEN: LSFilterChip rendered selected=true and selected=false
  WHEN:  view bodies resolve
  THEN:  selected→color.signal.default; unselected→color.surface.card + color.border.default border; both use LSPill atom
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSFilterChipTest.selected_and_unselected_resolve_distinct_colors' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSFilterChipTest.kt
  TEST_FUNCTION: selected_and_unselected_resolve_distinct_colors

AC-3: LSSuggestionChip onTap fires exactly once per gesture
  GIVEN: LSSuggestionChip with onTap
  WHEN:  developer taps via Compose UI test
  THEN:  onTap fires exactly once; radius.pill; height 32dp from theme
  VERIFY: cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSSuggestionChipUiTest.on_tap_fires_exactly_once' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSSuggestionChipUiTest.kt
  TEST_FUNCTION: on_tap_fires_exactly_once

AC-4: LSWeatherBadge rain — color tokens resolved
  GIVEN: LSWeatherBadge(condition=WeatherCondition.Rain, label="Rain 3pm")
  WHEN:  Composable resolves
  THEN:  color.weather.rain.tint background; color.weather.rain.default fg/border; rain glyph LSIcon
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSWeatherBadgeTest.rain_condition_resolves_correct_tint_and_icon' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherBadgeTest.kt
  TEST_FUNCTION: rain_condition_resolves_correct_tint_and_icon

AC-5: All 6 weather conditions resolve distinct tints
  GIVEN: LSWeatherBadge rendered for sun/rain/wind/storm/hot/cold
  WHEN:  Composables resolve
  THEN:  each cell uses theme.colors.weather.<condition>.tint with distinct values; no two conditions share tint
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSWeatherBadgeTest.all_six_conditions_resolve_distinct_tints' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherBadgeTest.kt
  TEST_FUNCTION: all_six_conditions_resolve_distinct_tints

AC-6: Atom-composition gate
  GIVEN: all 4 molecule files compiled
  WHEN:  examined via grep
  THEN:  zero Color(0xFF; no raw RoundedCornerShape pill drawing outside LSPill
  VERIFY: grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSTagPill.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSFilterChip.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt | wc -l | grep -x '0'
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-7: 12+ stories registered
  GIVEN: developer opens sandbox
  WHEN:  navigating to Molecules / Pill Semantics
  THEN:  TagPill default, FilterChip selected/unselected, SuggestionChip default, WeatherBadge × 6 conditions × 2 sizes — 12+ stories present
  VERIFY: grep -c 'molecules.pill\|molecules.tagpill\|molecules.filterchip\|molecules.suggestion\|molecules.weather' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSPillSemanticsStory.kt | awk '$1 >= 12'
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-8: LSFilterChip onToggle fires exactly once
  GIVEN: LSFilterChip with onToggle
  WHEN:  developer taps via Compose UI test
  THEN:  onToggle fires exactly once
  VERIFY: cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSFilterChipUiTest.on_toggle_fires_exactly_once' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSFilterChipUiTest.kt
  TEST_FUNCTION: on_toggle_fires_exactly_once

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | LSTagPillTest.renders_glass_surface_pill_with_icon_and_label passes | AC-1 |
| TC-2 | LSFilterChipTest.selected_and_unselected_resolve_distinct_colors passes | AC-2 |
| TC-3 | LSSuggestionChipUiTest.on_tap_fires_exactly_once passes (connected) | AC-3 |
| TC-4 | LSWeatherBadgeTest.rain_condition_resolves_correct_tint_and_icon passes | AC-4 |
| TC-5 | LSWeatherBadgeTest.all_six_conditions_resolve_distinct_tints passes | AC-5 |
| TC-6 | LSFilterChipUiTest.on_toggle_fires_exactly_once passes (connected) | AC-8 |
| TC-7 | Zero Color(0xFF across all 4 pill semantic files | AC-6 |
| TC-8 | 12+ story IDs in pill semantics story file | AC-7 |
| TC-9 | detekt + compileDebugKotlin succeed | AC-1 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/molecules/LSTagPill.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSFilterChip.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/PillSemanticsTypes.kt (NEW — WeatherCondition sealed interface, AccentColor)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSTagPillTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSFilterChipTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherBadgeTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSSuggestionChipUiTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSFilterChipUiTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSPillSemanticsStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt (MODIFY)

writeProhibited:
- android/app/build.gradle.kts — no new deps without justification
- android/app/src/main/java/com/laneshadow/ui/atoms/** — atoms owned by Sprint 02/03
- tokens/** — tokens owned by Sprint 01/03
- ios/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/molecules/tag-pill/ [REQUIRED READING]
2. .spec/design/system/molecules/filter-chip/ [REQUIRED READING]
3. .spec/design/system/molecules/suggestion-chip/ [REQUIRED READING]
4. .spec/design/system/molecules/weather-badge/ [REQUIRED READING]
5. .spec/prds/v2/06-uc-mol.md (lines 91-110) — UC-MOL-05 PRD definitions
6. android/app/src/main/java/com/laneshadow/ui/atoms/LSPill.kt [PRIMARY PATTERN] — atom all 4 molecules compose
7. android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt — weather glyphs and pin/mode icons

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/tag-pill/, .spec/design/system/molecules/filter-chip/, .spec/design/system/molecules/suggestion-chip/, .spec/design/system/molecules/weather-badge/

Interaction notes:
- REQUIRED READING: all 4 pill semantic design directories before implementing
- WeatherCondition type defined in shared PillSemanticsTypes.kt so UC-MOL-06 (ChatInput) and UC-MOL-07 (WeatherTimeline) can import without circular deps
- LSSuggestionChip 32.dp height should come from theme sizing token; if no such token exists, document as pending and use named constant

Pattern: Each semantic = thin wrapper that resolves semantic colors then delegates to LSPill with LSIcon and LSText content
Pattern source: android/app/src/main/java/com/laneshadow/ui/atoms/LSPill.kt
Anti-pattern: Do not draw pill shape independently — always call LSPill so LSPillCornerRadiusKey is in semantics tree.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No literal colors): grep 'Color(0xFF' all 4 files = 0
Gate 2 (detekt): cd android && ./gradlew detekt exit 0
Gate 3 (compile): cd android && ./gradlew :app:compileDebugKotlin BUILD SUCCESSFUL
Gate 4 (tests): cd android && ./gradlew test BUILD SUCCESSFUL

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-android
Blocks:     UC-MOL-06-android, UC-MOL-08-android, UC-ORG-04-android
Parallel:   UC-MOL-05-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "LSTagPill — LSPill present in semantics tree; color.surface.glass background; LSIcon pin; LSText label.sm", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSTagPillTest.renders_glass_surface_pill_with_icon_and_label' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "LSFilterChip selected=true → color.signal.default; selected=false → color.surface.card + color.border.default", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSFilterChipTest.selected_and_unselected_resolve_distinct_colors' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "LSSuggestionChip onTap fires exactly once per gesture; radius.pill; height 32dp from theme", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSSuggestionChipUiTest.on_tap_fires_exactly_once' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "LSWeatherBadge rain — color.weather.rain.tint background; color.weather.rain.default foreground/border; rain glyph LSIcon", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSWeatherBadgeTest.rain_condition_resolves_correct_tint_and_icon' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "All 6 weather conditions resolve distinct tint colors via theme.colors.weather.*", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSWeatherBadgeTest.all_six_conditions_resolve_distinct_tints' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "Zero Color(0xFF in all 4 molecule files; no raw RoundedCornerShape pill drawing outside LSPill", "verify": "grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSTagPill.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSFilterChip.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt | wc -l | grep -x '0'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "12+ stories for pill semantics family including 6 weather conditions × 2 sizes in sandbox", "verify": "grep -c 'molecules.pill\\|molecules.tagpill\\|molecules.filterchip\\|molecules.suggestion\\|molecules.weather' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSPillSemanticsStory.kt | awk '$1 >= 12'" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "LSFilterChip onToggle fires exactly once per tap", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSFilterChipUiTest.on_toggle_fires_exactly_once' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-1", "type": "test_criterion", "description": "LSTagPillTest.renders_glass_surface_pill_with_icon_and_label passes", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSTagPillTest.renders_glass_surface_pill_with_icon_and_label' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-2", "type": "test_criterion", "description": "LSFilterChipTest.selected_and_unselected_resolve_distinct_colors passes", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSFilterChipTest.selected_and_unselected_resolve_distinct_colors' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-3", "type": "test_criterion", "description": "LSSuggestionChipUiTest.on_tap_fires_exactly_once passes", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSSuggestionChipUiTest.on_tap_fires_exactly_once' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-4", "type": "test_criterion", "description": "LSWeatherBadgeTest.rain_condition_resolves_correct_tint_and_icon passes", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSWeatherBadgeTest.rain_condition_resolves_correct_tint_and_icon' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-5", "type": "test_criterion", "description": "LSWeatherBadgeTest.all_six_conditions_resolve_distinct_tints passes", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSWeatherBadgeTest.all_six_conditions_resolve_distinct_tints' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-6", "type": "test_criterion", "description": "LSFilterChipUiTest.on_toggle_fires_exactly_once passes", "maps_to_ac": "AC-8", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSFilterChipUiTest.on_toggle_fires_exactly_once' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-7", "type": "test_criterion", "description": "Zero Color(0xFF across all 4 pill semantic files", "maps_to_ac": "AC-6", "verify": "grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSTagPill.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSFilterChip.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt | wc -l | grep -x '0'" },
    { "id": "TC-8", "type": "test_criterion", "description": "12+ story IDs in pill semantics story file", "maps_to_ac": "AC-7", "verify": "grep -c 'molecules.pill\\|molecules.tagpill\\|molecules.filterchip\\|molecules.suggestion\\|molecules.weather' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSPillSemanticsStory.kt | awk '$1 >= 12'" },
    { "id": "TC-9", "type": "test_criterion", "description": "detekt + compileDebugKotlin succeed", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew detekt :app:compileDebugKotlin 2>&1 | grep 'BUILD SUCCESSFUL'" }
  ]
}
-->

--- TASK MARKDOWN END ---
