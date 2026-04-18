package com.laneshadow.ui.atoms

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun ThemeCard(
    modifier: Modifier = Modifier,
    variant: CardVariant = CardVariant.Default,
    onClick: (() -> Unit)? = null,
    enabled: Boolean = true,
    showBorder: Boolean = true,
    accessibilityLabel: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val theme = LocalLaneShadowTheme.current
    val shape = RoundedCornerShape(theme.radius.lg)
    val colors = themeCardColors(variant = variant, enabled = enabled)
    val interactiveModifier =
        if (onClick != null) {
            Modifier.clickable(enabled = enabled, onClick = onClick)
        } else {
            Modifier
        }

    Surface(
        modifier =
            modifier
                .fillMaxWidth()
                .then(interactiveModifier)
                .then(
                    if (accessibilityLabel != null) {
                        Modifier.semantics { contentDescription = accessibilityLabel }
                    } else {
                        Modifier
                    },
                ),
        shape = shape,
        color = colors.containerColor,
        contentColor = colors.contentColor,
        border = if (showBorder) BorderStroke(1.dp, colors.borderColor) else null,
        shadowElevation = colors.shadowElevation,
    ) {
        Column(
            modifier = Modifier.padding(theme.space.lg),
            verticalArrangement = Arrangement.spacedBy(theme.space.md),
            content = content,
        )
    }
}

@Composable
fun Card(
    modifier: Modifier = Modifier,
    variant: CardVariant = CardVariant.Default,
    onClick: (() -> Unit)? = null,
    enabled: Boolean = true,
    showBorder: Boolean = true,
    accessibilityLabel: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) = ThemeCard(
    modifier = modifier,
    variant = variant,
    onClick = onClick,
    enabled = enabled,
    showBorder = showBorder,
    accessibilityLabel = accessibilityLabel,
    content = content,
)

@Composable
fun ThemeCardHeader(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(theme.space.xs),
        content = content,
    )
}

@Composable
fun CardHeader(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) = ThemeCardHeader(modifier = modifier, content = content)

@Composable
fun ThemeCardContent(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(theme.space.sm),
        content = content,
    )
}

@Composable
fun CardContent(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) = ThemeCardContent(modifier = modifier, content = content)

@Composable
fun ThemeCardTitle(
    text: String,
    modifier: Modifier = Modifier,
    variant: CardVariant = CardVariant.Default,
) {
    val colors = themeCardColors(variant = variant, enabled = true)

    ThemedText(
        text = text,
        modifier = modifier,
        variant = ThemedTextVariant.TitleMd,
        color = colors.contentColor,
    )
}

@Composable
fun CardTitle(
    text: String,
    modifier: Modifier = Modifier,
    variant: CardVariant = CardVariant.Default,
) = ThemeCardTitle(text = text, modifier = modifier, variant = variant)

@Composable
fun ThemeCardDescription(
    text: String,
    modifier: Modifier = Modifier,
    variant: CardVariant = CardVariant.Default,
) {
    val colors = themeCardColors(variant = variant, enabled = true)

    ThemedText(
        text = text,
        modifier = modifier,
        variant = ThemedTextVariant.BodySm,
        color = colors.mutedContentColor,
    )
}

@Composable
fun CardDescription(
    text: String,
    modifier: Modifier = Modifier,
    variant: CardVariant = CardVariant.Default,
) = ThemeCardDescription(text = text, modifier = modifier, variant = variant)

enum class CardVariant {
    Default,
    Primary,
    Success,
    Warning,
    Danger,
}

data class ThemeCardResolvedColors(
    val containerColor: Color,
    val contentColor: Color,
    val mutedContentColor: Color,
    val borderColor: Color,
    val shadowElevation: androidx.compose.ui.unit.Dp,
)

@Composable
internal fun themeCardColors(
    variant: CardVariant,
    enabled: Boolean,
): ThemeCardResolvedColors {
    val theme = LocalLaneShadowTheme.current
    val containerColor =
        when {
            !enabled -> theme.colors.card.disabled ?: theme.colors.card.default
            variant == CardVariant.Primary -> theme.colors.primary.default
            variant == CardVariant.Success -> theme.colors.success.default
            variant == CardVariant.Warning -> theme.colors.warningContainer.default
            variant == CardVariant.Danger -> theme.colors.danger.default
            else -> theme.colors.card.default
        }

    val contentColor =
        when (variant) {
            CardVariant.Primary,
            CardVariant.Success,
            CardVariant.Danger,
                -> theme.colors.onPrimary.default
            CardVariant.Warning -> theme.colors.onWarningContainer.default
            CardVariant.Default -> theme.colors.onSurface.default
        }

    val mutedContentColor =
        when (variant) {
            CardVariant.Primary,
            CardVariant.Success,
            CardVariant.Danger,
                -> theme.colors.onPrimary.default.copy(alpha = 0.8f)
            CardVariant.Warning -> theme.colors.onWarningContainer.default.copy(alpha = 0.8f)
            CardVariant.Default -> theme.colors.onSurface.default.copy(alpha = 0.72f)
        }

    return ThemeCardResolvedColors(
        containerColor = containerColor,
        contentColor = contentColor,
        mutedContentColor = mutedContentColor,
        borderColor = theme.colors.border.default,
        shadowElevation = if (variant == CardVariant.Default) 2.dp else 3.dp,
    )
}
