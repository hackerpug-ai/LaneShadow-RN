# Real Device E2E Testing

LaneShadow human gates for non-sandbox code require real-device E2E evidence. Use simulator/emulator checks for fast feedback and snapshot fidelity, but live app flows such as auth, Convex, Mapbox, persistence, location, and external-service integration need a physical-device path.

## iOS WDA Pattern

iOS real-device automation uses WebDriverAgent (WDA) directly over HTTP. Do not add an Appium session layer unless a task explicitly requires it.

```text
Terminal -> go-ios `ios runwda` -> WDA on iPhone -> HTTP API on :8100
         -> go-ios `ios forward` -> localhost:8100
         -> `node ios/E2E/<flow>.js` -> WDA HTTP API -> LaneShadow app
```

The WDA script should create and delete its own WDA session, launch the app with `-UITesting`, and write a result artifact with one entry per human test step.

## Prerequisites

| Tool | Install | Use |
|---|---|---|
| `go-ios` | `npm install -g go-ios` | Runs WDA and forwards device port 8100 |
| WebDriverAgent | follow the Hitch setup in `../hitch/scripts/ios/setup-wda.sh` | Builds and signs WDA for the connected iPhone |
| LaneShadow dev build | `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'generic/platform=iOS' build` | Installs a signed app build on the device |

## Running A Flow

Start WDA and port forwarding:

```bash
ios runwda --udid <UDID> &
ios forward 8100 8100 --udid <UDID> &
curl -s http://127.0.0.1:8100/status
```

Run the LaneShadow flow:

```bash
LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth.js
```

Run the Sprint 03 auth remediation evidence gate:

```bash
LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth-remediation.js
```

Clean up device processes:

```bash
pkill -f "ios runwda"
pkill -f "ios forward"
```

`AUTH-S03-T11` owns creating the first LaneShadow WDA harness and any helper scripts under `scripts/ios/`.

## Evidence Contract

Each non-sandbox human gate must produce:

- `ios/E2E/results/<flow>.json` with one entry per roadmap or sprint human test step.
- Step status limited to `PASS`, `FAIL`, `BLOCKED`, or `MANUAL`.
- Screenshot and WDA source dump paths for failed or blocked app-observable steps.
- Dependency blocking, so downstream checks become `BLOCKED` after required prerequisites fail.
- Exact manual witness instructions for Android-only, dashboard-only, or external-service steps that iOS WDA cannot prove.

Do not mark Android-only, Convex-dashboard, Clerk-dashboard, or other external observations PASS from iOS WDA alone. Record them as MANUAL or BLOCKED until a matching device harness or deterministic machine artifact exists.

## Useful WDA Calls

```text
GET    /status
POST   /session
POST   /session/{id}/element
POST   /session/{id}/element/{eid}/click
GET    /session/{id}/screenshot
GET    /session/{id}/source
DELETE /session/{id}
```

Prefer accessibility identifiers for app assertions. Labels and coordinates are acceptable only for exploratory diagnostics, not PASS gating.
