package com.laneshadow.ui.atoms

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun ThemedView(
    modifier: Modifier = Modifier,
    variant: ThemedViewVariant = ThemedViewVariant.Surface,
    padding: PaddingValues? = null,
    content: @Composable () -> Unit,
) {
    val theme = LocalLaneShadowTheme.current
    val contentPadding = padding ?: PaddingValues(theme.space.md)

    Box(
        modifier =
            modifier
                .background(
                    color = variant.color(theme),
                    shape = RoundedCornerShape(theme.radius.md),
                )
                .padding(contentPadding),
    ) {
        content()
    }
}

enum class ThemedViewVariant {
    Surface,
    SurfaceVariant,
    Background,
    Card,
    Muted,
}

internal fun ThemedViewVariant.color(theme: com.laneshadow.theme.LaneShadowThemeValues): Color =
    when (this) {
        ThemedViewVariant.Surface -> theme.colors.surface.default
        ThemedViewVariant.SurfaceVariant -> theme.colors.surfaceVariant.default
        ThemedViewVariant.Background -> theme.colors.background.default
        ThemedViewVariant.Card -> theme.colors.card.default
        ThemedViewVariant.Muted -> theme.colors.muted.default
    }
