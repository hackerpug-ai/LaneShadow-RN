package com.laneshadow.ui.atoms

import androidx.compose.ui.graphics.Color
import com.laneshadow.theme.LaneShadowThemeValues

enum class ContentColor {
    Primary,
    Secondary,
    Tertiary,
    Subtle,
    OnSignal,
    Signal,
    Error,
}

fun ContentColor.resolve(theme: LaneShadowThemeValues): Color =
    when (this) {
        ContentColor.Primary -> theme.content.primary
        ContentColor.Secondary -> theme.content.secondary
        ContentColor.Tertiary -> theme.content.tertiary
        ContentColor.Subtle -> theme.content.subtle
        ContentColor.OnSignal -> theme.content.onSignal
        ContentColor.Signal -> theme.colors.primary.default
        ContentColor.Error -> theme.colors.danger.default
    }
