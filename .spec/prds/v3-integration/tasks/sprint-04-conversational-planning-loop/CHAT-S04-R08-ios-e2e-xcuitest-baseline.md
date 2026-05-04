================================================================================
TASK: CHAT-S04-R08 - iOS XCUITest E2E suite covering all 8 sprint-04 gate steps
================================================================================

TASK_TYPE:  TEST
STATUS:     REOPENED (round-3 RF-19, RF-21)
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test-sim:    xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadowUITests -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowUITests/Sprint04GateE2ETests
  test-device: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadowUITests -destination 'platform=iOS,name=Justin iPhone' test -only-testing:LaneShadowUITests/Sprint04GateE2ETests
  typecheck:   xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:        swiftformat --lint ios/

PROGRESS: 0/8 AC · RF-19: bypassAuth with fake JWT violates real-auth constraint; RF-21: weak assertions (cancelMutationFired=1 unconditionally, XCTSkip on step 8)

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Eight passing XCUITest cases — one per SPRINT.md human-gate step — produce `.xcresult` bundles and screenshot evidence on both Simulator (CI) and physical iPhone (gate evidence).

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST map each AC 1:1 to a SPRINT.md gate step (1 through 8)
- MUST run tests against REAL Convex via `CONVEX_URL` env var — no mocks, no fixtures, no stubs
- MUST authenticate with real signed-in user via `CLERK_TEST_EMAIL` / `CLERK_TEST_PASSWORD` env vars
- MUST attach at least one screenshot per test to its `.xcresult` bundle
- MUST write evidence to `ios/build/test-results/sprint-04-e2e/{step-N}/`
- MUST document BOTH the Simulator invocation (CI) AND the physical iPhone invocation (gate) in each AC
- MUST use existing AppLauncher pattern (`-LaneShadowUITestBypassAuth`) only where the gate step does not exercise auth itself
- NEVER use mocks, stubs, fixtures, or sandbox providers in any E2E test
- NEVER skip a gate step because it is hard to drive — escalate instead
- NEVER hardcode `CLERK_TEST_EMAIL` / `CLERK_TEST_PASSWORD` in source
- NEVER edit ios/LaneShadow.xcodeproj/** directly
- NEVER mark a test as passing without xcresult + screenshot artifact present at the documented path
- STRICTLY real-device runs are the RULES.md gate evidence — Simulator runs are CI fast-loop only
- STRICTLY every assertion must be on real backend state (real Convex query result), not synthetic
- STRICTLY adhere to docs/REAL_DEVICE_E2E.md canonical XCUITest pattern

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] SPRINT.md gate step 1 covered + real-device evidence (AC-1 PRIMARY)
- [ ] SPRINT.md gate step 2 covered + real-device evidence (AC-2)
- [ ] SPRINT.md gate step 3 covered + real-device evidence (AC-3)
- [ ] SPRINT.md gate step 4 covered + real-device evidence (AC-4)
- [ ] SPRINT.md gate step 5 covered + real-device evidence (AC-5)
- [ ] SPRINT.md gate step 6 covered + real-device evidence (AC-6)
- [ ] SPRINT.md gate step 7 covered + real-device evidence (AC-7)
- [ ] SPRINT.md gate step 8 covered + real-device evidence (AC-8)
- [ ] All 8 tests pass on Simulator AND physical iPhone
- [ ] xcresult + screenshot present in ios/build/test-results/sprint-04-e2e/step-{N}/ for every step

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: SPRINT.md gate step 1 — covered by XCUITest with real-device evidence [PRIMARY]
  GIVEN: A real Clerk-authenticated test user (`CLERK_TEST_EMAIL`/`CLERK_TEST_PASSWORD`) on a physical iPhone with `CONVEX_URL` pointing to real Convex
  WHEN:  The XCUITest `test_gateStep1` executes the verbatim WHEN clause from SPRINT.md Human Test Deliverable step 1
  THEN:  The verbatim THEN clause from SPRINT.md step 1 is asserted via XCUIElement query on the documented accessibility identifier; an xcresult bundle and at least one screenshot are written to `ios/build/test-results/sprint-04-e2e/step-1/`

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowUITests/Sprint04/Sprint04GateE2ETests.swift
  TEST_FUNCTION: test_gateStep1

AC-2: SPRINT.md gate step 2 — covered by XCUITest with real-device evidence
  GIVEN: Same real-device + real-Convex prerequisites as AC-1
  WHEN:  The XCUITest `test_gateStep2` executes the verbatim WHEN clause from SPRINT.md step 2 (planning-phase taxonomy display)
  THEN:  The verbatim THEN clause from SPRINT.md step 2 is asserted (the 5 canonical phase labels appear in order on the LSPhaseIndicator); xcresult + screenshot written to step-2/

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowUITests/Sprint04/Sprint04GateE2ETests.swift
  TEST_FUNCTION: test_gateStep2

AC-3: SPRINT.md gate step 3 — covered by XCUITest with real-device evidence
  GIVEN: Same real-device + real-Convex prerequisites as AC-1
  WHEN:  The XCUITest `test_gateStep3` executes the verbatim WHEN clause from SPRINT.md step 3 (RouteResults: 3 polylines + 3 LSRouteAttachmentCards)
  THEN:  The verbatim THEN clause from SPRINT.md step 3 is asserted; xcresult + screenshot written to step-3/

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowUITests/Sprint04/Sprint04GateE2ETests.swift
  TEST_FUNCTION: test_gateStep3

AC-4: SPRINT.md gate step 4 — covered by XCUITest with real-device evidence
  GIVEN: Same real-device + real-Convex prerequisites as AC-1
  WHEN:  The XCUITest `test_gateStep4` executes the verbatim WHEN clause from SPRINT.md step 4 (RouteDetails: real distance/duration/elevation/scenicScore + 6h LSWeatherTimeline)
  THEN:  The verbatim THEN clause from SPRINT.md step 4 is asserted; xcresult + screenshot written to step-4/

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowUITests/Sprint04/Sprint04GateE2ETests.swift
  TEST_FUNCTION: test_gateStep4

AC-5: SPRINT.md gate step 5 — covered by XCUITest with real-device evidence
  GIVEN: Same real-device + real-Convex prerequisites as AC-1
  WHEN:  The XCUITest `test_gateStep5` executes the verbatim WHEN clause from SPRINT.md step 5 (alt route card tap → polyline promotes from dashed to solid)
  THEN:  The verbatim THEN clause from SPRINT.md step 5 is asserted on RouteResultsScreen with selectedRouteId update + visual stroke change; xcresult + screenshot written to step-5/

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowUITests/Sprint04/Sprint04GateE2ETests.swift
  TEST_FUNCTION: test_gateStep5

AC-6: SPRINT.md gate step 6 — covered by XCUITest with real-device evidence
  GIVEN: Same real-device + real-Convex prerequisites as AC-1
  WHEN:  The XCUITest `test_gateStep6` executes the verbatim WHEN clause from SPRINT.md step 6 (cancel mid-planning)
  THEN:  The verbatim THEN clause from SPRINT.md step 6 is asserted (cancelPlan mutation fires + UI returns to IdleScreen); xcresult + screenshot written to step-6/

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowUITests/Sprint04/Sprint04GateE2ETests.swift
  TEST_FUNCTION: test_gateStep6

AC-7: SPRINT.md gate step 7 — covered by XCUITest with real-device evidence
  GIVEN: Same real-device + real-Convex prerequisites as AC-1
  WHEN:  The XCUITest `test_gateStep7` executes the verbatim WHEN clause from SPRINT.md step 7 (refine plan via chat — sessionId reused)
  THEN:  The verbatim THEN clause from SPRINT.md step 7 is asserted (same sessionId, refined polylines replace originals); xcresult + screenshot written to step-7/

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowUITests/Sprint04/Sprint04GateE2ETests.swift
  TEST_FUNCTION: test_gateStep7

AC-8: SPRINT.md gate step 8 — covered by XCUITest with real-device evidence
  GIVEN: Same real-device + real-Convex prerequisites as AC-1
  WHEN:  The XCUITest `test_gateStep8` executes the verbatim WHEN clause from SPRINT.md step 8 (planning failure → ErrorScreen with typed LaneShadowError + recovery chips)
  THEN:  The verbatim THEN clause from SPRINT.md step 8 is asserted; xcresult + screenshot written to step-8/

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowUITests/Sprint04/Sprint04GateE2ETests.swift
  TEST_FUNCTION: test_gateStep8

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Type |
|-----|-----------|---------|------|
| TC-1 | Step 1 XCUITest passes on Simulator and physical iPhone with xcresult+screenshot at step-1/ | AC-1 | happy_path |
| TC-2 | Step 2 passes; LSPhaseIndicator shows canonical phase labels in order | AC-2 | happy_path |
| TC-3 | Step 3 passes — 3 polylines + 3 attachment cards rendered from real Convex data | AC-3 | happy_path |
| TC-4 | Step 4 passes — RouteDetailsScreen renders real distance/duration/elevation + 6h weather | AC-4 | happy_path |
| TC-5 | Step 5 passes — alt card tap promotes polyline from dashed to solid | AC-5 | happy_path |
| TC-6 | Step 6 passes — cancel mutation fires + UI returns to Idle | AC-6 | happy_path |
| TC-7 | Step 7 passes — same sessionId reused, refined polylines replace originals | AC-7 | integration |
| TC-8 | Step 8 passes — typed LaneShadowError surfaces with recovery chips | AC-8 | edge_case |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadowUITests/Sprint04/Sprint04GateE2ETests.swift (NEW)
- ios/LaneShadowUITests/Sprint04/Helpers/** (NEW — gate-specific helpers)
- ios/LaneShadowUITests/Helpers/** (MODIFY — extend AppLauncher / MailosaurE2EClient if needed)
- ios/LaneShadow/Views/**/AccessibilityIdentifiers.swift (MODIFY — add identifiers required for assertions)
- ios/project.yml (MODIFY — register new test sources)
- scripts/ios/run-sprint-04-e2e.sh (NEW — convenience runner with env setup)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated
- ios/LaneShadow/Generated/** — generated
- ios/LaneShadow/Sandbox/** — sandbox is NOT a substitute for real-services E2E
- Any production code path that would change app behavior (E2E is observe-only — file follow-up if app changes are required)

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use real Convex client (CONVEX_URL)
- Use real Clerk auth (CLERK_TEST_EMAIL / CLERK_TEST_PASSWORD)
- Attach screenshots via `XCUIScreenshot` to xcresult
- Use accessibility identifiers (not label text) for queries
- Use generous `waitForExistence(timeout:)` for real-network round-trips

⚠️ Ask First:
- Adding new accessibility identifiers to production views (small additions OK; large refactor → file separate task)
- Adding new test framework dependencies

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadowUITests/Sprint04/Sprint04GateE2ETests.swift (NEW): 8 tests mapping 1:1 to gate steps
- ios/LaneShadowUITests/Sprint04/Helpers/* (NEW): gate-specific helpers (planning wait, route card query, etc.)
- ios/LaneShadow/Views/**/AccessibilityIdentifiers.swift (MODIFY): identifiers for E2E queries
- scripts/ios/run-sprint-04-e2e.sh (NEW): convenience runner that exports env + runs both Simulator + device passes

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH AC (gate step):

### RED PHASE
- READ: AC, SPRINT.md verbatim step, existing AuthBypassE2ETests pattern
- WRITE: ONE XCUITest method `test_gateStepN`
- RUN: `xcodebuild ... test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStepN`
- VERIFY: Test FAILS (most likely with element-not-found or timeout)

### GREEN PHASE
- WRITE: minimal helpers + accessibility identifier additions
- RUN: `xcodebuild ... test`
- VERIFY: Test PASSES with screenshot artifact present

### REFACTOR PHASE
- READ: shared helpers
- RUN: full suite + lint
- VERIFY: still green; physical-device run also passes

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/tasks/sprint-04-conversational-planning-loop/SPRINT.md [PRIMARY PATTERN]
   - Lines: Human Test Deliverable section
   - Focus: 8 verbatim gate steps to paste into AC GIVEN/WHEN/THEN

2. docs/REAL_DEVICE_E2E.md
   - Lines: all
   - Focus: canonical XCUITest + xcresult pattern

3. ios/LaneShadowUITests/Helpers/AppLauncher.swift
   - Lines: all
   - Focus: auth bypass and launch arg conventions

4. ios/LaneShadowUITests/AuthEmailPasswordE2ETests.swift
   - Lines: all
   - Focus: real-Clerk auth flow pattern

5. RULES.md
   - Lines: Real Device E2E Testing section
   - Focus: non-negotiable real-device standard

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Each AC has a test mapping 1:1 to SPRINT.md step
  Verify: 8 test methods named test_gateStep1..test_gateStep8.

Gate 2: All 8 XCUITests pass on Simulator
  Command: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadowUITests -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowUITests/Sprint04GateE2ETests
  Expected: Exit 0; 8 tests reported passing.

Gate 3: All 8 XCUITests pass on physical iPhone
  Command: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadowUITests -destination 'platform=iOS,name=<device>' test -only-testing:LaneShadowUITests/Sprint04GateE2ETests
  Expected: Exit 0.

Gate 4: Evidence artifacts present per step
  Command: ls -la ios/build/test-results/sprint-04-e2e/step-1 ios/build/test-results/sprint-04-e2e/step-2 ios/build/test-results/sprint-04-e2e/step-3 ios/build/test-results/sprint-04-e2e/step-4 ios/build/test-results/sprint-04-e2e/step-5 ios/build/test-results/sprint-04-e2e/step-6 ios/build/test-results/sprint-04-e2e/step-7 ios/build/test-results/sprint-04-e2e/step-8
  Expected: Each directory contains at least one .xcresult bundle and one .png screenshot.

Gate 5: No mocks in production E2E paths
  Command: grep -rn "Mock\|Stub\|Fixture" ios/LaneShadowUITests/Sprint04/ || true
  Expected: Empty output (zero matches).

Gate 6: Build clean
  Command: xcodebuild ... build
  Expected: Exit 0.

Gate 7: Lint clean
  Command: swiftformat --lint ios/
  Expected: Exit 0.

Gate 8: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-R01 (routeEnrichments:list), CHAT-S04-R02 (savedRoutes fingerprint), CHAT-S04-R05 (RouteDetails viewState), CHAT-S04-R06 (canonical phase labels)
Blocks:     (none — final gate evidence)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-R08",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "Gate step 1 covered with real-device evidence", "verify": "xcodebuild test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStep1", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "Gate step 2 covered with real-device evidence", "verify": "xcodebuild test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStep2", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "Gate step 3 covered with real-device evidence", "verify": "xcodebuild test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStep3", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "Gate step 4 covered with real-device evidence", "verify": "xcodebuild test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStep4", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "Gate step 5 covered with real-device evidence (depends on R05 viewState wiring)", "verify": "xcodebuild test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStep5", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "Gate step 6 covered with real-device evidence", "verify": "xcodebuild test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStep6", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-7", "type": "acceptance_criterion", "description": "Gate step 7 covered with real-device evidence", "verify": "xcodebuild test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStep7", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-8", "type": "acceptance_criterion", "description": "Gate step 8 covered with real-device evidence", "verify": "xcodebuild test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStep8", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Step 1 evidence at step-1/", "maps_to_ac": "AC-1", "verify": "xcodebuild test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStep1", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Step 2 phase labels canonical", "maps_to_ac": "AC-2", "verify": "xcodebuild test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStep2", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Step 3 evidence at step-3/", "maps_to_ac": "AC-3", "verify": "xcodebuild test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStep3", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Step 4 route-results real data", "maps_to_ac": "AC-4", "verify": "xcodebuild test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStep4", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Step 5 RouteDetails real polyline + isBest + timeRange", "maps_to_ac": "AC-5", "verify": "xcodebuild test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStep5", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "Step 6 evidence at step-6/", "maps_to_ac": "AC-6", "verify": "xcodebuild test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStep6", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-7", "type": "test_criterion", "description": "Step 7 evidence at step-7/", "maps_to_ac": "AC-7", "verify": "xcodebuild test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStep7", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-8", "type": "test_criterion", "description": "Step 8 evidence at step-8/", "maps_to_ac": "AC-8", "verify": "xcodebuild test -only-testing:LaneShadowUITests/Sprint04GateE2ETests/test_gateStep8", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
