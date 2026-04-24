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
