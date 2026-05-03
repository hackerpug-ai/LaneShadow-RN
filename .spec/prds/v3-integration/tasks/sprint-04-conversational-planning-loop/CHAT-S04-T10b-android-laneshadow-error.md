================================================================================
TASK: CHAT-S04-T10b - Android LaneShadowError typed sealed class + ErrorRoute + SignOutFlow
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: review updated · 6 DONE WHEN PASS · 2 FAIL · 1 PARTIAL

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Server error codes (SESSION_NOT_FOUND, RATE_LIMIT_EXCEEDED, PLAN_LIMIT_EXCEEDED, AGENT_TIMEOUT, UNAUTHENTICATED, NETWORK_TIMEOUT, AUTH_REQUIRED, NOT_FOUND, INVALID_INPUT) are mapped to a Kotlin sealed LaneShadowError with user-facing copy via stringResource; UNAUTHENTICATED triggers SignOutFlow.run(); ErrorScreen recovery chips dispatch retry/reset/sign-in.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST define a Kotlin sealed class LaneShadowError mirroring the RN getUserFacingError() taxonomy from react-native/lib/convex-error.ts and the codes in server/lib/errors.ts
- MUST provide a top-level pure fun toLaneShadowError(throwable: Throwable): LaneShadowError that inspects message, then ConvexException subclasses (when SDK exposes them), then IOException for NETWORK_TIMEOUT, falling back to LaneShadowError.Unknown
- MUST emit user-facing copy via @StringRes resource ids (no hardcoded English strings in the error class) — values added to res/values/strings.xml
- MUST trigger AuthRepository.signOut() + clear EncryptedSharedPreferences + navigate to Route.SignIn when LaneShadowError.Unauthenticated is surfaced (matches UC-CHAT-06 AC#5)
- MUST integrate with ErrorScreen template — the existing ErrorRoute composable forwards the typed error to recovery chip handlers
- MUST surface PlanLimitExceeded (PLAN_LIMIT_EXCEEDED) with no retry chip per UC-CHAT-06 AC#6
- NEVER show raw server error codes to users (e.g., never display "AGENT_TIMEOUT" — always the mapped string)
- NEVER hold a hard reference to NavController inside SignOutFlow — accept a navigation callback or use a SharedFlow<NavEvent>
- NEVER swallow UNAUTHENTICATED — always sign out + navigate (no silent retry)
- NEVER add new server error codes that don't exist in server/lib/errors.ts — request a backend addition first
- NEVER perform sign-out work on Dispatchers.Main; use Dispatchers.IO
- STRICTLY mirror the RN error code taxonomy in react-native/lib/convex-error.ts and server/lib/errors.ts (1:1 case match)

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] toLaneShadowError maps known server codes (AC-1 PRIMARY) ← FAIL: current RN/server taxonomy includes `AUTH_REQUIRED`, `SESSION_REQUIRED`, `USER_NOT_FOUND`, `NO_FIELDS_TO_UPDATE`, `NOT_FOUND`, `INVALID_INPUT`, `LLM_SKETCH_INVALID`, `LLM_SKETCH_AMBIGUOUS`, `ROUTING_COMPILE_FAILED`, and `CONDITIONS_LOOKUP_FAILED`, but `LaneShadowError`/`KnownErrorCodes` implement a different legacy set and will fall back to `Unknown` for most real server codes (evidence: react-native/lib/convex-error.ts:1, server/lib/errors.ts:8, android/app/src/main/java/com/laneshadow/services/LaneShadowError.kt:11, android/app/src/main/java/com/laneshadow/services/LaneShadowErrorMapper.kt:24)
- [x] IOException maps to NetworkTimeout (AC-2)
- [x] Unknown error maps to LaneShadowError.Unknown (AC-3)
- [x] UNAUTHENTICATED triggers SignOutFlow + nav to SignIn (AC-4)
- [x] PLAN_LIMIT_EXCEEDED hides retry chip (AC-5)
- [x] User-facing copy resolved via stringResource id (AC-6)
- [ ] gradlew test + compileDebugKotlin clean ← FAIL: `:app:compileDebugKotlin` passed, but full `./gradlew test` still fails in 17 baseline suites and `./gradlew lint`/`./gradlew detekt` fail on baseline lint errors in `LoginSmokeTest.kt` (evidence: android/app/build/reports/tests/testDebugUnitTest/index.html, android/app/build/intermediates/lint_intermediate_text_report/debug/lintReportDebug/lint-results-debug.txt)
- [x] Planning `route_plans.status == "failed"` transitions reach `ErrorRoute` with encoded code/message
- [ ] Retry / start-over perform real retry-reset behavior, not navigation-only dismissal ← PARTIAL: retry now re-sends cached chat content, but start-over only clears persisted UI preferences (`lastViewedSessionId`, `defaultCamera`, `sessionCameras`) before navigating home and does not reset planning/session domain state as required by `ERROR -> IDLE on RESET` (evidence: android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt:90, android/app/src/main/java/com/laneshadow/services/AppStateRepository.kt:108, .spec/prds/v3-integration/05-uc-chat.md:121)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: toLaneShadowError maps known server codes [PRIMARY]
  GIVEN: Throwables with messages "AGENT_TIMEOUT", "PLAN_LIMIT_EXCEEDED", "SESSION_NOT_FOUND", and "RATE_LIMIT_EXCEEDED"
  WHEN:  toLaneShadowError(throwable) is called for each
  THEN:  Returns LaneShadowError.AgentTimeout, LaneShadowError.PlanLimitExceeded, LaneShadowError.SessionNotFound, and LaneShadowError.RateLimitExceeded respectively (each retains its code string)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/LaneShadowErrorTest.kt
  TEST_FUNCTION: toLaneShadowError_knownServerCodes_mapToTypedVariants

AC-2: IOException maps to NetworkTimeout
  GIVEN: A java.io.IOException("connection lost")
  WHEN:  toLaneShadowError(ioException) is called
  THEN:  Returns LaneShadowError.NetworkTimeout (preserving the original cause)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/LaneShadowErrorTest.kt
  TEST_FUNCTION: toLaneShadowError_ioException_mapsToNetworkTimeout

AC-3: Unknown error maps to LaneShadowError.Unknown
  GIVEN: A RuntimeException with message="some unexpected internal error"
  WHEN:  toLaneShadowError(throwable) is called
  THEN:  Returns LaneShadowError.Unknown(originalMessage="some unexpected internal error")

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/LaneShadowErrorTest.kt
  TEST_FUNCTION: toLaneShadowError_unknownMessage_mapsToUnknownVariantPreservingMessage

AC-4: UNAUTHENTICATED triggers SignOutFlow + nav to SignIn
  GIVEN: An ErrorViewModel with a fake AuthRepository spy and a SignOutFlow that records navigation events
  WHEN:  viewModel.handle(LaneShadowError.Unauthenticated) is invoked
  THEN:  Fake AuthRepository.signOut was called once, the SignOutFlow emitted a NavEvent.Navigate(Route.SignIn) on its events SharedFlow, and ErrorScreen is NOT rendered for this error

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/error/ErrorViewModelTest.kt
  TEST_FUNCTION: handle_unauthenticatedError_signsOutAndNavigatesToSignIn

AC-5: PLAN_LIMIT_EXCEEDED hides retry chip
  GIVEN: An ErrorViewModel with current error = LaneShadowError.PlanLimitExceeded
  WHEN:  viewModel.suggestions() is collected
  THEN:  The list contains a Start over chip but NOT a Try again chip (per UC-CHAT-06 AC#6)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/error/ErrorViewModelTest.kt
  TEST_FUNCTION: suggestions_planLimitExceeded_omitsTryAgainChip

AC-6: User-facing copy resolved via stringResource id
  GIVEN: A LaneShadowError.AgentTimeout instance
  WHEN:  error.messageResId is read
  THEN:  Returns R.string.error_agent_timeout (the integer matches the value declared in res/values/strings.xml)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/LaneShadowErrorTest.kt
  TEST_FUNCTION: messageResId_agentTimeout_returnsRStringErrorAgentTimeout

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/services/LaneShadowError.kt (NEW — sealed class + messageResId + originalCode)
- android/app/src/main/java/com/laneshadow/services/LaneShadowErrorMapper.kt (NEW — pure top-level fun toLaneShadowError)
- android/app/src/main/java/com/laneshadow/services/SignOutFlow.kt (NEW — @Singleton, runs AuthRepository.signOut + emits NavEvent on a SharedFlow)
- android/app/src/main/java/com/laneshadow/ui/error/ErrorRoute.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/error/ErrorViewModel.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/error/ErrorUiState.kt (NEW)
- android/app/src/main/res/values/strings.xml (MODIFY — add error_agent_timeout, error_plan_limit_exceeded, error_session_not_found, error_rate_limit_exceeded, error_network_timeout, error_unauthenticated, error_auth_required, error_not_found, error_invalid_input, error_unknown)
- android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt (MODIFY — wire ErrorRoute as production destination + listen on SignOutFlow.events to redirect to SignIn)
- android/app/src/test/java/com/laneshadow/services/LaneShadowErrorTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/error/ErrorViewModelTest.kt (NEW)

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/templates/ErrorScreen.kt — v2 template untouched
- android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt — Sprint 03 surface; only call existing signOut
- server/lib/errors.ts — backend changes are out of scope
- Any iOS file under ios/**

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use sealed class with @StringRes Int property for messageResId
- Use a SharedFlow<NavEvent> in SignOutFlow (replay=0, extraBufferCapacity=1) collected in MainActivity / NavHost
- Use Dispatchers.IO for AuthRepository.signOut and EncryptedSharedPreferences clearing
- Use stringResource(error.messageResId) inside the Composable — not directly in the ViewModel

⚠️ Ask First:
- If a server error code surfaces in production that isn't in server/lib/errors.ts — surface a needs-backend ticket before adding a Kotlin variant
- If ConvexException subclasses are not exposed by the SDK version pinned in build.gradle.kts — fall back to message-string matching only

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- LaneShadowError.kt (sealed class + variants Unauthenticated, AuthRequired, SessionNotFound, RateLimitExceeded, PlanLimitExceeded, PlanAlreadyActive, AgentTimeout, NetworkTimeout, NotFound, InvalidInput, Unknown — each with @StringRes messageResId and originalCode: String?)
- LaneShadowErrorMapper.kt (top-level pure fun)
- SignOutFlow.kt (@Singleton + events: SharedFlow<NavEvent>)
- ErrorRoute.kt + ErrorViewModel.kt + ErrorUiState.kt
- strings.xml (MODIFY — add ten error_* string resources)
- MainNavGraph.kt (MODIFY): wire ErrorRoute + listen on SignOutFlow.events

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

[Standard RED -> GREEN -> REFACTOR per AC.]

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. react-native/lib/convex-error.ts [PRIMARY PATTERN]
   - Lines: 1-50
   - Focus: getServerErrorCode + getUserFacingError to mirror 1:1

2. server/lib/errors.ts
   - Lines: 1-26
   - Focus: Source of truth for server error code taxonomy

3. .spec/prds/v3-integration/05-uc-chat.md
   - Lines: 115-131
   - Focus: UC-CHAT-06 acceptance criteria including UNAUTHENTICATED redirect and PLAN_LIMIT_EXCEEDED no-retry rule

4. .spec/prds/v3-integration/architecture/android-architecture.md
   - Lines: 724-740
   - Focus: ConvexErrorMapper sketch mirroring RN convex-error.ts

5. android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt
   - Lines: 1-200
   - Focus: Existing signOut() entry point

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE history per AC
Gate 2: All tests pass — cd android && ./gradlew test (Exit 0)
Gate 3: Type check — cd android && ./gradlew :app:compileDebugKotlin (Exit 0)
Gate 4: Static analysis — cd android && ./gradlew detekt (skip if not enabled)
Gate 5: Token compliance — scripts/tokens/enforce-native-compliance.sh (Exit 0)
Gate 6: String resource lint — cd android && ./gradlew lint (Exit 0)
Gate 7: Scope compliance — git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: AUTH-S03 ClerkAuthRepository (signOut), CHAT-S04-T02 (RideFlowState.Error), CHAT-S04-T04 (Repository scaffolding for sendMessage failure paths)
Blocks: Sprint 05 ErrorScreen extensions

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN known server codes WHEN toLaneShadowError called THEN typed variant returned", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.LaneShadowErrorTest.toLaneShadowError_knownServerCodes_mapToTypedVariants", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN IOException WHEN mapped THEN NetworkTimeout", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.LaneShadowErrorTest.toLaneShadowError_ioException_mapsToNetworkTimeout", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN unknown error WHEN mapped THEN Unknown variant preserves message", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.LaneShadowErrorTest.toLaneShadowError_unknownMessage_mapsToUnknownVariantPreservingMessage", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN Unauthenticated WHEN handled THEN signOut + navigate to SignIn", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.error.ErrorViewModelTest.handle_unauthenticatedError_signsOutAndNavigatesToSignIn", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN PlanLimitExceeded WHEN suggestions collected THEN no Try again chip", "verify": "cd android && ./gradlew test --tests com.laneshadow.ui.error.ErrorViewModelTest.suggestions_planLimitExceeded_omitsTryAgainChip", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN AgentTimeout WHEN messageResId read THEN returns R.string.error_agent_timeout", "verify": "cd android && ./gradlew test --tests com.laneshadow.services.LaneShadowErrorTest.messageResId_agentTimeout_returnsRStringErrorAgentTimeout", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
