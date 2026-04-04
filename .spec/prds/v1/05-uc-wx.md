---
stability: FEATURE_SPEC
last_validated: 2026-04-03
prd_version: 1.1.0
---

# UC-WX: Weather & Conditions

---

## UC-WX-01: View wind overlay on route polyline

**Description**: The Rider can activate a wind overlay that colorizes the route polyline on the map based on wind speed and direction along the route. This allows the Rider to see at a glance which segments will have headwinds, crosswinds, or favorable tailwinds before committing to a route.

**Acceptance Criteria**:
- ☐ Rider can tap the wind overlay toggle to activate wind-based coloring on the active route polyline
- ☐ System renders polyline segments in distinct colors corresponding to wind speed bands (calm, moderate, strong)
- ☐ Rider can see a color legend for the wind overlay within the map view without navigating away
- ☐ System displays wind direction indicators (arrows or chevrons) on segments with wind speed above 15 mph
- ☐ Rider can deactivate the wind overlay by tapping the toggle again, returning the polyline to its default styling

---

## UC-WX-02: View rain forecast overlay on route polyline

**Description**: The Rider can activate a rain forecast overlay that colorizes the route polyline based on expected precipitation probability during the planned ride window. This allows the Rider to identify which segments of the route are likely to be wet and make an informed route selection or departure-time decision.

**Acceptance Criteria**:
- ☐ Rider can tap the rain overlay toggle to activate precipitation-based coloring on the active route polyline
- ☐ System renders polyline segments in distinct colors corresponding to rain probability bands (low, moderate, high)
- ☐ System aligns the rain forecast to the Rider's planned departure time and estimated time-at-location per segment
- ☐ Rider can see the peak rain window (e.g., "Rain expected 2–4 PM") as a summary label near the overlay toggle
- ☐ Rider can view rain probability values on individual polyline segments by tapping the segment

---

## UC-WX-03: View temperature overlay on route polyline

**Description**: The Rider can activate a temperature overlay that colorizes the route polyline based on forecast air temperature along the route. Temperature varies significantly with elevation and time of day on longer rides, and this overlay surfaces those differences directly on the map.

**Acceptance Criteria**:
- ☐ Rider can tap the temperature overlay toggle to activate temperature-based coloring on the active route polyline
- ☐ System renders polyline segments in distinct colors corresponding to temperature comfort bands (cold, cool, comfortable, hot)
- ☐ Rider can see the high and low temperature range for the full route as a summary near the overlay toggle
- ☐ System derives temperature values from forecast data aligned to the Rider's planned departure time and segment arrival time
- ☐ Rider can see an estimated temperature value for any individual polyline segment by tapping the segment

---

## UC-WX-04: Weather badges on route comparison cards

**Description**: Each route comparison card in the results tray displays a compact weather badge summarizing the key condition to know before choosing that route. The badge makes weather visible at a glance without requiring the Rider to tap into each route's detail view.

**Acceptance Criteria**:
- ☐ Rider can see a compact weather badge on each route attachment card showing the dominant condition (e.g., "Clear", "Light rain 3 PM", "Windy")
- ☐ System selects the badge label based on the most salient weather condition during the planned ride window for that route
- ☐ Rider can distinguish weather conditions across routes at a glance when route attachment cards are visible
- ☐ System updates weather badge labels if the Rider adjusts departure time via chat message (see UC-WX-06)
- ☐ Rider can see a weather icon alongside the badge label that reinforces the condition type (sun, rain cloud, wind gust icon)

---

## UC-WX-05: Expand weather timeline detail for a route

**Description**: The Rider can tap to expand a weather timeline panel within the route detail view that shows hourly weather conditions across the planned ride duration. This gives riders planning longer trips a full picture of how conditions evolve over the course of the ride.

**Acceptance Criteria**:
- ☐ Rider can tap an expand control on the route detail view to reveal the hourly weather timeline
- ☐ Rider can view wind speed, rain probability, and temperature for each hour of the planned ride duration in the expanded timeline
- ☐ System aligns the hourly forecast to the planned departure time so the first timeline entry reflects conditions at departure
- ☐ Rider can collapse the weather timeline back to its compact state by tapping the expand control again
- ☐ System highlights the hour with the worst conditions in the timeline so the Rider can identify the most critical window without scanning the full chart

---

## UC-WX-06: Adjust departure time and re-rank routes

**Description**: The Rider can change their planned departure time via a chat message ("what if I leave at 3pm?") or a time picker control. The System re-probes weather conditions for the new departure window and re-ranks routes accordingly. The AI responds with updated "Best for today" designation and weather badges.

**Acceptance Criteria**:
- ☐ Rider can send a chat message like "what if I leave at 3pm" to trigger departure time adjustment
- ☐ System extracts the departure time from the chat message when mentioned (e.g., "leaving at 2pm", "plan for Saturday morning")
- ☐ System fetches updated weather data for the new departure time window
- ☐ System re-ranks routes and responds with updated route attachments reflecting the new conditions
- ☐ "Best for today" badge updates to reflect the new departure time
- ☐ Weather overlays on the map update to align with the new departure time

---

## UC-WX-07: Weather data error recovery

**Description**: When weather data is unavailable or stale, the System communicates this in its chat response rather than silently omitting data. Routes remain usable without weather — they degrade gracefully to scenic-only ranking.

**Acceptance Criteria**:
- ☐ System includes a note in its chat response when weather data is unavailable (e.g., "Weather data isn't available right now — routes are ranked by scenicness only")
- ☐ Route attachment cards show a "Weather unavailable" indicator instead of a weather badge when data is missing
- ☐ System indicates when weather data is more than 2 hours old on saved routes (e.g., "Weather checked at 7:03 AM — tap to refresh")
- ☐ Routes remain fully usable and selectable without weather data
- ☐ System does not block route generation when weather API is unreachable
