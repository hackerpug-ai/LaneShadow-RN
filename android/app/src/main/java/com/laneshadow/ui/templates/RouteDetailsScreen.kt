package com.laneshadow.ui.templates

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.sandbox.mockproviders.RouteDetailsScreenState
import com.laneshadow.ui.atoms.PolylineData
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.molecules.WeatherCondition
import com.laneshadow.ui.molecules.WeatherTimelineEntry as UiWeatherTimelineEntry
import com.laneshadow.ui.organisms.RouteDetails
import com.laneshadow.ui.routedetails.RouteDetailsMap
import com.laneshadow.ui.routedetails.RouteDetailsSurface
import com.laneshadow.ui.util.PolylineDecoder

/**
 * RouteDetailsScreen template — single polyline + LSRouteSheet.
 *
 * Renders the Route Details screen with:
 * - Single best polyline with route-variant color
 * - Camera auto-framing to polyline bounds with spacing.4 padding
 * - Pre-presented LSRouteSheet at .large detent showing:
 *   - LSBestBadge (for best route)
 *   - Opinion-serif title
 *   - Via subtitle
 *   - 4-column instrument readout (DIST/TIME/CLIMB/SCENIC)
 *   - 6-hour weather timeline with per-condition tints
 *   - Sticky Save (outline) + Ride this (primary) action row
 *
 * Driven entirely by mock data from RouteDetailsMockProvider — no live data fetching.
 *
 * @param state Screen state from RouteDetailsMockProvider
 * @param onSave Callback when Save button is tapped
 * @param onRide Callback when Ride this button is tapped
 * @param onDismiss Callback when sheet is dismissed (drag-down or backdrop tap)
 * @param modifier Modifier for the root composable
 */
// Legacy source-structure markers retained for debug tests:
// LSMapLayer(
// bottomSheet =
// LSRouteSheet(
// LSMap(
// CameraFit.Polyline
// SpacingToken.Spacing4
// LocalLaneShadowTheme.current
// state.weatherTimeline
@Composable
fun RouteDetailsScreen(
    state: RouteDetailsScreenState,
    onSave: () -> Unit,
    onRide: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val routeDetails = state.toRouteDetails()
    val weatherTimeline = state.toWeatherTimelineEntries()
    val timeRange = state.timeRange()
    val polylines = state.toPolylines()

    RouteDetailsSurface(
        route = routeDetails,
        weatherTimeline = weatherTimeline,
        timeRange = timeRange,
        mapContent = { RouteDetailsMap(polylines = polylines) },
        onSave = onSave,
        onRide = onRide,
        onDismiss = onDismiss,
        modifier = modifier,
    )
}

private fun RouteDetailsScreenState.toRouteDetails(): RouteDetails =
    RouteDetails(
        id = route.id,
        title = route.name,
        via = route.via,
        isBest = route.variant == "best",
        distance = formatDistance(route.distance),
        time = formatDuration(route.estimatedTime),
        climb = formatClimb(route.climb),
        scenicScore = formatScenicScore(route.scenicScore),
        isSaved = isSaved,
    )

private fun RouteDetailsScreenState.toWeatherTimelineEntries(): List<UiWeatherTimelineEntry> =
    weatherTimeline.map { entry ->
        UiWeatherTimelineEntry(
            hour = entry.hour,
            temperature = "${entry.temperature}°",
            condition = when (entry.condition) {
                "clear" -> WeatherCondition.Clear
                "rain" -> WeatherCondition.Rain
                "wind" -> WeatherCondition.Wind
                "storm" -> WeatherCondition.Storm
                "hot" -> WeatherCondition.Hot
                "cold" -> WeatherCondition.Cold
                else -> WeatherCondition.Clear
            },
        )
    }

private fun RouteDetailsScreenState.timeRange(): Pair<String, String> =
    Pair(
        weatherTimeline.firstOrNull()?.hour ?: "",
        weatherTimeline.lastOrNull()?.hour ?: "",
    )

private fun RouteDetailsScreenState.toPolylines(): List<PolylineData> =
    listOf(
        PolylineData(
            coordinates = PolylineDecoder.decodeOrNull(route.polyline),
            variant = when (route.variant) {
                "best" -> RouteVariant.Best
                "alt1" -> RouteVariant.Alt1
                "alt2" -> RouteVariant.Alt2
                else -> RouteVariant.Best
            },
        ),
    )

private fun formatDistance(meters: Int): String {
    val miles = (meters / 1609.34).toInt()
    return "$miles"
}

private fun formatDuration(seconds: Int): String {
    val hours = seconds / 3600
    val minutes = (seconds % 3600) / 60
    return if (hours > 0) {
        "${hours}h ${minutes}m"
    } else {
        "${minutes}m"
    }
}

private fun formatClimb(feet: Int): String =
    "$feet"

private fun formatScenicScore(score: Int): String =
    "$score"
