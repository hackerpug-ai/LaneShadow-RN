package com.laneshadow.ui.molecules

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.ButtonState
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.GlassVariant
import com.laneshadow.ui.atoms.LSButton
import com.laneshadow.ui.atoms.LSGlassPanel
import com.laneshadow.ui.atoms.LSSpinner
import com.laneshadow.ui.atoms.LSTextField
import com.laneshadow.ui.atoms.SpinnerSize

/**
 * LSChatInput molecule component
 *
 * Chat input molecule composing LSGlassPanel, LSTextField, LSButton, LSSpinner, and LSPill atoms.
 * Follows the design spec at .spec/design/system/molecules/chat-input/
 *
 * @param value Current input value
 * @param onValueChange Callback when input value changes
 * @param placeholder Optional placeholder text
 * @param onSend Callback when send button is tapped
 * @param onCollapse Callback when collapse button is tapped
 * @param onFilter Callback when filter button is tapped
 * @param suggestions Optional list of suggestion chips
 * @param onSuggestionTap Callback when a suggestion chip is tapped
 * @param locationBadge Optional location context badge
 * @param isThinking Whether the input is in a thinking/loading state
 * @param isEnabled Whether the input is enabled
 * @param modifier Modifier for the chat input container
 */
@Composable
fun LSChatInput(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String? = null,
    onSend: (String) -> Unit,
    onCollapse: () -> Unit,
    onFilter: () -> Unit,
    suggestions: List<SuggestionChip>? = null,
    onSuggestionTap: (SuggestionChip) -> Unit = {},
    locationBadge: LocationContext? = null,
    isThinking: Boolean = false,
    isEnabled: Boolean = true,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val inputHeight = theme.sizing.touchTarget

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(theme.space.sm),
    ) {
        // Location context bar (top optional layer)
        if (locationBadge != null) {
            LSLocationContextBar(
                location = locationBadge.label,
                mode = locationBadge.mode,
                onModeChange = { /* TODO: Handle mode change */ },
            )
        }

        // Suggestion chips LazyRow (middle optional layer)
        if (suggestions != null) {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
            ) {
                items(suggestions) { chip ->
                    LSSuggestionChip(
                        label = chip.label,
                        onTap = { onSuggestionTap(chip) },
                        modifier = Modifier.padding(horizontal = theme.space.xs),
                    )
                }
            }
        }

        // Input bar (bottom layer - LSGlassPanel)
        LSGlassPanel(
            variant = GlassVariant.Chrome,
            modifier = Modifier
                .fillMaxWidth()
                .height(inputHeight),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
            ) {
                // Leading collapse button
                LSButton(
                    label = "",
                    variant = ButtonVariant.Ghost,
                    state = if (isEnabled) ButtonState.Default else ButtonState.Disabled,
                    leadingIcon = IconName.Collapse,
                    onClick = onCollapse,
                )

                // Text input
                LSTextField(
                    value = value,
                    onValueChange = onValueChange,
                    state = if (isEnabled || isThinking) com.laneshadow.ui.atoms.InputState.Default else com.laneshadow.ui.atoms.InputState.Disabled,
                    placeholder = placeholder,
                    modifier = Modifier.weight(1f),
                )

                // Trailing slot: spinner when thinking, send when non-empty, sliders when empty
                when {
                    isThinking -> {
                        LSSpinner(size = SpinnerSize.Md)
                    }
                    value.isNotEmpty() -> {
                        LSButton(
                            label = "",
                            variant = ButtonVariant.Primary,
                            state = if (isEnabled) ButtonState.Default else ButtonState.Disabled,
                            leadingIcon = IconName.Send,
                            onClick = { onSend(value) },
                        )
                    }
                    else -> {
                        LSButton(
                            label = "",
                            variant = ButtonVariant.Ghost,
                            state = if (isEnabled) ButtonState.Default else ButtonState.Disabled,
                            leadingIcon = IconName.Sliders,
                            onClick = onFilter,
                        )
                    }
                }
            }
        }
    }
}
