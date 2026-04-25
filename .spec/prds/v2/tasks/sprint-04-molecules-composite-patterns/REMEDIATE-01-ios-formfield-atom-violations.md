<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: REMEDIATION/TDD -->

================================================================================
TASK: REMEDIATE-01-ios — Fix LSFormField atom violations + vanity test stubs
================================================================================

TASK_TYPE:  REMEDIATION
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   30 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-04)
SOURCE:     Red-hat review 2026-04-24 (.spec/reviews/red-hat-sprint-04-molecules-2026-04-24.md)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: AC-1 none · AC-2 none · 0/3 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSFormField composes ALL text through LSText atom (no raw Text() with .font()/.foregroundStyle()). LSFormFieldTests, LSTabItemTests, and LSEmptyStateTests replace vanity #expect(true) stubs with real assertions verifying atom composition, token values, and callback behavior.

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST replace raw Text() on lines 34 and 51 of LSFormField.swift with LSText atom using TypographyVariant.
- MUST replace 5 vanity #expect(true) stubs with assertions that verify real behavior.
- MUST NOT introduce new raw Text() / Font.system() / foregroundColor() calls.
- MUST NOT lower assertion strength (no expect(true), no expect(view != nil) without further checks).
- STRICTLY: swiftformat --lint exits 0; xcodebuild test exits TEST SUCCEEDED for LSFormFieldTests, LSTabItemTests, LSEmptyStateTests.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSFormField.swift uses LSText for required asterisk and error text (no raw Text())
- [ ] AC-2: All 5 #expect(true) stubs replaced with real assertions
- [ ] AC-3: xcodebuild test exits TEST SUCCEEDED for all 3 affected test files

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSFormField atom composition fix
  GIVEN: LSFormField.swift at ios/LaneShadow/Views/Molecules/LSFormField.swift
  WHEN:  reading lines 30-55 (label row + error text sections)
  THEN:  no raw Text() calls exist — all text rendered via LSText with appropriate TypographyVariant and ContentColor
  VERIFY: grep -c "Text(" ios/LaneShadow/Views/Molecules/LSFormField.swift returns 0 (after excluding import/comments)
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSFormFieldTests.swift

AC-2: Vanity test stubs replaced
  GIVEN: test files LSFormFieldTests.swift, LSTabItemTests.swift, LSEmptyStateTests.swift
  WHEN:  searching for #expect(true)
  THEN:  zero matches found; each former stub now asserts real behavior (color tokens, layout properties, or callback firing)
  VERIFY: grep -rn "#expect(true)" ios/LaneShadowTests/Molecules/LSFormFieldTests.swift ios/LaneShadowTests/Molecules/LSTabItemTests.swift ios/LaneShadowTests/Molecules/LSEmptyStateTests.swift returns no output
  TDD_STATE: none

AC-3: Tests pass
  GIVEN: the 3 affected test files
  WHEN:  running xcodebuild test
  THEN:  all tests exit TEST SUCCEEDED with zero failures
  VERIFY: cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFormFieldTests -only-testing:LaneShadowTests/LSTabItemTests -only-testing:LaneShadowTests/LSEmptyStateTests 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Molecules/LSFormField.swift (lines 27-59 — full body)
- ios/LaneShadow/Views/Atoms/LSText.swift (public API — variant + color params)
- ios/LaneShadowTests/Molecules/LSFormFieldTests.swift (stub lines 22, 39, 46)
- ios/LaneShadowTests/Molecules/LSTabItemTests.swift (stub line 27)
- ios/LaneShadowTests/Molecules/LSEmptyStateTests.swift (stub line 21)
- ios/LaneShadowTests/Molecules/LSContentCardTests.swift (reference — good test pattern to follow)

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE_ALLOWED:
  - ios/LaneShadow/Views/Molecules/LSFormField.swift (MODIFY)
  - ios/LaneShadowTests/Molecules/LSFormFieldTests.swift (MODIFY)
  - ios/LaneShadowTests/Molecules/LSTabItemTests.swift (MODIFY)
  - ios/LaneShadowTests/Molecules/LSEmptyStateTests.swift (MODIFY)

WRITE_PROHIBITED:
  - ios/LaneShadow.xcodeproj/project.pbxproj
  - All atom files (ios/LaneShadow/Views/Atoms/*)
  - All other molecule files

--------------------------------------------------------------------------------
VERIFICATION GATES
--------------------------------------------------------------------------------

| Gate | Command | Expected |
|------|---------|----------|
| Atom composition | grep -c "Text(" ios/LaneShadow/Views/Molecules/LSFormField.swift | 0 |
| No vanity stubs | grep -rn "#expect(true)" ios/LaneShadowTests/Molecules/LSFormFieldTests.swift ios/LaneShadowTests/Molecules/LSTabItemTests.swift ios/LaneShadowTests/Molecules/LSEmptyStateTests.swift | No output |
| Format clean | swiftformat --lint ios/LaneShadow/Views/Molecules/LSFormField.swift | Exit 0 |
| Tests pass | cd ios && xcodebuild test ... | TEST SUCCEEDED |

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

Discovered by red-hat review 2026-04-24. Specific locations:
- LSFormField.swift:34 — raw Text("*") with .font()/.foregroundStyle()
- LSFormField.swift:51 — raw Text(error) with .font()/.foregroundStyle()
- LSFormFieldTests.swift:22,39,46 — #expect(true)
- LSTabItemTests.swift:27 — #expect(true)
- LSEmptyStateTests.swift:21 — #expect(true)

Use LSContentCardTests.swift as a reference for good test patterns — those tests verify atom composition, token values, and layout via accessibility identifiers.
