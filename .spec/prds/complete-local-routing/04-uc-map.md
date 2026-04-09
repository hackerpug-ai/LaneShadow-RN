---
stability: FEATURE_SPEC
last_validated: 2026-04-09
prd_version: 1.0.0
functional_group: MAP
---

# Use Cases: Map Foundation (MAP)

## Use Case Summary

| ID | Title | Description |
|----|-------|-------------|
| UC-MAP-01 | Install and Configure Mapbox SDK | Developer installs @rnmapbox/maps and configures Expo plugin |
| UC-MAP-02 | Render MapView with Theme Support | User views map with appropriate dark/light styling |
| UC-MAP-03 | Control Camera Position | User pans, zooms, and centers map on route |
| UC-MAP-04 | Render Markers and Shapes | User sees route polylines and location markers on map |
| UC-MAP-05 | Handle Coordinate Systems | System converts between coordinate formats for Mapbox compatibility |

---

## UC-MAP-01: Install and Configure Mapbox SDK

**Description:** Developer installs @rnmapbox/maps package, configures Expo plugin with Mapbox tokens, and verifies build on iOS and Android platforms.

**Acceptance Criteria:**
- ☐ Developer can install @rnmapbox/maps via npm
- ☐ Developer can configure RNMapboxMapsImpl in app.json
- ☐ Developer can provide valid Mapbox download token
- ☐ App builds successfully on iOS simulator
- ☐ App builds successfully on Android emulator
- ☐ MapView renders without errors in development environment

---

## UC-MAP-02: Render MapView with Theme Support

**Description:** User views map that automatically switches between dark and light styles based on system theme setting.

**Acceptance Criteria:**
- ☐ User can view MapView on route planning screen
- ☐ Map displays dark style when system theme is dark
- ☐ Map displays light style when system theme is light
- ☐ Map style updates immediately when system theme changes
- ☐ Map style matches semantic theme colors consistently

---

## UC-MAP-03: Control Camera Position

**Description:** User can pan, zoom, and center the map view on routes and locations using standard gestures and programmatic controls.

**Acceptance Criteria:**
- ☐ User can pan map by dragging with touch input
- ☐ User can zoom map by pinching with touch input
- ☐ System can center map on specific coordinates programmatically
- ☐ System can fit camera to route bounds automatically
- ☐ Camera movements are smooth and animated (not jumpy)
- ☐ Camera respects minimum and maximum zoom levels

---

## UC-MAP-04: Render Markers and Shapes

**Description:** User sees route polylines, location markers, and weather overlays rendered on the map using Mapbox ShapeSource and LineLayer components.

**Acceptance Criteria:**
- ☐ User can view route polylines rendered on map
- ☐ User can view start/end location markers on map
- ☐ User can view waypoint markers on map
- ☐ Polylines display correct colors for weather conditions
- ☐ Polylines display appropriate stroke widths
- ☐ Markers display at correct coordinates
- ☐ Shapes update when route data changes

---

## UC-MAP-05: Handle Coordinate Systems

**Description:** System converts coordinates between Google Maps format [lat, lng] and Mapbox format [lng, lat] for all rendering operations.

**Acceptance Criteria:**
- ☐ System can convert latitude/longitude objects to Mapbox array format
- ☐ System can convert Mapbox array format to latitude/longitude objects
- ☐ Route polylines render at correct geographic locations
- ☐ Markers display at correct geographic locations
- ☐ No coordinate drift or offset errors in rendering
- ☐ Conversion utilities have unit tests with edge cases
