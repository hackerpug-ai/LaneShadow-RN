package com.laneshadow.ui.atoms

import androidx.compose.ui.graphics.Color
import com.laneshadow.theme.LaneShadowThemeValues

enum class AccentColor {
    Signal,
    Warning,
}

fun resolveAccentColor(
    theme: LaneShadowThemeValues,
    accent: AccentColor,
): Color =
    when (accent) {
        AccentColor.Signal -> theme.colors.accent.default
        AccentColor.Warning -> theme.colors.warning.default
    }
