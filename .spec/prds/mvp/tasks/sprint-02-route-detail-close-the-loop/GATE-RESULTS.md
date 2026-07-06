# Gate Results: sprint-02-route-detail-close-the-loop

**Run ID:** 2026-07-06T01:45:00Z (Option 1: erased simulator + fresh build)  
**Sprint:** 2 — Route Detail + Close the Loop  
**Environment:** iPhone 17 Pro (iOS 26.5, freshly erased), Metro on :8081, Convex dev (quirky-panther-164), Maestro 2.6.1  
**UI driver:** Maestro (iOS simulator)  
**Strategy:** `xcrun simctl erase` → `npx expo run:ios` → verify rendering → run gate warm

## What Worked This Session (positive evidence)

| Check | Result | Evidence |
|-------|--------|----------|
| Simulator erase + boot | ✅ | `xcrun simctl erase` + `boot` succeeded, UDID preserved |
| Native rebuild | ✅ | `npx expo run:ios` — Build Succeeded, 0 errors, 1 warning |
| App install | ✅ | Installed on iPhone 17 Pro (container 76A1EA21) |
| Metro connection | ✅ | App initialized session `sess_1783359271239` |
| App rendering | ✅ | `chat-input` testID verified VISIBLE by Maestro (proves correct rendering + authentication) |
| Convex backend | ✅ | Live at quirky-panther-164.convex.cloud (HTTP 200) |

## What Broke

**The app renders correctly IMMEDIATELY after `expo run:ios` but freezes on ANY subsequent interaction** — Maestro `launchApp` (even `clearState: false`), `openLink`, or even `assertVisible` causes the React Native view tree to become inaccessible. The app is still running (PID 42539) but the accessibility layer sees only blank content.

## Prior Session Evidence (unchanged app source, same binary + Convex)

On 2026-07-05T17:30:00Z, flow `.maestro/uc-dtl-03-with-polyline.yaml` **passed 8/8 on-device assertions**:
- Auth via E2E button → home screen (chat-input) ✓
- Deep-link → route name "Wasatch Ridge Traverse" ✓
- Map section visible ✓
- Polyline probe visible ✓
- Approximate badge NOT visible ✓
- "Approximate location" text NOT visible ✓

App source code is unchanged since (only `.spec/` planning artifacts were modified in red-hat cycles).

## Verdict: BLOCKED

**Reason:** `simulator-rendering-fragility` — the expo-dev-client freezes its render surface after any Maestro interaction, preventing gate step execution. This is an infrastructure bug, not an app code defect.

## Recommendation

**Use a pre-warmed CI simulator + single-session warm runs.** The pattern that works:
1. `expo run:ios` builds + launches fresh (app renders correctly)
2. Run ALL gate steps in ONE Maestro flow (no intermediate `launchApp`/`clearState`)
3. Never terminate/background the app between steps

The prior session followed this pattern successfully. The constraint is that the simulator must not be touched between `expo run:ios` launch and gate step execution — no Maestro `launchApp`, no `openLink` outside the authenticated session.
