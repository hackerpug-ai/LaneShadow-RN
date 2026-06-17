================================================================================
TASK: CHAT-S04-R06 - iOS phase name alignment to canonical taxonomy
================================================================================

TASK_TYPE:  REFACTOR
STATUS:     REOPENED (round-3 RF-20)
PRIORITY:   P1
EFFORT:     S
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test:      xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test
  typecheck: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --lint ios/

PROGRESS: 2/5 AC · RF-20: no typed Phase enum; currentPhase still String="analyzing"; AC-5 ConvexPhaseDecodingTests not created; PlanningState.currentPhase must become Phase?

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

iOS phase indicator displays canonical taxonomy (parsing/searching/drafting/enriching/finalizing) matching SPRINT.md spec and backend status strings.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use exactly: parsing, searching, drafting, enriching, finalizing
- MUST update enum cases AND label-to-phase mapping AND MockProviders
- MUST verify backend status string values via convex client decoding test
- MUST update snapshot stories so LSPhaseIndicator renders the new labels
- NEVER leave any reference to legacy names (reading, sketching, validating, weather, building) in production paths
- NEVER edit ios/LaneShadow.xcodeproj/** directly
- STRICTLY do not change LSPhaseIndicator visual layout — labels only
- STRICTLY story id naming canonical format is handled by R07 — do not pre-empt

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Phase enum uses canonical cases (AC-1 PRIMARY)
- [ ] Label-to-phase mapping covers all 5 names (AC-2)
- [ ] MockProviders use canonical labels (AC-3)
- [ ] LSPhaseIndicator snapshot tests updated (AC-4)
- [ ] Backend status string mapping verified (AC-5)
- [ ] xcodebuild test + build clean
- [ ] swiftformat --lint passes
- [ ] pnpm snapshots:check passes
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Phase enum uses canonical cases [PRIMARY]
  GIVEN: RideFlow phase enum exists
  WHEN:  The enum declaration is inspected
  THEN:  The cases are exactly: parsing, searching, drafting, enriching, finalizing — no legacy names remain

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Services/RideFlowPhaseTaxonomyTests.swift
  TEST_FUNCTION: test_phaseEnum_containsExactlyCanonicalCases

AC-2: Label-to-phase mapping covers all 5 names
  GIVEN: Backend status strings 'parsing','searching','drafting','enriching','finalizing'
  WHEN:  Each is decoded into the iOS phase enum
  THEN:  Each maps to the corresponding canonical case with no fallback to legacy or unknown

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Services/RideFlowPhaseTaxonomyTests.swift
  TEST_FUNCTION: test_labelMap_decodesAllFiveCanonicalLabels

AC-3: MockProviders use canonical labels
  GIVEN: Sandbox MockProviders for planning flow
  WHEN:  Each provider's emitted phases are inspected
  THEN:  Every emitted phase label is from the canonical set; no legacy labels remain

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/MockProvidersPhaseTests.swift
  TEST_FUNCTION: test_mockProviders_emitOnlyCanonicalPhases

AC-4: LSPhaseIndicator snapshot tests updated
  GIVEN: Snapshot stories for LSPhaseIndicator across all 5 phases
  WHEN:  Snapshots are regenerated
  THEN:  Each snapshot shows the canonical label text and pnpm snapshots:check passes

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/LSPhaseIndicatorSnapshotTests.swift
  TEST_FUNCTION: test_phaseIndicator_rendersCanonicalLabels

AC-5: Backend status string mapping verified
  GIVEN: Convex sessionMessages status field as exposed in ConvexClient+LaneShadow
  WHEN:  A representative payload for each status is decoded
  THEN:  Decoder returns the matching iOS canonical phase enum value with zero unknown fallbacks

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Services/ConvexPhaseDecodingTests.swift
  TEST_FUNCTION: test_convexStatus_decodesToCanonicalPhase

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Type |
|-----|-----------|---------|------|
| TC-1 | Enum case set equals the canonical 5-name set | AC-1 | happy_path |
| TC-2 | Each canonical label decodes to the matching enum case | AC-2 | happy_path |
| TC-3 | MockProviders emit only canonical labels | AC-3 | happy_path |
| TC-4 | Snapshot diff is clean after rename | AC-4 | happy_path |
| TC-5 | Convex decoder yields canonical phase for every backend status | AC-5 | happy_path |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Services/RideFlow.swift
- ios/LaneShadow/Services/ConvexClient+LaneShadow.swift
- ios/LaneShadow/Sandbox/MockProviders/**
- ios/LaneShadow/Views/Components/LSPhaseIndicator.swift
- ios/LaneShadowTests/Services/RideFlowPhaseTaxonomyTests.swift (NEW)
- ios/LaneShadowTests/Services/ConvexPhaseDecodingTests.swift (NEW)
- ios/LaneShadowTests/Sandbox/MockProvidersPhaseTests.swift (NEW)
- ios/LaneShadowTests/Sandbox/LSPhaseIndicatorSnapshotTests.swift (NEW)
- ios/LaneShadowTests/__Snapshots__/** (regenerated PNGs)
- ios/project.yml

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated
- ios/LaneShadow/Generated/** — generated
- convex/** — coordinate with convex-planner; do not unilaterally change backend
- ios/LaneShadow/Sandbox/Stories/** — story IDs reserved for R07

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use enum rawValue == canonical label string
- Update MockProviders + snapshot baselines together
- Run snapshot:check after rename

⚠️ Ask First:
- Adding fallback for legacy strings (don't — purge them)
- Changing LSPhaseIndicator visual layout (out of scope)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Services/RideFlow.swift (MODIFY): canonical phase enum + label map
- ios/LaneShadow/Services/ConvexClient+LaneShadow.swift (MODIFY): backend status decoder
- ios/LaneShadow/Sandbox/MockProviders/** (MODIFY): canonical labels in mock data
- ios/LaneShadow/Views/Components/LSPhaseIndicator.swift (MODIFY): label rendering
- ios/LaneShadowTests/Services/* (NEW): taxonomy + decoder coverage
- ios/LaneShadowTests/Sandbox/* (NEW): MockProviders + snapshot coverage

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH AC:

### RED PHASE
- READ: AC, current RideFlow phase enum + label maps
- WRITE: ONE Swift Testing test
- RUN: `xcodebuild ... test -only-testing:LaneShadowTests/<TestFile>/<test_function>`
- VERIFY: Test FAILS

### GREEN PHASE
- WRITE: minimal rename
- RUN: `xcodebuild ... test`
- VERIFY: Test PASSES

### REFACTOR PHASE
- READ: full surface
- RUN: full xcodebuild test + lint + snapshot:check
- VERIFY: still green

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ios/LaneShadow/Services/RideFlow.swift [PRIMARY PATTERN]
   - Lines: all
   - Focus: phase enum + label map

2. ios/LaneShadow/Sandbox/MockProviders
   - Lines: all
   - Focus: legacy phase label emissions

3. ios/LaneShadow/Views/Components/LSPhaseIndicator.swift
   - Lines: all
   - Focus: label rendering surface

4. ios/LaneShadow/Services/ConvexClient+LaneShadow.swift
   - Lines: all
   - Focus: sessionMessages status decoding

5. .spec/prds/v3-integration/tasks/sprint-04-conversational-planning-loop/SPRINT.md
   - Lines: phase taxonomy section
   - Focus: canonical 5-name spec

6. .spec/reviews/red-hat-sprint-04-2026-05-03T14-19-50Z.md
   - Lines: F-06 section
   - Focus: exact failure description

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: Each AC has a test
  Verify: Test file contains one test per AC.

Gate 3: All Swift Testing tests pass
  Command: xcodebuild ... test
  Expected: Exit 0.

Gate 4: Build clean
  Command: xcodebuild ... build
  Expected: Exit 0.

Gate 5: Lint clean
  Command: swiftformat --lint ios/
  Expected: Exit 0.

Gate 6: Token compliance
  Command: scripts/tokens/enforce-native-compliance.sh
  Expected: Exit 0.

Gate 7: Snapshot parity
  Command: pnpm snapshots:check
  Expected: Exit 0.

Gate 8: No legacy phase strings remain in production
  Command: grep -rn "Sketching\|Reading\|Validating\|Weather\|Building" ios/LaneShadow/Services/ ios/LaneShadow/Views/ ios/LaneShadow/Sandbox/MockProviders/ || true
  Expected: Empty output (zero matches in production paths).

Gate 9: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: (none)
Blocks:     CHAT-S04-R08 (iOS XCUITest E2E gate step 2 needs canonical labels)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-R06",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "Canonical phase enum cases", "verify": "xcodebuild test -only-testing:LaneShadowTests/RideFlowPhaseTaxonomyTests/test_phaseEnum_containsExactlyCanonicalCases", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "Label-to-phase mapping coverage", "verify": "xcodebuild test -only-testing:LaneShadowTests/RideFlowPhaseTaxonomyTests/test_labelMap_decodesAllFiveCanonicalLabels", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "MockProviders updated to canonical labels", "verify": "xcodebuild test -only-testing:LaneShadowTests/MockProvidersPhaseTests/test_mockProviders_emitOnlyCanonicalPhases", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "Snapshot tests updated and parity passes", "verify": "pnpm snapshots:check", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "Backend status decoding verified", "verify": "xcodebuild test -only-testing:LaneShadowTests/ConvexPhaseDecodingTests/test_convexStatus_decodesToCanonicalPhase", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Enum cases equal canonical set", "maps_to_ac": "AC-1", "verify": "xcodebuild test -only-testing:LaneShadowTests/RideFlowPhaseTaxonomyTests/test_phaseEnum_containsExactlyCanonicalCases", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "All five labels decode correctly", "maps_to_ac": "AC-2", "verify": "xcodebuild test -only-testing:LaneShadowTests/RideFlowPhaseTaxonomyTests/test_labelMap_decodesAllFiveCanonicalLabels", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Mock provider phase emissions canonical", "maps_to_ac": "AC-3", "verify": "xcodebuild test -only-testing:LaneShadowTests/MockProvidersPhaseTests/test_mockProviders_emitOnlyCanonicalPhases", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Snapshot parity check passes", "maps_to_ac": "AC-4", "verify": "pnpm snapshots:check", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Convex decoder canonical for all statuses", "maps_to_ac": "AC-5", "verify": "xcodebuild test -only-testing:LaneShadowTests/ConvexPhaseDecodingTests/test_convexStatus_decodesToCanonicalPhase", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
