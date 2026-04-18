package com.laneshadow.ui.atoms

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun ThemeBadge(
    modifier: Modifier = Modifier,
    variant: BadgeVariant = BadgeVariant.Default,
    icon: (@Composable () -> Unit)? = null,
    opacity: Float = 1f,
    accessibilityLabel: String? = null,
    content: @Composable RowScope.() -> Unit,
) {
    val theme = LocalLaneShadowTheme.current
    val resolvedOpacity = opacity.coerceIn(0f, 1f)
    val colors = themeBadgeColors(variant = variant, opacity = resolvedOpacity)
    val shape = RoundedCornerShape(theme.radius.full)

    Row(
        modifier =
            modifier
                .defaultMinSize(minHeight = theme.space.lg + theme.space.xs)
                .clip(shape)
                .background(colors.containerColor, shape)
                .then(
                    if (colors.borderColor != null) {
                        Modifier.border(width = 1.dp, color = colors.borderColor, shape = shape)
                    } else {
                        Modifier
                    },
                )
                .padding(horizontal = 10.dp, vertical = 2.dp)
                .then(
                    if (accessibilityLabel != null) {
                        Modifier.semantics { contentDescription = accessibilityLabel }
                    } else {
                        Modifier
                    },
                ),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
    ) {
        if (icon != null) {
            icon()
        }
        Row(
            verticalAlignment = Alignment.CenterVertically,
            content = content,
        )
    }
}

@Composable
fun Badge(
    modifier: Modifier = Modifier,
    variant: BadgeVariant = BadgeVariant.Default,
    icon: (@Composable () -> Unit)? = null,
    opacity: Float = 1f,
    accessibilityLabel: String? = null,
    content: @Composable RowScope.() -> Unit,
) = ThemeBadge(
    modifier = modifier,
    variant = variant,
    icon = icon,
    opacity = opacity,
    accessibilityLabel = accessibilityLabel,
    content = content,
)

enum class BadgeVariant {
    Default,
    Secondary,
    Destructive,
    Outline,
    Success,
    Warning,
    Info,
}

data class ThemeBadgeResolvedColors(
    val containerColor: Color,
    val contentColor: Color,
    val borderColor: Color? = null,
)

@Composable
internal fun themeBadgeColors(
    variant: BadgeVariant,
    opacity: Float = 1f,
): ThemeBadgeResolvedColors {
    val theme = LocalLaneShadowTheme.current
    val resolvedOpacity = opacity.coerceIn(0f, 1f)

    return when (variant) {
        BadgeVariant.Secondary ->
            ThemeBadgeResolvedColors(
                containerColor = theme.colors.secondary.default.copy(alpha = resolvedOpacity),
                contentColor = theme.colors.onSecondary.default,
            )
        BadgeVariant.Destructive ->
            ThemeBadgeResolvedColors(
                containerColor = theme.colors.danger.default.copy(alpha = resolvedOpacity),
                contentColor = theme.colors.onPrimary.default,
            )
        BadgeVariant.Outline ->
            ThemeBadgeResolvedColors(
                containerColor = Color.Transparent,
                contentColor = theme.colors.onSurface.default,
                borderColor = theme.colors.border.default,
            )
        BadgeVariant.Success ->
            ThemeBadgeResolvedColors(
                containerColor = theme.colors.success.default.copy(alpha = resolvedOpacity),
                contentColor = theme.colors.onPrimary.default,
            )
        BadgeVariant.Warning ->
            ThemeBadgeResolvedColors(
                containerColor = theme.colors.warning.default.copy(alpha = resolvedOpacity),
                contentColor = theme.colors.onPrimary.default,
            )
        BadgeVariant.Info ->
            ThemeBadgeResolvedColors(
                containerColor = theme.colors.info.default.copy(alpha = resolvedOpacity),
                contentColor = theme.colors.onPrimary.default,
            )
        BadgeVariant.Default ->
            ThemeBadgeResolvedColors(
                containerColor = theme.colors.primary.default.copy(alpha = resolvedOpacity),
                contentColor = theme.colors.onPrimary.default,
            )
    }
}
