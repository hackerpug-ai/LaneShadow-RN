---
stability: CONSTITUTION
last_validated: 2026-04-03
prd_version: 1.1.0
---

# Technical Spec: React Native Client State Architecture — LaneShadow V1

## Overview

This document defines the client-side state architecture for the LaneShadow V1 MVP. V1 replaces the single-shot NLP input model with a conversational chat-session architecture. The always-visible `ChatInput` replaces the `DescribeRideBar` → `NlpInputSheet` flow; planning sessions persist messages and route attachments across conversations; and a sidebar provides session history.

The existing codebase uses a 4-status local reducer (`idle | planning | results | error`) with a flat `usePlanRide` hook that calls a single Convex action. V1 expands this into a 6-state machine covering chat-driven planning, multi-route comparison, weather overlays, session history, and navigation export.

---

## 1. State Machine Design

### 1.1 The 6-State Flow

```
IDLE
  └─ rider sends message via ChatInput → PLANNING

PLANNING
  ├─ phase: reading | finding | weather | building
  ├─ cancel → IDLE
  ├─ success [guard: routes.length >= 1] → ROUTE_RESULTS
  └─ error → IDLE (error displayed as system message in chat)

ROUTE_RESULTS
  ├─ tap card / polyline → (selectedRouteId updates, stays in ROUTE_RESULTS)
  ├─ rider sends refinement message → PLANNING
  ├─ tap "View Details" → ROUTE_DETAILS
  ├─ tap "Export to Nav" [guard: selectedRouteId != null] → NAVIGATION_EXPORT
  └─ tap session in sidebar → SESSION_HISTORY

ROUTE_DETAILS
  └─ back → ROUTE_RESULTS

SESSION_HISTORY
  ├─ tap a session → loads session, latest routes render → ROUTE_RESULTS
  └─ close sidebar → previous state (IDLE or ROUTE_RESULTS)

NAVIGATION_EXPORT
  └─ export complete / dismiss → ROUTE_RESULTS
```

Removed states from v1.0.0: `NLP_INPUT` (replaced by always-visible ChatInput), `MANUAL_PLAN_RIDE` (demoted to fallback accessible from ChatInput), `NAVIGATION` (replaced by `NAVIGATION_EXPORT` — deep-link only, no in-app nav).

### 1.2 New Types

```typescript
type ChatMessage = {
  _id: string
  role: 'rider' | 'system'
  content: string
  attachments: RouteAttachment[]
  timestamp: number
}

type RouteAttachment = {
  type: 'route_options'
  routePlanId: string
  options: PlannedRouteOptionView[]
}

type PlanningSession = {
  _id: string
  title: string
  status: 'active' | 'completed' | 'archived'
  createdAt: number
  updatedAt: number
}
```

### 1.3 State Type Definition

```typescript
// hooks/use-ride-flow.ts

export type PlanningPhase =
  | 'reading'    // "Reading your ride..."
  | 'finding'    // "Finding scenic roads..."
  | 'weather'    // "Checking weather along the route..."
  | 'building'   // "Building your options..."

export type RideFlowState =
  | 'IDLE'
  | 'PLANNING'
  | 'ROUTE_RESULTS'
  | 'ROUTE_DETAILS'
  | 'SESSION_HISTORY'
  | 'NAVIGATION_EXPORT'

export type RideFlowData = {
  // Screen state
  flowState: RideFlowState

  // Chat session state
  activeSessionId: string | null
  messages: ChatMessage[]               // in-memory for current session
  isOverlayVisible: boolean
  overlayMessage: ChatMessage | null
  isSidebarOpen: boolean

  // Route state (from latest route attachment)
  routeOptions: PlannedRouteOptionView[]
  selectedRouteId: string | null

  // Planning state
  planId: string | null
  planningPhase: PlanningPhase | null

  // Map camera
  camera: CameraState

  // Overlay
  activeOverlay: OverlayType | null
}
```

### 1.4 Transition Actions

```typescript
export type RideFlowAction =
  // Chat message actions
  | { type: 'SEND_MESSAGE'; payload: ChatMessage }
  | { type: 'RECEIVE_SYSTEM_MESSAGE'; payload: ChatMessage }

  // Overlay (temporary message overlay on map)
  | { type: 'SHOW_OVERLAY'; payload: ChatMessage }
  | { type: 'DISMISS_OVERLAY' }
  | { type: 'PIN_OVERLAY' }

  // Session management
  | { type: 'SET_ACTIVE_SESSION'; payload: string | null }
  | { type: 'LOAD_SESSION'; payload: { sessionId: string; messages: ChatMessage[] } }
  | { type: 'NEW_SESSION' }

  // Sidebar
  | { type: 'OPEN_SIDEBAR' }
  | { type: 'CLOSE_SIDEBAR' }

  // Navigation
  | { type: 'OPEN_ROUTE_DETAILS' }
  | { type: 'BACK_TO_RESULTS' }
  | { type: 'OPEN_NAVIGATION_EXPORT' }
  | { type: 'CLOSE_NAVIGATION_EXPORT' }
  | { type: 'CANCEL_TO_IDLE' }

  // Planning lifecycle
  | { type: 'BEGIN_PLANNING'; payload: { planId: string } }
  | { type: 'SET_PLANNING_PHASE'; payload: PlanningPhase }
  | { type: 'PLANNING_SUCCESS'; payload: PlannedRouteOptionView[] }
  | { type: 'PLANNING_ERROR'; payload: string }

  // Route selection
  | { type: 'SELECT_ROUTE'; payload: string }
  | { type: 'SET_ROUTE_OPTIONS'; payload: PlannedRouteOptionView[] }

  // Map
  | { type: 'SET_CAMERA'; payload: CameraState }
  | { type: 'SET_OVERLAY'; payload: OverlayType | null }

  // Reset
  | { type: 'RESET' }
```

### 1.5 Guards

| Transition | Guard Condition |
|---|---|
| `IDLE → PLANNING` | `message.content.trim().length > 0` |
| `ROUTE_RESULTS → PLANNING` (refinement) | `message.content.trim().length > 0` |
| `ROUTE_RESULTS → NAVIGATION_EXPORT` | `selectedRouteId != null` |
| `SESSION_HISTORY → ROUTE_RESULTS` | session has at least one route attachment |

### 1.6 How This Replaces the Current Reducer

The current `planningReducer` in `app/(app)/(tabs)/index.tsx:47` handles 4 statuses and 7 action types. The new `rideFlowReducer` replaces it entirely with:

- The `planningStatus: 'idle' | 'planning' | 'results' | 'error'` field is superseded by `flowState: RideFlowState`
- The `nlpText` and `resolvedDestination` fields are removed — rider intent is captured in `messages[]` and parsed server-side
- Chat session state (`activeSessionId`, `messages`, overlay state, sidebar state) is added
- All existing action dispatches are replaced by the typed `RideFlowAction` union
- The reducer is extracted into `hooks/use-ride-flow.ts` so `index.tsx` becomes a thin coordinator

Migration path: `index.tsx` replaces `useReducer(planningReducer, initialState)` with `useRideFlow()` which returns `{ state, dispatch }` with the same shape interface for existing JSX bindings.

---

## 2. New Hooks

### 2.1 `useChatSession`

**Location**: `hooks/use-chat-session.ts`

**Responsibility**: Manages the active planning session — create, load, send message. Wraps Convex mutations/queries for session CRUD.

```typescript
type UseChatSessionReturn = {
  activeSession: PlanningSession | null
  messages: ChatMessage[]
  sendMessage: (text: string) => Promise<void>
  createSession: () => Promise<string>       // returns sessionId
  loadSession: (sessionId: string) => void
  isLoading: boolean
}
```

**Internal behavior**:
1. Uses `useQuery(api.db.planningSessions.get, { sessionId })` for reactive session data (conditional on `activeSessionId`)
2. Uses `useQuery(api.db.sessionMessages.list, { sessionId })` for reactive message list
3. `createSession` calls `useMutation(api.db.planningSessions.create)` and dispatches `SET_ACTIVE_SESSION`
4. `sendMessage` calls `useMutation(api.db.sessionMessages.send)` and dispatches `SEND_MESSAGE`
5. `loadSession` dispatches `SET_ACTIVE_SESSION` — Convex queries reactively load session data and messages
6. On load, finds the latest route attachment in messages and dispatches `SET_ROUTE_OPTIONS` to restore map state

**Pattern for conditional subscription**:
```typescript
const session = useQuery(
  api.db.planningSessions.get,
  activeSessionId ? { sessionId: activeSessionId } : 'skip'
)
const messages = useQuery(
  api.db.sessionMessages.list,
  activeSessionId ? { sessionId: activeSessionId } : 'skip'
)
```

### 2.2 `useSessionHistory`

**Location**: `hooks/use-session-history.ts`

**Responsibility**: Fetches the session list for the sidebar.

```typescript
type UseSessionHistoryReturn = {
  sessions: PlanningSession[]
  isLoading: boolean
}
```

**Internal behavior**:
- Uses `useQuery(api.db.planningSessions.list)` for reactive session list, newest first
- Query is always active (no conditional skip) — sidebar may be opened at any time

### 2.3 `useMessageOverlay`

**Location**: `hooks/use-message-overlay.ts`

**Responsibility**: Manages the temporary message overlay that appears on the map when a new system message arrives. Auto-dismisses after 5 seconds, can be pinned or manually dismissed.

```typescript
type UseMessageOverlayReturn = {
  overlayMessage: ChatMessage | null
  isVisible: boolean
  dismiss: () => void
  pin: () => void
}
```

**Internal behavior**:
- On `SHOW_OVERLAY` dispatch, sets `overlayMessage` and starts a 5-second auto-dismiss timer via `useRef`
- `pin()` clears the auto-dismiss timer, keeping the overlay visible until manually dismissed
- `dismiss()` clears the overlay and dispatches `DISMISS_OVERLAY`
- Timer is cleaned up on unmount via `useEffect` cleanup

### 2.4 `useChatPlanning`

**Location**: `hooks/use-chat-planning.ts`

**Responsibility**: Replaces `useNlpPlanning`. Sends a rider message, triggers `parseNaturalLanguageInput` + `createPlan`, subscribes to plan status for phase updates, and on completion creates a system message with route attachments.

```typescript
type UseChatPlanningReturn = {
  sendPlanningMessage: (text: string) => Promise<void>
  currentPhase: PlanningPhase | null
  isPlanning: boolean
  cancel: () => void
}
```

**Internal behavior**:
1. On `sendPlanningMessage(text)`:
   - Dispatches `SEND_MESSAGE` → adds rider message to local state
   - Calls `useMutation(api.db.sessionMessages.send)` → persists rider message
   - Calls `useAction(api.actions.agent.parseNaturalLanguageInput)` with session context and `previousMessages` for conversation history
   - Calls `useMutation(api.db.routePlans.createPlan)` with the returned `PlanInput` → starts route generation
   - Dispatches `BEGIN_PLANNING` with the returned `planId`
2. Subscribes to `useQuery(api.db.routePlans.getPlanStatus, { planId })` to drive `SET_PLANNING_PHASE` dispatches
3. Falls back to time-based phase advancement (2s/3s/4s/3s) if subscription is unavailable
4. On plan completion:
   - Dispatches `RECEIVE_SYSTEM_MESSAGE` with route attachments
   - Calls `api.db.sessionMessages.addSystemMessage` (internal mutation) to persist
   - Dispatches `SHOW_OVERLAY` to show temporary overlay on map
   - Dispatches `PLANNING_SUCCESS` with route options
5. Handles both initial plans and refinements — passes `previousMessages` for context; `isRefinement: true` in parse result means previous routes remain in chat history (scroll up) while new routes REPLACE active routes on the map
6. Tracks an `AbortController` ref for cancellation (mirrors current `usePlanRide` pattern)

**Convex dependency**: Requires `parseNaturalLanguageInput` action (see `07-technical-backend.md` §3.1) and `PlanInput` with optional `nlpText` field.

### 2.5 `useRouteComparison`

**Location**: `hooks/use-route-comparison.ts`

**Responsibility**: Manages which of the 2–3 returned routes is selected, and exposes derived state for map rendering (polyline variants). Routes are now sourced from the latest route attachment in messages rather than from a sheet prop.

```typescript
type UseRouteComparisonReturn = {
  routes: PlannedRouteOptionView[]
  selectedRouteId: string | null
  selectedRoute: PlannedRouteOptionView | null

  // Select a route by ID (from card tap or polyline tap)
  selectRoute: (routeOptionId: string) => void

  // Derived for map — memoized
  polylines: RoutePolylineConfig[]
}
```

**State rules**:
- When `routes` is set, `selectedRouteId` defaults to `routes[0].routeOptionId`
- `polylines` is a `useMemo` that calls `buildRoutePolylines` once per `[routes, selectedRouteId, activeOverlay, semantic]` — this is the expensive decode step (see §6)
- Selecting a different route does NOT re-run planning; it only changes which polyline is highlighted

**Map polyline conventions**:
- Selected route: `variant: 'selected'`, `strokeWidth: 5`, full opacity
- Alternate routes: `variant: 'alternate'`, `strokeWidth: 3`, 35% opacity, dashed

### 2.6 `useWeatherOverlay`

**Location**: `hooks/use-weather-overlay.ts`

**Responsibility**: Manages which overlay is currently active, exposes overlay availability per-route, and derives the overlay data slice for the selected route.

```typescript
type UseWeatherOverlayReturn = {
  activeOverlay: OverlayType | null
  setActiveOverlay: (overlay: OverlayType | null) => void

  // Per-route availability
  availability: { wind: boolean; rain: boolean; temperature: boolean }

  // Weather summary for the selected route (for badge rendering)
  weatherSummary: RouteWeatherSummary | null
}

type RouteWeatherSummary = {
  windSummary: WindSummary
  rainSummary: RainSummary
  temperatureSummary: TemperatureSummary
  conditionsStatus: 'ok' | 'unavailable'
  maxTemperatureF?: number
}
```

**Behavior**:
- Auto-activates wind overlay when entering `ROUTE_RESULTS` state (preserves existing AC from `index.tsx:131`)
- Resets to `null` when returning to `IDLE` or `PLANNING`
- Availability is derived from `selectedRoute.overlaysPreview.conditionsStatus`

---

## 3. Modified Hooks

### 3.1 `useRideFlow` (rewritten)

The reducer gains all new chat, session, overlay, and sidebar actions. State includes `activeSessionId`, `messages[]`, `isOverlayVisible`, `overlayMessage`, and `isSidebarOpen` in addition to the existing route and planning fields.

### 3.2 `useRouteComparison` (modified)

Fed from the latest route attachment in messages rather than from a sheet prop. The rendering logic is identical.

### 3.3 `usePlanRide` (unchanged)

**Location**: `hooks/use-plan-ride.ts` (existing file)

The hook itself does not change. The `planRide` function passes through whatever `PlanInput` it receives. The chat-specific lifecycle (phase tracking, abort, message creation) is handled by `useChatPlanning` which wraps `usePlanRide` internally.

**`usePlanInit`**: unchanged — continues to populate preference defaults on mount.

### 3.4 `useWeatherOverlay` (unchanged)

Behavior identical to §2.6.

### 3.5 Convex Hook Patterns

| Hook | Type | Pattern |
|------|------|---------|
| `useQuery(api.db.planningSessions.list)` | Reactive | Session sidebar — always active |
| `useQuery(api.db.planningSessions.get, { sessionId })` | Reactive conditional | Active session metadata |
| `useQuery(api.db.sessionMessages.list, { sessionId })` | Reactive conditional | Messages for active session |
| `useQuery(api.db.routePlans.getPlanStatus, { planId })` | Reactive conditional | During PLANNING only |
| `useAction(api.actions.agent.parseNaturalLanguageInput)` | One-shot | Per message send |
| `useMutation(api.db.routePlans.createPlan)` | One-shot | Per route generation |
| `useMutation(api.db.sessionMessages.send)` | One-shot | Per rider message |
| `useMutation(api.db.planningSessions.create)` | One-shot | New session creation |
| `useQuery(api.db.planUsage.check)` | Reactive | Rate limit display |

**Pattern for conditional subscription**:
```typescript
const planStatus = useQuery(
  api.db.routePlans.getPlanStatus,
  activePlanId ? { planId: activePlanId } : 'skip'
)
```

---

## 4. Data Flow

### 4.1 Planning Message

```
[ChatInput] rider types message
    │
    ▼
useChatPlanning.sendPlanningMessage(text)
    │
    ├─ 1. dispatches SEND_MESSAGE → adds rider message to state
    ├─ 2. calls sessionMessages.send (mutation) → persists rider message
    ├─ 3. calls parseNaturalLanguageInput (action) → with session context
    ├─ 4. calls createPlan (mutation) → starts route generation
    │
    ▼ (async, 8-12s)
    │
    ├─ useQuery(getPlanStatus) → drives PLANNING phase updates
    │
    ▼ (plan completes)
    │
    ├─ 5. dispatches RECEIVE_SYSTEM_MESSAGE → adds system message with route attachments
    ├─ 6. calls sessionMessages.addSystemMessage (internal mutation) → persists
    ├─ 7. dispatches SHOW_OVERLAY → shows temporary overlay on map
    │
    ▼
useRouteComparison picks up routes from latest attachment
    │
    ▼
Polylines render on map, overlay auto-dismisses after 5s
```

### 4.2 Refinement Message

Same flow as §4.1, except:
- `previousMessages` passed to `parseNaturalLanguageInput` for conversation context
- `isRefinement: true` in parse result
- Previous routes remain in chat history (scroll up)
- New routes REPLACE active routes on the map

### 4.3 Session Resume

```
[SessionSidebar] rider taps a session
    │
    ▼
useChatSession.loadSession(sessionId)
    │
    ├─ dispatches SET_ACTIVE_SESSION → sets activeSessionId
    ├─ useQuery loads session messages
    ├─ finds latest route attachment in messages
    ├─ dispatches SET_ROUTE_OPTIONS from that attachment
    │
    ▼
Routes from the last generation in that session render on map
```

### 4.4 Phase Label Updates During Planning

```
planRide action starts
    │ returns planId immediately (or via route_plans insert)
    ▼
useChatPlanning subscribes to useQuery(getPlanStatus, { planId })
    │ planStatus.phase updates as backend progresses
    ▼
Planning indicator in ChatInput reads currentPhase from useChatPlanning
    │ renders phase label with animation
    ▼
Phase sequence: reading → finding → weather → building → (result arrives)
```

If `getPlanStatus` is not yet available in Convex schema: fall back to a time-based sequence driven by `useEffect` with `setTimeout` (2s per phase). This is acceptable for V1 since the total time is ~10s.

### 4.5 Route Alternatives → Map Polylines

```
PlannedRouteOptionView[] (from latest route attachment in messages)
    │
    ▼
useRouteComparison.polylines                 (useMemo)
    │ calls buildRoutePolylines() per option
    │ selected: variant='selected', full opacity
    │ alternates: variant='alternate', 35% opacity, dashed
    ▼
MapViewWrapper.polylines prop               (renders all simultaneously)
```

Tapping an alternate polyline on the map fires `onMapClick` → `handleAlternatePolylineTap(routeOptionId)` → `selectRoute(routeOptionId)`. The `onMapClick` handler in `index.tsx` is extended to detect taps near alternate polyline paths.

### 4.6 Weather Data → Overlay Components

```
PlannedRouteOptionView.overlaysPreview      (per-option weather summary)
    │
    ▼
useWeatherOverlay.weatherSummary            (derived from selectedRoute)
    │
    ├─ RouteWeatherBadge (in route result cards)
    │   └─ reads: rainSummary, temperatureSummary, windSummary
    │
    ├─ OverlayToggle (map header)
    │   └─ reads: availability.rain, availability.temperature
    │
    └─ WeatherTimelineSheet (on badge tap)
        └─ reads: full per-route weather timeline (future: new Convex query)

PlannedRouteOptionView.map.overlays         (per-route polyline overlay data)
    │
    ▼
buildRoutePolylines() (in useRouteComparison.polylines memo)
    └─ applies wind/rain/temp coloring to map polyline segments
```

---

## 5. Convex Integration

### 5.1 Reactive vs One-Shot

| Operation | Pattern | Rationale |
|---|---|---|
| Load preference defaults | `useQuery(getPlanInit)` | Reactive — auto-updates if user's defaults change in settings |
| Session list (sidebar) | `useQuery(planningSessions.list)` | Reactive — always on, reflects new sessions immediately |
| Active session metadata | `useQuery(planningSessions.get, { sessionId })` | Reactive conditional — active only when a session is loaded |
| Session messages | `useQuery(sessionMessages.list, { sessionId })` | Reactive conditional — active only when a session is loaded |
| Poll planning progress | `useQuery(getPlanStatus, { planId })` | Reactive during PLANNING only. Skip with `'skip'` otherwise. |
| Rate limit check | `useQuery(planUsage.check)` | Reactive — displays current usage |
| Parse NLP input | `useAction(parseNaturalLanguageInput)` | One-shot per message send |
| Execute route planning | `useMutation(createPlan)` | One-shot. Single call per plan request. |
| Send rider message | `useMutation(sessionMessages.send)` | One-shot per rider message |
| Create session | `useMutation(planningSessions.create)` | One-shot per new session |

### 5.2 Route Plans Subscription

The `route_plans` Convex table (defined in `convex/db/routePlans.ts`) tracks plan execution status. V1 uses this for phase label progression.

Required query (add to `convex/db/routePlans.ts` if not present):
```typescript
export const getPlanStatus = query({
  args: { planId: v.id('route_plans') },
  handler: async (ctx, { planId }) => {
    const plan = await ctx.db.get(planId)
    return plan ? { phase: plan.phase, status: plan.status } : null
  },
})
```

The `planRide` action already creates/updates a `route_plans` document. The frontend subscribes only when a `planId` is available and the flow is in `PLANNING` state.

### 5.3 Optimistic Updates for Save/Favorite

When the rider taps "Save Route" in `ROUTE_RESULTS`:

```typescript
// Optimistic update pattern
const saveRoute = useMutation(api.db.savedRoutes.saveRoute)
  .withOptimisticUpdate((localStore, args) => {
    const existingList = localStore.getQuery(api.db.savedRoutes.list, {})
    if (existingList) {
      localStore.setQuery(api.db.savedRoutes.list, {}, [
        { ...args.routeSnapshot, savedRouteId: 'optimistic-temp', isSaving: true },
        ...existingList,
      ])
    }
  })
```

Favorite road save (`api.db.favoriteRoads.insert`) follows the same pattern — optimistic insert into the favorites list, replaced by real document on Convex confirmation.

---

## 6. Performance Considerations

### 6.1 Polyline Decoding — The Expensive Operation

`buildRoutePolylines()` decodes Google encoded polylines (`overviewGeometry.value`) and constructs styled segment arrays. This is O(n) in polyline length and should not run on every render.

**Memoization strategy**:
```typescript
// Inside useRouteComparison
const polylines = useMemo(() => {
  if (!routes.length) return []
  return routes.flatMap((route) =>
    buildRoutePolylines({
      route: {
        overviewGeometry: route.map.overviewGeometry,
        legs: route.map.legs,
        overlays: (route.map as any)?.overlays,
      },
      variant: route.routeOptionId === selectedRouteId ? 'selected' : 'alternate',
      showLegs: route.routeOptionId === selectedRouteId,
      showWindOverlay: activeOverlay === 'wind',
      semantic,
    })
  )
}, [routes, selectedRouteId, activeOverlay, semantic])
```

**Key**: `routes` is a stable reference (set once when `PLANNING_SUCCESS` fires or when loading a session's latest attachment). Only `selectedRouteId` and `activeOverlay` change on user interaction — these are cheap re-memos because the polyline geometry doesn't change, only the `variant` field.

### 6.2 `useMemo` vs `useCallback`

| Use `useMemo` for | Use `useCallback` for |
|---|---|
| `polylines` — computed array from route data | `selectRoute` — event handler passed to cards + map |
| `selectedRoute` — derived from `routes + selectedRouteId` | `sendPlanningMessage` — async function passed to ChatInput |
| `weatherSummary` — derived from `selectedRoute.overlaysPreview` | `setActiveOverlay` — passed to OverlayToggle |
| `overlayAvailability` — derived from `selectedRoute` | `cancelPlanning` — passed to cancel button |
| `markers` — derived from route endpoints | `handleCameraMove` — registered on MapViewWrapper |
| `latestRouteAttachment` — derived from `messages[]` | `dismiss` / `pin` — overlay control callbacks |

### 6.3 Avoiding Re-renders When Switching Selected Route

The primary re-render risk: tapping an alternate route card triggers `selectRoute(id)`, which updates `selectedRouteId`, which causes `polylines` to recompute and `MapViewWrapper` to re-render all polylines.

**Mitigations**:
1. `polylines` memo only changes the `variant` field of the affected route entries — not the coordinate arrays. `react-native-maps` `Polyline` should not re-layout if coordinates are unchanged. Verify this with Flipper profiling before shipping.
2. Route option cards in the horizontal scroll receive `isSelected: boolean` via `React.memo` — they re-render only when their own `isSelected` changes, not when a different card is selected.
3. `WeatherTimelineSheet` receives a stable `route` object ref (from `routes[]` array which doesn't change post-results). Wrap with `React.memo`.
4. `MapViewWrapper` ref is stable (`useRef`). Camera animations are called imperatively via `mapRef.current.setCameraPosition()` — not via state, so they don't trigger re-renders.

### 6.4 Message List Performance

The `messages[]` array in `RideFlowData` is in-memory for the current session. For long sessions:
- Messages are loaded from `useQuery(api.db.sessionMessages.list, { sessionId })` which handles pagination server-side
- The in-memory array is bounded by what Convex returns (default page size)
- Route attachments in messages contain `PlannedRouteOptionView[]` which can be large — only the latest attachment's routes are active on the map; historical attachments are rendered as summary cards in chat

---

## 7. File Structure

### New Files

```
hooks/
  use-ride-flow.ts            # Main reducer: RideFlowState, rideFlowReducer, useRideFlow
  use-chat-session.ts         # Session CRUD: create, load, send message
  use-session-history.ts      # Session list for sidebar
  use-message-overlay.ts      # Temporary overlay: show, auto-dismiss, pin
  use-chat-planning.ts        # Chat → NLP parse → createPlan → phase tracking → system message
  use-route-comparison.ts     # Route selection + polyline memoization
  use-weather-overlay.ts      # Overlay state + availability + weather summary
```

### Modified Files

```
hooks/
  use-plan-ride.ts            # Add nlpText to PlanInput (pass-through, no logic change)

models/
  saved-routes.ts             # Add nlpText?: string to PlanInput type

app/(app)/(tabs)/index.tsx    # Replace useReducer(planningReducer) with useRideFlow()
                              # Replace overlay useState blocks with useWeatherOverlay()
                              # Replace handlePlanRide with useChatPlanning
                              # Add ChatInput, SessionSidebar, MessageOverlay components

convex/db/routePlans.ts       # Add getPlanStatus query if not present
```

### Unchanged Files

```
hooks/use-current-location.ts   # No changes — still feeds start location default
hooks/use-semantic-theme.ts     # No changes
hooks/use-plan-ride.ts          # No logic change (PlanInput type gains optional field)
app/_layout.tsx                 # No changes — providers unchanged
app/(app)/(tabs)/_layout.tsx    # No changes
```

---

## 8. Integration with New Components

| Component | Hook(s) Consumed | Key Props In | Events Out |
|---|---|---|---|
| `ChatInput` | `useChatPlanning`, `useChatSession` | `isPlanning`, `currentPhase` | `sendPlanningMessage(text)` |
| `SessionSidebar` | `useSessionHistory`, `useChatSession` | `sessions`, `activeSessionId` | `loadSession(id)`, `createSession()`, `CLOSE_SIDEBAR` |
| `MessageOverlay` | `useMessageOverlay` | `overlayMessage`, `isVisible` | `dismiss()`, `pin()` |
| `PlanningProgressIndicator` | `useChatPlanning` | `currentPhase`, `isPlanning` | `cancel()` |
| `RouteResultsView` | `useRouteComparison`, `useWeatherOverlay` | `routes`, `selectedRoute`, `activeOverlay` | `selectRoute`, `setActiveOverlay`, `OPEN_NAVIGATION_EXPORT` |
| `RouteWeatherBadge` | (presentational) | `rainSummary`, `windSummary`, `temperatureSummary` | `onPress` → open `WeatherTimelineSheet` |
| `WeatherTimelineSheet` | `useWeatherOverlay` | `route`, `isVisible` | `onClose`, `onAdjustDeparture` |
| `NavigationExportSheet` | (presentational) | `selectedRoute` | `onExport(target)`, `onClose` |

---

## 9. Transition from Current to V1

The current `HomeMapScreen` can be migrated incrementally:

**Phase A** (state machine): Extract `planningReducer` into `useRideFlow` hook with the new 6-state machine. Map all existing action dispatches to new action types. Add chat session state fields. Screen behavior identical for existing flows.

**Phase B** (chat input): Replace `DescribeRideBar` + `NlpInputSheet` with always-visible `ChatInput`. Wire `useChatPlanning` and `useChatSession`. Sessions auto-created on first message.

**Phase C** (session history): Add `SessionSidebar` with `useSessionHistory`. Wire `loadSession` to restore routes from historical sessions. Add `MessageOverlay` with auto-dismiss.

**Phase D** (multi-route + weather): Pass 2–3 alternatives from backend. Render alternate polylines. Wire `useRouteComparison`. Wire `useWeatherOverlay` and `RouteWeatherBadge`.

**Phase E** (navigation export): Add `NavigationExportSheet` with deep-link generation for Google Maps and Waze.

Each phase is independently testable and deployable.
