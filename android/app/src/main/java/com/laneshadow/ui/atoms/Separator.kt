package com.laneshadow.ui.atoms

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun Separator(
    modifier: Modifier = Modifier,
    orientation: SeparatorOrientation = SeparatorOrientation.Horizontal,
) {
    val theme = LocalLaneShadowTheme.current

    Box(
        modifier =
            when (orientation) {
                SeparatorOrientation.Horizontal ->
                    modifier
                        .fillMaxWidth()
                        .height(theme.space.xs / 4)
                        .background(theme.colors.divider.default)
                SeparatorOrientation.Vertical ->
                    modifier
                        .width(theme.space.xs / 4)
                        .background(theme.colors.divider.default)
            },
    )
}

enum class SeparatorOrientation {
    Horizontal,
    Vertical,
}
