package com.laneshadow.ui.components.atoms

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.LinearOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Progress atom component
 *
 * Displays determinate (0-100) or indeterminate progress with smooth animations.
 *
 * @param value Progress value (0-100 for determinate, ignored for indeterminate)
 * @param max Max value (default: 100)
 * @param indeterminate Whether to show indeterminate progress (default: false)
 * @param modifier Modifier for the component
 * @param testID Test ID for UI testing
 */
@Composable
fun Progress(
    value: Float = 0f,
    max: Float = 100f,
    indeterminate: Boolean = false,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    val containerColor = theme.colors.secondary.default
    val indicatorColor = theme.colors.primary.default

    val appliedModifier = modifier
        .testTag(testID ?: "progress")
        .semantics {
            progressBarRangeInfo = if (indeterminate) {
                ProgressBarRangeInfo.Indeterminate
            } else {
                val fraction = (value / max).coerceIn(0f, 1f)
                ProgressBarRangeInfo(fraction, 0f..1f)
            }
        }

    Box(
        modifier = appliedModifier
            .fillMaxWidth()
            .height(16.dp)
            .clip(CircleShape)
            .background(containerColor),
    ) {
        if (indeterminate) {
            LinearProgressIndicator(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(16.dp),
                color = indicatorColor,
                trackColor = Color.Transparent,
            )
        } else {
            val fraction = (value / max).coerceIn(0f, 1f)
            LinearProgressIndicator(
                progress = { fraction },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(16.dp),
                color = indicatorColor,
                trackColor = Color.Transparent,
            )
        }
    }
}
