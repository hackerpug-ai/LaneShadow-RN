package com.laneshadow.ui.routedetails

import com.laneshadow.data.dto.HourlyForecastDto

sealed interface RouteDetailsUiState {
    data object Loading : RouteDetailsUiState

    data class Error(
        val message: String,
    ) : RouteDetailsUiState

    data class Loaded(
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
        val instrumentReadout: InstrumentReadoutData,
        val weatherTimeline: List<HourlyForecastDto>,
        val saveButtonState: SaveButtonState,
        val showSaveSheet: Boolean = false,
    ) : RouteDetailsUiState
}

data class InstrumentReadoutData(
    val distanceKm: Double,
    val durationMinutes: Int,
    val elevationGainM: Int,
    val scenicScore: Int,
)

enum class SaveButtonState {
    NotSaved,
    AlreadySaved,
}
