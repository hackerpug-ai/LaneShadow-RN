package com.laneshadow.ui.molecules

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.VisualTransformation
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.InputState
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.LSTextField
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.TypographyVariant

/**
 * LSFormField molecule component
 *
 * Form field molecule composing LSText label, LSTextField atom, and optional error text.
 * Follows the design spec at .spec/design/system/molecules/form-field/
 *
 * @param label Field label text
 * @param value Current input value
 * @param onValueChange Callback when input value changes
 * @param error Optional error message (non-null shows error state)
 * @param placeholder Optional placeholder text
 * @param modifier Modifier for the form field container
 */
@Composable
fun LSFormField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    error: String? = null,
    helper: String? = null,
    placeholder: String? = null,
    state: InputState = InputState.Default,
    leadingIcon: IconName? = null,
    trailingIcon: IconName? = null,
    enabled: Boolean = true,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    inputModifier: Modifier = Modifier,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = modifier,
        verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(theme.space.sm),
    ) {
        // Label
        LSText(
            text = label,
            variant = TypographyVariant.Ui.Label.Md,
            color = ContentColor.Primary,
        )

        // Input field with error state
        LSTextField(
            value = value,
            onValueChange = onValueChange,
            state = when {
                !enabled -> InputState.Disabled
                error != null -> InputState.Error
                else -> state
            },
            placeholder = placeholder,
            leadingIcon = leadingIcon,
            trailingIcon = trailingIcon,
            modifier = inputModifier,
            keyboardOptions = keyboardOptions,
            keyboardActions = keyboardActions,
            visualTransformation = visualTransformation,
        )

        // Error text (only when error is non-null)
        if (error != null) {
            LSText(
                text = error,
                variant = TypographyVariant.Ui.Body.Sm,
                color = ContentColor.Error,
            )
        } else if (helper != null) {
            LSText(
                text = helper,
                variant = TypographyVariant.Ui.Body.Sm,
                color = ContentColor.Subtle,
            )
        }
    }
}
