package com.laneshadow.ui.routeresults

import androidx.compose.ui.graphics.Color
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.RouteVariant

sealed interface RouteResultsUiState {
    data object Loading : RouteResultsUiState

    data class Empty(
        val message: String,
    ) : RouteResultsUiState

    data class Error(
        val message: String,
    ) : RouteResultsUiState

    data class Loaded(
        val sessionId: String,
        val routePlanId: String,
        val navigatorBody: String,
        val selectedRouteId: String,
        val attachmentsDismissed: Boolean,
        val polylineEntries: List<PolylineEntry>,
        val attachmentCards: List<AttachmentCard>,
    ) : RouteResultsUiState {
        val showRecallChip: Boolean
            get() = attachmentsDismissed
    }
}

enum class PolylineStyle {
    Solid,
    Dashed,
}

data class PolylineEntry(
    val routeOptionId: String,
    val variant: RouteVariant,
    val coordinates: List<LatLng>,
    val style: PolylineStyle = PolylineStyle.Dashed,
    val drawProgress: Float = 1f,
)

data class AttachmentCard(
    val routeOptionId: String,
    val title: String,
    val via: String,
    val distanceLabel: String,
    val durationLabel: String,
    val scenicScore: Int,
    val variant: RouteVariant,
    val borderColor: Color,
    val selected: Boolean,
    val isBest: Boolean = false,
    val weatherCondition: String? = null,
    val weatherLabel: String? = null,
)
