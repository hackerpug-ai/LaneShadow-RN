# iOS Learnings: E2E-J3 JourneyMapAppModals (Menu Drawer)

## Implementation Date
2026-05-16

## Current Status
**BLOCKED AT RED PHASE** — Hamburger button not discoverable in XCUITest element tree

### Blocker Details
The test successfully:
- Launches app with bypass auth
- Reaches idle state (idlescreen accessibility identifier found)
- Renders LSMap with valid persistent identity
- Can capture screenshots

The test fails to:
- Discover hamburger button with identifier `lstopbar-hamburger` via XCUITest automation
- LSTopBar may not be rendering in bypass auth mode, or its accessibility hierarchy is not exposed

### Evidence
- JourneyMapAppCoreLoop passes and can find map controls (`lsmapcontrols-zoom-in`), proving bypass auth works
- Menu drawer content exists and renders correctly in the IdleScreenContainer
- The hamburger button is correctly defined in LSTopBar.swift with accessibility identifier "lstopbar-hamburger"
- Test correctly identifies that idlescreen exists, but LSTopBar/hamburger do not appear discoverable

## Platform-Specific Notes

### Bypass Auth + UI Element Rendering
The bypass auth mode (`-LaneShadowE2EBypassAuth`) successfully initializes:
- MapApp state machine
- LSMap rendering
- Map controls

But may have an issue with:
- LSTopBar initialization or visibility
- Accessibility hierarchy export to XCTest automation

### Architecture Decision Taken
- Test written as single XCTest method (not split across methods) per VIEW-MAP doctrine
- Persistent-host identity verification pattern established (can verify once hamburger works)
- Menu scrim and drawer identifiers confirmed to exist in codebase

## Files Created/Modified
- `/ios/LaneShadowUITests/Journeys/JourneyMapAppModals.swift` — Journey test (RED phase, documents blocker)

## Deferred Steps

### Step 02 — Sessions Drawer (Sprint 11)
- Requires Convex seeder to populate prior rides
- Drawer UI spec: `.spec/design/system/views/mapapp/sessions-drawer/`
- Cannot test without bypass auth populating sessions

### Step 03 — Cancel-Confirm Sheet (Sprint 11)
- Requires reaching planning state, which requires chat input working
- Chat input blocked by Convex JWT bridge (per JourneyMapAppCoreLoop notes)
- Sheet UI spec: `.spec/design/system/views/mapapp/planning/cancel-prompt/`

## Next Actions (for Sprint continuation)
1. **Investigate LSTopBar rendering** in bypass auth mode — why is accessibility hierarchy not exposed?
2. **Alternative: Direct state mutation** — Can test provide a way to open the drawer without UI automation?
3. **Parallel: Fix Convex JWT bridge** — Unlock Steps 02 and 03 which require planning state

## Related Issues
- Convex JWT bridge blocks planning flow (JourneyMapAppCoreLoop notes)
- Sessions drawer requires Convex data seeding
