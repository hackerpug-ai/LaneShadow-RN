package com.laneshadow.ui.templates

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.laneshadow.sandbox.mockproviders.RouteDetailsScreenState
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.CameraFit
import com.laneshadow.ui.atoms.CameraPosition
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.LSMap
import com.laneshadow.ui.atoms.MapMode
import com.laneshadow.ui.atoms.PolylineData
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.atoms.SpacingToken
import com.laneshadow.ui.molecules.WeatherCondition
import com.laneshadow.ui.molecules.WeatherTimelineEntry as UiWeatherTimelineEntry
import com.laneshadow.ui.organisms.BottomSheetSpec
import com.laneshadow.ui.organisms.LSMapLayer
import com.laneshadow.ui.organisms.LSRouteSheet
import com.laneshadow.ui.organisms.LSTopBar
import com.laneshadow.ui.organisms.RouteDetails
import com.laneshadow.ui.organisms.SheetDetent
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
@Composable
fun RouteDetailsScreen(
    state: RouteDetailsScreenState,
    onSave: () -> Unit,
    onRide: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Convert mock route to RouteDetails for LSRouteSheet
    val routeDetails = RouteDetails(
        id = state.route.id,
        title = state.route.name,
        via = state.route.via,
        isBest = state.route.variant == "best",
        distance = formatDistance(state.route.distance),
        time = formatDuration(state.route.estimatedTime),
        climb = formatClimb(state.route.climb),
        scenicScore = formatScenicScore(state.route.scenicScore),
    )

    // Convert mock weather timeline to UI weather timeline entries
    val weatherTimeline = state.weatherTimeline.map { entry ->
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

    // Convert mock route polyline to PolylineData
    val polylines = listOf(
        PolylineData(
            coordinates = PolylineDecoder.decodeOrNull(state.route.polyline),
            variant = when (state.route.variant) {
                "best" -> RouteVariant.Best
                "alt1" -> RouteVariant.Alt1
                "alt2" -> RouteVariant.Alt2
                else -> RouteVariant.Best
            },
        )
    )

    LSMapLayer(
        map = {
            LSMap(
                mode = MapMode.Preview,
                camera = CameraPosition(
                    center = LatLng(37.8104, -122.4752),
                    zoom = 11.0,
                ),
                cameraFit = CameraFit.Polyline(padding = SpacingToken.Spacing4),
                polylines = polylines,
            )
        },
        bottomSheet = BottomSheetSpec(
            content = {
                LSRouteSheet(
                    route = routeDetails,
                    weatherTimeline = weatherTimeline,
                    onSave = onSave,
                    onRide = onRide,
                    onDismiss = onDismiss,
                    modifier = Modifier.testTag("route-details-sheet"),
                )
            },
            detent = SheetDetent.Large,
            onDismiss = onDismiss,
        ),
        topBar = {
            LSTopBar(
                onMenuTap = {},
                modifier = Modifier.testTag("route-details-topbar"),
            )
        },
        modifier = modifier.fillMaxSize(),
    )
}

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

private fun formatClimb(feet: Int): String {
    return "$feet"
}

private fun formatScenicScore(score: Int): String {
    return "$score"
}
