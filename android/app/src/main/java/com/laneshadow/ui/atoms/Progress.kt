package com.laneshadow.ui.atoms

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun ThemeProgress(
    value: Float,
    modifier: Modifier = Modifier,
    max: Float = 100f,
    indeterminate: Boolean = false,
    accessibilityLabel: String? = null,
) {
    val theme = LocalLaneShadowTheme.current
    val boundedMax = max.coerceAtLeast(1f)
    val progress = (value / boundedMax).coerceIn(0f, 1f)
    val semanticsModifier =
        Modifier.semantics {
            if (accessibilityLabel != null) {
                contentDescription = accessibilityLabel
            }
            if (!indeterminate) {
                progressBarRangeInfo = ProgressBarRangeInfo(progress, 0f..1f)
                stateDescription = "${(progress * 100).toInt()}%"
            }
        }

    if (indeterminate) {
        LinearProgressIndicator(
            modifier =
                modifier
                    .fillMaxWidth()
                    .height(16.dp)
                    .then(semanticsModifier),
            color = theme.colors.primary.default,
            trackColor = theme.colors.secondary.default,
        )
    } else {
        LinearProgressIndicator(
            progress = { progress },
            modifier =
                modifier
                    .fillMaxWidth()
                    .height(16.dp)
                    .then(semanticsModifier),
            color = theme.colors.primary.default,
            trackColor = theme.colors.secondary.default,
        )
    }
}

@Composable
fun Progress(
    value: Float,
    modifier: Modifier = Modifier,
    max: Float = 100f,
    indeterminate: Boolean = false,
    accessibilityLabel: String? = null,
) = ThemeProgress(
    value = value,
    modifier = modifier,
    max = max,
    indeterminate = indeterminate,
    accessibilityLabel = accessibilityLabel,
)
