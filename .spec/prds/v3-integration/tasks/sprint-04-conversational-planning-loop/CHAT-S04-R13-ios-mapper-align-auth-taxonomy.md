================================================================================
TASK: CHAT-S04-R13 - iOS LaneShadowError mapper consumes auth-error-taxonomy.json fixture
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     XS
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test:      xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/LaneShadowErrorMappingTests
  typecheck: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --lint ios/

PROGRESS: 0/3 AC · pending

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

iOS `LaneShadowErrorMapping` consumes the `auth-error-taxonomy.json` fixture from R03; structured `UNAUTHENTICATED` and `FORBIDDEN` codes from server land as `.unauthenticated` and `.forbidden` enum cases respectively.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST add `.forbidden` case to `LaneShadowError` enum if not present
- MUST update `LaneShadowErrorMapping.swift` codeMap to include `UNAUTHENTICATED → .unauthenticated` and `FORBIDDEN → .forbidden`
- MUST drop the legacy `mapCanonicalPhrase("authentication required")` entry (no longer needed since server emits structured code)
- MUST add a fixture-driven test that round-trips every entry in `convex/__fixtures__/auth-error-taxonomy.json` through the mapper and asserts the `mobile_mapping_target` matches the resulting enum case
- NEVER hand-code mapping that diverges from the server fixture
- NEVER edit ios/LaneShadow.xcodeproj/** directly
- STRICTLY mapping is sourced from the canonical fixture, not duplicated freeform

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] LaneShadowError has .forbidden case (AC-1 PRIMARY)
- [ ] codeMap includes UNAUTHENTICATED + FORBIDDEN (AC-2)
- [ ] Fixture round-trip test passes for every entry (AC-3)
- [ ] xcodebuild test + build clean
- [ ] swiftformat --lint passes
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: LaneShadowError has .forbidden case [PRIMARY]
  GIVEN: `LaneShadowError.swift` is read after the change
  WHEN:  Enum cases are inspected
  THEN:  Cases include `.unauthenticated` (existing) and `.forbidden` (new); both have user-facing copy strings

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Services/LaneShadowErrorMappingTests.swift
  TEST_FUNCTION: test_laneShadowError_includesForbiddenCase

AC-2: codeMap includes UNAUTHENTICATED + FORBIDDEN
  GIVEN: `LaneShadowErrorMapping.swift` is read after the change
  WHEN:  The codeMap dictionary is inspected
  THEN:  Entries `"UNAUTHENTICATED": .unauthenticated` and `"FORBIDDEN": .forbidden` are present; legacy `mapCanonicalPhrase("authentication required")` mapping is removed

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Services/LaneShadowErrorMappingTests.swift
  TEST_FUNCTION: test_codeMap_includesUnauthenticatedAndForbidden

AC-3: Fixture round-trip test passes for every entry
  GIVEN: `convex/__fixtures__/auth-error-taxonomy.json` exists and is loaded as a test resource
  WHEN:  Each fixture entry's `code` is passed through `LaneShadowErrorMapping.from(code:)` (or equivalent)
  THEN:  The resulting `LaneShadowError` case description matches the fixture's `mobile_mapping_target` for every entry; zero mismatches

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Services/LaneShadowErrorMappingFixtureTests.swift
  TEST_FUNCTION: test_fixtureRoundTrip_everyCodeMapsToTarget

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Type |
|-----|-----------|---------|------|
| TC-1 | LaneShadowError contains .forbidden case with non-empty user-facing copy | AC-1 | happy_path |
| TC-2 | codeMap entries for UNAUTHENTICATED and FORBIDDEN map to correct cases; legacy phrase entry absent | AC-2 | happy_path |
| TC-3 | Loop over fixture; every entry's code → enum case matches mobile_mapping_target | AC-3 | integration |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Services/LaneShadowError.swift
- ios/LaneShadow/Services/LaneShadowErrorMapping.swift
- ios/LaneShadowTests/Services/LaneShadowErrorMappingTests.swift (MODIFY OR CREATE)
- ios/LaneShadowTests/Services/LaneShadowErrorMappingFixtureTests.swift (NEW)
- ios/LaneShadowTests/Resources/auth-error-taxonomy.json (NEW — symlink or copy from server fixture)
- ios/project.yml

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated
- ios/LaneShadow/Generated/** — generated
- convex/** — fixture is consumed read-only
- android/** — Android handled by R14

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Source mapping from fixture, not freeform code
- Add user-facing copy for new .forbidden case via existing copy table

⚠️ Ask First:
- Symlink vs copy of the fixture into iOS test resources (stay simple — copy is fine)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- LaneShadowError.swift (MODIFY): add .forbidden case + copy
- LaneShadowErrorMapping.swift (MODIFY): codeMap entries + remove legacy phrase mapping
- LaneShadowErrorMappingFixtureTests.swift (NEW): fixture round-trip
- ios/LaneShadowTests/Resources/auth-error-taxonomy.json (NEW): test resource

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH AC:

### RED PHASE
- READ: AC, current LaneShadowError + LaneShadowErrorMapping
- WRITE: ONE Swift Testing test
- RUN: `xcodebuild ... test -only-testing:LaneShadowTests/LaneShadowError*Tests/<test_function>`
- VERIFY: Test FAILS

### GREEN PHASE
- WRITE: minimal enum + codeMap addition
- RUN: `xcodebuild ... test`
- VERIFY: Test PASSES

### REFACTOR PHASE
- READ: full diff
- RUN: full xcodebuild + lint
- VERIFY: still green

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ios/LaneShadow/Services/LaneShadowErrorMapping.swift [PRIMARY PATTERN]
   - Lines: 28-83
   - Focus: codeMap structure + canonical-phrase mapping to be removed

2. ios/LaneShadow/Services/LaneShadowError.swift
   - Lines: all
   - Focus: enum cases + user-facing copy; add .forbidden following existing pattern

3. convex/__fixtures__/auth-error-taxonomy.json (after R03)
   - Lines: all
   - Focus: source of truth for test fixtures

4. .spec/reviews/red-hat-sprint-04-2026-05-03T14-19-50Z.md
   - Lines: F-04 section
   - Focus: Background — sign-out flow break root cause

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: All Swift Testing tests pass
  Command: xcodebuild ... test -only-testing:LaneShadowTests/LaneShadowErrorMappingTests -only-testing:LaneShadowTests/LaneShadowErrorMappingFixtureTests
  Expected: Exit 0.

Gate 3: Build clean
  Command: xcodebuild ... build
  Expected: Exit 0.

Gate 4: Lint clean
  Command: swiftformat --lint ios/
  Expected: Exit 0.

Gate 5: No legacy phrase mapping remains
  Command: grep -n "mapCanonicalPhrase" ios/LaneShadow/Services/LaneShadowErrorMapping.swift | grep -i "authentication required" || true
  Expected: Empty output.

Gate 6: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-R03 (auth-error-taxonomy.json fixture must exist)
Blocks:     (none — closes the F-04 sign-out flow loop end-to-end on iOS)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-R13",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "LaneShadowError has .forbidden case", "verify": "xcodebuild test -only-testing:LaneShadowTests/LaneShadowErrorMappingTests/test_laneShadowError_includesForbiddenCase", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "codeMap includes UNAUTHENTICATED + FORBIDDEN; legacy phrase mapping removed", "verify": "xcodebuild test -only-testing:LaneShadowTests/LaneShadowErrorMappingTests/test_codeMap_includesUnauthenticatedAndForbidden", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "Fixture round-trip — every code maps to its mobile_mapping_target", "verify": "xcodebuild test -only-testing:LaneShadowTests/LaneShadowErrorMappingFixtureTests/test_fixtureRoundTrip_everyCodeMapsToTarget", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": ".forbidden case present with user-facing copy", "maps_to_ac": "AC-1", "verify": "xcodebuild test -only-testing:LaneShadowTests/LaneShadowErrorMappingTests/test_laneShadowError_includesForbiddenCase", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "codeMap contains UNAUTHENTICATED + FORBIDDEN; legacy phrase entry absent", "maps_to_ac": "AC-2", "verify": "xcodebuild test -only-testing:LaneShadowTests/LaneShadowErrorMappingTests/test_codeMap_includesUnauthenticatedAndForbidden", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Fixture loop — every code → enum matches mobile_mapping_target", "maps_to_ac": "AC-3", "verify": "xcodebuild test -only-testing:LaneShadowTests/LaneShadowErrorMappingFixtureTests/test_fixtureRoundTrip_everyCodeMapsToTarget", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
