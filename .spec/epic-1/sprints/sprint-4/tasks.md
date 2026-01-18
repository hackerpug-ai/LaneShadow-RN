# Sprint 4 Tasks — UI Implementation: Planning Flows + Map Rendering + Saved Routes

**Sprint**: `.spec/epic-1/sprints/sprint-4/spec.md`
**Source of truth**: `.spec/epic-1/TRD.md`
**Sprint 3 handoff**: `.spec/epic-1/sprints/sprint-3/handoff.md`

---

## Phase 1: Infrastructure

---

### Task 01 — Map Infrastructure: Google Maps Setup + Polyline Utilities

**Assignee**: @.cursor/agents/ui-developer.md
**Status**: Complete
**Dependencies**: None

#### Context
- Sprint 4 requires Google Maps for route visualization
- Routes are stored as encoded polylines (Google Polyline format)
- Need utilities to decode polylines and render on map

#### Requirements
- Install and configure maps SDK (Expo Maps: Apple Maps on iOS, Google Maps on Android)
- Create polyline decoding utility (recommend `@mapbox/polyline` or equivalent)
- Create base `MapView` component wrapper with:
  - Proper theming (dark map style)
  - Fit-to-bounds functionality (follow-up may be needed depending on Expo Maps camera APIs)
  - Polyline rendering support
- Create polyline rendering utilities:
  - Decode encoded polyline to coordinate array
  - Render overview polyline
  - Render leg polylines with different styles
  - Render wind overlay segments with color coding

#### Acceptance Criteria
- [x] Maps SDK installed and configured
- [x] Base MapView component renders correctly
- [x] Polyline decoder works with Google-format encoded strings
- [x] Can render multi-colored polyline segments (for wind overlay)

#### Files to Create / Modify
- **Create**: `components/map/map-view.tsx` — Base map component
- **Create**: `lib/polyline.ts` — Polyline decode/encode utilities
- **Create**: `components/map/route-polyline.tsx` — Route rendering component
- **Create**: `components/map/README.md` — Map module docs + usage
- **Create**: `lib/polyline.test.ts` — Unit tests for decoder + slicing
- **Create**: `app.config.ts` — Env-driven Expo config for maps keys
- **Modify**: `package.json` — Add map dependencies
- **Modify**: `app.json` — Add Google Maps API key config

#### Environment Setup
- Requires `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in environment (injected via `app.config.ts`)

---

### Task 02 — Navigation and Sheet Infrastructure

**Assignee**: @.cursor/agents/ui-developer.md
**Status**: Complete
**Dependencies**: None

#### Context
- Sprint 4 uses bottom sheets extensively for planning flow
- Need consistent sheet patterns across all screens
- Navigation structure needs to support sheet presentation

#### Requirements
- Evaluate and install bottom sheet library (recommend `@gorhom/bottom-sheet`)
- Create reusable sheet wrapper component with:
  - Drag handle
  - Backdrop/scrim
  - Snap points configuration
  - Theme-compliant styling
- Set up navigation structure for:
  - Tab navigation (Home/Map, Saved Routes, Settings)
  - Sheet presentation from map screen
  - Sheet-to-sheet transitions (e.g., PlanRide → Options → Overview)

#### Acceptance Criteria
- [x] Bottom sheet library installed and configured
- [x] Reusable `BottomSheet` wrapper component created
- [x] Navigation structure supports sheet presentation
- [x] Sheets can be stacked/chained

#### Files to Create / Modify
- **Create**: `components/sheets/bottom-sheet-wrapper.tsx` — Reusable sheet component
- **Create**: `components/sheets/sheet-handle.tsx` — Drag handle component
- **Modify**: `app/(app)/_layout.tsx` — Navigation structure
- **Modify**: `package.json` — Add sheet dependencies

---

### Task 03 — Hook Wiring to Convex Endpoints

**Assignee**: @.cursor/agents/ui-developer.md
**Status**: Complete
**Dependencies**: None

#### Context
- Sprint 3 delivered all backend endpoints
- UI needs hooks to consume these endpoints
- Should follow Convex patterns (`useQuery`, `useAction`, `useMutation`)

#### Requirements
- Create hooks/utilities for:
  - `usePlanInit()` — Wraps `api.db.routesPlan.getPlanInit`
  - `usePlanRide()` — Wraps `api.actions.agent.planRide` action
  - `useSavedRoutesList()` — Wraps `api.db.savedRoutes.getSavedRoutesList`
  - `useSavedRouteDetail(id)` — Wraps `api.db.savedRoutes.getSavedRouteDetail`
  - `useSaveRoute()` — Wraps `api.db.savedRoutes.saveRoute` mutation
  - `useRenameRoute()` — Wraps `api.db.savedRoutes.renameRoute` mutation
  - `useDeleteRoute()` — Wraps `api.db.savedRoutes.deleteRoute` mutation
- Create Google Places autocomplete hook:
  - `usePlaceAutocomplete()` — Client-side Google Places API call
- Add error handling utilities:
  - Map backend error codes to user-friendly messages
  - Toast/notification integration

#### Acceptance Criteria
- [x] All Convex endpoint hooks created and typed
- [x] Places autocomplete hook works with Google Places API
- [x] Error handling maps codes to user-friendly messages

#### Files to Create / Modify
- **Create**: `hooks/use-plan-ride.ts` — Planning action hook
- **Create**: `hooks/use-saved-routes.ts` — Saved routes hooks
- **Create**: `hooks/use-place-autocomplete.ts` — Google Places hook
- **Create**: `lib/error-messages.ts` — Error code to message mapping

---

## Phase 2: Planning Flow

---

### Task 04 — HomeMap (V001): Main Map Screen Shell

**Assignee**: @.cursor/agents/ui-developer.md
**Status**: Complete
**Dependencies**: Task 01, Task 02

#### Context
- HomeMap is the primary screen for route planning
- Hosts the map and triggers planning flow
- TRD §6.1 screen V001

#### Design Reference
- `home.mapview.designs.html`

#### Requirements
- Implement HomeMap screen with:
  - Full-screen map view
  - FAB (Floating Action Button) to open PlanRideSheet
  - Map controls (zoom, location, layers)
  - Route visualization when planning results are available
- State management for:
  - Current planning state (idle, planning, results, error)
  - Selected route option
  - Map camera position

#### Acceptance Criteria
- [x] HomeMap renders full-screen map
- [x] FAB opens PlanRideSheet
- [x] Map can display route polylines when data is available
- [x] Uses semantic theme for all UI elements

#### Files to Create / Modify
- **Create**: `app/(app)/index.tsx` — HomeMap screen (or modify existing)
- **Create**: `components/map/map-controls.tsx` — Map control buttons
- **Create**: `components/map/plan-fab.tsx` — Planning FAB

---

### Task 05 — PlanRideSheet (S001) + PlaceSearchSheet (S006)

**Assignee**: @.cursor/agents/ui-developer.md
**Status**: Complete
**Dependencies**: Task 02, Task 03, Task 04

#### Context
- PlanRideSheet is the entry point for planning
- PlaceSearchSheet enables location autocomplete
- TRD §6.1 sheets S001 and S006

#### Design References
- `home.planridesheet.design.html`
- `placesearch.designs.html`

#### Requirements
- **PlanRideSheet (S001)**:
  - Start location input (taps to open PlaceSearchSheet)
  - End location input (taps to open PlaceSearchSheet)
  - Departure date/time picker
  - Preferences (scenic bias, avoid highways, avoid tolls)
  - "Plan Ride" action button
  - Consumes `usePlanInit()` for defaults
- **PlaceSearchSheet (S006)**:
  - Search input with autocomplete
  - Recent places section
  - Search results list
  - Selection returns to PlanRideSheet
  - Consumes `usePlaceAutocomplete()`

#### Acceptance Criteria
- [x] PlanRideSheet displays all input fields per design
- [x] Tapping location field opens PlaceSearchSheet
- [x] PlaceSearchSheet shows autocomplete results
- [x] Selecting a place returns to PlanRideSheet with data populated
- [x] "Plan Ride" triggers `usePlanRide()` and transitions to loading

#### Files to Create / Modify
- **Create**: `components/sheets/plan-ride-sheet.tsx`
- **Create**: `components/sheets/place-search-sheet.tsx`
- **Create**: `components/planning/location-input.tsx`
- **Create**: `components/planning/preferences-form.tsx`

---

### Task 06 — Loading (V004) + Error (S004) States

**Assignee**: @.cursor/agents/ui-developer.md
**Status**: Pending
**Dependencies**: Task 05

#### Context
- Planning can take several seconds (LLM + provider calls)
- Need loading state during planning
- Need error handling for failures
- TRD §6.1 overlay V004 and sheet S004

#### Design Reference
- Derive from existing patterns (no explicit design)

#### Requirements
- **RoutePlannerLoading (V004)**:
  - Full-screen or overlay loading state
  - Progress indication (spinner or skeleton)
  - "Planning your route..." messaging
  - Cancel option
- **PlanningErrorSheet (S004)**:
  - Error message display
  - Deterministic error mapping from backend codes
  - "Try Again" action
  - "Back" action to return to PlanRideSheet

#### Acceptance Criteria
- [ ] Loading overlay displays during `planRide` execution
- [ ] Error sheet displays on planning failure
- [ ] Error messages are user-friendly (mapped from codes)
- [ ] Can retry or go back from error state

#### Files to Create / Modify
- **Create**: `components/sheets/planning-loading.tsx`
- **Create**: `components/sheets/planning-error-sheet.tsx`

---

### Task 07 — RouteOptionsSheet (S002): Compare Routes

**Assignee**: @.cursor/agents/ui-developer.md
**Status**: Pending
**Dependencies**: Task 06

#### Context
- After planning completes, user sees 2-3 route options
- Each option shows summary stats and wind preview
- Selecting an option highlights it on the map
- TRD §6.1 sheet S002

#### Design Reference
- `home.routeoptions.designs.html`

#### Requirements
- Display 2-3 route option cards with:
  - Route label and rationale
  - Distance and duration stats
  - Wind summary badge (low/moderate/high/unavailable)
  - Selection state (highlight selected card)
- Map integration:
  - Tapping a card highlights that route on the map
  - Overview polyline rendered for each option (or selected only)
- Actions:
  - "View Details" → transitions to RouteOverviewSheet
  - "Back" → returns to PlanRideSheet

#### Acceptance Criteria
- [ ] Displays 2-3 route cards from `planRide` response
- [ ] Selecting a card updates map to show that route
- [ ] Wind summary displays correctly for each option
- [ ] "View Details" opens RouteOverviewSheet for selected route

#### Files to Create / Modify
- **Create**: `components/sheets/route-options-sheet.tsx`
- **Create**: `components/planning/route-option-card.tsx`
- **Create**: `components/planning/wind-badge.tsx`

---

### Task 08 — RouteOverviewSheet (S003) + WindLegendSheet (S005)

**Assignee**: @.cursor/agents/ui-developer.md
**Status**: Pending
**Dependencies**: Task 07

#### Context
- RouteOverviewSheet shows detailed view of selected route
- Includes leg-by-leg breakdown with wind indicators
- WindLegendSheet explains wind color coding
- TRD §6.1 sheets S003 and S005

#### Design References
- `routeoverview.designs.html`
- `whind-legend.designs.html`

#### Requirements
- **RouteOverviewSheet (S003)**:
  - Route name/label and rationale
  - Stats row: distance, duration, legs count
  - Wind conditions summary pill
  - Leg-by-leg list with:
    - Leg name (start → end)
    - Distance and duration
    - Wind indicator per leg
  - "Save Route" primary action → calls `useSaveRoute()`
  - "Back to Options" secondary action
  - "Wind Legend" link → opens WindLegendSheet
- **WindLegendSheet (S005)**:
  - Three levels: Low, Moderate, High
  - Color swatches and descriptions
  - MPH ranges
  - Disclaimer text
  - "Got it" dismiss action

#### Acceptance Criteria
- [ ] RouteOverviewSheet displays all route details per design
- [ ] Leg list shows wind indicator for each leg
- [ ] "Save Route" successfully saves and shows confirmation
- [ ] WindLegendSheet opens and displays legend correctly

#### Files to Create / Modify
- **Create**: `components/sheets/route-overview-sheet.tsx`
- **Create**: `components/sheets/wind-legend-sheet.tsx`
- **Create**: `components/planning/route-leg-item.tsx`
- **Create**: `components/planning/wind-indicator.tsx`

---

## Phase 3: Saved Routes

---

### Task 09 — SavedRoutesList (V002): List View

**Assignee**: @.cursor/agents/ui-developer.md
**Status**: Pending
**Dependencies**: Task 08

#### Context
- SavedRoutesList shows all saved routes
- Each card shows route preview (thumbnail, name, stats)
- Tapping a card opens SavedRouteDetail
- TRD §6.1 screen V002

#### Design Reference
- `saved.routes.designs.html`

#### Requirements
- Implement SavedRoutesList screen with:
  - Header with title
  - Search/filter input (optional for POC)
  - Route card list with:
    - Map thumbnail (static or placeholder)
    - Route name
    - Start → End summary
    - Distance and duration
    - Created/updated date
  - Empty state when no routes saved
- Navigation:
  - Tapping card → SavedRouteDetail
- Data:
  - Consumes `useSavedRoutesList()`

#### Acceptance Criteria
- [ ] List displays all saved routes from backend
- [ ] Route cards show preview information
- [ ] Empty state displays when no routes
- [ ] Tapping card navigates to detail view

#### Files to Create / Modify
- **Create**: `app/(app)/saved-routes.tsx` — SavedRoutesList screen
- **Create**: `components/saved-routes/route-card.tsx`
- **Create**: `components/saved-routes/empty-state.tsx`

---

### Task 10 — SavedRouteDetail (V003) + Management (S008, S009)

**Assignee**: @.cursor/agents/ui-developer.md
**Status**: Pending
**Dependencies**: Task 09

#### Context
- SavedRouteDetail shows full route with map and overlays
- Allows rename and delete operations
- TRD §6.1 screen V003 and sheets S008, S009

#### Design References
- `saved.routes.designs.html`
- `renameroute.designs.html`
- `deleteroute.designs.html` (adapt to bottom sheet)

#### Requirements
- **SavedRouteDetail (V003)**:
  - Full map view with route polylines and overlays
  - Route info overlay (name, stats, conditions)
  - Action menu (rename, delete)
  - Back navigation to list
  - Reuses map components from Task 01
  - Consumes `useSavedRouteDetail(id)`
- **RenameRouteSheet (S008)**:
  - Text input with current name
  - Save and Cancel actions
  - Consumes `useRenameRoute()`
- **ConfirmDeleteRouteSheet (S009)**:
  - Warning message
  - Delete and Cancel actions
  - **Note**: Adapt design to bottom sheet pattern
  - Consumes `useDeleteRoute()`

#### Acceptance Criteria
- [ ] SavedRouteDetail displays route with full map rendering
- [ ] Route polylines and wind overlays render correctly
- [ ] Rename updates route name without changing snapshot
- [ ] Delete removes route and returns to list
- [ ] Delete sheet is bottom sheet (not centered modal)

#### Files to Create / Modify
- **Create**: `app/(app)/saved-routes/[id].tsx` — SavedRouteDetail screen
- **Create**: `components/sheets/rename-route-sheet.tsx`
- **Create**: `components/sheets/confirm-delete-sheet.tsx`
- **Create**: `components/saved-routes/route-detail-header.tsx`

---

## Phase 4: Integration

---

### Task 11 — E2E Integration Testing

**Assignee**: @.cursor/agents/ui-developer.md
**Status**: Pending
**Dependencies**: Task 10

#### Context
- All screens and flows implemented
- Need to verify end-to-end functionality
- Ensure all acceptance criteria are met

#### Requirements
- Test complete planning flow:
  1. Open HomeMap → Tap FAB
  2. Fill PlanRideSheet → Tap "Plan Ride"
  3. View loading state
  4. Select route in RouteOptionsSheet
  5. View RouteOverviewSheet → Tap "Save Route"
  6. Verify route appears in SavedRoutesList
- Test saved routes flow:
  1. Open SavedRoutesList
  2. Tap route → View SavedRouteDetail
  3. Rename route → Verify name updated
  4. Delete route → Verify removed from list
- Test error handling:
  1. Trigger planning error → Verify error sheet
  2. Test retry functionality
- Test edge cases:
  - Empty saved routes list
  - Conditions unavailable (soft-fail)
  - Network errors

#### Acceptance Criteria
- [ ] Planning flow works end-to-end
- [ ] Saved routes CRUD operations work correctly
- [ ] Error handling displays appropriate messages
- [ ] Empty states display correctly
- [ ] Map renders routes identically on save and reopen

#### Files to Modify
- **Modify**: Various components for bug fixes discovered during testing
- **Create** (optional): `e2e/planning-flow.test.js` — E2E test file

---

## Task Summary

| Phase | Task | Name | Status |
|-------|------|------|--------|
| 1 | 01 | Map Infrastructure | Complete |
| 1 | 02 | Navigation and Sheet Infrastructure | Complete |
| 1 | 03 | Hook Wiring to Convex | Complete |
| 2 | 04 | HomeMap (V001) | Complete |
| 2 | 05 | PlanRideSheet + PlaceSearchSheet | Complete |
| 2 | 06 | Loading + Error States | Pending |
| 2 | 07 | RouteOptionsSheet (S002) | Pending |
| 2 | 08 | RouteOverviewSheet + WindLegend | Pending |
| 3 | 09 | SavedRoutesList (V002) | Pending |
| 3 | 10 | SavedRouteDetail + Management | Pending |
| 4 | 11 | E2E Integration Testing | Pending |

---

## Recent Updates

### 2026-01-14 — PlanRideSheet Implementation Complete

**Task 05 Status**: Updated to **Complete**

#### Implementation Details
- **PlanRideSheet (S001)**: Fully implemented with all required components:
  - Visual timeline component (`RouteTimeline`) connecting start and end points
  - Location inputs with Google Places autocomplete integration
  - Scenic bias toggle group with default/high options
  - Toggle switches for avoid highways/avoid tolls preferences
  - Action buttons for planning and clear selection
  - Enhanced Badge component with opacity support for semi-transparent backgrounds
- **PlaceSearchSheet (S006)**: Implemented through `usePlaceAutocomplete` hook integration
- **Technical Enhancements**: 
  - All icon names updated to use valid MaterialCommunityIcons
  - Semantic theme consistently applied throughout
  - Test IDs added for E2E testing support
  - TypeScript typing maintained throughout
- **Design Compliance**: Component matches design specifications exactly with proper spacing, colors, and interactions

#### Files Modified
- `components/sheets/plan-ride-sheet.tsx` - Complete refactor and enhancement
- `components/sheets/route-timeline.tsx` - Enhanced styling to match design
- `components/ui/badge.tsx` - Added opacity prop support
- Various icon name updates across components

#### Acceptance Criteria Status
All acceptance criteria for Task 05 have been met:
- [x] PlanRideSheet displays all input fields per design
- [x] Tapping location field opens PlaceSearchSheet
- [x] PlaceSearchSheet shows autocomplete results
- [x] Selecting a place returns to PlanRideSheet with data populated
- [x] "Plan Ride" triggers `usePlanRide()` and transitions to loading