================================================================================
TASK: CHAT-S04-R14 - Android LaneShadowErrorMapper consumes auth-error-taxonomy.json fixture
================================================================================

TASK_TYPE:  FEATURE
STATUS:     REOPENED (round-3 RF-23)
PRIORITY:   P1
EFFORT:     XS
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test --tests com.laneshadow.services.LaneShadowErrorMapperTest --tests com.laneshadow.services.LaneShadowErrorMapperFixtureTest
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 2/3 AC · RF-23: AC-3 round-trip FAILS — NETWORK_TIMEOUT in fixture but laneShadowErrorForCode returns null (NetworkTimeout requires IOException); remove NETWORK_TIMEOUT from fixture or special-case

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Android `LaneShadowErrorMapper` consumes the `auth-error-taxonomy.json` fixture from R03; structured `UNAUTHENTICATED` and `FORBIDDEN` codes from server land as `Unauthenticated` and `Forbidden` sealed-class cases respectively — closing the sign-out flow that was broken by token-matching against the freeform `'Authentication required'` string.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST add `Forbidden` case to `LaneShadowError` sealed class if not present
- MUST add `UNAUTHENTICATED` and `FORBIDDEN` to `KnownErrorCodes` set in `LaneShadowErrorMapper.kt`
- MUST drop the prefix-token rationalization for `'Authentication'` (no longer needed since server emits structured code)
- MUST add a fixture-driven test that round-trips every entry in `server/convex/__fixtures__/auth-error-taxonomy.json` through `toLaneShadowError(throwable)` and asserts the `mobile_mapping_target` matches the resulting sealed-class case
- NEVER hand-code mapping that diverges from the server fixture
- STRICTLY mapping is sourced from the canonical fixture, not duplicated freeform

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] LaneShadowError sealed class has Forbidden case (AC-1 PRIMARY)
- [ ] KnownErrorCodes includes UNAUTHENTICATED + FORBIDDEN (AC-2)
- [ ] Fixture round-trip test passes for every entry (AC-3)
- [ ] gradlew test + compileDebugKotlin clean
- [ ] detekt clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: LaneShadowError sealed class has Forbidden case [PRIMARY]
  GIVEN: `LaneShadowError.kt` is read after the change
  WHEN:  Sealed class hierarchy is inspected
  THEN:  Cases include `Unauthenticated` (existing) and `Forbidden` (new); both have a `messageResId` for user-facing copy

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/LaneShadowErrorMapperTest.kt
  TEST_FUNCTION: laneShadowError_includesForbiddenCase

AC-2: KnownErrorCodes includes UNAUTHENTICATED + FORBIDDEN
  GIVEN: `LaneShadowErrorMapper.kt` is read after the change
  WHEN:  `KnownErrorCodes` set + `toKnownErrorCode` mapping are inspected
  THEN:  Both `"UNAUTHENTICATED"` and `"FORBIDDEN"` are present in `KnownErrorCodes`; the prefix-token rationalization for `'Authentication'` is removed

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/LaneShadowErrorMapperTest.kt
  TEST_FUNCTION: knownErrorCodes_includesUnauthenticatedAndForbidden

AC-3: Fixture round-trip test passes for every entry
  GIVEN: `server/convex/__fixtures__/auth-error-taxonomy.json` is loaded as an Android test resource (via `androidTest/resources/` or a Kotlin classpath resource)
  WHEN:  Each fixture entry's `code` is wrapped in a `ConvexException` (or equivalent) and passed through `toLaneShadowError(throwable)`
  THEN:  The resulting `LaneShadowError` case class name matches the fixture's `mobile_mapping_target` for every entry; zero mismatches

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/LaneShadowErrorMapperFixtureTest.kt
  TEST_FUNCTION: fixtureRoundTrip_everyCodeMapsToTarget

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Type |
|-----|-----------|---------|------|
| TC-1 | LaneShadowError sealed hierarchy contains Forbidden case with messageResId | AC-1 | happy_path |
| TC-2 | KnownErrorCodes contains UNAUTHENTICATED and FORBIDDEN; prefix 'Authentication' rationalization absent | AC-2 | happy_path |
| TC-3 | Loop over fixture; every entry's code → sealed-class case matches mobile_mapping_target | AC-3 | integration |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/services/LaneShadowError.kt
- android/app/src/main/java/com/laneshadow/services/LaneShadowErrorMapper.kt
- android/app/src/main/res/values/strings.xml (MODIFY — add error_forbidden string resource)
- android/app/src/test/java/com/laneshadow/services/LaneShadowErrorMapperTest.kt (MODIFY OR CREATE)
- android/app/src/test/java/com/laneshadow/services/LaneShadowErrorMapperFixtureTest.kt (NEW)
- android/app/src/test/resources/auth-error-taxonomy.json (NEW — copy from server fixture)

writeProhibited:
- android/build/** — generated
- android/app/build/** — generated
- server/convex/** — fixture is consumed read-only
- ios/** — iOS handled by R13

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Source mapping from fixture, not freeform code
- Use stringResource id for new Forbidden case (consistent with existing cases)

⚠️ Ask First:
- Whether to mirror or copy the fixture (copy is fine for test resources)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- LaneShadowError.kt (MODIFY): add Forbidden case with messageResId
- LaneShadowErrorMapper.kt (MODIFY): KnownErrorCodes + mapping for new codes; remove prefix-token rationalization
- strings.xml (MODIFY): add error_forbidden string
- LaneShadowErrorMapperFixtureTest.kt (NEW): fixture round-trip
- android/app/src/test/resources/auth-error-taxonomy.json (NEW): test resource

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH AC:

### RED PHASE
- READ: AC, current LaneShadowError + LaneShadowErrorMapper
- WRITE: ONE JUnit test
- RUN: `./gradlew test --tests com.laneshadow.services.LaneShadowErrorMapper*Test`
- VERIFY: Test FAILS

### GREEN PHASE
- WRITE: minimal sealed-class + KnownErrorCodes addition
- RUN: tests
- VERIFY: Test PASSES

### REFACTOR PHASE
- READ: full diff
- RUN: full ./gradlew test + detekt
- VERIFY: still green

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. android/app/src/main/java/com/laneshadow/services/LaneShadowErrorMapper.kt [PRIMARY PATTERN]
   - Lines: all
   - Focus: KnownErrorCodes set + toKnownErrorCode token-matching pattern + 'Authentication' rationalization to remove

2. android/app/src/main/java/com/laneshadow/services/LaneShadowError.kt
   - Lines: all
   - Focus: sealed-class cases + messageResId pattern; add Forbidden following existing pattern

3. server/convex/__fixtures__/auth-error-taxonomy.json (after R03)
   - Lines: all
   - Focus: source of truth for test fixtures

4. .spec/reviews/red-hat-sprint-04-2026-05-03T14-19-50Z.md
   - Lines: F-04 section
   - Focus: Background — sign-out flow break root cause on Android

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: All unit tests pass
  Command: cd android && ./gradlew test --tests com.laneshadow.services.LaneShadowErrorMapperTest --tests com.laneshadow.services.LaneShadowErrorMapperFixtureTest
  Expected: Exit 0.

Gate 3: Compile clean
  Command: cd android && ./gradlew :app:compileDebugKotlin
  Expected: Exit 0.

Gate 4: detekt clean
  Command: cd android && ./gradlew detekt
  Expected: Exit 0.

Gate 5: No legacy 'Authentication' prefix-token rationalization remains
  Command: grep -n "Authentication" android/app/src/main/java/com/laneshadow/services/LaneShadowErrorMapper.kt | grep -v "^//" || true
  Expected: Empty output (or only comments).

Gate 6: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-R03 (auth-error-taxonomy.json fixture must exist)
Blocks:     (none — closes the F-04 sign-out flow loop end-to-end on Android)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-R14",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "LaneShadowError sealed class has Forbidden case", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.LaneShadowErrorMapperTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "KnownErrorCodes includes UNAUTHENTICATED + FORBIDDEN; prefix 'Authentication' rationalization removed", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.LaneShadowErrorMapperTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "Fixture round-trip — every code maps to mobile_mapping_target", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.LaneShadowErrorMapperFixtureTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Forbidden case present with messageResId", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.LaneShadowErrorMapperTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "KnownErrorCodes set contains UNAUTHENTICATED + FORBIDDEN; prefix-token absent", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.LaneShadowErrorMapperTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Fixture loop — every code → sealed-class case matches mobile_mapping_target", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.LaneShadowErrorMapperFixtureTest", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
