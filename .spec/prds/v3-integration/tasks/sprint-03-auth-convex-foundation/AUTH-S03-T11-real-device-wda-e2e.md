================================================================================
TASK: AUTH-S03-T11 - Real-Device WDA E2E Gate
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
SPRINT:     sprint-03-auth-convex-foundation
ESTIMATE:   240 min

RUNTIME_COMMANDS:
  test:      cd /Users/justinrich/Projects/LaneShadow && LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth.js
  typecheck: cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'generic/platform=iOS' build
  lint:      cd /Users/justinrich/Projects/LaneShadow && scripts/ios/generate-project.sh --check

PROGRESS: none - task ready for TDD

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Sprint 03's non-sandbox auth + Convex human gate is encoded as a real-device WebDriverAgent artifact. Every human test step records PASS, FAIL, BLOCKED, or MANUAL, with screenshots, source dumps, and diagnostics for the app state that WDA can observe.

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST: Cover every Sprint 03 human test step from SPRINT.md in a structured WDA result artifact.
- MUST: Drive the installed iOS app on a real device through WebDriverAgent HTTP on `127.0.0.1:8100`; simulator-only evidence is not sufficient for this gate.
- MUST: Record screenshots, WDA source dumps, dependency blocking, and remediation notes for failed or blocked required steps.
- MUST: Mark Android-only, Convex-dashboard, and Clerk-dashboard observations as MANUAL or BLOCKED unless the script has direct machine evidence.
- NEVER: Report PASS from a screenshot alone when a stable accessibility identifier, WDA source assertion, server artifact, or explicit manual witness is required.
- STRICTLY: Keep the initial harness dependency-free Node using the Hitch pattern in `../hitch/ios/E2E/lib/wda-helpers.js`.

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective**: Add a real-device WDA E2E harness for the Sprint 03 auth + Convex human test gate.

**Success looks like**: Running `LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth.js` writes `ios/E2E/results/sprint-03-auth.json` with entries for all eight Sprint 03 human test steps, real-device evidence for iOS-controllable steps, and honest MANUAL/BLOCKED status for steps requiring Android or external dashboard observation.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: WDA harness boots the real iOS app and records environment readiness [PRIMARY]
  GIVEN: WDA is running on `127.0.0.1:8100`, port 8100 is forwarded from a real device, and LaneShadow is installed.
  WHEN: `ios/E2E/sprint-03-auth.js` runs.
  THEN: The script records WDA status, creates a WDA session for `LANESHADOW_BUNDLE_ID`, launches LaneShadow with `-UITesting`, and writes a readiness screenshot.
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Integration/Sprint03WDAArtifactTests.swift
  TEST_FUNCTION: testSprint03WdaScriptCreatesRealDeviceSession
  VERIFY: cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaScriptCreatesRealDeviceSession

AC-2: WDA results map all Sprint 03 human steps
  GIVEN: Sprint 03 declares eight human test steps in `SPRINT.md`.
  WHEN: The WDA script exits.
  THEN: `ios/E2E/results/sprint-03-auth.json` contains step IDs `S03.1` through `S03.8` with status, detail, dependencies, timestamp, and evidence paths where available.
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Integration/Sprint03WDAArtifactTests.swift
  TEST_FUNCTION: testSprint03WdaResultsCoverEveryHumanStep
  VERIFY: cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaResultsCoverEveryHumanStep

AC-3: iOS auth, restore, and sign-out steps use stable accessibility identifiers
  GIVEN: SignInScreen, IdleScreen, Settings, and auth state UI expose stable accessibility identifiers.
  WHEN: The WDA flow drives Continue with Apple, cold-start relaunch, and sign-out.
  THEN: The script asserts identifiers for the auth provider button, IdleScreen greeting, Settings entry, sign-out action, confirmation dialog, and SignInScreen return state.
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Integration/Sprint03WDAArtifactTests.swift
  TEST_FUNCTION: testSprint03WdaScriptUsesStableAuthIdentifiers
  VERIFY: cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaScriptUsesStableAuthIdentifiers

AC-4: External and cross-platform observations are represented honestly
  GIVEN: Android OAuth, Convex dashboard watching, Clerk token revocation, and type-generation verification cannot all be proven by iOS WDA alone.
  WHEN: The WDA script records those human steps.
  THEN: The result artifact marks each unsupported observation MANUAL or BLOCKED with the required command or witness note instead of PASS.
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Integration/Sprint03WDAArtifactTests.swift
  TEST_FUNCTION: testSprint03WdaResultsUseManualOrBlockedForUnsupportedEvidence
  VERIFY: cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaResultsUseManualOrBlockedForUnsupportedEvidence

AC-5: Diagnostics are emitted for failures and blocked dependencies
  GIVEN: A required prerequisite such as WDA status, app launch, or SignInScreen visibility fails.
  WHEN: The script continues writing the sprint report.
  THEN: Dependent steps are marked BLOCKED and diagnostics include screenshot, WDA source dump, and remediation notes under `ios/E2E/diagnostics/sprint-03-auth/`.
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Integration/Sprint03WDAArtifactTests.swift
  TEST_FUNCTION: testSprint03WdaDiagnosticsCoverFailedAndBlockedSteps
  VERIFY: cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaDiagnosticsCoverFailedAndBlockedSteps

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Boolean Statement | Maps To AC | Verify |
|---|---|---|---|
| TC-1 | The Sprint 03 WDA script checks `GET /status` before creating an app session. | AC-1 | `cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaScriptCreatesRealDeviceSession` |
| TC-2 | The Sprint 03 result schema contains step IDs S03.1 through S03.8. | AC-2 | `cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaResultsCoverEveryHumanStep` |
| TC-3 | The WDA script queries auth and settings controls by accessibility id. | AC-3 | `cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaScriptUsesStableAuthIdentifiers` |
| TC-4 | Unsupported Android, Convex dashboard, Clerk dashboard, and codegen observations are never marked PASS by iOS WDA alone. | AC-4 | `cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaResultsUseManualOrBlockedForUnsupportedEvidence` |
| TC-5 | A failed WDA readiness step blocks downstream app-auth steps with diagnostics. | AC-5 | `cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaDiagnosticsCoverFailedAndBlockedSteps` |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. `.spec/prds/v3-integration/tasks/sprint-03-auth-convex-foundation/SPRINT.md`
   - Lines: all
   - Focus: authoritative Sprint 03 human gate and eight test steps.
2. `../hitch/CLAUDE.md`
   - Lines: Real Device E2E Testing section
   - Focus: go-ios, WDA, port forwarding, direct HTTP API, and cleanup sequence.
3. `../hitch/ios/E2E/lib/wda-helpers.js`
   - Lines: all
   - Focus: `WdaClient`, `StepTracker`, screenshots, source dumps, and PASS/FAIL/BLOCKED/MANUAL semantics.
4. `../hitch/.spec/prds/v2/tasks/sprint-03-share-extension-intake/S03-WDA-04-codify-share-extension-wda-flow.md`
   - Lines: all
   - Focus: task pattern for codifying a human gate as WDA artifact tests.
5. `ios/LaneShadowUITests/LaneShadowUITests.swift`
   - Lines: all
   - Focus: existing launch arguments and app readiness expectations.
6. `docs/REAL_DEVICE_E2E.md`
   - Lines: all
   - Focus: LaneShadow real-device E2E policy and commands.

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- `ios/E2E/lib/wda-helpers.js` (CREATE)
- `ios/E2E/sprint-03-auth.js` (CREATE)
- `ios/E2E/results/sprint-03-auth.json` (CREATE/GENERATED)
- `ios/E2E/diagnostics/sprint-03-auth/**` (GENERATED)
- `ios/E2E/screenshots/sprint-03-auth/**` (GENERATED)
- `ios/LaneShadowTests/Integration/Sprint03WDAArtifactTests.swift` (CREATE)
- `scripts/ios/device-setup.sh` (CREATE if needed)
- `scripts/ios/device-teardown.sh` (CREATE if needed)
- `scripts/ios/setup-wda.sh` (CREATE if needed)
- `docs/REAL_DEVICE_E2E.md` (MODIFY if command names change during implementation)

writeProhibited:
- `ios/**/*.xcodeproj/**` - generated output only
- `ios/project.yml` - only modify if synced folders do not pick up the new artifact test
- `ios/LaneShadow/Services/**` - implementation tasks own auth and Convex behavior
- `android/**` - Android implementation tasks own Android app behavior; this task may document manual Android evidence only
- `server/convex/**` - backend implementation tasks own query behavior
- Any production auth screen file unless adding stable accessibility identifiers is explicitly required and reviewer-approved

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

references:
- `.spec/prds/v3-integration/architecture/ui-design.md`
- `.spec/prds/v3-integration/tasks/sprint-03-auth-convex-foundation/SPRINT.md`
- `docs/REAL_DEVICE_E2E.md`

interaction_notes:
- Prefer semantic accessibility identifiers such as `auth.signIn.apple`, `auth.signIn.google`, `idle.greeting`, `settings.signOut`, `auth.signOut.confirm`, and `auth.signIn.root`.
- WDA evidence must prove the live app path, not sandbox story rendering.
- Manual evidence entries must include the exact command, dashboard action, or device observation needed to complete the human gate.

pattern: Human test step state machine: WDA readiness, app launch, sign-in, IdleScreen greeting, cold-start restore, sign-out, unauthenticated redirect, unsupported external observations recorded honestly.
pattern_source: `../hitch/ios/E2E/lib/wda-helpers.js`
anti_pattern: Marking Android, dashboard, or server-observer steps PASS from an iOS-only WDA run.

--------------------------------------------------------------------------------
CODING STANDARDS
--------------------------------------------------------------------------------

- `/Users/justinrich/Projects/brain/docs/TDD-METHODOLOGY.md`
- `/Users/justinrich/Projects/brain/docs/kanban/TASK-TEMPLATE.md`
- `RULES.md` Real Device E2E Testing
- `docs/REAL_DEVICE_E2E.md`
- `../hitch/ios/E2E/lib/wda-helpers.js`

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

FOR EACH ACCEPTANCE CRITERION:

RED PHASE:
  Add or update one artifact test in `ios/LaneShadowTests/Integration/Sprint03WDAArtifactTests.swift` that fails against the missing WDA script or result contract.
  Run the AC-specific verify command and capture the failing output.

GREEN PHASE:
  Implement the smallest dependency-free Node WDA script and helper API needed to satisfy the artifact test.
  Keep result schema stable and map every SPRINT.md human step before adding extra convenience checks.

REFACTOR PHASE:
  Remove duplicated step recording, keep diagnostics deterministic, and document any real-device prerequisites that differ from `docs/REAL_DEVICE_E2E.md`.
  Re-run artifact tests, project generation check, and the real-device WDA command when a device is available.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: WDA artifact tests
  Command: `cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests`
  Expected: Exit 0.

Gate 2: Sprint 03 real-device WDA flow
  Command: `cd /Users/justinrich/Projects/LaneShadow && LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth.js`
  Expected: Exit 0 when WDA, the real iOS device, Clerk test account, and Convex dev environment are available; otherwise results contain MANUAL/BLOCKED with diagnostics.

Gate 3: LaneShadow app builds for device
  Command: `cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'generic/platform=iOS' build`
  Expected: Exit 0.

Gate 4: Generated project unchanged
  Command: `cd /Users/justinrich/Projects/LaneShadow && scripts/ios/generate-project.sh --check`
  Expected: Exit 0.

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

Assignee: `swift-implementer`
Reviewer: `swift-reviewer`
Design Lead: none
Rationale: The deliverable is iOS real-device WDA automation plus Swift artifact tests. The task must preserve auth accessibility semantics and avoid changing Android or backend behavior.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

depends_on: [AUTH-S03-T03, AUTH-S03-T05, AUTH-S03-T07, AUTH-S03-T09]
blocks: [Sprint 04]

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN WDA is running on 127.0.0.1:8100, port 8100 is forwarded from a real device, and LaneShadow is installed WHEN ios/E2E/sprint-03-auth.js runs THEN the script records WDA status, creates a WDA session for LANESHADOW_BUNDLE_ID, launches LaneShadow with -UITesting, and writes a readiness screenshot.","verify":"cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaScriptCreatesRealDeviceSession","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN Sprint 03 declares eight human test steps in SPRINT.md WHEN the WDA script exits THEN ios/E2E/results/sprint-03-auth.json contains step IDs S03.1 through S03.8 with status, detail, dependencies, timestamp, and evidence paths where available.","verify":"cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaResultsCoverEveryHumanStep","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN SignInScreen, IdleScreen, Settings, and auth state UI expose stable accessibility identifiers WHEN the WDA flow drives Continue with Apple, cold-start relaunch, and sign-out THEN the script asserts identifiers for the auth provider button, IdleScreen greeting, Settings entry, sign-out action, confirmation dialog, and SignInScreen return state.","verify":"cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaScriptUsesStableAuthIdentifiers","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN Android OAuth, Convex dashboard watching, Clerk token revocation, and type-generation verification cannot all be proven by iOS WDA alone WHEN the WDA script records those human steps THEN the result artifact marks each unsupported observation MANUAL or BLOCKED with the required command or witness note instead of PASS.","verify":"cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaResultsUseManualOrBlockedForUnsupportedEvidence","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN a required prerequisite such as WDA status, app launch, or SignInScreen visibility fails WHEN the script continues writing the sprint report THEN dependent steps are marked BLOCKED and diagnostics include screenshot, WDA source dump, and remediation notes under ios/E2E/diagnostics/sprint-03-auth/.","verify":"cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaDiagnosticsCoverFailedAndBlockedSteps","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"TC-1","type":"test_criterion","description":"The Sprint 03 WDA script checks GET /status before creating an app session.","maps_to_ac":"AC-1","verify":"cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaScriptCreatesRealDeviceSession","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"TC-2","type":"test_criterion","description":"The Sprint 03 result schema contains step IDs S03.1 through S03.8.","maps_to_ac":"AC-2","verify":"cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaResultsCoverEveryHumanStep","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"TC-3","type":"test_criterion","description":"The WDA script queries auth and settings controls by accessibility id.","maps_to_ac":"AC-3","verify":"cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaScriptUsesStableAuthIdentifiers","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"TC-4","type":"test_criterion","description":"Unsupported Android, Convex dashboard, Clerk dashboard, and codegen observations are never marked PASS by iOS WDA alone.","maps_to_ac":"AC-4","verify":"cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaResultsUseManualOrBlockedForUnsupportedEvidence","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"TC-5","type":"test_criterion","description":"A failed WDA readiness step blocks downstream app-auth steps with diagnostics.","maps_to_ac":"AC-5","verify":"cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprint03WdaDiagnosticsCoverFailedAndBlockedSteps","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null}
  ]
}
-->
