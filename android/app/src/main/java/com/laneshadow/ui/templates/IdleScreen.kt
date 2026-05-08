package com.laneshadow.ui.templates

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
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
import com.laneshadow.ui.molecules.LSChatInput
import com.laneshadow.ui.molecules.AutocompleteRecommendation
import com.laneshadow.ui.molecules.LocationContext as UILocationContext
import com.laneshadow.ui.molecules.LocationMode
import com.laneshadow.ui.molecules.SuggestionChip as UISuggestionChip
import com.laneshadow.ui.molecules.LSContextCapsule
import com.laneshadow.ui.molecules.CapsuleState
import com.laneshadow.ui.organisms.GlassOverlaySlot
import com.laneshadow.ui.organisms.LSMapLayer
import com.laneshadow.ui.organisms.LSTopBar
import com.laneshadow.ui.organisms.LSMapControls
import com.laneshadow.ui.organisms.MapControlsMode

/**
 * IdleScreen template — dormant Navigator idle screen.
 *
 * Renders the dormant Navigator IdleScreen with map, context capsule overlay
 * (LS Context Capsule with idle state), map controls (right-edge vertically-centered),
 * top bar, and chat input with suggestion chips + location badge.
 *
 * Driven entirely by mock data from IdleMockProvider — no live data fetching.
 *
 * @param state Screen state from IdleMockProvider
 * @param capsuleState Capsule state from IdleViewModel
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
    capsuleState: CapsuleState = CapsuleState.Idle(
        scope = com.laneshadow.ui.molecules.IdleScope.TODAY,
        headline = "Where are we riding today?",
        emphasizedWord = "today",
        metaItems = emptyList(),
    ),
    inputValue: String = "",
    onMenuTap: () -> Unit,
    onSuggestionTap: (MockSuggestionChip) -> Unit,
    onSend: (String) -> Unit,
    onCollapse: () -> Unit,
    onFilter: () -> Unit,
    onValueChange: (String) -> Unit,
    autocompleteRecommendations: List<AutocompleteRecommendation> = emptyList(),
    autocompleteError: String? = null,
    isAutocompleteLoading: Boolean = false,
    onAutocompleteRecommendationTap: (AutocompleteRecommendation) -> Unit = {},
    onLocationModeChange: (String) -> Unit = {},
    mapContent: @Composable (IdleScreenState) -> Unit = { screenState ->
        LSMap(
            mode = MapMode.Interactive,
            camera = CameraPosition(
                center = LatLng(37.8104, -122.4752),
                zoom = 10.8,
            ),
            favoriteLocations = screenState.favoriteLocations,
            modifier = Modifier
                .fillMaxSize()
                .testTag("idlescreen-map"),
        )
    },
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    LSMapLayer(
        map = {
            mapContent(state)
        },
        topOverlays = listOf(
            com.laneshadow.ui.organisms.GlassOverlaySlot(
                id = "capsule-and-controls",
                content = {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                    ) {
                        // Context Capsule — top-center
                        Box(
                            modifier = Modifier
                                .align(Alignment.TopCenter)
                                .padding(top = theme.space.md),
                        ) {
                            LSContextCapsule(
                                state = capsuleState,
                                modifier = Modifier.testTag("idle-context-capsule"),
                            )
                        }

                        // Map Controls — right-edge vertically-centered
                        Box(
                            modifier = Modifier
                                .align(Alignment.CenterEnd)
                                .padding(end = theme.space.md),
                        ) {
                            LSMapControls(
                                mode = MapControlsMode.Map,
                                modifier = Modifier.testTag("idle-map-controls"),
                            )
                        }
                    }
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
                        autocompleteRecommendations = autocompleteRecommendations,
                        autocompleteError = autocompleteError,
                        onAutocompleteRecommendationTap = onAutocompleteRecommendationTap,
                        onSuggestionTap = { uiChip ->
                            val originalChip = state.suggestions.firstOrNull { it.label == uiChip.label }
                            onSuggestionTap(originalChip ?: MockSuggestionChip(id = "", label = uiChip.label))
                        },
                        locationBadge = state.locationContext.toUiLocationContext(),
                        onLocationModeChange = { mode ->
                            onLocationModeChange(mode.name.lowercase())
                        },
                        isThinking = isAutocompleteLoading,
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
