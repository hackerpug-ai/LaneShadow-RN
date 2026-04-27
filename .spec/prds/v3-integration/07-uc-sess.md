---
stability: FEATURE_SPEC
last_validated: 2026-04-27
prd_version: 1.0.0
functional_group: SESS
---

# Use Cases: Sessions History (SESS)

| ID | Title | Description |
|----|-------|-------------|
| UC-SESS-01 | Open sessions drawer with real history | V2 LSSessionsDrawer organism wired to real `planningSessions.listSessions` query |
| UC-SESS-02 | Switch to a prior session | Tapping a session row routes to that session's current phase + restores camera |
| UC-SESS-03 | Start a new session from drawer | "+ New session" button creates fresh `planning_sessions` row + routes to IdleScreen |

---

## UC-SESS-01: Open sessions drawer with real session history

The V2 SessionsScreen and its `LSSessionsDrawer` organism are wired to `db.planningSessions.listSessions`. Sessions are grouped by date bucket (Today / Yesterday / This week / Earlier this month / Earlier) per RN behavior. Each row shows the session title (auto-generated server-side from first message) and the last message snippet. Active session has a striped left indicator.

- **Maps to**: V2 SessionsScreen + V2 LSSessionsDrawer organism
- **Backend**: subscribe `db.planningSessions.listSessions({limit?})` — returns sessions ordered by `updatedAt` desc

### Acceptance Criteria

- ☐ User can tap the menu/hamburger icon on the V2 LSTopBar to open the SessionsScreen drawer with the V2 `sidebarSlideIn` motion recipe
- ☐ User can view real planning sessions grouped by date bucket (Today / Yesterday / This week / Earlier)
- ☐ User can scroll the session list with a pinned active-session row at the top showing a striped left indicator
- ☐ System displays the last message snippet for each session row, truncated to one line
- ☐ System displays a loading shimmer for each row while the `listSessions` subscription is pending the first response

---

## UC-SESS-02: Switch to a prior session

Tapping a session row in the drawer switches the active session and routes to the appropriate phase screen for that session's state. Camera position is restored from the per-session cache (UserDefaults / DataStore). The `lastViewedSessionId` is updated in local storage.

- **Maps to**: SessionsScreen → IdleScreen / PlanningScreen / RouteResultsScreen / RouteDetailsScreen (depending on session state)
- **Backend**: query `db.routePlans.getActiveRoutePlansForSession({sessionId})` to determine target phase; query `db.planningSessions.getSessionById({sessionId})` for session metadata
- **Local persistence**: read `cameraStore.cameraForSession(sessionId)`; update `appState.lastViewedSessionId`

### Acceptance Criteria

- ☐ User can tap any session row in the drawer to switch the active session
- ☐ System routes to the correct V2 screen based on the session's most recent state: PlanningScreen if a plan is in-progress, RouteResultsScreen if `route_plans.status === "completed"` with multiple options, RouteDetailsScreen if a route option is selected, IdleScreen if no plan exists
- ☐ System restores the per-session camera position from local persistence (UserDefaults on iOS / DataStore on Android) keyed by `sessionId`
- ☐ System updates `lastViewedSessionId` in local storage on session switch
- ☐ System dismisses the drawer with the V2 `sidebarSlideOut` motion recipe before the route transition

---

## UC-SESS-03: Start a new session from drawer

The "+ New session" affordance in the LSSessionsDrawer creates a fresh `planning_sessions` row via `createSession` mutation, sets it as the active session, and routes to IdleScreen with current location as the default camera.

- **Maps to**: V2 LSSessionsDrawer
- **Backend**: mutation `db.planningSessions.createSession({firstMessage?})` — `firstMessage` is optional; passing nothing creates an empty session that the user fills via UC-CHAT-01
- **Local persistence**: update `appState.lastViewedSessionId`; preload `cameraStore.defaultCamera` (current location)

### Acceptance Criteria

- ☐ User can tap "+ New session" in the LSSessionsDrawer to create a fresh planning session via `db.planningSessions.createSession` with no `firstMessage`
- ☐ System dismisses the drawer with the V2 `sidebarSlideOut` motion recipe
- ☐ System routes to IdleScreen with the new session set as active
- ☐ System sets the new session's `lastViewedSessionId` in local storage
- ☐ System pre-loads the default camera position (current location) for the new session, using `cameraStore.defaultCamera`
