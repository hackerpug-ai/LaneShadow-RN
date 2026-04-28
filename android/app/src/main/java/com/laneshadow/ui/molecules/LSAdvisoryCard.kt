package com.laneshadow.ui.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * LSAdvisoryCard molecule component
 *
 * Weather advisory card with colored left stripe and italic body text.
 * Used in Idle V03 weather-advisory variant.
 *
 * @param message Advisory message text
 * @param modifier Modifier for the root composable
 */
@Composable
fun LSAdvisoryCard(
    message: String,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(
                color = theme.colors.warningContainer.default,
            )
    ) {
        // Left stripe (using 4.dp as approximate strokeWidth.lg)
        Box(
            modifier = Modifier
                .background(
                    color = theme.colors.warning.default,
                )
                .padding(horizontal = 4.dp)
        )

        Column(
            modifier = Modifier
                .padding(theme.space.md)
        ) {
            Text(
                text = message,
                style = theme.typography.opinion.md,
                fontStyle = FontStyle.Italic,
                color = theme.colors.onWarningContainer.default,
            )
        }
    }
}
