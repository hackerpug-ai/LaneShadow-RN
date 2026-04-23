package com.laneshadow.ui.atoms

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens

sealed interface PhaseDotState {
    data object Pending : PhaseDotState

    data object Active : PhaseDotState

    data object Done : PhaseDotState
}

internal const val PhaseDotPulseRecipePath = "motion.recipe.phaseDotPulse"
internal const val LSPhaseDotPulseTag = "ls-phase-dot-pulse"
private val PhaseDotSize = 10.dp
private val PhaseDotPendingBorderWidth = 1.dp

val LSPhaseDotFillColorKey = SemanticsPropertyKey<Color>("LSPhaseDotFillColor")
val LSPhaseDotStrokeColorKey = SemanticsPropertyKey<Color>("LSPhaseDotStrokeColor")
val LSPhaseDotStrokeWidthKey = SemanticsPropertyKey<Dp>("LSPhaseDotStrokeWidth")
val LSPhaseDotAnimatedKey = SemanticsPropertyKey<Boolean>("LSPhaseDotAnimated")
val LSPhaseDotPulseScaleKey = SemanticsPropertyKey<Float>("LSPhaseDotPulseScale")
val LSPhaseDotPulseAlphaKey = SemanticsPropertyKey<Float>("LSPhaseDotPulseAlpha")
val LSPhaseDotPulseRecipeKey = SemanticsPropertyKey<String>("LSPhaseDotPulseRecipe")

private var SemanticsPropertyReceiver.lsPhaseDotFillColor by LSPhaseDotFillColorKey
private var SemanticsPropertyReceiver.lsPhaseDotStrokeColor by LSPhaseDotStrokeColorKey
private var SemanticsPropertyReceiver.lsPhaseDotStrokeWidth by LSPhaseDotStrokeWidthKey
private var SemanticsPropertyReceiver.lsPhaseDotAnimated by LSPhaseDotAnimatedKey
private var SemanticsPropertyReceiver.lsPhaseDotPulseScale by LSPhaseDotPulseScaleKey
private var SemanticsPropertyReceiver.lsPhaseDotPulseAlpha by LSPhaseDotPulseAlphaKey
private var SemanticsPropertyReceiver.lsPhaseDotPulseRecipe by LSPhaseDotPulseRecipeKey

@Composable
fun LSPhaseDot(
    state: PhaseDotState,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val fillColor = fillColor(state, theme)
    val strokeColor = strokeColor(state, theme)
    val strokeWidth = strokeWidth(state)

    Box(
        modifier = modifier
            .size(PhaseDotSize)
            .semantics {
                lsPhaseDotFillColor = fillColor
                lsPhaseDotStrokeColor = strokeColor
                lsPhaseDotStrokeWidth = strokeWidth
                lsPhaseDotAnimated = state == PhaseDotState.Active
            },
    ) {
        if (state == PhaseDotState.Active) {
            PhaseDotPulseRing(
                color = signalDefaultColor(theme),
                recipe = phaseDotPulseRecipe(theme),
            )
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(fillColor, CircleShape)
                .then(
                    if (strokeWidth > 0.dp) {
                        Modifier.border(strokeWidth, strokeColor, CircleShape)
                    } else {
                        Modifier
                    }
                ),
        )
    }
}

@Composable
private fun PhaseDotPulseRing(
    color: Color,
    recipe: PhaseDotPulseRecipe,
) {
    val infiniteTransition = rememberInfiniteTransition(label = "ls_phase_dot_pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = recipe.startScale,
        targetValue = recipe.endScale,
        animationSpec = infiniteRepeatable(
            animation = tween(recipe.durationMillis, easing = recipe.easing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "ls_phase_dot_pulse_scale",
    )
    val alpha by infiniteTransition.animateFloat(
        initialValue = recipe.startOpacity,
        targetValue = recipe.endOpacity,
        animationSpec = infiniteRepeatable(
            animation = tween(recipe.durationMillis, easing = recipe.easing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "ls_phase_dot_pulse_alpha",
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .scale(scale)
            .alpha(alpha)
            .border(recipe.strokeWidth, color, CircleShape)
            .testTag(LSPhaseDotPulseTag)
            .semantics {
                lsPhaseDotPulseScale = scale
                lsPhaseDotPulseAlpha = alpha
                lsPhaseDotPulseRecipe = recipe.name
            },
    )
}

internal fun fillColor(state: PhaseDotState, theme: LaneShadowThemeValues): Color =
    when (state) {
        PhaseDotState.Pending -> Color.Transparent
        PhaseDotState.Active -> signalDefaultColor(theme)
        PhaseDotState.Done -> statusSuccessColor(theme)
    }

internal fun strokeColor(state: PhaseDotState, theme: LaneShadowThemeValues): Color =
    when (state) {
        PhaseDotState.Pending -> borderStrongColor(theme)
        PhaseDotState.Active, PhaseDotState.Done -> Color.Transparent
    }

internal fun strokeWidth(state: PhaseDotState): Dp =
    when (state) {
        PhaseDotState.Pending -> PhaseDotPendingBorderWidth
        PhaseDotState.Active, PhaseDotState.Done -> 0.dp
    }

internal fun borderStrongColor(theme: LaneShadowThemeValues): Color = theme.colors.border.default

internal fun signalDefaultColor(theme: LaneShadowThemeValues): Color = GeneratedTokens.color.Signal.default

internal fun statusSuccessColor(theme: LaneShadowThemeValues): Color = GeneratedTokens.color.Status.Success.default

internal data class PhaseDotPulseRecipe(
    val name: String,
    val durationMillis: Int,
    val easing: Easing,
    val startScale: Float,
    val endScale: Float,
    val startOpacity: Float,
    val endOpacity: Float,
    val strokeWidth: Dp,
)

internal fun phaseDotPulseRecipe(theme: LaneShadowThemeValues): PhaseDotPulseRecipe {
    val duration = requireNotNull(theme.motion.duration["slow"]) {
        "LaneShadowTheme is missing $PhaseDotPulseRecipePath duration input"
    }
    val easingPoints = requireNotNull(theme.motion.easing["standard"]) {
        "LaneShadowTheme is missing $PhaseDotPulseRecipePath easing input"
    }

    require(easingPoints.size == 4) {
        "LaneShadowTheme easing.standard must expose four cubic bezier points"
    }

    return PhaseDotPulseRecipe(
        name = PhaseDotPulseRecipePath,
        durationMillis = duration,
        easing = CubicBezierEasing(
            easingPoints[0].toFloat(),
            easingPoints[1].toFloat(),
            easingPoints[2].toFloat(),
            easingPoints[3].toFloat(),
        ),
        startScale = 0f,
        endScale = 1.5f,
        startOpacity = 0.4f,
        endOpacity = 0f,
        strokeWidth = 1.dp,
    )
}
