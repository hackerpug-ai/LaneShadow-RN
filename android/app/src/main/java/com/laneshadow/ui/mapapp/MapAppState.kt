package com.laneshadow.ui.mapapp

sealed class MapAppState {
    data object Idle : MapAppState()
    data class Planning(val sessionId: String) : MapAppState()
    data class RouteResults(val sessionId: String, val routePlanId: String) : MapAppState()
}
