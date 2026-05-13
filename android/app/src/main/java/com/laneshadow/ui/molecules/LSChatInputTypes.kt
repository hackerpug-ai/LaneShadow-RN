package com.laneshadow.ui.molecules

/**
 * Types for LSChatInput molecule
 *
 * UC-MOL-06: ChatInput molecule
 */

/**
 * Suggestion chip for chat input suggestions
 *
 * @param label Display text for the chip
 */
data class SuggestionChip(
    val label: String,
)

data class AutocompleteRecommendation(
    val id: String,
    val title: String,
    val supportingText: String? = null,
    val contentDescription: String,
)

const val AUTOCOMPLETE_PANEL_TAG = "lschatinput-autocomplete"
const val AUTOCOMPLETE_LOADING_TAG = "lschatinput-autocomplete-loading"
const val AUTOCOMPLETE_RECOMMENDATION_ROW_TAG = "autocomplete-recommendation-row"
const val CHAT_INPUT_BAR_TAG = "lschatinput-bar"

/**
 * Location context for chat input location badge
 *
 * @param label Location display text
 * @param mode Location mode (manual, auto, etc.)
 */
data class LocationContext(
    val label: String,
    val mode: LocationMode,
)

/**
 * Location mode enum
 */
enum class LocationMode {
    Manual,
    Auto,
    Approximate,
}
