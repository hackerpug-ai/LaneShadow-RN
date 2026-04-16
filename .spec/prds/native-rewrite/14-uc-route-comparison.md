---
stability: FEATURE_SPEC
last_validated: 2026-04-16
prd_version: 1.0.0
functional_group: PLANNING
---

# Use Cases: Route Comparison

## Overview

Route comparison enables users to evaluate multiple route options side-by-side after AI planning, viewing key metrics (distance, duration, curvature, elevation, scenic score) before selecting their preferred route. This is critical for the motorcycle use case where riders prioritize curve quality over shortest distance.

## Platform-Specific APIs

| Platform | Map Rendering | Charts | Layout |
|----------|---------------|--------|--------|
| **Android** | Mapbox Maps SDK v11 (`MapView`, `PolylineAnnotation`) | MPAndroidChart / VFlege (Compose charts) | Compose `Row`, `Column`, `LazyRow` |
| **iOS** | Mapbox Maps SDK v11 (`MapboxMap`, `PolylineAnnotation`) | Swift Charts (iOS 16+) | SwiftUI `HStack`, `VStack`, `ScrollView(.horizontal)` |

---

## UC-COMP-01: View Multiple Route Options

**Description**: After AI planning completes, user views 2-3 route options displayed side-by-side as cards with summary metrics and map preview.

### Preconditions
- User completed ride planning flow (origin, destination, preferences)
- AI planning returned 2-3 route options from Convex `routes:planAI`
- User is on route results screen

### Main Flow
1. Ride flow transitions to `ROUTE_RESULTS` state
2. Screen renders route options in horizontal scroll container
3. Each route card displays:
   - Route name (e.g., "Curvy Coastal Route", "Direct Highway", "Scenic Backroads")
   - Primary metric (curvature score or duration)
   - Secondary metrics (distance, elevation gain)
   - Enrichment status badge (if enrichment running)
4. Map background shows all routes with distinct colors
5. Selected route is highlighted with thicker line

### Acceptance Criteria

#### Android
```gherkin
Given ride flow state is ROUTE_RESULTS
And routeOptions contains 3 routes
When user navigates to route results screen
Then LazyRow displays 3 RouteCard composables
And each RouteCard shows:
  - Route name
  - Curvature score (primary)
  - Distance and duration (secondary)
  - EnrichmentStatusBadge if applicable
And map renders all 3 route polylines
And selected route polyline has stroke width 8dp
And unselected routes have stroke width 4dp

Given user scrolls route cards horizontally
When user reaches end of list
Then scroll indicators show 3 dots
And current card index is highlighted
```

#### iOS
```gherkin
Given ride flow state is ROUTE_RESULTS
And routeOptions contains 3 routes
When user navigates to route results screen
Then ScrollView(.horizontal) displays 3 RouteCard views
And each RouteCard shows:
  - Route name
  - Curvature score (primary)
  - Distance and duration (secondary)
  - EnrichmentStatusBadge if applicable
And map renders all 3 route polylines
And selected route polyline has line width 8pt
And unselected routes have line width 4pt

Given user scrolls route cards horizontally
When user reaches end of list
Then scroll indicators show 3 dots
And current card index is highlighted
```

### Technical Notes
- **Card layout**: Use `HorizontalPager` (Android Accompanist) or `TabView` (iOS) for swipeable route cards.
- **Map polyline colors**: Use semantic theme tokens (selected route uses `primary` color, alternates use `secondary` and `tertiary`).
- **Enrichment integration**: Hook `useEnrichmentStatus` per-route to show enrichment progress badges.

---

## UC-COMP-02: Compare Route Metrics

**Description**: Each route card displays key metrics for comparison: distance, duration, curvature score, elevation gain, scenic score.

### Preconditions
- Route results screen is displayed
- Route options have been enriched with metrics

### Main Flow
1. Route cards display metrics in consistent layout
2. Metrics are color-coded by relative performance:
   - Green: Best value among options
   - Yellow: Middle value
   - Red: Worst value
3. Tappable metric cells show detailed breakdown
4. Metric units respect user preferences (miles vs km)

### Acceptance Criteria

#### Android
```gherkin
Given route options have enrichment data
When user views route cards
Then each card displays metric grid:
  - Distance: "45.2 mi" (or "72.7 km")
  - Duration: "1h 23m"
  - Curvature: "8.4 / 10" (color-coded)
  - Elevation: "+2,340 ft" (or "+713 m")
  - Scenic: "9.1 / 10" (color-coded)
And best metric value shows in green
And worst metric value shows in orange
And middle value shows in neutral color

Given user taps curvature metric cell
When metric is tapped
Then detail bottom sheet opens
And sheet shows curvature breakdown:
  - Total curves: 147
  - Hairpin turns: 12
  - Average radius: 45°
  - Curviest segment: "Mulholland Dr"
```

#### iOS
```gherkin
Given route options have enrichment data
When user views route cards
Then each card displays metric grid via LazyVGrid:
  - Distance: "45.2 mi" (or "72.7 km")
  - Duration: "1h 23m"
  - Curvature: "8.4 / 10" (color-coded)
  - Elevation: "+2,340 ft" (or "+713 m")
  - Scenic: "9.1 / 10" (color-coded)
And best metric value shows in green
And worst metric value shows in orange
And middle value shows in neutral color

Given user taps curvature metric cell
When metric is tapped
Then detail bottom sheet opens
And sheet shows curvature breakdown:
  - Total curves: 147
  - Hairpin turns: 12
  - Average radius: 45°
  - Curviest segment: "Mulholland Dr"
```

### Technical Notes
- **Metric ranking**: Calculate rank per metric across all options (1 = best, 2 = middle, 3 = worst).
- **Color coding**: Use semantic theme tokens (`success`, `warning`, `error`) for rank colors.
- **Unit localization**: Use `MeasurementFormatter` (iOS) or `NumberFormat` (Android) for locale-aware formatting.

---

## UC-COMP-03: Preview Route on Map

**Description**: User taps a route card to highlight that route on the map and fly camera to overview position.

### Preconditions
- Route results screen is displayed
- Map is visible with all routes rendered

### Main Flow
1. User taps a route card
2. Map highlights selected route:
   - Thicker polyline stroke
   - Brighter color (primary theme)
   - Other routes dim (reduced opacity)
3. Camera animates to show full route extent
4. Map markers show start/end points for selected route
5. Route card shows selected state (border, shadow)

### Acceptance Criteria

#### Android
```gherkin
Given route results screen displays 3 routes
When user taps second route card
Then route card shows selected state:
  - Border with primary color
  - Elevation increased
And map camera animates to fit second route bounds
And second route polyline updates:
  - Stroke width: 8dp
  - Color: primary theme color
  - Opacity: 1.0
And other route polylines update:
  - Stroke width: 4dp
  - Opacity: 0.4
And start/end markers show for second route

Given user taps third route card
When third card is tapped
Then map highlights third route
And second route dims
And camera animates to third route bounds
```

#### iOS
```gherkin
Given route results screen displays 3 routes
When user taps second route card
Then route card shows selected state:
  - Border with primary color
  - Shadow/elevation increased
And map camera animates to fit second route bounds
And second route polyline updates:
  - Line width: 8pt
  - Color: primary theme color
  - Opacity: 1.0
And other route polylines update:
  - Line width: 4pt
  - Opacity: 0.4
And start/end markers show for second route

Given user taps third route card
When third card is tapped
Then map highlights third route
And second route dims
And camera animates to third route bounds
```

### Technical Notes
- **Camera animation**: Use Mapbox `Camera.easeTo()` (Android) or `mapboxMap.camera.fly(to:)` (iOS) with 500ms duration.
- **Route bounds**: Calculate `LatLngBounds` from route geometry for camera fitting.
- **Marker icons**: Use PointAnnotationManager with custom marker images (start = green flag, end = checkered flag).

---

## UC-COMP-04: View Elevation Profile

**Description**: User views elevation profile chart for each route, showing climbing/descending segments and total elevation gain.

### Preconditions
- Route card is selected
- Route has elevation data from enrichment

### Main Flow
1. User taps "Elevation" button on route card
2. Bottom sheet opens with elevation chart
3. Chart shows elevation vs distance line graph
4. Color-coded segments:
   - Green: Flat/gradual (0-2% grade)
   - Yellow: Moderate (2-6% grade)
   - Red: Steep (>6% grade)
5. Chart is interactive: tap to see elevation at specific point

### Acceptance Criteria

#### Android
```gherkin
Given user has selected a route
When user taps "Elevation" button
Then elevation chart bottom sheet opens
And chart displays line graph:
  - X-axis: Distance (miles/km)
  - Y-axis: Elevation (feet/meters)
And line segments colored by grade:
  - Green: 0-2% grade
  - Yellow: 2-6% grade
  - Red: >6% grade
And chart shows:
  - Starting elevation
  - Peak elevation
  - Total gain/loss
And when user taps chart point
Then tooltip shows:
  - Distance: "12.5 mi"
  - Elevation: "1,450 ft"
  - Grade: "4.2%"

Given user drags chart horizontally
When user drags
Then crosshair follows finger
And tooltip updates in real-time
```

#### iOS
```gherkin
Given user has selected a route
When user taps "Elevation" button
Then elevation chart bottom sheet opens
And Swift Charts line graph displays:
  - X-axis: Distance (miles/km)
  - Y-axis: Elevation (feet/meters)
And line segments colored by grade:
  - Green: 0-2% grade
  - Yellow: 2-6% grade
  - Red: >6% grade
And chart shows:
  - Starting elevation
  - Peak elevation
  - Total gain/loss
And when user taps chart point
Then chart overlay shows:
  - Distance: "12.5 mi"
  - Elevation: "1,450 ft"
  - Grade: "4.2%"

Given user drags chart horizontally
When user drags
Then chart selection follows finger
And overlay updates in real-time
```

### Technical Notes
- **Chart libraries**: Use `Vico` (Compose) or `Swift Charts` (iOS 16+).
- **Elevation data**: Extract from route enrichment `elevationProfile` array (distance, elevation, grade).
- **Grade calculation**: Compute grade from adjacent elevation points: `(e2 - e1) / (d2 - d1) * 100`.

---

## UC-COMP-05: Select Preferred Route

**Description**: User selects their preferred route from options, confirms selection, and proceeds to navigation or ride planning.

### Preconditions
- Route results screen is displayed
- User has reviewed route options

### Main Flow
1. User taps "Select Route" button on chosen card
2. Confirmation dialog shows route summary
3. User confirms selection
4. Ride flow transitions to `ROUTE_DETAILS` state
5. Selected route is loaded for navigation/ride planning
6. Alternative routes remain visible as "View other options"

### Acceptance Criteria

#### Android
```gherkin
Given user has reviewed route options
When user taps "Select Route" on second card
Then confirmation dialog shows:
  - Route name: "Curvy Coastal Route"
  - Summary: "45.2 mi • 1h 23m • Curvature 8.4/10"
  - Buttons: "Confirm", "Cancel"
And when user taps "Confirm"
Then dispatch({ type: 'SELECT_ROUTE', routeId: 'route-2' })
And ride flow transitions to ROUTE_DETAILS state
And route detail screen shows selected route
And "View other options" button remains available

Given user taps "View other options"
When button is tapped
Then screen returns to ROUTE_RESULTS state
And all route options display again
And previous selection is cleared
```

#### iOS
```gherkin
Given user has reviewed route options
When user taps "Select Route" on second card
Then confirmation alert shows:
  - Route name: "Curvy Coastal Route"
  - Summary: "45.2 mi • 1h 23m • Curvature 8.4/10"
  - Buttons: "Confirm", "Cancel"
And when user taps "Confirm"
Then dispatch({ type: 'SELECT_ROUTE', routeId: 'route-2' })
And ride flow transitions to ROUTE_DETAILS state
And route detail screen shows selected route
And "View other options" button remains available

Given user taps "View other options"
When button is tapped
Then screen returns to ROUTE_RESULTS state
And all route options display again
And previous selection is cleared
```

### Technical Notes
- **Confirmation UI**: Use Material3 `AlertDialog` (Android) or `.alert()` (iOS) for confirmation.
- **State persistence**: Save selected route ID to Convex `userPreferences` for "always prefer curvy routes" feature.
- **Analytics**: Track selection metrics (which metrics correlate with route choice).

---

## UC-COMP-06: Compare with Current Route

**Description**: If user already has a route planned, new AI planning options are compared against the existing route.

### Preconditions
- User has an existing planned route in `ROUTE_DETAILS` state
- User initiates new planning from same origin/destination

### Main Flow
1. User plans new route with same origin/destination
2. AI planning returns 2-3 new route options
3. Route results screen shows:
   - New route options (cards 1-3)
   - Current route (card 4, labeled "Current Route")
4. Metrics are compared against current route
5. User can switch to new route or keep current

### Acceptance Criteria

#### Android
```gherkin
Given user has existing route planned
When user plans new route with same endpoints
Then route results screen displays 4 cards:
  - New option 1: "Curvy Coastal"
  - New option 2: "Direct Highway"
  - New option 3: "Scenic Backroads"
  - Current route: "Current Route" (grayed out)
And each new card shows delta from current:
  - "15 curvier than current"
  - "8 min longer than current"
  - "12 mi shorter than current"
And current route card shows:
  - "Your current route"
  - No delta indicators
And when user selects new route
Then confirmation shows:
  - "Replace current route?"
  - "Keep current route" option

Given user chooses "Keep current route"
When user confirms
Then no route change occurs
And screen returns to ROUTE_DETAILS for current route
```

#### iOS
```gherkin
Given user has existing route planned
When user plans new route with same endpoints
Then route results screen displays 4 cards:
  - New option 1: "Curvy Coastal"
  - New option 2: "Direct Highway"
  - New option 3: "Scenic Backroads"
  - Current route: "Current Route" (dimmed)
And each new card shows delta from current:
  - "15 curvier than current"
  - "8 min longer than current"
  - "12 mi shorter than current"
And current route card shows:
  - "Your current route"
  - No delta indicators
And when user selects new route
Then confirmation alert shows:
  - "Replace current route?"
  - "Keep current route" option

Given user chooses "Keep current route"
When user confirms
Then no route change occurs
And screen returns to ROUTE_DETAILS for current route
```

### Technical Notes
- **Delta calculation**: Compare each metric against current route and format as "+/- X units" or "X units [adjective] than current".
- **Current route styling**: Use muted colors and disabled state to indicate it's not selectable.
- **Route replacement**: If user selects new route, update `rideFlow.selectedRouteId` and archive current route to history.

---

## Technical Architecture

### Android Components

```kotlin
// Route comparison screen
@Composable
fun RouteComparisonScreen(
    state: RideFlowState,
    dispatch: (RideFlowAction) -> Unit
) {
    val polylines = useRouteComparison(state, dispatch)

    MapboxMap {
        polylines.forEach { routePolyline ->
            routePolyline.polylines.forEach { polyline ->
                PolylineLine(
                    coordinates = polyline.coordinates,
                    color = polyline.color,
                    width = if (routePolyline.isSelected) 8.dp else 4.dp
                )
            }
        }
    }

    LazyRow {
        items(state.routeOptions.options) { option ->
            RouteComparisonCard(
                route = option,
                isSelected = option.id == state.selectedRouteId,
                onSelect = { dispatch(SELECT_ROUTE(option.id)) }
            )
        }
    }
}

// Route card component
@Composable
fun RouteComparisonCard(
    route: RouteOption,
    isSelected: Boolean,
    onSelect: () -> Unit
) {
    Column(
        modifier = Modifier
            .clickable(onClick = onSelect)
            .border(
                width = if (isSelected) 2.dp else 1.dp,
                color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
            )
    ) {
        Text(route.name)
        MetricGrid(route.metrics)
        EnrichmentStatusBadge(route.enrichmentStatus)
    }
}

// Elevation chart
@Composable
fun ElevationProfileChart(
    elevationProfile: ElevationProfile
) {
    val chartEntryModel = remember(elevationProfile) {
        generateElevationChartData(elevationProfile)
    }

    LineChart(
        chartEntryModel = chartEntryModel,
        // Vico chart configuration
    )
}
```

### iOS Components

```swift
// Route comparison screen
struct RouteComparisonScreen: View {
    @State var rideFlowState: RideFlowState
    let dispatch: (RideFlowAction) -> Void

    var body: some View {
        ZStack(alignment: .top) {
            MapboxMap(equally: true) {
                ForEach(polylines) { routePolyline in
                    ForEach(routePolyline.polylines) { polyline in
                        PolylineAnnotation(
                            coordinates: polyline.coordinates,
                            lineColor: polyline.color,
                            lineWidth: routePolyline.isSelected ? 8 : 4
                        )
                    }
                }
            }

            ScrollView(.horizontal) {
                HStack {
                    ForEach(rideFlowState.routeOptions.options) { option in
                        RouteComparisonCard(
                            route: option,
                            isSelected: option.id == rideFlowState.selectedRouteId,
                            onSelect: { dispatch(.selectRoute(option.id)) }
                        )
                    }
                }
            }
        }
    }
}

// Route card component
struct RouteComparisonCard: View {
    let route: RouteOption
    let isSelected: Bool
    let onSelect: () -> Void

    var body: some View {
        VStack(alignment: .leading) {
            Text(route.name)
                .font(.headline)

            MetricGrid(metrics: route.metrics)

            if let enrichment = route.enrichmentStatus {
                EnrichmentStatusBadge(status: enrichment.status)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isSelected ? Color.accentColor : Color.gray, lineWidth: isSelected ? 2 : 1)
        )
        .onTapGesture(perform: onSelect)
    }
}

// Elevation chart (Swift Charts)
struct ElevationProfileChart: View {
    let elevationProfile: ElevationProfile

    var body: some View {
        Chart(elevationProfile.points) { point in
            LineMark(
                x: .value("Distance", point.distance),
                y: .value("Elevation", point.elevation)
            )
            .foregroundStyle(point.gradeColor)
        }
        .chartXAxis {
            AxisMarks(position: .bottom)
        }
        .chartYAxis {
            AxisMarks(position: .leading)
        }
    }
}
```

### Hook Integration

```typescript
// useRouteComparison.ts (shared logic)

export const useRouteComparison = (
  state: RideFlowState,
  dispatch: (action: any) => void
) => {
  const { semantic } = useSemanticTheme()

  // Build polylines for map rendering
  const polylines = useMemo(() => {
    if (!state.routeOptions?.options?.length) return []

    return state.routeOptions.options.map((option) => {
      const isSelected = option.routeOptionId === state.selectedRouteId

      const routePolylines = buildRoutePolylines({
        route: {
          overviewGeometry: option.map.overviewGeometry,
          legs: option.map.legs,
          overlays: option.map.overlays,
        },
        variant: isSelected ? 'selected' : 'alternate',
        showLegs: true,
        showWindOverlay: isSelected,
        semantic,
      })

      return {
        id: `route-${option.routeOptionId}`,
        routeOptionId: option.routeOptionId,
        isSelected,
        polylines: routePolylines,
      }
    })
  }, [state.routeOptions, state.selectedRouteId, semantic])

  // Select route handler
  const selectRoute = useCallback((routeId: string) => {
    dispatch({ type: 'SELECT_ROUTE', routeId })
  }, [dispatch])

  return { polylines, selectRoute }
}
```

---

## Success Metrics

- ☐ Route comparison screen renders within 300ms of AI planning completion
- ☐ Map polylines render for all routes with < 100ms delay
- ☐ Route card tap-to-highlight latency < 200ms
- ☐ Elevation chart renders within 500ms of sheet open
- ☐ Route selection confirmation flow completes within 2s
- ☐ Metric delta calculations are 100% accurate (no rounding errors)
- ☐ Screen supports 2-5 route options without performance degradation

---

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Mapbox Maps SDK (Android) | 11.x | Route polyline rendering |
| Mapbox Maps SDK (iOS) | 11.x | Route polyline rendering |
| Vico / MPAndroidChart | Latest | Elevation chart (Android) |
| Swift Charts | iOS 16+ | Elevation chart (iOS) |
| Accompanist Pager | Latest | Horizontal pager (Android) |
| useRouteComparison hook | Custom | Shared comparison logic |
| buildRoutePolylines | Custom | Map polyline generation |

---

## Future Enhancements

- **Split-screen comparison**: Side-by-side route profiles on tablets
- **Time-of-day comparison**: Show how route duration varies with traffic
- **Weather overlay**: Show forecast weather on each route option
- **3D terrain preview**: Tilt map to show elevation differences in 3D
- **Route sharing**: Export comparison as image for social sharing
- **Historical comparison**: Compare new routes against user's ride history
