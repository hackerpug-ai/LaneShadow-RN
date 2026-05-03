# Sprint-04 E2E Test Suite

## Overview

This directory contains instrumented E2E tests for Sprint-04 "Conversational Planning Loop". The tests verify all 8 human gate steps from SPRINT.md using real Convex backend integration.

## Test File

`Sprint04GateE2ETest.kt` - 8 test methods covering each gate step:
1. `gate_step_1_signed_in_user_reaches_idle_with_greeting()` - Verify auth bypass and IdleScreen rendering
2. `gate_step_2_chat_prompt_advances_to_planning()` - Verify PlanningScreen with LSPhaseIndicator
3. `gate_step_3_three_routes_appear_on_results_screen()` - Verify 3 route cards on RouteResultsScreen
4. `gate_step_4_tapping_route_card_opens_details()` - Verify RouteDetailsScreen with weather
5. `gate_step_5_alt_selection_updates_polyline_and_border()` - Verify dismiss/recall chip and alt selection
6. `gate_step_6_cancel_returns_to_idle()` - Verify cancel planning flow
7. `gate_step_7_refine_reuses_session()` - Verify refinement reuses session
8. `gate_step_8_auth_error_shows_error_screen()` - Verify error taxonomy mapping

## Running Tests

### Prerequisites

1. **Convex Backend**: Set `CONVEX_URL` in environment or gradle properties
2. **Auth Credentials**: Set `CLERK_TEST_EMAIL` and `CLERK_TEST_PASSWORD` for auth bypass
3. **Emulator/Device**: Launch Android emulator or connect physical device

### Run All Tests

```bash
cd android
./gradlew :app:connectedDebugAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest
```

### Run Single Test

```bash
cd android
./gradlew :app:connectedDebugAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.e2e.sprint04.Sprint04GateE2ETest \
  -Pandroid.testInstrumentationRunnerArguments.method=gate_step_1_signed_in_user_reaches_idle_with_greeting
```

## Manual Verification Required

Per RULES.md § Real Device E2E Testing, Android instrumented tests run on emulator. Real-device E2E evidence requires physical Android device verification.

### Manual Evidence Checklist

For each gate step:
1. Install debug APK on physical device: `./gradlew installDebug`
2. Run test via Android Studio or adb
3. Capture screenshots from device or use automated capture in test
4. Verify assertions pass on real device (not just emulator)
5. Attach screenshots to PR/review as evidence

### Evidence Location

Screenshots are automatically saved to:
```
android/app/src/androidTest/screenshots/sprint-04-e2e/step-{N}/{name}.png
```

## Test Tags

The tests rely on these Compose semantics tags being present in the UI:
- `auth_screen` - Auth entry screen
- `idle_suggestion_chip` - Suggestion chips on IdleScreen
- `planning_screen` - PlanningScreen root
- `planning_cancel_button` - Cancel button on PlanningScreen
- `phase_indicator` - LSPhaseIndicator component
- `route_results_screen` - RouteResultsScreen root
- `ls-navigator-message` - LSNavigatorMessage callout
- `navigator-close-icon` - Dismiss control on callout
- `route-results-attachment` - Route attachment card (with route ID suffix)
- `route-details-screen` - RouteDetailsScreen root
- `ls-route-sheet` - LSRouteSheet component
- `ls-instrument-readout` - LSInstrumentReadout component
- `ls-weather-timeline` - LSWeatherTimeline component
- `chat_input` - Chat input field
- `chat_send_button` - Send button
- `error_screen` - ErrorScreen root
- `error_message` - Error message text
- `recovery_chip` - Recovery action chip

## Auth Bypass

Tests use `EXTRA_BYPASS_AUTH=true` Intent extra to skip Clerk OAuth. This is a DEBUG-only feature that:
1. Skips the auth screen
2. Directly authenticates the test user
3. Allows tests to proceed to IdleScreen immediately

The bypass is gated on `BuildConfig.DEBUG` and the Intent extra, ensuring it cannot be used in release builds.

## Real Convex Integration

These tests hit the real Convex backend at `CONVEX_URL`. No mocking or stubbing:
- All queries hit real `db.*` functions
- All mutations execute real server-side logic
- Agent streaming is tested end-to-end
- Error taxonomy is tested against real server responses

## Dependencies

- Compose Testing (`androidx.compose.ui:ui-test`)
- Compose JUnit Runner (`androidx.compose.ui:ui-test-junit4`)
- Activity Scenario (`androidx.test:core`)
- Instrumentation Registry (`androidx.test:runner`)

## Troubleshooting

### Test Timeout

Tests wait up to 45 seconds for planning to complete (real agent processing). If tests timeout:
- Check Convex backend is healthy
- Verify `CONVEX_URL` is correct
- Check network connectivity

### Auth Failures

If auth bypass fails:
- Verify `EXTRA_BYPASS_AUTH` is passed correctly
- Check that build is DEBUG (not release)
- Verify auth repository bypass logic is working

### Screenshot Failures

If screenshot capture fails:
- Check device/emulator has storage permissions
- Verify external files directory is accessible
- Check disk space on device

## Related Files

- `SPRINT.md` - Human gate steps and acceptance criteria
- `RULES.md` - Real-device E2E testing requirements
- `docs/REAL_DEVICE_E2E.md` - E2E testing patterns
- `android/app/src/main/java/com/laneshadow/services/LaneShadowError.kt` - Error taxonomy
- `android/app/src/main/java/com/laneshadow/services/RideFlowState.kt` - State machine
