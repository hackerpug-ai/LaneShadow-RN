# LaneShadow UX Design Plan

## Epic 1: Motorcycle Scenic Route Planning

### Overview

LaneShadow is a mobile-first motorcycle route planning application that uses AI to generate scenic routes while providing real-time weather condition awareness. The app enables riders to confidently plan trips by understanding wind exposure, rain probability, and temperature conditions along their route.

### Platform

- **Type**: Mobile App (React Native + Expo)
- **Target Devices**: iOS and Android smartphones
- **Device Targets**: `["mobile"]` (390x844 viewport)

### Design Philosophy

- **Dark Mode First**: Industrial aesthetic with warm undertones
- **Copper Accent (#B87333)**: Primary brand color for CTAs and highlights
- **Map-Centric**: Full-screen map as the primary interface
- **Bottom Sheet Navigation**: Primary interaction model for mobile
- **Progressive Disclosure**: Collapsed cards expand on selection

### Phase Structure

#### Phase 1: Core POC (Sprints 1-5)
Primary screens and sheets for route planning, viewing, and saving.

**Screens (Views)**:
- V001: HomeMap - Map-first shell hosting planning + route rendering
- V002: SavedRoutesList - List of saved routes
- V003: SavedRouteDetail - Saved route replay
- V004: RoutePlannerLoading - Progress overlay during planning
- V005: EmptyStateStandalone - Reusable empty state
- V006: Settings - Minimal POC settings
- V007: LegalAbout - About and legal information
- V008: AuthSignIn - User sign-in
- V009: AuthSignUp - User registration
- V010: SessionRestoring - Startup/session loading

**Sheets**:
- S001: PlanRideSheet - Start/end input and preferences
- S002: RouteOptionsSheet - Compare 2-3 route alternatives
- S003: RouteOverviewSheet - Route details and save action
- S004: PlanningErrorSheet - Planning failure recovery
- S005: WindLegendSheet - Wind condition levels
- S005a: RainLegendSheet - Rain forecast levels (Sprint 5)
- S005b: TemperatureLegendSheet - Temperature ranges (Sprint 5)
- S006: PlaceSearchSheet - Location search with autocomplete
- S007: AnnotationDetailSheet - Map annotation details
- S008: RenameRouteSheet - Rename saved route
- S009: ConfirmDeleteRouteSheet - Confirm route deletion

#### Phase 2: Personalization (Sprints 6-7)
User preferences, favorites, and avoid areas.

**Screens**:
- V011: PreferencesScreen - Default route preferences
- V012: AvoidAreasScreen - Manage avoid areas
- V013: FavoriteRoadsScreen - Browse favorite segments

**Sheets**:
- S010: AddAvoidAreaSheet - Define new avoid area
- S011: AddFavoriteRoadSheet - Save road segment
- S012: ElevationProfileSheet - Elevation chart view

#### Phase 3: Post-Ride (Sprints 8-9)
Ride completion, ratings, and history.

**Screens**:
- V014: RideHistoryScreen - Browse completed rides

**Sheets**:
- S013: RateRouteSheet - Rate completed ride
- S014: DepartureOptimizerSheet - Optimal departure windows
- S015: RideDetailSheet - Historical ride details

### Key User Flows

1. **Plan a Ride**: HomeMap -> PlanRideSheet -> Loading -> RouteOptionsSheet -> RouteOverviewSheet
2. **Save Route**: RouteOverviewSheet -> Save action -> SavedRoutesList
3. **Compare Routes**: RouteOptionsSheet with overlay toggles and side-by-side view
4. **Inspect Route**: RouteOverviewSheet with legends and annotation details
5. **Authentication**: SessionRestoring -> SignIn/SignUp -> HomeMap

### Design System

- **Typography**: Space Grotesk (display), Inter (body)
- **Colors**: Dark surfaces (#0E0F11, #1A1C1F), Copper primary (#B87333)
- **Spacing**: 6px, 8px, 12px, 20px, 24px, 32px scale
- **Radius**: 8px (sm), 12px (md), 16px (lg), 20px (xl), 32px (xxl)
- **Motion**: 140ms (short), 220ms (medium) with ease-out

### Component Library

Based on existing mockups in `legacy/` folder:
- Buttons: Primary (copper), Secondary (transparent), Destructive (error)
- Inputs: Text, Search, Location (with timeline)
- Cards: Route option (selected/unselected), Saved route
- Badges: Route badge, Condition pill, Status badge
- Sheets: Bottom partial, Modal, Full height
- Overlays: Wind, Rain, Temperature segments

### References

- paradigm.yaml - Design tokens and visual patterns
- screens.yaml - Complete screen inventory (25 screens, 15 sheets)
- workflows.yaml - User flow definitions (15 flows)
- legacy/*.html - Existing HTML mockups for reference
