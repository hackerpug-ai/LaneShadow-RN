# TASK: AUTH-S03-R04 - iOS AuthScreen View Fidelity and Sandbox Variants

TASK_TYPE: FEATURE
STATUS: Completed
PRIORITY: P0
EFFORT: L
AGENT: implementer=swift-implementer | reviewer=swift-reviewer
SPRINT: sprint-03-auth-design-e2e-remediation
ESTIMATE: 360 min

## Outcome

Replace the generic iOS SignIn/SignUp presentation with the designed email-first AuthScreen variants.

## Critical Constraints

- MUST match `.spec/design/system/views/auth/auth-screen.html`, not the current native SignInScreen.
- MUST implement one email-first branching AuthScreen rather than separate visually unrelated sign-in and sign-up screens.
- MUST preserve production auth routing while adding sandbox-only variants.
- NEVER satisfy the task with render-only tests that do not assert design anatomy.
- STRICTLY use R02 primitives for fields, social buttons, divider, spinner, icons, and card styling.

## Specification

Objective: iOS AuthScreen renders the six designed variants and production unauthenticated routing uses the same composition.

Success state: iOS screenshots show the paper contour background, scrim, glass back chip, brand mark, Newsreader headline, social provider stack, labeled divider, email/password/new-user branches, footer, error state, and loading state matching the HTML design.

## Acceptance Criteria

AC-1: iOS AuthScreen uses the design anatomy
GIVEN an unauthenticated rider opens the app
WHEN AuthScreen renders
THEN the screen includes map-paper contour background, soft scrim, back glass chip, brand mark, Newsreader headline, subhead, social provider stack, email divider, form fields, primary CTA, and footer legal links.
VERIFY: `rg "AuthScreen|Saddle|LaneShadow|Continue with Apple|OR CONTINUE WITH EMAIL|Terms|Privacy" ios/LaneShadow/Features/Auth ios/LaneShadow/Views ios/LaneShadow/Sandbox`

AC-2: iOS email-first branching states exist
GIVEN the rider enters an email
WHEN the view model resolves existing, new, invalid, and submitting states
THEN S01, S02, S03, V01, and V02 UI states render without navigating to a separate SignUpScreen shell.
VERIFY: `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/AuthScreensTests`

AC-3: iOS dark AuthScreen variant exists
GIVEN the design has S04 dark
WHEN sandbox stories render
THEN `templates.auth-screen.dark` resolves all colors through tokens and keeps Apple/Google button contrast correct.
VERIFY: `rg "templates.auth-screen.dark|colorScheme|dark" ios/LaneShadow/Sandbox ios/LaneShadowTests`

AC-4: iOS AuthScreen sandbox stories cover all design variants
GIVEN the design declares S01, S02, S03, S04, V01, and V02
WHEN stories are registered
THEN iOS has story IDs `templates.auth-screen.email-entry`, `templates.auth-screen.existing-user`, `templates.auth-screen.new-user`, `templates.auth-screen.invalid-email`, `templates.auth-screen.submitting`, and `templates.auth-screen.dark`.
VERIFY: `rg "templates.auth-screen.email-entry|templates.auth-screen.existing-user|templates.auth-screen.new-user|templates.auth-screen.invalid-email|templates.auth-screen.submitting|templates.auth-screen.dark" ios/LaneShadow/Sandbox ios/LaneShadowTests`

AC-5: iOS visual evidence is screenshot-based
GIVEN render-only tests missed the visual mismatch
WHEN the AuthScreen task is complete
THEN snapshot baselines and a design-comparison note are captured for each variant.
VERIFY: `pnpm snapshots:check && rg "auth-screen.html|templates.auth-screen" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation ios/LaneShadowTests`

## Test Criteria

| ID | Boolean Statement | Maps To AC | Verify |
|---|---|---|---|
| TC-1 | iOS AuthScreen source contains the design anatomy labels and controls. | AC-1 | `rg "Saddle|Continue with Apple|OR CONTINUE WITH EMAIL" ios/LaneShadow/Features/Auth ios/LaneShadow/Sandbox` |
| TC-2 | iOS tests cover existing-user, new-user, invalid-email, and submitting branches. | AC-2 | `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/AuthScreensTests` |
| TC-3 | iOS sandbox registers the dark auth-screen variant. | AC-3 | `rg "templates.auth-screen.dark" ios/LaneShadow/Sandbox ios/LaneShadowTests` |
| TC-4 | iOS sandbox registers all six AuthScreen design variants. | AC-4 | `rg "templates.auth-screen.email-entry|templates.auth-screen.submitting" ios/LaneShadow/Sandbox ios/LaneShadowTests` |
| TC-5 | Snapshot manifest checking passes after iOS AuthScreen stories are captured. | AC-5 | `pnpm snapshots:check` |

## Reading List

- `.spec/design/system/views/auth/auth-screen.html`
- `.spec/design/system/views/auth/README.md`
- `ios/LaneShadow/Features/Auth/SignInScreen.swift`
- `ios/LaneShadow/Features/Auth/SignUpScreen.swift`
- `ios/LaneShadow/Sandbox/Stories/Templates/IdleScreenStory.swift`

## Guardrails

write_allowed:
- `ios/LaneShadow/Features/Auth/**` (MODIFY/CREATE AuthScreen and view model states)
- `ios/LaneShadow/Views/AuthFlow/**` (MODIFY routing into AuthScreen)
- `ios/LaneShadow/Sandbox/Stories/Templates/**` (ADD AuthScreen stories)
- `ios/LaneShadowTests/**` (ADD/MODIFY AuthScreen behavior and snapshot tests)
- `ios/project.yml` and generated `ios/LaneShadow.xcodeproj/**` only if new files require XcodeGen membership

write_prohibited:
- `android/**` - R05 owns Android view.
- `server/**` - R06/R07 own auth integration behavior.
- `.spec/design/system/**` - design source is not implementation scope.

## Design

references:
- `.spec/design/system/views/auth/auth-screen.html`
- `.spec/design/system/views/auth/README.md`

pattern: native template story registration with canonical ID and theme-aware snapshots.
pattern_source: `ios/LaneShadow/Sandbox/Stories/Templates`
anti_pattern: shipping a centered VStack sign-in form with a background image and calling it AuthScreen.

## Verification Gates

- `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build`
- `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/AuthScreensTests`
- `pnpm snapshots:check`

## Dependencies

depends_on: [AUTH-S03-R01, AUTH-S03-R02]
blocks: [AUTH-S03-R06, AUTH-S03-R08]

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"GIVEN an unauthenticated rider opens the app WHEN AuthScreen renders THEN the screen includes the full design anatomy from the HTML source.","verify":"rg \"AuthScreen|Saddle|LaneShadow|Continue with Apple|OR CONTINUE WITH EMAIL|Terms|Privacy\" ios/LaneShadow/Features/Auth ios/LaneShadow/Views ios/LaneShadow/Sandbox"},
{"id":"AC-2","type":"acceptance_criterion","description":"GIVEN the rider enters an email WHEN the view model resolves branch states THEN S01, S02, S03, V01, and V02 render without a separate SignUpScreen shell.","verify":"cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/AuthScreensTests"},
{"id":"AC-3","type":"acceptance_criterion","description":"GIVEN S04 dark exists WHEN sandbox stories render THEN templates.auth-screen.dark resolves colors through tokens.","verify":"rg \"templates.auth-screen.dark|colorScheme|dark\" ios/LaneShadow/Sandbox ios/LaneShadowTests"},
{"id":"AC-4","type":"acceptance_criterion","description":"GIVEN six design variants WHEN stories are registered THEN iOS has every templates.auth-screen variant ID.","verify":"rg \"templates.auth-screen.email-entry|templates.auth-screen.existing-user|templates.auth-screen.new-user|templates.auth-screen.invalid-email|templates.auth-screen.submitting|templates.auth-screen.dark\" ios/LaneShadow/Sandbox ios/LaneShadowTests"},
{"id":"AC-5","type":"acceptance_criterion","description":"GIVEN render-only tests missed visual mismatch WHEN complete THEN snapshot baselines and design-comparison notes exist for each variant.","verify":"pnpm snapshots:check && rg \"auth-screen.html|templates.auth-screen\" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation ios/LaneShadowTests"},
{"id":"TC-1","type":"test_criterion","description":"iOS AuthScreen source contains the design anatomy labels and controls.","maps_to_ac":"AC-1","verify":"rg \"Saddle|Continue with Apple|OR CONTINUE WITH EMAIL\" ios/LaneShadow/Features/Auth ios/LaneShadow/Sandbox"},
{"id":"TC-2","type":"test_criterion","description":"iOS tests cover existing-user, new-user, invalid-email, and submitting branches.","maps_to_ac":"AC-2","verify":"cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/AuthScreensTests"},
{"id":"TC-3","type":"test_criterion","description":"iOS sandbox registers the dark auth-screen variant.","maps_to_ac":"AC-3","verify":"rg \"templates.auth-screen.dark\" ios/LaneShadow/Sandbox ios/LaneShadowTests"},
{"id":"TC-4","type":"test_criterion","description":"iOS sandbox registers all six AuthScreen design variants.","maps_to_ac":"AC-4","verify":"rg \"templates.auth-screen.email-entry|templates.auth-screen.submitting\" ios/LaneShadow/Sandbox ios/LaneShadowTests"},
{"id":"TC-5","type":"test_criterion","description":"Snapshot manifest checking passes after iOS AuthScreen stories are captured.","maps_to_ac":"AC-5","verify":"pnpm snapshots:check"}
]}
-->

## Review (swift-reviewer contract) - 2026-04-30

Final reviewed commit: `873053097dc313cefb92c0343ae7083dbfb29681`
Merged to `main`: `82bb255d`
Task record commit: `13f51e6c`

Acceptance Criteria:
- [x] AC-1: iOS AuthScreen uses the design anatomy. Evidence: required anatomy grep passed; AuthScreen includes the paper contour background, scrim, glass back chip, brand block, headline, social stack, email divider, branch forms, CTA, spinner, and legal footer.
- [x] AC-2: iOS email-first branching states exist. Evidence: `AuthScreensTests` passed 24 tests; production `SignInScreen` injects an existing-user resolver, `SignUpScreen` injects a new-user resolver, and sample unresolved behavior is confined to preview/test helpers.
- [x] AC-3: iOS dark AuthScreen variant exists. Evidence: `templates.auth-screen.dark` is registered and applies `.preferredColorScheme(.dark)`.
- [x] AC-4: iOS AuthScreen sandbox stories cover all design variants. Evidence: all six canonical `templates.auth-screen.*` IDs are registered and covered by story tests.
- [x] AC-5: iOS visual evidence is screenshot-based. Evidence: AuthScreen snapshot baselines exist, `pnpm snapshots:check` passed, and tests reference `auth-screen.html` plus all six story IDs.

Test Criteria:
- [x] TC-1: iOS AuthScreen source contains the design anatomy labels and controls.
- [x] TC-2: iOS tests cover existing-user, new-user, invalid-email, and submitting branches.
- [x] TC-3: iOS sandbox registers the dark auth-screen variant.
- [x] TC-4: iOS sandbox registers all six AuthScreen design variants.
- [x] TC-5: Snapshot manifest checking passes after iOS AuthScreen stories are captured.

Notes:
- Earlier review-cycle failures for fake production email branching were remediated. The final production wrappers inject route-appropriate resolvers and no production `new`/`jamie`/string-contains account-existence heuristic remains.
- Review and remediation were run headless with CLI `xcodebuild`, `pnpm snapshots:check`, and `rg` verification.
