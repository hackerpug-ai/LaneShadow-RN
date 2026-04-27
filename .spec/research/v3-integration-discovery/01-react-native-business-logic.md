# React Native Business Logic Inventory

**Generated:** 2026-04-27
**Purpose:** Complete map of business logic in `react-native/` to inform feature parity scoping for native iOS/Android integration sprint.

---

## Executive Summary

LaneShadow React Native is a conversational motorcycle route planning app built with Expo + Clerk + Convex + Mapbox. Core loop: **Conversation → Agent Planning → Route Rendering → Save**, with fallbacks to manual mode, offline maps, and cached enrichment. ~1400 lines in main screen; ~50 hooks; ~30 stores/contexts; ~100+ components.

---

## 1. Authentication & User Management

**Implementation:** Clerk OAuth + Convex Auth

**User Capabilities:**
- Sign in/sign up via email or social OAuth (Google, Apple)
- Multi-factor session restore
- User profile sync from Clerk → Convex `users` table

**Key Files:**
- `app/(auth)/sign-in.tsx` — Multi-step auth (email → password or social)
- `app/(auth)/oauth-callback.tsx` — OAuth redirect handler
- `lib/clerk-token-cache.ts` — Secure token caching via `expo-secure-store`
- `lib/auth-tokens.ts` — Legacy WorkOS storage (not active)
- `providers/convex-provider.tsx` — `ConvexProviderWithClerk` setup

**Auth Flow:**
1. Email entry → check `supportedFirstFactors`
2. Route to password or sign-up
3. `attemptFirstFactor()` or create session
4. Auto-navigate to most recent planning session or new session
5. Token persistence via Clerk tokenCache

**External Dependencies:**
- `@clerk/clerk-expo`
- `ConvexProviderWithClerk`

**Backend Integration:**
- Clerk webhook → creates entry in Convex `users` table on first sign-in
- Convex queries use `useAuth()` to validate user
- All data scoped by `clerkUserId`

---

## 2. Navigator AI / Chat / Planning

**Implementation:** Agentic planning sessions with server-side Claude

**User Capabilities:**
- Natural language route planning
- Conversational refinement
- Live streaming message statuses (running → streaming → complete)
- Optimistic UI with temp message IDs
- Cancel in-flight planning
- Manual mode fallback

**Frontend Hooks:**
- `hooks/use-chat-planning.ts` — Orchestrates session creation + message sending
- `hooks/use-ride-flow.ts` — Pure state machine (IDLE → PLANNING → ROUTE_RESULTS → ROUTE_DETAILS → SESSION_HISTORY → ERROR → NAVIGATION_EXPORT)
- `hooks/use-plan-ride.ts` — Manual planning mode (legacy)
- `hooks/use-active-session-route.ts` — Subscribes to latest `routing_card` in active session

**Components:**
- `components/chat/chat-input.tsx` — Bottom chat input (compose, send, cancel, manual toggle, idle suggestions, transcript toggle)
- `components/chat/routing-card.tsx` — Polls `route_plans` for agent-produced routes
- `components/ui/chat-transcript.tsx` — Scrollable message list with rider/agent messages, routing cards, thinking step expansion
- `components/sheets/planning-error-sheet.tsx` — Error recovery UI

**Server-Side (Convex):**
- `api.actions.agent.sendMessage.sendMessage` — Backend action that creates session, invokes Claude, streams response, stores in `session_messages`
- `api.db.planningSessions.createSession` — Creates session record
- `api.db.sessionMessages.list` — Streams messages with status changes
- `api.db.routePlans.getActiveRoutePlansForSession` — Polls completed plans

**Data Tables:**
- `planning_sessions` — One per conversation thread
- `session_messages` — Messages within a session (role, kind, content, status, attachments, thinkingSteps)
- `route_plans` — Route options (planInput, result PlannedRouteOptionsView, status)

**State Management:**
- `useChatSessionStore` (Zustand + AsyncStorage) — last viewed session ID, per-session camera positions, default camera

**Non-Obvious Patterns:**
- Optimistic messages with `temp-{timestamp}` IDs replaced on server confirmation
- Session reuse for refinements
- Decoupled UI state machine from Convex subscriptions
- Route plan polling, not stream result direct binding

---

## 3. Route Management

**User Capabilities:**
- Browse saved routes
- View route details (distance, duration, elevation, segments)
- Save planned routes as favorites
- Compare multiple route options side-by-side
- Search routes by name or location
- Long-press segment to save

**Frontend Hooks:**
- `hooks/use-saved-routes.ts` — CRUD: `useSavedRoutesList`, `useSavedRouteDetail`, `useSaveRoute`, `useRenameRoute`, `useSoftDeleteRoute`, `useUndoDeleteRoute`
- `hooks/use-route-comparison.ts` — Renders multiple polylines, generates colors, tracks segment selection
- `hooks/use-route-discovery.ts` — Vector similarity search against `curated_routes`
- `hooks/use-is-route-saved.ts` — Quick lookup for "already saved" indicator

**Components:**
- `components/chat/route-attachment-card.tsx` — Route option in ROUTE_RESULTS phase (distance, duration, elevation, scenic score, overlay status)
- `components/map/route-polyline-component.tsx` — Decoded polylines, multiple colors, long-press save
- `components/ui/save-favorite-sheet.tsx` — Save modal with snapshot of geometry/bounds/overlays
- `components/sheets/route-details-sheet.tsx` — Full route info drawer

**Convex:**
- `api.db.savedRoutes.saveRoute` — Creates record with planInput, routeSnapshot (immutable), routeIndex (fingerprint), snapshotMeta
- `api.db.savedRoutes.getSavedRoutesList` — Search/pagination
- `api.db.savedRoutes.getSavedRouteDetail` — Full route + enrichment
- `api.db.curated_routes.search` — Vector search

**Data:**
- `saved_routes` — User bookmarks (ownerType, ownerId, name, planInput, routeSnapshot, routeIndex, snapshotMeta, deletedAt)
- `curated_routes` — Hand-picked motorcycle routes (source, primaryArchetype, state, compositeScore, geometry, searchEmbedding 1536d)

**Non-Obvious:**
- Route provenance tracking (e.g., "Featured in Motorcycle.com")
- Snapshot immutability — frozen at save time
- 30-day soft delete recovery window
- Curated route vector search for semantic discovery

---

## 4. Map & Location

**User Capabilities:**
- Interactive Mapbox map with route visualization
- Current location tracking + recenter
- Zoom + pan
- Offline map download for regions
- Weather overlay (wind, temperature, precipitation)
- Search result markers
- Multiple polyline rendering

**Mapbox Integration:**
- `components/map/mapbox-map-view.tsx` — Main map component (initialCamera, markers, onMapClick, onCameraMove, fitToCoordinates, setCameraPosition, zoomBy, recenterToUser)
- `lib/mapbox/offline-manager.ts` — Offline region queue, progress, storage paths, checksum validation
- `lib/mapbox/weather-optimization.ts` — Debounces map movement to avoid excessive overlay re-requests

**Location:**
- `hooks/use-current-location.ts` — `expo-location` with permission, debounced updates, fallback to last known
- `hooks/use-place-autocomplete.ts` — Mapbox Search API autocomplete

**Map Controls & Overlays:**
- `components/map/map-controls.tsx` — Zoom in/out, recenter, clear, save (context-aware), mode toggle
- `components/map/map-header-overlay.tsx` — Glass-morphic header (title, menu, new session)
- `components/map/weather-pills-row.tsx` — Wind/temp/precip indicators
- `components/map/route-polyline.tsx` — Decode polyline, color by variant
- `components/map/search-result-marker.tsx` — Custom marker

**Styles:**
- `lib/mapbox/styles.ts` — Light/dark Mapbox style definitions
- `lib/map/overlay-colors.ts` — Wind direction colors, temperature gradient

**Offline Downloads:**
- `app/(app)/offline/regions-list.tsx` — Browse regions
- `app/(app)/offline/region-selector.tsx` — Select region
- `hooks/useOfflineDownload.ts` — Lifecycle (progress, resume, cancel, checksum)

**Backend:**
- `osm_nodes` — Scenic waypoints (s2Token, type, osmId)
- `osm_ways` — Road segments (osmId, name, highwayClass, geometry)

**Non-Obvious:**
- Camera persistence in `useChatSessionStore` per session
- `isProgrammaticMoveRef` flag prevents double-saving during session switches
- Weather overlays only shown when `conditionsStatus === 'ok'`
- Background queue for offline tile fetches when online

---

## 5. Convex Backend Integration

**Provider:** `providers/convex-provider.tsx` wraps app, `ConvexReactClient` initialized with `EXPO_PUBLIC_CONVEX_URL`, Clerk integrated via `ConvexProviderWithClerk`

**Error Handling:** `lib/convex-error.ts` — Maps Convex errors to user-facing messages, distinguishes auth/rate-limit/validation

### Queries (Subscriptions)
| Function | Purpose |
|----------|---------|
| `api.db.planningSessions.listSessions` | User's conversation history |
| `api.db.sessionMessages.list` | Stream messages + status |
| `api.db.routePlans.getActiveRoutePlansForSession` | Poll completed plans |
| `api.db.savedRoutes.getSavedRoutesList` | List bookmarks |
| `api.db.savedRoutes.getSavedRouteDetail` | Full route + enrichment |
| `api.db.favoriteRoads.list` | Favorite road segments |
| `api.db.routesPlan.getPlanInit` | Planning defaults |
| `api.db.route_enrichments.getEnrichmentStatus` | Enrichment job status |

### Mutations
| Function | Purpose |
|----------|---------|
| `api.db.planningSessions.createSession` | Start new session |
| `api.db.savedRoutes.saveRoute` | Bookmark route |
| `api.db.savedRoutes.renameRoute` | Rename |
| `api.db.savedRoutes.softDeleteRoute` | Schedule deletion |
| `api.db.savedRoutes.undoDeleteRoute` | Restore |
| `api.db.routePlans.cancelPlan` | Cancel in-flight |

### Actions (Server Functions)
| Function | Purpose |
|----------|---------|
| `api.actions.agent.sendMessage.sendMessage` | Send chat to Claude |
| `api.actions.agent.planRide.planRide` | Manual route planning |

---

## 6. Settings, Themes, Storage

**Theme:**
- `contexts/theme-preference.tsx` — `mode` (light/dark/auto), `isDark`, `setMode`, persisted via `theme_preference` AsyncStorage key
- `useSettingsStore` (Zustand + Persist) — themeMode, hasCompletedOnboarding, `_hydrated` flag prevents theme flash

**Session Storage:**
- `useChatSessionStore` — defaultCamera, bySession map, lastViewedSessionId, persisted as `laneshadow-chat-session`

**Async Storage Helpers:**
- `hooks/use-async-storage.ts` — getItem/setItem/removeItem/clearAll wrapper

**Styling:**
- `styles/theme.ts` — React Native Paper theme (colors, spacing, typography)
- `contexts/selected-route.tsx` — Route selection sync between map + transcript

---

## 7. Onboarding, Setup, Permissions

**Model Setup:**
- `screens/ModelSetupScreen.tsx` — AI model download/validation onboarding
- `hooks/useModelSetup.ts` — States: idle, checking, corrupted, downloading, ready

**Model Download:**
- `lib/ai/model-download.ts` — HTTP download with resume + SHA256 checksum (`expo-file-system`)
- `lib/ai/background-download-service.ts` — Native module bridge for background tasks
- `lib/ai/persistent-download-manager.ts` — High-level queue/progress

**Permission Requests:**
- `lib/notifier-helpers.ts` — Camera, location prompts (with denied state + Settings link)
- `expo-location` — Geolocation

**Download Store:**
- `useDownloadStore` (Zustand + Persist) — downloadProgress, modelMetadata

**Native Bridge:**
- `lib/ai/NativeMLXBridge.ts` — iOS/Android native MLX model inference
- `lib/ai/local-model.ts` — Local AI model wrapper
- `lib/ai/model-manifest.ts` — Manifest fetching/parsing

**Non-Obvious:**
- GGUF quantized LLM, runs locally via native MLX module
- SHA256 validation post-download
- HTTP Range header for resume

---

## 8. Discovery & Enrichment

**Hooks:**
- `hooks/use-route-enrichment.ts` — Triggers + polls
- `hooks/useEnrichmentStatus.ts` — Watches `status` → "completed", caches via `contentFingerprint`
- `hooks/useEnrichmentProgressCalculation.ts` — Aggregate progress

**Components:**
- `components/enrichment/enrichment-status-badge.tsx` — Visual indicator
- `components/discovery/` — Curated route browser

**Convex:**
- `api.db.routeEnrichments.createOrGetEnrichment` — Starts job, dedups via fingerprint
- `api.db.routeEnrichments.list` — Status query

**Data:**
- `route_enrichments` — routePlanId, contentFingerprint (geometry hash), phase, status, result

**Non-Obvious:**
- Fingerprint-based deduplication (cache hits if identical route)
- Phase progression: wind → conditions → terrain
- Optimistic stale data display while refetching

---

## 9. Sheets, Modals, Dev Tools

**Planning & Selection:**
- `components/sheets/plan-ride-sheet.tsx` — Manual planning (start/end inputs, scenic bias, avoid highways/tolls, departure time, favorite roads)
- `components/sheets/route-details-sheet.tsx` — Elevation profile, turn-by-turn, segments
- `components/sheets/planning-error-sheet.tsx` — Error recovery (try again / back)
- `components/sheets/planning-loading.tsx` — Manual planning progress

**Route Management:**
- `components/ui/save-favorite-sheet.tsx` — Save with name input + metadata

**Dev Tools:**
- `components/dev/DevMenu.tsx` — Long-press or env flag (clear cache, reset auth, view session logs)

**Other:**
- `components/waypoints/` — Add/edit waypoints
- `components/gatekeeper/` — Blocks access until model ready
- `components/toasts/` — Toast notifications
- `lib/toast-system.ts` — Toast manager
- `lib/notifier-helpers.ts` — Toast helpers

---

## 10. Top-Level App Routing

```
RootLayout (_layout.tsx)
├── ClerkProvider
│   └── ConvexProviderWithClerk
│       └── PaperProvider (Material Design)
│           └── SearchResultsProvider
│               └── BottomSheetModalProvider
│                   └── ModelGatekeeperProvider
│                       ├── (auth)
│                       │   ├── sign-in
│                       │   ├── oauth-callback
│                       │   └── tasks
│                       └── (app)
│                           ├── AppLayout (SelectedRouteProvider)
│                           │   ├── (tabs)
│                           │   │   ├── index (HomeMapScreen — ~1400 lines)
│                           │   │   ├── settings
│                           │   │   └── saved-routes
│                           │   ├── offline/regions-list
│                           │   └── offline/region-selector
│                           └── (Unauthenticated → redirect to sign-in)
```

| Route | Purpose |
|-------|---------|
| `/` | Auth gate, fetches sessions, redirects |
| `/(auth)/sign-in` | Email/OAuth login (multi-step) |
| `/(app)/(tabs)/index` | Main map + chat (chat/map toggle, route rendering, session switching) |
| `/(app)/(tabs)/settings` | Theme mode |
| `/(app)/(tabs)/saved-routes` | Browse/manage bookmarks |
| `/(app)/offline/regions-list` | Available offline regions |
| `/(app)/offline/region-selector` | Download UI |

**Navigation Features:**
- Auth gating via `Unauthenticated` component redirect
- Session auto-navigation: root `index.tsx` checks sessions, navigates
- URL params: `sessionId`, `chat=1` for deep linking
- Drawer taps update URL params (no full remount)

---

## Key External Dependencies

| Library | Usage |
|---------|-------|
| `expo-router` | File-based routing, deep links |
| `@clerk/clerk-expo` | OAuth, session management |
| `convex/react` | Queries, mutations, actions |
| `rnmapbox/maps` | Mapbox GL Native wrapper |
| `react-native-reanimated` | Animations (chat ↔ map crossfade) |
| `zustand` | State management |
| `@react-native-async-storage/async-storage` | Persistence |
| `react-native-paper` | UI components |
| `react-native-gesture-handler` | Touch handling |
| `@gorhom/bottom-sheet` | Modal sheets |
| `expo-location` | Geolocation |
| `expo-file-system` | File I/O (model download, offline maps) |
| `expo-crypto` | SHA256 checksums |
| `react-native-notifier` | Toast notifications |

---

## Non-Obvious Architecture Patterns

1. **State Machine + Zustand Hybrid** — `useRideFlow` (UI phases) decoupled from `useChatSessionStore` (persistent cache); no direct sync
2. **Optimistic Messages** — Client temp IDs replaced on server confirm; errors revert
3. **Camera Persistence Across Sessions** — Imperative ref call updates camera without full remount
4. **Chat ↔ Map Cross-Fade** — Reanimated `withTiming` opacity; map unmounts during chat to save GPU memory
5. **Fingerprint-Based Enrichment Caching** — Geometry hashed; identical routes reuse data
6. **Session Reuse for Refinements** — Second message reuses session ID
7. **Programmatic Move Flags** — Prevents saving user's camera during session switches
8. **Offline Maps + Fallback** — Background queue for tile fetches when online
9. **Model Gatekeeper** — Blocks app until model downloaded + validated
10. **Guard-Based State Machine** — Invalid transitions silently no-op

---

## Data Flow Examples

### Chat Planning Flow
```
User types "Plan a scenic ride"
  → handleSendMessage()
  → useChatPlanning.sendPlanningMessage()
    → Show optimistic message (temp ID)
    → Dispatch SEND_MESSAGE to flowState
    → createSession() if first, else reuse
    → Call api.actions.agent.sendMessage
  → Backend Claude processes
    → Reads conversation history
    → Invokes route planning tools
    → Creates route_plans entry
    → Streams status back
  → useActiveSessionRoute subscribes to route_plans
    → Detects completed plan
    → Triggers PLANNING_SUCCESS
  → flowState → ROUTE_RESULTS
    → Map shows polylines, RouteAttachmentCards render
```

### Route Save Flow
```
User taps "Save"
  → handleSaveRoutePress()
    → Build routeSnapshot (geometry, bounds)
    → Build routeIndex (fingerprint)
    → Build snapshotMeta (timestamp, overlay status)
    → Open SaveRouteSheet
  → User enters name + confirms
    → useSaveRoute().run()
    → api.db.savedRoutes.saveRoute mutation
    → Backend creates immutable saved_routes entry
  → Success toast + saved-routes tab updated
```

---

## Summary for Native Port Prioritization

1. **Navigation Architecture** — tab-based + deep linking + auth gating
2. **State Machine** — ride flow phase tracking (IDLE → PLANNING → RESULTS → DETAILS → SESSION_HISTORY → ERROR)
3. **Map Integration** — Mapbox native SDKs (already in v2 LSMap atom)
4. **Chat Orchestration** — session management + message streaming + optimistic UI
5. **Route Persistence** — Saved routes CRUD + camera cache
6. **Offline Support** — Map tiles + fallback rendering + background queue
7. **Auth** — Clerk OAuth + token storage + Convex integration
8. **Model Setup** — MLX download + validation + native bridge (deferable)
9. **Voice Input** — speech-to-intent (deferable)
10. **Discovery** — curated route browser (deferable)
