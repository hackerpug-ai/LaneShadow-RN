package com.laneshadow.ui.atoms

import androidx.compose.ui.unit.Dp
import com.laneshadow.theme.LaneShadowThemeValues

enum class IconSize {
    Xs,
    Sm,
    Md,
    Lg,
    Xl;

    fun resolve(theme: LaneShadowThemeValues): Dp =
        when (this) {
            Xs -> theme.sizing.icon.xs
            Sm -> theme.sizing.icon.sm
            Md -> theme.sizing.icon.md
            Lg -> theme.sizing.icon.lg
            Xl -> theme.sizing.icon.xl
        }
}
