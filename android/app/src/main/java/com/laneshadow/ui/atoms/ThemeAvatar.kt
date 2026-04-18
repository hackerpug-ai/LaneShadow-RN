package com.laneshadow.ui.atoms

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun ThemeAvatar(
    modifier: Modifier = Modifier,
    size: AvatarSize = AvatarSize.Md,
    imageUrl: String? = null,
    initials: String? = null,
    showBorder: Boolean = false,
    showRing: Boolean = false,
    accessibilityLabel: String? = null,
    badge: (@Composable BoxScope.() -> Unit)? = null,
) {
    val theme = LocalLaneShadowTheme.current
    val dimension = avatarDimension(size)
    val baseModifier =
        modifier
            .size(dimension)
            .clip(CircleShape)
            .background(theme.colors.muted.default, CircleShape)
            .then(
                if (showBorder) {
                    Modifier.border(width = 2.dp, color = theme.colors.border.default, shape = CircleShape)
                } else {
                    Modifier
                },
            )
            .then(
                if (showRing) {
                    Modifier.border(width = 2.dp, color = theme.colors.primary.default, shape = CircleShape)
                } else {
                    Modifier
                },
            )
            .then(
                if (accessibilityLabel != null) {
                    Modifier.semantics { contentDescription = accessibilityLabel }
                } else {
                    Modifier
                },
            )

    Box(contentAlignment = Alignment.Center) {
        Box(
            modifier = baseModifier,
            contentAlignment = Alignment.Center,
        ) {
            when {
                !initials.isNullOrBlank() ->
                    ThemedText(
                        text = initials.take(2).uppercase(),
                        variant = avatarTextVariant(size),
                        color = theme.colors.onSurface.default,
                        modifier = Modifier,
                    )
                !imageUrl.isNullOrBlank() ->
                    IconSymbol(
                        name = "favorite",
                        size = avatarIconSize(size),
                        color = theme.colors.onSurface.default,
                    )
                else ->
                    IconSymbol(
                        name = "user",
                        size = avatarIconSize(size),
                        color = theme.colors.onSurface.default,
                    )
            }
        }

        if (badge != null) {
            Box(
                modifier = Modifier.align(Alignment.TopEnd).offset(x = 4.dp, y = (-4).dp),
                content = badge,
            )
        }
    }
}

@Composable
fun Avatar(
    modifier: Modifier = Modifier,
    size: AvatarSize = AvatarSize.Md,
    imageUrl: String? = null,
    initials: String? = null,
    showBorder: Boolean = false,
    showRing: Boolean = false,
    accessibilityLabel: String? = null,
    badge: (@Composable BoxScope.() -> Unit)? = null,
) = ThemeAvatar(
    modifier = modifier,
    size = size,
    imageUrl = imageUrl,
    initials = initials,
    showBorder = showBorder,
    showRing = showRing,
    accessibilityLabel = accessibilityLabel,
    badge = badge,
)

@Composable
fun AvatarBadge(
    modifier: Modifier = Modifier,
    variant: AvatarBadgeVariant = AvatarBadgeVariant.Default,
    content: @Composable BoxScope.() -> Unit = {},
) {
    val theme = LocalLaneShadowTheme.current
    val containerColor =
        when (variant) {
            AvatarBadgeVariant.Default -> theme.colors.primary.default
            AvatarBadgeVariant.Success -> theme.colors.success.default
            AvatarBadgeVariant.Warning -> theme.colors.warning.default
            AvatarBadgeVariant.Danger -> theme.colors.danger.default
        }

    Surface(
        modifier = modifier.size(20.dp),
        shape = CircleShape,
        color = containerColor,
        contentColor = theme.colors.onPrimary.default,
    ) {
        Box(contentAlignment = Alignment.Center, content = content)
    }
}

enum class AvatarSize {
    Sm,
    Md,
    Lg,
}

enum class AvatarBadgeVariant {
    Default,
    Success,
    Warning,
    Danger,
}

internal fun avatarDimension(size: AvatarSize): Dp =
    when (size) {
        AvatarSize.Sm -> 40.dp
        AvatarSize.Md -> 64.dp
        AvatarSize.Lg -> 96.dp
    }

@Composable
internal fun avatarTextVariant(size: AvatarSize): ThemedTextVariant =
    when (size) {
        AvatarSize.Sm -> ThemedTextVariant.BodyMd
        AvatarSize.Md -> ThemedTextVariant.TitleMd
        AvatarSize.Lg -> ThemedTextVariant.HeadingMd
    }

internal fun avatarIconSize(size: AvatarSize): Dp =
    when (size) {
        AvatarSize.Sm -> 18.dp
        AvatarSize.Md -> 28.dp
        AvatarSize.Lg -> 36.dp
    }
