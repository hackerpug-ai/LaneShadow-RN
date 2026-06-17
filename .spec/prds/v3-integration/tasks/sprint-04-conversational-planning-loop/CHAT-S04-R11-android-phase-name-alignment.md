================================================================================
TASK: CHAT-S04-R11 - Android phase name alignment to canonical taxonomy
================================================================================

TASK_TYPE:  REFACTOR
STATUS:     REOPENED (round-3 RF-20)
PRIORITY:   P1
EFFORT:     S
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:        cd android && ./gradlew test --tests com.laneshadow.services.PhaseTaxonomyTest
  instrumented: cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.molecules.LSPhaseIndicatorUiTest
  typecheck:   cd android && ./gradlew :app:compileDebugKotlin
  lint:        cd android && ./gradlew detekt

PROGRESS: 2/5 AC · RF-20: Phase enum exists but is dead code — fromLabel() has ZERO call sites; PlanningViewModel still uses raw string when(); phaseIndexForStatus() is raw string match

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Phase enum and labels match canonical taxonomy parsing→searching→drafting→enriching→finalizing across services, ViewModel mapping, and sandbox.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use exactly: Parsing, Searching, Drafting, Enriching, Finalizing (Kotlin enum cases)
- MUST cover all 5 names in label-to-phase mapping with no aliases for legacy strings
- MUST update ViewModel mapping of `db.sessionMessages.status` to canonical phase names
- MUST update sandbox MockProviders to use canonical labels (no Sketching/Reading/etc.)
- NEVER keep legacy phase strings as fallback — purge them so server/client stays in sync
- NEVER diverge from iOS phase taxonomy — must mirror R06 exactly
- STRICTLY single source of truth for phase taxonomy in `services/RideFlowState.kt`
- STRICTLY MockProviders.kt and LSPhaseIndicator stories reference the enum, not hardcoded strings

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Phase enum has canonical cases only (AC-1 PRIMARY)
- [ ] Label-to-phase map covers all 5 names (AC-2)
- [ ] ViewModel maps server status to canonical phase (AC-3)
- [ ] MockProviders use canonical labels (AC-4)
- [ ] LSPhaseIndicator instrumented snapshot updated (AC-5)
- [ ] gradlew test + compileDebugKotlin clean
- [ ] detekt clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Phase enum has canonical cases only [PRIMARY]
  GIVEN: RideFlowState.kt is loaded
  WHEN:  Phase enum values are inspected
  THEN:  Enum contains exactly Parsing, Searching, Drafting, Enriching, Finalizing AND no legacy cases (Sketching, Reading, etc.)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/PhaseTaxonomyTest.kt
  TEST_FUNCTION: phase_enum_contains_only_canonical_cases

AC-2: Label-to-phase map covers all 5 names
  GIVEN: PhaseLabels map is loaded
  WHEN:  Map keys are inspected
  THEN:  Map contains exactly the strings 'parsing', 'searching', 'drafting', 'enriching', 'finalizing' (lowercase) AND each maps to the corresponding Phase enum

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/PhaseTaxonomyTest.kt
  TEST_FUNCTION: label_map_covers_all_canonical_names

AC-3: ViewModel maps server status to canonical phase
  GIVEN: RideFlowViewModel receives a sessionMessages.status update with values 'parsing', 'searching', 'drafting', 'enriching', 'finalizing'
  WHEN:  ViewModel processes each status
  THEN:  Emitted UI state contains corresponding Phase enum case AND no Phase.Unknown is emitted for canonical inputs

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/RideFlowViewModelPhaseMappingTest.kt
  TEST_FUNCTION: view_model_maps_server_status_to_canonical_phase

AC-4: MockProviders use canonical labels
  GIVEN: MockProviders.kt sandbox fixtures are loaded
  WHEN:  All phase-related mocks are inspected
  THEN:  No mock string contains 'Sketching', 'Reading', 'Tracing', or any legacy label AND all phase mocks reference Phase enum cases

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/sandbox/MockProvidersPhaseTest.kt
  TEST_FUNCTION: mock_providers_use_canonical_phase_labels

AC-5: LSPhaseIndicator instrumented snapshot updated
  GIVEN: LSPhaseIndicator UI test is run for each canonical phase
  WHEN:  Snapshot is captured
  THEN:  Each phase renders the canonical display label AND no orphan snapshot for legacy labels remains

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSPhaseIndicatorUiTest.kt
  TEST_FUNCTION: renders_canonical_label_for_each_phase

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Type |
|-----|-----------|---------|------|
| TC-1 | Unit test asserts Phase enum has only 5 canonical cases | AC-1 | happy_path |
| TC-2 | Unit test asserts label map covers 5 canonical strings | AC-2 | happy_path |
| TC-3 | ViewModel test asserts canonical phase emission for each server status | AC-3 | happy_path |
| TC-4 | Sandbox test asserts no legacy label strings exist in MockProviders | AC-4 | happy_path |
| TC-5 | Instrumented snapshot test for LSPhaseIndicator covers all 5 phases with canonical labels | AC-5 | happy_path |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/services/RideFlowState.kt
- android/app/src/main/java/com/laneshadow/services/RideFlowViewModel.kt
- android/app/src/main/java/com/laneshadow/ui/sandbox/MockProviders.kt
- android/app/src/test/java/com/laneshadow/services/PhaseTaxonomyTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/services/RideFlowViewModelPhaseMappingTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/sandbox/MockProvidersPhaseTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSPhaseIndicatorUiTest.kt (NEW or MODIFY)

writeProhibited:
- android/build/** — generated
- android/app/build/** — generated
- convex/** — server source of truth out of scope
- ios/** — iOS handled by R06

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Enum-first: consumers reference Phase.X not strings
- Label map exposed as `Map<String, Phase>` for inbound parsing and `List<String>` for display order
- No legacy fallback strings — purge during this task

⚠️ Ask First:
- Renaming Phase enum cases to plural / different casing (stay singular PascalCase per Kotlin convention)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- RideFlowState.kt (MODIFY): canonical Phase enum + label map
- RideFlowViewModel.kt (MODIFY): server-status-to-Phase mapping
- MockProviders.kt (MODIFY): canonical labels in mock data
- PhaseTaxonomyTest.kt + RideFlowViewModelPhaseMappingTest.kt + MockProvidersPhaseTest.kt (NEW): unit coverage
- LSPhaseIndicatorUiTest.kt (NEW or MODIFY): instrumented snapshot per phase

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH AC:

### RED PHASE
- READ: AC, current Phase enum + MockProviders legacy strings
- WRITE: ONE unit / instrumented test asserting canonical taxonomy
- RUN: `./gradlew test --tests <TestClass>` or `./gradlew connectedDebugAndroidTest`
- VERIFY: Test FAILS

### GREEN PHASE
- WRITE: minimal rename + map update
- RUN: tests
- VERIFY: Test PASSES

### REFACTOR PHASE
- READ: full diff
- RUN: full ./gradlew test + detekt + token compliance
- VERIFY: still green

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. android/app/src/main/java/com/laneshadow/services/RideFlowState.kt [PRIMARY PATTERN]
   - Lines: all
   - Focus: Phase enum + label map current definitions

2. android/app/src/main/java/com/laneshadow/ui/sandbox/MockProviders.kt
   - Lines: all
   - Focus: Legacy label strings to replace

3. android/app/src/main/java/com/laneshadow/ui/molecules/LSPhaseIndicator.kt
   - Lines: all
   - Focus: Phase rendering signature

4. .spec/reviews/red-hat-sprint-04-2026-05-03T14-19-50Z.md
   - Lines: F-06 section
   - Focus: Canonical taxonomy spec

5. ios/LaneShadow/Services/RideFlow.swift
   - Lines: all
   - Focus: iOS canonical phase taxonomy mirror

6. convex/schema.ts
   - Lines: all
   - Focus: sessionMessages.status field values

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: All unit tests pass
  Command: cd android && ./gradlew test --tests com.laneshadow.services.PhaseTaxonomyTest --tests com.laneshadow.services.RideFlowViewModelPhaseMappingTest --tests com.laneshadow.ui.sandbox.MockProvidersPhaseTest
  Expected: Exit 0.

Gate 3: Instrumented snapshot test passes
  Command: cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.molecules.LSPhaseIndicatorUiTest
  Expected: Exit 0.

Gate 4: Compile clean
  Command: cd android && ./gradlew :app:compileDebugKotlin
  Expected: Exit 0.

Gate 5: detekt clean
  Command: cd android && ./gradlew detekt
  Expected: Exit 0.

Gate 6: No legacy phase strings remain
  Command: grep -rn "Sketching\|Reading the sky\|Validating\|Tracing\|Building" android/app/src/main/ android/app/src/main/java/com/laneshadow/ui/sandbox/ || true
  Expected: Empty output.

Gate 7: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: (none)
Blocks:     CHAT-S04-R12 (Android instrumented E2E gate step 2 needs canonical labels)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-R11",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "Phase enum exactly canonical cases", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.PhaseTaxonomyTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "Label map covers all canonical names", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.PhaseTaxonomyTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "ViewModel maps server status to canonical phase", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.RideFlowViewModelPhaseMappingTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "MockProviders use canonical labels only", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.sandbox.MockProvidersPhaseTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "LSPhaseIndicator snapshot covers canonical labels", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.molecules.LSPhaseIndicatorUiTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Unit test for canonical Phase enum cases", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.PhaseTaxonomyTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Unit test for label map coverage", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.PhaseTaxonomyTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "ViewModel mapping unit test", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.RideFlowViewModelPhaseMappingTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "MockProviders sanity test", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.sandbox.MockProvidersPhaseTest", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Instrumented snapshot for LSPhaseIndicator canonical labels", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.molecules.LSPhaseIndicatorUiTest", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
