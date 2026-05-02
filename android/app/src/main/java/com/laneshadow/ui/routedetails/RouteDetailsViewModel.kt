package com.laneshadow.ui.routedetails

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.laneshadow.data.dto.HourlyForecastDto
import com.laneshadow.data.dto.RouteEnrichmentDto
import com.laneshadow.data.route.RoutePlan
import com.laneshadow.data.route.RouteRepository
import com.laneshadow.data.savedroutes.SavedRouteRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedFactory
import dagger.assisted.AssistedInject
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.stateIn
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.decodeFromJsonElement

@HiltViewModel(assistedFactory = RouteDetailsViewModelFactory::class)
class RouteDetailsViewModel @AssistedInject constructor(
    @Assisted("sessionId") private val sessionId: String,
    @Assisted("routeOptionId") private val routeOptionId: String,
    @Assisted private val decodeDispatcher: CoroutineDispatcher,
    private val routeRepository: RouteRepository,
    private val savedRouteRepository: SavedRouteRepository,
    private val json: Json,
) : ViewModel() {
    private val saveSheetVisible = MutableStateFlow(false)

    val state: StateFlow<RouteDetailsUiState> =
        routeRepository.subscribeToActiveRoutePlans(sessionId)
            .map { plans -> selectRoutePlanId(plans, routeOptionId) }
            .distinctUntilChanged()
            .flatMapLatest { routePlanId ->
                if (routePlanId == null) {
                    flowOf<RouteDetailsUiState>(RouteDetailsUiState.Loading)
                } else {
                    routeRepository.subscribeToPlanById(routePlanId)
                        .map { planJson ->
                            parseSnapshot(
                                sessionId = sessionId,
                                routePlanId = routePlanId,
                                routeOptionId = routeOptionId,
                                planJson = planJson,
                            )
                        }
                        .flatMapLatest { snapshot ->
                            val enrichmentFlow = routeRepository.subscribeToEnrichments(routePlanId)
                                .map { enrichmentJson ->
                                    enrichmentJson.toWeatherTimeline(
                                        json = json,
                                        routeOptionId = routeOptionId,
                                    )
                                }
                                .onStart { emit(emptyList()) }
                                .catch { emit(emptyList()) }

                            val savedFlow = savedRouteRepository.matchesFingerprint(
                                snapshot.routeIndexFingerprint,
                            )
                                .onStart { emit(false) }
                                .catch { emit(false) }

                            flow<RouteDetailsUiState> {
                                emit(RouteDetailsUiState.Loading)
                                emitAll(
                                    combine(
                                        enrichmentFlow,
                                        savedFlow,
                                        saveSheetVisible,
                                    ) { weatherTimeline, isSaved, showSaveSheet ->
                                        snapshot.toUiState(
                                            weatherTimeline = weatherTimeline,
                                            saveButtonState = if (isSaved) {
                                                SaveButtonState.AlreadySaved
                                            } else {
                                                SaveButtonState.NotSaved
                                            },
                                            showSaveSheet = showSaveSheet,
                                        )
                                    },
                                )
                            }
                        }
                }
            }
            .catch { error ->
                emit(
                    RouteDetailsUiState.Error(
                        message = error.message ?: "Unable to load route details.",
                    ),
                )
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5_000),
                initialValue = RouteDetailsUiState.Loading,
            )

    init {
        state.onEach { }.launchIn(viewModelScope)
    }

    fun onSaveTapped() {
        saveSheetVisible.value = true
    }

    private fun parseSnapshot(
        sessionId: String,
        routePlanId: String,
        routeOptionId: String,
        planJson: JsonObject,
    ): RouteDetailsSnapshot {
        val payload = json.decodeFromJsonElement(RoutePlanPayload.serializer(), planJson)
        val options = payload.result?.options.orEmpty()
        val selectedIndex = options.indexOfFirst { it.routeOptionId == routeOptionId }
        if (selectedIndex < 0) {
            error("Selected route option $routeOptionId was not found in plan $routePlanId.")
        }

        val selectedOption = options[selectedIndex]
        val stats = selectedOption.stats ?: error("Selected route option is missing stats data.")
        val map = selectedOption.map ?: error("Selected route option is missing map data.")
        val overviewGeometry = map.overviewGeometry ?: error("Selected route option is missing route geometry.")
        val routePolyline = overviewGeometry.value
        if (routePolyline.isBlank()) {
            error("Selected route option is missing polyline data.")
        }

        val routeVariant = variantForIndex(selectedIndex)
        return RouteDetailsSnapshot(
            sessionId = sessionId,
            routePlanId = routePlanId,
            routeOptionId = selectedOption.routeOptionId,
            routeTitle = selectedOption.label?.takeIf { it.isNotBlank() } ?: "Route details",
            routeVia = selectedOption.rationale?.takeIf { it.isNotBlank() } ?: "Selected route",
            routeVariant = routeVariant,
            isBest = routeVariant == "best",
            routePolyline = routePolyline,
            routeDistanceMeters = stats.distanceMeters,
            routeDurationSeconds = stats.durationSeconds,
            routeElevationGainMeters = stats.elevationGainMeters,
            routeScenicScore = stats.scenicScore,
            routeIndexFingerprint = computeRouteIndexFingerprint(map),
        )
    }

}

@AssistedFactory
interface RouteDetailsViewModelFactory {
    fun create(
        @Assisted("sessionId") sessionId: String,
        @Assisted("routeOptionId") routeOptionId: String,
        decodeDispatcher: CoroutineDispatcher,
    ): RouteDetailsViewModel
}

private fun selectRoutePlanId(
    plans: List<RoutePlan>,
    routeOptionId: String,
): String? {
    plans.firstOrNull { plan ->
        plan.options.any { option -> option.routeOptionId == routeOptionId }
    }?.let { return it.id }

    plans.firstOrNull { plan -> plan.status.isCompletedPlanStatus() }?.let { return it.id }

    return plans.firstOrNull()?.id
}

private fun String.isCompletedPlanStatus(): Boolean =
    equals("completed", ignoreCase = true)

private fun RouteDetailsSnapshot.toUiState(
    weatherTimeline: List<HourlyForecastDto>,
    saveButtonState: SaveButtonState,
    showSaveSheet: Boolean,
): RouteDetailsUiState.Loaded =
    RouteDetailsUiState.Loaded(
        sessionId = sessionId,
        routePlanId = routePlanId,
        routeOptionId = routeOptionId,
        routeTitle = routeTitle,
        routeVia = routeVia,
        routeVariant = routeVariant,
        isBest = isBest,
        routePolyline = routePolyline,
        routeDistanceMeters = routeDistanceMeters,
        routeDurationSeconds = routeDurationSeconds,
        routeElevationGainMeters = routeElevationGainMeters,
        routeScenicScore = routeScenicScore,
        routeIndexFingerprint = routeIndexFingerprint,
        instrumentReadout = InstrumentReadoutData(
            distanceKm = routeDistanceMeters / 1000.0,
            durationMinutes = routeDurationSeconds / 60,
            elevationGainM = routeElevationGainMeters,
            scenicScore = routeScenicScore,
        ),
        weatherTimeline = weatherTimeline,
        saveButtonState = saveButtonState,
        showSaveSheet = showSaveSheet,
    )

private fun JsonElement.toWeatherTimeline(
    json: Json,
    routeOptionId: String,
): List<HourlyForecastDto> =
    runCatching {
        json.decodeFromJsonElement(RouteEnrichmentDto.serializer(), this)
            .weatherTimeline(routeOptionId)
    }.getOrDefault(emptyList())

private fun computeRouteIndexFingerprint(map: RouteOptionMapPayload): String {
    val legParts = map.legs.joinToString(";") { leg ->
        "${leg.distanceMeters}|${leg.durationSeconds}|${leg.geometry?.encoding.orEmpty()}|${leg.geometry?.precision ?: 0}|${leg.geometry?.value.orEmpty()}"
    }
    val fingerprintInput = buildString {
        append(map.provider)
        append('|')
        append(map.overviewGeometry?.encoding.orEmpty())
        append('|')
        append(map.overviewGeometry?.precision ?: 0)
        append('|')
        append(map.overviewGeometry?.value.orEmpty())
        append('|')
        append(legParts)
    }
    return "fnv1a:${fnv1a32(fingerprintInput)}"
}

private fun fnv1a32(input: String): String {
    var hash = 2_166_136_261u
    input.forEach { char ->
        hash = hash xor char.code.toUInt()
        hash *= 16_777_619u
    }
    return hash.toString(16).padStart(8, '0')
}

private fun variantForIndex(index: Int): String =
    when (index) {
        0 -> "best"
        1 -> "alt1"
        else -> "alt2"
    }

private data class RouteDetailsSnapshot(
    val sessionId: String,
    val routePlanId: String,
    val routeOptionId: String,
    val routeTitle: String,
    val routeVia: String,
    val routeVariant: String,
    val isBest: Boolean,
    val routePolyline: String,
    val routeDistanceMeters: Int,
    val routeDurationSeconds: Int,
    val routeElevationGainMeters: Int,
    val routeScenicScore: Int,
    val routeIndexFingerprint: String,
)

@kotlinx.serialization.Serializable
private data class RoutePlanPayload(
    val result: RoutePlanResultPayload? = null,
)

@kotlinx.serialization.Serializable
private data class RoutePlanResultPayload(
    val options: List<RouteOptionPayload> = emptyList(),
)

@kotlinx.serialization.Serializable
private data class RouteOptionPayload(
    val routeOptionId: String = "",
    val label: String? = null,
    val rationale: String? = null,
    val stats: RouteOptionStatsPayload? = null,
    val map: RouteOptionMapPayload? = null,
)

@kotlinx.serialization.Serializable
private data class RouteOptionStatsPayload(
    val distanceMeters: Int = 0,
    val durationSeconds: Int = 0,
    val elevationGainMeters: Int = 0,
    val scenicScore: Int = 0,
)

@kotlinx.serialization.Serializable
private data class RouteOptionMapPayload(
    val provider: String = "",
    val overviewGeometry: RoutePolylinePayload? = null,
    val legs: List<RouteLegPayload> = emptyList(),
)

@kotlinx.serialization.Serializable
private data class RoutePolylinePayload(
    val encoding: String = "",
    val precision: Int = 0,
    val value: String = "",
)

@kotlinx.serialization.Serializable
private data class RouteLegPayload(
    val distanceMeters: Int = 0,
    val durationSeconds: Int = 0,
    val geometry: RoutePolylinePayload? = null,
)
