package com.laneshadow.ui.organisms

import androidx.compose.animation.core.EaseInOut
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
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
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LSMotion
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
import com.laneshadow.ui.molecules.CapsuleAppearance
import com.laneshadow.ui.molecules.CapsuleState
import com.laneshadow.ui.molecules.LSContextCapsule

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
 * @param title Optional centered title text (ignored when [capsule] is provided)
 * @param capsule Optional CapsuleState — when non-null, renders [LSContextCapsule] with
 *   `CapsuleAppearance.Chip` in the center slot, matching iOS + the design HTML header
 *   pattern: `[ hamburger ] [ status-card ] [ plus ]`.
 * @param trailing Trailing slot variant (None, New chip, or RecordHighlight)
 * @param onMenuTap Callback when hamburger chip is tapped
 * @param modifier Modifier for the root composable
 */
@Composable
fun LSTopBar(
    title: String? = null,
    capsule: CapsuleState? = null,
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
        horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
    ) {
        // Leading hamburger chip
        HamburgerChip(
            onTap = onMenuTap,
            modifier = Modifier.testTag(LSTOPBAR_HAMBURGER_CHIP_TAG),
        )

        // Center slot — capsule takes priority, falls back to title, falls back to spacer
        when {
            capsule != null -> {
                LSContextCapsule(
                    state = capsule,
                    appearance = CapsuleAppearance.Chip,
                    modifier = Modifier
                        .weight(1f)
                        .testTag(LSTOPBAR_TITLE_TAG),
                )
            }
            title != null -> {
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
            }
            else -> {
                Spacer(modifier = Modifier.weight(1f))
            }
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
 * AC-4: Tap target ≥48dp via minimumInteractiveComponentSize while keeping visual at 40dp
 */
@Composable
private fun HamburgerChip(
    onTap: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Box(
        modifier = modifier
            .minimumInteractiveComponentSize()
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
 * NEW action chip - 40x40 square glass chrome chip with plus icon only.
 *
 * Matches the hamburger chip footprint so the header reads as one chip family:
 * [ menu ] [ status-card ] [ plus ]. The "New ride" label is exposed only via
 * `contentDescription` for screen readers.
 */
@Composable
private fun NewChip(
    onTap: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .minimumInteractiveComponentSize()
            .size(chipHeight)
            .clickable(onClick = onTap)
            .semantics {
                lsTopBarGlassVariant = GlassVariant.Chrome
                contentDescription = "New ride"
            },
        contentAlignment = Alignment.Center,
    ) {
        LSGlassPanel(
            variant = GlassVariant.Chrome,
            cornerRadius = GlassCornerRadius.Md,
            modifier = Modifier.size(chipHeight),
        ) {
            LSIcon(
                name = IconName.Plus,
                size = IconSize.Sm,
                color = IconColor.Content(ContentColor.Primary),
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
 *
 * AC-5: Record dot pulses with infiniteRepeatable animation.
 * Alpha oscillates between 1.0 and 0.45 per spec.
 *
 * Note: Spec requires 1400ms duration, but current tokens only have "slow" (400ms).
 * Using "slow" as placeholder until token is updated.
 */
@Composable
private fun RecordingDot(
    color: Color,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Use "verySlow" duration (1400ms) as specified in design
    val durationMillis = theme.motion.duration["verySlow"] ?: 1400
    val easingPoints = theme.motion.easing["standard"] ?: listOf(0.4, 0.0, 0.2, 1.0)

    // Create easing from token points
    val easing = androidx.compose.animation.core.CubicBezierEasing(
        easingPoints[0].toFloat(),
        easingPoints[1].toFloat(),
        easingPoints[2].toFloat(),
        easingPoints[3].toFloat(),
    )

    // AC-5: Pulse animation: alpha oscillates 1.0 -> 0.45 -> 1.0 using LSMotion helper
    val infiniteTransition = rememberInfiniteTransition(label = "record_dot_pulse")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 0.45f,
        animationSpec = LSMotion.recordDotPulse(
            durationMillis = durationMillis,
            easing = easing
        ),
        label = "record_dot_alpha",
    )

    Box(
        modifier = modifier
            .alpha(alpha)
            .background(
                color = color,
                shape = CircleShape,
            ),
    )
}
