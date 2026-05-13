package com.laneshadow.ui.molecules

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.ButtonState
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.GlassVariant
import com.laneshadow.ui.atoms.LSButton
import com.laneshadow.ui.atoms.LSDivider
import com.laneshadow.ui.atoms.LSGlassPanel
import com.laneshadow.ui.atoms.LSSpinner
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.LSTextField
import com.laneshadow.ui.atoms.SpinnerSize
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.organisms.LSInlineErrorCallout

/**
 * LSChatInput molecule component
 *
 * Chat input molecule composing LSGlassPanel, LSTextField, LSButton, LSSpinner,
 * LSSuggestionChip, and LSLocationContextBar components.
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
 * @param isAutocompleteLoading Whether place autocomplete suggestions are loading
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
    autocompleteRecommendations: List<AutocompleteRecommendation> = emptyList(),
    autocompleteError: String? = null,
    isAutocompleteLoading: Boolean = false,
    onAutocompleteRecommendationTap: (AutocompleteRecommendation) -> Unit = {},
    onSuggestionTap: (SuggestionChip) -> Unit = {},
    locationBadge: LocationContext? = null,
    onLocationModeChange: (LocationMode) -> Unit = {},
    isThinking: Boolean = false,
    isEnabled: Boolean = true,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val inputHeight = theme.sizing.touchTarget

    Column(
        modifier = modifier
            .then(
                if (!isEnabled) Modifier.semantics { disabled() }
                else Modifier
            ),
        verticalArrangement = Arrangement.spacedBy(theme.space.sm),
    ) {
        // Location context bar (top optional layer)
        if (locationBadge != null) {
            LSLocationContextBar(
                location = locationBadge.label,
                mode = locationBadge.mode,
                onModeChange = {
                    val nextMode =
                        if (locationBadge.mode == LocationMode.Manual) {
                            LocationMode.Auto
                        } else {
                            LocationMode.Manual
                        }
                    onLocationModeChange(nextMode)
                },
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

        if (isAutocompleteLoading) {
            LSGlassPanel(
                variant = GlassVariant.Chrome,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag(AUTOCOMPLETE_PANEL_TAG),
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag(AUTOCOMPLETE_LOADING_TAG)
                        .semantics { contentDescription = "Searching places" }
                        .padding(
                            horizontal = theme.space.md,
                            vertical = theme.space.sm,
                        ),
                    horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    LSSpinner(size = SpinnerSize.Md)
                    LSText(
                        text = "Searching places...",
                        variant = TypographyVariant.Ui.Body.Sm,
                        color = ContentColor.Secondary,
                    )
                }
            }
        } else if (autocompleteError?.isNotBlank() == true) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag(AUTOCOMPLETE_PANEL_TAG),
            ) {
                LSInlineErrorCallout(
                    body = "Autocomplete is unavailable right now.",
                    detail = autocompleteError,
                    suggestions = emptyList(),
                    onSuggestionTap = {},
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        } else if (autocompleteRecommendations.isNotEmpty()) {
            LSGlassPanel(
                variant = GlassVariant.Chrome,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag(AUTOCOMPLETE_PANEL_TAG),
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    autocompleteRecommendations.take(3).forEachIndexed { index, recommendation ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable(enabled = isEnabled) {
                                    onAutocompleteRecommendationTap(recommendation)
                                }
                                .semantics {
                                    role = Role.Button
                                    contentDescription = recommendation.contentDescription
                                }
                                .testTag(AUTOCOMPLETE_RECOMMENDATION_ROW_TAG)
                                .padding(
                                    horizontal = theme.space.md,
                                    vertical = theme.space.sm,
                                ),
                            verticalArrangement = Arrangement.spacedBy(theme.space.xs),
                        ) {
                            LSText(
                                text = recommendation.title,
                                variant = TypographyVariant.Ui.Body.Md,
                                color = ContentColor.Primary,
                                modifier = Modifier.heightIn(min = theme.sizing.touchTarget),
                            )
                            recommendation.supportingText
                                ?.takeIf { it.isNotBlank() && it != recommendation.title }
                                ?.let { supportingText ->
                                    LSText(
                                        text = supportingText,
                                        variant = TypographyVariant.Ui.Body.Sm,
                                        color = ContentColor.Secondary,
                                    )
                                }
                        }

                        if (index < autocompleteRecommendations.take(3).lastIndex) {
                            LSDivider()
                        }
                    }
                }
            }
        }

        // Input bar (bottom layer - LSGlassPanel)
        LSGlassPanel(
            variant = GlassVariant.Chrome,
            modifier = Modifier
                .fillMaxWidth()
                .height(inputHeight)
                .testTag(CHAT_INPUT_BAR_TAG),
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
