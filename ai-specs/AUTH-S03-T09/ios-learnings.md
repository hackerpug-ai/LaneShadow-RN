# iOS Learnings: AUTH-S03-T09 Auth Screens

## Implementation Date
2026-04-29

## Edge Cases Discovered
1. OAuth callback URLs may carry token in either query (`?token=`) or fragment (`#token=`); parser now supports both.
2. This repo currently has no dedicated auth background asset in `Assets.xcassets`, so screens use a deterministic image fallback (`mountain.2.fill`) while still rendering an image layer behind content.

## API Contract Notes
- `ClerkAuth` already provides async email/password and OAuth entry points; auth screen state machine can remain UI-focused.
- Existing `AppState` OAuth route does not carry callback URL payload, so `OAuthCallbackScreen` accepts URL injection for parse/complete behavior.

## UI Decisions
- Sign-in was implemented as step state machine (`email -> password -> submitting -> signedIn`) in `SignInViewModel` to satisfy AC-1 while keeping view logic minimal.
- Provider buttons were extracted to `LSAuthProviderButton` to avoid duplicating OAuth action controls.

## Platform-Specific Notes
- New `Features/` and `DesignSystem/` directories required source registration in `ios/project.yml` plus Xcode project regeneration.
- With XcodeGen synced folders, per-file `project.pbxproj` greps are not reliable because membership is directory-based.

## Files Created/Modified
- `ios/LaneShadow/Features/Auth/*` (new auth screens/models/viewmodel)
- `ios/LaneShadow/DesignSystem/Molecules/LSAuthProviderButton.swift`
- `ios/LaneShadow/Views/AuthFlow/{AuthFlowView,SignInView,SignUpView}.swift`
- `ios/LaneShadowTests/Integration/AuthScreensTests.swift`
- `ios/project.yml`, regenerated `ios/LaneShadow.xcodeproj/project.pbxproj`
