package com.laneshadow.ui.organisms

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.GlassCornerRadius
import com.laneshadow.ui.atoms.GlassVariant
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSGlassPanel
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.StatusColor
import com.laneshadow.ui.atoms.TextColor
import com.laneshadow.ui.atoms.TypographyVariant

// Test tags
const val LSTOPBAR_TAG = "ls-topbar"
const val LSTOPBAR_HAMBURGER_CHIP_TAG = "ls-topbar-hamburger-chip"
const val LSTOPBAR_TRAILING_CHIP_TAG = "ls-topbar-trailing-chip"
const val LSTOPBAR_TITLE_TAG = "ls-topbar-title"
const val LSTOPBAR_RECORDING_INDICATOR_TAG = "TopBarRecordingIndicatorTag"

// Semantics keys
val LSTopBarGlassVariantKey = SemanticsPropertyKey<GlassVariant>("LSTopBarGlassVariant")

private var SemanticsPropertyReceiver.lsTopBarGlassVariant by LSTopBarGlassVariantKey

// Private constants for hardcoded values
private val chipHeight = 40.dp
private val recordingDotSize = 6.dp

/**
 * Sealed interface for LSTopBar trailing slot variants.
 */
@Stable
sealed interface TopBarTrailing {
    @Stable
    data object None : TopBarTrailing

    @Stable
    data class New(val onTap: () -> Unit) : TopBarTrailing

    @Stable
    data object RecordHighlight : TopBarTrailing
}

/**
 * LSTopBar organism - glass chrome top bar for Navigator screens.
 *
 * @param title Optional centered title text
 * @param trailing Trailing slot variant (None, New chip, or RecordHighlight)
 * @param onMenuTap Callback when hamburger chip is tapped
 * @param modifier Modifier for the root composable
 */
@Composable
fun LSTopBar(
    title: String? = null,
    trailing: TopBarTrailing = TopBarTrailing.None,
    onMenuTap: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = modifier
            .fillMaxWidth()
            .statusBarsPadding(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Leading hamburger chip
        HamburgerChip(
            onTap = onMenuTap,
            modifier = Modifier.testTag(LSTOPBAR_HAMBURGER_CHIP_TAG),
        )

        // Optional centered title
        if (title != null) {
            Spacer(modifier = Modifier.weight(1f))

            LSText(
                text = title,
                variant = TypographyVariant.Ui.Title.Md,
                color = ContentColor.Primary,
                modifier = Modifier
                    .testTag(LSTOPBAR_TITLE_TAG)
                    .semantics { contentDescription = "Top bar title: $title" },
            )

            Spacer(modifier = Modifier.weight(1f))
        } else {
            Spacer(modifier = Modifier.weight(1f))
        }

        // Trailing slot — pinned to opposite edge by Spacer(weight)
        when (trailing) {
            TopBarTrailing.None -> {
                // No trailing chip
            }
            is TopBarTrailing.New -> {
                NewChip(
                    onTap = trailing.onTap,
                    modifier = Modifier.testTag(LSTOPBAR_TRAILING_CHIP_TAG),
                )
            }
            TopBarTrailing.RecordHighlight -> {
                RecordHighlightChip(
                    modifier = Modifier.testTag(LSTOPBAR_RECORDING_INDICATOR_TAG),
                )
            }
        }
    }
}

/**
 * Convenience overload for default LSTopBar with both hamburger and NEW chips.
 */
@Composable
fun LSTopBar(
    onMenuTap: () -> Unit,
    onNewTap: () -> Unit,
    modifier: Modifier = Modifier,
) {
    LSTopBar(
        title = null,
        trailing = TopBarTrailing.New(onTap = onNewTap),
        onMenuTap = onMenuTap,
        modifier = modifier,
    )
}

/**
 * Hamburger menu chip - 40x40 circular glass chrome chip.
 * AC-4: Tap target ≥48dp via padding while keeping visual at 40dp
 */
@Composable
private fun HamburgerChip(
    onTap: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // AC-4: Ensure tap target is ≥48dp by adding padding to the 40dp visual
    // 48dp - 40dp = 8dp, so 4dp padding on each side
    Box(
        modifier = modifier
            .padding(4.dp) // Increase tap target to 48dp (40 + 4 + 4)
            .size(chipHeight)
            .clickable(onClick = onTap)
            .semantics {
                lsTopBarGlassVariant = GlassVariant.Chrome
                contentDescription = "Open menu"
            },
        contentAlignment = Alignment.Center,
    ) {
        LSGlassPanel(
            variant = GlassVariant.Chrome,
            cornerRadius = GlassCornerRadius.Md,
            modifier = Modifier.size(chipHeight),
        ) {
            LSIcon(
                name = IconName.Menu,
                size = IconSize.Sm,
                color = IconColor.Content(ContentColor.Primary),
            )
        }
    }
}

/**
 * NEW action chip - rounded glass chrome chip with plus icon and "NEW" label.
 */
@Composable
private fun NewChip(
    onTap: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    LSGlassPanel(
        variant = GlassVariant.Chrome,
        cornerRadius = GlassCornerRadius.Md,
        modifier = modifier
            .height(chipHeight)
            .semantics {
                lsTopBarGlassVariant = GlassVariant.Chrome
            }
            .clickable(onClick = onTap),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
        ) {
            LSIcon(
                name = IconName.Plus,
                size = IconSize.Sm,
                color = IconColor.Content(ContentColor.Primary),
            )

            LSText(
                text = "NEW",
                variant = TypographyVariant.Ui.Label.Md,
                color = ContentColor.Primary,
            )
        }
    }
}

/**
 * Record highlight chip - recording indicator with red dot and "REC" label.
 */
@Composable
private fun RecordHighlightChip(
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = modifier
            .height(chipHeight),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
    ) {
        // Recording indicator dot (pulsing red dot)
        RecordingDot(
            color = GeneratedTokens.color.Status.recording,
            modifier = Modifier.size(recordingDotSize),
        )

        LSText(
            text = "REC",
            variant = TypographyVariant.Ui.Label.Md,
            color = TextColor.Status(StatusColor.Error),
        )
    }
}

/**
 * Pulsing recording indicator dot.
 */
@Composable
private fun RecordingDot(
    color: Color,
    modifier: Modifier = Modifier,
) {
    // Simple implementation - pulsing animation would be added in production
    Box(
        modifier = modifier
            .background(
                color = color,
                shape = CircleShape,
            ),
    )
}
