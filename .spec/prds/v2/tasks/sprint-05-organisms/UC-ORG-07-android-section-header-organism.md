<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: UC-ORG-07-android — LSSectionHeader organism — Android Compose
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     S
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   90 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-07)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSectionHeaderTest'
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 0/6 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSSectionHeader renders title in typography.ui.title.md (or caps label in typography.ui.label.sm) on the leading edge with optional trailing slot (.None or .Link(label,onTap)) tinted colors.signal.default; default leading inset spacing.3; trailing tap fires exactly once; 5 sandbox stories registered (Title Only, Title + See All, Caps Label, Custom Inset, Dark Mode); composes only from atoms.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use sealed SectionHeaderTrailing with None and Link(label, onTap) variants.
- MUST resolve title typography from LaneShadowTheme.typography.ui.title.md (or label.sm for caps style) — composer chooses based on inferred style.
- MUST tint Link via colors.signal.default and route through LSText.
- MUST default inset to Spacing.spacing3 with optional override prop SpacingToken?.
- MUST register 5 stories (Title Only, Title + See All, Caps Label, Custom Inset, Dark Mode).
- NEVER inline Color(0x...), TextStyle(, FontFamily(.
- NEVER reach to molecules — organism composes only from atoms (LSText, LSPressable for the link).
- NEVER use ClickableText / TextButton from Material3 for the link — wire LSText inside Modifier.clickable for token consistency.
- STRICTLY detekt 0; compileDebugKotlin BUILD SUCCESSFUL; grep gate 0 in LSSectionHeader.kt.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: Title + See All renders title typography.ui.title.md leading + signal-tinted See All trailing + spacing.3 inset (PRIMARY)
- [ ] AC-2: Caps label-style header renders typography.ui.label.sm with no trailing slot
- [ ] AC-3: See All tap fires onTap exactly once
- [ ] AC-4: Custom inset prop overrides default spacing.3
- [ ] AC-5: 5 sandbox stories registered with dotted ids organisms.sectionheader.*
- [ ] AC-6: Composes only from atoms — no molecule references in source

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Title + See All with spacing.3 inset [PRIMARY]
  GIVEN: Developer composes LSSectionHeader(title="Nearby Routes", trailing=SectionHeaderTrailing.Link("See all", onTap={}))
  WHEN:  Composable enters composition
  THEN:  Leading LSText("Nearby Routes", typography.ui.title.md); trailing LSText("See all") tinted colors.signal.default with Modifier.clickable; root Row has Modifier.padding(start=Spacing.spacing3); horizontal arrangement SpaceBetween
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSectionHeaderTest.title_with_see_all_renders_correctly_with_inset' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSSectionHeaderTest.kt
  TEST_FUNCTION: title_with_see_all_renders_correctly_with_inset

AC-2: Caps label style no trailing
  GIVEN: Developer composes LSSectionHeader(title="THIS WEEK")
  WHEN:  Composable enters composition
  THEN:  Title rendered with caps-style LSText(typography.ui.label.sm); no trailing test tag present; inset Spacing.spacing3 applied
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSectionHeaderTest.caps_label_style_no_trailing' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSSectionHeaderTest.kt
  TEST_FUNCTION: caps_label_style_no_trailing

AC-3: See All tap fires once
  GIVEN: LSSectionHeader with trailing=Link("See all", mock onTap)
  WHEN:  Test taps the See all label
  THEN:  onTap invocation count == 1
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSectionHeaderTest.see_all_tap_fires_callback_exactly_once' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSSectionHeaderTest.kt
  TEST_FUNCTION: see_all_tap_fires_callback_exactly_once

AC-4: Custom inset prop override
  GIVEN: LSSectionHeader(title="Custom", inset=Spacing.spacing6)
  WHEN:  Composable enters composition
  THEN:  Root Row Modifier.padding(start=Spacing.spacing6) applied; default override honored
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSSectionHeaderTest.custom_inset_prop_overrides_default' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSSectionHeaderTest.kt
  TEST_FUNCTION: custom_inset_prop_overrides_default

AC-5: 5 sandbox stories registered
  GIVEN: Developer opens debug sandbox app
  WHEN:  Navigating to Organisms / SectionHeader
  THEN:  Stories Title Only, Title + See All, Caps Label (no See All), Custom Inset, Dark Mode present with dotted ids organisms.sectionheader.* and tier=ComponentTier.Organism
  VERIFY: grep -c 'organisms.sectionheader' android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSSectionHeaderStory.kt | awk '$1 >= 5'
  TDD_STATE: none
  TEST_FILE: android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSSectionHeaderStory.kt
  TEST_FUNCTION: (grep gate)

AC-6: No molecule imports + no banned primitives
  GIVEN: LSSectionHeader.kt source
  WHEN:  grep gate runs
  THEN:  No imports from com.laneshadow.ui.molecules.*; no Color(0x, TextStyle(, FontFamily( literals; only atoms + theme imports
  VERIFY: grep -rn 'com.laneshadow.ui.molecules\|Color(0x\|TextStyle(\|FontFamily(' android/app/src/main/java/com/laneshadow/ui/organisms/LSSectionHeader.kt | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (grep gate)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | Title + See All Row arrangement SpaceBetween with signal-tinted link | AC-1 |
| TC-2 | Caps label style uses typography.ui.label.sm with no trailing | AC-2 |
| TC-3 | See all tap fires onTap exactly once | AC-3 |
| TC-4 | Custom inset prop applied to root Row padding.start | AC-4 |
| TC-5 | 5 sandbox stories registered with ComponentTier.Organism | AC-5 |
| TC-6 | Zero molecule imports + zero hardcoded styling tokens | AC-6 |
| TC-7 | Default inset (when prop omitted) equals Spacing.spacing3 | AC-1 |
| TC-8 | When trailing=None, no LSText with text='See all' present | AC-2 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/organisms/LSSectionHeader.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/organisms/SectionHeaderTypes.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/organisms/LSSectionHeaderTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSSectionHeaderStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt (MODIFY)

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/atoms/**
- android/app/src/main/java/com/laneshadow/ui/molecules/**
- tokens/**
- ios/**

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-org-07-section-header.html [REQUIRED READING]
2. .spec/prds/v2/07-uc-org.md (UC-ORG-07, lines 247-261)
3. android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt
4. android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt — Ghost variant for See-all link reference
5. android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt — .chevronRight
6. android/app/src/main/java/com/laneshadow/theme/LaneShadowTheme.kt — typography.ui.title.md, typography.ui.label.sm, color.signal.default, color.content.textSubtle, spacing tokens

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/prds/v2/concepts/uc-org-07-section-header.html, .spec/prds/v2/07-uc-org.md (UC-ORG-07)

Interaction notes:
- REQUIRED READING: .spec/prds/v2/concepts/uc-org-07-section-header.html — extract title styling and trailing link composition
- Sealed SectionHeaderTrailing enables stable Compose recomposition; pattern matches PRD signature `trailing: TrailingSlot = .none | .link(label, onTap)`
- Caps-style detection: when title is uppercase, composer selects label.sm; otherwise title.md (alternatively expose explicit `style: SectionHeaderStyle = .Title|.CapsLabel` prop)

Pattern: Atom-only Row with leading title + optional trailing link, all token-driven
Pattern source: .spec/prds/v2/concepts/uc-org-07-section-header.html
Anti-pattern: Material3 TextButton("See all") with hardcoded color or molecule wrapper.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

1. detekt 0
2. compileDebugKotlin BUILD SUCCESSFUL
3. testDebugUnitTest LSSectionHeaderTest green
4. grep gate Color(0x/TextStyle(/FontFamily( + molecule imports == 0
5. story grep ≥ 5

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-ATM-* (LSText)
Blocks:     UC-ORG-05-android (LSSessionsDrawer needs LSSectionHeader), Sprint 6 catalog screens
Parallel:   UC-ORG-07-ios, UC-ORG-01-android, UC-ORG-02-android, UC-ORG-03-android, UC-ORG-04-android, UC-ORG-06-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Title + See All with spacing.3 inset and signal-tinted link", "verify": "gradle test --tests LSSectionHeaderTest.title_with_see_all_renders_correctly_with_inset" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Caps label style no trailing slot", "verify": "gradle test --tests LSSectionHeaderTest.caps_label_style_no_trailing" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "See All tap fires once", "verify": "gradle test --tests LSSectionHeaderTest.see_all_tap_fires_callback_exactly_once" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Custom inset prop overrides default", "verify": "gradle test --tests LSSectionHeaderTest.custom_inset_prop_overrides_default" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "5 sandbox stories registered", "verify": "grep -c 'organisms.sectionheader' LSSectionHeaderStory.kt | awk '$1 >= 5'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "No molecule imports + no banned primitives", "verify": "grep -rn 'com.laneshadow.ui.molecules\\|Color(0x\\|TextStyle(\\|FontFamily(' android/app/src/main/java/com/laneshadow/ui/organisms/LSSectionHeader.kt | wc -l | xargs test 0 -eq" },
    { "id": "TC-1", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "Title + See All Row SpaceBetween + tinted link", "verify": "compose test" },
    { "id": "TC-2", "type": "test_criterion", "maps_to_ac": "AC-2", "description": "Caps label typography.ui.label.sm no trailing", "verify": "compose test" },
    { "id": "TC-3", "type": "test_criterion", "maps_to_ac": "AC-3", "description": "See all tap fires once", "verify": "compose test" },
    { "id": "TC-4", "type": "test_criterion", "maps_to_ac": "AC-4", "description": "Custom inset applied to padding.start", "verify": "compose test" },
    { "id": "TC-5", "type": "test_criterion", "maps_to_ac": "AC-5", "description": "5 stories registered", "verify": "grep gate" },
    { "id": "TC-6", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "No molecule imports + no hardcoded styling", "verify": "grep gate" },
    { "id": "TC-7", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "Default inset spacing.3 when prop omitted", "verify": "compose test" },
    { "id": "TC-8", "type": "test_criterion", "maps_to_ac": "AC-2", "description": "trailing=None hides 'See all' text", "verify": "compose test" }
  ]
}
-->
