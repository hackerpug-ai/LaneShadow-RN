package com.laneshadow.ui.atoms

import androidx.compose.foundation.layout.RowScope
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    iconName: String? = null,
    loading: Boolean = false,
    enabled: Boolean = true,
) {
    ThemeButton(
        onClick = onClick,
        modifier = modifier,
        variant = ThemeButtonVariant.Default,
        size = ThemeButtonSize.Xxl,
        enabled = enabled,
        loading = loading,
        iconName = iconName,
    ) {
        PrimaryButtonLabel(text)
    }
}

@Composable
private fun RowScope.PrimaryButtonLabel(text: String) {
    ThemedText(text = text, variant = ThemedTextVariant.LabelLg)
}
