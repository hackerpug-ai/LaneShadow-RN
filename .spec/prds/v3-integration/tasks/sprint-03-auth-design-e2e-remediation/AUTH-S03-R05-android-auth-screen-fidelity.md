# TASK: AUTH-S03-R05 - Android AuthScreen View Fidelity and Sandbox Variants

TASK_TYPE: FEATURE
STATUS: Completed
PRIORITY: P0
EFFORT: L
AGENT: implementer=kotlin-implementer | reviewer=kotlin-reviewer
SPRINT: sprint-03-auth-design-e2e-remediation
ESTIMATE: 360 min

## Outcome

Replace the generic Android auth presentation with the designed email-first AuthScreen variants.

## Critical Constraints

- MUST match `.spec/design/system/views/auth/auth-screen.html`, not the current native SignInScreen.
- MUST implement one email-first branching AuthScreen rather than separate visually unrelated sign-in and sign-up screens.
- MUST preserve production auth navigation while adding sandbox-only variants.
- NEVER use Compose Material defaults where LaneShadow atoms or tokens exist.
- STRICTLY use R03 primitives for fields, social buttons, divider, spinner, icons, and card styling.

## Specification

Objective: Android AuthScreen renders the six designed variants and production unauthenticated routing uses the same composition.

Success state: Android screenshots show the paper contour background, scrim, back glass chip, brand mark, Newsreader headline equivalent, social provider stack, labeled divider, email/password/new-user branches, footer, error state, and loading state matching the HTML design.

## Acceptance Criteria

AC-1: Android AuthScreen uses the design anatomy
GIVEN an unauthenticated rider opens the app
WHEN AuthScreen renders
THEN the screen includes map-paper contour background, soft scrim, back glass chip, brand mark, headline, subhead, social provider stack, email divider, form fields, primary CTA, and footer legal links.
VERIFY: `rg "AuthScreen|Saddle|LaneShadow|Continue with Apple|OR CONTINUE WITH EMAIL|Terms|Privacy" android/app/src/main android/app/src/debug android/app/src/test`

AC-2: Android email-first branching states exist
GIVEN the rider enters an email
WHEN the view model resolves existing, new, invalid, and submitting states
THEN S01, S02, S03, V01, and V02 UI states render without navigating to a separate SignUpScreen shell.
VERIFY: `cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*'`

AC-3: Android dark AuthScreen variant exists
GIVEN the design has S04 dark
WHEN sandbox stories render
THEN `templates.auth-screen.dark` resolves all colors through tokens and keeps Apple/Google button contrast correct.
VERIFY: `rg "templates.auth-screen.dark|dark" android/app/src/debug android/app/src/androidTest android/app/src/test`

AC-4: Android AuthScreen sandbox stories cover all design variants
GIVEN the design declares S01, S02, S03, S04, V01, and V02
WHEN stories are registered
THEN Android has story IDs `templates.auth-screen.email-entry`, `templates.auth-screen.existing-user`, `templates.auth-screen.new-user`, `templates.auth-screen.invalid-email`, `templates.auth-screen.submitting`, and `templates.auth-screen.dark`.
VERIFY: `rg "templates.auth-screen.email-entry|templates.auth-screen.existing-user|templates.auth-screen.new-user|templates.auth-screen.invalid-email|templates.auth-screen.submitting|templates.auth-screen.dark" android/app/src/debug android/app/src/androidTest`

AC-5: Android visual evidence is screenshot-based
GIVEN render-only tests missed the visual mismatch
WHEN the AuthScreen task is complete
THEN snapshot baselines and a design-comparison note are captured for each variant.
VERIFY: `pnpm snapshots:check && rg "auth-screen.html|templates.auth-screen" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation android/app/src/androidTest android/app/src/debug`

## Test Criteria

| ID | Boolean Statement | Maps To AC | Verify |
|---|---|---|---|
| TC-1 | Android AuthScreen source contains the design anatomy labels and controls. | AC-1 | `rg "Saddle|Continue with Apple|OR CONTINUE WITH EMAIL" android/app/src/main android/app/src/debug` |
| TC-2 | Android tests cover existing-user, new-user, invalid-email, and submitting branches. | AC-2 | `cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*'` |
| TC-3 | Android sandbox registers the dark auth-screen variant. | AC-3 | `rg "templates.auth-screen.dark" android/app/src/debug android/app/src/androidTest` |
| TC-4 | Android sandbox registers all six AuthScreen design variants. | AC-4 | `rg "templates.auth-screen.email-entry|templates.auth-screen.submitting" android/app/src/debug android/app/src/androidTest` |
| TC-5 | Snapshot manifest checking passes after Android AuthScreen stories are captured. | AC-5 | `pnpm snapshots:check` |

## Reading List

- `.spec/design/system/views/auth/auth-screen.html`
- `.spec/design/system/views/auth/README.md`
- `android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt`
- `android/app/src/main/java/com/laneshadow/ui/auth/SignUpScreen.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/templates/IdleScreenStory.kt`

## Guardrails

write_allowed:
- `android/app/src/main/java/com/laneshadow/ui/auth/**` (MODIFY/CREATE AuthScreen and view model states)
- `android/app/src/main/java/com/laneshadow/navigation/**` (MODIFY routing into AuthScreen only)
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/templates/**` (ADD AuthScreen stories)
- `android/app/src/test/**` and `android/app/src/androidTest/**` (ADD/MODIFY AuthScreen behavior and snapshot tests)

write_prohibited:
- `ios/**` - R04 owns iOS view.
- `server/**` - R06/R07 own auth integration behavior.
- `.spec/design/system/**` - design source is not implementation scope.

## Design

references:
- `.spec/design/system/views/auth/auth-screen.html`
- `.spec/design/system/views/auth/README.md`

pattern: Android template story registration with canonical ID and light/dark snapshots.
pattern_source: `android/app/src/debug/java/com/laneshadow/sandbox/stories/templates`
anti_pattern: shipping a generic Compose sign-in form on a blank/card-heavy screen.

## Verification Gates

- `cd android && ./gradlew :app:compileDebugKotlin`
- `cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*'`
- `pnpm snapshots:check`

## Review (kotlin-reviewer contract) - 2026-04-30

Final reviewed commit: `4e9ee4dadabf9cf28af2a56350c8f90daf00a63d`
Merged to `main`: `bb8c03f21c9cae49f18be004d2334a5508f3651b`

Acceptance Criteria:
- [x] AC-1: Android AuthScreen uses the design anatomy. Evidence: AuthScreen defines Terms/Privacy URLs, URI handling, contour background, scrim, back chip, brand/header/form/footer, and clickable legal footer controls; production `Route.SignIn` renders AuthScreen with the back chip enabled.
- [x] AC-2: Android email-first branching states exist. Evidence: `AuthScreenViewModel` requires an injected resolver, trims email, handles existing/new/unavailable branches without email-string heuristics, and `SignInScreen`/`SignUpScreen` use route-specific resolvers.
- [x] AC-3: Android dark AuthScreen variant exists. Evidence: `templates.auth-screen.dark` is registered with `LaneShadowTheme(darkTheme = true)` and targeted by focused snapshot tests.
- [x] AC-4: Android AuthScreen sandbox stories cover all design variants. Evidence: all six canonical `templates.auth-screen.*` IDs are registered, included in focused snapshot tests, and tracked in the parity manifest.
- [x] AC-5: Android visual evidence is screenshot-based. Evidence: focused and AllStories PNG baselines exist for all six AuthScreen IDs in light and dark, snapshot evidence links to `auth-screen.html`, and `pnpm snapshots:check` passed.

Test Criteria:
- [x] TC-1: Android AuthScreen source contains the design anatomy labels and controls.
- [x] TC-2: Android tests cover existing-user, new-user, invalid-email, and submitting branches.
- [x] TC-3: Android sandbox registers the dark auth-screen variant.
- [x] TC-4: Android sandbox registers all six AuthScreen design variants.
- [x] TC-5: Snapshot manifest checking passes after Android AuthScreen stories are captured.

Notes:
- Earlier review-cycle failures for fake production branching, no-op legal links, missing production back chip, and missing screenshot baselines were remediated before approval.
- Review and remediation were run headless with CLI Gradle, `pnpm snapshots:check`, and `rg` verification.

## Dependencies

depends_on: [AUTH-S03-R01, AUTH-S03-R03]
blocks: [AUTH-S03-R07, AUTH-S03-R08]

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"GIVEN an unauthenticated rider opens the app WHEN AuthScreen renders THEN the screen includes the full design anatomy from the HTML source.","verify":"rg \"AuthScreen|Saddle|LaneShadow|Continue with Apple|OR CONTINUE WITH EMAIL|Terms|Privacy\" android/app/src/main android/app/src/debug android/app/src/test"},
{"id":"AC-2","type":"acceptance_criterion","description":"GIVEN the rider enters an email WHEN the view model resolves branch states THEN S01, S02, S03, V01, and V02 render without a separate SignUpScreen shell.","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*'"},
{"id":"AC-3","type":"acceptance_criterion","description":"GIVEN S04 dark exists WHEN sandbox stories render THEN templates.auth-screen.dark resolves colors through tokens.","verify":"rg \"templates.auth-screen.dark|dark\" android/app/src/debug android/app/src/androidTest android/app/src/test"},
{"id":"AC-4","type":"acceptance_criterion","description":"GIVEN six design variants WHEN stories are registered THEN Android has every templates.auth-screen variant ID.","verify":"rg \"templates.auth-screen.email-entry|templates.auth-screen.existing-user|templates.auth-screen.new-user|templates.auth-screen.invalid-email|templates.auth-screen.submitting|templates.auth-screen.dark\" android/app/src/debug android/app/src/androidTest"},
{"id":"AC-5","type":"acceptance_criterion","description":"GIVEN render-only tests missed visual mismatch WHEN complete THEN snapshot baselines and design-comparison notes exist for each variant.","verify":"pnpm snapshots:check && rg \"auth-screen.html|templates.auth-screen\" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation android/app/src/androidTest android/app/src/debug"},
{"id":"TC-1","type":"test_criterion","description":"Android AuthScreen source contains the design anatomy labels and controls.","maps_to_ac":"AC-1","verify":"rg \"Saddle|Continue with Apple|OR CONTINUE WITH EMAIL\" android/app/src/main android/app/src/debug"},
{"id":"TC-2","type":"test_criterion","description":"Android tests cover existing-user, new-user, invalid-email, and submitting branches.","maps_to_ac":"AC-2","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*'"},
{"id":"TC-3","type":"test_criterion","description":"Android sandbox registers the dark auth-screen variant.","maps_to_ac":"AC-3","verify":"rg \"templates.auth-screen.dark\" android/app/src/debug android/app/src/androidTest"},
{"id":"TC-4","type":"test_criterion","description":"Android sandbox registers all six AuthScreen design variants.","maps_to_ac":"AC-4","verify":"rg \"templates.auth-screen.email-entry|templates.auth-screen.submitting\" android/app/src/debug android/app/src/androidTest"},
{"id":"TC-5","type":"test_criterion","description":"Snapshot manifest checking passes after Android AuthScreen stories are captured.","maps_to_ac":"AC-5","verify":"pnpm snapshots:check"}
]}
-->
