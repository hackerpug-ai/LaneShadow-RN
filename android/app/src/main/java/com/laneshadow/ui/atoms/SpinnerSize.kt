package com.laneshadow.ui.atoms

import androidx.compose.ui.unit.Dp
import com.laneshadow.theme.LaneShadowThemeValues

enum class SpinnerSize {
    Md,
}

fun SpinnerSize.resolve(theme: LaneShadowThemeValues): Dp =
    when (this) {
        SpinnerSize.Md -> theme.sizing.icon.md
    }
