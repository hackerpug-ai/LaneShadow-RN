# TASK: AUTH-S03-R02 - iOS Auth Atoms and Social-Button Molecule Parity

TASK_TYPE: FEATURE
STATUS: Completed
PRIORITY: P0
EFFORT: M
AGENT: implementer=swift-implementer | reviewer=swift-reviewer
SPRINT: sprint-03-auth-design-e2e-remediation
ESTIMATE: 240 min

## Outcome

Bring iOS auth primitives up to the AuthScreen design contract before the screen is rebuilt.

## Critical Constraints

- MUST implement only reusable native atoms/molecules needed by AuthScreen.
- MUST keep story IDs identical to Android for every shared variant.
- MUST use LaneShadow tokens and SwiftUI theme values only; no feature-local hardcoded colors.
- NEVER hide provider branding inside generic `LSButton` styling.
- STRICTLY keep full AuthScreen layout work in R04.

## Specification

Objective: iOS exposes auth-ready `LSIcon`, `LSDivider`, `LSSpinner`, `LSTextField`/`LSFormField`, and `LSAuthProviderButton` behavior with sandbox stories and snapshots.

Success state: auth primitives can render the Apple/Google provider stack, labeled divider, icon text fields, error/helper states, disabled/loading states, and password eye toggle required by the design.

## Acceptance Criteria

AC-1: iOS icon catalog covers AuthScreen glyphs
GIVEN AuthScreen needs compass, chevron-left, mail, lock, eye, sparkle, and check glyphs
WHEN iOS sandbox stories render auth primitives
THEN each glyph is available through `LSIcon` or the established native icon adapter.
VERIFY: `rg "compass|mail|lock|eye|sparkle|check|chev" ios/LaneShadow/Views ios/LaneShadow/Sandbox/Stories ios/LaneShadowTests`

AC-2: iOS form fields support auth states
GIVEN email and password fields need labels, leading icons, trailing eye, helper text, error, disabled, focused, and secure-entry states
WHEN `LSFormField` and `LSTextField` render auth stories
THEN each state is visible without feature-local TextField/SecureField primitives.
VERIFY: `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/LSTextFieldTests`

AC-3: iOS social provider button matches design molecule
GIVEN `.spec/design/system/molecules/social-button/README.md`
WHEN Apple and Google auth buttons render in iOS
THEN Apple uses the inverted high-contrast recipe, Google uses card surface with four-color mark, and both expose accessibility labels.
VERIFY: `rg "LSAuthProviderButton|Continue with Apple|Continue with Google|accessibilityLabel" ios/LaneShadow ios/LaneShadowTests`

AC-4: iOS sandbox story coverage exists
GIVEN component parity requires shared story IDs
WHEN snapshot stories are registered
THEN iOS includes `molecules.auth-provider-button.apple`, `molecules.auth-provider-button.google`, and auth form-field variants.
VERIFY: `rg "molecules.auth-provider-button.apple|molecules.auth-provider-button.google|molecules.formfield.auth" ios/LaneShadow/Sandbox ios/LaneShadowTests`

AC-5: iOS snapshots and parity checks include auth primitives
GIVEN auth primitives are user-facing components
WHEN snapshot checks run
THEN auth primitive PNG baselines are generated for light and dark themes and `pnpm snapshots:check` has no auth gaps.
VERIFY: `pnpm snapshots:check`

## Test Criteria

| ID | Boolean Statement | Maps To AC | Verify |
|---|---|---|---|
| TC-1 | iOS icon support includes all AuthScreen glyph names. | AC-1 | `rg "compass|mail|lock|eye|sparkle|check" ios/LaneShadow/Views ios/LaneShadow/Sandbox/Stories` |
| TC-2 | iOS auth field states are covered by XCTest or snapshot stories. | AC-2 | `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/LSTextFieldTests` |
| TC-3 | iOS provider buttons expose Apple and Google accessibility labels. | AC-3 | `rg "Continue with Apple|Continue with Google" ios/LaneShadow/DesignSystem ios/LaneShadow/Views ios/LaneShadowTests` |
| TC-4 | iOS auth provider story IDs are registered in sandbox. | AC-4 | `rg "molecules.auth-provider-button" ios/LaneShadow/Sandbox ios/LaneShadowTests` |
| TC-5 | Snapshot manifest checking passes after auth primitive stories are added. | AC-5 | `pnpm snapshots:check` |

## Reading List

- `.spec/design/system/molecules/social-button/README.md`
- `.spec/design/system/views/auth/README.md`
- `ios/LaneShadow/Views/Atoms/LSTextField.swift`
- `ios/LaneShadow/Views/Molecules/LSFormField.swift`
- `ios/LaneShadow/DesignSystem/Molecules/LSAuthProviderButton.swift`

## Guardrails

write_allowed:
- `ios/LaneShadow/Views/Atoms/**` (MODIFY auth-support only)
- `ios/LaneShadow/Views/Molecules/LSFormField.swift` (MODIFY)
- `ios/LaneShadow/DesignSystem/Molecules/LSAuthProviderButton.swift` (MODIFY)
- `ios/LaneShadow/Sandbox/Stories/**` (ADD/MODIFY auth primitive stories)
- `ios/LaneShadowTests/**` (ADD/MODIFY focused primitive tests/snapshots)

write_prohibited:
- `ios/LaneShadow/Features/Auth/SignInScreen.swift` - R04 owns screen layout.
- `android/**` - R03 owns Android primitives.
- `.spec/design/system/**` - design source is not implementation scope.

## Design

references:
- `.spec/design/system/molecules/social-button/README.md`
- `.spec/design/system/views/auth/auth-screen.html`

pattern: existing iOS atom/molecule stories with canonical IDs such as `atoms.textfield.default` and `molecules.formfield.default`.
pattern_source: `ios/LaneShadow/Sandbox/Stories`
anti_pattern: local auth-only controls that duplicate atoms without sandbox coverage.

## Verification Gates

- `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build`
- `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/LSTextFieldTests`
- `pnpm snapshots:check`

## Dependencies

depends_on: [AUTH-S03-R01]
blocks: [AUTH-S03-R04, AUTH-S03-R08]

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"GIVEN AuthScreen needs auth glyphs WHEN iOS stories render auth primitives THEN each glyph is available through LSIcon or the established native icon adapter.","verify":"rg \"compass|mail|lock|eye|sparkle|check|chev\" ios/LaneShadow/Views ios/LaneShadow/Sandbox/Stories ios/LaneShadowTests"},
{"id":"AC-2","type":"acceptance_criterion","description":"GIVEN auth fields need labels, icons, helper, error, disabled, focused, and secure-entry states WHEN stories render THEN each state is visible without feature-local primitives.","verify":"cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/LSTextFieldTests"},
{"id":"AC-3","type":"acceptance_criterion","description":"GIVEN the social-button design WHEN Apple and Google buttons render THEN they match provider recipes and accessibility labels.","verify":"rg \"LSAuthProviderButton|Continue with Apple|Continue with Google|accessibilityLabel\" ios/LaneShadow ios/LaneShadowTests"},
{"id":"AC-4","type":"acceptance_criterion","description":"GIVEN shared story IDs WHEN stories are registered THEN iOS includes auth provider and auth form-field variants.","verify":"rg \"molecules.auth-provider-button.apple|molecules.auth-provider-button.google|molecules.formfield.auth\" ios/LaneShadow/Sandbox ios/LaneShadowTests"},
{"id":"AC-5","type":"acceptance_criterion","description":"GIVEN auth primitives are user-facing WHEN snapshot checks run THEN light and dark auth primitive baselines have no manifest gaps.","verify":"pnpm snapshots:check"},
{"id":"TC-1","type":"test_criterion","description":"iOS icon support includes all AuthScreen glyph names.","maps_to_ac":"AC-1","verify":"rg \"compass|mail|lock|eye|sparkle|check\" ios/LaneShadow/Views ios/LaneShadow/Sandbox/Stories"},
{"id":"TC-2","type":"test_criterion","description":"iOS auth field states are covered by XCTest or snapshot stories.","maps_to_ac":"AC-2","verify":"cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/LSTextFieldTests"},
{"id":"TC-3","type":"test_criterion","description":"iOS provider buttons expose Apple and Google accessibility labels.","maps_to_ac":"AC-3","verify":"rg \"Continue with Apple|Continue with Google\" ios/LaneShadow/DesignSystem ios/LaneShadow/Views ios/LaneShadowTests"},
{"id":"TC-4","type":"test_criterion","description":"iOS auth provider story IDs are registered in sandbox.","maps_to_ac":"AC-4","verify":"rg \"molecules.auth-provider-button\" ios/LaneShadow/Sandbox ios/LaneShadowTests"},
{"id":"TC-5","type":"test_criterion","description":"Snapshot manifest checking passes after auth primitive stories are added.","maps_to_ac":"AC-5","verify":"pnpm snapshots:check"}
]}
-->

## Review (swift-reviewer contract) - 2026-04-29

Final reviewed commit: `44c28d518286a562d4a1ab361ab1bbce80d384ae`
Merged to `main`: `a2b56879ced6510999a2f669e973fddcc03c94d8`
Guardrail cleanup commit: `16191ac3`

Acceptance Criteria:
- [x] AC-1: iOS icon catalog covers AuthScreen glyphs (evidence: `rg "compass|mail|lock|eye|sparkle|check|chev" ios/LaneShadow/Views ios/LaneShadow/Sandbox/Stories ios/LaneShadowTests` passed).
- [x] AC-2: iOS form fields support auth states (evidence: `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/LSTextFieldTests` passed).
- [x] AC-3: iOS social provider button matches the design molecule (evidence: Apple foreground/background contrast fixed in `ios/LaneShadow/DesignSystem/Molecules/LSAuthProviderButton.swift`, Google four-color mark preserved, hosted accessibility assertion in `ios/LaneShadowTests/LaneShadowTests.swift` passed).
- [x] AC-4: iOS sandbox story coverage exists (evidence: `rg "molecules.auth-provider-button.apple|molecules.auth-provider-button.google|molecules.formfield.auth" ios/LaneShadow/Sandbox ios/LaneShadowTests` passed).
- [x] AC-5: iOS snapshots and parity checks include auth primitives (evidence: `pnpm snapshots:check` passed with no orphan files).

Test Criteria:
- [x] TC-1: iOS icon support includes all AuthScreen glyph names.
- [x] TC-2: iOS auth field states are covered by XCTest or snapshot stories.
- [x] TC-3: iOS provider buttons expose Apple and Google accessibility labels.
- [x] TC-4: iOS auth provider story IDs are registered in sandbox.
- [x] TC-5: Snapshot manifest checking passes after auth primitive stories are added.

Notes:
- Earlier review-cycle failures for provider-brand fidelity and source-string/test-theatre coverage were remediated before merge.
- Unrelated non-auth snapshot PNG churn and the out-of-scope `ai-specs/AUTH-S03-R02/ios-learnings.md` merge artifact were removed in guardrail cleanup commit `16191ac3`.
