package com.laneshadow.ui.templates

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.withStyle
import com.laneshadow.sandbox.mockproviders.IdleScreenState
import com.laneshadow.sandbox.mockproviders.SuggestionChip as MockSuggestionChip
import com.laneshadow.sandbox.mockproviders.LocationContext as MockLocationContext
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.CameraPosition
import com.laneshadow.ui.atoms.LSMap
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.MapMode
import com.laneshadow.ui.atoms.TextColor
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.molecules.LSChatInput
import com.laneshadow.ui.molecules.LSAdvisoryCard
import com.laneshadow.ui.molecules.LocationContext as UILocationContext
import com.laneshadow.ui.molecules.LocationMode
import com.laneshadow.ui.molecules.SuggestionChip as UISuggestionChip
import com.laneshadow.ui.organisms.GlassOverlaySlot
import com.laneshadow.ui.organisms.LSMapLayer
import com.laneshadow.ui.organisms.LSTopBar

/**
 * IdleScreen template — dormant Navigator idle screen.
 *
 * Renders the dormant Navigator IdleScreen with map, greeting overlay
 * (label + opinion-serif headline with italicized emphasis), top bar,
 * and chat input with suggestion chips + location badge.
 *
 * Driven entirely by mock data from IdleMockProvider — no live data fetching.
 *
 * @param state Screen state from IdleMockProvider
 * @param onMenuTap Callback when hamburger menu is tapped
 * @param onSuggestionTap Callback when a suggestion chip is tapped
 * @param onSend Callback when send button is tapped
 * @param onCollapse Callback when collapse button is tapped
 * @param onFilter Callback when filter button is tapped
 * @param onValueChange Callback when input value changes
 * @param modifier Modifier for the root composable
 */
@Composable
fun IdleScreen(
    state: IdleScreenState,
    inputValue: String = "",
    onMenuTap: () -> Unit,
    onSuggestionTap: (MockSuggestionChip) -> Unit,
    onSend: (String) -> Unit,
    onCollapse: () -> Unit,
    onFilter: () -> Unit,
    onValueChange: (String) -> Unit,
    onLocationModeChange: (String) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Build annotated string with italicized emphasis
    val greetingHeadline = buildAnnotatedString {
        val headline = state.greeting.headline
        val emphasis = state.greeting.emphasis

        if (emphasis != null && headline.contains(emphasis, ignoreCase = true)) {
            val startIndex = headline.indexOf(emphasis, ignoreCase = true)
            val endIndex = startIndex + emphasis.length

            // Text before emphasis
            if (startIndex > 0) {
                append(headline.substring(0, startIndex))
            }

            // Italicized emphasis
            withStyle(SpanStyle(fontStyle = FontStyle.Italic)) {
                append(headline.substring(startIndex, endIndex))
            }

            // Text after emphasis
            if (endIndex < headline.length) {
                append(headline.substring(endIndex))
            }
        } else {
            append(headline)
        }
    }

    LSMapLayer(
        map = {
            LSMap(
                mode = MapMode.Interactive,
                camera = CameraPosition(
                    center = LatLng(37.8104, -122.4752),
                    zoom = 10.8,
                ),
                favoriteLocations = state.favoriteLocations,
                modifier = Modifier
                    .fillMaxSize()
                    .testTag("idlescreen-map"),
            )
        },
        topOverlays = listOf(
            com.laneshadow.ui.organisms.GlassOverlaySlot(
                id = "greeting-overlay",
                content = {
                    GreetingOverlay(
                        meta = state.greeting.meta,
                        headline = greetingHeadline,
                        showAdvisoryCard = state.showAdvisoryCard,
                        advisoryMessage = state.advisoryMessage,
                        modifier = Modifier.testTag("idlescreen-current-user-greeting"),
                    )
                }
            )
        ),
        bottomOverlays = listOf(
            com.laneshadow.ui.organisms.GlassOverlaySlot(
                id = "chat-input",
                content = {
                    LSChatInput(
                        value = inputValue,
                        onValueChange = onValueChange,
                        placeholder = "Where should we ride?",
                        onSend = onSend,
                        onCollapse = onCollapse,
                        onFilter = onFilter,
                        suggestions = state.suggestions.map { mockChip ->
                            UISuggestionChip(label = mockChip.label)
                        },
                        onSuggestionTap = { uiChip ->
                            val originalChip = state.suggestions.firstOrNull { it.label == uiChip.label }
                            onSuggestionTap(originalChip ?: MockSuggestionChip(id = "", label = uiChip.label))
                        },
                        locationBadge = state.locationContext.toUiLocationContext(),
                        onLocationModeChange = { mode ->
                            onLocationModeChange(mode.name.lowercase())
                        },
                        isEnabled = !state.isNoLocation,  // V01: disable chat input in no-location variant
                        modifier = Modifier.testTag("chat-input"),
                    )
                }
            )
        ),
        topBar = {
            LSTopBar(
                onMenuTap = onMenuTap,
                modifier = Modifier.testTag("ls-topbar"),
            )
        },
        modifier = modifier.fillMaxSize(),
    )
}

/**
 * Greeting overlay component for IdleScreen.
 *
 * Displays the greeting meta text (day, weather, conditions) and
 * the opinion-serif headline with italicized emphasis.
 *
 * @param meta Meta text (e.g., "FRIDAY · 68°F · CLEAR")
 * @param headline Headline text with emphasis (annotated string)
 * @param showAdvisoryCard Whether to show the weather advisory card
 * @param advisoryMessage Advisory card message (if showAdvisoryCard is true)
 * @param modifier Modifier for the root composable
 */
@Composable
private fun GreetingOverlay(
    meta: String,
    headline: AnnotatedString,
    showAdvisoryCard: Boolean = false,
    advisoryMessage: String? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = modifier.padding(theme.space.md),
        verticalArrangement = Arrangement.spacedBy(theme.space.xs),
    ) {
        // Meta text (UI label small, signal color)
        Text(
            text = meta,
            style = theme.typography.ui.label.sm,
            color = if (showAdvisoryCard) theme.colors.warning.default else theme.colors.primary.default,
            modifier = Modifier.testTag("greeting-meta"),
        )

        // Headline text (Opinion XL, primary content color)
        Text(
            text = headline,
            style = theme.typography.opinion.xl,
            color = theme.content.primary,
            modifier = Modifier.testTag("greeting-headline"),
        )

        // Advisory card (V03: weather-advisory)
        if (showAdvisoryCard && advisoryMessage != null) {
            LSAdvisoryCard(
                message = advisoryMessage,
                modifier = Modifier.testTag("advisory-card"),
            )
        }
    }
}

/**
 * Convert mock provider LocationContext to UI LocationContext.
 */
private fun MockLocationContext.toUiLocationContext(): UILocationContext {
    return UILocationContext(
        label = label,
        mode = when (mode.lowercase()) {
            "manual" -> LocationMode.Manual
            "auto" -> LocationMode.Auto
            else -> LocationMode.Approximate
        }
    )
}
