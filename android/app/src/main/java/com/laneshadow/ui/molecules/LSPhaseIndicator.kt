package com.laneshadow.ui.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
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
