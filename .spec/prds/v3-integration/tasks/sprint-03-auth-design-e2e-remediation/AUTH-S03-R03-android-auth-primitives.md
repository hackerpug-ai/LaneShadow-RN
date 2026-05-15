# TASK: AUTH-S03-R03 - Android Auth Atoms and Social-Button Molecule Parity

TASK_TYPE: FEATURE
STATUS: Completed
PRIORITY: P0
EFFORT: M
AGENT: implementer=kotlin-implementer | reviewer=kotlin-reviewer
SPRINT: sprint-03-auth-design-e2e-remediation
ESTIMATE: 240 min

## Outcome

Bring Android auth primitives up to the same AuthScreen component contract as iOS.

## Critical Constraints

- MUST mirror iOS story IDs exactly for shared auth components.
- MUST use Compose theme tokens and existing LaneShadow atoms instead of local Material defaults.
- MUST keep Google brand SVG colors isolated to the provider glyph only.
- NEVER implement a platform-only auth provider button without a parity exemption.
- STRICTLY keep full AuthScreen layout work in R05.

## Specification

Objective: Android exposes auth-ready icon, divider, spinner, text-field/form-field, and social provider button behavior with sandbox stories and snapshot coverage.

Success state: Android primitives render the exact states needed by AuthScreen and pass compile/test/snapshot parity gates.

## Acceptance Criteria

AC-1: Android icon catalog covers AuthScreen glyphs
GIVEN AuthScreen needs compass, chevron-left, mail, lock, eye, sparkle, and check glyphs
WHEN Android sandbox stories render auth primitives
THEN each glyph is available through `LSIcon` or the established Compose icon adapter.
VERIFY: `rg "Compass|Mail|Lock|Eye|Sparkle|Check|Chevron" android/app/src/main android/app/src/debug android/app/src/test`

AC-2: Android form fields support auth states
GIVEN email and password fields need labels, leading icons, trailing eye, helper text, error, disabled, focused, and secure-entry states
WHEN `LSFormField` and `LSTextField` render auth stories
THEN each state is visible without feature-local TextField primitives.
VERIFY: `cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*' --tests '*TextField*'`

AC-3: Android social provider button matches design molecule
GIVEN `.spec/design/system/molecules/social-button/README.md`
WHEN Apple and Google auth buttons render in Android
THEN Apple uses the high-contrast recipe, Google uses card surface with four-color mark, and both expose content descriptions.
VERIFY: `rg "LSAuthProviderButton|Continue with Apple|Continue with Google|contentDescription" android/app/src/main android/app/src/test`

AC-4: Android sandbox story coverage exists
GIVEN component parity requires shared story IDs
WHEN snapshot stories are registered
THEN Android includes `molecules.auth-provider-button.apple`, `molecules.auth-provider-button.google`, and auth form-field variants.
VERIFY: `rg "molecules.auth-provider-button.apple|molecules.auth-provider-button.google|molecules.formfield.auth" android/app/src/debug android/app/src/androidTest`

AC-5: Android snapshots and parity checks include auth primitives
GIVEN auth primitives are user-facing components
WHEN snapshot checks run
THEN auth primitive PNG baselines are generated for light and dark themes and `pnpm snapshots:check` has no auth gaps.
VERIFY: `pnpm snapshots:check`

## Test Criteria

| ID | Boolean Statement | Maps To AC | Verify |
|---|---|---|---|
| TC-1 | Android icon support includes all AuthScreen glyph names. | AC-1 | `rg "Compass|Mail|Lock|Eye|Sparkle|Check" android/app/src/main android/app/src/debug` |
| TC-2 | Android auth field states are covered by tests or snapshot stories. | AC-2 | `cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*' --tests '*TextField*'` |
| TC-3 | Android provider buttons expose Apple and Google content descriptions. | AC-3 | `rg "Continue with Apple|Continue with Google" android/app/src/main android/app/src/test` |
| TC-4 | Android auth provider story IDs are registered in sandbox. | AC-4 | `rg "molecules.auth-provider-button" android/app/src/debug android/app/src/androidTest` |
| TC-5 | Snapshot manifest checking passes after auth primitive stories are added. | AC-5 | `pnpm snapshots:check` |

## Reading List

- `.spec/design/system/molecules/social-button/README.md`
- `.spec/design/system/views/auth/README.md`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSTextField.kt`
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSFormField.kt`
- `android/app/src/main/java/com/laneshadow/ui/components/LSAuthProviderButton.kt`

## Guardrails

write_allowed:
- `android/app/src/main/java/com/laneshadow/ui/atoms/**` (MODIFY auth-support only)
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSFormField.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/components/LSAuthProviderButton.kt` (MODIFY)
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/**` (ADD/MODIFY auth primitive stories)
- `android/app/src/test/**` and `android/app/src/androidTest/**` (ADD/MODIFY focused tests/snapshots)

write_prohibited:
- `android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt` - R05 owns screen layout.
- `ios/**` - R02 owns iOS primitives.
- `.spec/design/system/**` - design source is not implementation scope.

## Design

references:
- `.spec/design/system/molecules/social-button/README.md`
- `.spec/design/system/views/auth/auth-screen.html`

pattern: existing Android atom/molecule sandbox stories with canonical IDs.
pattern_source: `android/app/src/debug/java/com/laneshadow/sandbox/stories`
anti_pattern: Compose Material defaults that bypass LaneShadow tokens.

## Verification Gates

- `cd android && ./gradlew :app:compileDebugKotlin`
- `cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*' --tests '*TextField*'`
- `pnpm snapshots:check`

## Dependencies

depends_on: [AUTH-S03-R01]
blocks: [AUTH-S03-R05, AUTH-S03-R08]

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"GIVEN AuthScreen needs auth glyphs WHEN Android stories render auth primitives THEN each glyph is available through LSIcon or the established Compose icon adapter.","verify":"rg \"Compass|Mail|Lock|Eye|Sparkle|Check|Chevron\" android/app/src/main android/app/src/debug android/app/src/test"},
{"id":"AC-2","type":"acceptance_criterion","description":"GIVEN auth fields need labels, icons, helper, error, disabled, focused, and secure-entry states WHEN stories render THEN each state is visible without feature-local primitives.","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*' --tests '*TextField*'"},
{"id":"AC-3","type":"acceptance_criterion","description":"GIVEN the social-button design WHEN Apple and Google buttons render THEN they match provider recipes and content descriptions.","verify":"rg \"LSAuthProviderButton|Continue with Apple|Continue with Google|contentDescription\" android/app/src/main android/app/src/test"},
{"id":"AC-4","type":"acceptance_criterion","description":"GIVEN shared story IDs WHEN stories are registered THEN Android includes auth provider and auth form-field variants.","verify":"rg \"molecules.auth-provider-button.apple|molecules.auth-provider-button.google|molecules.formfield.auth\" android/app/src/debug android/app/src/androidTest"},
{"id":"AC-5","type":"acceptance_criterion","description":"GIVEN auth primitives are user-facing WHEN snapshot checks run THEN light and dark auth primitive baselines have no manifest gaps.","verify":"pnpm snapshots:check"},
{"id":"TC-1","type":"test_criterion","description":"Android icon support includes all AuthScreen glyph names.","maps_to_ac":"AC-1","verify":"rg \"Compass|Mail|Lock|Eye|Sparkle|Check\" android/app/src/main android/app/src/debug"},
{"id":"TC-2","type":"test_criterion","description":"Android auth field states are covered by tests or snapshot stories.","maps_to_ac":"AC-2","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*' --tests '*TextField*'"},
{"id":"TC-3","type":"test_criterion","description":"Android provider buttons expose Apple and Google content descriptions.","maps_to_ac":"AC-3","verify":"rg \"Continue with Apple|Continue with Google\" android/app/src/main android/app/src/test"},
{"id":"TC-4","type":"test_criterion","description":"Android auth provider story IDs are registered in sandbox.","maps_to_ac":"AC-4","verify":"rg \"molecules.auth-provider-button\" android/app/src/debug android/app/src/androidTest"},
{"id":"TC-5","type":"test_criterion","description":"Snapshot manifest checking passes after auth primitive stories are added.","maps_to_ac":"AC-5","verify":"pnpm snapshots:check"}
]}
-->

## Review (kotlin-reviewer) — 2026-04-29

- [x] AC-1: Android icon catalog covers AuthScreen glyphs. Cycle 2 fixed `"eye"`/`"visibility"` to map to `Glyphs.Filled.Visibility` instead of `Info` (evidence: `android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt`, `android/app/src/main/java/com/laneshadow/ui/atoms/Glyphs.kt`; verify: `rg "Compass|Mail|Lock|Eye|Sparkle|Check|Chevron" ...`).
- [x] AC-2: Android form fields support auth states (evidence: `android/app/src/main/java/com/laneshadow/ui/molecules/LSFormField.kt`; verify: `cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*' --tests '*TextField*'` passed).
- [x] AC-3: Android social provider button matches design molecule with runtime content-description/click behavior coverage (evidence: `android/app/src/main/java/com/laneshadow/ui/components/LSAuthProviderButton.kt`, `android/app/src/test/java/com/laneshadow/ui/components/LSAuthProviderButtonTest.kt`).
- [x] AC-4: Android sandbox story coverage exists with canonical IDs (evidence: `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSAuthProviderButtonStory.kt`, `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSFormFieldStory.kt`).
- [x] AC-5: Android snapshots and parity checks include auth primitives (evidence: auth PNG baselines, `tokens/sandbox/snapshots.parity.json`; verify: `pnpm snapshots:check` passed).

- [x] TC-1 maps to AC-1: Auth glyph names and concrete mappings verified.
- [x] TC-2 maps to AC-2: Auth field states covered by stories/tests.
- [x] TC-3 maps to AC-3: Provider buttons expose Apple/Google content descriptions with behavioral tests.
- [x] TC-4 maps to AC-4: Provider story IDs registered in sandbox.
- [x] TC-5 maps to AC-5: Snapshot manifest checking passed.

Implementation commits: `6846d0c49c09f94e7a4a6a8b1175bfae3a05d1a1`, `edd16d5fc9c92021064bc596d826bc399c8cba6c`; merged via `main`.
