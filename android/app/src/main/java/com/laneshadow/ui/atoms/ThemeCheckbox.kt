package com.laneshadow.ui.atoms

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun ThemeCheckbox(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    indeterminate: Boolean = false,
) {
    val theme = LocalLaneShadowTheme.current
    val active = checked || indeterminate

    Box(
        modifier =
            modifier
                .size(16.dp)
                .clip(RoundedCornerShape(theme.radius.sm))
                .background(if (active) theme.colors.primary.default else theme.colors.background.default)
                .clickable(enabled = enabled) { onCheckedChange(!checked) },
        contentAlignment = Alignment.Center,
    ) {
        if (indeterminate) {
            Box(
                modifier =
                    Modifier
                        .size(width = 8.dp, height = 2.dp)
                        .background(theme.colors.onPrimary.default),
            )
        } else if (checked) {
            IconSymbol(name = "check", size = 12.dp, color = theme.colors.onPrimary.default)
        }
    }
}
