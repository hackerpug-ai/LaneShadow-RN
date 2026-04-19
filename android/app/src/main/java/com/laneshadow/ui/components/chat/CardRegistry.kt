package com.laneshadow.ui.components.chat

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.ui.components.chat.cards.ReasoningCard
import com.laneshadow.ui.components.molecules.ChatMessage
import com.laneshadow.ui.components.molecules.ChatMessageKind

/**
 * Card Registry
 *
 * Maps ChatMessageKind values to their rendering components.
 * When ChatTranscript encounters a non-text message, it looks up the
 * kind in this registry and renders the mapped component.
 *
 * Placeholder stubs are used for kinds whose underlying tools are not
 * yet wired up (weather, saved_route) — they render nothing until
 * replaced with real components.
 *
 * @param kind The type of card to render
 * @param message The chat message containing card data
 * @param modifier Modifier for the card component
 * @return The composable card content, or null if not implemented
 */
@Composable
fun renderCard(
    kind: ChatMessageKind?,
    message: ChatMessage,
    modifier: Modifier = Modifier,
): Unit? {
    // If kind is null or TEXT, return null — handled by caller (text rendering)
    if (kind == null || kind == ChatMessageKind.TEXT) {
        return null
    }

    // Dispatch to appropriate card renderer based on kind
    // All cards currently return null (not implemented) until their
    // underlying tools are wired up
    return when (kind) {
        ChatMessageKind.ROUTING_CARD -> null // TODO: Implement RoutingCard
        ChatMessageKind.WEATHER_CARD -> null // TODO: Implement WeatherCard
        ChatMessageKind.SAVED_ROUTE_CARD -> null // TODO: Implement SavedRouteCard
        ChatMessageKind.REASONING -> {
            ReasoningCard(message = message, modifier = modifier)
            Unit // Return Unit to satisfy nullable return type
        }
        ChatMessageKind.THINKING_CARD -> null // TODO: Implement ThinkingCard
        ChatMessageKind.PLANNING -> null // TODO: Implement PlanningCard
        ChatMessageKind.LOCATION_SEARCH_CARD -> null // TODO: Implement LocationSearchCard
        ChatMessageKind.TEXT -> null // Handled by caller
    }
}
