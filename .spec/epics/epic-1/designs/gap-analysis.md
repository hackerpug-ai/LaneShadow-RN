# LaneShadow Design Gap Analysis

**Generated**: 2026-01-29
**Purpose**: Identify gaps between current design specifications (`screens.yaml`) and TRD/PRD requirements

---

## Executive Summary

This analysis compares the current screen inventory in `screens.yaml` against the Technical Requirements Documents (TRDs) for Phases 1-3 and the PRD. Key findings:

- **Phase 1**: 6 screens/sheets missing from design specs
- **Phase 2**: Fully specified but all in "planned" status
- **Phase 3**: Fully specified but all in "planned" status
- **Sprint 5 Additions**: Rain/temp overlays and comparison UI require new component specifications

---

## 1. Missing Screens/Sheets

### 1.1 Phase 1 Core - TRD vs Design Specs

| TRD ID | TRD Name | Design Status | Gap |
|--------|----------|---------------|-----|
| V001 | HomeMap | **V001** implemented | MATCH |
| V002 | SavedRoutesList | **V002** implemented | MATCH |
| V003 | SavedRouteDetail | **V003** planned | MATCH |
| V004 | RoutePlannerLoading | **V004** implemented (as Loading Overlay) | MATCH |
| V005 | EmptyStateStandalone | **MISSING** | Not in design inventory |
| V006 | Settings | **MISSING** | Not in design inventory |
| V007 | LegalAbout | **MISSING** | Not in design inventory |
| V008 | AuthSignIn | **A001** implemented (partial - combined login) | PARTIAL MATCH - needs separate sign-in |
| V009 | AuthSignUp | **MISSING** | Not in design inventory (combined in A001) |
| V010 | SessionRestoring | **MISSING** | Not in design inventory |
| S001 | PlanRideSheet | **S001** implemented | MATCH |
| S002 | RouteOptionsSheet | **S002** implemented | MATCH |
| S003 | RouteOverviewSheet | **S003** implemented | MATCH |
| S004 | PlanningErrorSheet | **S004** planned (as Error Sheet) | MATCH |
| S005 | WindLegendSheet | **S008** implemented | ID MISMATCH (S008 in design, S005 in TRD) |
| S006 | PlaceSearchSheet | **S005** implemented | ID MISMATCH (S005 in design, S006 in TRD) |
| S007 | AnnotationDetailSheet | **MISSING** | Not in design inventory |
| S008 | RenameRouteSheet | **S006** implemented | ID MISMATCH (S006 in design, S008 in TRD) |
| S009 | ConfirmDeleteRouteSheet | **S007** implemented | ID MISMATCH (S007 in design, S009 in TRD) |

### 1.2 Phase 1 Missing Items Summary

| ID | Name | Priority | Notes |
|----|------|----------|-------|
| V005 | EmptyStateStandalone | LOW | Optional; can embed empties in screens |
| V006 | Settings | MEDIUM | Required for minimal app hygiene |
| V007 | LegalAbout | LOW | Legal requirement but low design priority |
| V009 | AuthSignUp | MEDIUM | Currently combined with login in A001 |
| V010 | SessionRestoring | HIGH | Critical for startup UX |
| S007 | AnnotationDetailSheet | MEDIUM | Required for flow 4 (Inspect Route) |

### 1.3 Phase 2 Personalization - TRD vs Design Specs

| TRD ID | TRD Name | Design Status | Gap |
|--------|----------|---------------|-----|
| V011 | PreferencesScreen | **V011** planned | MATCH |
| V012 | AvoidAreasScreen | **V012** planned | MATCH |
| V013 | FavoriteRoadsScreen | **V013** planned | MATCH |
| S010 | AddAvoidAreaSheet | **S010** planned | MATCH |
| S011 | AddFavoriteRoadSheet | **S011** planned | MATCH |
| S012 | ElevationProfileSheet | **S012** planned | MATCH |

**Status**: Phase 2 fully inventoried. No missing screens.

### 1.4 Phase 3 Post-Ride - TRD vs Design Specs

| TRD ID | TRD Name | Design Status | Gap |
|--------|----------|---------------|-----|
| V014 | RideHistoryScreen | **V014** planned | MATCH |
| S013 | RateRouteSheet | **S013** planned | MATCH |
| S014 | DepartureOptimizerSheet | **S014** planned | MATCH |
| S015 | RideDetailSheet | **S015** planned | MATCH |

**Status**: Phase 3 fully inventoried. No missing screens.

---

## 2. Missing States

### 2.1 V001 HomeMap

| TRD State | Design Status | Gap |
|-----------|---------------|-----|
| default | Documented | MATCH |
| searchFocused | Documented | MATCH |
| routeDisplayed | Documented | MATCH |
| planningInProgress | **MISSING** | Not documented - overlay state during route planning |
| routeComparison | **MISSING** | Not documented - state when comparing routes on map |

### 2.2 S001 PlanRideSheet

| TRD State | Design Status | Gap |
|-----------|---------------|-----|
| default | Documented | MATCH |
| originFocused | Documented | MATCH |
| destinationFocused | Documented | MATCH |
| valid | Documented | MATCH |
| submitting | Documented | MATCH |
| preferencesExpanded | **MISSING** | Phase 2 adds "Show active preferences" state |
| departureOptimization | **MISSING** | Phase 3 adds "Best Time" suggestion state |

### 2.3 S002 RouteOptionsSheet

| TRD State | Design Status | Gap |
|-----------|---------------|-----|
| default | Documented | MATCH |
| comparing | Documented | MATCH |
| sideBySide | **MISSING** | Sprint 5 side-by-side comparison mode |
| overlayPreview | **MISSING** | State showing wind/rain/temp preview per card |

### 2.4 S003 RouteOverviewSheet

| TRD State | Design Status | Gap |
|-----------|---------------|-----|
| default | Documented | MATCH |
| fromPlanning | Documented | MATCH |
| fromSaved | Documented | MATCH |
| conditionsUnavailable | **MISSING** | TRD specifies soft-fail state with advisory notice |
| saving | **MISSING** | State during route save operation |
| elevationExpanded | **MISSING** | Phase 2 elevation chart display state |

### 2.5 V002 SavedRoutesList

| TRD State | Design Status | Gap |
|-----------|---------------|-----|
| default | Documented | MATCH |
| empty | Documented | MATCH |
| searchActive | Documented | MATCH |
| editMode | Documented | MATCH |
| showingRatings | **MISSING** | Phase 3 adds completion status and rating display |

### 2.6 V003 SavedRouteDetail

| TRD State | Design Status | Gap |
|-----------|---------------|-----|
| default | Documented | MATCH |
| loading | Documented | MATCH |
| rated | **MISSING** | Phase 3 state showing rating and notes |
| completed | **MISSING** | Phase 3 state for completed rides |

### 2.7 S004 Error Sheet (PlanningErrorSheet in TRD)

| TRD State | Design Status | Gap |
|-----------|---------------|-----|
| networkError | Documented | MATCH |
| routingError | Documented | MATCH |
| authError | Documented | MATCH |
| llmSketchInvalid | **MISSING** | TRD error code LLM_SKETCH_INVALID |
| llmSketchAmbiguous | **MISSING** | TRD error code LLM_SKETCH_AMBIGUOUS |
| routingCompileFailed | **MISSING** | TRD error code ROUTING_COMPILE_FAILED |
| conditionsLookupFailed | **MISSING** | TRD error code CONDITIONS_LOOKUP_FAILED |

---

## 3. Missing Components

### 3.1 Phase 1 Core Components

| Component | Required By | Design Status | Gap |
|-----------|-------------|---------------|-----|
| conditionsUnavailableNotice | S003 RouteOverviewSheet | **MISSING** | Advisory banner for soft-fail conditions |
| annotationMarker | V001 Map rendering | **MISSING** | Point-based map markers for annotations |
| routeComparisonToggle | S002 RouteOptionsSheet | **MISSING** | Toggle for side-by-side view |
| sessionRestoringSpinner | V010 SessionRestoring | **MISSING** | Full screen loading for auth check |
| settingsRow | V006 Settings | **MISSING** | Settings list row component |
| legalFooter | V007 LegalAbout | **MISSING** | Legal disclaimer and links |

### 3.2 Sprint 5 Weather Overlay Components

| Component | Purpose | Design Status | Gap |
|-----------|---------|---------------|-----|
| rainOverlaySegment | Map overlay for rain forecast | **MISSING** | Needs color scheme, legend, segment rendering |
| rainLegend | Legend for rain intensity levels | **MISSING** | Similar to wind legend |
| temperatureOverlay | Map overlay for temperature ranges | **MISSING** | Gradient or segment-based display |
| temperatureLegend | Legend for temperature scale | **MISSING** | Color gradient explanation |
| overlayToggleGroup | Multi-overlay selector | **MISSING** | Toggle between wind/rain/temp overlays |
| comparisonCard | Side-by-side route card | **MISSING** | Compact card for comparison mode |
| weatherSummaryPill | Condensed weather indicator | **MISSING** | Shows multiple conditions in card preview |

### 3.3 Phase 2 Components

| Component | Required By | Design Status | Gap |
|-----------|-------------|---------------|-----|
| avoidAreaOverlay | V012 AvoidAreasScreen | **MISSING** | Map rectangle/polygon for avoid areas |
| drawingControls | V012 AvoidAreasScreen | Listed in V012 | MATCH (placeholder) |
| favoriteRoadSegment | V013 FavoriteRoadsScreen | **MISSING** | Highlighted road segment on map |
| elevationChart | S012 ElevationProfileSheet | Listed in S012 | MATCH (placeholder) |
| elevationSummary | S002 RouteOptionsSheet | **MISSING** | Compact ascent/descent display |
| favoriteRoadBadge | S002 RouteOptionsSheet | **MISSING** | Badge showing matched favorites |
| roadSegmentSelector | S003 RouteOverviewSheet | **MISSING** | Long-press interaction for saving road |

### 3.4 Phase 3 Components

| Component | Required By | Design Status | Gap |
|-----------|-------------|---------------|-----|
| starRating | S013 RateRouteSheet | Listed in S013 | MATCH (placeholder) |
| ratingDisplay | V003 SavedRouteDetail | **MISSING** | Read-only star display |
| rideStatusBadge | V002 SavedRoutesList | **MISSING** | Planned/Completed/Cancelled badge |
| monthSection | V014 RideHistoryScreen | Listed in V014 | MATCH (placeholder) |
| conditionsSnapshot | S015 RideDetailSheet | Listed in S015 | MATCH (placeholder) |
| optimalWindowCard | S014 DepartureOptimizerSheet | **MISSING** | Weather window with score |
| timeWindowSelector | S001 PlanRideSheet | **MISSING** | "Best Time" suggestion UI |

---

## 4. Sprint 5 Additions - Detailed Requirements

### 4.1 Rain Forecast Overlay

**PRD Reference**: Phase 1 Core - "Rain forecast overlay" (Planned Sprint 5)

**Required Design Specifications**:

1. **rainOverlaySegment**
   - Color scheme for precipitation probability ranges
   - Segment rendering on route polyline
   - Interaction behavior (tap for details)

2. **rainLegendSheet**
   - Legend rows explaining rain probability levels
   - Suggested levels: None (0-20%), Light (20-50%), Moderate (50-70%), Heavy (70%+)
   - Color mapping consistent with overlay

3. **rainSummaryPill**
   - Condensed rain indicator for route cards
   - Icon + short label (e.g., "Light Rain Expected")

### 4.2 Temperature Overlay

**PRD Reference**: Phase 1 Core - "Temperature overlay" (Planned Sprint 5)

**Required Design Specifications**:

1. **temperatureOverlaySegment**
   - Color gradient from cold (blue) to hot (red)
   - Temperature ranges in Fahrenheit and Celsius
   - Segment rendering approach (gradient vs discrete bands)

2. **temperatureLegendSheet**
   - Temperature scale explanation
   - Comfort zones for motorcycle riding
   - Unit toggle (F/C)

3. **temperatureSummaryPill**
   - Min/Max temp range display
   - Icon indicating comfort level

### 4.3 Side-by-Side Route Comparison

**PRD Reference**: Phase 1 Core - "Side-by-side route comparison" (Planned Sprint 5)

**Required Design Specifications**:

1. **comparisonViewLayout**
   - Two-column layout for route cards
   - Synchronized scrolling
   - Highlighted differences

2. **comparisonCard** (compact variant of routeOptionCard)
   - Reduced height for side-by-side display
   - Key stats: distance, duration, conditions summary
   - Quick-select action

3. **overlayComparisonRow**
   - Side-by-side wind/rain/temp comparison
   - Visual differentiation (better/worse indicators)

4. **comparisonToggle**
   - Switch between list view and comparison view
   - Consistent with existing toggle patterns

### 4.4 Enhanced Rationale Display

**PRD Reference**: Phase 1 Core - "Enhanced rationale display" (Planned Sprint 5)

**Required Design Specifications**:

1. **rationaleCard**
   - Expanded text area for route rationale
   - Highlight key roads/segments mentioned
   - Link to map annotations

2. **scenicHighlight**
   - Visual callout for scenic sections
   - Connected to map overlay

---

## 5. ID Alignment Recommendations

The design inventory uses different IDs than the TRD. Recommend aligning:

| Design ID | TRD ID | Name | Action |
|-----------|--------|------|--------|
| S005 | S006 | PlaceSearchSheet | Renumber to S006 |
| S006 | S008 | RenameRouteSheet | Renumber to S008 |
| S007 | S009 | ConfirmDeleteRouteSheet | Renumber to S009 |
| S008 | S005 | WindLegendSheet | Renumber to S005 |
| A001 | V008+V009 | Auth screens | Split into V008 SignIn and V009 SignUp |

---

## 6. Priority Matrix

### Critical (Block Sprint 5)

| Item | Type | Reason |
|------|------|--------|
| Rain overlay components | Components | PRD Sprint 5 deliverable |
| Temperature overlay components | Components | PRD Sprint 5 deliverable |
| Side-by-side comparison UI | States + Components | PRD Sprint 5 deliverable |
| overlayToggleGroup | Component | Required for multi-overlay switching |

### High (Block Phase 1 Completion)

| Item | Type | Reason |
|------|------|--------|
| V010 SessionRestoring | Screen | Critical startup flow |
| S007 AnnotationDetailSheet | Sheet | Required for map annotation interaction |
| conditionsUnavailableNotice | Component | TRD soft-fail requirement |
| Error sheet states | States | TRD error code mapping |

### Medium (Should Have for Phase 1)

| Item | Type | Reason |
|------|------|--------|
| V006 Settings | Screen | App hygiene |
| V009 AuthSignUp | Screen | Separate from login |
| routeComparisonToggle | Component | Enhanced comparison UX |

### Low (Nice to Have)

| Item | Type | Reason |
|------|------|--------|
| V005 EmptyStateStandalone | Screen | Can embed in parent screens |
| V007 LegalAbout | Screen | Low design priority per TRD |

---

## 7. Appendix: Cross-Reference Tables

### A. Screen/Sheet Complete Inventory

| ID | Name | Phase | TRD Section | Design Status |
|----|------|-------|-------------|---------------|
| V001 | HomeMap | 1 | 6.1 | Implemented |
| V002 | SavedRoutesList | 1 | 6.1 | Implemented |
| V003 | SavedRouteDetail | 1 | 6.1 | Planned |
| V004 | RoutePlannerLoading | 1 | 6.1 | Implemented |
| V005 | EmptyStateStandalone | 1 | 6.1 | **MISSING** |
| V006 | Settings | 1 | 6.1 | **MISSING** |
| V007 | LegalAbout | 1 | 6.1 | **MISSING** |
| V008 | AuthSignIn | 1 | 6.1 | Partial (A001) |
| V009 | AuthSignUp | 1 | 6.1 | **MISSING** |
| V010 | SessionRestoring | 1 | 6.1 | **MISSING** |
| V011 | PreferencesScreen | 2 | 5.1 | Planned |
| V012 | AvoidAreasScreen | 2 | 5.1 | Planned |
| V013 | FavoriteRoadsScreen | 2 | 5.1 | Planned |
| V014 | RideHistoryScreen | 3 | 4.1 | Planned |
| S001 | PlanRideSheet | 1 | 6.1 | Implemented |
| S002 | RouteOptionsSheet | 1 | 6.1 | Implemented |
| S003 | RouteOverviewSheet | 1 | 6.1 | Implemented |
| S004 | PlanningErrorSheet | 1 | 6.1 | Planned |
| S005 | WindLegendSheet | 1 | 6.1 | Implemented (as S008) |
| S006 | PlaceSearchSheet | 1 | 6.1 | Implemented (as S005) |
| S007 | AnnotationDetailSheet | 1 | 6.1 | **MISSING** |
| S008 | RenameRouteSheet | 1 | 6.1 | Implemented (as S006) |
| S009 | ConfirmDeleteRouteSheet | 1 | 6.1 | Implemented (as S007) |
| S010 | AddAvoidAreaSheet | 2 | 5.1 | Planned |
| S011 | AddFavoriteRoadSheet | 2 | 5.1 | Planned |
| S012 | ElevationProfileSheet | 2 | 5.1 | Planned |
| S013 | RateRouteSheet | 3 | 4.1 | Planned |
| S014 | DepartureOptimizerSheet | 3 | 4.1 | Planned |
| S015 | RideDetailSheet | 3 | 4.1 | Planned |

### B. PRD Feature to Component Mapping

| PRD Feature | Sprint | Required Components | Status |
|-------------|--------|---------------------|--------|
| Start/end location input | 1-4 | locationInput, placeSearchSheet | Done |
| Departure date and time | 4 | dateTimePicker | Done |
| 2-3 scenic route options | 3 | routeOptionCard, routeOptionsSheet | Done |
| Wind exposure overlay | 3 | windOverlaySegment, windLegend | Done |
| Route summaries | 3-4 | routeHeader, statsRow, rationaleText | Done |
| Save and reopen routes | 4 | saveButton, savedRouteCard | In Progress |
| **Rain forecast overlay** | **5** | **rainOverlay, rainLegend** | **MISSING** |
| **Temperature overlay** | **5** | **tempOverlay, tempLegend** | **MISSING** |
| **Side-by-side comparison** | **5** | **comparisonLayout, comparisonCard** | **MISSING** |
| **Enhanced rationale** | **5** | **rationaleCard, scenicHighlight** | **MISSING** |
| Favorite roads library | 6 | favoriteRoadCard, favoriteRoadSegment | Planned |
| Avoid areas | 6 | avoidAreaOverlay, drawingControls | Planned |
| Elevation profile | 7 | elevationChart, elevationSummary | Planned |
| Route rating | 8 | starRating, ratingDisplay | Planned |
| Ride history | 8 | rideHistoryCard, monthSection | Planned |
| Departure optimization | 9 | optimalWindowCard, timeSelector | Planned |

---

*End of Gap Analysis Report*
