package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * ThemedView atom component
 *
 * Lightweight themed container wrapper with surface background.
 * Use this component for consistent theming throughout the app.
 *
 * @param modifier Modifier for the container
 * @param content Child content composable
 */
@Composable
fun ThemedView(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(theme.colors.surface.default),
        content = content,
    )
}
