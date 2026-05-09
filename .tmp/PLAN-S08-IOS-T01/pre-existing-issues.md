# Pre-Existing Issues Blocking Full Test Green

## UI Test Failure
- `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift:171` — `test_idleScreen_chatFocused_light` fails because `idle-context-capsule` is not present on the idle screen.

## Verification
- Reproduced on stashed baseline code with:
  `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/test_idleScreen_chatFocused_light`
- Output saved to `.tmp/PLAN-S08-IOS-T01/preexisting-ui-test-check.txt`

## Scope Assessment
- This task changes only Planning view-model and phase-indicator model wiring.
- The reproduced failure is in unrelated idle-screen design review UI coverage and predates these changes.
