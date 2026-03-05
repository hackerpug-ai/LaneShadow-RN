# TRD: Implementation Map

**Status**: 🗺️ Reference Document
**Last Updated**: 2026-01-30

This document provides the definitive mapping between TRD specifications and actual code locations. Use this as a quick reference when implementing features or debugging issues.

---

## 1. Directory Structure Overview

```
/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (auth + providers)
│   ├── index.tsx                 # Entry redirect
│   ├── (auth)/                   # Auth screens
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   └── (app)/                    # Authenticated app
│       └── (tabs)/               # Tab navigator
│           ├── index.tsx         # HomeMap (V001)
│           ├── saved-routes.tsx  # SavedRoutesList (V002)
│           └── settings.tsx      # Settings (V006)
│
├── components/                   # Reusable components
│   ├── auth/                     # Auth components
│   ├── layouts/                  # Layout wrappers
│   ├── map/                      # Map components
│   ├── planning/                 # Planning UI
│   ├── sheets/                   # Bottom sheets
│   └── ui/                       # Design system primitives
│
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema
│   ├── auth.config.ts            # Clerk JWT config
│   ├── http.ts                   # HTTP routes (webhooks)
│   ├── users.ts                  # User queries/mutations
│   ├── db/                       # Database functions
│   │   ├── routesPlan.ts         # Planning queries
│   │   ├── savedRoutes.ts        # Saved routes CRUD
│   │   ├── clerkSync.ts          # Clerk webhook handlers
│   │   └── viewer.ts             # Auth helpers
│   └── actions/                  # Server actions
│       ├── users.ts              # User profile actions
│       └── agent/                # AI planning pipeline
│           ├── planRide.ts       # Main entry point
│           ├── planningGraph.ts  # LangGraph state machine
│           ├── tools/            # Pipeline tools
│           ├── providers/        # External API clients
│           └── lib/              # Utilities
│
├── hooks/                        # Custom React hooks
│   ├── use-plan-ride.ts
│   ├── use-saved-routes.ts
│   ├── use-place-autocomplete.ts
│   └── use-semantic-theme.ts
│
├── lib/                          # Shared utilities
│   ├── convex-error.ts           # Error parsing
│   ├── error-messages.ts         # User-facing messages
│   ├── clerk-backend.ts          # Clerk server client
│   └── ...
│
├── models/                       # Data models (validators)
│   ├── users.ts                  # User types
│   ├── saved-routes.ts           # Route types
│   ├── route-sketch.ts           # LLM output types
│   ├── orgs.ts                   # Org types
│   └── org-memberships.ts        # Membership types
│
├── types/                        # TypeScript types
│   ├── index.ts                  # Utility types
│   └── routes.ts                 # View model types
│
└── .spec/epics/epic-1/           # Epic documentation
    ├── PRD.md
    ├── trd/                      # Technical requirements
    └── designs/                  # Design artifacts
        ├── mocks/                # HTML mockups
        └── prompts/              # Design specs
```

---

## 2. Backend Module Map

### 2.1 Schema & Validators

| Concept | Schema Location | Validator Location |
|---------|-----------------|-------------------|
| Users table | `convex/schema.ts:users` | `models/users.ts` |
| Orgs table | `convex/schema.ts:orgs` | `models/orgs.ts` |
| Org memberships | `convex/schema.ts:org_memberships` | `models/org-memberships.ts` |
| Saved routes | `convex/schema.ts:saved_routes` | `models/saved-routes.ts` |
| Route stops | — | `models/saved-routes.ts:routeStopSchema` |
| Plan input | — | `models/saved-routes.ts:planInputSchema` |
| Plan preferences | — | `models/saved-routes.ts:planPreferencesSchema` |
| Route snapshot | — | `models/saved-routes.ts:routeSnapshotSchema` |
| Route index | — | `models/saved-routes.ts:routeIndexSchema` |
| Wind overlay | — | `models/saved-routes.ts:windOverlaySchema` |
| Route sketch | — | `models/route-sketch.ts:routeSketchSchema` |

### 2.2 Queries

| Function | File | Line | Auth |
|----------|------|------|------|
| `users.list` | `convex/users.ts` | — | None |
| `users.getSession` | `convex/users.ts` | — | Required |
| `routesPlan.getPlanInit` | `convex/db/routesPlan.ts` | — | Required |
| `savedRoutes.getSavedRoutesList` | `convex/db/savedRoutes.ts` | — | Required |
| `savedRoutes.getSavedRouteDetail` | `convex/db/savedRoutes.ts` | — | Required |

### 2.3 Mutations

| Function | File | Type | Auth |
|----------|------|------|------|
| `users.create` | `convex/users.ts` | Public | None |
| `users.upsertCurrent` | `convex/users.ts` | Internal | Internal |
| `savedRoutes.saveRoute` | `convex/db/savedRoutes.ts` | Public | Required |
| `savedRoutes.renameRoute` | `convex/db/savedRoutes.ts` | Public | Required |
| `savedRoutes.deleteRoute` | `convex/db/savedRoutes.ts` | Public | Required |
| `savedRoutes.insert` | `convex/db/savedRoutes.ts` | Internal | Internal |
| `savedRoutes.patchName` | `convex/db/savedRoutes.ts` | Internal | Internal |
| `savedRoutes.deleteById` | `convex/db/savedRoutes.ts` | Internal | Internal |
| `clerkSync.internalUpsertUserFromClerk` | `convex/db/clerkSync.ts` | Internal | Internal |

### 2.4 Actions

| Function | File | External Calls |
|----------|------|----------------|
| `agent.planRide` | `convex/actions/agent/planRide.ts` | LLM, Google Routes, Open-Meteo |
| `users.updateCurrentProfile` | `convex/actions/users.ts` | Clerk API |

---

## 3. Agent Pipeline Map

### 3.1 Entry Point

```
convex/actions/agent/planRide.ts
  └── runPlanningGraph(planInput)
        └── planningGraph.ts (LangGraph StateGraph)
```

### 3.2 Graph Nodes

| Node | File | Purpose | External |
|------|------|---------|----------|
| `generateSketches` | `planningGraph.ts` | LLM route generation | OpenAI GPT-4O |
| `processRoutes` | `planningGraph.ts` | Orchestrates tools | — |

### 3.3 Tools

| Tool | File | Purpose |
|------|------|---------|
| `compileSketch` | `tools/compileSketch.ts` | Convert sketch to route via Google Routes |
| `normalizeRoute` | `tools/normalizeRoute.ts` | Transform provider response to RouteSnapshot |
| `computeRouteIndex` | `tools/computeRouteIndex.ts` | Sample geometry for spatial queries |
| `probeConditions` | `tools/probeConditions.ts` | Fetch wind data at route points |
| `mapConditions` | `tools/mapConditions.ts` | Assign wind levels to route legs |

### 3.4 Providers

| Provider | File | API |
|----------|------|-----|
| Routing | `providers/routingProvider.ts` | Google Routes API v2 |
| Weather | `providers/weatherProvider.ts` | Open-Meteo Forecast API |

### 3.5 Library Utilities

| Utility | File | Purpose |
|---------|------|---------|
| `retryOnce` | `lib/reliability.ts` | Retry failed operations once |
| `withTimeout` | `lib/reliability.ts` | Enforce execution deadlines |
| `createConcurrencyLimiter` | `lib/reliability.ts` | Limit parallel requests |
| LangSmith tracer | `lib/tracing.ts` | Observability integration |

---

## 4. Frontend Component Map

### 4.1 Screen Components

| Screen ID | Name | Component | Status |
|-----------|------|-----------|--------|
| V001 | HomeMap | `app/(app)/(tabs)/index.tsx` | ✅ Built |
| V002 | SavedRoutesList | `app/(app)/(tabs)/saved-routes.tsx` | 🔶 Placeholder |
| V003 | SavedRouteDetail | — | ❌ Not Built |
| V004 | RoutePlannerLoading | `components/sheets/planning-loading.tsx` | ✅ Built |
| V005 | EmptyState | `components/ui/empty-state.tsx` | ✅ Built |
| V006 | Settings | `app/(app)/(tabs)/settings.tsx` | 🔶 Placeholder |
| V007 | LegalAbout | — | ❌ Not Built |
| V008 | AuthSignIn | `app/(auth)/sign-in.tsx` | ✅ Built |
| V009 | AuthSignUp | `app/(auth)/sign-up.tsx` | ✅ Built |
| V010 | SessionRestoring | `components/auth/session-restoring.tsx` | ✅ Built |

### 4.2 Sheet Components

| Sheet ID | Name | Component | Status |
|----------|------|-----------|--------|
| S001 | PlanRideSheet | `components/sheets/plan-ride-sheet.tsx` | ✅ Built |
| S002 | RouteOptionsSheet | `components/sheets/route-options-sheet.tsx` | ✅ Built |
| S003 | RouteOverviewSheet | — | ❌ Not Built |
| S004 | PlanningErrorSheet | `components/sheets/planning-error-sheet.tsx` | ✅ Built |
| S005 | WindLegendSheet | — | ❌ Not Built |
| S005a | RainLegendSheet | — | ❌ Not Built |
| S005b | TemperatureLegendSheet | — | ❌ Not Built |
| S006 | PlaceSearchSheet | — | ❌ Not Built |
| S007 | AnnotationDetailSheet | — | ❌ Not Built |
| S008 | RenameRouteSheet | — | ❌ Not Built |
| S009 | ConfirmDeleteRouteSheet | — | ❌ Not Built |

### 4.3 Map Components

| Component | File | Purpose |
|-----------|------|---------|
| MapView | `components/map/map-view.tsx` | Map container with imperative handle |
| MapControls | `components/map/map-controls.tsx` | Zoom/recenter buttons |
| MapHeaderOverlay | `components/map/map-header-overlay.tsx` | Top overlay with menu |
| RoutePolyline | `components/map/route-polyline.tsx` | Polyline helpers |
| WhereToBar | `components/map/where-to-bar.tsx` | Floating search input |
| PlanFab | `components/map/plan-fab.tsx` | Floating action button |

### 4.4 Planning Components

| Component | File | Purpose |
|-----------|------|---------|
| RouteOptionCard | `components/planning/route-option-card.tsx` | Route option display |
| WindBadge | `components/planning/wind-badge.tsx` | Wind level indicator |
| RouteTimeline | `components/sheets/route-timeline.tsx` | Leg-by-leg timeline |

### 4.5 UI Primitives

| Category | Location | Components |
|----------|----------|------------|
| Buttons | `components/ui/button.tsx` | Button variants |
| Inputs | `components/ui/input.tsx` | Text inputs |
| Cards | `components/ui/card.tsx` | Container cards |
| Badges | `components/ui/badge.tsx` | Status badges |
| Chips | `components/ui/chip.tsx` | Tag chips |
| Icons | `components/ui/icon-symbol.tsx` | Cross-platform icons |
| Skeleton | `components/ui/skeleton.tsx` | Loading placeholders |
| Toggle | `components/ui/toggle.tsx` | Toggle buttons |
| Switch | `components/ui/switch.tsx` | Toggle switches |
| Slider | `components/ui/slider.tsx` | Numeric sliders |
| Progress | `components/ui/progress.tsx` | Progress bars |
| Avatar | `components/ui/avatar.tsx` | User avatars |
| Separator | `components/ui/separator.tsx` | Dividers |
| Banner | `components/ui/banner.tsx` | Alert banners |
| Collapsible | `components/ui/collapsible.tsx` | Expandable sections |
| ScenicBias | `components/ui/scenic-bias-segmented.tsx` | Route style selector |

---

## 5. Hook Map

| Hook | File | Purpose | Returns |
|------|------|---------|---------|
| `usePlanInit` | `hooks/use-plan-ride.ts` | Fetch default preferences | `{ data, isLoading }` |
| `usePlanRide` | `hooks/use-plan-ride.ts` | Execute route planning | `{ planRide, isRunning, error }` |
| `useSavedRoutes` | `hooks/use-saved-routes.ts` | Fetch saved routes | `{ routes, isLoading }` |
| `usePlaceAutocomplete` | `hooks/use-place-autocomplete.ts` | Google Places search | `{ results, isLoading }` |
| `useSemanticTheme` | `hooks/use-semantic-theme.ts` | Access theme tokens | `SemanticTheme` |
| `useColorScheme` | — (Expo) | Detect light/dark | `'light' \| 'dark'` |
| `useOAuthFlow` | `hooks/use-oauth-flow.ts` | OAuth flow handler | OAuth methods |

---

## 6. Type Definition Map

### 6.1 Model Types (Zod → Convex validators)

| Type | File | Convex Validator |
|------|------|------------------|
| `RouteStop` | `models/saved-routes.ts` | `v.routeStop` |
| `PlanPreferences` | `models/saved-routes.ts` | `v.planPreferences` |
| `PlanInput` | `models/saved-routes.ts` | `v.planInput` |
| `PolylineGeometry` | `models/saved-routes.ts` | `v.polylineGeometry` |
| `RouteLeg` | `models/saved-routes.ts` | `v.routeLeg` |
| `RouteAnnotation` | `models/saved-routes.ts` | `v.routeAnnotation` |
| `WindOverlay` | `models/saved-routes.ts` | `v.windOverlay` |
| `RouteSnapshot` | `models/saved-routes.ts` | `v.routeSnapshot` |
| `RouteIndex` | `models/saved-routes.ts` | `v.routeIndex` |
| `SnapshotMeta` | `models/saved-routes.ts` | `v.snapshotMeta` |
| `RouteSketch` | `models/route-sketch.ts` | — (LLM output only) |

### 6.2 View Model Types

| Type | File | Purpose |
|------|------|---------|
| `PlanInitView` | `types/routes.ts` | Planning defaults |
| `PlannedRouteOptionView` | `types/routes.ts` | Single route option |
| `PlannedRouteOptionsView` | `types/routes.ts` | Planning result |
| `SavedRouteListItemView` | `types/routes.ts` | List item |
| `SavedRoutesListView` | `types/routes.ts` | List response |
| `SavedRouteDetailView` | `types/routes.ts` | Full route detail |
| `SavedRouteCapabilities` | `types/routes.ts` | Permission flags |

### 6.3 Enum Constants

| Enum | File | Values |
|------|------|--------|
| `OWNER_TYPE` | `models/saved-routes.ts` | `"user" \| "group" \| "org"` |
| `VISIBILITY` | `models/saved-routes.ts` | `"private" \| "shared" \| "public"` |
| `SCENIC_BIAS` | `models/saved-routes.ts` | `"default" \| "high"` |
| `WIND_SUMMARY` | `models/saved-routes.ts` | `"low" \| "moderate" \| "high" \| "unavailable"` |
| `CONDITIONS_STATUS` | `models/saved-routes.ts` | `"ok" \| "unavailable"` |

---

## 7. Design Artifact Map

### 7.1 Mockups

| Screen ID | Name | Mockup Path |
|-----------|------|-------------|
| V001 | HomeMap | `designs/mocks/home_map.mobile.html` |
| V002 | SavedRoutesList | `designs/mocks/saved_routes_list.mobile.html` |
| V003 | SavedRouteDetail | `designs/mocks/saved_route_detail.mobile.html` |
| V004 | RoutePlannerLoading | `designs/mocks/route_planner_loading.mobile.html` |
| V005 | EmptyState | `designs/mocks/empty_state.mobile.html` |
| V006 | Settings | `designs/mocks/settings.mobile.html` |
| V007 | LegalAbout | `designs/mocks/legal_about.mobile.html` |
| V008 | AuthSignIn | `designs/mocks/auth_sign_in.mobile.html` |
| V009 | AuthSignUp | `designs/mocks/auth_sign_up.mobile.html` |
| V010 | SessionRestoring | `designs/mocks/session_restoring.mobile.html` |
| S001 | PlanRideSheet | `designs/mocks/plan_ride_sheet.mobile.html` |
| S002 | RouteOptionsSheet | `designs/mocks/route_options_sheet.mobile.html` |
| S003 | RouteOverviewSheet | `designs/mocks/route_overview_sheet.mobile.html` |
| S004 | PlanningErrorSheet | `designs/mocks/planning_error_sheet.mobile.html` |
| S005 | WindLegendSheet | `designs/mocks/wind_legend_sheet.mobile.html` |
| S005a | RainLegendSheet | `designs/mocks/rain_legend_sheet.mobile.html` |
| S005b | TemperatureLegendSheet | `designs/mocks/temperature_legend_sheet.mobile.html` |
| S006 | PlaceSearchSheet | `designs/mocks/place_search_sheet.mobile.html` |
| S007 | AnnotationDetailSheet | `designs/mocks/annotation_detail_sheet.mobile.html` |
| S008 | RenameRouteSheet | `designs/mocks/rename_route_sheet.mobile.html` |
| S009 | ConfirmDeleteRouteSheet | `designs/mocks/confirm_delete_route_sheet.mobile.html` |

### 7.2 Design Specs

| Artifact | Path | Purpose |
|----------|------|---------|
| Master design | `designs/design.stitch.json` | Full design system |
| Screen prompts | `designs/prompts/*.mobile.stitch.json` | Per-screen specs |
| Manifest | `designs/prompts/manifest.json` | Screen inventory |

---

## 8. Environment & Configuration

### 8.1 Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `CONVEX_DEPLOYMENT` | Convex project ID | Yes |
| `EXPO_PUBLIC_CONVEX_URL` | Convex HTTP URL | Yes |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key | Yes |
| `CLERK_SECRET_KEY` | Clerk backend key | Backend only |
| `OPENAI_API_KEY` | OpenAI API access | Backend only |
| `GOOGLE_ROUTES_API_KEY` | Google Routes API | Backend only |
| `LANGSMITH_API_KEY` | LangSmith tracing | Optional |
| `LANGSMITH_PROJECT` | LangSmith project name | Optional |

### 8.2 Configuration Files

| File | Purpose |
|------|---------|
| `convex/auth.config.ts` | Clerk JWT issuer config |
| `app.json` | Expo app config |
| `tsconfig.json` | TypeScript config |
| `convex.json` | Convex project config |

---

## 9. Testing Map

### 9.1 Test Locations

| Category | Location | Framework |
|----------|----------|-----------|
| Unit tests | `**/__tests__/*.test.ts` | Vitest |
| Component tests | `components/__tests__/` | React Native Testing Library |
| E2E tests | `e2e/` | Maestro |

### 9.2 Test Utilities

| Utility | Location | Purpose |
|---------|----------|---------|
| Mock providers | `test/mocks/` | Provider mocks |
| Test fixtures | `test/fixtures/` | Sample data |
| Test helpers | `test/helpers/` | Shared utilities |

---

## 10. Quick Reference

### Finding Code by Feature

| Feature | Backend | Frontend | Types |
|---------|---------|----------|-------|
| Route planning | `convex/actions/agent/` | `components/sheets/plan-ride-sheet.tsx` | `models/saved-routes.ts` |
| Route options | `planRide.ts` | `components/sheets/route-options-sheet.tsx` | `types/routes.ts` |
| Saving routes | `convex/db/savedRoutes.ts` | `hooks/use-saved-routes.ts` | `models/saved-routes.ts` |
| Wind overlay | `tools/mapConditions.ts` | `components/planning/wind-badge.tsx` | `models/saved-routes.ts` |
| Auth | `convex/users.ts` | `app/(auth)/` | `models/users.ts` |
| Map rendering | — | `components/map/` | — |
| Design tokens | — | `components/ui/semantic-theme.tsx` | — |

### Finding Code by TRD Section

| TRD Section | Primary Files |
|-------------|---------------|
| §3 Data Model | `convex/schema.ts`, `models/*.ts` |
| §4 API Contracts | `convex/db/*.ts`, `types/routes.ts` |
| §5 Agent Pipeline | `convex/actions/agent/` |
| §6 UI Requirements | `components/sheets/`, `app/(app)/` |
| §7 Map Rendering | `components/map/` |
| Design System | `components/ui/`, `trd/design-system.md` |
