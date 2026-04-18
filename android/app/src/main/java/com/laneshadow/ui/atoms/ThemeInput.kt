package com.laneshadow.ui.atoms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.foundation.shape.RoundedCornerShape
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun ThemeInput(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    placeholder: String = "",
    enabled: Boolean = true,
    isError: Boolean = false,
    leftIconName: String? = null,
    rightIconName: String? = null,
    singleLine: Boolean = true,
    minLines: Int = 1,
    maxLines: Int = if (singleLine) 1 else Int.MAX_VALUE,
    visualTransformation: VisualTransformation = VisualTransformation.None,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(theme.space.xs),
    ) {
        if (label != null) {
            ThemedText(
                text = label,
                variant = ThemedTextVariant.LabelSm,
                color = theme.colors.muted.default,
            )
        }

        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            enabled = enabled,
            isError = isError,
            singleLine = singleLine,
            minLines = minLines,
            maxLines = maxLines,
            visualTransformation = visualTransformation,
            shape = RoundedCornerShape(theme.radius.xl),
            placeholder = {
                if (placeholder.isNotBlank()) {
                    Text(text = placeholder)
                }
            },
            leadingIcon = {
                if (leftIconName != null) {
                    IconSymbol(name = leftIconName, color = iconTint(isError = isError, enabled = enabled))
                }
            },
            trailingIcon = {
                if (rightIconName != null) {
                    IconSymbol(name = rightIconName, color = iconTint(isError = isError, enabled = enabled))
                }
            },
            colors =
                OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = theme.colors.surface.default,
                    unfocusedContainerColor = theme.colors.surface.default,
                    disabledContainerColor = theme.colors.surface.default,
                    errorContainerColor = theme.colors.surface.default,
                    focusedBorderColor = if (isError) theme.colors.danger.default else theme.colors.primary.default,
                    unfocusedBorderColor = if (isError) theme.colors.danger.default else theme.colors.border.default,
                    disabledBorderColor = theme.colors.border.default,
                    errorBorderColor = theme.colors.danger.default,
                    focusedTextColor = theme.colors.onSurface.default,
                    unfocusedTextColor = theme.colors.onSurface.default,
                    disabledTextColor = theme.colors.onSurface.disabled ?: theme.colors.onSurface.default,
                    errorTextColor = theme.colors.onSurface.default,
                    cursorColor = theme.colors.primary.default,
                    focusedPlaceholderColor = theme.colors.muted.default,
                    unfocusedPlaceholderColor = theme.colors.muted.default,
                    disabledPlaceholderColor = theme.colors.muted.default,
                    errorPlaceholderColor = theme.colors.muted.default,
                ),
        )
    }
}

@Composable
private fun iconTint(isError: Boolean, enabled: Boolean) =
    with(LocalLaneShadowTheme.current) {
        when {
            isError -> colors.danger.default
            !enabled -> colors.onSurface.disabled ?: colors.onSurface.default
            else -> colors.muted.default
        }
    }
