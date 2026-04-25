<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: UC-ORG-05-android — LSSessionsDrawer organism — Android Compose
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   240 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-05)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest'
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 0/6 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSSessionsDrawer renders 312dp-wide LSGlassPanel(.Chrome) full-height column with sticky header ("Rides" title + LSButton outline+plus NEW button), LSSectionHeader("THIS WEEK"), LazyColumn of session rows (3px leading active stripe color.signal.default when active, 5%-alpha tinted bg, truncated title + when label + preview line + meta footer + bottom border subtle); onSelect/onNew/onDismiss fire exactly once; sticky header stays in place while LazyColumn scrolls; 5 sandbox stories registered.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use LSGlassPanel(GlassVariant.Chrome) container with width 312dp + Modifier.fillMaxHeight + 1dp trailing border colors.border.default + elevation.overlay.
- MUST use LSSectionHeader (UC-ORG-07) for the THIS WEEK section label.
- MUST use LazyColumn for session list with sticky header containing title + NEW button (Modifier.zIndex or stickyHeader item).
- MUST resolve active row stripe via colors.signal.default and active row bg via colors.signal.default.copy(alpha=0.05f).
- MUST register 5 stories (Default 5 sessions 1 active, Empty State, Long List 20, No Active Session, Dark Mode) with dotted ids organisms.sessionsdrawer.*.
- NEVER inline Color(0x...), TextStyle(, FontFamily( literals.
- NEVER fetch sessions from Convex/networking — data is prop-driven (List<Session>).
- NEVER reproduce LSSectionHeader inline.
- STRICTLY detekt 0; compileDebugKotlin BUILD SUCCESSFUL; grep gate 0 in LSSessionsDrawer.kt.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: 312-wide drawer with sticky header + NEW button + THIS WEEK section + 5 session rows; active row visually highlighted (PRIMARY)
- [ ] AC-2: Tap session row fires onSelect(session.id) exactly once
- [ ] AC-3: Tap NEW button fires onNew exactly once
- [ ] AC-4: Sticky header remains in place while LazyColumn scrolls
- [ ] AC-5: 5 sandbox stories registered
- [ ] AC-6: Composes only from atoms+molecules+LSSectionHeader (no raw Column with literal colors)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Default renders with active row highlight [PRIMARY]
  GIVEN: Developer composes LSSessionsDrawer(sessions=fiveMockSessions, activeSessionId="santa-cruz-loop", onSelect={}, onNew={}, onDismiss={})
  WHEN:  Composable enters composition
  THEN:  Root LSGlassPanel(Chrome) width=312dp fillMaxHeight; header Row contains LSText("Rides", typography.ui.title.lg) + LSButton(outline,plus,"NEW"); LSSectionHeader("THIS WEEK") present; LazyColumn shows 5 rows; row "santa-cruz-loop" has 3dp leading stripe colors.signal.default and bg signal@5%; other rows have transparent bg and stripe
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest.default_renders_with_active_row_highlight' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSSessionsDrawerTest.kt
  TEST_FUNCTION: default_renders_with_active_row_highlight

AC-2: Row tap fires onSelect with id
  GIVEN: LSSessionsDrawer with onSelect mock and 5 sessions
  WHEN:  Test taps the third session row
  THEN:  onSelect invocation count == 1; argument == third session.id
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest.tap_session_row_fires_on_select_with_id' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSSessionsDrawerTest.kt
  TEST_FUNCTION: tap_session_row_fires_on_select_with_id

AC-3: NEW button fires onNew
  GIVEN: LSSessionsDrawer with onNew mock
  WHEN:  Test taps the NEW button
  THEN:  onNew invocation count == 1
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest.tap_new_button_fires_on_new_once' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSSessionsDrawerTest.kt
  TEST_FUNCTION: tap_new_button_fires_on_new_once

AC-4: Sticky header stays while LazyColumn scrolls
  GIVEN: LSSessionsDrawer with 20 sessions (Long List variant)
  WHEN:  Test scrolls LazyColumn by 1000dp
  THEN:  Header Row + NEW button + THIS WEEK LSSectionHeader remain visible (top y unchanged); LazyColumn rows scroll underneath
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSessionsDrawerTest.sticky_header_stays_while_lazy_column_scrolls' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSSessionsDrawerTest.kt
  TEST_FUNCTION: sticky_header_stays_while_lazy_column_scrolls

AC-5: 5 sandbox stories registered
  GIVEN: Developer opens debug sandbox app
  WHEN:  Navigating to Organisms / SessionsDrawer
  THEN:  Stories Default (5 sessions, 1 active), Empty State, Long List (20), No Active Session, Dark Mode present with dotted ids organisms.sessionsdrawer.*
  VERIFY: grep -c 'organisms.sessionsdrawer' android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSSessionsDrawerStory.kt | awk '$1 >= 5'
  TDD_STATE: none
  TEST_FILE: android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSSessionsDrawerStory.kt
  TEST_FUNCTION: (grep gate)

AC-6: No banned primitives + LSSectionHeader delegated
  GIVEN: LSSessionsDrawer.kt source
  WHEN:  grep gate runs
  THEN:  No Color(0x, TextStyle(, FontFamily( literals; LSSectionHeader test tag present in tree (not reimplemented inline)
  VERIFY: grep -rn 'Color(0x\|TextStyle(\|FontFamily(' android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (grep gate)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | Drawer is 312dp wide and fillMaxHeight; active row stripe + tinted bg present | AC-1 |
| TC-2 | Row tap fires onSelect once with that session id | AC-2 |
| TC-3 | NEW button tap fires onNew once | AC-3 |
| TC-4 | Sticky header y-position unchanged after LazyColumn scroll | AC-4 |
| TC-5 | 5 sandbox stories registered with ComponentTier.Organism | AC-5 |
| TC-6 | Zero hardcoded styling tokens in LSSessionsDrawer.kt | AC-6 |
| TC-7 | LSSectionHeader test tag present (delegated, not inlined) | AC-6 |
| TC-8 | Empty State variant renders header + section + empty list with no row test tags | AC-1 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/organisms/LSSessionsDrawerTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSSessionsDrawerStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt (MODIFY)

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/atoms/**
- android/app/src/main/java/com/laneshadow/ui/molecules/**
- tokens/**
- ios/**

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-org-05-sessions-drawer.html [REQUIRED READING]
2. .spec/prds/v2/07-uc-org.md (UC-ORG-05, lines 184-223)
3. .spec/prds/v2/11-technical-requirements.md (Session entity)
4. android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt
5. android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt
6. android/app/src/main/java/com/laneshadow/ui/atoms/LSDivider.kt
7. android/app/src/main/java/com/laneshadow/ui/organisms/LSSectionHeader.kt (UC-ORG-07)
8. android/app/src/main/java/com/laneshadow/theme/LaneShadowTheme.kt

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/prds/v2/concepts/uc-org-05-sessions-drawer.html, .spec/prds/v2/07-uc-org.md (UC-ORG-05)

Interaction notes:
- REQUIRED READING: .spec/prds/v2/concepts/uc-org-05-sessions-drawer.html — extract drawer width, row layout, active state styling, sticky header
- Active row: leading 3dp Box bg=colors.signal.default; full-row bg=colors.signal.default.copy(alpha=0.05f); meta footer LSText color signal vs textSubtle
- Sticky header lives outside LazyColumn (separate Column { header; LazyColumn { items } }) to remain unmoved during scroll

Pattern: Glass-chrome left drawer with non-scrolling header + LazyColumn body; LSSectionHeader-delegated section label
Pattern source: .spec/prds/v2/concepts/uc-org-05-sessions-drawer.html
Anti-pattern: Header inside LazyColumn header item that scrolls away, or inline section label with literal colors.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

1. detekt 0
2. compileDebugKotlin BUILD SUCCESSFUL
3. testDebugUnitTest LSSessionsDrawerTest green
4. grep gate Color(0x/TextStyle(/FontFamily( == 0
5. story grep ≥ 5

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-ORG-07-android (LSSectionHeader), UC-ATM-* (LSGlassPanel, LSButton, LSDivider)
Blocks:     Sprint 6 SessionsScreen
Parallel:   UC-ORG-05-ios, UC-ORG-03-android, UC-ORG-04-android, UC-ORG-06-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "312dp drawer with sticky header + active stripe + tint", "verify": "gradle test --tests LSSessionsDrawerTest.default_renders_with_active_row_highlight" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Row tap fires onSelect once with session id", "verify": "gradle test --tests LSSessionsDrawerTest.tap_session_row_fires_on_select_with_id" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "NEW button fires onNew once", "verify": "gradle test --tests LSSessionsDrawerTest.tap_new_button_fires_on_new_once" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Sticky header stays while LazyColumn scrolls", "verify": "gradle test --tests LSSessionsDrawerTest.sticky_header_stays_while_lazy_column_scrolls" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "5 sandbox stories registered", "verify": "grep -c 'organisms.sessionsdrawer' LSSessionsDrawerStory.kt | awk '$1 >= 5'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "No banned primitives in LSSessionsDrawer.kt", "verify": "grep -rn 'Color(0x\\|TextStyle(\\|FontFamily(' android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt | wc -l | xargs test 0 -eq" },
    { "id": "TC-1", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "Drawer 312dp + active highlight", "verify": "compose test" },
    { "id": "TC-2", "type": "test_criterion", "maps_to_ac": "AC-2", "description": "Row tap fires once with id", "verify": "compose test" },
    { "id": "TC-3", "type": "test_criterion", "maps_to_ac": "AC-3", "description": "NEW tap fires once", "verify": "compose test" },
    { "id": "TC-4", "type": "test_criterion", "maps_to_ac": "AC-4", "description": "Sticky header during scroll", "verify": "compose test" },
    { "id": "TC-5", "type": "test_criterion", "maps_to_ac": "AC-5", "description": "5 stories registered", "verify": "grep gate" },
    { "id": "TC-6", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "No hardcoded styling tokens", "verify": "grep gate" },
    { "id": "TC-7", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "LSSectionHeader delegated not inlined", "verify": "compose test asserts hasTestTag('LSSectionHeader')" },
    { "id": "TC-8", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "Empty State row count == 0", "verify": "compose test" }
  ]
}
-->
