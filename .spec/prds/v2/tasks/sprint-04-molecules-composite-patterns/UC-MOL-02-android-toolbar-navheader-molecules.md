<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-02-android — Toolbar + NavHeader molecules — Android
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     S
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   120 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-02)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: AC-1 none · 0/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSToolbar and LSNavHeader render in the sandbox on Android with token-driven chrome, WindowInsets system-bar handling, leading/title/trailing slot composition from LSText and LSButton atoms, all 7 PRD-specified story variants registered, and detekt clean.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST compose slots from LSText (title), LSButton(.ghost, icon:) (back/action), LSIcon (bare icons).
- MUST resolve chrome through LaneShadowTheme — color.surface.primary background, color.content.* foreground.
- MUST apply WindowInsets.systemBars via Modifier.windowInsetsPadding(WindowInsets.systemBars) (or via Scaffold topBar slot).
- MUST define toolbar height via theme.sizing.component.toolbarHeight — never hardcoded dp.
- MUST use @Stable sealed interfaces for slot variants.
- MUST register stories.
- NEVER use hardcoded heights like 56.dp/64.dp directly.
- NEVER use MaterialTheme.colorScheme — only LaneShadowTheme.
- NEVER use TopAppBar/LargeTopAppBar from Material3 as the visible chrome.
- STRICTLY: WindowInsets respected; detekt 0; compileDebugKotlin BUILD SUCCESSFUL.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSToolbar default render uses chrome tokens (PRIMARY)
- [ ] AC-2: Title-only and two-action toolbar variants render correctly
- [ ] AC-3: LSNavHeader large-title variant uses opinion.lg typography
- [ ] AC-4: LSNavHeader large-title with subtitle renders both nodes
- [ ] AC-5: WindowInsets system bars respected
- [ ] AC-6: 7+ stories registered for toolbar/navheader variants

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSToolbar default render with chrome tokens [PRIMARY]
  GIVEN: developer composes LSToolbar(leading=Leading.Back{}, title="Details", trailing=Trailing.Action(icon=Glyph.Ellipsis){})
  WHEN:  Composable enters composition
  THEN:  height = theme.sizing.component.toolbarHeight; bg = color.surface.primary; title centered via LSText(typography.ui.title.md); back/action use LSButton(.ghost, icon) at sizing.icon.md; WindowInsets.systemBars padding applied at top
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSToolbarTest.default_render_uses_chrome_tokens' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSToolbarTest.kt
  TEST_FUNCTION: default_render_uses_chrome_tokens

AC-2: Title-only and two-action variants
  GIVEN: developer composes LSToolbar with no leading and two trailing actions; separately a title-only toolbar
  WHEN:  each Composable enters composition
  THEN:  no back icon; two trailing LSButton(.ghost) side-by-side at spacing.2 gap; title centered; title-only has neither leading nor trailing
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSToolbarTest.title_only_and_two_actions_variants' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSToolbarTest.kt
  TEST_FUNCTION: title_only_and_two_actions_variants

AC-3: LSNavHeader large-title variant typography
  GIVEN: developer composes LSNavHeader(variant=NavHeaderVariant.LargeTitle, title="Chat")
  WHEN:  Composable enters composition
  THEN:  title via LSText(typography.opinion.lg); static on Android (no scroll-collapse); bg = color.surface.primary
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSNavHeaderTest.large_title_variant_uses_opinion_lg_typography' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSNavHeaderTest.kt
  TEST_FUNCTION: large_title_variant_uses_opinion_lg_typography

AC-4: LSNavHeader large-title with subtitle
  GIVEN: developer composes LSNavHeader(variant=NavHeaderVariant.LargeTitleWithSubtitle, title="Chat", subtitle="12 rides this week")
  WHEN:  Composable enters composition
  THEN:  title typography.opinion.lg via LSText; subtitle typography.ui.body.md in color.content.textMuted via LSText; vertical gap from theme spacing tokens
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSNavHeaderTest.large_title_with_subtitle_renders_both_nodes' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSNavHeaderTest.kt
  TEST_FUNCTION: large_title_with_subtitle_renders_both_nodes

AC-5: WindowInsets system bars respected
  GIVEN: LSToolbar in Compose UI test with simulated status bar insets
  WHEN:  inset padding inspected via Compose layout coordinates
  THEN:  top padding > 0dp (absorbs system bar height); content not clipped behind status bar
  VERIFY: cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSToolbarUiTest.window_insets_system_bars_respected' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSToolbarUiTest.kt
  TEST_FUNCTION: window_insets_system_bars_respected

AC-6: 7+ stories registered + atom-composition gate
  GIVEN: developer opens sandbox
  WHEN:  navigating to Molecules / Toolbar and Molecules / NavHeader
  THEN:  Toolbar 4 stories (Back+Title+Action, Title Only, Title+Two Actions, No Back); NavHeader 3 stories (Default, Large Title, Large Title With Subtitle); zero Color(0xFF in molecule files
  VERIFY: grep -c 'molecules.toolbar\|molecules.navheader' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToolbarStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSNavHeaderStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 7'
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | LSToolbarTest.default_render_uses_chrome_tokens passes | AC-1 |
| TC-2 | LSToolbarTest.title_only_and_two_actions_variants passes | AC-2 |
| TC-3 | LSNavHeaderTest.large_title_variant_uses_opinion_lg_typography passes | AC-3 |
| TC-4 | LSNavHeaderTest.large_title_with_subtitle_renders_both_nodes passes | AC-4 |
| TC-5 | LSToolbarUiTest.window_insets_system_bars_respected passes (connected) | AC-5 |
| TC-6 | Zero Color(0xFF in toolbar/navheader files | AC-6 |
| TC-7 | 7+ story IDs in story files | AC-6 |
| TC-8 | detekt + compileDebugKotlin succeed | AC-1 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/molecules/LSToolbar.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSNavHeader.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSToolbarTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSNavHeaderTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSToolbarUiTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToolbarStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSNavHeaderStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt (MODIFY)

writeProhibited:
- android/app/build.gradle.kts — no new deps without justification
- android/app/src/main/java/com/laneshadow/ui/atoms/** — atoms owned by Sprint 02/03
- tokens/** — tokens owned by Sprint 01/03
- ios/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/molecules/toolbar/ [REQUIRED READING]
2. .spec/design/system/molecules/nav-header/ [REQUIRED READING]
3. .spec/prds/v2/06-uc-mol.md (lines 42-55) — UC-MOL-02 acceptance criteria
4. android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt — ghost variant
5. android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt — title delegation
6. android/app/src/main/java/com/laneshadow/ui/atoms/LSPanel.kt — surface atom for toolbar bg

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/toolbar/, .spec/design/system/molecules/nav-header/

Interaction notes:
- REQUIRED READING: both design directories before implementing
- Use WindowInsets.systemBars via Modifier.windowInsetsPadding(WindowInsets.systemBars), or pass LSToolbar as Scaffold topBar slot
- LSNavHeader large-title is static on Android — PRD explicitly notes 'static at display-size'
- Material3 LargeTopAppBar may be a behavior reference but visible chrome must be atom-composed

Pattern: Themed Box/Row with leading/title/trailing slot Composable parameters; LSButton for icon buttons, LSText for title
Pattern source: android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt
Anti-pattern: Do not use TopAppBar from material3 as the implementation shell; do not hardcode height = 56.dp.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

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
Blocks:     UC-ORG-01-android
Parallel:   UC-MOL-02-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "LSToolbar(leading=Back, title, trailing=Action) — sizing.component.toolbarHeight, color.surface.primary, typography.ui.title.md via LSText, LSButton(.ghost) icons, WindowInsets applied", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSToolbarTest.default_render_uses_chrome_tokens' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Title-only and two-action toolbar variants render correctly with LSButton(.ghost) at spacing.2 gap; centered title", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSToolbarTest.title_only_and_two_actions_variants' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "LSNavHeader LargeTitle variant renders title via LSText(typography.opinion.lg); static on Android", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSNavHeaderTest.large_title_variant_uses_opinion_lg_typography' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "LSNavHeader LargeTitleWithSubtitle renders both LSText nodes with correct typography tokens and spacing gap", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSNavHeaderTest.large_title_with_subtitle_renders_both_nodes' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "LSToolbar absorbs WindowInsets.systemBars top padding — content not clipped behind status bar", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSToolbarUiTest.window_insets_system_bars_respected' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "7+ stories for Toolbar (4 variants) and NavHeader (3 variants); zero Color(0xFF in either molecule file", "verify": "grep -c 'molecules.toolbar\\|molecules.navheader' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToolbarStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSNavHeaderStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 7'" },
    { "id": "TC-1", "type": "test_criterion", "description": "LSToolbarTest.default_render_uses_chrome_tokens passes", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSToolbarTest.default_render_uses_chrome_tokens' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-2", "type": "test_criterion", "description": "LSToolbarTest.title_only_and_two_actions_variants passes", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSToolbarTest.title_only_and_two_actions_variants' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-3", "type": "test_criterion", "description": "LSNavHeaderTest.large_title_variant_uses_opinion_lg_typography passes", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSNavHeaderTest.large_title_variant_uses_opinion_lg_typography' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-4", "type": "test_criterion", "description": "LSNavHeaderTest.large_title_with_subtitle_renders_both_nodes passes", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSNavHeaderTest.large_title_with_subtitle_renders_both_nodes' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-5", "type": "test_criterion", "description": "LSToolbarUiTest.window_insets_system_bars_respected passes (connected)", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSToolbarUiTest.window_insets_system_bars_respected' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-6", "type": "test_criterion", "description": "Zero Color(0xFF in molecule files", "maps_to_ac": "AC-6", "verify": "grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSToolbar.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSNavHeader.kt | wc -l | grep -x '0'" },
    { "id": "TC-7", "type": "test_criterion", "description": "7+ story IDs in story files", "maps_to_ac": "AC-6", "verify": "grep -c 'molecules.toolbar\\|molecules.navheader' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToolbarStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSNavHeaderStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 7'" },
    { "id": "TC-8", "type": "test_criterion", "description": "detekt + compileDebugKotlin succeed", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew detekt :app:compileDebugKotlin 2>&1 | grep 'BUILD SUCCESSFUL'" }
  ]
}
-->
