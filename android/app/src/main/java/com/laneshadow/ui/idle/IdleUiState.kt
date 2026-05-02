package com.laneshadow.ui.idle

import com.laneshadow.data.session.PlanningSession

data class IdleUiState(
    val greeting: String = "Good morning, Rider",
    val greetingMeta: String = "READY TO RIDE",
    val greetingEmphasis: String? = "Rider",
    val suggestions: List<SuggestionChip> = defaultSuggestions(),
    val inputValue: String = "",
    val isLoading: Boolean = true,
    val navigateTo: IdleNavTarget? = null,
    val errorToast: String? = null,
    val recentSessions: List<PlanningSession> = emptyList(),
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
