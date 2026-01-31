# TRD: LaneShadow v1.0

Technical Requirements Documentation for the LaneShadow motorcycle scenic route planner.

## Document Index

| Document | Phase | Status | Description |
|----------|-------|--------|-------------|
| [phase-1-core.md](./phase-1-core.md) | Phase 1 | ✅ Implemented | Core planning, wind overlay, save/reopen |
| [phase-2-personalization.md](./phase-2-personalization.md) | Phase 2 | 📋 Planned | Favorite roads, avoid areas, elevation |
| [phase-3-post-ride.md](./phase-3-post-ride.md) | Phase 3 | 📋 Planned | Ratings, notes, ride history |
| [design-system.md](./design-system.md) | All | 📐 Reference | UI components, design tokens, patterns |

## Architecture Overview

LaneShadow uses a **phased architecture** that builds incrementally:

```
Phase 1 (Core)          Phase 2 (Personalization)     Phase 3 (Post-Ride)
┌─────────────────┐     ┌─────────────────────┐       ┌─────────────────┐
│ Route Planning  │     │ User Preferences    │       │ Ride History    │
│ Weather Overlays│ ──► │ Favorite Roads      │ ────► │ Ratings/Notes   │
│ Save/Reopen     │     │ Avoid Areas         │       │ Analytics       │
│ Auth            │     │ Elevation Profile   │       │ Time Optimization│
└─────────────────┘     └─────────────────────┘       └─────────────────┘
```

## Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Client | React Native + Expo | iOS/Android/Web |
| Backend | Convex | Serverless, type-safe |
| Auth | Clerk | OAuth + email/password |
| AI/LLM | LangGraph + OpenAI GPT-4O | Route sketching |
| Maps | Google Maps | Via react-native-maps |
| Weather | Open-Meteo | Free, no API key |

## Data Model Summary

### Phase 1 Tables (Implemented)
- `users` - Clerk-synced user accounts
- `orgs` - Organization containers
- `org_memberships` - User-org relationships
- `saved_routes` - Immutable route snapshots

### Phase 2 Tables (Planned)
- `user_preferences` - Route generation preferences
- `favorite_roads` - Saved road segments

### Phase 3 Tables (Planned)
- `ride_history` - Completed ride records
- `route_ratings` - User ratings and notes

## API Surface Area

### Phase 1 (Implemented)
```
db.routesPlan.getPlanInit
db.savedRoutes.getSavedRoutesList
db.savedRoutes.getSavedRouteDetail
db.savedRoutes.saveRoute
db.savedRoutes.renameRoute
db.savedRoutes.deleteRoute
actions.agent.planRide
```

### Phase 2 (Planned)
```
db.userPreferences.get
db.userPreferences.update
db.favoriteRoads.list
db.favoriteRoads.add
db.favoriteRoads.remove
```

### Phase 3 (Planned)
```
db.rideHistory.list
db.rideHistory.getDetail
db.savedRoutes.rateRoute
db.savedRoutes.addNotes
```

## Cross-Phase Principles

1. **Additive Only** - New phases add tables/endpoints without modifying Phase 1 contracts
2. **Backward Compatible** - Existing saved routes remain valid
3. **Provider Agnostic** - Geometry/overlay formats support multiple providers
4. **Immutable Snapshots** - Route snapshots never change after save
5. **Graceful Degradation** - Missing data (preferences, history) doesn't break core flows

## Sprint Mapping

| Sprint | Phase | Focus |
|--------|-------|-------|
| 1-3 | Phase 1 | Backend infrastructure |
| 4-5 | Phase 1 | UI implementation + weather overlays |
| 6 | Phase 2 | Preferences + favorites |
| 7 | Phase 2 | Elevation + comparison |
| 8-9 | Phase 3 | Post-ride + history |

## Design References

All screens and sheets have corresponding HTML mockups in `../designs/mocks/`. These mockups follow the LaneShadow design paradigm: dark mode, copper (#B87333) primary, Space Grotesk + Inter typography.

### Phase 1 - Core POC

| Screen ID | Name | Design Mockup |
|-----------|------|---------------|
| V001 | HomeMap | [home_map.mobile.html](../designs/mocks/home_map.mobile.html) |
| V002 | SavedRoutesList | [saved_routes_list.mobile.html](../designs/mocks/saved_routes_list.mobile.html) |
| V003 | SavedRouteDetail | [saved_route_detail.mobile.html](../designs/mocks/saved_route_detail.mobile.html) |
| V004 | RoutePlannerLoading | [route_planner_loading.mobile.html](../designs/mocks/route_planner_loading.mobile.html) |
| V005 | EmptyState | [empty_state.mobile.html](../designs/mocks/empty_state.mobile.html) |
| V006 | Settings | [settings.mobile.html](../designs/mocks/settings.mobile.html) |
| V007 | LegalAbout | [legal_about.mobile.html](../designs/mocks/legal_about.mobile.html) |
| V008 | AuthSignIn | [auth_sign_in.mobile.html](../designs/mocks/auth_sign_in.mobile.html) |
| V009 | AuthSignUp | [auth_sign_up.mobile.html](../designs/mocks/auth_sign_up.mobile.html) |
| V010 | SessionRestoring | [session_restoring.mobile.html](../designs/mocks/session_restoring.mobile.html) |
| S001 | PlanRideSheet | [plan_ride_sheet.mobile.html](../designs/mocks/plan_ride_sheet.mobile.html) |
| S002 | RouteOptionsSheet | [route_options_sheet.mobile.html](../designs/mocks/route_options_sheet.mobile.html) |
| S003 | RouteOverviewSheet | [route_overview_sheet.mobile.html](../designs/mocks/route_overview_sheet.mobile.html) |
| S004 | PlanningErrorSheet | [planning_error_sheet.mobile.html](../designs/mocks/planning_error_sheet.mobile.html) |
| S005 | WindLegendSheet | [wind_legend_sheet.mobile.html](../designs/mocks/wind_legend_sheet.mobile.html) |
| S005a | RainLegendSheet | [rain_legend_sheet.mobile.html](../designs/mocks/rain_legend_sheet.mobile.html) |
| S005b | TemperatureLegendSheet | [temperature_legend_sheet.mobile.html](../designs/mocks/temperature_legend_sheet.mobile.html) |
| S006 | PlaceSearchSheet | [place_search_sheet.mobile.html](../designs/mocks/place_search_sheet.mobile.html) |
| S007 | AnnotationDetailSheet | [annotation_detail_sheet.mobile.html](../designs/mocks/annotation_detail_sheet.mobile.html) |
| S008 | RenameRouteSheet | [rename_route_sheet.mobile.html](../designs/mocks/rename_route_sheet.mobile.html) |
| S009 | ConfirmDeleteRouteSheet | [confirm_delete_route_sheet.mobile.html](../designs/mocks/confirm_delete_route_sheet.mobile.html) |

### Phase 2 - Personalization

| Screen ID | Name | Design Mockup |
|-----------|------|---------------|
| V011 | PreferencesScreen | [preferences_screen.mobile.html](../designs/mocks/preferences_screen.mobile.html) |
| V012 | AvoidAreasScreen | [avoid_areas_screen.mobile.html](../designs/mocks/avoid_areas_screen.mobile.html) |
| V013 | FavoriteRoadsScreen | [favorite_roads_screen.mobile.html](../designs/mocks/favorite_roads_screen.mobile.html) |
| S010 | AddAvoidAreaSheet | [add_avoid_area_sheet.mobile.html](../designs/mocks/add_avoid_area_sheet.mobile.html) |
| S011 | AddFavoriteRoadSheet | [add_favorite_road_sheet.mobile.html](../designs/mocks/add_favorite_road_sheet.mobile.html) |
| S012 | ElevationProfileSheet | [elevation_profile_sheet.mobile.html](../designs/mocks/elevation_profile_sheet.mobile.html) |

### Phase 3 - Post-Ride

| Screen ID | Name | Design Mockup |
|-----------|------|---------------|
| V014 | RideHistoryScreen | [ride_history_screen.mobile.html](../designs/mocks/ride_history_screen.mobile.html) |
| S013 | RateRouteSheet | [rate_route_sheet.mobile.html](../designs/mocks/rate_route_sheet.mobile.html) |
| S014 | DepartureOptimizerSheet | [departure_optimizer_sheet.mobile.html](../designs/mocks/departure_optimizer_sheet.mobile.html) |
| S015 | RideDetailSheet | [ride_detail_sheet.mobile.html](../designs/mocks/ride_detail_sheet.mobile.html) |

### Design System

- **Theme**: Dark mode first, industrial-warm aesthetic
- **Primary Color**: Copper (#B87333)
- **Typography**: Space Grotesk (display), Inter (body)
- **Icons**: Material Symbols Outlined
- **Viewport**: 390x844 (iPhone 14 Pro reference)
- **Full design tokens**: [design.stitch.json](../designs/design.stitch.json)
