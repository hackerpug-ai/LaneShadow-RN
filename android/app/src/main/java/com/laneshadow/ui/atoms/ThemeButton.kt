package com.laneshadow.ui.atoms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.BorderStroke
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun ThemeButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ThemeButtonVariant = ThemeButtonVariant.Default,
    size: ThemeButtonSize = ThemeButtonSize.Md,
    enabled: Boolean = true,
    loading: Boolean = false,
    iconName: String? = null,
    iconPosition: IconPosition = IconPosition.Left,
    accessibilityLabel: String? = null,
    content: @Composable RowScope.() -> Unit,
) {
    val theme = LocalLaneShadowTheme.current
    val colors = themeButtonColors(variant = variant, enabled = enabled)
    val shape = RoundedCornerShape(themeButtonRadius(theme = theme, size = size))
    val minHeight = themeButtonHeight(theme = theme, size = size)
    val isIconOnly = size == ThemeButtonSize.Icon
    val buttonModifier =
        modifier
            .defaultMinSize(minHeight = minHeight)
            .then(if (isIconOnly) Modifier.size(minHeight) else Modifier)

    val rowContent: @Composable RowScope.() -> Unit = {
        Row(
            horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
            verticalAlignment = Alignment.CenterVertically,
            modifier = if (isIconOnly) Modifier else Modifier.fillMaxWidth(),
        ) {
            if (loading) {
                ThemedText(text = "Loading…", variant = ThemedTextVariant.LabelMd, color = colors.contentColor)
            } else {
                if (iconName != null && iconPosition == IconPosition.Left) {
                    IconSymbol(name = iconName, size = 20.dp, color = colors.contentColor)
                }
                content()
                if (iconName != null && iconPosition == IconPosition.Right) {
                    IconSymbol(name = iconName, size = 20.dp, color = colors.contentColor)
                }
            }
        }
    }

    when (variant) {
        ThemeButtonVariant.Outline ->
            OutlinedButton(
                onClick = onClick,
                modifier = buttonModifier,
                enabled = enabled,
                shape = shape,
                colors =
                    ButtonDefaults.outlinedButtonColors(
                        containerColor = colors.containerColor,
                        contentColor = colors.contentColor,
                        disabledContainerColor = colors.containerColor,
                        disabledContentColor = colors.contentColor,
                    ),
                border = BorderStroke(1.dp, colors.borderColor ?: colors.contentColor),
                contentPadding = PaddingValues(horizontal = themeButtonHorizontalPadding(theme = theme, size = size)),
            ) { rowContent() }
        ThemeButtonVariant.Ghost,
        ThemeButtonVariant.Link,
            ->
            TextButton(
                onClick = onClick,
                modifier = buttonModifier,
                enabled = enabled,
                shape = shape,
                colors =
                    ButtonDefaults.textButtonColors(
                        containerColor = colors.containerColor,
                        contentColor = colors.contentColor,
                        disabledContainerColor = colors.containerColor,
                        disabledContentColor = colors.contentColor,
                    ),
                contentPadding = PaddingValues(horizontal = themeButtonHorizontalPadding(theme = theme, size = size)),
            ) { rowContent() }
        else ->
            Button(
                onClick = onClick,
                modifier = buttonModifier,
                enabled = enabled,
                shape = shape,
                colors =
                    ButtonDefaults.buttonColors(
                        containerColor = colors.containerColor,
                        contentColor = colors.contentColor,
                        disabledContainerColor = colors.containerColor,
                        disabledContentColor = colors.contentColor,
                    ),
                contentPadding = PaddingValues(horizontal = themeButtonHorizontalPadding(theme = theme, size = size)),
            ) { rowContent() }
    }
}

enum class ThemeButtonVariant {
    Default,
    Secondary,
    Outline,
    Ghost,
    Destructive,
    Link,
    Glass,
}

enum class ThemeButtonSize {
    Sm,
    Md,
    Lg,
    Xl,
    Xxl,
    Icon,
}

enum class IconPosition {
    Left,
    Right,
}

data class ThemeButtonResolvedColors(
    val containerColor: Color,
    val contentColor: Color,
    val borderColor: Color? = null,
)

@Composable
internal fun themeButtonHeight(theme: com.laneshadow.theme.LaneShadowThemeValues, size: ThemeButtonSize): Dp =
    when (size) {
        ThemeButtonSize.Sm -> theme.space.xl + theme.space.md
        ThemeButtonSize.Lg -> theme.space.xxl + theme.space.md
        ThemeButtonSize.Xl -> theme.space.xxxl
        ThemeButtonSize.Xxl -> theme.space.xxxxl - theme.space.sm
        ThemeButtonSize.Icon,
        ThemeButtonSize.Md,
            -> theme.space.xxl + theme.space.sm
    }

@Composable
internal fun themeButtonRadius(theme: com.laneshadow.theme.LaneShadowThemeValues, size: ThemeButtonSize): Dp =
    when (size) {
        ThemeButtonSize.Icon -> theme.radius.full
        ThemeButtonSize.Xl -> theme.radius.lg
        ThemeButtonSize.Xxl -> theme.radius.xl
        else -> theme.radius.md
    }

@Composable
internal fun themeButtonHorizontalPadding(theme: com.laneshadow.theme.LaneShadowThemeValues, size: ThemeButtonSize): Dp =
    when (size) {
        ThemeButtonSize.Sm -> theme.space.md
        ThemeButtonSize.Lg -> theme.space.xxl
        ThemeButtonSize.Xl,
        ThemeButtonSize.Xxl,
            -> theme.space.lg
        ThemeButtonSize.Icon -> 0.dp
        ThemeButtonSize.Md -> theme.space.lg
    }

@Composable
internal fun themeButtonColors(
    variant: ThemeButtonVariant,
    enabled: Boolean,
): ThemeButtonResolvedColors {
    val theme = LocalLaneShadowTheme.current

    if (!enabled) {
        return when (variant) {
            ThemeButtonVariant.Secondary ->
                ThemeButtonResolvedColors(
                    containerColor = theme.colors.secondary.disabled ?: theme.colors.secondary.default,
                    contentColor = theme.colors.onSecondary.default,
                )
            ThemeButtonVariant.Outline ->
                ThemeButtonResolvedColors(
                    containerColor = theme.colors.background.default,
                    contentColor = theme.colors.onSurface.disabled ?: theme.colors.onSurface.default,
                    borderColor = theme.colors.border.default,
                )
            ThemeButtonVariant.Ghost,
            ThemeButtonVariant.Link,
                ->
                ThemeButtonResolvedColors(
                    containerColor = Color.Transparent,
                    contentColor = theme.colors.onSurface.disabled ?: theme.colors.onSurface.default,
                )
            ThemeButtonVariant.Destructive ->
                ThemeButtonResolvedColors(
                    containerColor = theme.colors.danger.disabled ?: theme.colors.danger.default,
                    contentColor = theme.colors.onPrimary.default,
                )
            ThemeButtonVariant.Glass ->
                ThemeButtonResolvedColors(
                    containerColor = theme.colors.surfaceVariant.disabled ?: theme.colors.surfaceVariant.default,
                    contentColor = theme.colors.onSurface.disabled ?: theme.colors.onSurface.default,
                    borderColor = theme.colors.border.default,
                )
            ThemeButtonVariant.Default ->
                ThemeButtonResolvedColors(
                    containerColor = theme.colors.primary.disabled ?: theme.colors.primary.default,
                    contentColor = theme.colors.onPrimary.default,
                )
        }
    }

    return when (variant) {
        ThemeButtonVariant.Secondary ->
            ThemeButtonResolvedColors(
                containerColor = theme.colors.secondary.default,
                contentColor = theme.colors.onSecondary.default,
            )
        ThemeButtonVariant.Outline ->
            ThemeButtonResolvedColors(
                containerColor = theme.colors.background.default,
                contentColor = theme.colors.onSurface.default,
                borderColor = theme.colors.border.default,
            )
        ThemeButtonVariant.Ghost ->
            ThemeButtonResolvedColors(
                containerColor = Color.Transparent,
                contentColor = theme.colors.onSurface.default,
            )
        ThemeButtonVariant.Link ->
            ThemeButtonResolvedColors(
                containerColor = Color.Transparent,
                contentColor = theme.colors.primary.default,
            )
        ThemeButtonVariant.Destructive ->
            ThemeButtonResolvedColors(
                containerColor = theme.colors.danger.default,
                contentColor = theme.colors.onPrimary.default,
            )
        ThemeButtonVariant.Glass ->
            ThemeButtonResolvedColors(
                containerColor = theme.colors.surfaceVariant.default,
                contentColor = theme.colors.onSurface.default,
                borderColor = theme.colors.border.default,
            )
        ThemeButtonVariant.Default ->
            ThemeButtonResolvedColors(
                containerColor = theme.colors.primary.default,
                contentColor = theme.colors.onPrimary.default,
            )
    }
}
