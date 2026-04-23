package com.laneshadow.ui.atoms

import androidx.compose.ui.graphics.Color
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens

enum class AccentColor {
    Signal,
    Warning,
}

fun resolveAccentColor(
    @Suppress("UNUSED_PARAMETER") theme: LaneShadowThemeValues,
    accent: AccentColor,
): Color =
    when (accent) {
        AccentColor.Signal -> GeneratedTokens.color.Signal.default
        AccentColor.Warning -> GeneratedTokens.color.Status.Warning.default
    }
