package com.laneshadow.ui.atoms

import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun ThemeSlider(
    value: Float,
    onValueChange: (Float) -> Unit,
    modifier: Modifier = Modifier,
    valueRange: ClosedFloatingPointRange<Float> = 0f..1f,
    steps: Int = 0,
    enabled: Boolean = true,
) {
    val theme = LocalLaneShadowTheme.current

    Slider(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier,
        valueRange = valueRange,
        steps = steps,
        enabled = enabled,
        colors =
            SliderDefaults.colors(
                thumbColor = theme.colors.primary.default,
                activeTrackColor = theme.colors.primary.default,
                inactiveTrackColor = theme.colors.secondary.default,
                disabledThumbColor = theme.colors.primary.disabled ?: theme.colors.primary.default,
                disabledActiveTrackColor = theme.colors.primary.disabled ?: theme.colors.primary.default,
                disabledInactiveTrackColor = theme.colors.secondary.disabled ?: theme.colors.secondary.default,
            ),
    )
}
