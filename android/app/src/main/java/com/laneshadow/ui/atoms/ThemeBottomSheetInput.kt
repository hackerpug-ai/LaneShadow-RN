package com.laneshadow.ui.atoms

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
fun ThemeBottomSheetInput(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    placeholder: String = "",
    enabled: Boolean = true,
    isError: Boolean = false,
    leftIconName: String? = null,
    rightIconName: String? = null,
) {
    ThemeInput(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier,
        label = label,
        placeholder = placeholder,
        enabled = enabled,
        isError = isError,
        leftIconName = leftIconName,
        rightIconName = rightIconName,
    )
}
