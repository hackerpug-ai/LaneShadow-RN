# AUTH-S03-R08 Evidence Summary

## Command

```bash
cd /Users/justinrich/Projects/LaneShadow/.claude/worktrees/AUTH-S03-R08
LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth-remediation.js
```

## Report

- Machine-readable report: `ios/E2E/results/sprint-03-auth-remediation.json`
- Schema keys per step: `id`, `title`, `platform`, `status`, `evidencePaths`, `blocker`, `reviewerNotes`, `commands`, `fixture`, `expectedOutput`, `dependsOn`, `timestamp`
- Status values: `PASS`, `FAIL`, `BLOCKED`, `MANUAL`

## Coverage

The report covers `AUTH-R.1` through `AUTH-R.8` from `SPRINT.md`.

- `AUTH-R.1` links iOS and Android snapshot PNGs for `molecules.auth-provider-button.apple`, `molecules.auth-provider-button.google`, and all `templates.auth-screen.*` light/dark baselines.
- `AUTH-R.2` links `.spec/design/system/views/auth-screen/auth-screen.html` and writes a visual review checklist; it remains `MANUAL` until a reviewer compares the PNGs against the HTML design.
- `AUTH-R.3` through `AUTH-R.6` use iOS WDA with accessibility identifiers `auth.signIn.root`, `idle.greeting`, `settings.signOut`, and `auth.signOut.confirm`. If WDA or real-device auth is unavailable, the report records `BLOCKED` with setup commands and diagnostics paths.
- `AUTH-R.7` records Android as `MANUAL` unless `connectedDebugAndroidTest` or physical device artifact paths are produced. Do not mark Android `PASS` from iOS WDA evidence.
- `AUTH-R.8` lists Clerk dashboard revocation actions, Convex commands, `db.users.getCurrentUser`, and expected `UNAUTHENTICATED` redirect evidence.

## Manual Witness Requirements

Clerk/Convex external verification requires the reviewer to capture:

- Clerk dashboard user/session action for the fixture account.
- Convex command/log evidence from `pnpm --dir server convex dev --once` or `pnpm --dir server run convex:dev -- --once`.
- `db.users.getCurrentUser` output showing the fixture display name.
- `UNAUTHENTICATED` output after session/token revocation.

Android verification requires:

- `adb devices`
- `cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest`
- Physical device screenshot/video or connected test artifact paths before any Android step is marked `PASS`.
