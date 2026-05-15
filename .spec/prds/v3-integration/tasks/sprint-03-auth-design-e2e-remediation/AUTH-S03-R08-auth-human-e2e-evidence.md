# TASK: AUTH-S03-R08 - Real Human-Step E2E Evidence Gate for Auth Remediation

TASK_TYPE: FEATURE
STATUS: Completed
PRIORITY: P0
EFFORT: M
AGENT: implementer=swift-implementer + kotlin-implementer | reviewer=swift-reviewer + kotlin-reviewer
SPRINT: sprint-03-auth-design-e2e-remediation
ESTIMATE: 300 min

## Outcome

Replace weak render-only auth tests with an evidence gate that performs the remediation human steps and records PASS, FAIL, MANUAL, or BLOCKED honestly.

## Critical Constraints

- MUST execute real iOS device steps through WebDriverAgent for non-sandbox auth behavior.
- MUST include Android evidence as instrumentation, physical-device manual witness, or BLOCKED with exact instructions.
- MUST compare sandbox AuthScreen screenshots against the design source before marking visual steps PASS.
- NEVER mark OAuth, Convex, Clerk dashboard, or Android-only steps PASS from an iOS render/snapshot test alone.
- STRICTLY record artifacts under stable sprint-specific paths so reviewers can audit the run.

## Specification

Objective: codify every remediation sprint human test step into machine-readable evidence with screenshots/source dumps, snapshot references, command output paths, and explicit manual witness fields where automation is not available.

Success state: one command produces a JSON evidence report covering visual parity, iOS auth, Android auth, Convex current-user binding, restore, sign-out, and unauthenticated redirect.

## Acceptance Criteria

AC-1: Evidence schema covers every remediation human step
GIVEN SPRINT.md declares eight remediation human test steps
WHEN the evidence command runs
THEN the JSON report contains step IDs `AUTH-R.1` through `AUTH-R.8` with status, platform, evidence paths, blocker, and reviewer notes.
VERIFY: `rg "AUTH-R.1|AUTH-R.8|PASS|BLOCKED|MANUAL" ios/E2E android/app/src/androidTest .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation`

AC-2: iOS WDA performs auth steps
GIVEN WDA is available on a real iOS device
WHEN the iOS evidence flow runs
THEN it launches the app, opens AuthScreen, attempts provider/email sign-in, asserts IdleScreen greeting, cold-start restore, sign-out, and unauthenticated redirect using accessibility identifiers.
VERIFY: `cd /Users/justinrich/Projects/LaneShadow && LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth-remediation.js`

AC-3: Android evidence is explicit and honest
GIVEN Android has no project-approved physical-device harness yet
WHEN Android auth evidence is recorded
THEN each Android step is PASS only from instrumentation/device evidence and otherwise MANUAL or BLOCKED with exact command and witness instructions.
VERIFY: `rg "Android|MANUAL|BLOCKED|connectedDebugAndroidTest|physical device" ios/E2E android/app/src/androidTest .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation`

AC-4: Visual parity evidence references snapshots and design source
GIVEN AuthScreen fidelity was the reported failure
WHEN visual steps are evaluated
THEN the report links native AuthScreen screenshots, canonical story IDs, and `.spec/design/system/views/auth/auth-screen.html`.
VERIFY: `pnpm snapshots:check && rg "auth-screen.html|templates.auth-screen.email-entry|templates.auth-screen.dark" ios/E2E android/app/src/androidTest .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation`

AC-5: Convex and Clerk integration evidence is not faked
GIVEN current-user binding and token revocation require external systems
WHEN those steps cannot be observed directly by automation
THEN the report records the exact Convex command, Clerk dashboard action, account fixture, and expected output required for manual verification.
VERIFY: `rg "db.users.getCurrentUser|Clerk|UNAUTHENTICATED|pnpm server:codegen|convex" ios/E2E android/app/src/androidTest .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation`

## Test Criteria

| ID | Boolean Statement | Maps To AC | Verify |
|---|---|---|---|
| TC-1 | The evidence report schema contains AUTH-R.1 through AUTH-R.8. | AC-1 | `rg "AUTH-R.1|AUTH-R.8" ios/E2E android/app/src/androidTest .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation` |
| TC-2 | The iOS WDA script uses accessibility identifiers for AuthScreen, IdleScreen, Settings, and sign-out. | AC-2 | `rg "auth.signIn.root|idle.greeting|settings.signOut|auth.signOut.confirm" ios/E2E ios/LaneShadow ios/LaneShadowTests` |
| TC-3 | Android evidence cannot mark unavailable physical-device steps PASS without artifact paths. | AC-3 | `rg "MANUAL|BLOCKED|artifact" android/app/src/androidTest ios/E2E .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation` |
| TC-4 | Visual parity evidence links AuthScreen design and template story IDs. | AC-4 | `rg "auth-screen.html|templates.auth-screen" ios/E2E android/app/src/androidTest .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation` |
| TC-5 | External Clerk and Convex steps list exact manual verification commands/actions. | AC-5 | `rg "Clerk dashboard|pnpm --dir server|db.users.getCurrentUser|UNAUTHENTICATED" ios/E2E android/app/src/androidTest .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation` |

## Reading List

- `docs/REAL_DEVICE_E2E.md`
- `.spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/SPRINT.md`
- `.spec/prds/v3-integration/tasks/sprint-03-auth-convex-foundation/AUTH-S03-T11-real-device-wda-e2e.md`
- `.spec/design/system/views/auth/auth-screen.html`
- `RULES.md` Real Device E2E Testing

## Guardrails

write_allowed:
- `ios/E2E/**` (ADD/MODIFY auth remediation scripts, results, diagnostics, screenshots)
- `ios/LaneShadowTests/**` (ADD/MODIFY artifact schema tests)
- `android/app/src/androidTest/**` (ADD/MODIFY Android evidence tests)
- `docs/REAL_DEVICE_E2E.md` (MODIFY only if commands change)
- `.spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/**` (ADD evidence summary)

write_prohibited:
- `ios/LaneShadow/Features/Auth/**` - R04/R06 own app implementation except accessibility identifiers required by WDA.
- `android/app/src/main/**` - R05/R07 own app implementation except test-only identifiers required by evidence.
- `server/convex/**` - evidence only; backend changes require a separate Convex task.

## Design

references:
- `.spec/design/system/views/auth/auth-screen.html`
- `.spec/design/system/views/auth/README.md`

pattern: WDA result artifacts with PASS/FAIL/BLOCKED/MANUAL semantics and per-step screenshots/source dumps.
pattern_source: `docs/REAL_DEVICE_E2E.md`
anti_pattern: XCTest/Compose tests that instantiate the view and call that human testing.

## Verification Gates

- `cd /Users/justinrich/Projects/LaneShadow && LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth-remediation.js`
- `cd android && ./gradlew :app:connectedDebugAndroidTest` when Android emulator/device evidence is available.
- `pnpm snapshots:check`
- `pnpm snapshots:parity-coverage`

## Completion Evidence

Reviewed implementation commit: `c1b00ca9efee080bae90b0559f2d29aef38060ce`
Merged to main: `c6de42ea230a4cb5eff8969b4e5fd86dd7492044`

Artifacts:
- Machine report: `ios/E2E/results/sprint-03-auth-remediation.json`
- Evidence summary: `.spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R08-evidence-summary.md`
- Diagnostics: `ios/E2E/diagnostics/sprint-03-auth-remediation/`

Headless evidence report result:
- `AUTH-R.1`: `PASS`
- `AUTH-R.2`, `AUTH-R.7`: `MANUAL`
- `AUTH-R.3`, `AUTH-R.4`, `AUTH-R.5`, `AUTH-R.6`, `AUTH-R.8`: `BLOCKED`
- Status counts: `PASS: 1`, `MANUAL: 2`, `BLOCKED: 5`

Review notes:
- AC-1 satisfied: the report contains `AUTH-R.1` through `AUTH-R.8` with status, platform, evidence paths, blockers, reviewer notes, commands, fixture data, and expected outputs.
- AC-2 satisfied as an evidence gate: the iOS WDA script launches through WebDriverAgent when available and targets auth, IdleScreen restore, sign-out, and unauthenticated redirect identifiers. The actual run remained `BLOCKED` because WDA/device access returned `fetch failed`.
- AC-3 satisfied: Android evidence is recorded as `MANUAL` with `connectedDebugAndroidTest` and physical-device witness instructions; no Android-only step is marked `PASS` without artifacts.
- AC-4 satisfied for artifact linkage: the report links snapshot PNG baselines, canonical AuthScreen story IDs, and `.spec/design/system/views/auth/auth-screen.html`. Visual judgment remains `MANUAL` by design.
- AC-5 satisfied: Clerk and Convex steps list dashboard actions, fixture expectations, `db.users.getCurrentUser`, and expected `UNAUTHENTICATED` evidence instead of faking external-system proof.

Verification run:
- `LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth-remediation.js` exited `0` and wrote the evidence report with honest `PASS`/`MANUAL`/`BLOCKED` statuses.
- `pnpm snapshots:check` passed with iOS `492`, Android `414`, total `906`.
- Required `rg` checks for AC/TC coverage passed.
- `pnpm snapshots:parity-coverage` failed existing repository-wide thresholds: atoms `56.6% < 95%`, molecules `22.2% < 95%`, organisms `86.0% < 90%`. This failure is not introduced by R08 and remains documented as residual parity debt.

## Dependencies

depends_on: [AUTH-S03-R02, AUTH-S03-R03, AUTH-S03-R04, AUTH-S03-R05, AUTH-S03-R06, AUTH-S03-R07]
blocks: [Sprint 04]

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"GIVEN SPRINT.md declares eight remediation human test steps WHEN evidence command runs THEN JSON report contains AUTH-R.1 through AUTH-R.8 with status, platform, evidence paths, blocker, and reviewer notes.","verify":"rg \"AUTH-R.1|AUTH-R.8|PASS|BLOCKED|MANUAL\" ios/E2E android/app/src/androidTest .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation"},
{"id":"AC-2","type":"acceptance_criterion","description":"GIVEN WDA is available WHEN iOS evidence flow runs THEN it performs auth, IdleScreen greeting, restore, sign-out, and unauthenticated redirect checks using identifiers.","verify":"cd /Users/justinrich/Projects/LaneShadow && LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth-remediation.js"},
{"id":"AC-3","type":"acceptance_criterion","description":"GIVEN Android lacks an approved physical harness WHEN Android evidence is recorded THEN steps are PASS only from real evidence and otherwise MANUAL/BLOCKED with instructions.","verify":"rg \"Android|MANUAL|BLOCKED|connectedDebugAndroidTest|physical device\" ios/E2E android/app/src/androidTest .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation"},
{"id":"AC-4","type":"acceptance_criterion","description":"GIVEN visual fidelity failed WHEN visual steps are evaluated THEN the report links screenshots, story IDs, and auth-screen.html.","verify":"pnpm snapshots:check && rg \"auth-screen.html|templates.auth-screen.email-entry|templates.auth-screen.dark\" ios/E2E android/app/src/androidTest .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation"},
{"id":"AC-5","type":"acceptance_criterion","description":"GIVEN external systems cannot always be automated WHEN unobservable steps occur THEN exact Convex commands, Clerk dashboard actions, fixtures, and expected outputs are recorded.","verify":"rg \"db.users.getCurrentUser|Clerk|UNAUTHENTICATED|pnpm server:codegen|convex\" ios/E2E android/app/src/androidTest .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation"},
{"id":"TC-1","type":"test_criterion","description":"The evidence report schema contains AUTH-R.1 through AUTH-R.8.","maps_to_ac":"AC-1","verify":"rg \"AUTH-R.1|AUTH-R.8\" ios/E2E android/app/src/androidTest .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation"},
{"id":"TC-2","type":"test_criterion","description":"The iOS WDA script uses accessibility identifiers for AuthScreen, IdleScreen, Settings, and sign-out.","maps_to_ac":"AC-2","verify":"rg \"auth.signIn.root|idle.greeting|settings.signOut|auth.signOut.confirm\" ios/E2E ios/LaneShadow ios/LaneShadowTests"},
{"id":"TC-3","type":"test_criterion","description":"Android evidence cannot mark unavailable physical-device steps PASS without artifact paths.","maps_to_ac":"AC-3","verify":"rg \"MANUAL|BLOCKED|artifact\" android/app/src/androidTest ios/E2E .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation"},
{"id":"TC-4","type":"test_criterion","description":"Visual parity evidence links AuthScreen design and template story IDs.","maps_to_ac":"AC-4","verify":"rg \"auth-screen.html|templates.auth-screen\" ios/E2E android/app/src/androidTest .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation"},
{"id":"TC-5","type":"test_criterion","description":"External Clerk and Convex steps list exact manual verification commands/actions.","maps_to_ac":"AC-5","verify":"rg \"Clerk dashboard|pnpm --dir server|db.users.getCurrentUser|UNAUTHENTICATED\" ios/E2E android/app/src/androidTest .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation"}
]}
-->
