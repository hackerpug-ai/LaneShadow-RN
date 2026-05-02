package com.laneshadow.ui.routedetails

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.laneshadow.ui.atoms.CameraFit
import com.laneshadow.ui.atoms.CameraPosition
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.LSMap
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.MapMode
import com.laneshadow.ui.atoms.PolylineData
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.atoms.SpacingToken
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.molecules.WeatherCondition
import com.laneshadow.ui.molecules.WeatherTimelineEntry
import com.laneshadow.ui.organisms.BottomSheetSpec
import com.laneshadow.ui.organisms.LSMapLayer
import com.laneshadow.ui.organisms.LSRouteSheet
import com.laneshadow.ui.organisms.LSTopBar
import com.laneshadow.ui.organisms.RouteDetails
import com.laneshadow.ui.organisms.SheetDetent
import com.laneshadow.ui.util.PolylineDecoder
import java.util.Locale
import kotlinx.coroutines.Dispatchers

@Composable
fun RouteDetailsRoute(
    navController: NavHostController,
    sessionId: String,
    routeOptionId: String,
    modifier: Modifier = Modifier,
) {
    val viewModel = hiltViewModel<RouteDetailsViewModel, RouteDetailsViewModelFactory>(
        creationCallback = { factory ->
            factory.create(
                sessionId = sessionId,
                routeOptionId = routeOptionId,
                decodeDispatcher = Dispatchers.Default,
            )
        },
    )
    val uiState by viewModel.state.collectAsStateWithLifecycle()

    when (val state = uiState) {
        RouteDetailsUiState.Loading -> RouteDetailsPlaceholder(
            title = "Loading route details...",
            modifier = modifier,
        )

        is RouteDetailsUiState.Error -> RouteDetailsPlaceholder(
            title = "Route details unavailable",
            body = state.message,
            modifier = modifier,
        )

        is RouteDetailsUiState.Loaded -> RouteDetailsLoadedContent(
            state = state,
            onSave = viewModel::onSaveTapped,
            onRide = {},
            onDismiss = { navController.popBackStack() },
            modifier = modifier,
        )
    }
}

@Composable
private fun RouteDetailsPlaceholder(
    title: String,
    modifier: Modifier = Modifier,
    body: String? = null,
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        androidx.compose.foundation.layout.Column {
            LSText(
                text = title,
                variant = TypographyVariant.Ui.Body.Md,
            )
            if (!body.isNullOrBlank()) {
                LSText(
                    text = body,
                    variant = TypographyVariant.Ui.Body.Md,
                )
            }
        }
    }
}

@Composable
internal fun RouteDetailsLoadedContent(
    state: RouteDetailsUiState.Loaded,
    onSave: () -> Unit,
    onRide: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
    mapContent: @Composable () -> Unit = { RouteDetailsMap(state) },
) {
    LSMapLayer(
        map = mapContent,
        bottomSheet = BottomSheetSpec(
            content = {
                LSRouteSheet(
                    route = state.toRouteDetails(),
                    weatherTimeline = state.weatherTimeline.map { forecast ->
                        WeatherTimelineEntry(
                            hour = forecast.hour,
                            temperature = "${forecast.temperature}°",
                            condition = forecast.condition.toWeatherCondition(),
                        )
                    },
                    timeRange = Pair(
                        state.weatherTimeline.firstOrNull()?.hour ?: "",
                        state.weatherTimeline.lastOrNull()?.hour ?: "",
                    ),
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

@Composable
private fun RouteDetailsMap(state: RouteDetailsUiState.Loaded) {
    val polylines = listOf(
        PolylineData(
            coordinates = PolylineDecoder.decodeOrNull(state.routePolyline),
            variant = state.routeVariant.toRouteVariant(),
        ),
    )

    LSMap(
        mode = MapMode.Preview,
        camera = CameraPosition(
            center = LatLng(37.8104, -122.4752),
            zoom = 11.0,
        ),
        cameraFit = CameraFit.Polyline(padding = SpacingToken.Spacing4),
        polylines = polylines,
    )
}

private fun RouteDetailsUiState.Loaded.toRouteDetails(): RouteDetails =
    RouteDetails(
        id = routeOptionId,
        title = routeTitle,
        via = routeVia,
        isBest = isBest,
        distance = instrumentReadout.distanceKm.formatDistanceKm(),
        time = instrumentReadout.durationMinutes.toString(),
        climb = instrumentReadout.elevationGainM.toString(),
        scenicScore = instrumentReadout.scenicScore.toString(),
        isSaved = saveButtonState == SaveButtonState.AlreadySaved,
    )

private fun Double.formatDistanceKm(): String =
    String.format(Locale.US, "%.2f", this)
        .trimEnd('0')
        .trimEnd('.')

private fun String.toWeatherCondition(): WeatherCondition =
    when (lowercase()) {
        "rain" -> WeatherCondition.Rain
        "wind" -> WeatherCondition.Wind
        "storm" -> WeatherCondition.Storm
        "hot" -> WeatherCondition.Hot
        "cold" -> WeatherCondition.Cold
        else -> WeatherCondition.Clear
    }

private fun String.toRouteVariant(): RouteVariant =
    when (this) {
        "best" -> RouteVariant.Best
        "alt1" -> RouteVariant.Alt1
        "alt2" -> RouteVariant.Alt2
        else -> RouteVariant.Best
    }
