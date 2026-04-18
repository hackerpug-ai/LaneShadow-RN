package com.laneshadow.ui.atoms

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
fun ThemeTextarea(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    enabled: Boolean = true,
    isError: Boolean = false,
) {
    ThemeInput(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier,
        placeholder = placeholder,
        enabled = enabled,
        isError = isError,
        singleLine = false,
        minLines = 4,
        maxLines = 6,
    )
}
