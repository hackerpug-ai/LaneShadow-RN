package com.laneshadow.ui.templates

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.laneshadow.sandbox.mockproviders.ErrorScreenState
import com.laneshadow.sandbox.mockproviders.SuggestionChip as MockSuggestionChip
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.CameraPosition
import com.laneshadow.ui.atoms.LSMap
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.MapMode
import com.laneshadow.ui.molecules.LSChatInput
import com.laneshadow.ui.molecules.SuggestionChip as UISuggestionChip
import com.laneshadow.ui.organisms.GlassOverlaySlot
import com.laneshadow.ui.organisms.LSInlineErrorCallout
import com.laneshadow.ui.organisms.LSMapLayer
import com.laneshadow.ui.organisms.LSTopBar

/**
 * ErrorScreen template — Navigator error recovery screen.
 *
 * Renders the Navigator ErrorScreen with map backdrop,
 * LSInlineErrorCallout (warn-stripe + compass chip + "THE NAVIGATOR" label +
 * opinion-serif body + muted detail + suggestion chips), and recovery chat input.
 *
 * Driven entirely by mock data from ErrorMockProvider — no live data fetching.
 *
 * @param state Screen state from ErrorMockProvider
 * @param onMenuTap Callback when hamburger menu is tapped
 * @param onSuggestionTap Callback when a suggestion chip is tapped
 * @param onSend Callback when send button is tapped
 * @param onCollapse Callback when collapse button is tapped
 * @param onFilter Callback when filter button is tapped
 * @param onValueChange Callback when input value changes
 * @param modifier Modifier for the root composable
 */
@Composable
fun ErrorScreen(
    state: ErrorScreenState,
    onMenuTap: () -> Unit,
    onSuggestionTap: (MockSuggestionChip) -> Unit,
    onSend: (String) -> Unit,
    onCollapse: () -> Unit,
    onFilter: () -> Unit,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    var inputValue by remember { mutableStateOf("") }

    // Determine chat input state based on error state
    val isChatEnabled = !state.isOffline
    val isRecovered = state.isRecovered
    val showFilterButton = !isRecovered

    LSMapLayer(
        map = {
            LSMap(
                mode = MapMode.Interactive,
                camera = CameraPosition(
                    center = LatLng(36.5, -121.9), // Big Sur region
                    zoom = 10.0,
                ),
            )
        },
        topOverlays = listOf(
            GlassOverlaySlot(
                id = "error-callout",
                content = {
                    LSInlineErrorCallout(
                        body = state.error.body,
                        detail = state.error.detail,
                        suggestions = state.suggestions.map { mockChip ->
                            com.laneshadow.ui.organisms.SuggestionChip(
                                label = mockChip.label,
                                isPrimary = mockChip.isPrimary
                            )
                        },
                        onSuggestionTap = { uiChip ->
                            // Find the original mock chip to preserve its ID
                            val originalChip = state.suggestions.firstOrNull { it.label == uiChip.label }
                            onSuggestionTap(originalChip ?: MockSuggestionChip(id = "", label = uiChip.label))
                        },
                        isRecovered = isRecovered,
                        modifier = Modifier.testTag("error-callout"),
                    )
                }
            )
        ),
        bottomOverlays = listOf(
            GlassOverlaySlot(
                id = "chat-input",
                content = {
                    LSChatInput(
                        value = inputValue,
                        onValueChange = { newValue ->
                            inputValue = newValue
                            onValueChange(newValue)
                        },
                        placeholder = "Try again, or let me know what to change…",
                        onSend = onSend,
                        onCollapse = onCollapse,
                        onFilter = onFilter,
                        isEnabled = isChatEnabled,
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
