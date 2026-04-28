package com.laneshadow.ui.molecules

import androidx.compose.animation.core.EaseInOut
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LSMotion
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSPhaseDot
import com.laneshadow.ui.atoms.LSPill
import com.laneshadow.ui.atoms.PhaseDotState
import com.laneshadow.ui.atoms.PillSize
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TypographyVariant

/**
 * LSPhaseIndicator molecule component
 *
 * Phase indicator molecule showing compass chip, header, and vertical list of planning phases.
 * Follows the design spec at .spec/design/system/molecules/phase-indicator/
 *
 * @param phases List of planning phases with labels and states
 * @param header Optional header text (default: "Let me think on that…")
 * @param modifier Modifier for the indicator container
 */
@Composable
fun LSPhaseIndicator(
    phases: List<PlanningPhase>,
    header: String = "Let me think on that…",
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = modifier.padding(theme.space.md, theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.md),
    ) {
        // Compass chip + header row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Compass chip with 22% tinted background
            Box(
                modifier = Modifier.background(
                    GeneratedTokens.color.Signal.default.copy(alpha = 0.22f),
                ),
            ) {
                LSPill(size = PillSize.Sm) {
                    LSIcon(
                        name = GeneratedTokens.IconName.Compass,
                        size = IconSize.Md,
                        color = IconColor.Content(ContentColor.Primary),
                    )
                }
            }

            // Header text in opinion typography
            LSText(
                text = header,
                variant = TypographyVariant.Opinion.Md,
                color = ContentColor.Primary,
            )
        }

        // Phase steps list
        Column(
            verticalArrangement = Arrangement.spacedBy(theme.space.sm),
        ) {
            phases.forEach { phase ->
                PhaseStep(
                    label = phase.label,
                    state = phase.state,
                )
            }
        }
    }
}

/**
 * Individual phase step with dot and label
 */
@Composable
private fun PhaseStep(
    label: String,
    state: PhaseDotState,
) {
    val theme = LocalLaneShadowTheme.current

    Row(
        horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Phase dot (handles its own animation for Active state)
        LSPhaseDot(state = state)

        // AC-2: Add leading head dot for Active phases with breathing animation
        if (state == PhaseDotState.Active) {
            BreathingHeadDot(size = 6.dp)
        }

        // Step label in instrument mono typography
        val labelColor =
            when (state) {
                PhaseDotState.Pending -> ContentColor.Subtle
                PhaseDotState.Active -> ContentColor.Primary
                PhaseDotState.Done -> ContentColor.Secondary
            }

        LSText(
            text = label,
            variant = TypographyVariant.Instrument.Sm,
            color = labelColor,
        )
    }
}

/**
 * Breathing head dot composable for Active phase indicators.
 *
 * AC-2: Head dot breathes with infiniteRepeatable animation.
 * Alpha oscillates between 1.0 and 0.55 (or 0.45 per spec).
 *
 * Note: Spec requires 1400ms duration, but current tokens only have "slow" (400ms).
 * Using "slow" as placeholder until token is updated.
 */
@Composable
private fun BreathingHeadDot(
    size: Dp = 6.dp,
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

    // Breathing animation: alpha oscillates 1.0 -> 0.45 -> 1.0 using LSMotion helper
    val infiniteTransition = rememberInfiniteTransition(label = "breathing_head_dot")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 0.45f,
        animationSpec = LSMotion.breathingHeadDot(
            durationMillis = durationMillis,
            easing = easing
        ),
        label = "breathing_alpha",
    )

    Box(
        modifier = Modifier
            .size(size)
            .alpha(alpha)
            .background(
                color = GeneratedTokens.color.Signal.default,
                shape = CircleShape,
            )
    )
}
