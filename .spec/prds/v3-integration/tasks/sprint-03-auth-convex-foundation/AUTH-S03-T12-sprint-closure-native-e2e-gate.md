================================================================================
TASK: AUTH-S03-T12 - Sprint Closure Native E2E Gate
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      ios=swift-implementer | android=kotlin-implementer | reviewer=swift-reviewer+kotlin-reviewer
SPRINT:     sprint-03-auth-convex-foundation
ESTIMATE:   240 min

RUNTIME_COMMANDS:
  ios_simulator_xctest: cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/LaneShadowUITests
  ios_real_wda:         cd /Users/justinrich/Projects/LaneShadow && LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth.js
  android_emulator:     cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.SmokeInstrumentedTest,com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest
  android_real_device:  adb devices && cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.SmokeInstrumentedTest,com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest

PROGRESS: none - task ready for TDD

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Sprint 03 ends with explicit native E2E evidence on both simulated and real environments:

- iOS XCTest/XCUITest on simulator.
- iOS real-device WDA flow.
- Android Espresso / AndroidJUnitRunner on emulator.
- Android Espresso / AndroidJUnitRunner on physical Android device.

This task is additive. It must not modify completed task specs. Future sprint planning should add an equivalent sprint-closure E2E task instead of retroactively editing completed tasks.

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST: Run iOS E2E through XCTest/XCUITest on the `iPhone 16` simulator.
- MUST: Run iOS real-device E2E through the existing WDA harness pattern.
- MUST: Run Android E2E through Espresso / AndroidJUnitRunner on an emulator.
- MUST: Run the same Android Espresso / AndroidJUnitRunner class filter on a physical Android device.
- MUST: Record target type for every result: `simulator`, `real-ios-device`, `emulator`, or `real-android-device`.
- MUST: Treat missing physical hardware as BLOCKED for sprint closure, not PASS.
- MUST NOT: Modify completed task files to add these gates.
- MUST NOT: Mark Android evidence PASS from iOS WDA evidence, screenshots, or emulator-only runs.
- MUST NOT: Mark iOS real-device evidence PASS from simulator-only runs.

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective**: Add a sprint-ending native E2E closure task that proves Sprint 03 auth-gate behavior on iOS and Android across simulated and physical environments.

**Success looks like**: The sprint closure record contains four lanes with commands, target identifiers, timestamps, status, and artifact/log paths. A lane can be `PASS`, `FAIL`, or `BLOCKED`; final sprint closure requires all four lanes to pass unless the product owner explicitly accepts a BLOCKED hardware gate.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: iOS simulator XCTest/XCUITest lane passes
  GIVEN: An `iPhone 16` simulator is available.
  WHEN: The iOS simulator closure command runs.
  THEN: `LaneShadowUITests/LaneShadowUITests` passes and records the simulator target in the sprint closure artifact.
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowUITests/LaneShadowUITests.swift
  TEST_FUNCTION: LaneShadowUITests
  VERIFY: cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/LaneShadowUITests

AC-2: iOS real-device WDA lane passes or blocks honestly
  GIVEN: WDA is running on `127.0.0.1:8100`, port 8100 is forwarded from a physical iPhone, and LaneShadow is installed.
  WHEN: The real-device WDA closure command runs.
  THEN: `ios/E2E/sprint-03-auth.js` writes a result artifact with `real-ios-device` evidence for iOS-controllable Sprint 03 steps.
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Integration/Sprint03WDAArtifactTests.swift
  TEST_FUNCTION: Sprint03WDAArtifactTests
  VERIFY: cd /Users/justinrich/Projects/LaneShadow && LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth.js

AC-3: Android emulator Espresso lane passes
  GIVEN: An Android emulator is booted and visible in `adb devices`.
  WHEN: The Android emulator closure command runs.
  THEN: `SmokeInstrumentedTest`, `LoginSmokeTest`, and `RootViewAuthGateEspressoTest` pass through Espresso / AndroidJUnitRunner with 0 failures.
  TDD_STATE: none
  TEST_FILE: android/app/src/androidTest/java/com/laneshadow/SmokeInstrumentedTest.kt; android/app/src/androidTest/java/com/laneshadow/ui/LoginSmokeTest.kt; android/app/src/androidTest/java/com/laneshadow/ui/RootViewAuthGateEspressoTest.kt
  TEST_FUNCTION: appContextHasExpectedPackage; signInScreenRendersWithoutCrash; signInScreenShowsCreateAccountEntryPoint; unauthenticatedLaunchHostsAuthGateActivityContent
  VERIFY: cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.SmokeInstrumentedTest,com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest

AC-4: Android physical-device Espresso lane passes or blocks honestly
  GIVEN: A physical Android device is connected, authorized, and visible in `adb devices`.
  WHEN: The Android physical-device closure command runs.
  THEN: The same Espresso / AndroidJUnitRunner class filter passes with 0 failures and records the physical device serial in the sprint closure artifact.
  TDD_STATE: none
  TEST_FILE: android/app/src/androidTest/java/com/laneshadow/SmokeInstrumentedTest.kt; android/app/src/androidTest/java/com/laneshadow/ui/LoginSmokeTest.kt; android/app/src/androidTest/java/com/laneshadow/ui/RootViewAuthGateEspressoTest.kt
  TEST_FUNCTION: appContextHasExpectedPackage; signInScreenRendersWithoutCrash; signInScreenShowsCreateAccountEntryPoint; unauthenticatedLaunchHostsAuthGateActivityContent
  VERIFY: adb devices && cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.SmokeInstrumentedTest,com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest

AC-5: Sprint closure artifact distinguishes all four lanes
  GIVEN: Any closure lane passes, fails, or is blocked.
  WHEN: The closure result is recorded.
  THEN: The artifact includes `platform`, `framework`, `target`, `command`, `status`, `timestamp`, and `evidence` for each lane.
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Integration/Sprint03WDAArtifactTests.swift
  TEST_FUNCTION: testSprintClosureArtifactSeparatesNativeE2ELanes
  VERIFY: cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprintClosureArtifactSeparatesNativeE2ELanes

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Boolean Statement | Maps To AC | Verify |
|---|---|---|---|
| TC-1 | iOS XCTest/XCUITest passes on an `iPhone 16` simulator. | AC-1 | `cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/LaneShadowUITests` |
| TC-2 | iOS WDA evidence runs on a physical iPhone or records BLOCKED with device prerequisites. | AC-2 | `cd /Users/justinrich/Projects/LaneShadow && LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth.js` |
| TC-3 | Android Espresso smoke/auth tests pass on an emulator. | AC-3 | `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.SmokeInstrumentedTest,com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest` |
| TC-4 | Android Espresso smoke/auth tests pass on a physical Android device or record BLOCKED with device prerequisites. | AC-4 | `adb devices && cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.SmokeInstrumentedTest,com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest` |
| TC-5 | Sprint closure evidence separates iOS simulator, iOS real device, Android emulator, and Android real device lanes. | AC-5 | `cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprintClosureArtifactSeparatesNativeE2ELanes` |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. `.spec/prds/v3-integration/tasks/sprint-03-auth-convex-foundation/SPRINT.md`
   - Focus: Sprint 03 human gate and test steps.
2. `docs/REAL_DEVICE_E2E.md`
   - Focus: iOS WDA evidence contract and real-device policy.
3. `ios/LaneShadowUITests/LaneShadowUITests.swift`
   - Focus: iOS XCTest/XCUITest smoke/auth selectors.
4. `android/app/src/androidTest/java/com/laneshadow/SmokeInstrumentedTest.kt`
   - Focus: Android instrumentation smoke baseline.
5. `android/app/src/androidTest/java/com/laneshadow/ui/LoginSmokeTest.kt`
   - Focus: Android Compose auth smoke coverage.
6. `android/app/src/androidTest/java/com/laneshadow/ui/RootViewAuthGateEspressoTest.kt`
   - Focus: Android Espresso auth-gate coverage.

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- `ios/E2E/results/sprint-03-closure.json` (CREATE/GENERATED)
- `ios/E2E/diagnostics/sprint-03-closure/**` (GENERATED)
- `ios/LaneShadowTests/Integration/Sprint03WDAArtifactTests.swift` (MODIFY if closure artifact tests are added)
- `ios/LaneShadowUITests/LaneShadowUITests.swift` (MODIFY if simulator smoke coverage needs to mirror Sprint 03 closure)
- `android/app/src/androidTest/java/com/laneshadow/**` (MODIFY if Espresso smoke coverage needs to mirror Sprint 03 closure)

writeProhibited:
- Completed task files in this sprint.
- `ios/**/*.xcodeproj/**` - generated output only.
- `ios/project.yml` unless synced folders do not pick up a new artifact test.
- `android/app/src/main/**` unless a kotlin reviewer approves an E2E-blocking startup or testability defect.
- `convex/**` - backend implementation tasks own query behavior.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: iOS simulator XCTest/XCUITest
  Command: `cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/LaneShadowUITests`
  Expected: Exit 0.

Gate 2: iOS physical-device WDA
  Command: `cd /Users/justinrich/Projects/LaneShadow && LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth.js`
  Expected: Exit 0 with real-device PASS evidence, or BLOCKED with exact missing-device prerequisites.

Gate 3: Android emulator Espresso
  Command: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.SmokeInstrumentedTest,com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest`
  Expected: Exit 0.

Gate 4: Android physical-device Espresso
  Command: `adb devices && cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.SmokeInstrumentedTest,com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest`
  Expected: Exit 0 on a physical Android device, or BLOCKED with exact missing-device prerequisites.

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

Assignee: `swift-implementer` for iOS XCTest/WDA closure artifacts; `kotlin-implementer` for Android Espresso closure artifacts
Reviewer: `swift-reviewer` and `kotlin-reviewer`
Design Lead: none
Rationale: This task adds the missing sprint-ending native E2E closure gate without editing completed task files.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

depends_on: [AUTH-S03-T07, AUTH-S03-T08, AUTH-S03-T09, AUTH-S03-T10, AUTH-S03-T11]
blocks: [Sprint 04]

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN an iPhone 16 simulator is available WHEN the iOS simulator closure command runs THEN LaneShadowUITests/LaneShadowUITests passes and records the simulator target in the sprint closure artifact.","verify":"cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/LaneShadowUITests","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN WDA is running on 127.0.0.1:8100, port 8100 is forwarded from a physical iPhone, and LaneShadow is installed WHEN the real-device WDA closure command runs THEN ios/E2E/sprint-03-auth.js writes a result artifact with real-ios-device evidence for iOS-controllable Sprint 03 steps.","verify":"cd /Users/justinrich/Projects/LaneShadow && LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth.js","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN an Android emulator is booted and visible in adb devices WHEN the Android emulator closure command runs THEN SmokeInstrumentedTest, LoginSmokeTest, and RootViewAuthGateEspressoTest pass through Espresso / AndroidJUnitRunner with 0 failures.","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.SmokeInstrumentedTest,com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN a physical Android device is connected, authorized, and visible in adb devices WHEN the Android physical-device closure command runs THEN the same Espresso / AndroidJUnitRunner class filter passes with 0 failures and records the physical device serial in the sprint closure artifact.","verify":"adb devices && cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.SmokeInstrumentedTest,com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN any closure lane passes, fails, or is blocked WHEN the closure result is recorded THEN the artifact includes platform, framework, target, command, status, timestamp, and evidence for each lane.","verify":"cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprintClosureArtifactSeparatesNativeE2ELanes","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"TC-1","type":"test_criterion","description":"iOS XCTest/XCUITest passes on an iPhone 16 simulator.","maps_to_ac":"AC-1","verify":"cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/LaneShadowUITests","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"TC-2","type":"test_criterion","description":"iOS WDA evidence runs on a physical iPhone or records BLOCKED with device prerequisites.","maps_to_ac":"AC-2","verify":"cd /Users/justinrich/Projects/LaneShadow && LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth.js","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"TC-3","type":"test_criterion","description":"Android Espresso smoke/auth tests pass on an emulator.","maps_to_ac":"AC-3","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.SmokeInstrumentedTest,com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"TC-4","type":"test_criterion","description":"Android Espresso smoke/auth tests pass on a physical Android device or record BLOCKED with device prerequisites.","maps_to_ac":"AC-4","verify":"adb devices && cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.SmokeInstrumentedTest,com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},
    {"id":"TC-5","type":"test_criterion","description":"Sprint closure evidence separates iOS simulator, iOS real device, Android emulator, and Android real device lanes.","maps_to_ac":"AC-5","verify":"cd /Users/justinrich/Projects/LaneShadow/ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Sprint03WDAArtifactTests/testSprintClosureArtifactSeparatesNativeE2ELanes","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null}
  ]
}
-->
