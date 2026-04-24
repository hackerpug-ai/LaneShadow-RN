Review kb-run task UC-MOL-05-android. Respond with JSON only matching the reviewer verdict schema used by kb-run review-contract.

Task file: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-05-android-pill-semantics-family.md
Checkpoint commit: ae98746fcc6cef1235b04723af7520a09987b7ed
Worktree: /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-05-android
Execution unit: UC-MOL-05-android
Task ids: [UC-MOL-05-android]
Requirement summary: {"count": 18, "supplemental_ids": ["STATE-MATRIX"]}

Task markdown:
```markdown
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

```

Host validation logs:
## lint.log
```
> Task :android:library:preBuild UP-TO-DATE
> Task :theme:preBuild UP-TO-DATE
> Task :android:library:preDebugBuild UP-TO-DATE
> Task :kotlin:primitives:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :theme:preDebugBuild UP-TO-DATE
> Task :kotlin:primitives:preBuild UP-TO-DATE
> Task :kotlin:primitives:preDebugBuild UP-TO-DATE
> Task :kotlin:primitives:generateDebugResValues UP-TO-DATE
> Task :theme:mergeDebugJniLibFolders UP-TO-DATE
> Task :android:library:mergeDebugJniLibFolders UP-TO-DATE
> Task :kotlin:primitives:generateDebugResources UP-TO-DATE
> Task :android:library:mergeDebugNativeLibs NO-SOURCE
> Task :theme:mergeDebugNativeLibs NO-SOURCE
> Task :android:library:stripDebugDebugSymbols NO-SOURCE
> Task :theme:stripDebugDebugSymbols NO-SOURCE
> Task :kotlin:primitives:packageDebugResources UP-TO-DATE
> Task :android:library:copyDebugJniLibsProjectAndLocalJars UP-TO-DATE
> Task :android:library:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :theme:copyDebugJniLibsProjectAndLocalJars UP-TO-DATE
> Task :theme:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :android:library:generateDebugResValues UP-TO-DATE
> Task :theme:generateDebugResValues UP-TO-DATE
> Task :kotlin:primitives:parseDebugLocalResources UP-TO-DATE
> Task :android:library:generateDebugResources UP-TO-DATE
> Task :kotlin:primitives:generateDebugRFile UP-TO-DATE
> Task :theme:generateDebugResources UP-TO-DATE
> Task :android:library:packageDebugResources UP-TO-DATE
> Task :android:library:parseDebugLocalResources UP-TO-DATE
> Task :theme:packageDebugResources UP-TO-DATE
> Task :android:library:generateDebugRFile UP-TO-DATE
> Task :theme:parseDebugLocalResources UP-TO-DATE
> Task :android:library:extractDeepLinksForAarDebug UP-TO-DATE
> Task :android:library:mergeDebugShaders UP-TO-DATE
> Task :theme:generateDebugRFile UP-TO-DATE
> Task :android:library:compileDebugShaders NO-SOURCE
> Task :android:library:generateDebugAssets UP-TO-DATE
> Task :theme:extractDeepLinksForAarDebug UP-TO-DATE
> Task :android:library:mergeDebugAssets UP-TO-DATE
> Task :theme:mergeDebugShaders UP-TO-DATE
> Task :android:library:javaPreCompileDebug UP-TO-DATE
> Task :theme:compileDebugShaders NO-SOURCE
> Task :theme:generateDebugAssets UP-TO-DATE
> Task :android:library:prepareDebugArtProfile UP-TO-DATE
> Task :android:library:prepareLintJarForPublish UP-TO-DATE
> Task :theme:mergeDebugAssets UP-TO-DATE
> Task :kotlin:primitives:compileDebugKotlin UP-TO-DATE
> Task :theme:javaPreCompileDebug UP-TO-DATE
> Task :kotlin:primitives:javaPreCompileDebug UP-TO-DATE
> Task :theme:prepareDebugArtProfile UP-TO-DATE
> Task :android:library:processDebugManifest UP-TO-DATE
> Task :kotlin:primitives:compileDebugJavaWithJavac NO-SOURCE
> Task :theme:prepareLintJarForPublish UP-TO-DATE
> Task :android:library:writeDebugAarMetadata UP-TO-DATE
> Task :kotlin:primitives:bundleLibCompileToJarDebug UP-TO-DATE
> Task :android:library:extractDeepLinksDebug UP-TO-DATE
> Task :android:library:compileDebugLibraryResources UP-TO-DATE
> Task :kotlin:primitives:mergeDebugJniLibFolders UP-TO-DATE
> Task :theme:processDebugManifest UP-TO-DATE
> Task :android:library:writeDebugLintModelMetadata UP-TO-DATE
> Task :kotlin:primitives:mergeDebugNativeLibs NO-SOURCE
> Task :theme:writeDebugAarMetadata UP-TO-DATE
> Task :kotlin:primitives:stripDebugDebugSymbols NO-SOURCE
> Task :app:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :android:library:extractProguardFiles UP-TO-DATE
> Task :android:library:preDebugAndroidTestBuild UP-TO-DATE
> Task :kotlin:primitives:copyDebugJniLibsProjectAndLocalJars UP-TO-DATE
> Task :app:generateSecretsXml UP-TO-DATE
> Task :app:preBuild UP-TO-DATE
> Task :android:library:generateDebugAndroidTestResValues UP-TO-DATE
> Task :app:preDebugBuild UP-TO-DATE
> Task :android:library:preDebugUnitTestBuild UP-TO-DATE
> Task :app:generateDebugBuildConfig UP-TO-DATE
> Task :app:generateDebugResValues UP-TO-DATE
> Task :kotlin:primitives:extractDebugAnnotations UP-TO-DATE
> Task :kotlin:primitives:extractDeepLinksForAarDebug UP-TO-DATE
> Task :kotlin:primitives:mergeDebugShaders UP-TO-DATE
> Task :kotlin:primitives:compileDebugShaders NO-SOURCE
> Task :kotlin:primitives:generateDebugAssets UP-TO-DATE
> Task :kotlin:primitives:mergeDebugAssets UP-TO-DATE
> Task :kotlin:primitives:mergeDebugGeneratedProguardFiles UP-TO-DATE
> Task :kotlin:primitives:mergeDebugConsumerProguardFiles UP-TO-DATE
> Task :kotlin:primitives:prepareDebugArtProfile UP-TO-DATE
> Task :kotlin:primitives:prepareLintJarForPublish UP-TO-DATE
> Task :kotlin:primitives:processDebugManifest UP-TO-DATE
> Task :kotlin:primitives:processDebugJavaRes UP-TO-DATE
> Task :kotlin:primitives:mergeDebugJavaResource UP-TO-DATE
> Task :kotlin:primitives:syncDebugLibJars UP-TO-DATE
> Task :kotlin:primitives:writeDebugAarMetadata UP-TO-DATE
> Task :kotlin:primitives:bundleDebugLocalLintAar UP-TO-DATE
> Task :kotlin:primitives:extractDeepLinksDebug UP-TO-DATE
> Task :kotlin:primitives:compileDebugLibraryResources UP-TO-DATE
> Task :kotlin:primitives:writeDebugLintModelMetadata UP-TO-DATE
> Task :kotlin:primitives:bundleLibRuntimeToJarDebug UP-TO-DATE
> Task :kotlin:primitives:createFullJarDebug UP-TO-DATE
> Task :kotlin:primitives:extractProguardFiles UP-TO-DATE
> Task :app:mapDebugSourceSetPaths UP-TO-DATE
> Task :kotlin:primitives:generateDebugLintModel UP-TO-DATE
> Task :kotlin:primitives:lintAnalyzeDebug UP-TO-DATE
> Task :kotlin:primitives:preDebugAndroidTestBuild UP-TO-DATE
> Task :kotlin:primitives:generateDebugAndroidTestResValues UP-TO-DATE
> Task :kotlin:primitives:generateDebugAndroidTestLintModel UP-TO-DATE
> Task :kotlin:primitives:preDebugUnitTestBuild UP-TO-DATE
> Task :android:library:compileDebugKotlin UP-TO-DATE
> Task :android:library:extractDebugAnnotations UP-TO-DATE
> Task :kotlin:primitives:generateDebugUnitTestLintModel UP-TO-DATE
> Task :android:library:compileDebugJavaWithJavac NO-SOURCE
> Task :android:library:mergeDebugGeneratedProguardFiles UP-TO-DATE
> Task :android:library:mergeDebugConsumerProguardFiles UP-TO-DATE
> Task :kotlin:primitives:lintAnalyzeDebugAndroidTest UP-TO-DATE
> Task :android:library:processDebugJavaRes UP-TO-DATE
> Task :kotlin:primitives:lintAnalyzeDebugUnitTest UP-TO-DATE
> Task :android:library:mergeDebugJavaResource UP-TO-DATE
> Task :android:library:syncDebugLibJars UP-TO-DATE
> Task :android:library:bundleDebugLocalLintAar UP-TO-DATE
> Task :android:library:bundleLibCompileToJarDebug UP-TO-DATE
> Task :android:library:bundleLibRuntimeToJarDebug UP-TO-DATE
> Task :android:library:createFullJarDebug UP-TO-DATE
> Task :android:library:generateDebugLintModel UP-TO-DATE
> Task :theme:compileDebugKotlin UP-TO-DATE
> Task :theme:extractDebugAnnotations UP-TO-DATE
> Task :theme:compileDebugJavaWithJavac NO-SOURCE
> Task :android:library:lintAnalyzeDebug UP-TO-DATE
> Task :theme:mergeDebugGeneratedProguardFiles UP-TO-DATE
> Task :theme:mergeDebugConsumerProguardFiles UP-TO-DATE
> Task :theme:processDebugJavaRes UP-TO-DATE
> Task :android:library:generateDebugAndroidTestLintModel UP-TO-DATE
> Task :theme:mergeDebugJavaResource UP-TO-DATE
> Task :theme:syncDebugLibJars UP-TO-DATE
> Task :android:library:generateDebugUnitTestLintModel UP-TO-DATE
> Task :theme:bundleDebugLocalLintAar UP-TO-DATE
> Task :app:checkDebugAarMetadata UP-TO-DATE
> Task :android:library:lintAnalyzeDebugAndroidTest UP-TO-DATE
> Task :app:generateDebugResources UP-TO-DATE
> Task :android:library:lintAnalyzeDebugUnitTest UP-TO-DATE
> Task :app:mergeDebugResources UP-TO-DATE
> Task :app:packageDebugResources UP-TO-DATE
> Task :app:parseDebugLocalResources UP-TO-DATE
> Task :app:createDebugCompatibleScreenManifests UP-TO-DATE
> Task :app:extractDeepLinksDebug UP-TO-DATE
> Task :theme:extractDeepLinksDebug UP-TO-DATE
> Task :app:processDebugMainManifest UP-TO-DATE
> Task :app:processDebugManifest UP-TO-DATE
> Task :app:processDebugManifestForPackage UP-TO-DATE
> Task :theme:compileDebugLibraryResources UP-TO-DATE
> Task :app:processDebugResources UP-TO-DATE
> Task :theme:bundleLibCompileToJarDebug UP-TO-DATE
> Task :app:compileDebugKotlin UP-TO-DATE
> Task :app:javaPreCompileDebug UP-TO-DATE
> Task :app:compileDebugJavaWithJavac UP-TO-DATE
> Task :app:bundleDebugClassesToCompileJar UP-TO-DATE
> Task :app:preDebugAndroidTestBuild SKIPPED
> Task :app:generateDebugAndroidTestResValues UP-TO-DATE
> Task :theme:bundleLibRuntimeToJarDebug UP-TO-DATE
> Task :theme:createFullJarDebug UP-TO-DATE
> Task :theme:writeDebugLintModelMetadata UP-TO-DATE
> Task :app:generateDebugAndroidTestLintModel
> Task :app:extractProguardFiles UP-TO-DATE
> Task :theme:extractProguardFiles UP-TO-DATE
> Task :theme:generateDebugLintModel UP-TO-DATE
> Task :app:generateDebugLintReportModel
> Task :app:preDebugUnitTestBuild UP-TO-DATE
> Task :app:generateDebugUnitTestLintModel
> Task :theme:lintAnalyzeDebug UP-TO-DATE
> Task :theme:preDebugAndroidTestBuild UP-TO-DATE
> Task :theme:generateDebugAndroidTestResValues UP-TO-DATE
> Task :theme:generateDebugAndroidTestLintModel UP-TO-DATE
> Task :theme:preDebugUnitTestBuild UP-TO-DATE
> Task :theme:generateDebugUnitTestLintModel UP-TO-DATE
> Task :theme:generateDebugLintReportModel UP-TO-DATE
> Task :app:lintAnalyzeDebugAndroidTest
> Task :theme:lintAnalyzeDebugAndroidTest UP-TO-DATE
> Task :theme:lintAnalyzeDebugUnitTest UP-TO-DATE
> Task :theme:lintReportDebug UP-TO-DATE
> Task :theme:lintDebug
> Task :theme:lint
> Task :app:lintAnalyzeDebugUnitTest
> Task :app:lintAnalyzeDebug
> Task :app:lintReportDebug UP-TO-DATE
> Task :app:lintDebug
> Task :app:lint
> Task :detekt

BUILD SUCCESSFUL in 18s
143 actionable tasks: 8 executed, 135 up-to-date

```
## typecheck.log
```
> Task :android:library:preBuild UP-TO-DATE
> Task :app:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :kotlin:primitives:preBuild UP-TO-DATE
> Task :kotlin:primitives:preDebugBuild UP-TO-DATE
> Task :android:library:preDebugBuild UP-TO-DATE
> Task :kotlin:primitives:writeDebugAarMetadata UP-TO-DATE
> Task :app:generateSecretsXml UP-TO-DATE
> Task :app:preBuild UP-TO-DATE
> Task :android:library:writeDebugAarMetadata UP-TO-DATE
> Task :app:preDebugBuild UP-TO-DATE
> Task :kotlin:primitives:generateDebugResValues UP-TO-DATE
> Task :android:library:generateDebugResValues UP-TO-DATE
> Task :app:generateDebugBuildConfig UP-TO-DATE
> Task :kotlin:primitives:generateDebugResources UP-TO-DATE
> Task :theme:preBuild UP-TO-DATE
> Task :theme:preDebugBuild UP-TO-DATE
> Task :android:library:generateDebugResources UP-TO-DATE
> Task :kotlin:primitives:packageDebugResources UP-TO-DATE
> Task :theme:writeDebugAarMetadata UP-TO-DATE
> Task :kotlin:primitives:extractDeepLinksDebug UP-TO-DATE
> Task :android:library:packageDebugResources UP-TO-DATE
> Task :android:library:extractDeepLinksDebug UP-TO-DATE
> Task :kotlin:primitives:processDebugManifest UP-TO-DATE
> Task :android:library:processDebugManifest UP-TO-DATE
> Task :kotlin:primitives:parseDebugLocalResources UP-TO-DATE
> Task :android:library:parseDebugLocalResources UP-TO-DATE
> Task :kotlin:primitives:generateDebugRFile UP-TO-DATE
> Task :android:library:generateDebugRFile UP-TO-DATE
> Task :kotlin:primitives:compileDebugLibraryResources UP-TO-DATE
> Task :kotlin:primitives:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :android:library:compileDebugLibraryResources UP-TO-DATE
> Task :android:library:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :android:library:javaPreCompileDebug UP-TO-DATE
> Task :app:checkDebugAarMetadata UP-TO-DATE
> Task :app:generateDebugResValues UP-TO-DATE
> Task :theme:generateDebugResValues UP-TO-DATE
> Task :theme:generateDebugResources UP-TO-DATE
> Task :theme:packageDebugResources UP-TO-DATE
> Task :app:mapDebugSourceSetPaths UP-TO-DATE
> Task :app:generateDebugResources UP-TO-DATE
> Task :app:mergeDebugResources UP-TO-DATE
> Task :app:packageDebugResources UP-TO-DATE
> Task :app:parseDebugLocalResources UP-TO-DATE
> Task :app:createDebugCompatibleScreenManifests UP-TO-DATE
> Task :kotlin:primitives:compileDebugKotlin UP-TO-DATE
> Task :app:extractDeepLinksDebug UP-TO-DATE
> Task :kotlin:primitives:javaPreCompileDebug UP-TO-DATE
> Task :theme:extractDeepLinksDebug UP-TO-DATE
> Task :kotlin:primitives:compileDebugJavaWithJavac NO-SOURCE
> Task :kotlin:primitives:bundleLibCompileToJarDebug UP-TO-DATE
> Task :theme:processDebugManifest UP-TO-DATE
> Task :app:processDebugMainManifest UP-TO-DATE
> Task :app:processDebugManifest UP-TO-DATE
> Task :app:processDebugManifestForPackage UP-TO-DATE
> Task :theme:compileDebugLibraryResources UP-TO-DATE
> Task :theme:parseDebugLocalResources UP-TO-DATE
> Task :android:library:compileDebugKotlin UP-TO-DATE
> Task :theme:generateDebugRFile UP-TO-DATE
> Task :android:library:compileDebugJavaWithJavac NO-SOURCE
> Task :android:library:bundleLibCompileToJarDebug UP-TO-DATE
> Task :app:processDebugResources UP-TO-DATE
> Task :theme:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :theme:compileDebugKotlin UP-TO-DATE
> Task :theme:javaPreCompileDebug UP-TO-DATE
> Task :theme:compileDebugJavaWithJavac NO-SOURCE
> Task :theme:bundleLibCompileToJarDebug UP-TO-DATE
> Task :app:compileDebugKotlin UP-TO-DATE

BUILD SUCCESSFUL in 1s
52 actionable tasks: 52 up-to-date

```
## test.log
```
> Task :android:library:preBuild UP-TO-DATE
> Task :kotlin:primitives:preBuild UP-TO-DATE
> Task :app:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :kotlin:primitives:preDebugBuild UP-TO-DATE
> Task :android:library:preDebugBuild UP-TO-DATE
> Task :kotlin:primitives:writeDebugAarMetadata UP-TO-DATE
> Task :app:generateSecretsXml UP-TO-DATE
> Task :app:preBuild UP-TO-DATE
> Task :kotlin:primitives:generateDebugResValues UP-TO-DATE
> Task :app:preDebugBuild UP-TO-DATE
> Task :android:library:writeDebugAarMetadata UP-TO-DATE
> Task :kotlin:primitives:generateDebugResources UP-TO-DATE
> Task :app:generateDebugBuildConfig UP-TO-DATE
> Task :theme:preBuild UP-TO-DATE
> Task :android:library:generateDebugResValues UP-TO-DATE
> Task :theme:preDebugBuild UP-TO-DATE
> Task :theme:writeDebugAarMetadata UP-TO-DATE
> Task :android:library:generateDebugResources UP-TO-DATE
> Task :android:library:packageDebugResources UP-TO-DATE
> Task :kotlin:primitives:packageDebugResources UP-TO-DATE
> Task :android:library:extractDeepLinksDebug UP-TO-DATE
> Task :kotlin:primitives:extractDeepLinksDebug UP-TO-DATE
> Task :kotlin:primitives:processDebugManifest UP-TO-DATE
> Task :android:library:processDebugManifest UP-TO-DATE
> Task :kotlin:primitives:parseDebugLocalResources UP-TO-DATE
> Task :android:library:parseDebugLocalResources UP-TO-DATE
> Task :kotlin:primitives:generateDebugRFile UP-TO-DATE
> Task :kotlin:primitives:compileDebugLibraryResources UP-TO-DATE
> Task :android:library:generateDebugRFile UP-TO-DATE
> Task :kotlin:primitives:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :android:library:compileDebugLibraryResources UP-TO-DATE
> Task :android:library:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :android:library:javaPreCompileDebug UP-TO-DATE
> Task :app:checkDebugAarMetadata UP-TO-DATE
> Task :app:generateDebugResValues UP-TO-DATE
> Task :android:library:mergeDebugShaders UP-TO-DATE
> Task :android:library:compileDebugShaders NO-SOURCE
> Task :android:library:generateDebugAssets UP-TO-DATE
> Task :theme:generateDebugResValues UP-TO-DATE
> Task :android:library:mergeDebugAssets UP-TO-DATE
> Task :theme:generateDebugResources UP-TO-DATE
> Task :theme:packageDebugResources UP-TO-DATE
> Task :app:mapDebugSourceSetPaths UP-TO-DATE
> Task :kotlin:primitives:compileDebugKotlin UP-TO-DATE
> Task :kotlin:primitives:javaPreCompileDebug UP-TO-DATE
> Task :app:generateDebugResources UP-TO-DATE
> Task :kotlin:primitives:compileDebugJavaWithJavac NO-SOURCE
> Task :kotlin:primitives:bundleLibCompileToJarDebug UP-TO-DATE
> Task :app:mergeDebugResources UP-TO-DATE
> Task :kotlin:primitives:mergeDebugShaders UP-TO-DATE
> Task :kotlin:primitives:compileDebugShaders NO-SOURCE
> Task :kotlin:primitives:generateDebugAssets UP-TO-DATE
> Task :app:packageDebugResources UP-TO-DATE
> Task :kotlin:primitives:mergeDebugAssets UP-TO-DATE
> Task :app:parseDebugLocalResources UP-TO-DATE
> Task :app:createDebugCompatibleScreenManifests UP-TO-DATE
> Task :kotlin:primitives:processDebugJavaRes UP-TO-DATE
> Task :app:extractDeepLinksDebug UP-TO-DATE
> Task :kotlin:primitives:bundleLibRuntimeToJarDebug UP-TO-DATE
> Task :kotlin:primitives:preReleaseBuild UP-TO-DATE
> Task :theme:extractDeepLinksDebug UP-TO-DATE
> Task :theme:processDebugManifest UP-TO-DATE
> Task :kotlin:primitives:writeReleaseAarMetadata UP-TO-DATE
> Task :kotlin:primitives:generateReleaseResValues UP-TO-DATE
> Task :kotlin:primitives:generateReleaseResources UP-TO-DATE
> Task :app:processDebugMainManifest UP-TO-DATE
> Task :kotlin:primitives:packageReleaseResources UP-TO-DATE
> Task :app:processDebugManifest UP-TO-DATE
> Task :app:processDebugManifestForPackage UP-TO-DATE
> Task :kotlin:primitives:extractDeepLinksRelease UP-TO-DATE
> Task :theme:compileDebugLibraryResources UP-TO-DATE
> Task :theme:parseDebugLocalResources UP-TO-DATE
> Task :theme:generateDebugRFile UP-TO-DATE
> Task :kotlin:primitives:processReleaseManifest UP-TO-DATE
> Task :kotlin:primitives:parseReleaseLocalResources UP-TO-DATE
> Task :kotlin:primitives:generateReleaseRFile UP-TO-DATE
> Task :kotlin:primitives:compileReleaseLibraryResources UP-TO-DATE
> Task :app:processDebugResources UP-TO-DATE
> Task :theme:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :kotlin:primitives:compileReleaseKotlin UP-TO-DATE
> Task :kotlin:primitives:javaPreCompileRelease UP-TO-DATE
> Task :kotlin:primitives:compileReleaseJavaWithJavac NO-SOURCE
> Task :kotlin:primitives:bundleLibCompileToJarRelease UP-TO-DATE
> Task :kotlin:primitives:mergeReleaseShaders UP-TO-DATE
> Task :kotlin:primitives:compileReleaseShaders NO-SOURCE
> Task :kotlin:primitives:generateReleaseAssets UP-TO-DATE
> Task :kotlin:primitives:mergeReleaseAssets UP-TO-DATE
> Task :kotlin:primitives:processReleaseJavaRes UP-TO-DATE
> Task :kotlin:primitives:bundleLibRuntimeToJarRelease UP-TO-DATE
> Task :theme:compileDebugKotlin UP-TO-DATE
> Task :theme:javaPreCompileDebug UP-TO-DATE
> Task :theme:compileDebugJavaWithJavac NO-SOURCE
> Task :theme:bundleLibCompileToJarDebug UP-TO-DATE
> Task :app:javaPreCompileDebug UP-TO-DATE
> Task :app:preDebugUnitTestBuild UP-TO-DATE
> Task :app:javaPreCompileDebugUnitTest UP-TO-DATE
> Task :app:mergeDebugShaders UP-TO-DATE
> Task :app:compileDebugShaders NO-SOURCE
> Task :app:generateDebugAssets UP-TO-DATE
> Task :theme:mergeDebugShaders UP-TO-DATE
> Task :theme:compileDebugShaders NO-SOURCE
> Task :theme:generateDebugAssets UP-TO-DATE
> Task :android:library:compileDebugKotlin UP-TO-DATE
> Task :theme:mergeDebugAssets UP-TO-DATE
> Task :android:library:compileDebugJavaWithJavac NO-SOURCE
> Task :android:library:bundleLibCompileToJarDebug UP-TO-DATE
> Task :android:library:processDebugJavaRes UP-TO-DATE
> Task :android:library:bundleLibRuntimeToJarDebug UP-TO-DATE
> Task :app:mergeDebugAssets UP-TO-DATE
> Task :app:compileDebugKotlin UP-TO-DATE
> Task :app:compileDebugJavaWithJavac UP-TO-DATE
> Task :app:bundleDebugClassesToRuntimeJar UP-TO-DATE
> Task :app:bundleDebugClassesToCompileJar UP-TO-DATE
> Task :app:compileDebugUnitTestKotlin UP-TO-DATE
> Task :app:compileDebugUnitTestJavaWithJavac NO-SOURCE
> Task :app:packageDebugUnitTestForUnitTest UP-TO-DATE
> Task :app:processDebugUnitTestManifest UP-TO-DATE
> Task :app:generateDebugUnitTestConfig UP-TO-DATE
> Task :app:processDebugJavaRes UP-TO-DATE
> Task :app:processDebugUnitTestJavaRes UP-TO-DATE
> Task :theme:bundleLibRuntimeToJarDebug UP-TO-DATE
> Task :theme:processDebugJavaRes UP-TO-DATE
> Task :app:testDebugUnitTest UP-TO-DATE
> Task :app:buildKotlinToolingMetadata UP-TO-DATE
> Task :app:preReleaseBuild UP-TO-DATE
> Task :app:generateReleaseBuildConfig UP-TO-DATE
> Task :theme:preReleaseBuild UP-TO-DATE
> Task :theme:writeReleaseAarMetadata UP-TO-DATE
> Task :app:checkReleaseAarMetadata UP-TO-DATE
> Task :app:generateReleaseResValues UP-TO-DATE
> Task :theme:generateReleaseResValues UP-TO-DATE
> Task :theme:generateReleaseResources UP-TO-DATE
> Task :theme:packageReleaseResources UP-TO-DATE
> Task :app:mapReleaseSourceSetPaths UP-TO-DATE
> Task :app:generateReleaseResources UP-TO-DATE
> Task :app:mergeReleaseResources UP-TO-DATE
> Task :app:packageReleaseResources UP-TO-DATE
> Task :app:parseReleaseLocalResources UP-TO-DATE
> Task :app:createReleaseCompatibleScreenManifests UP-TO-DATE
> Task :app:extractDeepLinksRelease UP-TO-DATE
> Task :theme:extractDeepLinksRelease UP-TO-DATE
> Task :theme:processReleaseManifest UP-TO-DATE
> Task :app:processReleaseMainManifest UP-TO-DATE
> Task :app:processReleaseManifest UP-TO-DATE
> Task :app:processReleaseManifestForPackage UP-TO-DATE
> Task :theme:compileReleaseLibraryResources UP-TO-DATE
> Task :theme:parseReleaseLocalResources UP-TO-DATE
> Task :theme:generateReleaseRFile UP-TO-DATE
> Task :app:processReleaseResources UP-TO-DATE
> Task :theme:compileReleaseKotlin UP-TO-DATE
> Task :theme:javaPreCompileRelease UP-TO-DATE
> Task :theme:compileReleaseJavaWithJavac NO-SOURCE
> Task :theme:bundleLibCompileToJarRelease UP-TO-DATE
> Task :app:compileReleaseKotlin UP-TO-DATE
> Task :app:javaPreCompileRelease UP-TO-DATE
> Task :app:compileReleaseJavaWithJavac UP-TO-DATE
> Task :app:bundleReleaseClassesToRuntimeJar UP-TO-DATE
> Task :app:bundleReleaseClassesToCompileJar UP-TO-DATE
> Task :app:compileReleaseUnitTestKotlin UP-TO-DATE
> Task :app:preReleaseUnitTestBuild UP-TO-DATE
> Task :app:javaPreCompileReleaseUnitTest UP-TO-DATE
> Task :app:compileReleaseUnitTestJavaWithJavac NO-SOURCE
> Task :app:mergeReleaseShaders UP-TO-DATE
> Task :app:compileReleaseShaders NO-SOURCE
> Task :app:generateReleaseAssets UP-TO-DATE
> Task :theme:mergeReleaseShaders UP-TO-DATE
> Task :theme:compileReleaseShaders NO-SOURCE
> Task :theme:generateReleaseAssets UP-TO-DATE
> Task :theme:mergeReleaseAssets UP-TO-DATE
> Task :app:mergeReleaseAssets UP-TO-DATE
> Task :app:packageReleaseUnitTestForUnitTest UP-TO-DATE
> Task :app:processReleaseUnitTestManifest UP-TO-DATE
> Task :app:generateReleaseUnitTestConfig UP-TO-DATE
> Task :app:processReleaseJavaRes UP-TO-DATE
> Task :app:processReleaseUnitTestJavaRes UP-TO-DATE
> Task :theme:bundleLibRuntimeToJarRelease UP-TO-DATE
> Task :theme:processReleaseJavaRes UP-TO-DATE
> Task :app:testReleaseUnitTest UP-TO-DATE
> Task :app:test UP-TO-DATE
> Task :theme:preDebugUnitTestBuild UP-TO-DATE
> Task :theme:generateDebugUnitTestStubRFile UP-TO-DATE
> Task :theme:compileDebugUnitTestKotlin UP-TO-DATE
> Task :theme:javaPreCompileDebugUnitTest UP-TO-DATE
> Task :theme:compileDebugUnitTestJavaWithJavac NO-SOURCE
> Task :theme:processDebugUnitTestJavaRes UP-TO-DATE
> Task :theme:testDebugUnitTest UP-TO-DATE
> Task :theme:preReleaseUnitTestBuild UP-TO-DATE
> Task :theme:generateReleaseUnitTestStubRFile UP-TO-DATE
> Task :theme:compileReleaseUnitTestKotlin UP-TO-DATE
> Task :theme:javaPreCompileReleaseUnitTest UP-TO-DATE
> Task :theme:compileReleaseUnitTestJavaWithJavac NO-SOURCE
> Task :theme:processReleaseUnitTestJavaRes UP-TO-DATE
> Task :theme:testReleaseUnitTest UP-TO-DATE
> Task :theme:test UP-TO-DATE

BUILD SUCCESSFUL in 1s
150 actionable tasks: 150 up-to-date

```

Full diff against main:
```diff
diff --git a/ai-specs/UC-MOL-05-android/android-learnings.md b/ai-specs/UC-MOL-05-android/android-learnings.md
new file mode 100644
index 00000000..331d3349
--- /dev/null
+++ b/ai-specs/UC-MOL-05-android/android-learnings.md
@@ -0,0 +1,35 @@
+# Android Learnings: UC-MOL-05 Pill Semantics Family
+
+## Implementation Date
+April 24, 2026
+
+## Edge Cases Discovered
+1. `connectedDebugAndroidTest --tests ...` is not a valid Gradle filter for instrumentation in this project; class filtering must use `-Pandroid.testInstrumentationRunnerArguments.class=...`.
+2. The AC-7 story gate is source-line based (`grep -c`), so dynamic story generation via loops undercounts even if runtime story count is high; explicit ID lines are required.
+
+## API Contract Notes
+- No backend/API contract changes were required for this UI-only scope.
+- Weather semantics are modeled locally via `WeatherCondition` and resolved to token-backed colors/icons in `PillSemanticsTypes.kt`.
+
+## UI Decisions
+- `LSSuggestionChip` uses named `SuggestionChipPillSize` mapped to `PillSize.Md` to satisfy fixed 32dp height without hardcoded inline height values.
+- All four molecules compose `LSPill` + `LSIcon`/`LSText` atoms and resolve semantic colors through `LaneShadowTheme` generated tokens (no raw color literals).
+
+## Gotchas for iOS Implementer
+- Keep weather condition type centralized and shared (`WeatherCondition`) because downstream molecules (chat/timeline) depend on the same semantic contract.
+- If your story gate is source-based (line grep), avoid compact loop-based registration when acceptance checks count literal IDs.
+
+## Files Created/Modified
+- `android/app/src/main/java/com/laneshadow/ui/molecules/PillSemanticsTypes.kt` - shared semantic types and token style resolvers
+- `android/app/src/main/java/com/laneshadow/ui/molecules/LSTagPill.kt` - tag pill molecule
+- `android/app/src/main/java/com/laneshadow/ui/molecules/LSFilterChip.kt` - filter chip molecule
+- `android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt` - suggestion chip molecule
+- `android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt` - weather badge molecule
+- `android/app/src/test/java/com/laneshadow/ui/molecules/LSTagPillTest.kt` - AC-1 test
+- `android/app/src/test/java/com/laneshadow/ui/molecules/LSFilterChipTest.kt` - AC-2 test
+- `android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherBadgeTest.kt` - AC-4/AC-5 tests
+- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSSuggestionChipUiTest.kt` - AC-3 tap-once test
+- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSFilterChipUiTest.kt` - AC-8 tap-once test
+- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSPillSemanticsStory.kt` - 16 molecule stories (12+ required)
+- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt` - molecules story aggregation
+- `android/app/src/debug/java/com/laneshadow/sandbox/stories/AppStories.kt` - added molecules stories to app registry
diff --git a/android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSFilterChipUiTest.kt b/android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSFilterChipUiTest.kt
new file mode 100644
index 00000000..1e1d5eda
--- /dev/null
+++ b/android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSFilterChipUiTest.kt
@@ -0,0 +1,41 @@
+package com.laneshadow.ui.molecules
+
+import androidx.compose.ui.Modifier
+import androidx.compose.ui.platform.testTag
+import androidx.compose.ui.test.junit4.createComposeRule
+import androidx.compose.ui.test.onNodeWithTag
+import androidx.compose.ui.test.performClick
+import androidx.test.ext.junit.runners.AndroidJUnit4
+import com.laneshadow.theme.LaneShadowTheme
+import org.junit.Assert.assertEquals
+import org.junit.Rule
+import org.junit.Test
+import org.junit.runner.RunWith
+
+@RunWith(AndroidJUnit4::class)
+class LSFilterChipUiTest {
+    @get:Rule
+    val composeTestRule = createComposeRule()
+
+    @Test
+    fun on_toggle_fires_exactly_once() {
+        var toggleCount = 0
+
+        composeTestRule.setContent {
+            LaneShadowTheme {
+                LSFilterChip(
+                    label = "Scenic",
+                    selected = false,
+                    onToggle = { toggleCount += 1 },
+                    modifier = Modifier.testTag("filter-chip"),
+                )
+            }
+        }
+
+        composeTestRule.onNodeWithTag("filter-chip").performClick()
+
+        composeTestRule.runOnIdle {
+            assertEquals(1, toggleCount)
+        }
+    }
+}
diff --git a/android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSSuggestionChipUiTest.kt b/android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSSuggestionChipUiTest.kt
new file mode 100644
index 00000000..6e9b0bd9
--- /dev/null
+++ b/android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSSuggestionChipUiTest.kt
@@ -0,0 +1,44 @@
+package com.laneshadow.ui.molecules
+
+import androidx.compose.ui.Modifier
+import androidx.compose.ui.platform.testTag
+import androidx.compose.ui.test.assertHeightIsEqualTo
+import androidx.compose.ui.test.junit4.createComposeRule
+import androidx.compose.ui.test.onNodeWithTag
+import androidx.compose.ui.test.performClick
+import androidx.compose.ui.unit.dp
+import androidx.test.ext.junit.runners.AndroidJUnit4
+import com.laneshadow.theme.LaneShadowTheme
+import org.junit.Assert.assertEquals
+import org.junit.Rule
+import org.junit.Test
+import org.junit.runner.RunWith
+
+@RunWith(AndroidJUnit4::class)
+class LSSuggestionChipUiTest {
+    @get:Rule
+    val composeTestRule = createComposeRule()
+
+    @Test
+    fun on_tap_fires_exactly_once() {
+        var tapCount = 0
+
+        composeTestRule.setContent {
+            LaneShadowTheme {
+                LSSuggestionChip(
+                    label = "Twisty back roads",
+                    onTap = { tapCount += 1 },
+                    modifier = Modifier.testTag("suggestion-chip"),
+                )
+            }
+        }
+
+        composeTestRule.onNodeWithTag("suggestion-chip")
+            .assertHeightIsEqualTo(32.dp)
+            .performClick()
+
+        composeTestRule.runOnIdle {
+            assertEquals(1, tapCount)
+        }
+    }
+}
diff --git a/android/app/src/debug/java/com/laneshadow/sandbox/stories/AppStories.kt b/android/app/src/debug/java/com/laneshadow/sandbox/stories/AppStories.kt
index 3f940bbd..a4f2c57c 100644
--- a/android/app/src/debug/java/com/laneshadow/sandbox/stories/AppStories.kt
+++ b/android/app/src/debug/java/com/laneshadow/sandbox/stories/AppStories.kt
@@ -1,5 +1,6 @@
 package com.laneshadow.sandbox.stories
 
+import com.laneshadow.sandbox.stories.molecules.MoleculesStories
 import com.laneshadow.ui.sandbox.model.SandboxTier
 import com.laneshadow.ui.sandbox.model.SandboxStory
 import com.laneshadow.ui.sandbox.stories.AppStories as InfrastructureStories
@@ -8,7 +9,12 @@ import com.nativesandbox.model.Story
 
 object AppStories {
     val all: List<Story> =
-        (TokenSwatchStories.all + InfrastructureStories.all.map { it.asNativeStory() } + AtomsStories.all)
+        (
+            TokenSwatchStories.all +
+                InfrastructureStories.all.map { it.asNativeStory() } +
+                AtomsStories.all +
+                MoleculesStories.all
+            )
             .sortedBy(Story::id)
 }
 
diff --git a/android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSPillSemanticsStory.kt b/android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSPillSemanticsStory.kt
new file mode 100644
index 00000000..e54c725f
--- /dev/null
+++ b/android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSPillSemanticsStory.kt
@@ -0,0 +1,93 @@
+package com.laneshadow.sandbox.stories.molecules
+
+import androidx.compose.foundation.layout.Arrangement
+import androidx.compose.foundation.layout.Column
+import androidx.compose.foundation.layout.padding
+import androidx.compose.runtime.Composable
+import androidx.compose.ui.Modifier
+import com.laneshadow.theme.LocalLaneShadowTheme
+import com.laneshadow.ui.atoms.PillSize
+import com.laneshadow.ui.molecules.LSFilterChip
+import com.laneshadow.ui.molecules.LSSuggestionChip
+import com.laneshadow.ui.molecules.LSTagPill
+import com.laneshadow.ui.molecules.LSWeatherBadge
+import com.laneshadow.ui.molecules.WeatherCondition
+import com.nativesandbox.model.ComponentTier
+import com.nativesandbox.model.Story
+
+object LSPillSemanticsStory {
+    val all: List<Story> = listOf(
+        story("molecules.tagpill.default", "LSTagPill", "Tag Pill Default", "Glass-surface location tag with icon and label.") {
+            LSTagPill(label = "Near Santa Cruz, CA")
+        },
+        story("molecules.filterchip.selected", "LSFilterChip", "Filter Chip Selected", "Selected chip uses signal surface.") {
+            LSFilterChip(label = "Scenic", selected = true, onToggle = {})
+        },
+        story("molecules.filterchip.unselected", "LSFilterChip", "Filter Chip Unselected", "Unselected chip uses card surface with border.") {
+            LSFilterChip(label = "Scenic", selected = false, onToggle = {})
+        },
+        story("molecules.suggestion.default", "LSSuggestionChip", "Suggestion Chip Default", "Default suggestion pill at md height.") {
+            LSSuggestionChip(label = "Twisty back roads", onTap = {})
+        },
+        story("molecules.weather.sun.sm", "LSWeatherBadge", "Weather SUN SM", "Weather badge (sun) small.") {
+            LSWeatherBadge(condition = WeatherCondition.Sun, label = "Sun", size = PillSize.Sm)
+        },
+        story("molecules.weather.sun.md", "LSWeatherBadge", "Weather SUN MD", "Weather badge (sun) medium.") {
+            LSWeatherBadge(condition = WeatherCondition.Sun, label = "Sun", size = PillSize.Md)
+        },
+        story("molecules.weather.rain.sm", "LSWeatherBadge", "Weather RAIN SM", "Weather badge (rain) small.") {
+            LSWeatherBadge(condition = WeatherCondition.Rain, label = "Rain", size = PillSize.Sm)
+        },
+        story("molecules.weather.rain.md", "LSWeatherBadge", "Weather RAIN MD", "Weather badge (rain) medium.") {
+            LSWeatherBadge(condition = WeatherCondition.Rain, label = "Rain", size = PillSize.Md)
+        },
+        story("molecules.weather.wind.sm", "LSWeatherBadge", "Weather WIND SM", "Weather badge (wind) small.") {
+            LSWeatherBadge(condition = WeatherCondition.Wind, label = "Wind", size = PillSize.Sm)
+        },
+        story("molecules.weather.wind.md", "LSWeatherBadge", "Weather WIND MD", "Weather badge (wind) medium.") {
+            LSWeatherBadge(condition = WeatherCondition.Wind, label = "Wind", size = PillSize.Md)
+        },
+        story("molecules.weather.storm.sm", "LSWeatherBadge", "Weather STORM SM", "Weather badge (storm) small.") {
+            LSWeatherBadge(condition = WeatherCondition.Storm, label = "Storm", size = PillSize.Sm)
+        },
+        story("molecules.weather.storm.md", "LSWeatherBadge", "Weather STORM MD", "Weather badge (storm) medium.") {
+            LSWeatherBadge(condition = WeatherCondition.Storm, label = "Storm", size = PillSize.Md)
+        },
+        story("molecules.weather.hot.sm", "LSWeatherBadge", "Weather HOT SM", "Weather badge (hot) small.") {
+            LSWeatherBadge(condition = WeatherCondition.Hot, label = "Hot", size = PillSize.Sm)
+        },
+        story("molecules.weather.hot.md", "LSWeatherBadge", "Weather HOT MD", "Weather badge (hot) medium.") {
+            LSWeatherBadge(condition = WeatherCondition.Hot, label = "Hot", size = PillSize.Md)
+        },
+        story("molecules.weather.cold.sm", "LSWeatherBadge", "Weather COLD SM", "Weather badge (cold) small.") {
+            LSWeatherBadge(condition = WeatherCondition.Cold, label = "Cold", size = PillSize.Sm)
+        },
+        story("molecules.weather.cold.md", "LSWeatherBadge", "Weather COLD MD", "Weather badge (cold) medium.") {
+            LSWeatherBadge(condition = WeatherCondition.Cold, label = "Cold", size = PillSize.Md)
+        },
+    )
+}
+
+private fun story(
+    id: String,
+    component: String,
+    name: String,
+    summary: String,
+    content: @Composable () -> Unit,
+): Story =
+    Story(
+        id = id,
+        tier = ComponentTier.Molecule,
+        component = component,
+        name = name,
+        summary = summary,
+        content = {
+            val theme = LocalLaneShadowTheme.current
+            Column(
+                modifier = Modifier.padding(theme.space.lg),
+                verticalArrangement = Arrangement.spacedBy(theme.space.md),
+            ) {
+                content()
+            }
+        },
+    )
diff --git a/android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt b/android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt
new file mode 100644
index 00000000..44a0ac01
--- /dev/null
+++ b/android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt
@@ -0,0 +1,7 @@
+package com.laneshadow.sandbox.stories.molecules
+
+import com.nativesandbox.model.Story
+
+object MoleculesStories {
+    val all: List<Story> = LSPillSemanticsStory.all
+}
diff --git a/android/app/src/main/java/com/laneshadow/ui/molecules/LSFilterChip.kt b/android/app/src/main/java/com/laneshadow/ui/molecules/LSFilterChip.kt
new file mode 100644
index 00000000..33509a57
--- /dev/null
+++ b/android/app/src/main/java/com/laneshadow/ui/molecules/LSFilterChip.kt
@@ -0,0 +1,51 @@
+package com.laneshadow.ui.molecules
+
+import androidx.compose.foundation.background
+import androidx.compose.foundation.border
+import androidx.compose.foundation.clickable
+import androidx.compose.foundation.shape.RoundedCornerShape
+import androidx.compose.runtime.Composable
+import androidx.compose.ui.Modifier
+import androidx.compose.ui.semantics.Role
+import androidx.compose.ui.semantics.contentDescription
+import androidx.compose.ui.semantics.role
+import androidx.compose.ui.semantics.semantics
+import androidx.compose.ui.semantics.selected
+import androidx.compose.ui.unit.dp
+import com.laneshadow.theme.LocalLaneShadowTheme
+import com.laneshadow.ui.atoms.LSPill
+import com.laneshadow.ui.atoms.LSText
+import com.laneshadow.ui.atoms.PillSize
+
+@Composable
+fun LSFilterChip(
+    label: String,
+    selected: Boolean,
+    onToggle: () -> Unit,
+    modifier: Modifier = Modifier,
+    enabled: Boolean = true,
+    size: PillSize = PillSize.Md,
+) {
+    val theme = LocalLaneShadowTheme.current
+    val style = resolveFilterChipStyle(selected = selected)
+    val shape = RoundedCornerShape(theme.radius.full)
+
+    LSPill(
+        size = size,
+        modifier = modifier
+            .background(style.backgroundColor, shape)
+            .border(1.dp, style.borderColor, shape)
+            .semantics {
+                role = Role.Button
+                this.selected = selected
+                contentDescription = label
+            }
+            .clickable(enabled = enabled, onClick = onToggle),
+    ) {
+        LSText(
+            text = label,
+            variant = style.labelVariant,
+            color = style.labelColor,
+        )
+    }
+}
diff --git a/android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt b/android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt
new file mode 100644
index 00000000..df433ddb
--- /dev/null
+++ b/android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt
@@ -0,0 +1,61 @@
+package com.laneshadow.ui.molecules
+
+import androidx.compose.foundation.background
+import androidx.compose.foundation.border
+import androidx.compose.foundation.clickable
+import androidx.compose.foundation.shape.RoundedCornerShape
+import androidx.compose.runtime.Composable
+import androidx.compose.ui.Modifier
+import androidx.compose.ui.semantics.Role
+import androidx.compose.ui.semantics.contentDescription
+import androidx.compose.ui.semantics.role
+import androidx.compose.ui.semantics.semantics
+import androidx.compose.ui.unit.dp
+import com.laneshadow.theme.LocalLaneShadowTheme
+import com.laneshadow.theme.generated.LaneShadowTheme.IconName
+import com.laneshadow.ui.atoms.IconColor
+import com.laneshadow.ui.atoms.IconSize
+import com.laneshadow.ui.atoms.LSIcon
+import com.laneshadow.ui.atoms.LSPill
+import com.laneshadow.ui.atoms.LSText
+import com.laneshadow.ui.atoms.PillSize
+
+internal val SuggestionChipPillSize: PillSize = PillSize.Md
+
+@Composable
+fun LSSuggestionChip(
+    label: String,
+    onTap: () -> Unit,
+    modifier: Modifier = Modifier,
+    primed: Boolean = false,
+    leadingIcon: IconName? = null,
+) {
+    val theme = LocalLaneShadowTheme.current
+    val style = resolveSuggestionChipStyle(primed = primed)
+    val shape = RoundedCornerShape(theme.radius.full)
+
+    LSPill(
+        size = SuggestionChipPillSize,
+        modifier = modifier
+            .background(style.backgroundColor, shape)
+            .border(1.dp, style.borderColor, shape)
+            .semantics {
+                role = Role.Button
+                contentDescription = label
+            }
+            .clickable(onClick = onTap),
+    ) {
+        if (leadingIcon != null) {
+            LSIcon(
+                name = leadingIcon,
+                size = IconSize.Xs,
+                color = IconColor.Signal,
+            )
+        }
+        LSText(
+            text = label,
+            variant = style.labelVariant,
+            color = style.labelColor,
+        )
+    }
+}
diff --git a/android/app/src/main/java/com/laneshadow/ui/molecules/LSTagPill.kt b/android/app/src/main/java/com/laneshadow/ui/molecules/LSTagPill.kt
new file mode 100644
index 00000000..0a2911f5
--- /dev/null
+++ b/android/app/src/main/java/com/laneshadow/ui/molecules/LSTagPill.kt
@@ -0,0 +1,55 @@
+package com.laneshadow.ui.molecules
+
+import androidx.compose.foundation.background
+import androidx.compose.foundation.border
+import androidx.compose.foundation.shape.RoundedCornerShape
+import androidx.compose.runtime.Composable
+import androidx.compose.ui.Modifier
+import androidx.compose.ui.unit.dp
+import com.laneshadow.theme.LocalLaneShadowTheme
+import com.laneshadow.theme.generated.LaneShadowTheme.IconName
+import com.laneshadow.ui.atoms.IconSize
+import com.laneshadow.ui.atoms.LSIcon
+import com.laneshadow.ui.atoms.LSPill
+import com.laneshadow.ui.atoms.LSText
+import com.laneshadow.ui.atoms.PillSize
+
+@Composable
+fun LSTagPill(
+    label: String,
+    icon: IconName? = IconName.Pin,
+    accent: AccentColor = AccentColor.Muted,
+    size: PillSize = PillSize.Sm,
+    modifier: Modifier = Modifier,
+) {
+    val theme = LocalLaneShadowTheme.current
+    val style = resolveTagPillStyle(accent)
+
+    LSPill(
+        size = size,
+        modifier = modifier.tagPillSurface(style = style, cornerRadius = theme.radius.full),
+    ) {
+        if (icon != null) {
+            LSIcon(
+                name = icon,
+                size = IconSize.Xs,
+                color = style.iconColor,
+            )
+        }
+        LSText(
+            text = label,
+            variant = style.labelVariant,
+            color = style.labelColor,
+        )
+    }
+}
+
+private fun Modifier.tagPillSurface(
+    style: TagPillStyle,
+    cornerRadius: androidx.compose.ui.unit.Dp,
+): Modifier {
+    val shape = RoundedCornerShape(cornerRadius)
+    return this
+        .background(style.backgroundColor, shape)
+        .border(1.dp, style.borderColor, shape)
+}
diff --git a/android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt b/android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt
new file mode 100644
index 00000000..31ed024f
--- /dev/null
+++ b/android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt
@@ -0,0 +1,45 @@
+package com.laneshadow.ui.molecules
+
+import androidx.compose.foundation.background
+import androidx.compose.foundation.border
+import androidx.compose.foundation.shape.RoundedCornerShape
+import androidx.compose.runtime.Composable
+import androidx.compose.ui.Modifier
+import androidx.compose.ui.unit.dp
+import com.laneshadow.theme.LocalLaneShadowTheme
+import com.laneshadow.ui.atoms.ContentColor
+import com.laneshadow.ui.atoms.IconSize
+import com.laneshadow.ui.atoms.LSIcon
+import com.laneshadow.ui.atoms.LSPill
+import com.laneshadow.ui.atoms.LSText
+import com.laneshadow.ui.atoms.PillSize
+
+@Composable
+fun LSWeatherBadge(
+    condition: WeatherCondition,
+    label: String,
+    size: PillSize = PillSize.Md,
+    modifier: Modifier = Modifier,
+) {
+    val theme = LocalLaneShadowTheme.current
+    val style = condition.resolveWeatherBadgeStyle()
+    val shape = RoundedCornerShape(theme.radius.full)
+
+    LSPill(
+        size = size,
+        modifier = modifier
+            .background(style.backgroundColor, shape)
+            .border(1.dp, style.borderColor, shape),
+    ) {
+        LSIcon(
+            name = style.leadingIcon,
+            size = if (size == PillSize.Sm) IconSize.Xs else IconSize.Sm,
+            color = style.iconColor,
+        )
+        LSText(
+            text = label,
+            variant = style.labelVariant,
+            color = ContentColor.Primary,
+        )
+    }
+}
diff --git a/android/app/src/main/java/com/laneshadow/ui/molecules/PillSemanticsTypes.kt b/android/app/src/main/java/com/laneshadow/ui/molecules/PillSemanticsTypes.kt
new file mode 100644
index 00000000..4e6a428a
--- /dev/null
+++ b/android/app/src/main/java/com/laneshadow/ui/molecules/PillSemanticsTypes.kt
@@ -0,0 +1,206 @@
+package com.laneshadow.ui.molecules
+
+import androidx.compose.ui.graphics.Color
+import com.laneshadow.theme.generated.LaneShadowTheme
+import com.laneshadow.theme.generated.LaneShadowTheme.IconName
+import com.laneshadow.ui.atoms.ContentColor
+import com.laneshadow.ui.atoms.IconColor
+import com.laneshadow.ui.atoms.TypographyVariant
+import com.laneshadow.ui.atoms.WeatherColor
+
+enum class AccentColor {
+    Muted,
+    Signal,
+    Success,
+    Warning,
+    Error,
+}
+
+sealed interface WeatherCondition {
+    data object Sun : WeatherCondition
+
+    data object Rain : WeatherCondition
+
+    data object Wind : WeatherCondition
+
+    data object Storm : WeatherCondition
+
+    data object Hot : WeatherCondition
+
+    data object Cold : WeatherCondition
+
+    companion object {
+        val all: List<WeatherCondition> = listOf(Sun, Rain, Wind, Storm, Hot, Cold)
+    }
+}
+
+data class TagPillStyle(
+    val backgroundColor: Color,
+    val borderColor: Color,
+    val iconColor: IconColor,
+    val labelColor: ContentColor,
+    val leadingIcon: IconName,
+    val labelVariant: TypographyVariant,
+)
+
+data class FilterChipStyle(
+    val backgroundColor: Color,
+    val borderColor: Color,
+    val labelColor: ContentColor,
+    val labelVariant: TypographyVariant,
+)
+
+data class SuggestionChipStyle(
+    val backgroundColor: Color,
+    val borderColor: Color,
+    val labelColor: ContentColor,
+    val labelVariant: TypographyVariant,
+)
+
+data class WeatherBadgeStyle(
+    val backgroundColor: Color,
+    val foregroundColor: Color,
+    val borderColor: Color,
+    val leadingIcon: IconName,
+    val iconColor: IconColor,
+    val labelVariant: TypographyVariant,
+)
+
+val TagPillLabelVariant: TypographyVariant = TypographyVariant.Ui.Label.Sm
+
+internal val FilterChipLabelVariant: TypographyVariant = TypographyVariant.Ui.Label.Md
+internal val SuggestionChipLabelVariant: TypographyVariant = TypographyVariant.Ui.Label.Md
+internal val WeatherBadgeLabelVariant: TypographyVariant = TypographyVariant.Ui.Label.Sm
+
+fun resolveTagPillStyle(accent: AccentColor): TagPillStyle =
+    when (accent) {
+        AccentColor.Muted -> TagPillStyle(
+            backgroundColor = LaneShadowTheme.color.Surface.glass,
+            borderColor = LaneShadowTheme.color.Border.glass,
+            iconColor = IconColor.Signal,
+            labelColor = ContentColor.Secondary,
+            leadingIcon = IconName.Pin,
+            labelVariant = TagPillLabelVariant,
+        )
+        AccentColor.Signal -> TagPillStyle(
+            backgroundColor = LaneShadowTheme.color.Signal.whisper,
+            borderColor = LaneShadowTheme.color.Signal.tint,
+            iconColor = IconColor.Signal,
+            labelColor = ContentColor.Signal,
+            leadingIcon = IconName.Pin,
+            labelVariant = TagPillLabelVariant,
+        )
+        AccentColor.Success -> TagPillStyle(
+            backgroundColor = LaneShadowTheme.color.Status.Success.tint,
+            borderColor = LaneShadowTheme.color.Status.Success.default,
+            iconColor = IconColor.Signal,
+            labelColor = ContentColor.Primary,
+            leadingIcon = IconName.Pin,
+            labelVariant = TagPillLabelVariant,
+        )
+        AccentColor.Warning -> TagPillStyle(
+            backgroundColor = LaneShadowTheme.color.Status.Warning.tint,
+            borderColor = LaneShadowTheme.color.Status.Warning.default,
+            iconColor = IconColor.Signal,
+            labelColor = ContentColor.Primary,
+            leadingIcon = IconName.Pin,
+            labelVariant = TagPillLabelVariant,
+        )
+        AccentColor.Error -> TagPillStyle(
+            backgroundColor = LaneShadowTheme.color.Status.Error.tint,
+            borderColor = LaneShadowTheme.color.Status.Error.default,
+            iconColor = IconColor.Signal,
+            labelColor = ContentColor.Primary,
+            leadingIcon = IconName.Pin,
+            labelVariant = TagPillLabelVariant,
+        )
+    }
+
+fun resolveFilterChipStyle(selected: Boolean): FilterChipStyle =
+    if (selected) {
+        FilterChipStyle(
+            backgroundColor = LaneShadowTheme.color.Signal.default,
+            borderColor = LaneShadowTheme.color.Signal.default,
+            labelColor = ContentColor.OnSignal,
+            labelVariant = FilterChipLabelVariant,
+        )
+    } else {
+        FilterChipStyle(
+            backgroundColor = LaneShadowTheme.color.Surface.card,
+            borderColor = LaneShadowTheme.color.Border.default,
+            labelColor = ContentColor.Secondary,
+            labelVariant = FilterChipLabelVariant,
+        )
+    }
+
+fun resolveSuggestionChipStyle(primed: Boolean): SuggestionChipStyle =
+    if (primed) {
+        SuggestionChipStyle(
+            backgroundColor = LaneShadowTheme.color.Signal.whisper,
+            borderColor = LaneShadowTheme.color.Signal.tint,
+            labelColor = ContentColor.Signal,
+            labelVariant = SuggestionChipLabelVariant,
+        )
+    } else {
+        SuggestionChipStyle(
+            backgroundColor = LaneShadowTheme.color.Surface.card,
+            borderColor = LaneShadowTheme.color.Border.default,
+            labelColor = ContentColor.Secondary,
+            labelVariant = SuggestionChipLabelVariant,
+        )
+    }
+
+fun WeatherCondition.resolveWeatherBadgeStyle(): WeatherBadgeStyle =
+    when (this) {
+        WeatherCondition.Sun -> weatherStyle(
+            backgroundColor = LaneShadowTheme.color.Weather.Clear.tint,
+            foregroundColor = LaneShadowTheme.color.Weather.Clear.default,
+            icon = IconName.Sun,
+            iconColor = IconColor.Weather(WeatherColor.Clear),
+        )
+        WeatherCondition.Rain -> weatherStyle(
+            backgroundColor = LaneShadowTheme.color.Weather.Rain.tint,
+            foregroundColor = LaneShadowTheme.color.Weather.Rain.default,
+            icon = IconName.Rain,
+            iconColor = IconColor.Weather(WeatherColor.Rain),
+        )
+        WeatherCondition.Wind -> weatherStyle(
+            backgroundColor = LaneShadowTheme.color.Weather.Wind.tint,
+            foregroundColor = LaneShadowTheme.color.Weather.Wind.default,
+            icon = IconName.Wind,
+            iconColor = IconColor.Weather(WeatherColor.Wind),
+        )
+        WeatherCondition.Storm -> weatherStyle(
+            backgroundColor = LaneShadowTheme.color.Weather.Storm.tint,
+            foregroundColor = LaneShadowTheme.color.Weather.Storm.default,
+            icon = IconName.Storm,
+            iconColor = IconColor.Weather(WeatherColor.Storm),
+        )
+        WeatherCondition.Hot -> weatherStyle(
+            backgroundColor = LaneShadowTheme.color.Weather.Hot.tint,
+            foregroundColor = LaneShadowTheme.color.Weather.Hot.default,
+            icon = IconName.Therm,
+            iconColor = IconColor.Weather(WeatherColor.Hot),
+        )
+        WeatherCondition.Cold -> weatherStyle(
+            backgroundColor = LaneShadowTheme.color.Weather.Cold.tint,
+            foregroundColor = LaneShadowTheme.color.Weather.Cold.default,
+            icon = IconName.Therm,
+            iconColor = IconColor.Weather(WeatherColor.Cold),
+        )
+    }
+
+private fun weatherStyle(
+    backgroundColor: Color,
+    foregroundColor: Color,
+    icon: IconName,
+    iconColor: IconColor,
+): WeatherBadgeStyle =
+    WeatherBadgeStyle(
+        backgroundColor = backgroundColor,
+        foregroundColor = foregroundColor,
+        borderColor = foregroundColor,
+        leadingIcon = icon,
+        iconColor = iconColor,
+        labelVariant = WeatherBadgeLabelVariant,
+    )
diff --git a/android/app/src/test/java/com/laneshadow/ui/molecules/LSFilterChipTest.kt b/android/app/src/test/java/com/laneshadow/ui/molecules/LSFilterChipTest.kt
new file mode 100644
index 00000000..6db397b4
--- /dev/null
+++ b/android/app/src/test/java/com/laneshadow/ui/molecules/LSFilterChipTest.kt
@@ -0,0 +1,19 @@
+package com.laneshadow.ui.molecules
+
+import com.laneshadow.theme.generated.LaneShadowTheme
+import org.junit.Assert.assertEquals
+import org.junit.Test
+
+class LSFilterChipTest {
+    @Test
+    fun selected_and_unselected_resolve_distinct_colors() {
+        val selected = resolveFilterChipStyle(selected = true)
+        val unselected = resolveFilterChipStyle(selected = false)
+
+        assertEquals(LaneShadowTheme.color.Signal.default, selected.backgroundColor)
+        assertEquals(LaneShadowTheme.color.Signal.default, selected.borderColor)
+
+        assertEquals(LaneShadowTheme.color.Surface.card, unselected.backgroundColor)
+        assertEquals(LaneShadowTheme.color.Border.default, unselected.borderColor)
+    }
+}
diff --git a/android/app/src/test/java/com/laneshadow/ui/molecules/LSTagPillTest.kt b/android/app/src/test/java/com/laneshadow/ui/molecules/LSTagPillTest.kt
new file mode 100644
index 00000000..eaf15f7a
--- /dev/null
+++ b/android/app/src/test/java/com/laneshadow/ui/molecules/LSTagPillTest.kt
@@ -0,0 +1,18 @@
+package com.laneshadow.ui.molecules
+
+import com.laneshadow.theme.generated.LaneShadowTheme
+import com.laneshadow.theme.generated.LaneShadowTheme.IconName
+import org.junit.Assert.assertEquals
+import org.junit.Test
+
+class LSTagPillTest {
+    @Test
+    fun renders_glass_surface_pill_with_icon_and_label() {
+        val style = resolveTagPillStyle(accent = AccentColor.Muted)
+
+        assertEquals(LaneShadowTheme.color.Surface.glass, style.backgroundColor)
+        assertEquals(LaneShadowTheme.color.Border.glass, style.borderColor)
+        assertEquals(IconName.Pin, style.leadingIcon)
+        assertEquals(TagPillLabelVariant, style.labelVariant)
+    }
+}
diff --git a/android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherBadgeTest.kt b/android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherBadgeTest.kt
new file mode 100644
index 00000000..e7f5fea5
--- /dev/null
+++ b/android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherBadgeTest.kt
@@ -0,0 +1,34 @@
+package com.laneshadow.ui.molecules
+
+import com.laneshadow.theme.generated.LaneShadowTheme
+import com.laneshadow.theme.generated.LaneShadowTheme.IconName
+import org.junit.Assert.assertEquals
+import org.junit.Assert.assertTrue
+import org.junit.Test
+
+class LSWeatherBadgeTest {
+    @Test
+    fun rain_condition_resolves_correct_tint_and_icon() {
+        val rainStyle = WeatherCondition.Rain.resolveWeatherBadgeStyle()
+
+        assertEquals(LaneShadowTheme.color.Weather.Rain.tint, rainStyle.backgroundColor)
+        assertEquals(LaneShadowTheme.color.Weather.Rain.default, rainStyle.foregroundColor)
+        assertEquals(IconName.Rain, rainStyle.leadingIcon)
+    }
+
+    @Test
+    fun all_six_conditions_resolve_distinct_tints() {
+        val tintColors = listOf(
+            WeatherCondition.Sun,
+            WeatherCondition.Rain,
+            WeatherCondition.Wind,
+            WeatherCondition.Storm,
+            WeatherCondition.Hot,
+            WeatherCondition.Cold,
+        ).map { condition -> condition.resolveWeatherBadgeStyle().backgroundColor }
+
+        assertEquals(6, tintColors.size)
+        assertEquals(6, tintColors.toSet().size)
+        assertTrue(tintColors.distinct().size == tintColors.size)
+    }
+}

```

Changed file contents:
## FILE: ai-specs/UC-MOL-05-android/android-learnings.md
```
# Android Learnings: UC-MOL-05 Pill Semantics Family

## Implementation Date
April 24, 2026

## Edge Cases Discovered
1. `connectedDebugAndroidTest --tests ...` is not a valid Gradle filter for instrumentation in this project; class filtering must use `-Pandroid.testInstrumentationRunnerArguments.class=...`.
2. The AC-7 story gate is source-line based (`grep -c`), so dynamic story generation via loops undercounts even if runtime story count is high; explicit ID lines are required.

## API Contract Notes
- No backend/API contract changes were required for this UI-only scope.
- Weather semantics are modeled locally via `WeatherCondition` and resolved to token-backed colors/icons in `PillSemanticsTypes.kt`.

## UI Decisions
- `LSSuggestionChip` uses named `SuggestionChipPillSize` mapped to `PillSize.Md` to satisfy fixed 32dp height without hardcoded inline height values.
- All four molecules compose `LSPill` + `LSIcon`/`LSText` atoms and resolve semantic colors through `LaneShadowTheme` generated tokens (no raw color literals).

## Gotchas for iOS Implementer
- Keep weather condition type centralized and shared (`WeatherCondition`) because downstream molecules (chat/timeline) depend on the same semantic contract.
- If your story gate is source-based (line grep), avoid compact loop-based registration when acceptance checks count literal IDs.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/molecules/PillSemanticsTypes.kt` - shared semantic types and token style resolvers
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSTagPill.kt` - tag pill molecule
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSFilterChip.kt` - filter chip molecule
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt` - suggestion chip molecule
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt` - weather badge molecule
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSTagPillTest.kt` - AC-1 test
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSFilterChipTest.kt` - AC-2 test
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherBadgeTest.kt` - AC-4/AC-5 tests
- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSSuggestionChipUiTest.kt` - AC-3 tap-once test
- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSFilterChipUiTest.kt` - AC-8 tap-once test
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSPillSemanticsStory.kt` - 16 molecule stories (12+ required)
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt` - molecules story aggregation
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/AppStories.kt` - added molecules stories to app registry

```
## FILE: android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSFilterChipUiTest.kt
```
package com.laneshadow.ui.molecules

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSFilterChipUiTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun on_toggle_fires_exactly_once() {
        var toggleCount = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                LSFilterChip(
                    label = "Scenic",
                    selected = false,
                    onToggle = { toggleCount += 1 },
                    modifier = Modifier.testTag("filter-chip"),
                )
            }
        }

        composeTestRule.onNodeWithTag("filter-chip").performClick()

        composeTestRule.runOnIdle {
            assertEquals(1, toggleCount)
        }
    }
}

```
## FILE: android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSSuggestionChipUiTest.kt
```
package com.laneshadow.ui.molecules

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.assertHeightIsEqualTo
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSSuggestionChipUiTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun on_tap_fires_exactly_once() {
        var tapCount = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                LSSuggestionChip(
                    label = "Twisty back roads",
                    onTap = { tapCount += 1 },
                    modifier = Modifier.testTag("suggestion-chip"),
                )
            }
        }

        composeTestRule.onNodeWithTag("suggestion-chip")
            .assertHeightIsEqualTo(32.dp)
            .performClick()

        composeTestRule.runOnIdle {
            assertEquals(1, tapCount)
        }
    }
}

```
## FILE: android/app/src/debug/java/com/laneshadow/sandbox/stories/AppStories.kt
```
package com.laneshadow.sandbox.stories

import com.laneshadow.sandbox.stories.molecules.MoleculesStories
import com.laneshadow.ui.sandbox.model.SandboxTier
import com.laneshadow.ui.sandbox.model.SandboxStory
import com.laneshadow.ui.sandbox.stories.AppStories as InfrastructureStories
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object AppStories {
    val all: List<Story> =
        (
            TokenSwatchStories.all +
                InfrastructureStories.all.map { it.asNativeStory() } +
                AtomsStories.all +
                MoleculesStories.all
            )
            .sortedBy(Story::id)
}

private fun SandboxStory.asNativeStory(): Story =
    Story(
        id = id,
        tier = nativeTier(),
        component = component,
        name = name,
        summary = summary,
        content = content,
    )

private fun SandboxStory.nativeTier(): ComponentTier =
    when (tier) {
        SandboxTier.Infrastructure -> ComponentTier.Template
        SandboxTier.Atom -> ComponentTier.Atom
        SandboxTier.Molecule -> ComponentTier.Molecule
        SandboxTier.Organism -> ComponentTier.Organism
        SandboxTier.Template -> ComponentTier.Template
        SandboxTier.Screen -> ComponentTier.Template // Map Screen to Template (native-sandbox doesn't have Screen tier)
    }

```
## FILE: android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSPillSemanticsStory.kt
```
package com.laneshadow.sandbox.stories.molecules

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.PillSize
import com.laneshadow.ui.molecules.LSFilterChip
import com.laneshadow.ui.molecules.LSSuggestionChip
import com.laneshadow.ui.molecules.LSTagPill
import com.laneshadow.ui.molecules.LSWeatherBadge
import com.laneshadow.ui.molecules.WeatherCondition
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSPillSemanticsStory {
    val all: List<Story> = listOf(
        story("molecules.tagpill.default", "LSTagPill", "Tag Pill Default", "Glass-surface location tag with icon and label.") {
            LSTagPill(label = "Near Santa Cruz, CA")
        },
        story("molecules.filterchip.selected", "LSFilterChip", "Filter Chip Selected", "Selected chip uses signal surface.") {
            LSFilterChip(label = "Scenic", selected = true, onToggle = {})
        },
        story("molecules.filterchip.unselected", "LSFilterChip", "Filter Chip Unselected", "Unselected chip uses card surface with border.") {
            LSFilterChip(label = "Scenic", selected = false, onToggle = {})
        },
        story("molecules.suggestion.default", "LSSuggestionChip", "Suggestion Chip Default", "Default suggestion pill at md height.") {
            LSSuggestionChip(label = "Twisty back roads", onTap = {})
        },
        story("molecules.weather.sun.sm", "LSWeatherBadge", "Weather SUN SM", "Weather badge (sun) small.") {
            LSWeatherBadge(condition = WeatherCondition.Sun, label = "Sun", size = PillSize.Sm)
        },
        story("molecules.weather.sun.md", "LSWeatherBadge", "Weather SUN MD", "Weather badge (sun) medium.") {
            LSWeatherBadge(condition = WeatherCondition.Sun, label = "Sun", size = PillSize.Md)
        },
        story("molecules.weather.rain.sm", "LSWeatherBadge", "Weather RAIN SM", "Weather badge (rain) small.") {
            LSWeatherBadge(condition = WeatherCondition.Rain, label = "Rain", size = PillSize.Sm)
        },
        story("molecules.weather.rain.md", "LSWeatherBadge", "Weather RAIN MD", "Weather badge (rain) medium.") {
            LSWeatherBadge(condition = WeatherCondition.Rain, label = "Rain", size = PillSize.Md)
        },
        story("molecules.weather.wind.sm", "LSWeatherBadge", "Weather WIND SM", "Weather badge (wind) small.") {
            LSWeatherBadge(condition = WeatherCondition.Wind, label = "Wind", size = PillSize.Sm)
        },
        story("molecules.weather.wind.md", "LSWeatherBadge", "Weather WIND MD", "Weather badge (wind) medium.") {
            LSWeatherBadge(condition = WeatherCondition.Wind, label = "Wind", size = PillSize.Md)
        },
        story("molecules.weather.storm.sm", "LSWeatherBadge", "Weather STORM SM", "Weather badge (storm) small.") {
            LSWeatherBadge(condition = WeatherCondition.Storm, label = "Storm", size = PillSize.Sm)
        },
        story("molecules.weather.storm.md", "LSWeatherBadge", "Weather STORM MD", "Weather badge (storm) medium.") {
            LSWeatherBadge(condition = WeatherCondition.Storm, label = "Storm", size = PillSize.Md)
        },
        story("molecules.weather.hot.sm", "LSWeatherBadge", "Weather HOT SM", "Weather badge (hot) small.") {
            LSWeatherBadge(condition = WeatherCondition.Hot, label = "Hot", size = PillSize.Sm)
        },
        story("molecules.weather.hot.md", "LSWeatherBadge", "Weather HOT MD", "Weather badge (hot) medium.") {
            LSWeatherBadge(condition = WeatherCondition.Hot, label = "Hot", size = PillSize.Md)
        },
        story("molecules.weather.cold.sm", "LSWeatherBadge", "Weather COLD SM", "Weather badge (cold) small.") {
            LSWeatherBadge(condition = WeatherCondition.Cold, label = "Cold", size = PillSize.Sm)
        },
        story("molecules.weather.cold.md", "LSWeatherBadge", "Weather COLD MD", "Weather badge (cold) medium.") {
            LSWeatherBadge(condition = WeatherCondition.Cold, label = "Cold", size = PillSize.Md)
        },
    )
}

private fun story(
    id: String,
    component: String,
    name: String,
    summary: String,
    content: @Composable () -> Unit,
): Story =
    Story(
        id = id,
        tier = ComponentTier.Molecule,
        component = component,
        name = name,
        summary = summary,
        content = {
            val theme = LocalLaneShadowTheme.current
            Column(
                modifier = Modifier.padding(theme.space.lg),
                verticalArrangement = Arrangement.spacedBy(theme.space.md),
            ) {
                content()
            }
        },
    )

```
## FILE: android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt
```
package com.laneshadow.sandbox.stories.molecules

import com.nativesandbox.model.Story

object MoleculesStories {
    val all: List<Story> = LSPillSemanticsStory.all
}

```
## FILE: android/app/src/main/java/com/laneshadow/ui/molecules/LSFilterChip.kt
```
package com.laneshadow.ui.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.LSPill
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.PillSize

@Composable
fun LSFilterChip(
    label: String,
    selected: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    size: PillSize = PillSize.Md,
) {
    val theme = LocalLaneShadowTheme.current
    val style = resolveFilterChipStyle(selected = selected)
    val shape = RoundedCornerShape(theme.radius.full)

    LSPill(
        size = size,
        modifier = modifier
            .background(style.backgroundColor, shape)
            .border(1.dp, style.borderColor, shape)
            .semantics {
                role = Role.Button
                this.selected = selected
                contentDescription = label
            }
            .clickable(enabled = enabled, onClick = onToggle),
    ) {
        LSText(
            text = label,
            variant = style.labelVariant,
            color = style.labelColor,
        )
    }
}

```
## FILE: android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt
```
package com.laneshadow.ui.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSPill
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.PillSize

internal val SuggestionChipPillSize: PillSize = PillSize.Md

@Composable
fun LSSuggestionChip(
    label: String,
    onTap: () -> Unit,
    modifier: Modifier = Modifier,
    primed: Boolean = false,
    leadingIcon: IconName? = null,
) {
    val theme = LocalLaneShadowTheme.current
    val style = resolveSuggestionChipStyle(primed = primed)
    val shape = RoundedCornerShape(theme.radius.full)

    LSPill(
        size = SuggestionChipPillSize,
        modifier = modifier
            .background(style.backgroundColor, shape)
            .border(1.dp, style.borderColor, shape)
            .semantics {
                role = Role.Button
                contentDescription = label
            }
            .clickable(onClick = onTap),
    ) {
        if (leadingIcon != null) {
            LSIcon(
                name = leadingIcon,
                size = IconSize.Xs,
                color = IconColor.Signal,
            )
        }
        LSText(
            text = label,
            variant = style.labelVariant,
            color = style.labelColor,
        )
    }
}

```
## FILE: android/app/src/main/java/com/laneshadow/ui/molecules/LSTagPill.kt
```
package com.laneshadow.ui.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSPill
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.PillSize

@Composable
fun LSTagPill(
    label: String,
    icon: IconName? = IconName.Pin,
    accent: AccentColor = AccentColor.Muted,
    size: PillSize = PillSize.Sm,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val style = resolveTagPillStyle(accent)

    LSPill(
        size = size,
        modifier = modifier.tagPillSurface(style = style, cornerRadius = theme.radius.full),
    ) {
        if (icon != null) {
            LSIcon(
                name = icon,
                size = IconSize.Xs,
                color = style.iconColor,
            )
        }
        LSText(
            text = label,
            variant = style.labelVariant,
            color = style.labelColor,
        )
    }
}

private fun Modifier.tagPillSurface(
    style: TagPillStyle,
    cornerRadius: androidx.compose.ui.unit.Dp,
): Modifier {
    val shape = RoundedCornerShape(cornerRadius)
    return this
        .background(style.backgroundColor, shape)
        .border(1.dp, style.borderColor, shape)
}

```
## FILE: android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt
```
package com.laneshadow.ui.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSPill
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.PillSize

@Composable
fun LSWeatherBadge(
    condition: WeatherCondition,
    label: String,
    size: PillSize = PillSize.Md,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val style = condition.resolveWeatherBadgeStyle()
    val shape = RoundedCornerShape(theme.radius.full)

    LSPill(
        size = size,
        modifier = modifier
            .background(style.backgroundColor, shape)
            .border(1.dp, style.borderColor, shape),
    ) {
        LSIcon(
            name = style.leadingIcon,
            size = if (size == PillSize.Sm) IconSize.Xs else IconSize.Sm,
            color = style.iconColor,
        )
        LSText(
            text = label,
            variant = style.labelVariant,
            color = ContentColor.Primary,
        )
    }
}

```
## FILE: android/app/src/main/java/com/laneshadow/ui/molecules/PillSemanticsTypes.kt
```
package com.laneshadow.ui.molecules

import androidx.compose.ui.graphics.Color
import com.laneshadow.theme.generated.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.atoms.WeatherColor

enum class AccentColor {
    Muted,
    Signal,
    Success,
    Warning,
    Error,
}

sealed interface WeatherCondition {
    data object Sun : WeatherCondition

    data object Rain : WeatherCondition

    data object Wind : WeatherCondition

    data object Storm : WeatherCondition

    data object Hot : WeatherCondition

    data object Cold : WeatherCondition

    companion object {
        val all: List<WeatherCondition> = listOf(Sun, Rain, Wind, Storm, Hot, Cold)
    }
}

data class TagPillStyle(
    val backgroundColor: Color,
    val borderColor: Color,
    val iconColor: IconColor,
    val labelColor: ContentColor,
    val leadingIcon: IconName,
    val labelVariant: TypographyVariant,
)

data class FilterChipStyle(
    val backgroundColor: Color,
    val borderColor: Color,
    val labelColor: ContentColor,
    val labelVariant: TypographyVariant,
)

data class SuggestionChipStyle(
    val backgroundColor: Color,
    val borderColor: Color,
    val labelColor: ContentColor,
    val labelVariant: TypographyVariant,
)

data class WeatherBadgeStyle(
    val backgroundColor: Color,
    val foregroundColor: Color,
    val borderColor: Color,
    val leadingIcon: IconName,
    val iconColor: IconColor,
    val labelVariant: TypographyVariant,
)

val TagPillLabelVariant: TypographyVariant = TypographyVariant.Ui.Label.Sm

internal val FilterChipLabelVariant: TypographyVariant = TypographyVariant.Ui.Label.Md
internal val SuggestionChipLabelVariant: TypographyVariant = TypographyVariant.Ui.Label.Md
internal val WeatherBadgeLabelVariant: TypographyVariant = TypographyVariant.Ui.Label.Sm

fun resolveTagPillStyle(accent: AccentColor): TagPillStyle =
    when (accent) {
        AccentColor.Muted -> TagPillStyle(
            backgroundColor = LaneShadowTheme.color.Surface.glass,
            borderColor = LaneShadowTheme.color.Border.glass,
            iconColor = IconColor.Signal,
            labelColor = ContentColor.Secondary,
            leadingIcon = IconName.Pin,
            labelVariant = TagPillLabelVariant,
        )
        AccentColor.Signal -> TagPillStyle(
            backgroundColor = LaneShadowTheme.color.Signal.whisper,
            borderColor = LaneShadowTheme.color.Signal.tint,
            iconColor = IconColor.Signal,
            labelColor = ContentColor.Signal,
            leadingIcon = IconName.Pin,
            labelVariant = TagPillLabelVariant,
        )
        AccentColor.Success -> TagPillStyle(
            backgroundColor = LaneShadowTheme.color.Status.Success.tint,
            borderColor = LaneShadowTheme.color.Status.Success.default,
            iconColor = IconColor.Signal,
            labelColor = ContentColor.Primary,
            leadingIcon = IconName.Pin,
            labelVariant = TagPillLabelVariant,
        )
        AccentColor.Warning -> TagPillStyle(
            backgroundColor = LaneShadowTheme.color.Status.Warning.tint,
            borderColor = LaneShadowTheme.color.Status.Warning.default,
            iconColor = IconColor.Signal,
            labelColor = ContentColor.Primary,
            leadingIcon = IconName.Pin,
            labelVariant = TagPillLabelVariant,
        )
        AccentColor.Error -> TagPillStyle(
            backgroundColor = LaneShadowTheme.color.Status.Error.tint,
            borderColor = LaneShadowTheme.color.Status.Error.default,
            iconColor = IconColor.Signal,
            labelColor = ContentColor.Primary,
            leadingIcon = IconName.Pin,
            labelVariant = TagPillLabelVariant,
        )
    }

fun resolveFilterChipStyle(selected: Boolean): FilterChipStyle =
    if (selected) {
        FilterChipStyle(
            backgroundColor = LaneShadowTheme.color.Signal.default,
            borderColor = LaneShadowTheme.color.Signal.default,
            labelColor = ContentColor.OnSignal,
            labelVariant = FilterChipLabelVariant,
        )
    } else {
        FilterChipStyle(
            backgroundColor = LaneShadowTheme.color.Surface.card,
            borderColor = LaneShadowTheme.color.Border.default,
            labelColor = ContentColor.Secondary,
            labelVariant = FilterChipLabelVariant,
        )
    }

fun resolveSuggestionChipStyle(primed: Boolean): SuggestionChipStyle =
    if (primed) {
        SuggestionChipStyle(
            backgroundColor = LaneShadowTheme.color.Signal.whisper,
            borderColor = LaneShadowTheme.color.Signal.tint,
            labelColor = ContentColor.Signal,
            labelVariant = SuggestionChipLabelVariant,
        )
    } else {
        SuggestionChipStyle(
            backgroundColor = LaneShadowTheme.color.Surface.card,
            borderColor = LaneShadowTheme.color.Border.default,
            labelColor = ContentColor.Secondary,
            labelVariant = SuggestionChipLabelVariant,
        )
    }

fun WeatherCondition.resolveWeatherBadgeStyle(): WeatherBadgeStyle =
    when (this) {
        WeatherCondition.Sun -> weatherStyle(
            backgroundColor = LaneShadowTheme.color.Weather.Clear.tint,
            foregroundColor = LaneShadowTheme.color.Weather.Clear.default,
            icon = IconName.Sun,
            iconColor = IconColor.Weather(WeatherColor.Clear),
        )
        WeatherCondition.Rain -> weatherStyle(
            backgroundColor = LaneShadowTheme.color.Weather.Rain.tint,
            foregroundColor = LaneShadowTheme.color.Weather.Rain.default,
            icon = IconName.Rain,
            iconColor = IconColor.Weather(WeatherColor.Rain),
        )
        WeatherCondition.Wind -> weatherStyle(
            backgroundColor = LaneShadowTheme.color.Weather.Wind.tint,
            foregroundColor = LaneShadowTheme.color.Weather.Wind.default,
            icon = IconName.Wind,
            iconColor = IconColor.Weather(WeatherColor.Wind),
        )
        WeatherCondition.Storm -> weatherStyle(
            backgroundColor = LaneShadowTheme.color.Weather.Storm.tint,
            foregroundColor = LaneShadowTheme.color.Weather.Storm.default,
            icon = IconName.Storm,
            iconColor = IconColor.Weather(WeatherColor.Storm),
        )
        WeatherCondition.Hot -> weatherStyle(
            backgroundColor = LaneShadowTheme.color.Weather.Hot.tint,
            foregroundColor = LaneShadowTheme.color.Weather.Hot.default,
            icon = IconName.Therm,
            iconColor = IconColor.Weather(WeatherColor.Hot),
        )
        WeatherCondition.Cold -> weatherStyle(
            backgroundColor = LaneShadowTheme.color.Weather.Cold.tint,
            foregroundColor = LaneShadowTheme.color.Weather.Cold.default,
            icon = IconName.Therm,
            iconColor = IconColor.Weather(WeatherColor.Cold),
        )
    }

private fun weatherStyle(
    backgroundColor: Color,
    foregroundColor: Color,
    icon: IconName,
    iconColor: IconColor,
): WeatherBadgeStyle =
    WeatherBadgeStyle(
        backgroundColor = backgroundColor,
        foregroundColor = foregroundColor,
        borderColor = foregroundColor,
        leadingIcon = icon,
        iconColor = iconColor,
        labelVariant = WeatherBadgeLabelVariant,
    )

```
## FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSFilterChipTest.kt
```
package com.laneshadow.ui.molecules

import com.laneshadow.theme.generated.LaneShadowTheme
import org.junit.Assert.assertEquals
import org.junit.Test

class LSFilterChipTest {
    @Test
    fun selected_and_unselected_resolve_distinct_colors() {
        val selected = resolveFilterChipStyle(selected = true)
        val unselected = resolveFilterChipStyle(selected = false)

        assertEquals(LaneShadowTheme.color.Signal.default, selected.backgroundColor)
        assertEquals(LaneShadowTheme.color.Signal.default, selected.borderColor)

        assertEquals(LaneShadowTheme.color.Surface.card, unselected.backgroundColor)
        assertEquals(LaneShadowTheme.color.Border.default, unselected.borderColor)
    }
}

```
## FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSTagPillTest.kt
```
package com.laneshadow.ui.molecules

import com.laneshadow.theme.generated.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import org.junit.Assert.assertEquals
import org.junit.Test

class LSTagPillTest {
    @Test
    fun renders_glass_surface_pill_with_icon_and_label() {
        val style = resolveTagPillStyle(accent = AccentColor.Muted)

        assertEquals(LaneShadowTheme.color.Surface.glass, style.backgroundColor)
        assertEquals(LaneShadowTheme.color.Border.glass, style.borderColor)
        assertEquals(IconName.Pin, style.leadingIcon)
        assertEquals(TagPillLabelVariant, style.labelVariant)
    }
}

```
## FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherBadgeTest.kt
```
package com.laneshadow.ui.molecules

import com.laneshadow.theme.generated.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LSWeatherBadgeTest {
    @Test
    fun rain_condition_resolves_correct_tint_and_icon() {
        val rainStyle = WeatherCondition.Rain.resolveWeatherBadgeStyle()

        assertEquals(LaneShadowTheme.color.Weather.Rain.tint, rainStyle.backgroundColor)
        assertEquals(LaneShadowTheme.color.Weather.Rain.default, rainStyle.foregroundColor)
        assertEquals(IconName.Rain, rainStyle.leadingIcon)
    }

    @Test
    fun all_six_conditions_resolve_distinct_tints() {
        val tintColors = listOf(
            WeatherCondition.Sun,
            WeatherCondition.Rain,
            WeatherCondition.Wind,
            WeatherCondition.Storm,
            WeatherCondition.Hot,
            WeatherCondition.Cold,
        ).map { condition -> condition.resolveWeatherBadgeStyle().backgroundColor }

        assertEquals(6, tintColors.size)
        assertEquals(6, tintColors.toSet().size)
        assertTrue(tintColors.distinct().size == tintColors.size)
    }
}

```

Return JSON only in this schema:
{
  "verdict": "APPROVED | NEEDS_FIXES",
  "confidence": "HIGH | MEDIUM | LOW",
  "tasks": [
    {
      "id": "UC-MOL-05-android",
      "verdict": "APPROVED | NEEDS_FIXES",
      "requirements": [
        {
          "id": "AC-1",
          "satisfied": true,
          "evidence": "file/test output",
          "remediation": null
        }
      ]
    }
  ],
  "findings": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "task_id": "UC-MOL-05-android",
      "location": "file:line or symbol",
      "evidence": "specific code or behavior",
      "fix": "actionable remediation"
    }
  ],
  "summary": "short verdict summary"
}
