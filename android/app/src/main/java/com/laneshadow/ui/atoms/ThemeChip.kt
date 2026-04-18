package com.laneshadow.ui.atoms

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun ThemeChip(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    selected: Boolean = false,
    enabled: Boolean = true,
    iconName: String? = null,
    accessibilityLabel: String? = null,
) {
    val theme = LocalLaneShadowTheme.current
    val colors = themeChipColors(selected = selected, enabled = enabled)

    Surface(
        modifier =
            modifier
                .clickable(enabled = enabled, onClick = onClick)
                .then(
                    if (accessibilityLabel != null) {
                        Modifier.semantics { contentDescription = accessibilityLabel }
                    } else {
                        Modifier
                    },
                ),
        shape = RoundedCornerShape(theme.radius.full),
        color = colors.containerColor,
        contentColor = colors.contentColor,
        border = BorderStroke(1.dp, colors.borderColor),
    ) {
        Row(
            modifier =
                Modifier
                    .defaultMinSize(minHeight = theme.space.xxl)
                    .padding(horizontal = theme.space.md, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (iconName != null) {
                IconSymbol(name = iconName, size = 16.dp, color = colors.iconColor)
            }
            ThemedText(
                text = label,
                variant = ThemedTextVariant.LabelSm,
                color = colors.contentColor,
            )
        }
    }
}

@Composable
fun Chip(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    selected: Boolean = false,
    enabled: Boolean = true,
    iconName: String? = null,
    accessibilityLabel: String? = null,
) = ThemeChip(
    label = label,
    onClick = onClick,
    modifier = modifier,
    selected = selected,
    enabled = enabled,
    iconName = iconName,
    accessibilityLabel = accessibilityLabel,
)

data class ThemeChipResolvedColors(
    val containerColor: androidx.compose.ui.graphics.Color,
    val borderColor: androidx.compose.ui.graphics.Color,
    val contentColor: androidx.compose.ui.graphics.Color,
    val iconColor: androidx.compose.ui.graphics.Color,
)

@Composable
internal fun themeChipColors(
    selected: Boolean,
    enabled: Boolean,
): ThemeChipResolvedColors {
    val theme = LocalLaneShadowTheme.current
    val contentColor =
        when {
            !enabled -> theme.colors.onSurface.disabled ?: theme.colors.onSurface.default
            selected -> theme.colors.primary.default
            else -> theme.colors.onSurface.default
        }

    return ThemeChipResolvedColors(
        containerColor =
            when {
                !enabled -> theme.colors.muted.disabled ?: theme.colors.muted.default
                selected -> theme.colors.primary.default.copy(alpha = 0.12f)
                else -> androidx.compose.ui.graphics.Color.Transparent
            },
        borderColor =
            when {
                selected -> theme.colors.primary.default.copy(alpha = 0.4f)
                else -> theme.colors.border.default
            },
        contentColor = contentColor,
        iconColor =
            if (selected) {
                theme.colors.primary.default
            } else {
                theme.colors.muted.default
            },
    )
}
