<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-01-android — Card + ListRow molecules — Android
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   180 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-01)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: AC-1 none · 0/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSContentCard and LSListRow render in the Android sandbox with token-driven layout, atom composition (LSCard, LSText, LSAvatar, LSIcon, LSDivider), all 10 PRD story variants registered, LSListRow tap callbacks fire exactly once, and Compose semantics tree confirms zero raw Text or literal Color(0xFF…) within molecule files.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST compose only from atom Composables — LSContentCard wraps LSCard; LSListRow uses LSText, LSAvatar, LSIcon, LSDivider.
- MUST resolve all visual properties through LaneShadowTheme.* via LocalLaneShadowTheme.current — mirror resolveLSCardStyle pattern.
- MUST use @Stable / @Immutable data classes for slot props.
- MUST register stories in android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/.
- MUST enforce min touch target via Modifier.defaultMinSize(minHeight = theme.sizing.touchTarget) (48.dp Android) on interactive LSListRow.
- NEVER inline raw Text(…) with TextStyle(fontSize=…sp) — delegate to LSText(TypographyVariant.X).
- NEVER use literal Color(0xFF…) or MaterialTheme.colorScheme/typography in molecule files.
- NEVER attach Modifier.clickable/Ripple to non-interactive LSListRow.
- STRICTLY: ./gradlew detekt exits 0; ./gradlew :app:compileDebugKotlin BUILD SUCCESSFUL; light/dark both render.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSContentCard default render uses surface card tokens (PRIMARY)
- [ ] AC-2: LSContentCard header + actions slots compose correctly
- [ ] AC-3: LSListRow with avatar+subtitle+chevron meets token spec
- [ ] AC-4: LSListRow tap callback fires once; no-tap row has no indication
- [ ] AC-5: Atom-composition gate (no Color(0xFF, no bare Text)
- [ ] AC-6: 10+ stories registered (4 ContentCard + 6 ListRow)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSContentCard default render — token-driven surface [PRIMARY]
  GIVEN: developer composes LSContentCard(title="Route X", subtitle="42 mi · 1h 12m") inside LaneShadowTheme provider
  WHEN:  Composable enters composition
  THEN:  LSCard surface resolves color.surface.card, radius.lg, elevation.2; title via LSText(typography.ui.title.md); subtitle via LSText(typography.ui.body.md); spacing tokens
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContentCardTest.default_render_uses_surface_card_tokens' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSContentCardTest.kt
  TEST_FUNCTION: default_render_uses_surface_card_tokens

AC-2: LSContentCard slot composition — header + actions
  GIVEN: LSContentCard with optional headerImage slot Composable and actions trailing lambda
  WHEN:  both slots provided
  THEN:  header above title row; actions below metadata row; vertical Column with spacing tokens; empty slots produce no extra gap
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContentCardTest.header_and_actions_slots_compose_correctly' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSContentCardTest.kt
  TEST_FUNCTION: header_and_actions_slots_compose_correctly

AC-3: LSListRow with avatar+subtitle+chevron meets token spec
  GIVEN: LSListRow(leading=Leading.Avatar(name="Ada"), title="Name", subtitle="Detail", trailing=Trailing.Chevron)
  WHEN:  Composable enters composition
  THEN:  min height = theme.sizing.touchTarget (48.dp); leading-title gap = spacing.3; vertical padding = spacing.2; subtitle LSText(typography.ui.body.md); chevron LSIcon at sizing.icon.md; LSAvatar in semantics tree
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSListRowTest.row_with_avatar_subtitle_chevron_meets_token_spec' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSListRowTest.kt
  TEST_FUNCTION: row_with_avatar_subtitle_chevron_meets_token_spec

AC-4: LSListRow tap fires once; non-tap row has no indication
  GIVEN: one LSListRow with onTap={counter++} and one without onTap
  WHEN:  developer taps interactive row once via Compose UI test
  THEN:  counter=1; non-interactive row has no clickable modifier, no ripple, semantics role null
  VERIFY: cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSListRowUiTest.tap_callback_fires_once_non_tap_row_has_no_indication' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSListRowUiTest.kt
  TEST_FUNCTION: tap_callback_fires_once_non_tap_row_has_no_indication

AC-5: Atom-composition gate
  GIVEN: LSContentCard.kt and LSListRow.kt examined via grep
  WHEN:  files scanned for bare Text( and Color(0xFF
  THEN:  zero matches for bare Text( not delegated via LSText; zero Color(0xFF in either file
  VERIFY: grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSContentCard.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSListRow.kt | wc -l | grep -x '0'
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-6: 10+ stories registered
  GIVEN: developer opens sandbox app
  WHEN:  navigating to Molecules / ContentCard and Molecules / ListRow
  THEN:  ContentCard stories With Image Header, Title Only, Title+Subtitle+Chips, With Actions; ListRow stories Leading Icon, Leading Avatar, With Subtitle, With Toggle, With Chevron, With Trailing Button (10 total)
  VERIFY: grep -c 'molecules.contentcard\|molecules.listrow' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSContentCardStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSListRowStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 10'
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | LSContentCardTest.default_render_uses_surface_card_tokens passes | AC-1 |
| TC-2 | LSContentCardTest.header_and_actions_slots_compose_correctly passes | AC-2 |
| TC-3 | LSListRowTest.row_with_avatar_subtitle_chevron_meets_token_spec passes | AC-3 |
| TC-4 | LSListRowUiTest.tap_callback_fires_once_non_tap_row_has_no_indication passes (connected) | AC-4 |
| TC-5 | Zero literal Color(0xFF…) occurrences in both molecule files | AC-5 |
| TC-6 | 10+ story IDs registered across two story files | AC-6 |
| TC-7 | detekt exits 0 for all new files | AC-5 |
| TC-8 | compileDebugKotlin succeeds | AC-1 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/molecules/LSContentCard.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSListRow.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSContentCardTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSListRowTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSListRowUiTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSContentCardStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSListRowStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt (NEW — aggregator; add to AppStories.all)

writeProhibited:
- android/app/build.gradle.kts — no new deps without justification
- android/app/src/main/java/com/laneshadow/ui/atoms/** — atoms owned by Sprint 02/03
- tokens/** — tokens owned by Sprint 01/03
- ios/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/molecules/content-card/ [REQUIRED READING]
2. .spec/design/system/molecules/list-row/ [REQUIRED READING]
3. .spec/prds/v2/06-uc-mol.md (lines 25-39) — UC-MOL-01 acceptance criteria
4. android/app/src/main/java/com/laneshadow/ui/atoms/LSCard.kt [PRIMARY PATTERN]
5. android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt — Typography atom delegation
6. android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt, LSAvatar.kt, LSDivider.kt
7. android/app/src/debug/java/com/laneshadow/sandbox/stories/LSButtonStories.kt — Story registration pattern

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/content-card/, .spec/design/system/molecules/list-row/

Interaction notes:
- REQUIRED READING: both design directories before implementing
- Min touch target: Modifier.defaultMinSize(minHeight = theme.sizing.touchTarget) — 48.dp on Android
- Rows without onTap must NOT have Modifier.clickable; no ripple on non-interactive rows
- Header slot is @Composable () -> Unit content lambda — molecule provides slot structure only

Pattern: Wrapping LSCard with named slot Composables; LSListRow uses themed Row-of-atoms with Modifier.padding from spacing tokens
Pattern source: android/app/src/main/java/com/laneshadow/ui/atoms/LSCard.kt
Anti-pattern: Do not write Surface(color = Color(0xFFFFFFFF), shape = RoundedCornerShape(12.dp)) — go through LSCard.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC. RED: failing gradle :app:testDebugUnitTest. GREEN: minimal Composable. REFACTOR: extract slot helpers; tests stay green.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No literal colors): grep 'Color(0xFF' both files = 0
Gate 2 (detekt): cd android && ./gradlew detekt exit 0
Gate 3 (compile): cd android && ./gradlew :app:compileDebugKotlin BUILD SUCCESSFUL
Gate 4 (tests): cd android && ./gradlew test BUILD SUCCESSFUL

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-android
Blocks:     UC-ORG-04-android, UC-ORG-06-android
Parallel:   UC-MOL-01-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "LSContentCard default — LSCard surface resolves color.surface.card + radius.lg + elevation.2; title typography.ui.title.md via LSText; subtitle typography.ui.body.md via LSText; spacing tokens", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContentCardTest.default_render_uses_surface_card_tokens' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "LSContentCard with optional header slot and actions lambda — header above title; actions below metadata; no gap when slots are null", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContentCardTest.header_and_actions_slots_compose_correctly' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "LSListRow with avatar leading, subtitle, chevron trailing — min height = sizing.touchTarget; leading-title gap = spacing.3; vertical padding = spacing.2; chevron LSIcon sizing.icon.md", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSListRowTest.row_with_avatar_subtitle_chevron_meets_token_spec' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Interactive LSListRow tap fires callback once; non-interactive row has no clickable modifier or ripple indication", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSListRowUiTest.tap_callback_fires_once_non_tap_row_has_no_indication' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "Atom-composition gate — zero Color(0xFF and zero bare Text( in both molecule files", "verify": "grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSContentCard.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSListRow.kt | wc -l | grep -x '0'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "10+ stories across ContentCard (4) and ListRow (6) variants in sandbox", "verify": "grep -c 'molecules.contentcard\\|molecules.listrow' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSContentCardStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSListRowStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 10'" },
    { "id": "TC-1", "type": "test_criterion", "description": "LSContentCardTest.default_render_uses_surface_card_tokens passes", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContentCardTest.default_render_uses_surface_card_tokens' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-2", "type": "test_criterion", "description": "LSContentCardTest.header_and_actions_slots_compose_correctly passes", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContentCardTest.header_and_actions_slots_compose_correctly' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-3", "type": "test_criterion", "description": "LSListRowTest.row_with_avatar_subtitle_chevron_meets_token_spec passes", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSListRowTest.row_with_avatar_subtitle_chevron_meets_token_spec' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-4", "type": "test_criterion", "description": "LSListRowUiTest.tap_callback_fires_once_non_tap_row_has_no_indication passes (connected)", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSListRowUiTest.tap_callback_fires_once_non_tap_row_has_no_indication' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-5", "type": "test_criterion", "description": "Zero Color(0xFF in molecule files", "maps_to_ac": "AC-5", "verify": "grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSContentCard.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSListRow.kt | wc -l | grep -x '0'" },
    { "id": "TC-6", "type": "test_criterion", "description": "10+ story IDs in story files", "maps_to_ac": "AC-6", "verify": "grep -c 'molecules.contentcard\\|molecules.listrow' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSContentCardStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSListRowStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 10'" },
    { "id": "TC-7", "type": "test_criterion", "description": "detekt exits 0", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew detekt 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-8", "type": "test_criterion", "description": "compileDebugKotlin BUILD SUCCESSFUL", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:compileDebugKotlin 2>&1 | grep 'BUILD SUCCESSFUL'" }
  ]
}
-->
