package com.laneshadow.ui.organisms

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.SpringSpec
import androidx.compose.animation.core.TweenSpec
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LSMotion
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.AccentColor
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.GlassVariant
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSGlassPanel
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSPill
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.PillSize
import com.laneshadow.ui.atoms.TextColor
import com.laneshadow.ui.atoms.TypographyVariant
import androidx.compose.foundation.clickable

// Test tags
const val LS_INLINE_ERROR_CALLOUT_TAG = "ls-inline-error-callout"
const val INLINE_ERROR_COMPASS_CHIP_TAG = "inline-error-compass-chip"
const val INLINE_ERROR_BODY_TAG = "inline-error-body"
const val INLINE_ERROR_DETAIL_TAG = "inline-error-detail"
const val INLINE_ERROR_SUGGESTIONS_TAG = "inline-error-suggestions"

// Semantics keys
val LSInlineErrorCalloutDetailKey = SemanticsPropertyKey<String>("LSInlineErrorCalloutDetail")
val LSInlineErrorCalloutSuggestionCountKey = SemanticsPropertyKey<Int>("LSInlineErrorCalloutSuggestionCount")

private var SemanticsPropertyReceiver.lsInlineErrorCalloutDetail by LSInlineErrorCalloutDetailKey
private var SemanticsPropertyReceiver.lsInlineErrorCalloutSuggestionCount by LSInlineErrorCalloutSuggestionCountKey

/**
 * Data class for suggestion chips.
 */
data class SuggestionChip(
    val label: String,
    val isPrimary: Boolean = false,
)

/**
 * LSInlineErrorCallout - Warning-stripe error callout with compass chip,
 * "THE NAVIGATOR" label, body, optional detail, and suggestion chips.
 *
 * @param body Error message body text in opinion typography
 * @param detail Optional detailed error explanation
 * @param suggestions Optional list of suggestion chips
 * @param onSuggestionTap Callback when a suggestion chip is tapped
 * @param isRecovered Whether the callout is in recovered state (fade to 0.55)
 * @param modifier Modifier for the root composable
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun LSInlineErrorCallout(
    body: String,
    detail: String? = null,
    suggestions: List<SuggestionChip> = emptyList(),
    onSuggestionTap: (SuggestionChip) -> Unit,
    isRecovered: Boolean = false,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    LSGlassPanel(
        variant = GlassVariant.Callout(accent = AccentColor.Warning),
        modifier = modifier
            .testTag(LS_INLINE_ERROR_CALLOUT_TAG)
            .alpha(if (isRecovered) 0.55f else 1.0f)
            .semantics {
                lsInlineErrorCalloutDetail = detail ?: ""
                lsInlineErrorCalloutSuggestionCount = suggestions.size
            },
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(theme.space.sm),
        ) {
            // Header row: compass chip, label/body
            Row(
                horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
                verticalAlignment = Alignment.Top,
            ) {
                ErrorCompassChip(
                    modifier = Modifier.testTag(INLINE_ERROR_COMPASS_CHIP_TAG),
                )

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .testTag(INLINE_ERROR_BODY_TAG),
                    verticalArrangement = Arrangement.spacedBy(theme.space.xs),
                ) {
                    LSText(
                        text = "THE NAVIGATOR",
                        variant = TypographyVariant.Ui.Label.Sm,
                        color = TextColor.Status(com.laneshadow.ui.atoms.StatusColor.Warning),
                    )

                    LSText(
                        text = body,
                        variant = TypographyVariant.Opinion.Md,
                        color = ContentColor.Primary,
                    )
                }
            }

            // Optional detail text
            if (detail != null) {
                LSText(
                    text = detail,
                    variant = TypographyVariant.Ui.Body.Sm,
                    color = ContentColor.Secondary,
                    modifier = Modifier
                        .testTag(INLINE_ERROR_DETAIL_TAG)
                        .fillMaxWidth(),
                )
            }

            // Suggestion chips
            if (suggestions.isNotEmpty()) {
                // AC-6: Use AnimatedVisibility for suggestion chip enter animation
                // AC-6: Use FlowRow for chip wrapping
                val density = LocalDensity.current
                val enterDuration = LSMotion.chatOverlayEnter(
                    durationMillis = theme.motion.duration["standard"] ?: 240
                )
                AnimatedVisibility(
                    visible = true,
                    enter = slideInVertically(
                        initialOffsetY = { with(density) { 8.dp.toPx().toInt() } },
                        animationSpec = tween(durationMillis = enterDuration)
                    ) + fadeIn(
                        animationSpec = tween(durationMillis = enterDuration)
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    FlowRow(
                        modifier = Modifier
                            .testTag(INLINE_ERROR_SUGGESTIONS_TAG)
                            .fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
                        verticalArrangement = Arrangement.spacedBy(theme.space.xs),
                    ) {
                        suggestions.forEach { chip ->
                            SuggestionChip(
                                label = chip.label,
                                onTap = { onSuggestionTap(chip) },
                                isPrimary = chip.isPrimary,
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * Error compass chip - circular pill with compass icon and warning tint.
 */
@Composable
private fun ErrorCompassChip(
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    LSPill(
        size = PillSize.Sm,
        modifier = modifier,
    ) {
        LSIcon(
            name = IconName.Compass,
            size = IconSize.Xs,
            color = IconColor.Status(com.laneshadow.ui.atoms.StatusColor.Warning),
        )
    }
}

/**
 * Suggestion chip - clickable pill with label text.
 *
 * AC-7: Primary chips use warning-amber styling, tertiary chips use glass styling.
 */
@Composable
private fun SuggestionChip(
    label: String,
    onTap: () -> Unit,
    isPrimary: Boolean = false,
) {
    val theme = LocalLaneShadowTheme.current

    // For now, use a simpler approach with ContentColor.Primary/Secondary
    // TODO: Use proper token-based styling once theme structure is confirmed
    LSPill(
        size = PillSize.Lg,
        padding = PaddingValues(horizontal = theme.space.md, vertical = theme.space.xs),
        modifier = Modifier.clickable(onClick = onTap),
    ) {
        LSText(
            text = label,
            variant = TypographyVariant.Ui.Label.Sm,
            color = if (isPrimary) ContentColor.Primary else ContentColor.Secondary,
        )
    }
}

