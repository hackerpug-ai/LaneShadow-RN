package com.laneshadow.ui.atoms

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun ThemeToggle(
    pressed: Boolean,
    onPressedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    variant: ThemeToggleVariant = ThemeToggleVariant.Default,
    size: ThemeToggleSize = ThemeToggleSize.Md,
    enabled: Boolean = true,
    iconName: String? = null,
    label: String,
) {
    val theme = LocalLaneShadowTheme.current
    val border = if (variant == ThemeToggleVariant.Outline) BorderStroke(1.dp, theme.colors.border.default) else null

    Surface(
        modifier =
            modifier.clickable(enabled = enabled) {
                onPressedChange(!pressed)
            },
        shape = RoundedCornerShape(theme.radius.md),
        color =
            when {
                !enabled -> theme.colors.muted.disabled ?: theme.colors.muted.default
                pressed -> theme.colors.accent.default
                else -> theme.colors.background.default
            },
        border = border,
        tonalElevation = if (pressed) 1.dp else 0.dp,
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = theme.space.md, vertical = toggleVerticalPadding(theme, size)),
        ) {
            if (iconName != null) {
                IconSymbol(
                    name = iconName,
                    color = if (pressed) theme.colors.onSurface.default else theme.colors.muted.default,
                    size = 18.dp,
                )
            }
            ThemedText(
                text = label,
                variant = ThemedTextVariant.LabelMd,
                color = if (pressed) theme.colors.onSurface.default else theme.colors.muted.default,
            )
        }
    }
}

enum class ThemeToggleVariant {
    Default,
    Outline,
}

enum class ThemeToggleSize {
    Sm,
    Md,
    Lg,
}

@Composable
private fun toggleVerticalPadding(
    theme: com.laneshadow.theme.LaneShadowThemeValues,
    size: ThemeToggleSize,
) = when (size) {
    ThemeToggleSize.Sm -> theme.space.sm
    ThemeToggleSize.Lg -> theme.space.md
    ThemeToggleSize.Md -> theme.space.sm
}
