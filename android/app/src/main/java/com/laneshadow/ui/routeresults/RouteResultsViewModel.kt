package com.laneshadow.ui.routeresults

import androidx.compose.ui.graphics.Color
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.route.RouteRepository
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.util.PolylineDecoder
import dagger.assisted.Assisted
import dagger.assisted.AssistedFactory
import dagger.assisted.AssistedInject
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.distinctUntilChangedBy
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.decodeFromJsonElement

@HiltViewModel(assistedFactory = RouteResultsViewModelFactory::class)
class RouteResultsViewModel @AssistedInject constructor(
    @Assisted private val sessionId: String,
    @Assisted private val decodeDispatcher: CoroutineDispatcher,
    private val routeRepository: RouteRepository,
    private val chatRepository: ChatRepository,
    private val json: Json,
) : ViewModel() {
    private val _state = MutableStateFlow<RouteResultsUiState>(RouteResultsUiState.Loading)
    val state: StateFlow<RouteResultsUiState> = _state.asStateFlow()

    init {
        observeRouteResults()
    }

    fun selectRoute(routeOptionId: String) {
        updateLoadedState { current -> current.withSelectedRoute(routeOptionId) }
    }

    fun dismissAttachments() {
        updateLoadedState { current -> current.copy(attachmentsDismissed = true) }
    }

    fun recallAttachments() {
        updateLoadedState { current -> current.copy(attachmentsDismissed = false) }
    }

    fun refine(content: String) {
        val loaded = _state.value as? RouteResultsUiState.Loaded ?: return
        if (content.isBlank()) return

        viewModelScope.launch {
            chatRepository.sendMessage(loaded.sessionId, content, currentLocation = null)
        }
    }

    private fun observeRouteResults() {
        routeResultsFlow()
            .onEach { nextState ->
                _state.update { current ->
                    when (nextState) {
                        is RouteResultsUiState.Loaded -> mergeLoadedState(current, nextState)
                        else -> nextState
                    }
                }
            }
            .launchIn(viewModelScope)
    }

    private fun routeResultsFlow(): Flow<RouteResultsUiState> =
        routeRepository.subscribeToActiveRoutePlans(sessionId)
            .map { plans ->
                plans.firstOrNull { it.status.isCompletedPlanStatus() }
            }
            .distinctUntilChangedBy { it?.id }
            .flatMapLatest { completedPlan ->
                if (completedPlan == null) {
                    flowOf(RouteResultsUiState.Loading)
                } else {
                    routeRepository.subscribeToPlanById(completedPlan.id)
                        .map { planJson ->
                            parseLoadedState(
                                sessionId = sessionId,
                                routePlanId = completedPlan.id,
                                planJson = planJson,
                            )
                        }
                        .flowOn(decodeDispatcher)
                        .onStart { emit(RouteResultsUiState.Loading) }
                }
            }
            .catch { error ->
                emit(
                    RouteResultsUiState.Error(
                        message = error.message ?: "Unable to load route results.",
                    ),
                )
            }

    private fun mergeLoadedState(
        current: RouteResultsUiState,
        next: RouteResultsUiState.Loaded,
    ): RouteResultsUiState.Loaded {
        val currentLoaded = current as? RouteResultsUiState.Loaded ?: return next
        if (currentLoaded.routePlanId != next.routePlanId) {
            return next
        }

        val preservedSelection = if (
            next.polylineEntries.any { entry ->
                entry.routeOptionId == currentLoaded.selectedRouteId
            }
        ) {
            currentLoaded.selectedRouteId
        } else {
            next.selectedRouteId
        }

        return next
            .withSelectedRoute(preservedSelection)
            .copy(attachmentsDismissed = currentLoaded.attachmentsDismissed)
    }

    private fun updateLoadedState(
        transform: (RouteResultsUiState.Loaded) -> RouteResultsUiState.Loaded,
    ) {
        _state.update { current ->
            val loaded = current as? RouteResultsUiState.Loaded ?: return@update current
            transform(loaded)
        }
    }

    private fun parseLoadedState(
        sessionId: String,
        routePlanId: String,
        planJson: JsonObject,
    ): RouteResultsUiState {
        val payload = runCatching {
            json.decodeFromJsonElement(RoutePlanPayload.serializer(), planJson)
        }.getOrElse { error ->
            return RouteResultsUiState.Error(
                message = error.message ?: "Unable to decode route results.",
            )
        }

        val completedOptions = payload.result?.options.orEmpty()
        if (completedOptions.size < 3) {
            return RouteResultsUiState.Error(
                message = "Route results require at least three completed options.",
            )
        }

        val parsedOptions = mutableListOf<ParsedRouteOption>()
        completedOptions.take(3).forEachIndexed { index, option ->
            val coordinates = PolylineDecoder.decodeOrNull(
                option.map?.overviewGeometry?.value.orEmpty(),
            )
            if (coordinates.size < 2) {
                return RouteResultsUiState.Error(
                    message = "Route results contained an invalid polyline.",
                )
            }

            val variant = variantForIndex(index)
            parsedOptions += ParsedRouteOption(
                routeOptionId = option.routeOptionId,
                title = option.label?.takeIf { it.isNotBlank() } ?: "Route ${index + 1}",
                via = option.rationale?.takeIf { it.isNotBlank() } ?: "Scenic route",
                variant = variant,
                coordinates = coordinates,
                distanceLabel = formatDistance(option.stats?.distanceMeters ?: 0),
                durationLabel = formatDuration(option.stats?.durationSeconds ?: 0),
                scenicScore = 5 - index.coerceAtMost(2),
                borderColor = routeVariantColor(variant),
            )
        }

        val selectedRouteId = parsedOptions.first().routeOptionId
        val navigatorBody = payload.statusMessage?.takeIf { it.isNotBlank() }
            ?: "Three route options are ready."

        return RouteResultsUiState.Loaded(
            sessionId = sessionId,
            routePlanId = routePlanId,
            navigatorBody = navigatorBody,
            selectedRouteId = selectedRouteId,
            attachmentsDismissed = false,
            polylineEntries = parsedOptions.map { option ->
                option.toPolylineEntry(selectedRouteId)
            },
            attachmentCards = parsedOptions.map { option ->
                option.toAttachmentCard(selectedRouteId)
            },
        )
    }

}

@AssistedFactory
interface RouteResultsViewModelFactory {
    fun create(
        sessionId: String,
        decodeDispatcher: CoroutineDispatcher,
    ): RouteResultsViewModel
}

private fun String.isCompletedPlanStatus(): Boolean =
    equals("completed", ignoreCase = true)

private fun formatDistance(distanceMeters: Int): String {
    val miles = (distanceMeters / 1609.34).toInt()
    return "$miles mi"
}

private fun formatDuration(durationSeconds: Int): String {
    val hours = durationSeconds / 3600
    val minutes = (durationSeconds % 3600) / 60
    return if (hours > 0) {
        "${hours}h ${minutes}m"
    } else {
        "${minutes}m"
    }
}

private fun variantForIndex(index: Int): RouteVariant =
    when (index) {
        0 -> RouteVariant.Best
        1 -> RouteVariant.Alt1
        else -> RouteVariant.Alt2
    }

private fun routeVariantColor(variant: RouteVariant): Color =
    when (variant) {
        RouteVariant.Best -> GeneratedTokens.color.Route.best
        RouteVariant.Alt1 -> GeneratedTokens.color.Route.alt1
        RouteVariant.Alt2 -> GeneratedTokens.color.Route.alt2
        is RouteVariant.Custom -> GeneratedTokens.color.Route.best
    }

private data class ParsedRouteOption(
    val routeOptionId: String,
    val title: String,
    val via: String,
    val variant: RouteVariant,
    val coordinates: List<LatLng>,
    val distanceLabel: String,
    val durationLabel: String,
    val scenicScore: Int,
    val borderColor: Color,
) {
    fun toPolylineEntry(selectedRouteId: String): PolylineEntry =
        PolylineEntry(
            routeOptionId = routeOptionId,
            variant = variant,
            coordinates = coordinates,
            style = if (routeOptionId == selectedRouteId) PolylineStyle.Solid else PolylineStyle.Dashed,
        )

    fun toAttachmentCard(selectedRouteId: String): AttachmentCard =
        AttachmentCard(
            routeOptionId = routeOptionId,
            title = title,
            via = via,
            distanceLabel = distanceLabel,
            durationLabel = durationLabel,
            scenicScore = scenicScore,
            variant = variant,
            borderColor = borderColor,
            selected = routeOptionId == selectedRouteId,
            isBest = variant == RouteVariant.Best,
        )
}

@Serializable
private data class RoutePlanPayload(
    @SerialName("_id") val id: String = "",
    val statusMessage: String? = null,
    val result: RoutePlanResultPayload? = null,
)

@Serializable
private data class RoutePlanResultPayload(
    val options: List<RouteOptionPayload> = emptyList(),
)

@Serializable
private data class RouteOptionPayload(
    val routeOptionId: String = "",
    val label: String? = null,
    val rationale: String? = null,
    val stats: RouteOptionStatsPayload? = null,
    val map: RouteOptionMapPayload? = null,
)

@Serializable
private data class RouteOptionStatsPayload(
    val distanceMeters: Int = 0,
    val durationSeconds: Int = 0,
)

@Serializable
private data class RouteOptionMapPayload(
    val overviewGeometry: RouteOptionGeometryPayload? = null,
)

@Serializable
private data class RouteOptionGeometryPayload(
    val value: String = "",
)

private fun RouteResultsUiState.Loaded.withSelectedRoute(
    routeOptionId: String,
): RouteResultsUiState.Loaded {
    val resolvedRouteOptionId = if (polylineEntries.any { it.routeOptionId == routeOptionId }) {
        routeOptionId
    } else {
        selectedRouteId
    }

    return copy(
        selectedRouteId = resolvedRouteOptionId,
        polylineEntries = polylineEntries.map { entry ->
            entry.copy(
                style = if (entry.routeOptionId == resolvedRouteOptionId) {
                    PolylineStyle.Solid
                } else {
                    PolylineStyle.Dashed
                },
            )
        },
        attachmentCards = attachmentCards.map { card ->
            card.copy(selected = card.routeOptionId == resolvedRouteOptionId)
        },
    )
}
