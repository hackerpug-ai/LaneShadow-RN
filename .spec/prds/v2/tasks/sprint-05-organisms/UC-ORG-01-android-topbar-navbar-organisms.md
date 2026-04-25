<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: UC-ORG-01-android — Navigation organisms (LSTopBar + LSNavBar) — Android Compose
================================================================================

TASK_TYPE:  FEATURE
STATUS:     ✅ Completed
COMPLETED:  2026-04-24T18:35:00Z
COMMIT:     09fabf7d011fadfec4a578edff54c0ea772f3371
REVIEWER:   kotlin-reviewer
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   150 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-01)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSTopBarTest' --tests 'com.laneshadow.ui.organisms.LSNavBarTest'
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 0/7 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSTopBar (hamburger LSGlassPanel(.Chrome) chip + optional centered title + trailing NEW chip / record-highlight variant) and LSNavBar (LSToolbar wrapper for modal-sheet contexts with leading/trailing slots + optional filter chips) render in the Android sandbox with token-driven composition; hamburger and NEW callbacks fire exactly once per tap; light/dark glass chrome remains legible against PaperMap; stories registered for Default, With Title, Hamburger Only, Record Highlight, NavBar Default.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST compose LSTopBar chips from LSGlassPanel(GlassVariant.Chrome) + LSIcon + LSText only — no raw Box/Row with hardcoded backgrounds.
- MUST resolve all colors/typography/spacing through LaneShadowTheme (colors.signal.default, typography.ui.title.md, typography.ui.label.md, spacing tokens).
- MUST use Modifier.statusBarsPadding() / WindowInsets.statusBars on LSTopBar so it sits below the status bar.
- MUST register every story listed in DONE WHEN inside OrganismStories.kt with dotted ids (organisms.topbar.default, organisms.topbar.with-title, organisms.topbar.hamburger-only, organisms.topbar.record-highlight, organisms.navbar.default) and tier=ComponentTier.Organism.
- NEVER inline Color(0x...) / hex strings or FontFamily(...) literals in LSTopBar.kt or LSNavBar.kt.
- NEVER re-implement LSToolbar layout — LSNavBar must delegate to LSToolbar (UC-MOL-02).
- NEVER use Material3 TopAppBar — organism must be hand-composed from atoms/molecules to match Copper Navigator chrome.
- STRICTLY no detekt findings; compileDebugKotlin BUILD SUCCESSFUL; grep gate `grep -rn 'Color(0x\|TextStyle(\|FontFamily(' android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt android/app/src/main/java/com/laneshadow/ui/organisms/LSNavBar.kt | wc -l` returns 0.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSTopBar default renders hamburger + NEW chips backed by LSGlassPanel(.Chrome) (PRIMARY)
- [ ] AC-2: LSTopBar with title slot renders centered title in typography.ui.title.md
- [ ] AC-3: Hamburger and NEW callbacks each fire exactly once per tap
- [ ] AC-4: Record Highlight variant swaps trailing chip to color.status.recording indicator
- [ ] AC-5: LSNavBar delegates to LSToolbar with leading/trailing slots for modal sheets
- [ ] AC-6: Light/dark theme toggle re-resolves glass chrome legibly
- [ ] AC-7: 5 stories registered in OrganismStories.kt with dotted ids and ComponentTier.Organism

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Default renders hamburger + NEW glass chrome chips [PRIMARY]
  GIVEN: Developer composes LSTopBar(onMenuTap = {}, onNewTap = {}) inside LaneShadowTheme
  WHEN:  Composable enters composition
  THEN:  Leading hamburger chip = LSGlassPanel(GlassVariant.Chrome) 40x40 radius.md containing LSIcon(LSIconName.Menu); trailing NEW chip = LSGlassPanel(GlassVariant.Chrome) rounded with LSIcon(LSIconName.Plus) + LSText("NEW", typography.ui.label.md); no centered title between
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSTopBarTest.default_renders_hamburger_and_new_chips_with_glass_chrome' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSTopBarTest.kt
  TEST_FUNCTION: default_renders_hamburger_and_new_chips_with_glass_chrome

AC-2: With title centered title typography.ui.title.md
  GIVEN: Developer composes LSTopBar(title = "Details", onMenuTap = {}, onNewTap = {})
  WHEN:  Composable enters composition
  THEN:  Centered title LSText("Details", typography.ui.title.md) is positioned between hamburger and NEW chip; horizontal layout balanced via Modifier.weight
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSTopBarTest.with_title_renders_centered_title' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSTopBarTest.kt
  TEST_FUNCTION: with_title_renders_centered_title

AC-3: Tap callbacks each fire exactly once
  GIVEN: LSTopBar rendered with mock onMenuTap and onNewTap callbacks
  WHEN:  Test taps the hamburger chip then taps the NEW chip
  THEN:  onMenuTap invocation count == 1 after first tap; onNewTap invocation count == 1 after second tap; counts do not cross-fire
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSTopBarTest.taps_fire_callbacks_exactly_once' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSTopBarTest.kt
  TEST_FUNCTION: taps_fire_callbacks_exactly_once

AC-4: Record Highlight variant uses status.recording token
  GIVEN: LSTopBar(trailing = TopBarTrailing.RecordHighlight, onMenuTap = {})
  WHEN:  Composable enters composition
  THEN:  Trailing chip background tinted with LaneShadowTheme.colors.status.recording; recording indicator semantics tag present (TopBarRecordingIndicatorTag); hamburger chip unchanged
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSTopBarTest.record_highlight_variant_renders_recording_indicator' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSTopBarTest.kt
  TEST_FUNCTION: record_highlight_variant_renders_recording_indicator

AC-5: LSNavBar delegates to LSToolbar molecule
  GIVEN: Developer composes LSNavBar(title = "Filter", leading = NavBarLeading.Back {}, trailing = NavBarTrailing.Action(LSIconName.Close) {})
  WHEN:  Composable enters composition
  THEN:  Layout delegates to LSToolbar molecule (UC-MOL-02) — LSToolbar test tag present in semantics tree; back leading + close trailing wired through LSToolbar slots; no inline toolbar layout in LSNavBar.kt
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSNavBarTest.delegates_to_lstoolbar_molecule' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSNavBarTest.kt
  TEST_FUNCTION: delegates_to_lstoolbar_molecule

AC-6: Light/dark theme glass chrome legible
  GIVEN: LSTopBar rendered under LaneShadowTheme(darkTheme = false) then under LaneShadowTheme(darkTheme = true)
  WHEN:  Each composition is captured
  THEN:  Glass chrome surface color resolves from LaneShadowTheme.colors.surface.chrome in both themes; chip foreground uses theme.colors.content.text.primary; no hardcoded color in either capture
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSTopBarTest.light_dark_theme_glass_chrome_remains_legible' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSTopBarTest.kt
  TEST_FUNCTION: light_dark_theme_glass_chrome_remains_legible

AC-7: 5 stories registered with ComponentTier.Organism
  GIVEN: Developer opens the debug sandbox app
  WHEN:  Navigating to Organisms / TopBar and Organisms / NavBar
  THEN:  Stories Default, With Title, Hamburger Only, Record Highlight (TopBar) and Default (NavBar) all present with tier=ComponentTier.Organism, component="LSTopBar"/"LSNavBar", dotted ids organisms.topbar.* / organisms.navbar.*
  VERIFY: grep -c 'organisms.topbar\|organisms.navbar' android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt | awk '$1 >= 5'
  TDD_STATE: none
  TEST_FILE: android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt
  TEST_FUNCTION: (grep gate)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | LSTopBar default renders 2 LSGlassPanel(.Chrome) chips with no title slot | AC-1 |
| TC-2 | LSTopBar with title="Details" centers LSText typography.ui.title.md | AC-2 |
| TC-3 | Hamburger and NEW taps each fire once with no cross-fire | AC-3 |
| TC-4 | Record Highlight tints trailing chip with status.recording and exposes TopBarRecordingIndicatorTag | AC-4 |
| TC-5 | LSNavBar tree contains LSToolbar test tag (delegated, not reproduced) | AC-5 |
| TC-6 | LSTopBar.kt + LSNavBar.kt have 0 matches for Color(0x/TextStyle(/FontFamily( | AC-6 |
| TC-7 | OrganismStories.kt registers ≥5 ComponentTier.Organism stories for topbar+navbar | AC-7 |
| TC-8 | LSTopBar applies Modifier.statusBarsPadding (top padding ≥ status bar inset) | AC-1 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSNavBar.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/organisms/LSTopBarTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/organisms/LSNavBarTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSTopBarStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSNavBarStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt (NEW or MODIFY)

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/atoms/** — atoms must not be modified
- android/app/src/main/java/com/laneshadow/ui/molecules/** — molecules already shipped Sprint 4
- tokens/** — theme generated from token contract
- ios/** — separate task

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-org-01-topbar-navbar.html [REQUIRED READING — visual design source]
2. .spec/prds/v2/07-uc-org.md (UC-ORG-01, lines 24-57)
3. android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt [PRIMARY PATTERN]
4. android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt
5. android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt
6. android/app/src/main/java/com/laneshadow/ui/molecules/LSToolbar.kt
7. android/app/src/main/java/com/laneshadow/theme/LaneShadowTheme.kt

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/prds/v2/concepts/uc-org-01-topbar-navbar.html, .spec/prds/v2/07-uc-org.md

Interaction notes:
- REQUIRED READING: .spec/prds/v2/concepts/uc-org-01-topbar-navbar.html — extract chip composition + record-highlight indicator tinting + glass-chrome translucent treatment
- TopBar respects status bar via Modifier.statusBarsPadding(); NavBar respects modal-sheet inset (no statusBarsPadding inside sheet)
- Hamburger chip 40dp circular; NEW chip rounded radius.md; both backed by LSGlassPanel(.Chrome)

Pattern: Glass-chrome chip-flanked top app bar; LSToolbar-delegated modal nav bar
Pattern source: .spec/prds/v2/concepts/uc-org-01-topbar-navbar.html
Anti-pattern: Material3 TopAppBar with hardcoded backgroundColor, or hand-rolled Row with Color(0xFF...) chips.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

1. detekt 0 findings: cd android && ./gradlew detekt
2. compileDebugKotlin BUILD SUCCESSFUL: cd android && ./gradlew :app:compileDebugKotlin
3. testDebugUnitTest BUILD SUCCESSFUL for LSTopBarTest + LSNavBarTest
4. grep gate: grep -rn 'Color(0x\|TextStyle(\|FontFamily(' android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt android/app/src/main/java/com/laneshadow/ui/organisms/LSNavBar.kt | wc -l → 0
5. story registration grep: grep -c 'organisms.topbar\|organisms.navbar' android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt → ≥ 5

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-MOL-02-android (LSToolbar, shipped), UC-ATM-* atoms (LSGlassPanel, LSIcon, LSText, shipped Sprints 2-3)
Blocks:     UC-ORG-02-android (needs LSTopBar slot), Sprint 6 Navigator screens
Parallel:   UC-ORG-07-android, UC-ORG-01-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "LSTopBar default renders glass hamburger + NEW chips, no title", "verify": "gradle test --tests LSTopBarTest.default_renders_hamburger_and_new_chips_with_glass_chrome" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "LSTopBar(title) centers typography.ui.title.md", "verify": "gradle test --tests LSTopBarTest.with_title_renders_centered_title" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Hamburger and NEW taps fire exactly once each", "verify": "gradle test --tests LSTopBarTest.taps_fire_callbacks_exactly_once" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Record Highlight uses color.status.recording", "verify": "gradle test --tests LSTopBarTest.record_highlight_variant_renders_recording_indicator" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "LSNavBar delegates to LSToolbar molecule", "verify": "gradle test --tests LSNavBarTest.delegates_to_lstoolbar_molecule" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "Light/dark glass chrome legible", "verify": "gradle test --tests LSTopBarTest.light_dark_theme_glass_chrome_remains_legible" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "5 organism stories registered", "verify": "grep -c 'organisms.topbar\\|organisms.navbar' OrganismStories.kt | awk '$1 >= 5'" },
    { "id": "TC-1", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "Two LSGlassPanel(.Chrome) chips render with no title slot", "verify": "compose test" },
    { "id": "TC-2", "type": "test_criterion", "maps_to_ac": "AC-2", "description": "Title typography.ui.title.md centered", "verify": "compose test" },
    { "id": "TC-3", "type": "test_criterion", "maps_to_ac": "AC-3", "description": "Tap callbacks fire exactly once", "verify": "compose test" },
    { "id": "TC-4", "type": "test_criterion", "maps_to_ac": "AC-4", "description": "Record indicator tag present + tinted status.recording", "verify": "compose test" },
    { "id": "TC-5", "type": "test_criterion", "maps_to_ac": "AC-5", "description": "LSToolbar test tag present in LSNavBar tree", "verify": "compose test" },
    { "id": "TC-6", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "No Color(0x/TextStyle(/FontFamily( in source", "verify": "grep -rn 'Color(0x\\|TextStyle(\\|FontFamily(' android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt android/app/src/main/java/com/laneshadow/ui/organisms/LSNavBar.kt | wc -l | xargs test 0 -eq" },
    { "id": "TC-7", "type": "test_criterion", "maps_to_ac": "AC-7", "description": "≥5 ComponentTier.Organism stories registered", "verify": "grep gate" },
    { "id": "TC-8", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "statusBarsPadding applied", "verify": "compose test" }
  ]
}
-->
