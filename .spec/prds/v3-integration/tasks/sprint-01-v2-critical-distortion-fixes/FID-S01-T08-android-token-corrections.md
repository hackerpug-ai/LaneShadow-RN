================================================================================
TASK: FID-S01-T08 - Android Remaining HIGH-Severity Token Corrections
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  test: cd android && ./gradlew test
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-5 not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Android LSRouteCard, LSRouteSheet, LSNavigatorMessage, and LSSectionHeader use correct semantic tokens: full-opacity pinned dot, Signal-colored heart, 9:4 map aspect ratio, dynamic timeRange, and baseline-aligned section headers.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST render pinned-indicator dot at full opacity using `theme.colors.signal.default` — NOT `primary.default` at 12% alpha
- MUST use `IconColor.Signal` (copper) for LSRouteCard saved-state heart — NOT `IconColor.Content(ContentColor.Primary)`
- MUST use `Modifier.aspectRatio(9f / 4f)` for LSRouteCard map preview — NOT hardcoded `mapPreviewHeight = 160`
- MUST derive LSRouteSheet weather timeline time range from actual data via `timeRange: Pair<String, String>` — NOT hardcoded "9am"/"3pm"
- MUST align LSSectionHeader text baselines across title and trailing action using `Modifier.align(Alignment.CenterVertically)`

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Pinned indicator dot renders at full opacity signal.default (AC-1 PRIMARY)
- [ ] LSRouteCard heart icon uses IconColor.Signal copper (AC-2)
- [ ] LSRouteCard map preview uses aspectRatio(9f/4f) (AC-3)
- [ ] LSRouteSheet weather time range derived from data (AC-4)
- [ ] LSSectionHeader title and trailing action baseline-aligned (AC-5)
- [ ] ./gradlew :app:compileDebugKotlin passes + native-compliance clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Pinned indicator dot full opacity [PRIMARY]
  GIVEN: LSNavigatorMessage is displayed with a pinned route indicator
  WHEN:  The pinned dot renders
  THEN:  Dot uses `theme.colors.signal.default` at full opacity (not `primary.default` at 12% alpha)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/TokenCorrectionTests.kt
  TEST_FUNCTION: testPinnedDotFullOpacity

AC-2: LSRouteCard heart IconColor.Signal
  GIVEN: LSRouteCard is displayed in saved state
  WHEN:  The heart icon renders
  THEN:  Icon uses `IconColor.Signal` (copper), not `IconColor.Content(ContentColor.Primary)` (charcoal/white)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/TokenCorrectionTests.kt
  TEST_FUNCTION: testRouteCardHeartSignalColor

AC-3: LSRouteCard map aspectRatio
  GIVEN: LSRouteCard is displayed at any width
  WHEN:  Map preview height is calculated
  THEN:  Map uses `Modifier.aspectRatio(9f / 4f)` so height scales proportionally with card width

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/TokenCorrectionTests.kt
  TEST_FUNCTION: testRouteCardMapAspectRatio

AC-4: LSRouteSheet dynamic timeRange
  GIVEN: LSRouteSheet weather timeline with actual time data
  WHEN:  The time range header renders
  THEN:  Labels derive from `timeRange: Pair<String, String>` parameter, not hardcoded "9am"/"3pm"

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/TokenCorrectionTests.kt
  TEST_FUNCTION: testRouteSheetDynamicTimeRange

AC-5: LSSectionHeader baseline alignment
  GIVEN: LSSectionHeader with title and trailing action
  WHEN:  The header renders
  THEN:  Title and trailing action text share a common baseline via `Modifier.align(Alignment.CenterVertically)`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/TokenCorrectionTests.kt
  TEST_FUNCTION: testSectionHeaderBaselineAlignment

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/organisms/LSNavigatorMessage.kt (MODIFY — pinned dot color)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteCard.kt (MODIFY — heart color, map aspectRatio)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt (MODIFY — timeRange parameter)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSSectionHeader.kt (MODIFY — baseline alignment)
- android/app/src/test/java/com/laneshadow/sandbox/TokenCorrectionTests.kt (NEW)

writeProhibited:
- ios/**, server/**, react-native/**, any file not listed above

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/organisms/LSNavigatorMessage.kt (MODIFY): Full-opacity signal.default pinned dot
- android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteCard.kt (MODIFY): IconColor.Signal heart, aspectRatio(9f/4f) map
- android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt (MODIFY): timeRange: Pair<String, String> parameter
- android/app/src/main/java/com/laneshadow/ui/organisms/LSSectionHeader.kt (MODIFY): Baseline alignment

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. android/app/src/main/java/com/laneshadow/ui/organisms/LSNavigatorMessage.kt [PRIMARY PATTERN]
   - Focus: Current pinned dot color (primary.default at 12% alpha), where to change to signal.default

2. android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteCard.kt
   - Focus: Current heart icon color, mapPreviewHeight = 160 hardcoded value

3. android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt
   - Focus: Current hardcoded "9am"/"3pm" time range, weatherTimeline data access

4. android/app/src/main/java/com/laneshadow/ui/organisms/LSSectionHeader.kt
   - Focus: Current Row layout, text baseline misalignment

5. .spec/prds/v3-integration/remediations/04-organisms.md
   - Sections: Gap E1-04 (pinned dot), Gap E3-04 (heart), Gap E3-03 (aspectRatio), Gap E2-05 (timeRange)

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED evidence in TDD_STATE
Gate 2: One test per AC
Gate 3: ./gradlew test exits 0
Gate 4: ./gradlew :app:compileDebugKotlin exits 0
Gate 5: native-compliance exits 0
Gate 6: git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- LSRouteCard difficulty tags as LSTagPill (Sprint 02)
- LSRouteCard subtitle separator pipe (Sprint 02)
- LSNavigatorMessage compass chip signal.whisper background (Sprint 02)
- LSNavigatorMessage pinned-bar dashed divider (Sprint 02)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** Android LSNavigatorMessage pinned dot is nearly invisible (12% alpha on primary.default). LSRouteCard heart uses charcoal/white instead of copper Signal color. Map preview hardcodes 160dp height instead of proportional 9:4. Weather timeline time range is hardcoded "9am—3pm". Section header title and trailing action don't baseline-align.
**Gap:** Each of these produces a visible token/color/geometry mismatch against the design system specs.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S01-T07 (Android build blockers — must compile first)
Blocks:     FID-S01-T09
Parallel:   FID-S01-T01..T06

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LSNavigatorMessage with pinned indicator WHEN dot renders THEN uses signal.default at full opacity not primary.default at 12% alpha", "verify": "./gradlew test" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSRouteCard saved state WHEN heart renders THEN uses IconColor.Signal copper not IconColor.Content(ContentColor.Primary)", "verify": "./gradlew test" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSRouteCard at any width WHEN map height calculated THEN uses Modifier.aspectRatio(9f/4f) not fixed height", "verify": "./gradlew test" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSRouteSheet weather timeline WHEN header renders THEN timeRange derived from data not hardcoded 9am/3pm", "verify": "./gradlew test" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSSectionHeader with title and trailing WHEN header renders THEN text baselines aligned via CenterVertically", "verify": "./gradlew test" },
    { "id": "TC-1", "type": "test_criterion", "description": "Pinned dot color is theme.colors.signal.default at full alpha", "maps_to_ac": "AC-1", "verify": "./gradlew test --tests '*.TokenCorrectionTests.testPinnedDotFullOpacity'" },
    { "id": "TC-2", "type": "test_criterion", "description": "Route card heart icon uses IconColor.Signal", "maps_to_ac": "AC-2", "verify": "./gradlew test --tests '*.TokenCorrectionTests.testRouteCardHeartSignalColor'" },
    { "id": "TC-3", "type": "test_criterion", "description": "Route card map preview uses aspectRatio(9f/4f)", "maps_to_ac": "AC-3", "verify": "./gradlew test --tests '*.TokenCorrectionTests.testRouteCardMapAspectRatio'" },
    { "id": "TC-4", "type": "test_criterion", "description": "Route sheet timeRange derived from weatherTimeline data", "maps_to_ac": "AC-4", "verify": "./gradlew test --tests '*.TokenCorrectionTests.testRouteSheetDynamicTimeRange'" },
    { "id": "TC-5", "type": "test_criterion", "description": "Section header title and trailing action baseline-aligned", "maps_to_ac": "AC-5", "verify": "./gradlew test --tests '*.TokenCorrectionTests.testSectionHeaderBaselineAlignment'" }
  ]
}
-->
