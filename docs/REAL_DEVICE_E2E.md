# Real Device E2E Testing

LaneShadow human gates for non-sandbox code require real-device E2E evidence. Simulator and emulator checks are useful for fast feedback, but live app flows such as auth, Convex, Mapbox, persistence, location, and external-service integration need a physical-device path.

## iOS Native XCUITest Pattern

iOS real-device automation uses native XCUITest through `xcodebuild test` against a signed build on a physical iPhone. Do not add a separate automation session layer for the standard iOS auth gate.

```text
Terminal -> xcodebuild test -> LaneShadowUITests on iPhone
         -> LaneShadow app launched with -UITesting
         -> .xcresult screenshots + xcodebuild log under ios/build/
```

The automated iOS PASS path is email/password auth using `CLERK_TEST_EMAIL` and `CLERK_TEST_PASSWORD` from `.env.local`. `LANESHADOW_AUTH_EMAIL` and `LANESHADOW_AUTH_PASSWORD` remain supported as local fallback names for the test bundle.

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

The Makefile target runs:

```bash
cd ios && xcodebuild test \
  -project LaneShadow.xcodeproj \
  -scheme LaneShadow \
  -destination "id=<IOS_UDID>" \
  -only-testing:LaneShadowUITests/AuthEmailPasswordE2ETests/testEmailPasswordSignInAndRestoresSession \
  -resultBundlePath build/xcresults/ios-e2e-headed.xcresult \
  DEVELOPMENT_TEAM=<IOS_DEVELOPMENT_TEAM> \
  CODE_SIGN_STYLE=Automatic \
  -allowProvisioningUpdates
```

## Evidence Contract

The iOS E2E evidence is:

- `ios/build/xcresults/ios-e2e-headed.xcresult`
- `ios/build/logs/ios-e2e-headed-xcodebuild.log`
- XCUITest screenshots attached to the result bundle for auth screen, submitted state, authenticated state, and restored state

The app is launched with `-UITesting`. Clean auth setup is requested with `-LaneShadowUITestResetAuth`, a DEBUG-only launch argument that signs out through app state before showing the auth route.

## Android

`android_e2e_auth_headed` remains the headed Android entry point. It starts the first configured emulator when no Android device is connected, installs the debug app by default, launches LaneShadow, then runs the configured auth instrumentation classes. Set `ANDROID_SERIAL=<adb-serial>` to target a specific connected device or `ANDROID_E2E_INSTALL=0` to skip reinstalling.

Do not mark Android-only, Convex-dashboard, Clerk-dashboard, or other external observations PASS from iOS evidence alone. Record those steps as MANUAL or BLOCKED until a matching device artifact or deterministic machine artifact exists.
