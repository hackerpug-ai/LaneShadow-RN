package com.laneshadow.navigation

import kotlinx.serialization.Serializable

sealed interface Route {
    @Serializable data object Splash : Route
    @Serializable data object SignIn : Route
    @Serializable data object SignUp : Route
    @Serializable data object OAuthCallback : Route
    @Serializable data object Verify : Route
    @Serializable data object Home : Route
    @Serializable data object Sessions : Route
    @Serializable data class RouteResults(
        val sessionId: String,
    ) : Route
    @Serializable data class RouteDetails(
        val sessionId: String,
        val routeOptionId: String,
    ) : Route
    @Serializable data object SavedRoutes : Route
    @Serializable data object SavedRouteDetail : Route
    @Serializable data object Settings : Route
    @Serializable data object Sandbox : Route
}
