# Real Device E2E Testing

LaneShadow human gates for non-sandbox code require real-device E2E evidence. Simulator and emulator checks are useful for fast feedback, but live app flows such as auth, Convex, Mapbox, persistence, location, and external-service integration need a physical-device path.

## E2E Journey Architecture (2026-05-16)

The e2e suite is organized around **user journeys** — ordered XCUITest classes whose method names sort in step order, so `step01_*` → `step02_*` → … run in declaration order against one persistent app session.

Per `.spec/prds/v3-integration/VIEW-MAP.md` doctrine, LaneShadow has only two sibling routes (Auth flow and MapApp). Inside MapApp, all variants (idle / planning / routeResults / routeDetails / error) are **states** of one persistent map host, not navigated screens. Tests assert this doctrine by capturing `LSMap`'s `accessibilityIdentifier` at journey start and asserting it stays stable across every subsequent step — any re-mount fails the gate.

### Test inventory on main (iOS)

| Test class | Coverage | Runtime |
|---|---|---|
| `E2EBypassAuthTests` | Phase 0 — bypass flag lands at MapApp idle | ~5s |
| `ScaffoldSmokeTests` (×3) | Launch-arg `MapAppState` injection works for idle / planning / routeResults | ~10s |
| `JourneyAuthEntry/step01` | Auth screen renders with sign-in entry + bypass button | ~9s |
| `JourneyMapAppCoreLoop` step01+03 | Bypass → idle state → map controls; persistent-host identity stable | ~11s |

Total: 6 passing iOS tests covering the auth-entry surface, the bypass shortcut, the MapApp idle landing, the persistent-host doctrine, and the state-injection helpers J2–J4 rely on.

### Deferred / removed (honest scope)

Per the "remove don't skip" protocol — incomplete tests are removed from the suite rather than marked `XCTSkip`, so CI never reports a deceptive pass.

| Deferred step | Reason | Re-enable when |
|---|---|---|
| JourneyMapAppCoreLoop step02 (greeting/chips assertion) | Convex JWT bridge rejects bypass-issued tokens; LSTopBar children gate on user data | JWT bridge fixed; see open issue tracked in plan |
| JourneyMapAppCoreLoop step04 (chip → chat input) | Depends on step02 chips loading | Same as above |
| JourneyMapAppCoreLoop step05–12 (planning / route results / route details / cancel) | Sprint 09 (`MapAppState.routeResults`) + Sprint 10 (RouteDetails sub-state) not fully wired | Each sprint lands |
| JourneyAuthEntry step02–04 (Mailosaur sign-up) | Mailosaur polling integration needs independent verification against working `AuthRegistrationE2ETests` | Follow-up task #1379 |
| JourneyAuthEntry step05 (session restore) | Depends on full JourneyAuthEntry running | After sign-up reinstated |
| JourneyMapAppModals (menu drawer) | `lstopbar-hamburger` accessibilityIdentifier not discoverable in XCUITest under bypass-auth | LSTopBar visibility/discoverability investigated |
| JourneyMapAppErrorRecovery | `MapAppState.error` is iceboxed | Error state ships |

The legacy `AuthRegistrationE2ETests` and `AuthSignInE2ETests` remain in place — they still provide the sign-up + session-restore coverage that JourneyAuthEntry doesn't yet cover.

## iOS Native XCUITest Pattern

iOS real-device automation uses native XCUITest through `xcodebuild test` against a signed build on a physical iPhone. Do not add a separate automation session layer for the standard iOS auth gate.

```text
Terminal -> xcodebuild test -> LaneShadowUITests on iPhone
         -> LaneShadow app launched with -UITesting
         -> .xcresult screenshots + xcodebuild log under ios/build/
```

The canonical iOS PASS path for the human testing gate is `JourneyAuthEntry/step01_authScreenRendersWithEntryPoints` (auth surface verification) plus `E2EBypassAuthTests/testE2EBypassAuthReachesMapApp` (bypass-to-MapApp landing). The bypass path uses `CLERK_TEST_EMAIL` and `CLERK_TEST_PASSWORD` from `.env.local` for silent Clerk sign-in; `LANESHADOW_AUTH_EMAIL` and `LANESHADOW_AUTH_PASSWORD` remain supported as local fallback names for the test bundle.

### Launch argument schema

| Argument | Purpose |
|---|---|
| `-UITesting` | Set by all UI tests (existing) |
| `-LaneShadowUITestResetAuth` | Sign out cleanly before the test runs |
| `-LaneShadowE2EBypassAuth` | NEW — performs silent Clerk sign-in using test credentials; lands at MapApp idle without traversing auth UI. Used by all post-auth journeys to skip Clerk's popup drawer (which is Clerk's responsibility, not ours to test). |
| `-MapAppState=<state>` | NEW (DEBUG only) — inject initial MapAppState. Values: `idle`, `planning`, `routeResults`. Paired with `-SessionId=<id>` and `-RoutePlanId=<id>` for variants that carry IDs. |
| `-LaneShadowUITestBypassAuth` | LEGACY — sandbox path that does NOT produce a real Clerk session; kept working for component snapshot tests but NOT a valid e2e bypass. |
| `-DirectIdleScreenUITest` | LEGACY — direct-render of `IdleScreenContainer` with mock data; for snapshot variants only. |

## Prerequisites

| Requirement | Setup |
|---|---|
| Xcode command line tools | `xcodebuild -version` |
| Physical iPhone | Connected, unlocked, trusted by this Mac, and visible in `xcrun xctrace list devices` |
| Signing team | `IOS_DEVELOPMENT_TEAM=<Apple Team ID>` in `.env.local` |
| Clerk test account | `CLERK_TEST_EMAIL=<email>` and `CLERK_TEST_PASSWORD=<password>` in `.env.local` |

If the build reports `No Account for Team`, open Xcode Settings > Accounts and add the Apple ID that owns that team, or replace `IOS_DEVELOPMENT_TEAM` with a team ID that is already signed into Xcode and can provision `com.laneshadow.app`.

## Running The iOS Gate

```bash
make e2e_vars
make ios_e2e_device_headed
```

`ios_e2e_device_headed` auto-detects the first connected iPhone before the simulator section of `xcrun xctrace list devices`. Pass `IOS_UDID=<UDID>` when you need to choose a specific device.

Temporary simulator shortcut: `make ios_e2e_headed` currently routes to `make ios_e2e_simulator` for headed simulator E2E runs.

The Makefile target runs (legacy single-test invocation):

```bash
cd ios && xcodebuild test \
  -project LaneShadow.xcodeproj \
  -scheme LaneShadow \
  -destination "id=<IOS_UDID>" \
  -only-testing:LaneShadowUITests/AuthSignInE2ETests/testEmailPasswordSignInAndRestoresSession \
  -resultBundlePath build/xcresults/ios-e2e-headed.xcresult \
  DEVELOPMENT_TEAM=<IOS_DEVELOPMENT_TEAM> \
  CODE_SIGN_STYLE=Automatic \
  -allowProvisioningUpdates
```

The journey suite is currently runnable as:

```bash
xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow \
  -destination "id=<IOS_UDID>" \
  -only-testing:LaneShadowUITests/JourneyAuthEntry \
  -only-testing:LaneShadowUITests/JourneyMapAppCoreLoop \
  -only-testing:LaneShadowUITests/E2EBypassAuthTests \
  -only-testing:LaneShadowUITests/ScaffoldSmokeTests
```

The legacy `AuthSignInE2ETests` and `AuthRegistrationE2ETests` still run and provide the sign-up + session-restore coverage the journey suite hasn't yet folded in.

## Evidence Contract

The iOS E2E evidence is:

- `ios/build/xcresults/ios-e2e-headed.xcresult`
- `ios/build/logs/ios-e2e-headed-xcodebuild.log`
- XCUITest screenshots attached to the result bundle for auth screen, submitted state, authenticated state, and restored state

The app is launched with `-UITesting`. Clean auth setup is requested with `-LaneShadowUITestResetAuth`, a DEBUG-only launch argument that signs out through app state before showing the auth route.

## Android

`android_e2e_auth_headed` remains the headed Android entry point. It starts the first configured emulator when no Android device is connected, installs the debug app by default, launches LaneShadow, then runs the configured auth instrumentation classes. Set `ANDROID_SERIAL=<adb-serial>` to target a specific connected device or `ANDROID_E2E_INSTALL=0` to skip reinstalling.

### Current Android coverage status (2026-05-16)

Android Phase 0 **bypass infrastructure is shipped** but the corresponding automated test is **removed** per the "remove don't skip" protocol:

| Component | Status |
|---|---|
| `ClerkAuthRepository.e2eBypassWithCredentials()` | ✅ shipped — Clerk silent-auth path produces real JWT |
| `MainActivity` `EXTRA_E2E_BYPASS_AUTH` extra | ✅ wired |
| `LaneShadowApp` viewModelScope coroutine + exception handling | ✅ shipped |
| `IdleScreen.kt` testTag wrapper | ✅ shipped (band-aid; will dissolve when MAPAPP-UNIFY Cycle 4 deletes legacy IdleScreen.kt) |
| `E2EBypassAuthTest` automated test | ❌ removed — passed once (73s) then flaky on repeat emulator runs |

Bypass code path is **verified working** outside the test harness via:

```bash
adb shell am start -n com.laneshadow.app/.MainActivity \
  --ez EXTRA_E2E_BYPASS_AUTH true \
  --ez EXTRA_RESET_AUTH true
```

Activity displays in ~985ms, no FATAL, app stable post-launch.

Per RULES.md § Real Device E2E Testing: **Android-only observations remain MANUAL/BLOCKED** for the physical-device gate. Do not mark Android steps PASS from iOS evidence alone. A future sprint should establish a physical Android device harness or a stable emulator-tier alternative to wire `E2EBypassAuthTest` back in.

## Design Review Capture Pipeline

The design-review pipeline automates visual fidelity verification for iOS design-system views using a calibrated vision LLM. It replaces the brittle sandbox-snapshot parity infrastructure with a capture-eval-report loop driven by Claude Sonnet 4.6.

**Strategy:** See [Design Review Pipeline](https://laneshadow.dev/blog/design-review-pipeline) for the full architecture and logical clock protocol.

**Plan:** `~/.claude/plans/plan-a-design-review-logical-clock.md`

**Sprint:** `.spec/prds/v3-integration/tasks/sprint-05-design-review-pipeline/`

**Skill:** `~/.claude/skills/design-review/`

### Pipeline Commands

```bash
# Step 1: Render reference PNGs from design HTML
pnpm design:references

# Step 2: Export screenshots from .xcresult bundle
pnpm design:export

# Step 3: Run Claude vision LLM eval on captured screenshots
pnpm design:eval

# Step 4: Full pipeline (capture → export → eval → report)
pnpm design:review --screens auth-screen
```

### Pipeline Output

The pipeline generates:

- `.design-review/report.json` — Structured fix-oriented report with article §5 fields (screen, state, theme, component, severity, confidence, observed/expected, fix_hint, bounding_box, code_search_hint)
- `.design-review/report.html` — Side-by-side reference vs captured layout with severity-color-coded issue lists
- `.design-review/captures/` — Captured screenshots organized by screen/state/theme

### Smoke Test Validation

Sprint 05 validates the pipeline with a deliberate regression on iOS AuthScreen:

1. Inject spacing regression: replace one `var(--space-4)` token usage with hardcoded `12.0` padding
2. Run `pnpm design:review --screens auth-screen`
3. Verify report.json flags the spacing issue at severity >= med with a `fix_hint` mentioning `--space-4`
4. Revert the regression
5. Re-run pipeline and confirm zero med+ issues

See `scripts/design-review/__tests__/smoke-regression.test.ts` and `scripts/design-review/__tests__/smoke-clean.test.ts` for automated validation.

### Sample Report

A sanitized sample report is available at `.spec/design/calibration/sample-report.html` demonstrating the HTML output format with side-by-side comparison and severity-coded issue cards.

## Coverage Scope

The design-review pipeline is validated incrementally per sprint as real app code ships. Current coverage:

| Screen | Status | Sprint |
|--------|--------|--------|
| auth-screen | ✅ Validated | Sprint 05 |
| idle-screen | ⏳ Deferred | Sprint 06 |
| planning-screen | ⏳ Deferred | Sprint 07 |
| route-results-screen | ⏳ Deferred | Sprint 08 |
| route-details-screen | ⏳ Deferred | Sprint 09 |
| sessions-screen | ⏳ Deferred | Sprint 10 |

**Note:** Only `auth-screen` has functional app code and pipeline validation as of Sprint 05. All other screens will be covered incrementally as their corresponding app screens ship in Sprints 06–10.
