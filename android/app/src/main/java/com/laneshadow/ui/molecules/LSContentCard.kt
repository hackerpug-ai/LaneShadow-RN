package com.laneshadow.ui.molecules

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.LSCard
import com.laneshadow.ui.atoms.LSDivider
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.atoms.LSText as LSLabel

@Immutable
data class LSContentCardStyle(
    val cardBackgroundColor: Color,
    val cardBorderColor: Color,
    val titleColor: Color,
    val subtitleColor: Color,
    val actionsBackgroundColor: Color,
)

fun resolveLSContentCardStyle(theme: LaneShadowThemeValues): LSContentCardStyle =
    LSContentCardStyle(
        cardBackgroundColor = theme.colors.card.default,
        cardBorderColor = theme.colors.border.default,
        titleColor = theme.content.primary,
        subtitleColor = theme.content.secondary,
        actionsBackgroundColor = theme.colors.surfaceVariant.default,
    )

@Composable
fun LSContentCard(
    title: String,
    subtitle: String? = null,
    header: (@Composable () -> Unit)? = null,
    actions: (@Composable () -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val style = resolveLSContentCardStyle(theme)
    val borderWidth: Dp = GeneratedTokens.sizing.stroke.sm

    LSCard(
        modifier = modifier,
        backgroundColor = style.cardBackgroundColor,
        cornerRadius = theme.radius.lg,
        shadowElevation = theme.elevation.light.level2,
        contentPadding = theme.space.lg,
        border = BorderStroke(borderWidth, style.cardBorderColor),
    ) {
        Column {
            header?.let { headerContent ->
                headerContent()
            }

            Column(
                verticalArrangement = Arrangement.spacedBy(theme.space.xs),
            ) {
                LSLabel(
                    text = title,
                    variant = TypographyVariant.Ui.Title.Md,
                    color = ContentColor.Primary,
                )
                subtitle?.let {
                    LSLabel(
                        text = it,
                        variant = TypographyVariant.Ui.Body.Md,
                        color = ContentColor.Secondary,
                    )
                }
            }

            actions?.let { actionsContent ->
                LSDivider()
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(style.actionsBackgroundColor)
                        .padding(horizontal = theme.space.lg, vertical = theme.space.md),
                    horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
                ) {
                    actionsContent()
                }
            }
        }
    }
}
