package com.laneshadow.ui.atoms

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LaneShadowThemeValues

enum class PillSize {
    Sm,
    Md,
    Lg;

    fun resolveHeight(theme: LaneShadowThemeValues): Dp =
        when (this) {
            Sm -> theme.space.xl
            Md -> theme.space.xxl
            Lg -> theme.space.xxl + theme.space.sm
        }

    fun resolveDefaultPadding(theme: LaneShadowThemeValues): PaddingValues =
        PaddingValues(horizontal = resolveHorizontalPadding(theme), vertical = 0.dp)

    private fun resolveHorizontalPadding(theme: LaneShadowThemeValues): Dp =
        when (this) {
            Sm -> theme.space.sm
            Md -> theme.space.md
            Lg -> theme.space.lg
        }
}
