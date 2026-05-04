================================================================================
TASK: FID-S05-T03 - iOS XCUITest capture harness for design review pipeline
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
SPRINT:     [sprint-05-design-review-pipeline](./SPRINT.md)
ESTIMATE:   480 min

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build
  lint:      swiftformat --quiet ios/LaneShadowUITests/DesignReview/

PROGRESS: AC-1 not started · 0/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Reviewer runs `xcodebuild test` against `DesignReviewCaptureTests` and produces `design-review.xcresult` with one named XCTAttachment per reachable (screen, state, theme).

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use real Clerk email/password auth via `CLERK_TEST_EMAIL` / `CLERK_TEST_PASSWORD` launch env (Sprint 03 RF-38 pattern)
- MUST name every XCTAttachment exactly `{screen}.{state}.{action}` with `.keepAlways` lifetime
- MUST call `setupDeterminismEnvironment()` in every test's setUp (animations off, frozen locale/timezone)
- NEVER reintroduce `bypassAuthForTesting` or any auth bypass flag (RF-38 explicitly removed it)
- NEVER modify production app code outside the optional `#if DEBUG` theme override hook; STRICTLY skip sessions-screen and saved-route tests via `throw XCTSkip` with explicit "Sprint 06" reason — do not delete or comment them out

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: `captureScreen` helper attaches uniquely-named PNG with `.keepAlways` [PRIMARY]
- [ ] AC-2: `test_authScreen_entry` drives app to S00 and captures named attachment
- [ ] AC-3: `test_authScreen_emailEntry` signs in via real Clerk and captures email-entry; no bypass symbol
- [ ] AC-4: Dark theme variants captured for all applicable screens
- [ ] AC-5: Sprint-06-deferred tests skip with explicit "Sprint 06" reason
- [ ] AC-6: Full class run produces `.xcresult` with ≥35 named attachments and exits 0

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD beads)
--------------------------------------------------------------------------------

AC-1: captureScreen helper attaches a uniquely-named PNG [PRIMARY]
  GIVEN: DesignReviewHelpers.captureScreen exists and is invoked from a passing XCUITest
  WHEN:  Test calls captureScreen("auth-screen", state: "entry", action: "load")
  THEN:  The test record contains an XCTAttachment named 'auth-screen.entry.load' with PNG payload and .keepAlways lifetime visible in the resulting .xcresult bundle
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift
  TEST_FUNCTION: test_captureHelper_attachesNamedPng
  VERIFY:        cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/test_captureHelper_attachesNamedPng -resultBundlePath build/xcresults/design-review-ac1.xcresult && xcrun xcresulttool get --path build/xcresults/design-review-ac1.xcresult --format json | grep -q 'auth-screen.entry.load'

AC-2: test_authScreen_entry captures S00 entry state
  GIVEN: App launched with deterministic environment and no signed-in user
  WHEN:  test_authScreen_entry runs
  THEN:  App is driven to the S00 entry state of auth-screen and an attachment named 'auth-screen.entry.load' is produced
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift
  TEST_FUNCTION: test_authScreen_entry
  VERIFY:        cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/test_authScreen_entry -resultBundlePath build/xcresults/design-review-ac2.xcresult && xcrun xcresulttool get --path build/xcresults/design-review-ac2.xcresult --format json | grep -q 'auth-screen.entry'

AC-3: test_authScreen_emailEntry uses real Clerk auth (no bypass)
  GIVEN: CLERK_TEST_EMAIL and CLERK_TEST_PASSWORD are present in .env.local and injected as launch env
  WHEN:  test_authScreen_emailEntry runs and exercises real Clerk sign-in flow
  THEN:  Real Clerk auth completes against production Clerk dev instance and an attachment named 'auth-screen.email-entry.load' is produced — no `bypassAuthForTesting` symbol exists in the test binary
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift
  TEST_FUNCTION: test_authScreen_emailEntry
  VERIFY:        cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/test_authScreen_emailEntry -resultBundlePath build/xcresults/design-review-ac3.xcresult && xcrun xcresulttool get --path build/xcresults/design-review-ac3.xcresult --format json | grep -q 'auth-screen.email-entry' && ! grep -r 'bypassAuthForTesting' ios/LaneShadowUITests/DesignReview/

AC-4: Dark theme variants captured for all applicable screens
  GIVEN: Theme override hook is wired (existing or new #if DEBUG)
  WHEN:  Dark-variant tests (test_authScreen_dark, test_idleScreen_dark, test_planningScreen_dark, test_routeResultsScreen_dark, test_routeDetailsScreen_dark, test_errorScreen_dark) run
  THEN:  Each produces an attachment with state suffix '.dark.load' and the captured screenshot reflects dark color scheme
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift
  TEST_FUNCTION: test_authScreen_dark
  VERIFY:        cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/test_authScreen_dark -resultBundlePath build/xcresults/design-review-ac4.xcresult && xcrun xcresulttool get --path build/xcresults/design-review-ac4.xcresult --format json | grep -q 'auth-screen.dark'

AC-5: Sprint-06-deferred tests throw XCTSkip with "Sprint 06" reason
  GIVEN: Sessions-screen and saved-route flows are not yet wired (Sprint 06 scope)
  WHEN:  Any sessions-screen or saved-route test method runs (e.g. test_routeDetailsScreen_saved)
  THEN:  The method invokes throw XCTSkip with reason text containing 'Sprint 06' and does not produce attachments
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift
  TEST_FUNCTION: test_routeDetailsScreen_saved
  VERIFY:        cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/test_routeDetailsScreen_saved -resultBundlePath build/xcresults/design-review-ac5.xcresult 2>&1 | grep -E 'Skipped.*Sprint 06'

AC-6: Full class run produces ≥35 named attachments and exits 0
  GIVEN: Full DesignReviewCaptureTests target is invoked
  WHEN:  xcodebuild test runs the entire class against iPhone 15 Pro Simulator
  THEN:  Exit code is 0, .xcresult bundle is produced at build/xcresults/design-review.xcresult, and it contains at least 35 named attachments matching '{screen}.{state}.{action}' for the reachable (non-skipped) tests across auth, idle, planning, route-results, route-details, and error screens
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift
  TEST_FUNCTION: ClassLevel
  VERIFY:        cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests -resultBundlePath build/xcresults/design-review.xcresult && [ $(xcrun xcresulttool get --path build/xcresults/design-review.xcresult --format json | grep -cE '"name".*\.(load|dark)') -ge 35 ]

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | captureScreen produces XCTAttachment with name='{screen}.{state}.{action}' and lifetime=.keepAlways | AC-1 | xcodebuild test only-testing test_captureHelper_attachesNamedPng |
| TC-2 | test_authScreen_entry drives unauthenticated launch to S00 and attaches auth-screen.entry.load | AC-2 | xcodebuild test only-testing test_authScreen_entry |
| TC-3 | test_authScreen_emailEntry uses real Clerk credentials from launch env; binary contains zero references to bypassAuthForTesting | AC-3 | xcodebuild test test_authScreen_emailEntry && `! grep -rn 'bypassAuthForTesting' ios/LaneShadowUITests/DesignReview/` |
| TC-4 | Dark-variant tests across all six screens emit attachments with '.dark.load' suffix | AC-4 | full-class run + `[ $(xcrun xcresulttool get … \| grep -c '\.dark\.') -ge 6 ]` |
| TC-5 | Sprint-06-deferred tests exist as methods and skip with 'Sprint 06' reason | AC-5 | xcodebuild test test_routeDetailsScreen_saved 2>&1 \| grep -q 'Sprint 06' |
| TC-6 | Full class run exits 0 and yields ≥35 named attachments in design-review.xcresult | AC-6 | xcodebuild test only-testing DesignReviewCaptureTests |
| TC-7 | SwiftFormat clean on created/modified files | AC-1 | swiftformat --quiet ios/LaneShadowUITests/DesignReview/ && git diff --exit-code ios/LaneShadowUITests/DesignReview/ |
| TC-8 | Native token compliance script passes | AC-1 | scripts/tokens/enforce-native-compliance.sh |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadowUITests/DesignReview/DesignReviewHelpers.swift (NEW)
- ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift (NEW)
- ios/LaneShadow.xcodeproj/project.pbxproj (MODIFY — only to register the two new test files into LaneShadowUITests target; no other modifications)
- ios/LaneShadow/**/*.swift (MODIFY — only a single optional `#if DEBUG` theme override hook, ask_first if no existing toggle is found)

writeProhibited:
- ios/LaneShadow/Sandbox/** — sandbox catalog UI must remain intact
- tokens/sandbox/** — deleted in FID-S05-T01
- ios/LaneShadowUITests/AuthEmailPasswordE2ETests.swift — read-only reference (PRIMARY PATTERN source)
- ios/LaneShadowUITests/Sprint04/** — read-only reference
- Any production app code outside the optional `#if DEBUG` theme hook
- Anything that reintroduces `bypassAuthForTesting` symbols

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Reuse existing `*MockProvider.swift` files for deterministic state injection
- Follow Sprint 03 RF-38 launch-env auth pattern from `AuthEmailPasswordE2ETests.swift`
- Run `swiftformat --quiet` on all created/modified files before commit
- Use existing `AppLauncher.swift` helper for launch arg/env composition
- Name every attachment exactly `{screen}.{state}.{action}` with `.keepAlways` lifetime

⚠️ Ask First:
- Adding a new `#if DEBUG` theme override hook in ios/LaneShadow/ if no existing light/dark toggle exists
- Introducing any new launch-arg key not already present in AppLauncher.swift
- Adding any new mock provider file (prefer extending existing ones)
- Any modification under ios/LaneShadow.xcodeproj/project.pbxproj beyond registering the two new test files

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadowUITests/DesignReview/DesignReviewHelpers.swift (NEW): captureScreen() and setupDeterminismEnvironment() helpers
- ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift (NEW): ~42 test methods across auth/idle/planning/route-results/route-details/error screens with dark variants, plus Sprint-06-deferred tests using throw XCTSkip
- (optional) Minimal `#if DEBUG` theme override hook in ios/LaneShadow/ if no existing toggle is discovered (only after ask_first confirmation)
- build/xcresults/design-review.xcresult (RUNTIME — not committed): produced by full xcodebuild test run with ≥35 named attachments

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ:   AuthEmailPasswordE2ETests.swift (PRIMARY PATTERN), AppLauncher.swift, current AC
  WRITE:  ONE test method that exercises GIVEN-WHEN-THEN
  RUN:    {test_command}
  VERIFY: Test FAILS (compilation error or runtime failure — NOT errors only; fails)
  RETURN: { phase: "RED", test_file, test_function, failure_output }

### GREEN PHASE
  READ:   Failing test, AC definition, mock provider exemplars
  WRITE:  MINIMAL helper or test driver code to make test pass
  RUN:    {test_command}
  VERIFY: Test PASSES
  RETURN: { phase: "GREEN", files_changed, test_output }

### REFACTOR PHASE
  Optional cleanup; SwiftFormat clean; tests must stay green.

Strategy: AC-1 first (captureScreen helper). Then AC-2 (simple unauthenticated test). Then AC-3 (real Clerk auth — adapt RF-38 pattern). Then AC-4 (dark theme override hook — flag ask_first if no existing toggle). Then AC-5 (XCTSkip placeholders for deferred screens). Finally AC-6 (full-class run produces ≥35 attachments).

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ios/LaneShadowUITests/AuthEmailPasswordE2ETests.swift [PRIMARY PATTERN]
   - Lines: full file
   - Focus: real Clerk launch-env auth (RF-38)

2. ios/LaneShadowUITests/Helpers/AppLauncher.swift
   - Lines: full file
   - Focus: launch arg / env composition helper

3. ios/LaneShadowUITests/Sprint04/Sprint04GateE2ETests.swift
   - Lines: full file
   - Focus: multi-state app driver shape reference

4. ios/LaneShadow/**/*MockProvider.swift (sample 1-2)
   - Focus: deterministic state injection exemplars

5. /Users/justinrich/.claude/plans/plan-a-design-review-logical-clock.md
   - Section: Phase 2 + article §2.1 Capture Helper
   - Focus: full XCUITest harness spec + XCUIScreen.main.screenshot() pattern

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase per AC
  Required: TDD_STATE history shows each test went red before green

Gate 2: Full class xcodebuild test
  Command:  cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests -resultBundlePath build/xcresults/design-review.xcresult
  Expected: exit 0

Gate 3: Attachment count
  Command:  xcrun xcresulttool get --path build/xcresults/design-review.xcresult --format json | grep -cE '"name".*\.(load|dark)'
  Expected: >= 35

Gate 4: No bypassAuthForTesting
  Command:  ! grep -rn 'bypassAuthForTesting' ios/LaneShadowUITests/DesignReview/
  Expected: no matches

Gate 5: SwiftFormat
  Command:  swiftformat --quiet ios/LaneShadowUITests/DesignReview/ && git diff --exit-code ios/LaneShadowUITests/DesignReview/
  Expected: exit 0

Gate 6: Native token compliance
  Command:  scripts/tokens/enforce-native-compliance.sh
  Expected: exit 0

Gate 7: Sprint 06 skip evidence
  Command:  xcodebuild test only-testing test_routeDetailsScreen_saved 2>&1 | grep 'Sprint 06'
  Expected: at least one match

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Android equivalent capture harness (deferred to a follow-up sprint)
- Behavioral / vision-LLM evaluation of captured screenshots (T05; behavioral axis deferred entirely)
- Rendered design references (FID-S05-T02)
- Export script that reads design-review.xcresult into PNGs (FID-S05-T04)
- pnpm design:capture / pnpm design:review skill wiring (FID-S05-T08)
- Calibration / threshold tuning (FID-S05-T06)
- Sessions-screen and saved-route flow capture (Sprint 06 — present as XCTSkip placeholders only)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** No design review capture tests exist. Sprint 03 RF-38 just landed real Clerk email/password auth in `AuthEmailPasswordE2ETests.swift`, removing `bypassAuthForTesting`. Sandbox snapshot tests will be removed by FID-S05-T01 before this task starts. Mock providers exist for deterministic state across feature screens. Sandbox catalog UI itself is preserved.

**Gap:** Design review pipeline needs a per-(screen, state, theme) capture harness that drives the real app through reachable states using real auth and produces a single `.xcresult` bundle of named XCTAttachments suitable for downstream export and vision-LLM evaluation.

--------------------------------------------------------------------------------
REVIEW (for swift-reviewer)
--------------------------------------------------------------------------------

Must pass:
- Real Clerk auth pattern from RF-38 reused verbatim — no bypass flag, no stubbed Clerk client
- Every XCTAttachment uses exact name shape `{screen}.{state}.{action}` and `.keepAlways` lifetime
- Sprint-06-deferred tests throw XCTSkip with 'Sprint 06' reason and are not deleted, commented, or silently passing
- `setupDeterminismEnvironment()` invoked in setUp of every test method
- No production app code modified beyond at most one `#if DEBUG` theme hook (and only if ask_first was honored)
- SwiftFormat clean and native token compliance script clean
- All test methods compile and the full DesignReviewCaptureTests run exits 0 with ≥35 attachments
- No reintroduction of `bypassAuthForTesting` anywhere in the diff

Should verify:
- Test method names follow `test_{screenCamelCase}_{stateCamelCase}` convention consistently
- captureScreen helper signature matches article §2.1 verbatim
- Mock provider reuse vs. extension is justified per task

Verdict: APPROVED | NEEDS_FIXES
Domain reviewer: swift-reviewer

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S05-T01
Blocks:     FID-S05-T04
Parallel:   FID-S05-T02

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"captureScreen helper attaches a uniquely-named PNG with .keepAlways lifetime","verify":"cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/test_captureHelper_attachesNamedPng -resultBundlePath build/xcresults/design-review-ac1.xcresult && xcrun xcresulttool get --path build/xcresults/design-review-ac1.xcresult --format json | grep -q 'auth-screen.entry.load'","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-2","type":"acceptance_criterion","description":"test_authScreen_entry drives app to S00 entry state and captures named attachment","verify":"cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/test_authScreen_entry -resultBundlePath build/xcresults/design-review-ac2.xcresult && xcrun xcresulttool get --path build/xcresults/design-review-ac2.xcresult --format json | grep -q 'auth-screen.entry'","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-3","type":"acceptance_criterion","description":"test_authScreen_emailEntry signs in via real Clerk and captures email-entry state without any auth bypass","verify":"cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/test_authScreen_emailEntry -resultBundlePath build/xcresults/design-review-ac3.xcresult && xcrun xcresulttool get --path build/xcresults/design-review-ac3.xcresult --format json | grep -q 'auth-screen.email-entry' && ! grep -r 'bypassAuthForTesting' ios/LaneShadowUITests/DesignReview/","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-4","type":"acceptance_criterion","description":"Dark theme variants captured for all applicable screens","verify":"cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/test_authScreen_dark -resultBundlePath build/xcresults/design-review-ac4.xcresult && xcrun xcresulttool get --path build/xcresults/design-review-ac4.xcresult --format json | grep -q 'auth-screen.dark'","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-5","type":"acceptance_criterion","description":"Sprint-06-deferred tests exist but throw XCTSkip with Sprint 06 reason","verify":"cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/test_routeDetailsScreen_saved -resultBundlePath build/xcresults/design-review-ac5.xcresult 2>&1 | grep -E 'Skipped.*Sprint 06'","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-6","type":"acceptance_criterion","description":"Full class run produces design-review.xcresult with >=35 named attachments and exits 0","verify":"cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests -resultBundlePath build/xcresults/design-review.xcresult && [ $(xcrun xcresulttool get --path build/xcresults/design-review.xcresult --format json | grep -cE '\"name\".*\\.(load|dark)') -ge 35 ]","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-1","type":"test_criterion","description":"captureScreen produces named XCTAttachment with .keepAlways lifetime","verify":"cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/test_captureHelper_attachesNamedPng","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-2","type":"test_criterion","description":"test_authScreen_entry attaches auth-screen.entry.load","verify":"cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/test_authScreen_entry","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-3","type":"test_criterion","description":"Real Clerk auth completes; bypass symbol absent","verify":"cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/test_authScreen_emailEntry && ! grep -rn 'bypassAuthForTesting' ios/LaneShadowUITests/DesignReview/","maps_to_ac":"AC-3","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-4","type":"test_criterion","description":"All six screens emit '.dark.' suffixed attachments","verify":"cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests -resultBundlePath build/xcresults/dark.xcresult && [ $(xcrun xcresulttool get --path build/xcresults/dark.xcresult --format json | grep -c '\\.dark\\.') -ge 6 ]","maps_to_ac":"AC-4","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-5","type":"test_criterion","description":"Deferred tests skip with explicit Sprint 06 reason","verify":"cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/test_routeDetailsScreen_saved 2>&1 | grep -q 'Sprint 06'","maps_to_ac":"AC-5","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-6","type":"test_criterion","description":"Full class run exits 0 with >=35 attachments","verify":"cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:LaneShadowUITests/DesignReviewCaptureTests -resultBundlePath build/xcresults/design-review.xcresult","maps_to_ac":"AC-6","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-7","type":"test_criterion","description":"SwiftFormat clean on created/modified files","verify":"swiftformat --quiet ios/LaneShadowUITests/DesignReview/DesignReviewHelpers.swift ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift && git diff --exit-code ios/LaneShadowUITests/DesignReview/","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-8","type":"test_criterion","description":"Native token compliance passes","verify":"scripts/tokens/enforce-native-compliance.sh","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null}]}
-->
