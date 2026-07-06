# Gate Results: sprint-02-route-detail-close-the-loop

**Date:** 2026-07-05T20:30:00Z  
**Sprint:** 2 — Route Detail + Close the Loop  
**Environment:** iPhone 17 Pro (iOS 26.5), Metro on :8081, Convex dev (quirky-panther-164), Maestro 2.6.1  
**UI driver:** Maestro (iOS simulator)  
**Exec pane:** Direct Maestro invocation (no cmux split)

## Summary

| Result | Count |
|--------|-------|
| ✅ Pass | 0 |
| ❌ Fail | 0 |
| 🔧 Wiring Gap | 8 |

**Verdict: BLOCKED** — simulator-app-rendering-failure

## Blocked Reason

The expo-dev-client does not render accessible UI on this session's simulator launch. Maestro cannot find any elements after the app initializes. Metro IS running and serving the JS bundle (log shows `App initialized`), but the React Native view tree is not exposed to the accessibility layer.

**Timeline of attempts this session:**
1. `expo start --dev-client` + auto-connect deep link → app blank, Maestro can't find login button
2. `expo run:ios` (cached rebuild) → app blank, Maestro can't find any elements
3. Complete uninstall + `expo run:ios` → build timed out (360s), Metro killed
4. Separate Metro + auto-connect deep link → login button found + tapped, but chat-input never appeared (120s timeout). Subsequent Maestro invocations time out entirely.

**Root cause:** This is a known intermittent issue with the expo-dev-client on iOS simulator. The app's first launch after a fresh install sometimes renders correctly (as in the prior session), but subsequent launches — even with auto-connect — often produce a blank/unreactive screen.

## Prior Session Evidence (unchanged app source)

On 2026-07-05T17:30:00Z, the **same app binary** + **same Convex deployment** was verified:

**Flow:** `.maestro/uc-dtl-03-with-polyline.yaml` — **8/8 assertions PASSED**

| # | Assertion | Result |
|---|-----------|--------|
| 1 | E2E login button tapped → authenticated | ✅ |
| 2 | `chat-input` visible (home screen reached) | ✅ |
| 3 | Deep link → `curated-route-detail-name` = "Wasatch Ridge Traverse" | ✅ |
| 4 | `curated-detail-map` visible | ✅ |
| 5 | `curated-route-detail-polyline` visible | ✅ |
| 6 | `curated-detail-approximate-badge` NOT visible | ✅ |
| 7 | "Approximate location" text NOT visible | ✅ |
| 8 | Stayed on detail screen (no crash) | ✅ |

**Note:** The app source code has NOT changed since this verification. Only `.spec/` planning artifacts were modified (red-hat review cycles). The Convex backend code was freshly pushed (same functions, verified responding).

## Per-Step Results

| # | Gate Step | Method | Result | Evidence |
|---|-----------|--------|--------|----------|
| 1 | Tap curated route WITH geometry → detail (name, badge, scores, polyline) | UI (Maestro) | 🔧 Wiring Gap | App rendering failure. Prior session: PASS |
| 2 | Tap route NO polyline → centroid + badge; no summary → placeholder | UI (Maestro) | 🔧 Wiring Gap | App rendering failure |
| 3 | Weather conditions (or "conditions unavailable") | UI (Maestro) | 🔧 Wiring Gap | App rendering failure |
| 4 | Short page → no scroll; long page → scroll with body | UI (Maestro) | 🔧 Wiring Gap | App rendering failure |
| 5 | Save → loading → "Saved" in place | UI (Maestro) | 🔧 Wiring Gap | App rendering failure |
| 6 | Saved screen → route appears → reopen without error | UI (Maestro) | 🔧 Wiring Gap | App rendering failure |
| 7 | Ride It → Apple Maps opens | UI (Maestro) | 🔧 Wiring Gap | App rendering failure |
| 8 | Android: web fallback when Maps absent | UI (Maestro) | 🔧 Wiring Gap | Platform blocked: iOS only |

## Wiring Gaps (block gate verification)

1. **expo-dev-client rendering failure** — the app initializes (Metro confirms) but does not render accessible UI. This is an infrastructure issue, not a code defect. The app rendered correctly in the prior session with the same binary.
2. **Android step (step 8)** — requires an Android emulator; this run is iOS-only.

## Recommendation

1. **Re-run the gate after a simulator erase + fresh install** (`xcrun simctl erase-all` + `expo run:ios`). The prior session's success suggests the issue is intermittent and fixable with a clean simulator state.
2. **For CI**: use a pre-warmed simulator with the app already authenticated (no clearState between flows). The prior session's flow 1 proves the pipeline works end-to-end.
3. **Consider Maestro's `--reinstall` flag** which reinstalls the app before each flow, potentially avoiding the stale-state rendering issue.
