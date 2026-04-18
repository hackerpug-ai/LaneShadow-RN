package com.laneshadow.ui.atoms

import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun ThemeSwitch(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val theme = LocalLaneShadowTheme.current

    Switch(
        checked = checked,
        onCheckedChange = onCheckedChange,
        modifier = modifier,
        enabled = enabled,
        colors =
            SwitchDefaults.colors(
                checkedThumbColor = theme.colors.surface.default,
                checkedTrackColor = theme.colors.primary.default,
                uncheckedThumbColor = theme.colors.surface.default,
                uncheckedTrackColor = theme.colors.input.default,
                checkedBorderColor = theme.colors.primary.default,
                uncheckedBorderColor = theme.colors.input.default,
                disabledCheckedThumbColor = theme.colors.surface.default,
                disabledCheckedTrackColor = theme.colors.primary.disabled ?: theme.colors.primary.default,
                disabledUncheckedThumbColor = theme.colors.surface.default,
                disabledUncheckedTrackColor = theme.colors.input.disabled ?: theme.colors.input.default,
            ),
    )
}
