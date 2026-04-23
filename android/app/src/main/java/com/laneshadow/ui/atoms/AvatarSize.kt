package com.laneshadow.ui.atoms

import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LaneShadowThemeValues

enum class AvatarSize {
    Xs,
    Sm,
    Md,
    Lg,
    Xl;

    fun resolve(theme: LaneShadowThemeValues): Dp =
        when (this) {
            AvatarSize.Xs -> theme.avatarSizing().xs
            AvatarSize.Sm -> theme.avatarSizing().sm
            AvatarSize.Md -> theme.avatarSizing().md
            AvatarSize.Lg -> theme.avatarSizing().lg
            AvatarSize.Xl -> theme.avatarSizing().xl
        }

    fun initialsVariant(): TypographyVariant =
        when (this) {
            AvatarSize.Xs, AvatarSize.Sm -> TypographyVariant.Ui.Label.Sm
            AvatarSize.Md -> TypographyVariant.Ui.Label.Md
            AvatarSize.Lg, AvatarSize.Xl -> TypographyVariant.Ui.Label.Lg
        }
}

internal data class LaneShadowAvatarSizing(
    val xs: Dp = 24.dp,
    val sm: Dp = 32.dp,
    val md: Dp = 40.dp,
    val lg: Dp = 48.dp,
    val xl: Dp = 56.dp,
)

// Task-local ladder mirroring sizing.avatar.* until the generated Kotlin
// theme exposes avatar sizing through its public API.
internal fun LaneShadowThemeValues.avatarSizing(): LaneShadowAvatarSizing = LaneShadowAvatarSizing()
