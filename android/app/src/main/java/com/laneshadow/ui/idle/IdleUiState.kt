package com.laneshadow.ui.idle

import com.laneshadow.data.favorites.FavoriteLocation
import com.laneshadow.data.session.PlanningSession
import com.laneshadow.data.weather.WeatherSummary

/**
 * Greeting scope based on time of day
 */
enum class GreetingScope {
    TODAY,
    TONIGHT,
}

data class IdleUiState(
    val greeting: String = "Good morning, Rider",
    val greetingMeta: String = "READY TO RIDE",
    val greetingEmphasis: String? = "Rider",
    val suggestions: List<SuggestionChip> = defaultSuggestions(),
    val inputValue: String = "",
    val isLoading: Boolean = true,
    val navigateTo: IdleNavTarget? = null,
    val errorToast: String? = null,
    val subscriptionError: String? = null,
    val recentSessions: List<PlanningSession> = emptyList(),

    // New fields for Sprint 6
    val firstName: String = "Rider",
    val greetingScope: GreetingScope = GreetingScope.TODAY,
    val metaRow: String = "",
    val weatherSummary: WeatherSummary? = null,
    val favoriteLocations: List<FavoriteLocation> = emptyList(),
    val showAdvisoryCard: Boolean = false,
    val advisoryMessage: String? = null,

    // Location fields for Sprint 6 AND-T03
    val locationLabel: String? = null,
    val locationMode: String = "manual",
    val isLocationEnabled: Boolean = false,
    val locationUnavailable: Boolean = false,
    val showStaticSuggestions: Boolean = true,
    val placeSuggestions: List<IdlePlaceSuggestion> = emptyList(),
    val selectedPlace: IdleSelectedPlace? = null,
    val autocompleteError: String? = null,
    val isAutocompleteLoading: Boolean = false,
)

data class IdlePlaceSuggestion(
    val id: String,
    val name: String,
    val label: String,
    val secondaryText: String? = null,
    val featureType: String,
    val distanceMeters: Double? = null,
)

data class IdleSelectedPlace(
    val id: String,
    val name: String,
    val label: String,
    val lat: Double,
    val lng: Double,
    val featureType: String,
)

sealed interface IdleNavTarget {
    data class Planning(val sessionId: String) : IdleNavTarget
}

data class SuggestionChip(
    val text: String,
)

internal fun defaultSuggestions(): List<SuggestionChip> =
    listOf(
        SuggestionChip(text = "Twisty back roads"),
        SuggestionChip(text = "Coastal cruise"),
        SuggestionChip(text = "Half-day loop"),
        SuggestionChip(text = "Mountain passes"),
    )

internal fun buildGreeting(timeOfDay: String, displayName: String): String =
    "Good $timeOfDay, $displayName"

internal fun timeOfDayLabel(hourOfDay: Int): String =
    when (hourOfDay) {
        in 5..11 -> "morning"
        in 12..17 -> "afternoon"
        else -> "evening"
    }
