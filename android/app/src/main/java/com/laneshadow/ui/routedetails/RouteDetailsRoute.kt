package com.laneshadow.ui.routedetails

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.PolylineData
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.molecules.WeatherCondition
import com.laneshadow.ui.molecules.WeatherTimelineEntry
import com.laneshadow.ui.organisms.RouteDetails
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
    mapContent: @Composable () -> Unit = { RouteDetailsMap(polylines = state.toPolylines()) },
) {
    RouteDetailsSurface(
        route = state.toRouteDetails(),
        weatherTimeline = state.toWeatherTimelineEntries(),
        timeRange = state.timeRange(),
        mapContent = mapContent,
        onSave = onSave,
        onRide = onRide,
        onDismiss = onDismiss,
        modifier = modifier,
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

private fun RouteDetailsUiState.Loaded.toWeatherTimelineEntries(): List<WeatherTimelineEntry> =
    weatherTimeline.map { forecast ->
        WeatherTimelineEntry(
            hour = forecast.hour,
            temperature = "${forecast.temperature}°",
            condition = forecast.condition.toWeatherCondition(),
        )
    }

private fun RouteDetailsUiState.Loaded.timeRange(): Pair<String, String> =
    Pair(
        weatherTimeline.firstOrNull()?.hour ?: "",
        weatherTimeline.lastOrNull()?.hour ?: "",
    )

private fun RouteDetailsUiState.Loaded.toPolylines(): List<PolylineData> =
    listOf(
        PolylineData(
            coordinates = routePolylineCoordinates,
            variant = routeVariant.toRouteVariant(),
        ),
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
