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
import com.laneshadow.sandbox.mockproviders.Route
import com.laneshadow.sandbox.mockproviders.RouteDetailsScreenState
import com.laneshadow.sandbox.mockproviders.WeatherTimelineEntry as SandboxWeatherTimelineEntry
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.templates.RouteDetailsScreen
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

        is RouteDetailsUiState.Loaded -> RouteDetailsScreen(
            state = state.toScreenState(),
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
    body: String? = null,
    modifier: Modifier = Modifier,
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

private fun RouteDetailsUiState.Loaded.toScreenState(): RouteDetailsScreenState =
    RouteDetailsScreenState(
        route = Route(
            id = routeOptionId,
            name = routeTitle,
            via = routeVia,
            distance = routeDistanceMeters,
            estimatedTime = routeDurationSeconds,
            climb = routeElevationGainMeters,
            scenicScore = routeScenicScore,
            difficulty = routeVariant,
            polyline = routePolyline,
            variant = routeVariant,
        ),
        weatherTimeline = weatherTimeline.map { forecast -> forecast.toWeatherTimelineEntry() },
        isSaved = saveButtonState == SaveButtonState.AlreadySaved,
    )

private fun com.laneshadow.data.dto.HourlyForecastDto.toWeatherTimelineEntry(): SandboxWeatherTimelineEntry =
    SandboxWeatherTimelineEntry(
        hour = hour,
        temperature = temperature.toIntOrNull() ?: 0,
        condition = condition.toWeatherCondition(),
    )

private fun String.toWeatherCondition(): String =
    when (lowercase()) {
        "rain" -> "rain"
        "wind" -> "wind"
        "storm" -> "storm"
        "hot" -> "hot"
        "cold" -> "cold"
        else -> "clear"
    }
